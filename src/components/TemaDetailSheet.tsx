// Drilldown: panel lateral con evolución temporal del sentimiento de un tema/hashtag
// y menciones específicas. Permite además generar un Rapid Response sobre ese tema.
import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Loader2, Sparkles, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { RapidResponseDialog, type RapidResponseInput } from "@/components/RapidResponseDialog";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** "tema" o "hashtag" (sin #) que se está explorando */
  query: string | null;
  tipo: "tema" | "hashtag";
  scope: "estatal" | "candidatos";
}

interface MencionDetalle {
  id: string;
  titulo: string;
  fragmento: string | null;
  url: string | null;
  fuente: string | null;
  sentimiento: number;
  entidad_nombre: string;
  publicada_en: string | null;
  detectada_en: string;
}

interface PuntoSparkline {
  batch_id: string;
  ejecutada_en: string;
  sentimiento_promedio: number;
  total: number;
}

export function TemaDetailSheet({ open, onOpenChange, query, tipo, scope }: Props) {
  const [loading, setLoading] = useState(false);
  const [menciones, setMenciones] = useState<MencionDetalle[]>([]);
  const [historico, setHistorico] = useState<PuntoSparkline[]>([]);
  const [rrOpen, setRrOpen] = useState(false);
  const [rrInput, setRrInput] = useState<RapidResponseInput | null>(null);

  useEffect(() => {
    if (!open || !query) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const tipos: ("estatal" | "candidato_propio" | "rival")[] =
          scope === "estatal" ? ["estatal"] : ["candidato_propio", "rival"];

        // 1. Últimos 8 runs ok con datos
        const { data: runs } = await supabase
          .from("social_runs")
          .select("batch_id, ejecutada_en")
          .is("error", null)
          .gt("total_menciones", 0)
          .order("ejecutada_en", { ascending: false })
          .limit(8);

        if (!runs?.length) {
          if (!cancelled) {
            setMenciones([]);
            setHistorico([]);
          }
          return;
        }

        const batchIds = runs.map(r => r.batch_id);

        // 2. Cargar todas las menciones de esos batches que matcheen el query
        let q = supabase
          .from("social_menciones")
          .select("id, titulo, fragmento, url, fuente, sentimiento, entidad_nombre, entidad_tipo, publicada_en, detectada_en, batch_id, tema, hashtags")
          .in("batch_id", batchIds)
          .in("entidad_tipo", tipos);

        if (tipo === "tema") {
          q = q.ilike("tema", `%${query}%`);
        } else {
          q = q.contains("hashtags", [query.toLowerCase().replace(/^#/, "")]);
        }

        const { data: rows } = await q.order("detectada_en", { ascending: false }).limit(150);
        const all = (rows ?? []) as (MencionDetalle & { batch_id: string })[];

        // 3. Sparkline: agregar por batch
        const byBatch = new Map<string, { sum: number; n: number }>();
        for (const m of all) {
          const slot = byBatch.get(m.batch_id) ?? { sum: 0, n: 0 };
          slot.sum += Number(m.sentimiento ?? 0);
          slot.n += 1;
          byBatch.set(m.batch_id, slot);
        }
        const hist = runs
          .map(r => {
            const slot = byBatch.get(r.batch_id);
            if (!slot) return null;
            return {
              batch_id: r.batch_id,
              ejecutada_en: r.ejecutada_en,
              sentimiento_promedio: +(slot.sum / slot.n).toFixed(2),
              total: slot.n,
            } as PuntoSparkline;
          })
          .filter((x): x is PuntoSparkline => !!x)
          .reverse();

        // 4. Menciones del batch más reciente para el feed
        const latestBatch = runs[0].batch_id;
        const feed = all.filter(m => m.batch_id === latestBatch).slice(0, 25);

        if (!cancelled) {
          setHistorico(hist);
          setMenciones(feed);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [open, query, tipo, scope]);

  const openRapid = () => {
    if (!query) return;
    setRrInput({
      tipo: "mencion",
      titulo: `${tipo === "hashtag" ? "#" : ""}${query}`,
      fragmento: `Tema/etiqueta detectada en ${menciones.length} menciones recientes. Construye una respuesta posicionando al candidato sobre este tema.`,
      fuente: "Social Listening · Drilldown",
      url: null,
      distrito_o_entidad: scope === "estatal" ? "Michoacán · Estatal" : "Candidatos",
      sentimiento: historico[historico.length - 1]?.sentimiento_promedio ?? 0,
    });
    setRrOpen(true);
  };

  const sentColor = (s: number) =>
    s > 0.2 ? "text-emerald-400" : s < -0.2 ? "text-red-400" : "text-slate-300";
  const sentIcon = (s: number) =>
    s > 0.2 ? TrendingUp : s < -0.2 ? TrendingDown : Minus;

  // Sparkline SVG
  const renderSparkline = () => {
    if (historico.length < 2) return null;
    const W = 280, H = 60, P = 6;
    const xs = historico.map((_, i) => P + (i * (W - 2 * P)) / (historico.length - 1));
    const ys = historico.map(p => {
      const norm = (p.sentimiento_promedio + 1) / 2; // -1..1 -> 0..1
      return H - P - norm * (H - 2 * P);
    });
    const path = xs.map((x, i) => `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${ys[i].toFixed(1)}`).join(" ");
    const zeroY = H - P - 0.5 * (H - 2 * P);
    const lastSent = historico[historico.length - 1].sentimiento_promedio;
    const stroke = lastSent > 0.2 ? "hsl(160 70% 55%)" : lastSent < -0.2 ? "hsl(0 75% 60%)" : "hsl(220 10% 70%)";
    return (
      <div className="space-y-1">
        <div className="text-[10px] font-mono uppercase text-muted-foreground tracking-widest">Evolución del sentimiento ({historico.length} runs)</div>
        <svg width={W} height={H} className="block">
          <line x1={P} y1={zeroY} x2={W - P} y2={zeroY} stroke="hsl(var(--border))" strokeDasharray="2 3" />
          <path d={path} fill="none" stroke={stroke} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          {xs.map((x, i) => (
            <circle key={i} cx={x} cy={ys[i]} r={2.5} fill={stroke}>
              <title>{`${historico[i].sentimiento_promedio.toFixed(2)} · ${historico[i].total} menciones · ${new Date(historico[i].ejecutada_en).toLocaleDateString("es-MX")}`}</title>
            </circle>
          ))}
        </svg>
        <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground">
          <span>{new Date(historico[0].ejecutada_en).toLocaleDateString("es-MX", { day: "2-digit", month: "short" })}</span>
          <span>Actual: <span className={sentColor(lastSent) + " font-bold"}>{lastSent.toFixed(2)}</span></span>
          <span>{new Date(historico[historico.length - 1].ejecutada_en).toLocaleDateString("es-MX", { day: "2-digit", month: "short" })}</span>
        </div>
      </div>
    );
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              {tipo === "hashtag" && <span className="text-primary">#</span>}
              {query}
              <Badge variant="outline" className="text-[9px] uppercase">{tipo}</Badge>
            </SheetTitle>
            <SheetDescription>
              Drilldown sobre {scope === "estatal" ? "conversación estatal" : "menciones de candidatos"} en los últimos runs monitoreados.
            </SheetDescription>
          </SheetHeader>

          <div className="mt-4 space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin mr-2" /> Cargando histórico…
              </div>
            ) : (
              <>
                {historico.length >= 2 ? (
                  renderSparkline()
                ) : (
                  <p className="text-xs text-muted-foreground italic">Se necesitan al menos 2 runs con datos para graficar evolución.</p>
                )}

                <Button onClick={openRapid} size="sm" className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90" disabled={menciones.length === 0}>
                  <Sparkles className="w-3.5 h-3.5" />
                  Generar Rapid Response sobre este tema
                </Button>

                <div className="space-y-2">
                  <div className="text-[10px] font-mono uppercase text-muted-foreground tracking-widest">
                    Menciones del batch actual ({menciones.length})
                  </div>
                  {menciones.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">Sin menciones para este {tipo} en el batch más reciente.</p>
                  ) : (
                    menciones.map((m) => {
                      const Ic = sentIcon(m.sentimiento);
                      return (
                        <article key={m.id} className="p-2.5 rounded-md border border-border/60 bg-card/40 space-y-1">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-xs font-medium text-foreground leading-snug">{m.titulo}</h4>
                            <span className={`shrink-0 inline-flex items-center gap-1 text-[10px] font-mono font-bold ${sentColor(m.sentimiento)}`}>
                              <Ic className="w-3 h-3" />{m.sentimiento.toFixed(2)}
                            </span>
                          </div>
                          {m.fragmento && <p className="text-[11px] text-muted-foreground line-clamp-2">{m.fragmento}</p>}
                          <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground/80 flex-wrap">
                            <Badge variant="outline" className="text-[9px]">{m.entidad_nombre}</Badge>
                            {m.fuente && <span>· {m.fuente}</span>}
                            {m.url && (
                              <a href={m.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-0.5">
                                <ExternalLink className="w-2.5 h-2.5" />Fuente
                              </a>
                            )}
                          </div>
                        </article>
                      );
                    })
                  )}
                </div>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>
      <RapidResponseDialog open={rrOpen} onOpenChange={setRrOpen} input={rrInput} />
    </>
  );
}

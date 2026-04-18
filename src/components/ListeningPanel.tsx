import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { TrendingUp, TrendingDown, Minus, RefreshCw, Loader2, Hash, Tag, ExternalLink, UserPlus, Flame, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DiscursoCiudadano } from "@/components/DiscursoCiudadano";

interface ResumenRow {
  id: string;
  batch_id: string;
  entidad_tipo: "estatal" | "candidato_propio" | "rival";
  entidad_nombre: string;
  candidato_id: string | null;
  total_menciones: number;
  sentimiento_promedio: number | null;
  pct_positivo: number | null;
  pct_neutro: number | null;
  pct_negativo: number | null;
  top_hashtags: { value: string; count: number }[];
  top_temas: { value: string; count: number }[];
  generado_en: string;
}

interface MencionRow {
  id: string;
  entidad_nombre: string;
  titulo: string;
  fragmento: string | null;
  url: string | null;
  fuente: string | null;
  sentimiento: number;
  tema: string | null;
  hashtags: string[];
  detectada_en: string;
}

interface RunMeta {
  batch_id: string;
  ejecutada_en: string;
  total_menciones: number;
  entidades_procesadas: number;
  duracion_ms: number | null;
  trigger: string;
  error: string | null;
}

// 5 niveles de sentimiento: muy_neg < -0.6, neg [-0.6,-0.2), neutro [-0.2,0.2], pos (0.2,0.6], muy_pos >0.6
type NivelSent = "muy_pos" | "pos" | "neutro" | "neg" | "muy_neg" | "na";

function nivelSentimiento(s: number | null): NivelSent {
  if (s === null || Number.isNaN(s)) return "na";
  if (s > 0.6) return "muy_pos";
  if (s > 0.2) return "pos";
  if (s >= -0.2) return "neutro";
  if (s >= -0.6) return "neg";
  return "muy_neg";
}

interface SentStyle {
  label: string;
  short: string;
  text: string;
  bg: string;
  border: string;
  bar: string;
  icon: typeof TrendingUp;
}

const SENT_STYLES: Record<NivelSent, SentStyle> = {
  muy_pos: { label: "Muy positivo", short: "++", text: "text-emerald-300", bg: "bg-emerald-500/15", border: "border-emerald-400/50", bar: "bg-emerald-400",   icon: Flame },
  pos:     { label: "Positivo",     short: "+",  text: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30", bar: "bg-emerald-500/80", icon: TrendingUp },
  neutro:  { label: "Neutro",       short: "○",  text: "text-slate-300",   bg: "bg-slate-500/10",   border: "border-slate-400/30",   bar: "bg-slate-400/70",   icon: Minus },
  neg:     { label: "Negativo",     short: "-",  text: "text-orange-400",  bg: "bg-orange-500/10",  border: "border-orange-500/30",  bar: "bg-orange-500/80",  icon: TrendingDown },
  muy_neg: { label: "Muy negativo", short: "--", text: "text-red-400",     bg: "bg-red-500/15",     border: "border-red-500/50",     bar: "bg-red-500",        icon: AlertTriangle },
  na:      { label: "Sin dato",     short: "—",  text: "text-muted-foreground", bg: "bg-muted/20",  border: "border-border",         bar: "bg-muted",          icon: Minus },
};

function styleFor(s: number | null): SentStyle {
  return SENT_STYLES[nivelSentimiento(s)];
}

function formatExact(iso: string): string {
  return new Date(iso).toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Mexico_City" });
}

interface ListeningPanelProps {
  scope: "estatal" | "candidatos";
}

export function ListeningPanel({ scope }: ListeningPanelProps) {
  const [resumenes, setResumenes] = useState<ResumenRow[]>([]);
  const [menciones, setMenciones] = useState<MencionRow[]>([]);
  const [lastRun, setLastRun] = useState<RunMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadLatest = useCallback(async () => {
    const { data: run } = await supabase
      .from("social_runs")
      .select("*")
      .is("error", null)
      .gt("total_menciones", 0)
      .order("ejecutada_en", { ascending: false })
      .limit(1)
      .maybeSingle();

    setLastRun(run as RunMeta | null);
    if (!run) {
      setResumenes([]);
      setMenciones([]);
      return;
    }

    const tipos: ("estatal" | "candidato_propio" | "rival")[] =
      scope === "estatal" ? ["estatal"] : ["candidato_propio", "rival"];

    const { data: resData } = await supabase
      .from("social_resumen")
      .select("*")
      .eq("batch_id", run.batch_id)
      .in("entidad_tipo", tipos);

    const { data: mensData } = await supabase
      .from("social_menciones")
      .select("*")
      .eq("batch_id", run.batch_id)
      .in("entidad_tipo", tipos)
      .order("detectada_en", { ascending: false })
      .limit(60);

    setResumenes((resData as ResumenRow[]) ?? []);
    setMenciones((mensData as MencionRow[]) ?? []);
  }, [scope]);

  useEffect(() => {
    loadLatest().finally(() => setLoading(false));
  }, [loadLatest]);

  useEffect(() => {
    const channel = supabase
      .channel("social-runs-changes")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "social_runs" }, () => loadLatest())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadLatest]);

  const handleRefresh = async () => {
    setRefreshing(true);
    const { data: { user } } = await supabase.auth.getUser();
    toast.info("Monitoreando social…", { description: "Buscando menciones y clasificando sentimiento (~1-3 min)" });
    try {
      const { data, error } = await supabase.functions.invoke("monitor-social", {
        body: { trigger: "manual", user_id: user?.id },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error ?? "Falló el monitor social");
      toast.success(`${data.total_menciones} menciones procesadas`, {
        description: `${data.entidades} entidades · ${data.candidatos_propios} propios · ${data.rivales?.length ?? 0} rivales`,
      });
      await loadLatest();
    } catch (err) {
      toast.error("Error al monitorear", { description: err instanceof Error ? err.message : "Error desconocido" });
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="executive-panel p-5">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 text-primary text-[10px] font-mono uppercase tracking-widest mb-1">
              <Hash className="w-3 h-3" />
              Social Listening · {scope === "estatal" ? "Sentimiento Estatal" : "Por Candidato"}
            </div>
            <h2 className="text-2xl font-bold text-foreground">
              {scope === "estatal" ? "Pulso de Michoacán" : "Sentimiento por Candidato"}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {resumenes.length > 0
                ? `${resumenes.length} entidades · Último: ${lastRun ? formatExact(lastRun.ejecutada_en) : "—"}`
                : scope === "candidatos"
                ? "Agrega candidatos propios en /candidatos y luego ejecuta el monitor."
                : "Sin datos. Ejecuta un monitoreo para comenzar."}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {scope === "candidatos" && (
              <Button asChild size="sm" variant="outline" className="gap-2">
                <Link to="/candidatos">
                  <UserPlus className="w-3.5 h-3.5" />
                  Gestionar candidatos
                </Link>
              </Button>
            )}
            <Button onClick={handleRefresh} disabled={refreshing} size="sm" className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
              {refreshing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              {refreshing ? "Monitoreando…" : "Actualizar ahora"}
            </Button>
          </div>
        </div>
        {lastRun && (
          <div className="mt-3 text-[10px] font-mono text-muted-foreground/80 flex flex-wrap gap-x-4 gap-y-1">
            <span>● Pipeline: Firecrawl + Lovable AI</span>
            {lastRun.duracion_ms && <span>· {(lastRun.duracion_ms / 1000).toFixed(1)}s</span>}
            <span>· {lastRun.entidades_procesadas} entidades · {lastRun.total_menciones} menciones</span>
          </div>
        )}
      </div>

      {scope === "estatal" && <DiscursoCiudadano />}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-48 w-full" />)}
        </div>
      ) : resumenes.length === 0 ? (
        <div className="executive-panel p-8 text-center text-sm text-muted-foreground">
          {scope === "candidatos"
            ? "No hay candidatos propios registrados o no se han generado menciones todavía."
            : "Pulsa «Actualizar ahora» para ejecutar el primer monitoreo."}
        </div>
      ) : (
        <>
          {/* Leyenda de niveles */}
          <div className="executive-panel px-3 py-2 flex items-center gap-3 flex-wrap text-[10px] font-mono">
            <span className="text-muted-foreground uppercase tracking-widest">Escala</span>
            {(["muy_pos", "pos", "neutro", "neg", "muy_neg"] as NivelSent[]).map((n) => {
              const st = SENT_STYLES[n];
              const Ic = st.icon;
              return (
                <span key={n} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border ${st.bg} ${st.border} ${st.text}`}>
                  <Ic className="w-3 h-3" />
                  {st.label}
                </span>
              );
            })}
          </div>

          {/* Cards de resumen por entidad */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {resumenes.map((r) => {
              const st = styleFor(r.sentimiento_promedio);
              const Icon = st.icon;
              const pPos = r.pct_positivo ?? 0;
              const pNeu = r.pct_neutro ?? 0;
              const pNeg = r.pct_negativo ?? 0;
              return (
                <article key={r.id} className={`executive-panel p-4 space-y-3 border-l-4 ${st.border}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-foreground truncate">{r.entidad_nombre}</h3>
                      <Badge variant="outline" className="text-[9px] mt-1">
                        {r.entidad_tipo === "candidato_propio" ? "Propio" : r.entidad_tipo === "rival" ? "Rival" : "Estatal"}
                      </Badge>
                    </div>
                    {/* Badge dominante de sentimiento */}
                    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md border ${st.bg} ${st.border} ${st.text}`}>
                      <Icon className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-bold uppercase tracking-wide">{st.label}</span>
                      <span className="text-[10px] font-mono opacity-70">
                        {r.sentimiento_promedio !== null ? r.sentimiento_promedio.toFixed(2) : "—"}
                      </span>
                    </div>
                  </div>

                  <div className="text-2xl font-bold text-foreground">
                    {r.total_menciones} <span className="text-xs font-normal text-muted-foreground">menciones</span>
                  </div>

                  {/* Barra apilada con etiquetas en cada segmento */}
                  <div className="space-y-1.5">
                    <div className="flex h-2.5 rounded-full overflow-hidden bg-muted/30 ring-1 ring-border">
                      <div className={SENT_STYLES.pos.bar} style={{ width: `${pPos}%` }} title={`Positivo ${pPos.toFixed(0)}%`} />
                      <div className={SENT_STYLES.neutro.bar} style={{ width: `${pNeu}%` }} title={`Neutro ${pNeu.toFixed(0)}%`} />
                      <div className={SENT_STYLES.neg.bar} style={{ width: `${pNeg}%` }} title={`Negativo ${pNeg.toFixed(0)}%`} />
                    </div>
                    <div className="grid grid-cols-3 gap-1 text-[10px] font-mono">
                      <span className={`flex items-center gap-1 ${SENT_STYLES.pos.text}`}>
                        <TrendingUp className="w-2.5 h-2.5" /> {pPos.toFixed(0)}% pos
                      </span>
                      <span className={`flex items-center gap-1 justify-center ${SENT_STYLES.neutro.text}`}>
                        <Minus className="w-2.5 h-2.5" /> {pNeu.toFixed(0)}% neu
                      </span>
                      <span className={`flex items-center gap-1 justify-end ${SENT_STYLES.neg.text}`}>
                        <TrendingDown className="w-2.5 h-2.5" /> {pNeg.toFixed(0)}% neg
                      </span>
                    </div>
                  </div>

                  {/* Top temas */}
                  {r.top_temas?.length > 0 && (
                    <div>
                      <div className="text-[9px] font-mono uppercase text-muted-foreground mb-1 flex items-center gap-1">
                        <Tag className="w-2.5 h-2.5" /> Temas
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {r.top_temas.slice(0, 4).map((t) => (
                          <Badge key={t.value} variant="secondary" className="text-[9px]">{t.value} · {t.count}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Top hashtags */}
                  {r.top_hashtags?.length > 0 && (
                    <div>
                      <div className="text-[9px] font-mono uppercase text-muted-foreground mb-1 flex items-center gap-1">
                        <Hash className="w-2.5 h-2.5" /> Hashtags
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {r.top_hashtags.slice(0, 4).map((h) => (
                          <span key={h.value} className="text-[10px] text-primary font-mono">#{h.value.replace(/^#/, "")}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>

          {/* Feed de menciones recientes */}
          {menciones.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-foreground mt-4 mb-2">Menciones recientes</h3>
              {menciones.slice(0, 20).map((m) => {
                const st = styleFor(m.sentimiento);
                const Icon = st.icon;
                return (
                  <article
                    key={m.id}
                    className={`executive-panel p-3 flex items-start gap-3 border-l-4 ${st.border}`}
                  >
                    <div className={`shrink-0 w-8 h-8 rounded-md flex items-center justify-center ${st.bg} ${st.text}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <h4 className="text-sm font-medium text-foreground leading-snug">{m.titulo}</h4>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Badge variant="outline" className="text-[9px]">{m.entidad_nombre}</Badge>
                          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] font-mono font-bold ${st.bg} ${st.border} ${st.text}`}>
                            {st.label}
                            <span className="opacity-70">{m.sentimiento.toFixed(2)}</span>
                          </span>
                        </div>
                      </div>
                      {m.fragmento && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{m.fragmento}</p>}
                      <div className="flex items-center gap-3 mt-2 text-[10px] font-mono text-muted-foreground/80 flex-wrap">
                        {m.tema && <span>· {m.tema}</span>}
                        {m.fuente && <span>· {m.fuente}</span>}
                        {m.url && (
                          <a href={m.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                            <ExternalLink className="w-2.5 h-2.5" />Fuente
                          </a>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

import { useEffect, useState, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { RefreshCw, Loader2, Shield, Swords, Hash, Tag, TrendingUp, TrendingDown, Minus, Flame, AlertTriangle, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ResumenRow {
  id: string;
  batch_id: string;
  entidad_tipo: "estatal" | "candidato_propio" | "rival";
  entidad_nombre: string;
  total_menciones: number;
  sentimiento_promedio: number | null;
  pct_positivo: number | null;
  pct_neutro: number | null;
  pct_negativo: number | null;
  top_hashtags: { value: string; count: number }[];
  top_temas: { value: string; count: number }[];
  generado_en: string;
}

type NivelSent = "muy_pos" | "pos" | "neutro" | "neg" | "muy_neg" | "na";

function nivel(s: number | null): NivelSent {
  if (s === null) return "na";
  if (s > 0.6) return "muy_pos";
  if (s > 0.2) return "pos";
  if (s >= -0.2) return "neutro";
  if (s >= -0.6) return "neg";
  return "muy_neg";
}

const SENT: Record<NivelSent, { label: string; text: string; bar: string; bg: string; border: string; icon: typeof TrendingUp }> = {
  muy_pos: { label: "Muy positivo", text: "text-emerald-300", bar: "bg-emerald-400", bg: "bg-emerald-500/15", border: "border-emerald-400/50", icon: Flame },
  pos:     { label: "Positivo",     text: "text-emerald-400", bar: "bg-emerald-500/80", bg: "bg-emerald-500/10", border: "border-emerald-500/30", icon: TrendingUp },
  neutro:  { label: "Neutro",       text: "text-slate-300",   bar: "bg-slate-400/70", bg: "bg-slate-500/10", border: "border-slate-400/30", icon: Minus },
  neg:     { label: "Negativo",     text: "text-orange-400",  bar: "bg-orange-500/80", bg: "bg-orange-500/10", border: "border-orange-500/30", icon: TrendingDown },
  muy_neg: { label: "Muy negativo", text: "text-red-400",     bar: "bg-red-500", bg: "bg-red-500/15", border: "border-red-500/50", icon: AlertTriangle },
  na:      { label: "Sin dato",     text: "text-muted-foreground", bar: "bg-muted", bg: "bg-muted/20", border: "border-border", icon: Minus },
};

export default function ComparadorPropioVsRival() {
  const [rows, setRows] = useState<ResumenRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [batchInfo, setBatchInfo] = useState<{ ejecutada_en: string } | null>(null);

  const load = useCallback(async () => {
    const { data: run } = await supabase
      .from("social_runs")
      .select("batch_id, ejecutada_en")
      .is("error", null)
      .gt("total_menciones", 0)
      .order("ejecutada_en", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!run) {
      setRows([]);
      setBatchInfo(null);
      return;
    }
    setBatchInfo({ ejecutada_en: run.ejecutada_en });

    const { data } = await supabase
      .from("social_resumen")
      .select("*")
      .eq("batch_id", run.batch_id)
      .in("entidad_tipo", ["candidato_propio", "rival"]);
    setRows(((data ?? []) as unknown) as ResumenRow[]);
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const handleRefresh = async () => {
    setRefreshing(true);
    const { data: { user } } = await supabase.auth.getUser();
    toast.info("Monitoreando…", { description: "Refrescando menciones de propios y rivales" });
    try {
      const { data, error } = await supabase.functions.invoke("monitor-social", {
        body: { trigger: "manual", user_id: user?.id },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error ?? "Falló el monitor");
      toast.success(`${data.total_menciones} menciones procesadas`);
      await load();
    } catch (err) {
      toast.error("Error", { description: err instanceof Error ? err.message : String(err) });
    } finally {
      setRefreshing(false);
    }
  };

  const propios = useMemo(() => rows.filter((r) => r.entidad_tipo === "candidato_propio"), [rows]);
  const rivales = useMemo(() => rows.filter((r) => r.entidad_tipo === "rival"), [rows]);

  const totalAll = useMemo(() => rows.reduce((s, r) => s + (r.total_menciones || 0), 0), [rows]);

  // Mejor propio (mayor sentimiento) y peor rival (menor sentimiento) para destacar
  const mejorPropio = useMemo(() => {
    if (propios.length === 0) return null;
    return [...propios].sort((a, b) => (b.sentimiento_promedio ?? -2) - (a.sentimiento_promedio ?? -2))[0];
  }, [propios]);
  const peorRival = useMemo(() => {
    if (rivales.length === 0) return null;
    return [...rivales].sort((a, b) => (a.sentimiento_promedio ?? 2) - (b.sentimiento_promedio ?? 2))[0];
  }, [rivales]);

  // Temas/hashtags compartidos para mapa de batalla
  const temasComunes = useMemo(() => {
    const counter = new Map<string, { propio: number; rival: number }>();
    for (const r of rows) {
      for (const t of r.top_temas ?? []) {
        const k = t.value;
        const cur = counter.get(k) ?? { propio: 0, rival: 0 };
        if (r.entidad_tipo === "candidato_propio") cur.propio += t.count;
        else cur.rival += t.count;
        counter.set(k, cur);
      }
    }
    return [...counter.entries()]
      .map(([tema, v]) => ({ tema, ...v, total: v.propio + v.rival }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);
  }, [rows]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="executive-panel p-5">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className="flex items-center gap-2 text-primary text-[10px] font-mono uppercase tracking-widest mb-1">
              <Swords className="w-3 h-3" />
              Comparador 360 · Propio vs Rivales
            </div>
            <h2 className="text-2xl font-bold text-foreground">Quién gana la conversación</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {rows.length === 0
                ? "Sin datos. Agrega candidatos en /candidatos y ejecuta el monitor."
                : `${propios.length} propios · ${rivales.length} rivales · ${totalAll} menciones${batchInfo ? ` · ${new Date(batchInfo.ejecutada_en).toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short" })}` : ""}`}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button asChild size="sm" variant="outline" className="gap-2">
              <Link to="/candidatos"><UserPlus className="w-3.5 h-3.5" />Gestionar candidatos</Link>
            </Button>
            <Button onClick={handleRefresh} disabled={refreshing} size="sm" className="gap-2">
              {refreshing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              {refreshing ? "Monitoreando…" : "Actualizar"}
            </Button>
          </div>
        </div>
      </div>

      {/* Tarjetas destacadas: best vs worst */}
      {!loading && (mejorPropio || peorRival) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {mejorPropio && (
            <article className="executive-panel p-4 border-l-4 border-emerald-400/60">
              <div className="flex items-center gap-2 text-emerald-400 text-[10px] font-mono uppercase tracking-widest">
                <Shield className="w-3 h-3" />Mejor desempeño propio
              </div>
              <h3 className="text-lg font-bold text-foreground mt-1">{mejorPropio.entidad_nombre}</h3>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold text-emerald-400">{mejorPropio.sentimiento_promedio?.toFixed(2) ?? "—"}</span>
                <span className="text-xs text-muted-foreground">sentimiento promedio</span>
              </div>
              <div className="text-xs text-muted-foreground mt-2">
                {mejorPropio.total_menciones} menciones · {(mejorPropio.pct_positivo ?? 0).toFixed(0)}% positivas
              </div>
            </article>
          )}
          {peorRival && (
            <article className="executive-panel p-4 border-l-4 border-red-500/60">
              <div className="flex items-center gap-2 text-red-400 text-[10px] font-mono uppercase tracking-widest">
                <Swords className="w-3 h-3" />Rival más débil
              </div>
              <h3 className="text-lg font-bold text-foreground mt-1">{peorRival.entidad_nombre}</h3>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold text-red-400">{peorRival.sentimiento_promedio?.toFixed(2) ?? "—"}</span>
                <span className="text-xs text-muted-foreground">sentimiento promedio</span>
              </div>
              <div className="text-xs text-muted-foreground mt-2">
                {peorRival.total_menciones} menciones · {(peorRival.pct_negativo ?? 0).toFixed(0)}% negativas · oportunidad de contraste
              </div>
            </article>
          )}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-40 w-full" />)}
        </div>
      ) : rows.length === 0 ? (
        <div className="executive-panel p-8 text-center text-sm text-muted-foreground">
          Sin candidatos propios ni rivales monitoreados todavía.
        </div>
      ) : (
        <>
          {/* Tabla comparativa lado a lado */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <ColumnaEntidades titulo="Mis candidatos" Icono={Shield} color="text-emerald-400" rows={propios} totalAll={totalAll} />
            <ColumnaEntidades titulo="Rivales" Icono={Swords} color="text-red-400" rows={rivales} totalAll={totalAll} />
          </div>

          {/* Mapa de batalla por temas */}
          {temasComunes.length > 0 && (
            <div className="executive-panel p-4">
              <div className="flex items-center gap-2 mb-3">
                <Tag className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-bold text-foreground">Mapa de batalla por temas</h3>
              </div>
              <div className="space-y-2">
                {temasComunes.map((t) => {
                  const total = t.propio + t.rival;
                  const pctP = total ? (t.propio / total) * 100 : 0;
                  const pctR = total ? (t.rival / total) * 100 : 0;
                  return (
                    <div key={t.tema} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-foreground">{t.tema}</span>
                        <span className="font-mono text-muted-foreground">
                          <span className="text-emerald-400">{t.propio}</span> vs <span className="text-red-400">{t.rival}</span>
                        </span>
                      </div>
                      <div className="flex h-2 rounded-full overflow-hidden bg-muted/30 ring-1 ring-border">
                        <div className="bg-emerald-500/80" style={{ width: `${pctP}%` }} title={`Propio ${pctP.toFixed(0)}%`} />
                        <div className="bg-red-500/80" style={{ width: `${pctR}%` }} title={`Rival ${pctR.toFixed(0)}%`} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 text-[10px] font-mono text-muted-foreground/80">
                Donde el rival domina un tema → considera ceder esa conversación o contrastar con dato propio.
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ColumnaEntidades({
  titulo,
  Icono,
  color,
  rows,
  totalAll,
}: {
  titulo: string;
  Icono: typeof Shield;
  color: string;
  rows: ResumenRow[];
  totalAll: number;
}) {
  return (
    <section className="executive-panel p-4">
      <div className="flex items-center gap-2 mb-3">
        <Icono className={`w-4 h-4 ${color}`} />
        <h3 className="text-sm font-bold text-foreground">{titulo}</h3>
        <Badge variant="outline" className="text-[9px] ml-auto">{rows.length}</Badge>
      </div>
      {rows.length === 0 ? (
        <div className="text-xs text-muted-foreground py-6 text-center">Sin entidades en esta categoría.</div>
      ) : (
        <div className="space-y-2">
          {rows.map((r) => {
            const st = SENT[nivel(r.sentimiento_promedio)];
            const Ic = st.icon;
            const sov = totalAll ? (r.total_menciones / totalAll) * 100 : 0;
            return (
              <article key={r.id} className={`rounded-md border ${st.border} ${st.bg} p-2.5`}>
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-bold text-foreground truncate">{r.entidad_nombre}</h4>
                  <span className={`inline-flex items-center gap-1 text-[10px] font-mono font-bold ${st.text}`}>
                    <Ic className="w-3 h-3" />
                    {r.sentimiento_promedio?.toFixed(2) ?? "—"}
                  </span>
                </div>
                <div className="mt-1.5 grid grid-cols-3 gap-1 text-[10px] font-mono">
                  <div>
                    <div className="text-muted-foreground">Menciones</div>
                    <div className="text-foreground font-bold">{r.total_menciones}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">SOV</div>
                    <div className="text-foreground font-bold">{sov.toFixed(0)}%</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Pos / Neg</div>
                    <div className="text-foreground font-bold">
                      <span className="text-emerald-400">{(r.pct_positivo ?? 0).toFixed(0)}</span>
                      /<span className="text-red-400">{(r.pct_negativo ?? 0).toFixed(0)}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-1.5 flex h-1.5 rounded-full overflow-hidden bg-muted/30">
                  <div className="bg-emerald-500/80" style={{ width: `${r.pct_positivo ?? 0}%` }} />
                  <div className="bg-slate-400/70" style={{ width: `${r.pct_neutro ?? 0}%` }} />
                  <div className="bg-red-500/80" style={{ width: `${r.pct_negativo ?? 0}%` }} />
                </div>
                {(r.top_temas?.length ?? 0) > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {r.top_temas.slice(0, 3).map((t) => (
                      <span key={t.value} className="text-[9px] px-1.5 py-0.5 rounded bg-muted/40 text-muted-foreground">
                        {t.value}
                      </span>
                    ))}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

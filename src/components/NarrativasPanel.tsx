// Panel de Narrativas IA: muestra narrativas dominantes, share of voice y alertas accionables
// generadas por la edge function analizar-narrativas-social. Se ejecuta on-demand sobre el batch
// más reciente de social_menciones para no incrementar costos en cada visita.
import { useState } from "react";
import { Sparkles, TrendingUp, TrendingDown, Minus, Loader2, AlertOctagon, Eye, Lightbulb, Megaphone, ArrowUpRight, ArrowDownRight, ArrowRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Narrativa {
  titulo: string;
  descripcion: string;
  sentimiento: "muy_positivo" | "positivo" | "neutro" | "negativo" | "muy_negativo";
  intensidad: number;
  tendencia: "creciente" | "estable" | "decreciente" | "nueva";
  actores_clave: string[];
  territorio: string;
}

interface Alerta {
  nivel: "urgente" | "atencion" | "oportunidad";
  titulo: string;
  descripcion: string;
  accion_sugerida: string;
}

interface SovItem {
  nombre: string;
  tipo: string;
  menciones: number;
  sentimiento: number;
  share_pct: number;
}

interface NarrativasResponse {
  success: boolean;
  scope: string;
  generado_en: string;
  muestra_actual: number;
  muestra_previa: number;
  share_of_voice: SovItem[];
  hashtags_emergentes: { hashtag: string; menciones: number }[];
  narrativas: Narrativa[];
  alertas: Alerta[];
  resumen_ejecutivo: string;
}

const SENT_BADGE: Record<Narrativa["sentimiento"], { text: string; bg: string; border: string; label: string }> = {
  muy_positivo: { text: "text-emerald-300", bg: "bg-emerald-500/15", border: "border-emerald-400/50", label: "Muy positivo" },
  positivo:     { text: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30", label: "Positivo" },
  neutro:       { text: "text-slate-300",   bg: "bg-slate-500/10",   border: "border-slate-400/30",   label: "Neutro" },
  negativo:     { text: "text-orange-400",  bg: "bg-orange-500/10",  border: "border-orange-500/30",  label: "Negativo" },
  muy_negativo: { text: "text-red-400",     bg: "bg-red-500/15",     border: "border-red-500/50",     label: "Muy negativo" },
};

const TREND_ICON: Record<Narrativa["tendencia"], { icon: typeof ArrowRight; text: string; label: string }> = {
  creciente:   { icon: ArrowUpRight,   text: "text-red-400",      label: "↑ Creciente" },
  estable:     { icon: ArrowRight,     text: "text-slate-400",    label: "→ Estable" },
  decreciente: { icon: ArrowDownRight, text: "text-emerald-400",  label: "↓ Decreciente" },
  nueva:       { icon: Plus,           text: "text-primary",      label: "✦ Nueva" },
};

const NIVEL_ALERTA: Record<Alerta["nivel"], { text: string; bg: string; border: string; icon: typeof AlertOctagon; label: string }> = {
  urgente:     { text: "text-red-400",     bg: "bg-red-500/15",     border: "border-red-500/60", icon: AlertOctagon, label: "Urgente" },
  atencion:    { text: "text-orange-400",  bg: "bg-orange-500/10",  border: "border-orange-500/40", icon: Eye, label: "Atención" },
  oportunidad: { text: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/40", icon: Lightbulb, label: "Oportunidad" },
};

interface Props {
  scope: "estatal" | "candidatos";
}

export function NarrativasPanel({ scope }: Props) {
  const [data, setData] = useState<NarrativasResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const generar = async () => {
    setLoading(true);
    toast.info("Sintetizando narrativas…", { description: "La IA está leyendo el último batch (~15-30s)" });
    try {
      const { data: res, error } = await supabase.functions.invoke("analizar-narrativas-social", {
        body: { scope },
      });
      if (error) throw error;
      if (!res?.success) throw new Error(res?.error ?? "Sin respuesta válida");
      setData(res as NarrativasResponse);
      toast.success(`${res.narrativas?.length ?? 0} narrativas detectadas`, {
        description: `${res.alertas?.length ?? 0} alertas accionables`,
      });
    } catch (err) {
      toast.error("Error al sintetizar", { description: err instanceof Error ? err.message : "Error desconocido" });
    } finally {
      setLoading(false);
    }
  };

  const sovTop = data?.share_of_voice?.slice(0, 5) ?? [];
  const sovMax = sovTop[0]?.share_pct ?? 1;

  return (
    <section className="executive-panel p-5 space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2 text-primary text-[10px] font-mono uppercase tracking-widest mb-1">
            <Sparkles className="w-3 h-3" />
            Narrativas IA · {scope === "estatal" ? "Estatal" : "Candidatos"}
          </div>
          <h2 className="text-xl font-bold text-foreground">Inteligencia de conversación</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {data
              ? data.resumen_ejecutivo
              : "Sintetiza narrativas dominantes, share of voice y alertas accionables sobre el último batch monitoreado."}
          </p>
        </div>
        <Button onClick={generar} disabled={loading} size="sm" className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
          {loading ? "Analizando…" : data ? "Regenerar" : "Generar análisis"}
        </Button>
      </div>

      {data && (
        <>
          {/* Alertas accionables */}
          {data.alertas?.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {data.alertas.map((a, i) => {
                const st = NIVEL_ALERTA[a.nivel];
                const Ic = st.icon;
                return (
                  <div key={i} className={`p-3 rounded-md border-l-4 ${st.border} ${st.bg}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <Ic className={`w-3.5 h-3.5 ${st.text}`} />
                      <span className={`text-[10px] font-mono font-bold uppercase ${st.text}`}>{st.label}</span>
                      <span className="text-sm font-semibold text-foreground line-clamp-1">{a.titulo}</span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{a.descripcion}</p>
                    <div className="mt-1.5 flex items-start gap-1.5 text-[11px]">
                      <Megaphone className="w-3 h-3 mt-0.5 text-primary shrink-0" />
                      <span className="text-foreground/90"><span className="text-primary font-semibold">Acción:</span> {a.accion_sugerida}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Share of Voice (solo en candidatos) */}
          {scope === "candidatos" && sovTop.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-[10px] font-mono uppercase text-muted-foreground tracking-widest">Share of Voice</div>
              <div className="space-y-1">
                {sovTop.map((s) => {
                  const widthPct = (s.share_pct / sovMax) * 100;
                  const sentColor = s.sentimiento > 0.2 ? "bg-emerald-500/70" : s.sentimiento < -0.2 ? "bg-red-500/70" : "bg-slate-400/70";
                  return (
                    <div key={s.nombre} className="flex items-center gap-2 text-xs">
                      <span className="w-32 truncate font-medium text-foreground" title={s.nombre}>{s.nombre}</span>
                      <div className="flex-1 h-3 rounded-sm bg-muted/30 overflow-hidden ring-1 ring-border">
                        <div className={`h-full ${sentColor} transition-all`} style={{ width: `${widthPct}%` }} />
                      </div>
                      <span className="font-mono text-[10px] text-muted-foreground w-20 text-right">
                        {s.share_pct.toFixed(0)}% · {s.menciones}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Narrativas dominantes */}
          {data.narrativas?.length > 0 && (
            <div className="space-y-2">
              <div className="text-[10px] font-mono uppercase text-muted-foreground tracking-widest">Narrativas dominantes</div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                {data.narrativas.map((n, i) => {
                  const sst = SENT_BADGE[n.sentimiento];
                  const trd = TREND_ICON[n.tendencia];
                  const TIc = trd.icon;
                  return (
                    <article key={i} className={`p-3 rounded-md border ${sst.border} ${sst.bg} space-y-2`}>
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm font-bold text-foreground leading-snug">{n.titulo}</h3>
                        <div className="flex items-center gap-1 shrink-0">
                          <Badge variant="outline" className={`text-[9px] ${sst.text} ${sst.border}`}>
                            {sst.label}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{n.descripcion}</p>
                      <div className="flex items-center gap-3 flex-wrap text-[10px] font-mono">
                        <span className={`inline-flex items-center gap-1 ${trd.text}`}>
                          <TIc className="w-3 h-3" /> {trd.label}
                        </span>
                        <span className="text-muted-foreground">Intensidad: <span className="text-foreground font-bold">{Math.round(n.intensidad)}</span>/100</span>
                        <span className="text-muted-foreground">📍 {n.territorio}</span>
                      </div>
                      {n.actores_clave?.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {n.actores_clave.slice(0, 4).map((a) => (
                            <Badge key={a} variant="secondary" className="text-[9px]">{a}</Badge>
                          ))}
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            </div>
          )}

          {/* Hashtags emergentes */}
          {data.hashtags_emergentes?.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-border/40">
              <span className="text-[10px] font-mono uppercase text-muted-foreground tracking-widest">Hashtags emergentes</span>
              {data.hashtags_emergentes.map((h) => (
                <span key={h.hashtag} className="text-[10px] text-primary font-mono inline-flex items-center gap-0.5">
                  <Plus className="w-2.5 h-2.5" />#{h.hashtag.replace(/^#/, "")}
                  <span className="text-muted-foreground/60">({h.menciones})</span>
                </span>
              ))}
            </div>
          )}

          <div className="text-[9px] font-mono text-muted-foreground/70 pt-1 border-t border-border/40">
            ● Generado el {new Date(data.generado_en).toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Mexico_City" })} · Muestra: {data.muestra_actual} menciones (vs {data.muestra_previa} previas)
          </div>
        </>
      )}
    </section>
  );
}

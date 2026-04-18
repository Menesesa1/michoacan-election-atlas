import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Cloud,
  Sparkles,
  Search,
  Heart,
  AlertTriangle,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  Quote,
} from "lucide-react";

interface PalabraNube {
  palabra: string;
  peso: number;
  sentimiento: "positivo" | "neutro" | "negativo";
}
interface TemaRelevante {
  tema: string;
  intensidad: number;
  descripcion: string;
}
interface EmocionItem {
  emocion: string;
  intensidad: number;
  disparador: string;
}
interface DiscursoData {
  success: boolean;
  batch_id: string;
  generado_en: string;
  muestra: number;
  palabras_clave: PalabraNube[];
  temas_relevantes: TemaRelevante[];
  busquedas_dominantes: string[];
  emociones: EmocionItem[];
  insumos_discurso: { que_decir: string[]; que_evitar: string[] };
  resumen_ejecutivo: string;
}

const SENT_COLOR: Record<PalabraNube["sentimiento"], string> = {
  positivo: "text-emerald-400 hover:text-emerald-300",
  neutro: "text-slate-300 hover:text-slate-100",
  negativo: "text-red-400 hover:text-red-300",
};

const EMOCION_META: Record<string, { color: string; bg: string; border: string; icon: string }> = {
  miedo: { color: "text-violet-300", bg: "bg-violet-500/10", border: "border-violet-500/40", icon: "😰" },
  enojo: { color: "text-red-300", bg: "bg-red-500/10", border: "border-red-500/40", icon: "😡" },
  esperanza: { color: "text-emerald-300", bg: "bg-emerald-500/10", border: "border-emerald-500/40", icon: "🌱" },
  frustración: { color: "text-orange-300", bg: "bg-orange-500/10", border: "border-orange-500/40", icon: "😤" },
  orgullo: { color: "text-amber-300", bg: "bg-amber-500/10", border: "border-amber-500/40", icon: "🦅" },
  indiferencia: { color: "text-slate-300", bg: "bg-slate-500/10", border: "border-slate-500/40", icon: "😐" },
  indignación: { color: "text-rose-300", bg: "bg-rose-500/10", border: "border-rose-500/40", icon: "🔥" },
  nostalgia: { color: "text-sky-300", bg: "bg-sky-500/10", border: "border-sky-500/40", icon: "🌅" },
};

function metaEmocion(e: string) {
  return EMOCION_META[e.toLowerCase()] ?? { color: "text-foreground", bg: "bg-muted/20", border: "border-border", icon: "•" };
}

// Mapea peso 1-100 a tamaño de fuente CSS
function tamañoPalabra(peso: number): string {
  if (peso >= 80) return "text-3xl md:text-4xl font-bold";
  if (peso >= 60) return "text-2xl md:text-3xl font-bold";
  if (peso >= 40) return "text-xl md:text-2xl font-semibold";
  if (peso >= 25) return "text-lg font-semibold";
  if (peso >= 15) return "text-base";
  return "text-sm";
}

export function DiscursoCiudadano() {
  const [data, setData] = useState<DiscursoData | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialChecked, setInitialChecked] = useState(false);

  // Cache simple en sessionStorage para no llamar IA en cada navegación
  const cacheKey = "discurso-ciudadano-cache";

  const cargarCache = useCallback(() => {
    try {
      const raw = sessionStorage.getItem(cacheKey);
      if (raw) setData(JSON.parse(raw));
    } catch { /* noop */ }
    setInitialChecked(true);
  }, []);

  useEffect(() => {
    cargarCache();
  }, [cargarCache]);

  const generar = async () => {
    setLoading(true);
    toast.info("Sintetizando discurso ciudadano…", { description: "Analizando menciones recientes con IA" });
    try {
      const { data: resp, error } = await supabase.functions.invoke("analizar-discurso-ciudadano", { body: {} });
      if (error) throw error;
      if (!resp?.success) throw new Error(resp?.error ?? "Falló el análisis");
      setData(resp as DiscursoData);
      sessionStorage.setItem(cacheKey, JSON.stringify(resp));
      toast.success("Análisis listo", { description: `${resp.muestra} menciones procesadas` });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      toast.error("No se pudo generar el discurso", { description: msg });
    } finally {
      setLoading(false);
    }
  };

  if (!initialChecked) return null;

  return (
    <section className="executive-panel p-5 space-y-4">
      <header className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2 text-primary text-[10px] font-mono uppercase tracking-widest mb-1">
            <Sparkles className="w-3 h-3" />
            Discurso ciudadano · Construcción de mensaje
          </div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Cloud className="w-5 h-5 text-primary" />
            Qué piensa, qué busca y qué siente Michoacán
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Síntesis con IA de las menciones recientes para alimentar la arquitectura de mensaje.
          </p>
        </div>
        <Button onClick={generar} disabled={loading} size="sm" className="gap-2">
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          {loading ? "Sintetizando…" : data ? "Regenerar" : "Generar análisis"}
        </Button>
      </header>

      {loading && !data && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-40 w-full" />)}
        </div>
      )}

      {!loading && !data && (
        <div className="rounded-md border border-dashed border-border/60 bg-muted/10 p-6 text-center text-sm text-muted-foreground">
          Aún no hay análisis. Pulsa <span className="text-primary font-semibold">«Generar análisis»</span> para
          sintetizar el discurso ciudadano a partir del último batch de menciones.
        </div>
      )}

      {data && (
        <div className="space-y-5">
          {/* Resumen ejecutivo */}
          <div className="rounded-md border border-primary/30 bg-primary/5 p-3">
            <div className="text-[10px] font-mono uppercase tracking-widest text-primary mb-1 flex items-center gap-1">
              <Quote className="w-3 h-3" /> Resumen ejecutivo
            </div>
            <p className="text-sm text-foreground/90 italic leading-relaxed">{data.resumen_ejecutivo}</p>
            <div className="mt-2 text-[10px] font-mono text-muted-foreground">
              Muestra: {data.muestra} menciones · Generado: {new Date(data.generado_en).toLocaleString("es-MX")}
            </div>
          </div>

          {/* Nube de palabras */}
          <div className="rounded-md border border-border/60 bg-card/40 p-4">
            <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-1">
              <Cloud className="w-3 h-3" /> Nube de palabras del sentimiento estatal
            </div>
            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 leading-tight min-h-[160px]">
              {data.palabras_clave
                .slice()
                .sort((a, b) => b.peso - a.peso)
                .map((p, i) => (
                  <span
                    key={`${p.palabra}-${i}`}
                    className={`${tamañoPalabra(p.peso)} ${SENT_COLOR[p.sentimiento]} transition-colors cursor-default`}
                    title={`${p.palabra} · peso ${p.peso} · ${p.sentimiento}`}
                  >
                    {p.palabra}
                  </span>
                ))}
            </div>
            <div className="mt-3 flex justify-center gap-3 text-[10px] font-mono">
              <span className="text-emerald-400">● positivo</span>
              <span className="text-slate-300">● neutro</span>
              <span className="text-red-400">● negativo</span>
            </div>
          </div>

          {/* Grid: Temas + Búsquedas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {/* Temas relevantes */}
            <div className="rounded-md border border-border/60 bg-card/40 p-3">
              <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> Temas más relevantes para los ciudadanos
              </div>
              <ul className="space-y-2">
                {data.temas_relevantes
                  .slice()
                  .sort((a, b) => b.intensidad - a.intensidad)
                  .map((t, i) => (
                    <li key={i} className="space-y-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-sm font-semibold text-foreground">{t.tema}</span>
                        <span className="text-[10px] font-mono text-primary">{t.intensidad}/100</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted/30 overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${t.intensidad}%` }} />
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-snug">{t.descripcion}</p>
                    </li>
                  ))}
              </ul>
            </div>

            {/* Búsquedas dominantes */}
            <div className="rounded-md border border-border/60 bg-card/40 p-3">
              <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1">
                <Search className="w-3 h-3" /> Búsquedas y preguntas dominantes
              </div>
              <ul className="space-y-1.5">
                {data.busquedas_dominantes.map((b, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-xs text-foreground/90 p-2 rounded-md bg-muted/20 border border-border/40"
                  >
                    <Search className="w-3 h-3 text-primary shrink-0 mt-0.5" />
                    <span className="italic">«{b}»</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Emociones */}
          <div className="rounded-md border border-border/60 bg-card/40 p-3">
            <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1">
              <Heart className="w-3 h-3" /> Emociones que mueven al electorado
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {data.emociones
                .slice()
                .sort((a, b) => b.intensidad - a.intensidad)
                .map((e, i) => {
                  const meta = metaEmocion(e.emocion);
                  return (
                    <div key={i} className={`rounded-md border ${meta.border} ${meta.bg} p-2.5 space-y-1.5`}>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-lg">{meta.icon}</span>
                          <span className={`text-sm font-bold capitalize ${meta.color}`}>{e.emocion}</span>
                        </div>
                        <span className={`text-[10px] font-mono ${meta.color}`}>{e.intensidad}/100</span>
                      </div>
                      <div className="h-1 rounded-full bg-muted/30 overflow-hidden">
                        <div className={`h-full ${meta.bg.replace("/10", "/80")}`} style={{ width: `${e.intensidad}%` }} />
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-snug">
                        <span className="font-mono text-[9px] uppercase tracking-wider opacity-70">disparador: </span>
                        {e.disparador}
                      </p>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Insumos para discurso */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="rounded-md border border-emerald-500/30 bg-emerald-500/5 p-3">
              <div className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 mb-2 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Qué decir (conecta)
              </div>
              <ul className="space-y-1.5">
                {data.insumos_discurso.que_decir.map((d, i) => (
                  <li key={i} className="text-xs text-foreground/90 flex items-start gap-2">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{d}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-md border border-red-500/30 bg-red-500/5 p-3">
              <div className="text-[10px] font-mono uppercase tracking-widest text-red-400 mb-2 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Qué evitar (rechaza)
              </div>
              <ul className="space-y-1.5">
                {data.insumos_discurso.que_evitar.map((d, i) => (
                  <li key={i} className="text-xs text-foreground/90 flex items-start gap-2">
                    <XCircle className="w-3 h-3 text-red-400 shrink-0 mt-0.5" />
                    <span>{d}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="text-[10px] font-mono text-muted-foreground/70 text-center">
            ● Síntesis con Lovable AI · basada en menciones reales del último monitoreo · sin datos inventados
          </div>
        </div>
      )}
    </section>
  );
}

// Pestaña "Eval. digital" en la ficha del candidato.
// - Botón "Evaluar con IA" → llama a edge function evaluacion-redes-candidato.
// - Botón "Aplicar estimaciones" → escribe estimacion_metricas en candidato.metricas_redes
//   marcando notas con "[Estimación IA · confianza]" para que sean fácilmente distinguibles
//   de las métricas verificadas a mano y de las precargadas con Firecrawl.

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Sparkles, RotateCcw, AlertTriangle, CheckCircle2, Save, Target, TrendingUp, Lightbulb, Shield, AlertOctagon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Candidato, EvaluacionRedes, MetricasRedes, PlataformaRed } from "@/lib/candidatos/types";
import { PLATAFORMA_LABEL } from "@/lib/candidatos/types";
import { cn } from "@/lib/utils";

interface Props {
  candidato: Candidato;
  onMetricasActualizadas: () => void;
}

const CONFIANZA_COLOR = {
  alta: "border-emerald-500/40 text-emerald-300",
  media: "border-amber-500/40 text-amber-300",
  baja: "border-rose-500/40 text-rose-300",
};

const PRIORIDAD_COLOR = {
  alta: "border-rose-500/40 text-rose-300 bg-rose-500/10",
  media: "border-amber-500/40 text-amber-300 bg-amber-500/10",
  baja: "border-sky-500/40 text-sky-300 bg-sky-500/10",
};

const NIVEL_COLOR = {
  alta: "text-emerald-400",
  media: "text-amber-400",
  baja: "text-rose-400",
  inexistente: "text-rose-500",
};

const formatNum = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString("es-MX");
};

const STORAGE_KEY = (id: string) => `eval-redes-${id}`;

export function EvaluacionDigitalTab({ candidato, onMetricasActualizadas }: Props) {
  const { toast } = useToast();
  const [evaluacion, setEvaluacion] = useState<EvaluacionRedes | null>(null);
  const [loading, setLoading] = useState(false);
  const [aplicando, setAplicando] = useState(false);

  // Persistencia ligera en localStorage para no perder la evaluación al cambiar pestañas
  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY(candidato.id));
    if (raw) {
      try { setEvaluacion(JSON.parse(raw)); } catch { /* noop */ }
    } else {
      setEvaluacion(null);
    }
  }, [candidato.id]);

  const guardarEnStorage = (e: EvaluacionRedes | null) => {
    if (e) localStorage.setItem(STORAGE_KEY(candidato.id), JSON.stringify(e));
    else localStorage.removeItem(STORAGE_KEY(candidato.id));
  };

  const evaluar = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("evaluacion-redes-candidato", {
        body: {
          nombre: candidato.nombre,
          partido: candidato.partido,
          nivel: candidato.nivel,
          territorio: candidato.territorio,
          cargo_buscado: candidato.cargo_buscado ?? undefined,
          bio_breve: candidato.bio_breve ?? undefined,
          redes: candidato.redes ?? {},
          metricas_actuales: candidato.metricas_redes ?? {},
        },
      });
      if (error) throw error;
      const payload = data as { output?: EvaluacionRedes; error?: string };
      if (payload?.error) throw new Error(payload.error);
      if (!payload.output) throw new Error("Sin salida");
      setEvaluacion(payload.output);
      guardarEnStorage(payload.output);
      toast({ title: "Evaluación digital generada", description: "Revisa el FODA, recomendaciones y métricas estimadas." });
    } catch (err) {
      toast({
        title: "Error al evaluar",
        description: err instanceof Error ? err.message : "Reintenta",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const aplicarEstimaciones = async () => {
    if (!evaluacion) return;
    setAplicando(true);
    try {
      const existentes = candidato.metricas_redes ?? {};
      const nuevas: MetricasRedes = { ...existentes };
      let aplicadas = 0;
      evaluacion.estimacion_metricas.forEach((est) => {
        // No sobrescribe métricas verificadas (las que NO tienen marca de "Estimación IA")
        const actual = existentes[est.plataforma];
        const esVerificada = actual && (actual.notas ?? "").indexOf("[Estimación IA") === -1 && (actual.seguidores ?? 0) > 0;
        if (esVerificada) return;
        nuevas[est.plataforma] = {
          seguidores: est.seguidores_estimados,
          engagement_rate: est.engagement_estimado,
          ultima_actualizacion: new Date().toISOString(),
          notas: `[Estimación IA · ${est.confianza}] ${est.base_estimacion}`,
        };
        aplicadas++;
      });

      if (aplicadas === 0) {
        toast({ title: "Sin cambios", description: "Todas las plataformas estimadas ya tienen métricas verificadas." });
        return;
      }

      const { error } = await supabase
        .from("candidatos")
        .update({ metricas_redes: nuevas as never })
        .eq("id", candidato.id);
      if (error) throw error;

      toast({
        title: `${aplicadas} estimación(es) aplicada(s)`,
        description: "Quedan marcadas como [Estimación IA] — reemplázalas cuando midas a mano.",
      });
      onMetricasActualizadas();
    } catch (err) {
      toast({
        title: "Error al aplicar",
        description: err instanceof Error ? err.message : "Reintenta",
        variant: "destructive",
      });
    } finally {
      setAplicando(false);
    }
  };

  const tieneRedes = useMemo(
    () => Object.values(candidato.redes ?? {}).some((v) => typeof v === "string" && v.length > 0),
    [candidato.redes],
  );

  if (loading) {
    return (
      <div className="space-y-3 pt-3">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!evaluacion) {
    return (
      <div className="text-center py-10 space-y-3">
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Diagnóstico de presencia digital con IA: estimación de métricas, FODA y recomendaciones tácticas
          ponderadas contra el cargo y territorio.
        </p>
        {!tieneRedes && (
          <p className="text-xs text-amber-300 max-w-md mx-auto flex items-center justify-center gap-1">
            <AlertTriangle className="w-3 h-3" /> Sin URLs de redes capturadas — la estimación será conservadora.
          </p>
        )}
        <Button onClick={evaluar}>
          <Sparkles className="w-4 h-4 mr-1.5" /> Evaluar con IA
        </Button>
      </div>
    );
  }

  const { diagnostico_global: dg, foda_digital: foda, estimacion_metricas: ests, recomendaciones, comparables_referencia } = evaluacion;

  return (
    <div className="space-y-4 pt-3">
      {/* Acciones */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 text-xs text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2 py-1 rounded">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Estimación IA — verifica antes de tomar decisiones críticas.</span>
        </div>
        <div className="flex gap-2">
          {ests.length > 0 && (
            <Button size="sm" variant="outline" onClick={aplicarEstimaciones} disabled={aplicando}>
              <Save className="w-3.5 h-3.5 mr-1.5" />
              {aplicando ? "Aplicando…" : "Aplicar estimaciones a métricas"}
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={evaluar}>
            <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Re-evaluar
          </Button>
        </div>
      </div>

      {/* Score global */}
      <Card className="p-4 bg-card/60">
        <div className="flex items-center justify-between gap-4 mb-2">
          <div>
            <p className="text-[10px] uppercase font-mono text-muted-foreground">Diagnóstico digital</p>
            <p className={cn("text-2xl font-bold", NIVEL_COLOR[dg.nivel_presencia])}>
              Presencia {dg.nivel_presencia}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase font-mono text-muted-foreground">Score 0-100</p>
            <p className={cn("text-3xl font-bold font-mono", dg.score_digital >= 70 ? "text-emerald-400" : dg.score_digital >= 40 ? "text-amber-400" : "text-rose-400")}>
              {dg.score_digital}
            </p>
          </div>
        </div>
        <Progress value={dg.score_digital} className="h-1.5 mb-3" />
        <p className="text-sm text-muted-foreground leading-relaxed">{dg.resumen_ejecutivo}</p>
        <div className="mt-3 p-2 rounded bg-primary/5 border border-primary/20">
          <p className="text-[10px] uppercase font-mono text-primary mb-1 flex items-center gap-1">
            <Target className="w-3 h-3" /> Brecha vs cargo
          </p>
          <p className="text-xs text-foreground/90">{dg.brecha_vs_cargo}</p>
        </div>
      </Card>

      {/* Estimación de métricas por plataforma */}
      {ests.length > 0 && (
        <Card className="p-4 bg-card/60">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-primary" />
            Métricas estimadas por plataforma
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {ests.map((e) => (
              <Card key={e.plataforma} className="p-3 bg-background/40">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-sm">{PLATAFORMA_LABEL[e.plataforma]}</span>
                  <Badge variant="outline" className={cn("text-[9px] font-mono", CONFIANZA_COLOR[e.confianza])}>
                    confianza {e.confianza}
                  </Badge>
                </div>
                <div className="flex items-baseline gap-3">
                  <div>
                    <p className="text-xl font-bold font-mono">{formatNum(e.seguidores_estimados)}</p>
                    <p className="text-[10px] text-muted-foreground uppercase">seguidores</p>
                  </div>
                  <div>
                    <p className="text-base font-semibold font-mono text-primary">{e.engagement_estimado}%</p>
                    <p className="text-[10px] text-muted-foreground uppercase">engagement</p>
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground mt-2 italic">{e.base_estimacion}</p>
              </Card>
            ))}
          </div>
        </Card>
      )}

      {/* FODA digital */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <FodaBlock title="Fortalezas" items={foda.fortalezas} icon={<CheckCircle2 className="w-3.5 h-3.5" />} color="text-emerald-400 border-emerald-500/30" />
        <FodaBlock title="Debilidades" items={foda.debilidades} icon={<AlertOctagon className="w-3.5 h-3.5" />} color="text-rose-400 border-rose-500/30" />
        <FodaBlock title="Oportunidades" items={foda.oportunidades} icon={<Lightbulb className="w-3.5 h-3.5" />} color="text-sky-400 border-sky-500/30" />
        <FodaBlock title="Amenazas" items={foda.amenazas} icon={<Shield className="w-3.5 h-3.5" />} color="text-amber-400 border-amber-500/30" />
      </div>

      {/* Recomendaciones */}
      <Card className="p-4 bg-card/60">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-1.5">
          <Target className="w-4 h-4 text-primary" /> Recomendaciones tácticas
        </h3>
        <div className="space-y-2">
          {recomendaciones
            .slice()
            .sort((a, b) => {
              const ord = { alta: 0, media: 1, baja: 2 };
              return ord[a.prioridad] - ord[b.prioridad];
            })
            .map((r, i) => (
              <div key={i} className="p-2.5 rounded border border-border/60 bg-background/40">
                <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                  <Badge variant="outline" className={cn("text-[9px]", PRIORIDAD_COLOR[r.prioridad])}>
                    {r.prioridad.toUpperCase()}
                  </Badge>
                  <Badge variant="secondary" className="text-[9px]">
                    {r.plataforma === "general" ? "GENERAL" : PLATAFORMA_LABEL[r.plataforma as PlataformaRed]}
                  </Badge>
                </div>
                <p className="text-sm font-medium">{r.accion}</p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  <span className="font-mono uppercase">KPI:</span> {r.kpi_objetivo}
                </p>
              </div>
            ))}
        </div>
      </Card>

      {/* Comparables */}
      {comparables_referencia && comparables_referencia.length > 0 && (
        <Card className="p-3 bg-card/40 border-border/50">
          <p className="text-[10px] uppercase font-mono text-muted-foreground mb-2">Referencias del territorio</p>
          <ul className="space-y-1 text-xs">
            {comparables_referencia.map((c, i) => (
              <li key={i} className="text-muted-foreground">
                <span className="text-foreground font-medium">{c.referencia}:</span> {c.observacion}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

function FodaBlock({ title, items, icon, color }: { title: string; items: string[]; icon: React.ReactNode; color: string }) {
  return (
    <Card className={cn("p-3 bg-card/40 border", color)}>
      <h4 className={cn("text-xs font-semibold mb-2 flex items-center gap-1.5", color.split(" ")[0])}>
        {icon} {title}
      </h4>
      <ul className="space-y-1 text-xs">
        {items.map((it, i) => (
          <li key={i} className="text-foreground/80 leading-snug">• {it}</li>
        ))}
      </ul>
    </Card>
  );
}

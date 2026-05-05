// Panel de salud de pipelines: muestra última corrida de cada cron job
// y permite dispararlos manualmente para diagnóstico.
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Activity,
  RefreshCw,
  Play,
  CheckCircle2,
  AlertTriangle,
  Clock,
} from "lucide-react";

interface PipelineDef {
  key: string;
  label: string;
  funcion: string;
  tabla_runs: string;
  campo_fecha: string;
  frecuencia: string;
  campo_total?: string;
  body?: Record<string, unknown>;
}

const PIPELINES: PipelineDef[] = [
  {
    key: "social",
    label: "Monitor Social",
    funcion: "monitor-social",
    tabla_runs: "social_runs",
    campo_fecha: "ejecutada_en",
    campo_total: "total_menciones",
    frecuencia: "cada 30 min",
  },
  {
    key: "medios",
    label: "Ingesta Medios MX",
    funcion: "ingesta-medios-michoacan",
    tabla_runs: "medios_michoacan_runs",
    campo_fecha: "ejecutada_en",
    campo_total: "menciones_creadas",
    frecuencia: "cada 1 h",
  },
  {
    key: "crisis",
    label: "Monitor de Crisis",
    funcion: "monitor-crisis",
    tabla_runs: "alertas_crisis_runs",
    campo_fecha: "ejecutada_en",
    campo_total: "total_alertas",
    frecuencia: "cada 20 min",
  },
  {
    key: "trends",
    label: "Google Trends Estatal",
    funcion: "ingesta-google-trends",
    tabla_runs: "trends_runs",
    campo_fecha: "ejecutada_en",
    campo_total: "total_terminos",
    frecuencia: "3x día",
    body: { tipo: "estatal" },
  },
];

interface RunInfo {
  fecha: string | null;
  total: number | null;
  error: string | null;
  trigger: string | null;
}

function tiempoTranscurrido(iso: string | null): {
  texto: string;
  estado: "ok" | "stale" | "error";
} {
  if (!iso) return { texto: "sin datos", estado: "error" };
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.floor(ms / 60000);
  if (min < 60) return { texto: `hace ${min} min`, estado: min < 90 ? "ok" : "stale" };
  const horas = Math.floor(min / 60);
  if (horas < 24) return { texto: `hace ${horas} h`, estado: horas < 6 ? "ok" : "stale" };
  const dias = Math.floor(horas / 24);
  return { texto: `hace ${dias} d`, estado: "stale" };
}

export default function SaludPipeline() {
  const [info, setInfo] = useState<Record<string, RunInfo>>({});
  const [loading, setLoading] = useState(true);
  const [ejecutando, setEjecutando] = useState<string | null>(null);

  const cargar = async () => {
    setLoading(true);
    const result: Record<string, RunInfo> = {};
    await Promise.all(
      PIPELINES.map(async (p) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data } = await (supabase as any)
          .from(p.tabla_runs)
          .select("*")
          .order(p.campo_fecha, { ascending: false })
          .limit(1)
          .maybeSingle();
        result[p.key] = {
          fecha: data?.[p.campo_fecha] ?? null,
          total: p.campo_total ? data?.[p.campo_total] ?? null : null,
          error: data?.error ?? null,
          trigger: data?.trigger ?? null,
        };
      }),
    );
    setInfo(result);
    setLoading(false);
  };

  useEffect(() => {
    cargar();
  }, []);

  const ejecutarManual = async (p: PipelineDef) => {
    setEjecutando(p.key);
    try {
      const { error } = await supabase.functions.invoke(p.funcion, {
        body: { trigger: "manual", ...(p.body ?? {}) },
      });
      if (error) throw error;
      toast.success(`${p.label} ejecutado`);
      setTimeout(cargar, 2500);
    } catch (e) {
      toast.error(`Falló ${p.label}: ${(e as Error).message}`);
    } finally {
      setEjecutando(null);
    }
  };

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            Salud de pipelines automáticos
          </h2>
          <p className="text-[11px] text-muted-foreground font-mono mt-1">
            Cron jobs activos. Última corrida y disparo manual de diagnóstico.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={cargar} disabled={loading}>
          <RefreshCw className={`w-3 h-3 mr-1 ${loading ? "animate-spin" : ""}`} />
          Actualizar
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {PIPELINES.map((p) => {
          const r = info[p.key];
          const t = tiempoTranscurrido(r?.fecha ?? null);
          const hayError = !!r?.error;
          return (
            <div
              key={p.key}
              className="p-3 rounded border border-border/40 bg-card/40 space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-sm font-semibold truncate">{p.label}</div>
                  <div className="text-[10px] text-muted-foreground font-mono">
                    {p.funcion} · {p.frecuencia}
                  </div>
                </div>
                <Badge
                  variant={hayError ? "destructive" : t.estado === "ok" ? "default" : "secondary"}
                  className="font-mono text-[10px] gap-1"
                >
                  {hayError ? (
                    <AlertTriangle className="w-3 h-3" />
                  ) : t.estado === "ok" ? (
                    <CheckCircle2 className="w-3 h-3" />
                  ) : (
                    <Clock className="w-3 h-3" />
                  )}
                  {t.texto}
                </Badge>
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-muted-foreground">
                  {r?.total != null ? `${r.total.toLocaleString("es-MX")} reg.` : "—"}
                  {r?.trigger && <span className="ml-2 opacity-60">[{r.trigger}]</span>}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-[11px]"
                  onClick={() => ejecutarManual(p)}
                  disabled={ejecutando === p.key}
                >
                  <Play className={`w-3 h-3 mr-1 ${ejecutando === p.key ? "animate-pulse" : ""}`} />
                  Ejecutar
                </Button>
              </div>

              {hayError && (
                <div className="text-[10px] text-destructive font-mono bg-destructive/10 p-1.5 rounded truncate">
                  {r.error}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

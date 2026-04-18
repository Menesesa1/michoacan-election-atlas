import { useEffect, useMemo, useState, useCallback } from "react";
import { AlertTriangle, ShieldAlert, Info, RefreshCw, Clock, MapPin, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

type PrioridadAlerta = "Urgente" | "Preventivo" | "Informativo";

interface Alerta {
  id: string;
  prioridad: PrioridadAlerta;
  titulo: string;
  descripcion: string;
  distrito: string;
  fuente: string;
  url_fuente: string | null;
  timestamp: string;
  detectada_en: string;
  batch_id: string;
}

interface RunMeta {
  ejecutada_en: string;
  total_alertas: number;
  urgentes: number;
  preventivas: number;
  informativas: number;
  duracion_ms: number | null;
  error: string | null;
  trigger: string;
}

const PRIORIDAD_STYLES: Record<PrioridadAlerta, { bg: string; text: string; border: string; icon: typeof AlertTriangle }> = {
  Urgente: { bg: "bg-destructive/15", text: "text-destructive", border: "border-destructive/50", icon: AlertTriangle },
  Preventivo: { bg: "bg-primary/15", text: "text-primary", border: "border-primary/40", icon: ShieldAlert },
  Informativo: { bg: "bg-blue-400/10", text: "text-blue-300", border: "border-blue-400/30", icon: Info },
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "ahora";
  if (m < 60) return `hace ${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h}h`;
  return `hace ${Math.floor(h / 24)}d`;
}

function formatExact(iso: string): string {
  return new Date(iso).toLocaleString("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Mexico_City",
  });
}

export function AlertasOperacion() {
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [lastRun, setLastRun] = useState<RunMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filtro, setFiltro] = useState<PrioridadAlerta | "Todas">("Todas");

  const loadLatest = useCallback(async () => {
    // Última corrida exitosa → batch_id
    const { data: run } = await supabase
      .from("alertas_crisis_runs")
      .select("*")
      .is("error", null)
      .gt("total_alertas", 0)
      .order("ejecutada_en", { ascending: false })
      .limit(1)
      .maybeSingle();

    setLastRun(run as RunMeta | null);

    if (!run) {
      setAlertas([]);
      return;
    }

    // Alertas detectadas en/después de esa corrida
    const { data: rows } = await supabase
      .from("alertas_crisis")
      .select("*")
      .gte("detectada_en", run.ejecutada_en)
      .order("prioridad", { ascending: true })
      .order("detectada_en", { ascending: false })
      .limit(50);

    setAlertas((rows as Alerta[]) ?? []);
  }, []);

  useEffect(() => {
    loadLatest().finally(() => setLoading(false));
  }, [loadLatest]);

  // Realtime: nuevas inserciones
  useEffect(() => {
    const channel = supabase
      .channel("alertas-crisis-changes")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "alertas_crisis_runs" }, () => {
        loadLatest();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadLatest]);

  const handleRefresh = async () => {
    setRefreshing(true);
    toast({ title: "Monitoreando…", description: "Buscando noticias y clasificando alertas (~30-60s)" });
    try {
      const { data, error } = await supabase.functions.invoke("monitor-crisis", {
        body: { trigger: "manual" },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error ?? "Falló el monitor");
      toast({
        title: `${data.total} alertas generadas`,
        description: `${data.urgentes} urgentes · ${data.preventivas} preventivas · ${data.informativas} informativas`,
      });
      await loadLatest();
    } catch (err) {
      toast({
        title: "Error al actualizar",
        description: err instanceof Error ? err.message : "Error desconocido",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  const filtered = filtro === "Todas" ? alertas : alertas.filter((a) => a.prioridad === filtro);

  const counts = useMemo(() => ({
    Urgente: alertas.filter((a) => a.prioridad === "Urgente").length,
    Preventivo: alertas.filter((a) => a.prioridad === "Preventivo").length,
    Informativo: alertas.filter((a) => a.prioridad === "Informativo").length,
  }), [alertas]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="executive-panel p-5">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 text-primary text-[10px] font-mono uppercase tracking-widest mb-1">
              <ShieldAlert className="w-3 h-3" />
              Módulo de Crisis · Monitoreo IA en vivo
            </div>
            <h2 className="text-2xl font-bold text-foreground">Alertas de Operación</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {alertas.length > 0
                ? `${alertas.length} alertas activas · Último monitoreo: ${lastRun ? formatExact(lastRun.ejecutada_en) : "—"}`
                : "Sin alertas. Ejecuta un monitoreo para comenzar."}
            </p>
          </div>
          <Button onClick={handleRefresh} disabled={refreshing} size="sm" className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
            {refreshing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            {refreshing ? "Monitoreando…" : "Actualizar ahora"}
          </Button>
        </div>

        {/* Counters */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          {(["Urgente", "Preventivo", "Informativo"] as PrioridadAlerta[]).map((p) => {
            const s = PRIORIDAD_STYLES[p];
            const Icon = s.icon;
            return (
              <button
                key={p}
                onClick={() => setFiltro(filtro === p ? "Todas" : p)}
                className={`flex items-center justify-between rounded-md border px-3 py-2 transition-all ${s.bg} ${s.border} ${filtro === p ? "ring-2 ring-primary/50" : "hover:opacity-90"}`}
              >
                <div className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${s.text}`} />
                  <span className={`text-xs font-semibold ${s.text}`}>{p}</span>
                </div>
                <span className={`text-lg font-bold ${s.text}`}>{counts[p]}</span>
              </button>
            );
          })}
        </div>

        {lastRun && (
          <div className="mt-3 text-[10px] font-mono text-muted-foreground/80 flex flex-wrap gap-x-4 gap-y-1">
            <span>● Pipeline: Firecrawl Search → Lovable AI (Gemini Flash)</span>
            {lastRun.duracion_ms && <span>· {(lastRun.duracion_ms / 1000).toFixed(1)}s</span>}
            <span>· trigger: {lastRun.trigger}</span>
          </div>
        )}
      </div>

      {/* Feed */}
      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)
        ) : filtered.length === 0 ? (
          <div className="executive-panel p-8 text-center text-sm text-muted-foreground">
            {alertas.length === 0
              ? "No hay alertas todavía. Pulsa «Actualizar ahora» para ejecutar el monitor."
              : "No hay alertas con el filtro actual."}
          </div>
        ) : (
          filtered.map((a) => {
            const s = PRIORIDAD_STYLES[a.prioridad];
            const Icon = s.icon;
            return (
              <article
                key={a.id}
                className={`executive-panel p-4 border-l-4 ${s.border} animate-slide-up`}
                style={{ borderLeftColor: a.prioridad === "Urgente" ? "hsl(var(--destructive))" : a.prioridad === "Preventivo" ? "hsl(var(--primary))" : "hsl(210, 80%, 60%)" }}
              >
                <div className="flex items-start gap-3">
                  <div className={`rounded-md p-2 ${s.bg} shrink-0`}>
                    <Icon className={`w-4 h-4 ${s.text}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <h3 className="text-sm font-semibold text-foreground leading-snug">{a.titulo}</h3>
                      <span className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded ${s.bg} ${s.text} border ${s.border}`}>
                        {a.prioridad}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{a.descripcion}</p>
                    <div className="flex items-center gap-4 mt-3 text-[10px] font-mono text-muted-foreground/80 flex-wrap">
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{a.distrito}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{timeAgo(a.timestamp)}</span>
                      <span className="opacity-70">· {a.fuente}</span>
                      {a.url_fuente && (
                        <a href={a.url_fuente} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                          <ExternalLink className="w-3 h-3" />Fuente
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}

import { useMemo, useState } from "react";
import { AlertTriangle, ShieldAlert, Info, RefreshCw, Clock, MapPin, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { alertasMock, type Alerta, type PrioridadAlerta } from "@/data/alertas-mock";
import { useRemoteData } from "@/lib/data-source";

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
  const d = Math.floor(h / 24);
  return `hace ${d}d`;
}

function isAlertaArray(d: unknown): d is Alerta[] {
  return Array.isArray(d) && d.every((x) => x && typeof x === "object" && "prioridad" in x);
}

export function AlertasOperacion() {
  const [remoteUrl, setRemoteUrl] = useState<string>("");
  const [pendingUrl, setPendingUrl] = useState<string>("");
  const [filtro, setFiltro] = useState<PrioridadAlerta | "Todas">("Todas");

  const { data, loading, error, reload } = useRemoteData<Alerta>(remoteUrl || null, { refreshMs: 60_000 });

  const alertas: Alerta[] = useMemo(() => {
    if (remoteUrl && isAlertaArray(data)) return data;
    return alertasMock;
  }, [remoteUrl, data]);

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
              Módulo de Crisis · Tiempo real
            </div>
            <h2 className="text-2xl font-bold text-foreground">Alertas de Operación</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Feed de inteligencia operativa · {alertas.length} alertas activas
            </p>
          </div>
          <Button onClick={reload} variant="outline" size="sm" className="gap-2">
            <RefreshCw className="w-3.5 h-3.5" />
            Actualizar
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
      </div>

      {/* Remote source */}
      <div className="executive-panel p-4">
        <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">
          <Filter className="w-3 h-3" />
          Fuente de datos remota (Google Sheets CSV o JSON)
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            placeholder="https://docs.google.com/.../pub?output=csv"
            value={pendingUrl}
            onChange={(e) => setPendingUrl(e.target.value)}
            className="flex-1 bg-background/40 text-xs"
          />
          <Button
            size="sm"
            onClick={() => setRemoteUrl(pendingUrl.trim())}
            disabled={!pendingUrl.trim()}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Conectar
          </Button>
          {remoteUrl && (
            <Button size="sm" variant="outline" onClick={() => { setRemoteUrl(""); setPendingUrl(""); }}>
              Usar mock
            </Button>
          )}
        </div>
        {error && <p className="text-[11px] text-destructive mt-2">⚠ {error} · Mostrando datos locales.</p>}
        {remoteUrl && !error && !loading && <p className="text-[11px] text-primary mt-2">● Auto-refresh cada 60s</p>}
      </div>

      {/* Feed */}
      <div className="space-y-3">
        {loading && remoteUrl ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)
        ) : filtered.length === 0 ? (
          <div className="executive-panel p-8 text-center text-sm text-muted-foreground">
            No hay alertas con el filtro actual.
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

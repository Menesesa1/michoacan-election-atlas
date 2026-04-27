import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileDown, Sparkles, Database, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Candidato } from "@/lib/candidatos/types";
import { generarDossierComercial } from "@/lib/pdf-dossier-comercial";
import { resolverMetricasOficiales, type MetricasOficiales } from "@/lib/dossier-data-resolver";

const NIVEL_LABEL: Record<string, string> = {
  gobernador: "Gubernatura",
  diputados_federales: "Dip. Federal",
  diputados: "Dip. Local",
  ayuntamientos: "Ayuntamiento",
};

interface Props {
  candidatos: Candidato[];
}

export function DossierComercialSelector({ candidatos }: Props) {
  const [seleccionado, setSeleccionado] = useState<string>("");
  const [generando, setGenerando] = useState(false);
  const [metricas, setMetricas] = useState<MetricasOficiales | null>(null);
  const [resolviendo, setResolviendo] = useState(false);

  const ordenados = useMemo(
    () => [...candidatos].sort((a, b) => a.nombre.localeCompare(b.nombre)),
    [candidatos],
  );

  const cand = candidatos.find((c) => c.id === seleccionado);

  // Cuando cambia la selección, resuelve métricas oficiales (padrón INE + cómputos por distrito/municipio)
  useEffect(() => {
    if (!cand) {
      setMetricas(null);
      return;
    }
    let cancel = false;
    setResolviendo(true);
    setMetricas(null);
    resolverMetricasOficiales(cand)
      .then((m) => {
        if (!cancel) setMetricas(m);
      })
      .catch(() => {
        if (!cancel) setMetricas(null);
      })
      .finally(() => {
        if (!cancel) setResolviendo(false);
      });
    return () => {
      cancel = true;
    };
  }, [cand]);

  const generar = async () => {
    if (!cand) {
      toast.error("Selecciona un candidato/distrito primero");
      return;
    }
    setGenerando(true);
    try {
      generarDossierComercial({ candidato: cand, metricasOficiales: metricas });
      toast.success("Dossier comercial generado", {
        description: metricas?.esEstimacion === false
          ? `Datos oficiales · ${metricas.origen.split("·")[0].trim()}`
          : `Personalizado para ${cand.nombre} · ${cand.territorio}`,
      });
    } catch (e) {
      toast.error("No se pudo generar el dossier", {
        description: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setGenerando(false);
    }
  };

  return (
    <div className="rounded-lg border border-amber-500/30 bg-gradient-to-br from-amber-500/5 via-card/40 to-card/40 p-4 backdrop-blur-sm">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-amber-400" />
        <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400">
          Dossier comercial · Personalizado por contienda
        </span>
      </div>
      <div className="flex flex-col md:flex-row gap-2 items-stretch md:items-end">
        <div className="flex-1">
          <label className="text-xs text-muted-foreground mb-1 block">
            Candidato / distrito
          </label>
          <Select value={seleccionado} onValueChange={setSeleccionado}>
            <SelectTrigger className="bg-background/60">
              <SelectValue placeholder="Selecciona candidato o distrito…" />
            </SelectTrigger>
            <SelectContent>
              {ordenados.length === 0 ? (
                <div className="px-3 py-2 text-xs text-muted-foreground">
                  Aún no hay candidatos registrados.
                </div>
              ) : (
                ordenados.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    <span className="font-medium">{c.nombre}</span>
                    <span className="text-muted-foreground ml-2 text-xs">
                      · {NIVEL_LABEL[c.nivel] ?? c.nivel} · {c.territorio} · {c.partido}
                    </span>
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
        <Button
          onClick={generar}
          disabled={!seleccionado || generando || resolviendo}
          className="bg-amber-500/90 hover:bg-amber-500 text-black font-semibold"
        >
          <FileDown className="w-4 h-4 mr-1.5" />
          {generando ? "Generando…" : "Descargar dossier"}
        </Button>
      </div>

      {/* Preview de datos oficiales resueltos */}
      {cand && (
        <div className="mt-3 rounded-md border border-border/60 bg-background/40 px-3 py-2.5">
          {resolviendo ? (
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <Loader2 className="w-3 h-3 animate-spin" />
              Resolviendo padrón INE + cómputos electorales para {cand.territorio}…
            </div>
          ) : metricas && !metricas.esEstimacion ? (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-emerald-400">
                <Database className="w-3 h-3" />
                Datos oficiales activos
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                <Metric label="Brecha vs rival" value={metricas.brechaPp != null ? `${metricas.brechaPp > 0 ? "-" : "+"}${Math.abs(metricas.brechaPp).toFixed(1)} pp` : "—"} tone={metricas.brechaPp != null && metricas.brechaPp > 0 ? "danger" : "ok"} />
                <Metric label="Lista nominal" value={metricas.listaNominal ? metricas.listaNominal.toLocaleString("es-MX") : "—"} />
                <Metric label="Secciones" value={metricas.seccionesTotal ? `${metricas.seccionesTotal} (${metricas.seccionesRiesgo ?? "—"} rojas)` : "—"} />
                <Metric label="Ciclo ref." value={metricas.cicloRef ? `${metricas.cicloRef} · ${metricas.rivalPartido ?? "—"}` : "—"} />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs pt-1 border-t border-border/40">
                <Metric label="Hombres" value={metricas.demografia.hombres != null ? metricas.demografia.hombres.toLocaleString("es-MX") : "—"} />
                <Metric label="Mujeres" value={metricas.demografia.mujeres != null ? metricas.demografia.mujeres.toLocaleString("es-MX") : "—"} />
                <Metric label="Jóvenes 18-29" value={metricas.demografia.pctJovenes18a29 != null ? `${metricas.demografia.pctJovenes18a29.toFixed(1)}%` : "—"} />
                <Metric label="60+ años" value={metricas.demografia.pctAdultoMayor60mas != null ? `${metricas.demografia.pctAdultoMayor60mas.toFixed(1)}%` : "—"} />
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {metricas.fuenteResultados && (
                  <span className="text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                    Cómputos: {metricas.fuenteResultados}
                  </span>
                )}
                {metricas.fuentePadron && (
                  <span className="text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                    Padrón: {metricas.fuentePadron}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground leading-snug">
                {metricas.origen}
              </p>
            </div>
          ) : (
            <p className="text-[11px] text-muted-foreground">
              No se halló territorio oficial para <span className="text-amber-400">{cand.territorio}</span>.
              El dossier usará estimación EME determinista.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone?: "danger" | "ok" }) {
  return (
    <div className="space-y-0.5">
      <div className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`text-sm font-semibold ${tone === "danger" ? "text-red-400" : tone === "ok" ? "text-emerald-400" : "text-foreground"}`}>
        {value}
      </div>
    </div>
  );
}

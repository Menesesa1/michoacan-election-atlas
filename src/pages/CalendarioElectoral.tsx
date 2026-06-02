import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Calendar as CalendarIcon,
  Filter,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ChevronRight,
} from "lucide-react";
import {
  CALENDARIO_MICHOACAN_2027,
  ETAPA_LABEL,
  ETAPA_COLOR,
  formatearRango,
  diasHasta,
  getEtapaActual,
  type HitoCalendario,
} from "@/lib/calendario-electoral";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

type CargoFiltro = "all" | "gobernador" | "diputados_locales" | "ayuntamientos";

const CARGO_LABEL: Record<CargoFiltro, string> = {
  all: "Todos los cargos",
  gobernador: "Gubernatura",
  diputados_locales: "Diputados locales",
  ayuntamientos: "Ayuntamientos",
};

export default function CalendarioElectoral() {
  const [cargoFiltro, setCargoFiltro] = useState<CargoFiltro>("all");
  const hoy = useMemo(() => new Date(), []);
  const { hito: hitoActual } = getEtapaActual(hoy);

  const hitos = useMemo(() => {
    return CALENDARIO_MICHOACAN_2027.filter((h) => {
      if (cargoFiltro === "all") return true;
      return h.cargos.includes(cargoFiltro);
    });
  }, [cargoFiltro]);

  const estadoHito = (h: HitoCalendario): "pasado" | "activo" | "futuro" => {
    const f = hoy.toISOString().slice(0, 10);
    const fin = h.fecha_fin ?? h.fecha_inicio;
    if (f > fin) return "pasado";
    if (f < h.fecha_inicio) return "futuro";
    return "activo";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <div className="text-primary text-[10px] font-mono uppercase tracking-widest">
            Proceso Electoral Local · Michoacán
          </div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-primary" /> Calendario Electoral 2026-2027
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-3xl">
            Hoja de ruta del proceso: aspirantes → precandidatos → candidatos → jornada electoral.
            <span className="block text-green-400 mt-1 text-xs">
              ✓ Calendario oficial actualizado con las reformas de la Gaceta Parlamentaria 115-07
              (27 de mayo de 2026, Transitorio Décimo aplicado).
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Select value={cargoFiltro} onValueChange={(v) => setCargoFiltro(v as CargoFiltro)}>
            <SelectTrigger className="w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(CARGO_LABEL) as CargoFiltro[]).map((k) => (
                <SelectItem key={k} value={k}>
                  {CARGO_LABEL[k]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* CTA estratégico para fase actual */}
      {hitoActual && (
        <div className="rounded-lg border border-primary/40 bg-primary/5 p-4 flex flex-col md:flex-row md:items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-primary shrink-0" />
          <div className="flex-1">
            <div className="text-[10px] font-mono uppercase tracking-widest text-primary">
              Acción estratégica recomendada
            </div>
            <p className="text-sm font-semibold">
              Estás en la etapa <span className="text-primary">{ETAPA_LABEL[hitoActual.etapa]}</span>.
              {hitoActual.etapa === "aspirantes" && (
                <> El partido aún no decide. Refuerza la potencia mediática y digital de tus aspirantes.</>
              )}
              {hitoActual.etapa === "precampana" && (
                <> Los precandidatos pueden hacer actos sin pedir el voto. Construye narrativa.</>
              )}
              {hitoActual.etapa === "campana" && <> Maximiza pisada territorial y respuesta rápida.</>}
            </p>
          </div>
          <Button asChild size="sm">
            <Link to="/candidatos">
              Ir a Candidatos <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </Button>
        </div>
      )}

      {/* Timeline */}
      <div className="relative pl-6 md:pl-8">
        <div className="absolute left-2 md:left-3 top-2 bottom-2 w-px bg-border" />
        <div className="space-y-4">
          {hitos.map((h) => {
            const estado = estadoHito(h);
            const dias = diasHasta(h.fecha_inicio, hoy);
            const colorClasses = ETAPA_COLOR[h.etapa];
            return (
              <div key={h.id} className="relative">
                {/* Marker */}
                <div
                  className={cn(
                    "absolute -left-6 md:-left-8 top-3 w-4 h-4 rounded-full border-2 flex items-center justify-center",
                    estado === "activo"
                      ? "bg-primary border-primary animate-pulse-glow"
                      : estado === "pasado"
                        ? "bg-muted border-muted-foreground/40"
                        : "bg-background border-border",
                  )}
                >
                  {estado === "pasado" && (
                    <CheckCircle2 className="w-3 h-3 text-muted-foreground" />
                  )}
                  {estado === "activo" && <div className="w-1.5 h-1.5 rounded-full bg-primary-foreground" />}
                </div>

                {/* Card */}
                <div
                  className={cn(
                    "rounded-lg border p-3 transition-colors",
                    estado === "activo"
                      ? "border-primary/50 bg-primary/5"
                      : estado === "pasado"
                        ? "border-border/50 bg-card/30 opacity-60"
                        : "border-border bg-card/40 hover:border-primary/30",
                  )}
                >
                  <div className="flex items-start justify-between flex-wrap gap-2 mb-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className={cn("text-[10px] font-mono uppercase", colorClasses)}>
                        {ETAPA_LABEL[h.etapa]}
                      </Badge>
                      {!h.oficial && (
                        <span className="text-[9px] font-mono uppercase text-amber-400/80">
                          Estimado
                        </span>
                      )}
                      {estado === "activo" && (
                        <Badge className="text-[10px] bg-primary/20 text-primary border-primary/40">
                          ● ACTIVO AHORA
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {formatearRango(h.fecha_inicio, h.fecha_fin)}
                      {estado === "futuro" && dias > 0 && (
                        <span className="text-primary">· en {dias} días</span>
                      )}
                    </div>
                  </div>
                  <h3 className="text-sm font-semibold">{h.titulo}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{h.descripcion}</p>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {h.cargos.map((c) => (
                      <span
                        key={c}
                        className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground border border-border"
                      >
                        {c.replace("_", " ")}
                      </span>
                    ))}
                    <span className="text-[9px] text-muted-foreground ml-auto italic">
                      Fuente: {h.fuente}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

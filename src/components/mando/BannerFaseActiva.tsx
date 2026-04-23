import { Link } from "react-router-dom";
import { Calendar, ChevronRight, Target } from "lucide-react";
import {
  getEtapaActual,
  ETAPA_LABEL,
  ETAPA_COLOR,
  formatearRango,
} from "@/lib/calendario-electoral";
import { FASE_DESCRIPCION } from "@/lib/candidatos/fase";
import { cn } from "@/lib/utils";

export function BannerFaseActiva() {
  const { etapa, faseCandidato, hito, diasParaProximo, proximo } = getEtapaActual();
  const colorClasses = ETAPA_COLOR[etapa];

  return (
    <div
      className={cn(
        "rounded-lg border p-3 flex items-center gap-3 flex-wrap",
        colorClasses,
      )}
    >
      <div className="flex items-center gap-2 flex-1 min-w-[280px]">
        <div className="w-9 h-9 rounded-md bg-background/40 border border-current/30 flex items-center justify-center shrink-0">
          <Target className="w-4 h-4" />
        </div>
        <div className="leading-tight">
          <div className="text-[10px] font-mono uppercase tracking-widest opacity-80">
            Etapa actual del proceso 2026-2027
          </div>
          <div className="text-sm font-bold flex items-center gap-2 flex-wrap">
            <span>{ETAPA_LABEL[etapa]}</span>
            {hito && (
              <span className="text-[10px] font-mono opacity-70 font-normal">
                {formatearRango(hito.fecha_inicio, hito.fecha_fin)}
              </span>
            )}
          </div>
          <p className="text-[11px] opacity-80 mt-0.5 max-w-2xl">
            {hito?.descripcion ?? FASE_DESCRIPCION[faseCandidato]}
          </p>
        </div>
      </div>

      {proximo && diasParaProximo !== null && diasParaProximo > 0 && (
        <div className="flex items-center gap-2 text-xs bg-background/40 border border-current/30 rounded-md px-2.5 py-1.5">
          <Calendar className="w-3.5 h-3.5 opacity-70" />
          <div className="leading-tight">
            <div className="text-[9px] font-mono uppercase opacity-70">Próximo hito</div>
            <div className="font-semibold">
              {diasParaProximo} días · {proximo.titulo}
            </div>
          </div>
        </div>
      )}

      <Link
        to="/calendario-electoral"
        className="inline-flex items-center gap-1 text-xs font-semibold bg-background/40 hover:bg-background/60 border border-current/40 rounded-md px-2.5 py-1.5 transition-colors"
      >
        Ver calendario completo
        <ChevronRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}

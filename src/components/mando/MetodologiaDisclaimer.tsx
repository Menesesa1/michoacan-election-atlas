import { useState } from "react";
import { Link } from "react-router-dom";
import { Info, ChevronDown, ChevronUp, ExternalLink, CheckCircle2, XCircle } from "lucide-react";

export function MetodologiaDisclaimer() {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 backdrop-blur">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 p-3 text-left"
      >
        <div className="flex items-center gap-2 min-w-0">
          <Info className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <span className="text-xs font-medium text-foreground">
            Metodología y fuentes · ¿Por qué no mostramos intención de voto semanal?
          </span>
        </div>
        {open ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        )}
      </button>

      {open && (
        <div className="px-3 pb-4 pt-1 space-y-3 text-[12px] leading-relaxed text-muted-foreground">
          <p>
            Esta plataforma <strong className="text-foreground">no muestra tracking semanal de intención de voto</strong>{" "}
            porque no operamos casa encuestadora propia ni contamos con ficha técnica auditable
            (muestra, método, margen de error, fechas de levantamiento). Publicar números semanales
            sin esa base sería opinión disfrazada de dato.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
            <div className="rounded-md bg-emerald-500/5 border border-emerald-500/20 p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
                  Lo que sí es real
                </span>
              </div>
              <ul className="space-y-1.5 text-[11px]">
                <li>
                  <strong className="text-foreground">Histórico electoral oficial</strong> INE / IEM
                  (2018, 2021, 2024) por sección, distrito y municipio.
                </li>
                <li>
                  <strong className="text-foreground">Sentimiento social</strong> calculado sobre
                  menciones reales de medios locales y redes públicas, clasificadas por IA
                  (positivo / neutro / negativo).
                </li>
                <li>
                  <strong className="text-foreground">Alertas de crisis y patrones CIB</strong>{" "}
                  detectados en tiempo real por los pipelines automatizados (cron 20–60 min).
                </li>
                <li>
                  <strong className="text-foreground">Google Trends</strong> estatal y por
                  candidato vía SerpApi, con contexto narrativo.
                </li>
              </ul>
            </div>

            <div className="rounded-md bg-destructive/5 border border-destructive/20 p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <XCircle className="w-3.5 h-3.5 text-destructive" />
                <span className="text-[11px] font-semibold text-destructive uppercase tracking-wider">
                  Lo que NO mostramos
                </span>
              </div>
              <ul className="space-y-1.5 text-[11px]">
                <li>Intención de voto semanal sin encuesta auditable detrás.</li>
                <li>Pronósticos cerrados de resultado (solo escenarios proyectivos).</li>
                <li>Comparativos multi-encuestadora (no operamos esa lógica).</li>
              </ul>
              <p className="mt-2 text-[10px] text-muted-foreground/80">
                Cuando se contrate tracking propio o de tercero con ficha técnica, se conecta
                como dataset y se reactiva la vista semanal.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <Link
              to="/fuentes"
              className="inline-flex items-center gap-1.5 text-[11px] text-primary hover:underline font-medium"
            >
              Ver metodología completa y fuentes
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

import { useMemo } from "react";
import { AlertTriangle, CheckCircle2, Info, Scale } from "lucide-react";
import { Link } from "react-router-dom";
import { inferirGenero } from "@/lib/paridad/inferir-genero";
import { validarPostulacion } from "@/lib/paridad/paridad-2027";
import { sugerenciaParidadPara } from "@/lib/paridad/territorio-resolver";
import type { NivelEstrategia } from "@/data/estrategia-templates";

interface Props {
  nivel: NivelEstrategia;
  territorio: string;
  partidoSigla?: string;
  nombreCandidato: string;
}

/**
 * Banner contextual que aparece dentro del formulario de candidato.
 * - Solo se muestra cuando hay sugerencia (diputados locales o ayuntamientos
 *   con histórico).
 * - Compara el género inferido del nombre del candidato con la sugerencia.
 */
export function ParidadAlert({ nivel, territorio, partidoSigla, nombreCandidato }: Props) {
  const sugerencia = useMemo(
    () => sugerenciaParidadPara(nivel, territorio, partidoSigla),
    [nivel, territorio, partidoSigla],
  );
  const generoCandidato = useMemo(
    () => inferirGenero(nombreCandidato),
    [nombreCandidato],
  );

  if (!sugerencia) return null;

  const validacion = validarPostulacion(generoCandidato.genero, sugerencia);

  const tono =
    validacion.nivel === "bloqueo"
      ? "destructive"
      : validacion.nivel === "advertencia"
        ? "warning"
        : "ok";

  const cls =
    tono === "destructive"
      ? "bg-destructive/10 border-destructive/40 text-destructive"
      : tono === "warning"
        ? "bg-amber-500/10 border-amber-500/40 text-amber-600 dark:text-amber-400"
        : "bg-emerald-500/10 border-emerald-500/40 text-emerald-700 dark:text-emerald-400";

  const Icon =
    tono === "destructive" ? AlertTriangle : tono === "warning" ? AlertTriangle : CheckCircle2;

  const generoSugLabel =
    sugerencia.generoSugerido === "M"
      ? "♀ Mujer"
      : sugerencia.generoSugerido === "H"
        ? "♂ Hombre"
        : "Sin restricción";

  const generoCandLabel =
    generoCandidato.genero === "M"
      ? "♀ mujer"
      : generoCandidato.genero === "H"
        ? "♂ hombre"
        : "género no detectado";

  return (
    <div className={`md:col-span-2 rounded-md border p-3 ${cls}`}>
      <div className="flex items-start gap-2">
        <Icon className="w-4 h-4 mt-0.5 shrink-0" />
        <div className="flex-1 text-xs space-y-1">
          <div className="font-semibold flex items-center gap-1.5">
            <Scale className="w-3.5 h-3.5" />
            Paridad 2027 — {sugerencia.bloqueCompetitividad === "alta" ? "bloque alta competitividad" : `bloque ${sugerencia.bloqueCompetitividad}`}
          </div>
          <div>
            Sugerencia de género para este territorio:{" "}
            <strong>{generoSugLabel}</strong>
            {sugerencia.confianza !== "alta" && (
              <span className="opacity-70"> · confianza {sugerencia.confianza}</span>
            )}
          </div>
          <div className="opacity-90">{sugerencia.motivo}</div>
          {nombreCandidato.trim().length >= 2 && (
            <div className="pt-1 border-t border-current/20 mt-2">
              Candidato detectado como <strong>{generoCandLabel}</strong>
              {generoCandidato.basadoEn !== "sin coincidencia" && (
                <span className="opacity-70"> ({generoCandidato.basadoEn})</span>
              )}
              . {validacion.mensaje}
            </div>
          )}
          <div className="pt-1">
            <Link
              to="/paridad-genero"
              target="_blank"
              className="inline-flex items-center gap-1 underline opacity-80 hover:opacity-100"
            >
              <Info className="w-3 h-3" /> Ver módulo de paridad
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

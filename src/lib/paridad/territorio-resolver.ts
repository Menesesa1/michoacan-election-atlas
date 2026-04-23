// Resuelve el "id territorial" usado por el motor de paridad a partir
// del par (nivel, territorio) que maneja el formulario de candidatos.

import { MUNICIPIOS_ESTRATEGICOS } from "@/data/locales/ayuntamientos";
import {
  sugerenciaParidadDistrito,
  sugerenciaParidadMunicipio,
} from "@/lib/paridad/historico-genero";
import type { SugerenciaParidad } from "@/lib/paridad/paridad-2027";
import type { NivelEstrategia } from "@/data/estrategia-templates";

/** Extrae el número de distrito de strings tipo "Distrito 04 - Hidalgo" o "Distrito 4". */
export function extraerNumeroDistrito(territorio: string): number | null {
  const m = territorio.match(/distrito\s*0*(\d{1,2})/i);
  if (!m) return null;
  const n = Number(m[1]);
  return n >= 1 && n <= 24 ? n : null;
}

/** Resuelve clave INEGI del municipio si está en el catálogo estratégico. */
export function resolverClaveMunicipio(territorio: string): number | null {
  const t = territorio.trim().toLowerCase();
  if (!t) return null;
  // Match exacto, o municipio incluido en la etiqueta (p.ej. "Hidalgo (Cd. Hidalgo)").
  const hit = MUNICIPIOS_ESTRATEGICOS.find(
    (m) =>
      m.nombre.toLowerCase() === t ||
      m.nombre.toLowerCase().includes(t) ||
      t.includes(m.nombre.toLowerCase()),
  );
  return hit?.clave ?? null;
}

/**
 * Devuelve sugerencia de paridad si el (nivel, territorio) puede mapearse
 * al motor histórico. Para gobernador y diputados federales devuelve null
 * (la paridad horizontal aplica a fórmulas locales/municipales).
 */
export function sugerenciaParidadPara(
  nivel: NivelEstrategia,
  territorio: string,
  partidoEvaluado?: string,
): SugerenciaParidad | null {
  if (!territorio) return null;
  if (nivel === "diputados") {
    const dist = extraerNumeroDistrito(territorio);
    if (dist === null) return null;
    return sugerenciaParidadDistrito(dist, partidoEvaluado);
  }
  if (nivel === "ayuntamientos") {
    const clave = resolverClaveMunicipio(territorio);
    if (clave === null) return null;
    return sugerenciaParidadMunicipio(clave, partidoEvaluado);
  }
  return null;
}

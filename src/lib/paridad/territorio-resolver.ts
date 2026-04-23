// Resuelve el "id territorial" usado por el motor de paridad a partir
// del par (nivel, territorio) que maneja el formulario de candidatos.

import { MUNICIPIOS_MICHOACAN_113, buscarMunicipio } from "@/data/locales/municipios-catalogo";
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

/** Resuelve clave INEGI del municipio (catálogo completo de 113). */
export function resolverClaveMunicipio(territorio: string): number | null {
  if (!territorio) return null;
  // Limpia paréntesis tipo "Hidalgo (Cd. Hidalgo)"
  const limpio = territorio.replace(/\(.*?\)/g, "").trim();
  const m = buscarMunicipio(limpio);
  if (m) return m.clave;
  // Fallback: contención parcial bidireccional
  const norm = (s: string) =>
    s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const q = norm(limpio);
  const hit = MUNICIPIOS_MICHOACAN_113.find(
    (mm) => norm(mm.nombre).includes(q) || q.includes(norm(mm.nombre)),
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

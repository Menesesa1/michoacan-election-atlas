// Helpers que cruzan datasets locales (ayuntamientos, diputados locales) con
// la inferencia de género para construir el histórico de cada territorio.

import { AYUNTAMIENTOS, type PresidenciaMunicipal } from "@/data/locales/ayuntamientos";
import { DIPUTADOS_LOCALES, historicoDistrito } from "@/data/locales/diputados-locales";
import { inferirGeneroConOverride, type Genero } from "./inferir-genero";
import { sugerirGenero2027, type HistoricoTerritorial, type SugerenciaParidad } from "./paridad-2027";

const STORAGE_KEY = "paridad-overrides-v1";

type OverrideKey = string; // `ayto:<clave>:<anio>` o `dip:<distrito>:<anio>`

function loadOverrides(): Record<OverrideKey, Genero> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function saveOverrides(o: Record<OverrideKey, Genero>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(o));
}

export function setOverrideGenero(key: OverrideKey, genero: Genero | null) {
  const all = loadOverrides();
  if (genero === null) delete all[key];
  else all[key] = genero;
  saveOverrides(all);
}

export function getOverrideGenero(key: OverrideKey): Genero | undefined {
  return loadOverrides()[key];
}

export interface AyuntamientoConGenero extends PresidenciaMunicipal {
  genero: Genero;
  generoConfianza: "alta" | "media" | "baja";
  generoBasadoEn: string;
  generoOverridden: boolean;
  overrideKey: OverrideKey;
}

export function ayuntamientosConGenero(): AyuntamientoConGenero[] {
  const overrides = loadOverrides();
  return AYUNTAMIENTOS.map((a) => {
    const key: OverrideKey = `ayto:${a.municipioClave}:${a.anio}`;
    const inf = inferirGeneroConOverride(a.presidente, overrides[key]);
    return {
      ...a,
      genero: inf.genero,
      generoConfianza: inf.confianza,
      generoBasadoEn: inf.basadoEn,
      generoOverridden: inf.overridden,
      overrideKey: key,
    };
  });
}

export function historicoMunicipioConGenero(clave: number): AyuntamientoConGenero[] {
  return ayuntamientosConGenero()
    .filter((a) => a.municipioClave === clave)
    .sort((a, b) => a.anio - b.anio);
}

export function sugerenciaParidadMunicipio(clave: number, partidoEvaluado?: string): SugerenciaParidad {
  const hist = historicoMunicipioConGenero(clave).map<HistoricoTerritorial>((a) => ({
    anio: a.anio,
    generoGanador: a.genero,
    partidoGanador: a.partidoGanador,
    porcentajeGanador: a.porcentajeGanador,
  }));
  return sugerirGenero2027(hist, partidoEvaluado);
}

// ====================================================================
// Diputados locales: el dataset NO trae nombre del candidato.
// Por eso permitimos que el usuario defina manualmente el género histórico
// del ganador por distrito × año (override directo, sin inferencia).
// ====================================================================
export interface DiputadoConGenero {
  anio: number;
  distrito: number;
  ganador: string;
  porcentajeGanador: number;
  genero: Genero;
  generoOverridden: boolean;
  overrideKey: OverrideKey;
}

export function diputadosConGenero(): DiputadoConGenero[] {
  const overrides = loadOverrides();
  return DIPUTADOS_LOCALES.map((d) => {
    const key: OverrideKey = `dip:${d.distrito}:${d.anio}`;
    const totalVotos = Object.values(d.votosPorPartido).reduce<number>((s, v) => s + (v ?? 0), 0);
    const pct = totalVotos > 0 ? (d.votosGanador / totalVotos) * 100 : 0;
    return {
      anio: d.anio,
      distrito: d.distrito,
      ganador: d.ganador,
      porcentajeGanador: pct,
      genero: overrides[key] ?? "ambiguo",
      generoOverridden: !!overrides[key],
      overrideKey: key,
    };
  });
}

export function historicoDistritoConGenero(distrito: number): DiputadoConGenero[] {
  return diputadosConGenero()
    .filter((d) => d.distrito === distrito)
    .sort((a, b) => a.anio - b.anio);
}

export function sugerenciaParidadDistrito(distrito: number, partidoEvaluado?: string): SugerenciaParidad {
  const hist = historicoDistritoConGenero(distrito).map<HistoricoTerritorial>((d) => ({
    anio: d.anio,
    generoGanador: d.genero,
    partidoGanador: d.ganador,
    porcentajeGanador: d.porcentajeGanador,
  }));
  return sugerirGenero2027(hist, partidoEvaluado);
}

/** Usado por la página de admin: lista todos los registros con confianza baja para revisión. */
export function registrosParaRevisar(): {
  tipo: "ayto" | "dip";
  key: OverrideKey;
  etiqueta: string;
  generoActual: Genero;
  confianza: "alta" | "media" | "baja";
}[] {
  const result: ReturnType<typeof registrosParaRevisar> = [];
  for (const a of ayuntamientosConGenero()) {
    if (a.generoConfianza === "baja" || a.genero === "ambiguo") {
      result.push({
        tipo: "ayto",
        key: a.overrideKey,
        etiqueta: `${a.municipio} ${a.anio} — ${a.presidente}`,
        generoActual: a.genero,
        confianza: a.generoConfianza,
      });
    }
  }
  for (const d of diputadosConGenero()) {
    if (d.genero === "ambiguo") {
      result.push({
        tipo: "dip",
        key: d.overrideKey,
        etiqueta: `Distrito ${d.distrito} (${d.anio}) — ${d.ganador}`,
        generoActual: d.genero,
        confianza: "baja",
      });
    }
  }
  return result;
}

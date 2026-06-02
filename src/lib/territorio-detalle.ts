// Detalle territorial por sección: localidades + colonias del catálogo INE.
// La sección conserva su peso oficial (Lista Nominal); localidades y colonias
// son lista descriptiva (qué la compone), sin estimaciones cuantitativas.

export interface LocalidadSec {
  n: string;
  t: "U" | "M" | "R"; // Urbana / Mixta / Rural
}
export interface ColoniaSec {
  n: string;
  tc: string;
  cp: string;
}
export interface DetalleLocalidades {
  cabecera: string;
  total: number;
  lista: LocalidadSec[];
}
export interface DetalleColonias {
  total: number;
  lista: ColoniaSec[];
}

interface LocPayload {
  por_seccion: Record<string, DetalleLocalidades>;
  buscar: Record<string, number[]>;
}
interface ColPayload {
  por_seccion: Record<string, DetalleColonias>;
  buscar: Record<string, number[]>;
}

let locCache: LocPayload | null = null;
let colCache: ColPayload | null = null;
let inflight: Promise<void> | null = null;

export async function loadTerritorioDetalle(): Promise<void> {
  if (locCache && colCache) return;
  if (inflight) return inflight;
  inflight = (async () => {
    const [l, c] = await Promise.all([
      fetch("/data/localidades-por-seccion.json").then((r) => r.json()),
      fetch("/data/colonias-por-seccion.json").then((r) => r.json()),
    ]);
    locCache = l;
    colCache = c;
  })();
  return inflight;
}

export function getLocalidadesDeSeccion(sec: number): DetalleLocalidades | null {
  return locCache?.por_seccion[String(sec)] ?? null;
}

export function getColoniasDeSeccion(sec: number): DetalleColonias | null {
  return colCache?.por_seccion[String(sec)] ?? null;
}

/** Búsqueda inversa: nombre de localidad/colonia → secciones donde aparece. */
export function buscarTerritorio(query: string): {
  localidades: Array<{ nombre: string; secciones: number[] }>;
  colonias: Array<{ nombre: string; secciones: number[] }>;
} {
  const q = query.trim().toUpperCase();
  if (!q || q.length < 3) return { localidades: [], colonias: [] };
  const localidades = Object.entries(locCache?.buscar ?? {})
    .filter(([k]) => k.includes(q))
    .slice(0, 20)
    .map(([nombre, secciones]) => ({ nombre, secciones }));
  const colonias = Object.entries(colCache?.buscar ?? {})
    .filter(([k]) => k.includes(q))
    .slice(0, 20)
    .map(([nombre, secciones]) => ({ nombre, secciones }));
  return { localidades, colonias };
}

export const TIPO_LOCALIDAD_LABEL: Record<"U" | "M" | "R", string> = {
  U: "Urbana",
  M: "Mixta",
  R: "Rural",
};

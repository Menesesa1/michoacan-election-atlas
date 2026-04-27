// Loader para padrón electoral oficial INE-DERFE Michoacán (corte 2026)
// Fuente: CSV oficial INE con desglose por sección, edad, sexo y no binario.
// Estructura jerárquica: sección → municipio / distrito federal → estado.

import type { DemograficoDistrito, RangoEdad } from "@/data/demographic-types";
import { RANGOS_EDAD_INE } from "@/data/demographic-types";

// Mapeo buckets oficiales INE → rangos UI
const BUCKET_MAP: Record<string, string> = {
  "18": "18-19",
  "19": "18-19",
  "20_24": "20-24",
  "25_29": "25-29",
  "30_34": "30-34",
  "35_39": "35-39",
  "40_44": "40-44",
  "45_49": "45-49",
  "50_54": "50-54",
  "55_59": "55-59",
  "60_64": "60-64",
  "65_Y_MAS": "65+",
};

interface PadronBucket { h: number; m: number; nb: number; total: number }

interface PadronAggBase {
  secciones: number;
  lista_hombres: number;
  lista_mujeres: number;
  lista_no_binario: number;
  lista_total: number;
  padron_hombres: number;
  padron_mujeres: number;
  padron_no_binario: number;
  padron_total: number;
  por_edad: Record<string, PadronBucket>;
}

interface PadronDistrito extends PadronAggBase {
  CLAVE_DISTRITO: number;
  CABECERA_DISTRITAL: string;
}
interface PadronMunicipio extends PadronAggBase {
  CLAVE_MUNICIPIO: number;
  NOMBRE_MUNICIPIO: string;
}

export interface PadronOficial {
  fuente: string;
  cortes: { edad_rangos: string; sexo: string };
  entidad: { clave: number; nombre: string };
  buckets_edad: string[];
  estado: PadronAggBase;
  distritos: PadronDistrito[];
  municipios: PadronMunicipio[];
}

// Detalle por sección (archivo separado)
export interface PadronSeccion {
  sec: number;        // Clave de sección
  dis: number;        // Distrito federal (1-11)
  mun: number;        // Clave INEGI municipio
  lh: number; lm: number; lnb: number; lt: number; // Lista nominal
  ph: number; pm: number; pnb: number; pt: number; // Padrón electoral
}

let cached: PadronOficial | null = null;
let cachedSecciones: PadronSeccion[] | null = null;
let bySec: Map<number, PadronSeccion> | null = null;

export async function loadPadronOficial(): Promise<PadronOficial> {
  if (cached) return cached;
  const res = await fetch("/data/padron-michoacan-2026.json");
  if (!res.ok) throw new Error("No se pudo cargar el padrón oficial");
  cached = (await res.json()) as PadronOficial;
  return cached;
}

/** Detalle por sección — usar para agregaciones libres por distrito local, polígonos, etc. */
export async function loadPadronSecciones(): Promise<PadronSeccion[]> {
  if (cachedSecciones) return cachedSecciones;
  const res = await fetch("/data/padron-secciones-2026.json");
  if (!res.ok) throw new Error("No se pudo cargar el detalle por sección");
  cachedSecciones = (await res.json()) as PadronSeccion[];
  bySec = new Map(cachedSecciones.map((s) => [s.sec, s]));
  return cachedSecciones;
}

export async function getSeccionPadron(sec: number): Promise<PadronSeccion | null> {
  if (!bySec) await loadPadronSecciones();
  return bySec?.get(sec) ?? null;
}

/** Agregación arbitraria (suma) sobre un conjunto de secciones — núcleo de la jerarquía cruzada. */
export async function agregarPorSecciones(secciones: number[]): Promise<{
  lista_hombres: number; lista_mujeres: number; lista_no_binario: number; lista_total: number;
  padron_hombres: number; padron_mujeres: number; padron_no_binario: number; padron_total: number;
  secciones: number;
}> {
  if (!bySec) await loadPadronSecciones();
  const acc = { lista_hombres:0, lista_mujeres:0, lista_no_binario:0, lista_total:0,
                padron_hombres:0, padron_mujeres:0, padron_no_binario:0, padron_total:0,
                secciones: 0 };
  for (const s of secciones) {
    const r = bySec!.get(s); if (!r) continue;
    acc.lista_hombres += r.lh; acc.lista_mujeres += r.lm; acc.lista_no_binario += r.lnb; acc.lista_total += r.lt;
    acc.padron_hombres += r.ph; acc.padron_mujeres += r.pm; acc.padron_no_binario += r.pnb; acc.padron_total += r.pt;
    acc.secciones += 1;
  }
  return acc;
}

function bucketsToRangos(porEdad: Record<string, PadronBucket>): RangoEdad[] {
  const acc: Record<string, RangoEdad> = {};
  RANGOS_EDAD_INE.forEach((r) => (acc[r] = { rango: r, hombres: 0, mujeres: 0, total: 0 }));
  for (const [bucket, vals] of Object.entries(porEdad)) {
    const target = BUCKET_MAP[bucket];
    if (!target || !acc[target]) continue;
    acc[target].hombres += vals.h;
    acc[target].mujeres += vals.m;
    acc[target].total += vals.h + vals.m + vals.nb;
  }
  return RANGOS_EDAD_INE.map((r) => acc[r]);
}

function poblacionPrincipal(rangos: RangoEdad[]): string {
  if (!rangos.length) return "—";
  const top = [...rangos].sort((a, b) => b.total - a.total)[0];
  return top.rango;
}

/**
 * Convierte el padrón oficial a estructura DemograficoDistrito para el panel.
 * Filtra a distritos federales válidos 1-11 (Michoacán post-distritación 2022).
 */
export function padronToDistritosFederales(p: PadronOficial): DemograficoDistrito[] {
  return p.distritos
    .filter((d) => d.CLAVE_DISTRITO >= 1 && d.CLAVE_DISTRITO <= 11)
    .map((d) => {
      const rangos = bucketsToRangos(d.por_edad);
      return {
        distritoId: d.CLAVE_DISTRITO,
        tipo: "federal" as const,
        listaNominal: d.lista_total,
        hombres: d.lista_hombres,
        mujeres: d.lista_mujeres,
        secciones: d.secciones,
        rangoEdad: rangos,
        poblacionPrincipal: poblacionPrincipal(rangos),
      };
    });
}

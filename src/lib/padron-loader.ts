// Loader para padrón electoral oficial INE-DERFE Michoacán (cortes 2026)
// Combina datasets: rangos de edad (19-mar-2026) + sexo (09-abr-2026)

import type { DemograficoDistrito, RangoEdad } from "@/data/demographic-types";
import { RANGOS_EDAD_INE } from "@/data/demographic-types";

// Mapeo de buckets INE → rangos UI
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
interface PadronDistrito {
  CLAVE_DISTRITO: number;
  CABECERA_DISTRITAL: string;
  secciones: number;
  lista_hombres: number;
  lista_mujeres: number;
  lista_no_binario: number;
  lista_total: number;
  por_edad: Record<string, PadronBucket>;
}
interface PadronMunicipio {
  CLAVE_MUNICIPIO: number;
  NOMBRE_MUNICIPIO: string;
  secciones: number;
  lista_hombres: number;
  lista_mujeres: number;
  lista_no_binario: number;
  lista_total: number;
  por_edad: Record<string, PadronBucket>;
}
export interface PadronOficial {
  fuente: string;
  cortes: { edad_rangos: string; sexo: string };
  entidad: { clave: number; nombre: string };
  buckets_edad: string[];
  estado: {
    lista_hombres: number;
    lista_mujeres: number;
    lista_no_binario: number;
    lista_total: number;
    secciones: number;
    por_edad: Record<string, PadronBucket>;
  };
  distritos: PadronDistrito[];
  municipios: PadronMunicipio[];
}

let cached: PadronOficial | null = null;

export async function loadPadronOficial(): Promise<PadronOficial> {
  if (cached) return cached;
  const res = await fetch("/data/padron-michoacan-2026.json");
  if (!res.ok) throw new Error("No se pudo cargar el padrón oficial");
  cached = (await res.json()) as PadronOficial;
  return cached;
}

function bucketsToRangos(porEdad: Record<string, PadronBucket>): RangoEdad[] {
  // Agregar buckets a rangos UI (ej: 18 + 19 → "18-19")
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
 * Filtra distrito 12 (residentes en el extranjero) por defecto.
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

// Construye un DemograficoDistrito "virtual" a partir del padrón oficial y un
// TerritorioResuelto (gobernador / dip-federal / dip-local / ayuntamiento).
//
// Estrategias de agregación según tipo:
//  - gobernador           → estado completo
//  - diputado_federal     → distrito federal directo del padrón
//  - ayuntamiento         → municipio directo del padrón
//  - diputado_local       → suma ponderada de municipios del distrito local
//                           (aproximación: si un municipio cae en >1 distrito local,
//                            se reparte proporcionalmente por # de secciones).
import type { DemograficoDistrito } from "@/data/demographic-types";
import { RANGOS_EDAD_INE } from "@/data/demographic-types";
import type { PadronOficial } from "./padron-loader";
import type { TerritorioResuelto } from "./territorio-cruzado";
import { infoDistritoLocal } from "./secciones-catalogo";

const BUCKET_MAP: Record<string, string> = {
  "18": "18-19", "19": "18-19",
  "20_24": "20-24", "25_29": "25-29", "30_34": "30-34", "35_39": "35-39",
  "40_44": "40-44", "45_49": "45-49", "50_54": "50-54", "55_59": "55-59",
  "60_64": "60-64", "65_Y_MAS": "65+",
};

interface BucketAgg { h: number; m: number; nb: number; total: number }

function emptyBuckets(): Record<string, BucketAgg> {
  const acc: Record<string, BucketAgg> = {};
  Object.keys(BUCKET_MAP).forEach((k) => (acc[k] = { h: 0, m: 0, nb: 0, total: 0 }));
  return acc;
}

function bucketsToRangos(porEdad: Record<string, BucketAgg>) {
  const acc: Record<string, { rango: string; hombres: number; mujeres: number; total: number }> = {};
  RANGOS_EDAD_INE.forEach((r) => (acc[r] = { rango: r, hombres: 0, mujeres: 0, total: 0 }));
  for (const [bucket, vals] of Object.entries(porEdad)) {
    const target = BUCKET_MAP[bucket];
    if (!target) continue;
    acc[target].hombres += vals.h;
    acc[target].mujeres += vals.m;
    acc[target].total += vals.h + vals.m + vals.nb;
  }
  return RANGOS_EDAD_INE.map((r) => acc[r]);
}

function poblacionPrincipal(rangos: { rango: string; total: number }[]) {
  if (!rangos.length) return "—";
  return [...rangos].sort((a, b) => b.total - a.total)[0].rango;
}

function escalarBuckets(src: Record<string, BucketAgg>, factor: number): Record<string, BucketAgg> {
  const out: Record<string, BucketAgg> = {};
  for (const [k, v] of Object.entries(src)) {
    out[k] = { h: v.h * factor, m: v.m * factor, nb: v.nb * factor, total: v.total * factor };
  }
  return out;
}

function sumarBuckets(a: Record<string, BucketAgg>, b: Record<string, BucketAgg>) {
  for (const [k, v] of Object.entries(b)) {
    if (!a[k]) a[k] = { h: 0, m: 0, nb: 0, total: 0 };
    a[k].h += v.h;
    a[k].m += v.m;
    a[k].nb += v.nb;
    a[k].total += v.total;
  }
}

export function padronPorTerritorio(
  padron: PadronOficial,
  t: TerritorioResuelto,
): DemograficoDistrito | null {
  if (!padron) return null;

  // Estatal
  if (t.tipo === "gobernador") {
    const rangos = bucketsToRangos(padron.estado.por_edad as any);
    return {
      distritoId: 0,
      tipo: "federal",
      listaNominal: padron.estado.lista_total,
      hombres: padron.estado.lista_hombres,
      mujeres: padron.estado.lista_mujeres,
      secciones: padron.estado.secciones,
      rangoEdad: rangos,
      poblacionPrincipal: poblacionPrincipal(rangos),
    };
  }

  // Distrito federal
  if (t.tipo === "diputado_federal") {
    const d = padron.distritos.find((x) => x.CLAVE_DISTRITO === t.clave);
    if (!d) return null;
    const rangos = bucketsToRangos(d.por_edad as any);
    return {
      distritoId: d.CLAVE_DISTRITO,
      tipo: "federal",
      listaNominal: d.lista_total,
      hombres: d.lista_hombres,
      mujeres: d.lista_mujeres,
      secciones: d.secciones,
      rangoEdad: rangos,
      poblacionPrincipal: poblacionPrincipal(rangos),
    };
  }

  // Ayuntamiento
  if (t.tipo === "ayuntamiento") {
    const m = padron.municipios.find((x) => x.CLAVE_MUNICIPIO === t.clave);
    if (!m) return null;
    const rangos = bucketsToRangos(m.por_edad as any);
    return {
      distritoId: m.CLAVE_MUNICIPIO,
      tipo: "local",
      listaNominal: m.lista_total,
      hombres: m.lista_hombres,
      mujeres: m.lista_mujeres,
      secciones: m.secciones,
      rangoEdad: rangos,
      poblacionPrincipal: poblacionPrincipal(rangos),
    };
  }

  // Distrito local: aproximar sumando municipios proporcionales a las
  // secciones del distrito que aporta cada municipio.
  if (t.tipo === "diputado_local") {
    const info = infoDistritoLocal(t.clave);
    if (!info) return null;
    const aggBuckets = emptyBuckets();
    let listaTotal = 0;
    let listaH = 0;
    let listaM = 0;
    let secs = 0;

    for (const munClave of t.municipios) {
      const m = padron.municipios.find((x) => x.CLAVE_MUNICIPIO === munClave);
      if (!m) continue;
      // Fracción de secciones del municipio que pertenecen al distrito local.
      const seccionesMunEnDL = info.secciones.filter((sec) => {
        // Verificar si la sección pertenece a este municipio en t.secciones.
        return t.secciones.has(sec);
      }).length;
      const factor = m.secciones > 0 ? seccionesMunEnDL / m.secciones : 0;
      if (factor <= 0) continue;
      listaTotal += m.lista_total * factor;
      listaH += m.lista_hombres * factor;
      listaM += m.lista_mujeres * factor;
      secs += seccionesMunEnDL;
      sumarBuckets(aggBuckets, escalarBuckets(m.por_edad as any, factor));
    }

    const rangos = bucketsToRangos(aggBuckets);
    return {
      distritoId: t.clave,
      tipo: "local",
      listaNominal: Math.round(listaTotal),
      hombres: Math.round(listaH),
      mujeres: Math.round(listaM),
      secciones: secs,
      rangoEdad: rangos.map((r) => ({
        rango: r.rango,
        hombres: Math.round(r.hombres),
        mujeres: Math.round(r.mujeres),
        total: Math.round(r.total),
      })),
      poblacionPrincipal: poblacionPrincipal(rangos),
    };
  }

  return null;
}

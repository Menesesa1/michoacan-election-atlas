// Resuelve la jerarquía territorial cruzada para Michoacán a partir del
// catálogo INE de secciones (SECCION.dbf) + distritación local 2016.
//
// Dado un (tipoEleccion, claveTerritorio) devuelve:
//  - secciones: Set<number> con todas las secciones que componen el territorio
//  - municipios: claves INEGI de municipios contenidos
//  - distritosLocales: ids IEM (1..24) que cruzan
//  - distritosFederales: ids INE (1..11/12) que cruzan
//
// La unidad atómica SIEMPRE es la sección — todo se agrega sumando secciones.

import {
  getCatalogoSync,
  getDistritosLocales,
  lookupSeccion,
  nombreMunicipio,
  MUNICIPIOS_MICH,
  type SeccionCat,
} from "./secciones-catalogo";

export type TipoEleccion =
  | "gobernador"
  | "diputado_federal"
  | "diputado_local"
  | "ayuntamiento";

export interface OpcionTerritorio {
  /** Clave única del territorio dentro de su tipo (numérica). */
  clave: number;
  /** Etiqueta legible para UI. */
  label: string;
  /** Subtítulo opcional (cabecera, municipios, etc.). */
  sub?: string;
}

export interface TerritorioResuelto {
  tipo: TipoEleccion;
  clave: number;
  label: string;
  secciones: Set<number>;
  municipios: number[];
  distritosLocales: number[];
  distritosFederales: number[];
}

const ESTATAL_KEY = 0;

/** Devuelve las opciones de territorio para el tipo de elección dado. */
export function opcionesTerritorio(tipo: TipoEleccion): OpcionTerritorio[] {
  switch (tipo) {
    case "gobernador":
      return [{ clave: ESTATAL_KEY, label: "Estatal · Michoacán", sub: "1 territorio" }];
    case "diputado_federal": {
      const cat = getCatalogoSync();
      const distritos = new Set<number>();
      cat?.forEach((s) => distritos.add(s.dis));
      return Array.from(distritos)
        .sort((a, b) => a - b)
        .map((d) => ({
          clave: d,
          label: `Distrito Federal ${String(d).padStart(2, "0")}`,
        }));
    }
    case "diputado_local":
      return getDistritosLocales().map((d) => ({
        clave: d.distrito,
        label: `Distrito Local ${String(d.distrito).padStart(2, "0")}`,
        sub: d.cabecera,
      }));
    case "ayuntamiento":
      return Object.entries(MUNICIPIOS_MICH)
        .map(([k, nombre]) => ({ clave: Number(k), label: nombre }))
        .sort((a, b) => a.label.localeCompare(b.label, "es"));
  }
}

/** Resuelve la jerarquía cruzada (secciones + municipios + distritos local/federal). */
export function resolverTerritorio(
  tipo: TipoEleccion,
  clave: number,
): TerritorioResuelto {
  const cat = getCatalogoSync() ?? [];
  const dlCat = getDistritosLocales();

  let secciones: SeccionCat[] = [];
  let label = "";

  switch (tipo) {
    case "gobernador":
      secciones = cat;
      label = "Estatal · Michoacán";
      break;
    case "diputado_federal":
      secciones = cat.filter((s) => s.dis === clave);
      label = `Distrito Federal ${String(clave).padStart(2, "0")}`;
      break;
    case "diputado_local": {
      const info = dlCat.find((d) => d.distrito === clave);
      const setSec = new Set(info?.secciones ?? []);
      secciones = cat.filter((s) => setSec.has(s.sec));
      label = info
        ? `Distrito Local ${String(clave).padStart(2, "0")} · ${info.cabecera}`
        : `Distrito Local ${clave}`;
      break;
    }
    case "ayuntamiento":
      secciones = cat.filter((s) => s.mun === clave);
      label = `${nombreMunicipio(clave)} (Ayuntamiento)`;
      break;
  }

  const setSec = new Set(secciones.map((s) => s.sec));
  const munSet = new Set<number>();
  const dlSet = new Set<number>();
  const dfSet = new Set<number>();

  for (const s of secciones) {
    munSet.add(s.mun);
    dfSet.add(s.dis);
    const dl = dlCat.find((d) => d.secciones.includes(s.sec));
    if (dl) dlSet.add(dl.distrito);
  }

  return {
    tipo,
    clave,
    label,
    secciones: setSec,
    municipios: Array.from(munSet).sort((a, b) => a - b),
    distritosLocales: Array.from(dlSet).sort((a, b) => a - b),
    distritosFederales: Array.from(dfSet).sort((a, b) => a - b),
  };
}

/** Etiqueta corta para chip de tipo de elección. */
export function etiquetaTipoEleccion(tipo: TipoEleccion): string {
  switch (tipo) {
    case "gobernador":
      return "Gobernatura";
    case "diputado_federal":
      return "Diputación Federal";
    case "diputado_local":
      return "Diputación Local";
    case "ayuntamiento":
      return "Ayuntamiento";
  }
}

/** Etiqueta del input de territorio según tipo. */
export function etiquetaTerritorio(tipo: TipoEleccion): string {
  switch (tipo) {
    case "gobernador":
      return "Ámbito";
    case "diputado_federal":
      return "Distrito federal";
    case "diputado_local":
      return "Distrito local";
    case "ayuntamiento":
      return "Municipio";
  }
}

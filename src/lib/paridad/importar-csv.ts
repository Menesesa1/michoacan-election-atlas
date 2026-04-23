// Importador de CSV con ganadoras/ganadores históricos para alimentar el motor de paridad.
// Acepta dos esquemas:
//   1) Ayuntamientos:  anio,municipio,genero[,nombre]
//   2) Distritos local: anio,distrito,genero
//
// La detección del esquema es automática (por columnas presentes).
// Resultado: usa setOverrideGenero para inyectar el género histórico.

import Papa from "papaparse";
import { setOverrideGenero } from "./historico-genero";
import { MUNICIPIOS_MICHOACAN_113 } from "@/data/locales/municipios-catalogo";
import { AYUNTAMIENTOS } from "@/data/locales/ayuntamientos";
import type { Genero } from "./inferir-genero";

const ANIOS_VALIDOS = new Set([2015, 2018, 2021, 2024]);

function normalizar(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]/g, "")
    .trim();
}

function parseGenero(raw: string): Genero | null {
  const v = raw.trim().toLowerCase();
  if (["m", "mujer", "f", "femenino"].includes(v)) return "M";
  if (["h", "hombre", "masculino", "varon", "varón"].includes(v)) return "H";
  if (["ambiguo", "sd", "sin definir", ""].includes(v)) return "ambiguo";
  return null;
}

export interface ImportRow {
  fila: number;
  tipo: "ayto" | "dip" | null;
  ok: boolean;
  mensaje: string;
  overrideKey?: string;
  genero?: Genero;
}

export interface ImportResumen {
  totalFilas: number;
  aplicadas: number;
  errores: number;
  detalle: ImportRow[];
}

function buscarMunicipioClave(nombre: string): number | null {
  const n = normalizar(nombre);
  // Match exacto primero
  let hit = MUNICIPIOS_MICHOACAN_113.find((m) => normalizar(m.nombre) === n);
  if (hit) return hit.clave;
  // Match parcial
  hit = MUNICIPIOS_MICHOACAN_113.find(
    (m) => normalizar(m.nombre).includes(n) || n.includes(normalizar(m.nombre)),
  );
  return hit?.clave ?? null;
}

function existeRegistroAyto(anio: number, clave: number): boolean {
  return AYUNTAMIENTOS.some((a) => a.anio === anio && a.municipioClave === clave);
}

export function importarCSVGanadores(csvText: string): ImportResumen {
  const parsed = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().toLowerCase(),
  });

  const detalle: ImportRow[] = [];
  let aplicadas = 0;
  let errores = 0;

  parsed.data.forEach((row, idx) => {
    const fila = idx + 2; // +1 header, +1 1-indexed
    const anioRaw = row["anio"] ?? row["año"] ?? row["year"];
    const anio = Number(anioRaw);
    const generoRaw = row["genero"] ?? row["género"] ?? row["sexo"] ?? "";
    const genero = parseGenero(generoRaw);

    if (!ANIOS_VALIDOS.has(anio)) {
      detalle.push({ fila, tipo: null, ok: false, mensaje: `Año inválido: "${anioRaw}" (válidos: 2015, 2018, 2021, 2024)` });
      errores++;
      return;
    }
    if (!genero) {
      detalle.push({ fila, tipo: null, ok: false, mensaje: `Género inválido: "${generoRaw}"` });
      errores++;
      return;
    }

    const distritoRaw = row["distrito"];
    const municipioRaw = row["municipio"] ?? row["municipality"];

    // Esquema diputados
    if (distritoRaw && !municipioRaw) {
      const distrito = Number(distritoRaw);
      if (!Number.isInteger(distrito) || distrito < 1 || distrito > 24) {
        detalle.push({ fila, tipo: "dip", ok: false, mensaje: `Distrito fuera de rango: "${distritoRaw}"` });
        errores++;
        return;
      }
      const key = `dip:${distrito}:${anio}`;
      setOverrideGenero(key, genero === "ambiguo" ? null : genero);
      detalle.push({ fila, tipo: "dip", ok: true, mensaje: `Distrito ${distrito} ${anio} → ${genero}`, overrideKey: key, genero });
      aplicadas++;
      return;
    }

    // Esquema ayuntamientos
    if (municipioRaw) {
      const clave = buscarMunicipioClave(municipioRaw);
      if (!clave) {
        detalle.push({ fila, tipo: "ayto", ok: false, mensaje: `Municipio no reconocido: "${municipioRaw}"` });
        errores++;
        return;
      }
      if (!existeRegistroAyto(anio, clave)) {
        // Permitido pero advertimos: el override sólo aplicará cuando exista el registro base.
        detalle.push({
          fila,
          tipo: "ayto",
          ok: false,
          mensaje: `Sin registro base para ${municipioRaw} ${anio} en AYUNTAMIENTOS — captura primero el cómputo o usa el editor manual.`,
        });
        errores++;
        return;
      }
      const key = `ayto:${clave}:${anio}`;
      setOverrideGenero(key, genero === "ambiguo" ? null : genero);
      detalle.push({ fila, tipo: "ayto", ok: true, mensaje: `${municipioRaw} ${anio} → ${genero}`, overrideKey: key, genero });
      aplicadas++;
      return;
    }

    detalle.push({ fila, tipo: null, ok: false, mensaje: "Faltan columnas: usa 'municipio' o 'distrito'" });
    errores++;
  });

  return { totalFilas: parsed.data.length, aplicadas, errores, detalle };
}

export const CSV_PLANTILLA_AYTO = `anio,municipio,genero,nombre
2021,Morelia,H,Alfonso Martínez Alcázar
2021,Lázaro Cárdenas,M,Itzé Camacho Zapiain
2018,Uruapan,H,Víctor Manuel Manríquez
`;

export const CSV_PLANTILLA_DIP = `anio,distrito,genero
2021,1,M
2021,2,H
2024,14,M
`;

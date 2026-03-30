import Papa from "papaparse";
import type { DemograficoSeccion, DemograficoDistrito, RangoEdad } from "@/data/demographic-types";
import { emptyRangos, RANGOS_EDAD_INE } from "@/data/demographic-types";

// Column name mappings for INE lista nominal CSVs
const SECCION_COLS = ["SECCION", "SECCIÓN", "SECCION_ELECTORAL", "ID_SECCION", "CLAVE_SECCION"];
const DISTRITO_FED_COLS = ["DISTRITO_FEDERAL", "DISTRITO_FED", "DISTRITO", "ID_DISTRITO_FEDERAL", "CLAVE_DISTRITO"];
const DISTRITO_LOC_COLS = ["DISTRITO_LOCAL", "DISTRITO_LOC", "ID_DISTRITO_LOCAL"];
const ENTIDAD_COLS = ["ENTIDAD", "ID_ENTIDAD", "CLAVE_ENTIDAD", "CVE_ENTIDAD"];
const MUNICIPIO_COLS = ["MUNICIPIO", "NOMBRE_MUNICIPIO", "CLAVE_MUNICIPIO", "CVE_MUNICIPIO"];
const SEXO_COLS = ["SEXO", "GENERO", "GÉNERO"];
const EDAD_COLS = ["RANGO_EDAD", "RANGO", "GRUPO_EDAD", "GRUPO_QUINQUENAL", "EDAD"];
const LISTA_NOM_COLS = ["LISTA_NOMINAL", "LISTA NOMINAL", "PADRON", "PADRÓN", "LN", "TOTAL"];

function findColumn(headers: string[], candidates: string[]): string | null {
  const norm = headers.map(h => h.trim().toUpperCase().replace(/[^A-ZÁÉÍÓÚÑ0-9]/g, "_"));
  for (const c of candidates) {
    const cn = c.toUpperCase().replace(/[^A-ZÁÉÍÓÚÑ0-9]/g, "_");
    const idx = norm.indexOf(cn);
    if (idx >= 0) return headers[idx];
  }
  for (const c of candidates) {
    const cn = c.toUpperCase();
    const idx = norm.findIndex(h => h.includes(cn) || cn.includes(h));
    if (idx >= 0) return headers[idx];
  }
  return null;
}

function safeNum(val: unknown): number {
  if (val == null || val === "" || val === "-") return 0;
  const n = Number(String(val).replace(/,/g, ""));
  return isNaN(n) ? 0 : n;
}

function mapRango(raw: string): string | null {
  const s = raw.trim().toUpperCase();
  if (/^18\s*[-–a]\s*19$/.test(s)) return "18-19";
  if (/^20\s*[-–a]\s*24$/.test(s)) return "20-24";
  if (/^25\s*[-–a]\s*29$/.test(s)) return "25-29";
  if (/^30\s*[-–a]\s*34$/.test(s)) return "30-34";
  if (/^35\s*[-–a]\s*39$/.test(s)) return "35-39";
  if (/^40\s*[-–a]\s*44$/.test(s)) return "40-44";
  if (/^45\s*[-–a]\s*49$/.test(s)) return "45-49";
  if (/^50\s*[-–a]\s*54$/.test(s)) return "50-54";
  if (/^55\s*[-–a]\s*59$/.test(s)) return "55-59";
  if (/^60\s*[-–a]\s*64$/.test(s)) return "60-64";
  if (/65|MAS|MÁS|\+/.test(s)) return "65+";
  return null;
}

export interface DemographicParseResult {
  success: boolean;
  secciones: DemograficoSeccion[];
  distritosFed: DemograficoDistrito[];
  distritosLoc: DemograficoDistrito[];
  stats: {
    totalRows: number;
    seccionesFound: number;
    hasEdadData: boolean;
    hasSexoData: boolean;
  };
  errors: string[];
  warnings: string[];
}

export function parseDemographicCsv(
  file: File,
  entidadFilter = 16
): Promise<DemographicParseResult> {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      encoding: "UTF-8",
      complete: (results) => {
        const errors: string[] = [];
        const warnings: string[] = [];
        const headers = results.meta.fields || [];

        if (headers.length === 0) {
          resolve({ success: false, secciones: [], distritosFed: [], distritosLoc: [], stats: { totalRows: 0, seccionesFound: 0, hasEdadData: false, hasSexoData: false }, errors: ["No se encontraron encabezados"], warnings: [] });
          return;
        }

        const seccionCol = findColumn(headers, SECCION_COLS);
        const distFedCol = findColumn(headers, DISTRITO_FED_COLS);
        const distLocCol = findColumn(headers, DISTRITO_LOC_COLS);
        const entidadCol = findColumn(headers, ENTIDAD_COLS);
        const municipioCol = findColumn(headers, MUNICIPIO_COLS);
        const sexoCol = findColumn(headers, SEXO_COLS);
        const edadCol = findColumn(headers, EDAD_COLS);
        const lnCol = findColumn(headers, LISTA_NOM_COLS);

        if (!lnCol && !seccionCol) {
          errors.push(`No se encontraron columnas de LISTA NOMINAL o SECCIÓN. Columnas: ${headers.slice(0, 15).join(", ")}...`);
          resolve({ success: false, secciones: [], distritosFed: [], distritosLoc: [], stats: { totalRows: 0, seccionesFound: 0, hasEdadData: false, hasSexoData: false }, errors, warnings });
          return;
        }

        let rows = results.data as Record<string, unknown>[];

        // Filter Michoacán
        if (entidadCol && entidadFilter) {
          const before = rows.length;
          const filtered = rows.filter(r => safeNum(r[entidadCol]) === entidadFilter);
          if (filtered.length > 0) {
            rows = filtered;
            warnings.push(`Filtrado: ${rows.length} de ${before} registros para entidad ${entidadFilter} (Michoacán)`);
          } else {
            warnings.push(`No se encontraron registros para entidad ${entidadFilter}. Usando todos los datos.`);
          }
        }

        const hasEdad = !!edadCol;
        const hasSexo = !!sexoCol;

        // Aggregate by sección
        const secMap = new Map<number, DemograficoSeccion>();

        for (const row of rows) {
          const secId = seccionCol ? safeNum(row[seccionCol]) : 0;
          const distFed = distFedCol ? safeNum(row[distFedCol]) : 0;
          const distLoc = distLocCol ? safeNum(row[distLocCol]) : 0;
          const mun = municipioCol ? String(row[municipioCol] || "") : "";
          const ln = lnCol ? safeNum(row[lnCol]) : 0;
          const sexo = sexoCol ? String(row[sexoCol] || "").trim().toUpperCase() : "";
          const edadRaw = edadCol ? String(row[edadCol] || "") : "";
          const rango = edadRaw ? mapRango(edadRaw) : null;

          const key = secId > 0 ? secId : distFed * 10000 + (distLoc || 0);
          
          if (!secMap.has(key)) {
            secMap.set(key, {
              seccion: secId,
              distritoFederal: distFed,
              distritoLocal: distLoc,
              municipio: mun,
              listaNominal: 0,
              hombres: 0,
              mujeres: 0,
              rangoEdad: emptyRangos(),
            });
          }

          const sec = secMap.get(key)!;
          sec.listaNominal += ln;

          if (sexo === "H" || sexo === "HOMBRE" || sexo === "HOMBRES" || sexo === "MASCULINO") {
            sec.hombres += ln;
          } else if (sexo === "M" || sexo === "F" || sexo === "MUJER" || sexo === "MUJERES" || sexo === "FEMENINO") {
            sec.mujeres += ln;
          }

          if (rango) {
            const r = sec.rangoEdad.find(re => re.rango === rango);
            if (r) {
              r.total += ln;
              if (sexo === "H" || sexo === "HOMBRE" || sexo === "HOMBRES" || sexo === "MASCULINO") {
                r.hombres += ln;
              } else if (sexo === "M" || sexo === "F" || sexo === "MUJER" || sexo === "MUJERES" || sexo === "FEMENINO") {
                r.mujeres += ln;
              }
            }
          }

          if (distFed > 0) sec.distritoFederal = distFed;
          if (distLoc > 0) sec.distritoLocal = distLoc;
          if (mun) sec.municipio = mun;
        }

        const secciones = Array.from(secMap.values());

        // Aggregate to distrito level
        const fedMap = new Map<number, DemograficoDistrito>();
        const locMap = new Map<number, DemograficoDistrito>();

        for (const sec of secciones) {
          if (sec.distritoFederal > 0) {
            if (!fedMap.has(sec.distritoFederal)) {
              fedMap.set(sec.distritoFederal, {
                distritoId: sec.distritoFederal, tipo: "federal", listaNominal: 0,
                hombres: 0, mujeres: 0, secciones: 0, rangoEdad: emptyRangos(), poblacionPrincipal: "",
              });
            }
            const d = fedMap.get(sec.distritoFederal)!;
            d.listaNominal += sec.listaNominal;
            d.hombres += sec.hombres;
            d.mujeres += sec.mujeres;
            d.secciones++;
            sec.rangoEdad.forEach((r, i) => {
              d.rangoEdad[i].total += r.total;
              d.rangoEdad[i].hombres += r.hombres;
              d.rangoEdad[i].mujeres += r.mujeres;
            });
          }
          if (sec.distritoLocal > 0) {
            if (!locMap.has(sec.distritoLocal)) {
              locMap.set(sec.distritoLocal, {
                distritoId: sec.distritoLocal, tipo: "local", listaNominal: 0,
                hombres: 0, mujeres: 0, secciones: 0, rangoEdad: emptyRangos(), poblacionPrincipal: "",
              });
            }
            const d = locMap.get(sec.distritoLocal)!;
            d.listaNominal += sec.listaNominal;
            d.hombres += sec.hombres;
            d.mujeres += sec.mujeres;
            d.secciones++;
            sec.rangoEdad.forEach((r, i) => {
              d.rangoEdad[i].total += r.total;
              d.rangoEdad[i].hombres += r.hombres;
              d.rangoEdad[i].mujeres += r.mujeres;
            });
          }
        }

        // Set poblacionPrincipal
        const setPoblacion = (d: DemograficoDistrito) => {
          const max = d.rangoEdad.reduce((a, b) => a.total >= b.total ? a : b);
          d.poblacionPrincipal = max.total > 0 ? max.rango : "N/D";
        };
        fedMap.forEach(setPoblacion);
        locMap.forEach(setPoblacion);

        const distritosFed = Array.from(fedMap.values()).sort((a, b) => a.distritoId - b.distritoId);
        const distritosLoc = Array.from(locMap.values()).sort((a, b) => a.distritoId - b.distritoId);

        resolve({
          success: true,
          secciones,
          distritosFed,
          distritosLoc,
          stats: {
            totalRows: rows.length,
            seccionesFound: secciones.filter(s => s.seccion > 0).length,
            hasEdadData: hasEdad,
            hasSexoData: hasSexo,
          },
          errors,
          warnings,
        });
      },
      error: (err) => {
        resolve({
          success: false, secciones: [], distritosFed: [], distritosLoc: [],
          stats: { totalRows: 0, seccionesFound: 0, hasEdadData: false, hasSexoData: false },
          errors: [`Error al parsear CSV: ${err.message}`], warnings: [],
        });
      },
    });
  });
}

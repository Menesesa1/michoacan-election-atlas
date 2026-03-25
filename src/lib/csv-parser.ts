import Papa from "papaparse";
import type { DistritoFederal, Partido, ResultadoEleccion } from "@/data/electoral-data";

// Known column name mappings for INE CSV files
const PARTIDO_COLUMN_MAP: Record<string, Partido> = {
  PAN: "PAN",
  PRI: "PRI",
  PRD: "PRD",
  PVEM: "PVEM",
  PT: "PT",
  MC: "MC",
  MORENA: "MORENA",
  MOVIMIENTO_CIUDADANO: "MC",
  PARTIDO_VERDE: "PVEM",
  "PARTIDO ACCIÓN NACIONAL": "PAN",
  "PARTIDO REVOLUCIONARIO INSTITUCIONAL": "PRI",
  "PARTIDO DE LA REVOLUCIÓN DEMOCRÁTICA": "PRD",
  "PARTIDO VERDE ECOLOGISTA DE MÉXICO": "PVEM",
  "PARTIDO DEL TRABAJO": "PT",
  "MOVIMIENTO CIUDADANO": "MC",
};

const DISTRITO_COLS = [
  "DISTRITO", "DISTRITO_FEDERAL", "ID_DISTRITO", "CLAVE_DISTRITO",
  "NUM_DISTRITO", "DISTRITO_FED", "ID_DISTRITO_FEDERAL", "CLAVE DISTRITO",
];

const SECCION_COLS = ["SECCION", "SECCIÓN", "SECCION_ELECTORAL", "ID_SECCION"];
const CASILLA_COLS = ["CASILLA", "TIPO_CASILLA", "ID_CASILLA", "CASILLAS"];
const ENTIDAD_COLS = ["ENTIDAD", "ID_ENTIDAD", "CLAVE_ENTIDAD", "CVE_ENTIDAD", "CLAVE ENTIDAD"];
const LISTA_NOMINAL_COLS = ["LISTA_NOMINAL", "LISTA NOMINAL", "LN", "LISTA_NOM"];
const TOTAL_VOTOS_COLS = ["TOTAL_VOTOS", "TOTAL", "TOTAL_VOTOS_CALCULADOS", "VOTACION_TOTAL"];

const CABECERA_COLS = [
  "CABECERA", "NOMBRE_DISTRITO", "NOMBRE DISTRITO", "CABECERA_DISTRITAL",
  "MUNICIPIO", "NOMBRE_MUNICIPIO",
];

interface ParseResult {
  success: boolean;
  distritos: DistritoFederal[];
  stats: {
    totalRows: number;
    distritosFound: number;
    partidosDetected: string[];
    hasSeccionLevel: boolean;
    entidadFilter: string | null;
  };
  errors: string[];
  warnings: string[];
}

function findColumn(headers: string[], candidates: string[]): string | null {
  const normalized = headers.map((h) => h.trim().toUpperCase().replace(/[^A-ZÁÉÍÓÚÑa-záéíóúñ0-9_]/g, "_"));
  for (const candidate of candidates) {
    const idx = normalized.indexOf(candidate.toUpperCase().replace(/[^A-ZÁÉÍÓÚÑa-záéíóúñ0-9_]/g, "_"));
    if (idx >= 0) return headers[idx];
  }
  // Partial match
  for (const candidate of candidates) {
    const c = candidate.toUpperCase();
    const idx = normalized.findIndex((h) => h.includes(c) || c.includes(h));
    if (idx >= 0) return headers[idx];
  }
  return null;
}

function detectPartidoColumns(headers: string[]): Record<string, Partido> {
  const result: Record<string, Partido> = {};
  
  for (const header of headers) {
    const upper = header.trim().toUpperCase();
    // Direct match
    if (PARTIDO_COLUMN_MAP[upper]) {
      result[header] = PARTIDO_COLUMN_MAP[upper];
      continue;
    }
    // Check if any key is contained in the header
    for (const [key, partido] of Object.entries(PARTIDO_COLUMN_MAP)) {
      if (upper === key || upper === key.replace(/ /g, "_")) {
        result[header] = partido;
        break;
      }
    }
  }
  return result;
}

function safeNumber(val: unknown): number {
  if (val === null || val === undefined || val === "" || val === "-") return 0;
  const n = Number(String(val).replace(/,/g, ""));
  return isNaN(n) ? 0 : n;
}

export function parseINECsv(
  file: File,
  eleccionKey: string,
  año: number,
  entidadFilter?: number // 16 for Michoacán
): Promise<ParseResult> {
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
          resolve({ success: false, distritos: [], stats: { totalRows: 0, distritosFound: 0, partidosDetected: [], hasSeccionLevel: false, entidadFilter: null }, errors: ["No se encontraron encabezados en el CSV"], warnings: [] });
          return;
        }

        // Detect columns
        const distritoCol = findColumn(headers, DISTRITO_COLS);
        const seccionCol = findColumn(headers, SECCION_COLS);
        const casillaCol = findColumn(headers, CASILLA_COLS);
        const entidadCol = findColumn(headers, ENTIDAD_COLS);
        const listaNominalCol = findColumn(headers, LISTA_NOMINAL_COLS);
        const totalVotosCol = findColumn(headers, TOTAL_VOTOS_COLS);
        const cabeceraCol = findColumn(headers, CABECERA_COLS);
        const partidoCols = detectPartidoColumns(headers);

        if (!distritoCol) {
          errors.push(`No se encontró columna de DISTRITO. Columnas disponibles: ${headers.slice(0, 15).join(", ")}...`);
          resolve({ success: false, distritos: [], stats: { totalRows: results.data.length, distritosFound: 0, partidosDetected: [], hasSeccionLevel: false, entidadFilter: null }, errors, warnings });
          return;
        }

        if (Object.keys(partidoCols).length === 0) {
          errors.push(`No se detectaron columnas de partidos. Columnas: ${headers.join(", ")}`);
          resolve({ success: false, distritos: [], stats: { totalRows: results.data.length, distritosFound: 0, partidosDetected: [], hasSeccionLevel: false, entidadFilter: null }, errors, warnings });
          return;
        }

        // Filter rows
        let rows = results.data as Record<string, unknown>[];

        // Filter by entidad if needed (Michoacán = 16)
        if (entidadCol && entidadFilter) {
          const before = rows.length;
          rows = rows.filter((r) => safeNumber(r[entidadCol]) === entidadFilter);
          if (rows.length === 0) {
            warnings.push(`Se filtraron ${before} registros por entidad ${entidadFilter} pero no se encontraron coincidencias. Intentando sin filtro.`);
            rows = results.data as Record<string, unknown>[];
          } else {
            warnings.push(`Filtrado: ${rows.length} de ${before} registros para entidad ${entidadFilter}`);
          }
        }

        // Aggregate by distrito
        const distritoMap = new Map<number, {
          votos: Record<Partido, number>;
          totalVotos: number;
          listaNominal: number;
          cabecera: string;
          rowCount: number;
        }>();

        for (const row of rows) {
          const distId = safeNumber(row[distritoCol]);
          if (distId <= 0) continue;

          const existing = distritoMap.get(distId) || {
            votos: { MORENA: 0, PAN: 0, PRI: 0, PVEM: 0, MC: 0, PT: 0, PRD: 0, OTROS: 0 },
            totalVotos: 0,
            listaNominal: 0,
            cabecera: cabeceraCol ? String(row[cabeceraCol] || `Distrito ${distId}`) : `Distrito ${distId}`,
            rowCount: 0,
          };

          // Sum partido votes
          for (const [col, partido] of Object.entries(partidoCols)) {
            existing.votos[partido] += safeNumber(row[col]);
          }

          if (totalVotosCol) {
            existing.totalVotos += safeNumber(row[totalVotosCol]);
          }
          if (listaNominalCol) {
            existing.listaNominal += safeNumber(row[listaNominalCol]);
          }

          existing.rowCount++;
          distritoMap.set(distId, existing);
        }

        // Build DistritoFederal objects
        const distritos: DistritoFederal[] = [];
        for (const [distId, data] of distritoMap) {
          // Calculate total if not provided
          const calcTotal = data.totalVotos > 0
            ? data.totalVotos
            : Object.values(data.votos).reduce((s, v) => s + v, 0);

          // Find winner
          const ganador = (Object.entries(data.votos) as [Partido, number][])
            .reduce((a, b) => (a[1] >= b[1] ? a : b))[0];

          const participacion = data.listaNominal > 0
            ? (calcTotal / data.listaNominal) * 100
            : 0;

          const resultado: ResultadoEleccion = {
            año,
            tipo: "federal",
            votos: data.votos,
            totalVotos: calcTotal,
            participacion: +participacion.toFixed(1),
            ganador,
          };

          distritos.push({
            id: distId,
            cabecera: data.cabecera,
            listaNominal2024: data.listaNominal,
            participacion2024: +participacion.toFixed(1),
            resultados: { [eleccionKey]: resultado },
          });
        }

        distritos.sort((a, b) => a.id - b.id);

        resolve({
          success: true,
          distritos,
          stats: {
            totalRows: rows.length,
            distritosFound: distritos.length,
            partidosDetected: [...new Set(Object.values(partidoCols))],
            hasSeccionLevel: !!seccionCol || !!casillaCol,
            entidadFilter: entidadCol ? `Columna: ${entidadCol}` : null,
          },
          errors,
          warnings,
        });
      },
      error: (err) => {
        resolve({
          success: false,
          distritos: [],
          stats: { totalRows: 0, distritosFound: 0, partidosDetected: [], hasSeccionLevel: false, entidadFilter: null },
          errors: [`Error al parsear CSV: ${err.message}`],
          warnings: [],
        });
      },
    });
  });
}

// =============================================================================
// Detector multi-esquema de CSVs electorales
// =============================================================================
// Reconoce automáticamente:
//   - INE Cómputos 2024 (federal: presidencia / dip federal)
//   - INE Cómputos 2021 (dip federal)
//   - INE Cómputos 2018 (presidencia / dip federal)
//   - IEM Michoacán 2024 (gobernatura / dip local / ayuntamiento)
//   - IEM Michoacán 2021 (gobernatura / dip local / ayuntamiento)
//   - INE Padrón / Lista Nominal por sección (no resultados)
//
// Salida: ParsedDataset → modelo unificado por SECCIÓN (unidad atómica).
// Cada fila agregada se puede sumar libremente para reconstruir cualquier
// jerarquía (municipio, distrito local, distrito federal, estado).
// =============================================================================

import Papa from "papaparse";

// ---------- Tipos públicos ----------

export type TipoEleccion =
  | "presidencia"
  | "diputacion_federal"
  | "gobernatura"
  | "diputacion_local"
  | "ayuntamiento"
  | "padron_lista_nominal"
  | "desconocido";

export type Origen =
  | "INE_2024"
  | "INE_2021"
  | "INE_2018"
  | "IEM_2024"
  | "IEM_2021"
  | "IEM_HISTORICO"
  | "INE_PADRON"
  | "desconocido";

export interface SeccionResultado {
  /** Clave única de sección electoral (1..2825 para Michoacán) */
  seccion: number;
  /** Distrito federal INE (1..11 en Michoacán) si el dataset lo trae */
  distrito_federal?: number;
  /** Distrito local IEM (1..24) si el dataset lo trae */
  distrito_local?: number;
  /** Clave de municipio INE si el dataset lo trae */
  municipio?: number;
  /** Lista nominal de la sección (suma casillas) */
  lista_nominal: number;
  /** Total de votos válidos en la sección */
  total_votos: number;
  /** Votos por partido (claves canónicas) */
  votos_por_partido: Record<string, number>;
  /** # casillas agregadas en esta sección */
  casillas_count: number;
}

export interface ParsedDataset {
  origen: Origen;
  tipo_eleccion: TipoEleccion;
  anio: number;
  /** Filas agregadas a nivel sección (unidad atómica) */
  secciones: SeccionResultado[];
  /** Partidos canónicos detectados */
  partidos: string[];
  /** Confianza del detector (0..1) */
  confianza: number;
  /** Pistas que llevaron a la detección */
  pistas: string[];
  /** Estadísticas del proceso */
  stats: {
    total_filas: number;
    filas_michoacan: number;
    secciones_unicas: number;
    casillas_total: number;
    columnas_partido_detectadas: string[];
    columnas_omitidas: string[];
  };
  errores: string[];
  warnings: string[];
}

// ---------- Detección de esquema ----------

interface SchemaSignature {
  origen: Origen;
  tipo_eleccion: TipoEleccion;
  anio: number;
  /** Columnas requeridas (case-insensitive, normalizadas) */
  requiere: string[];
  /** Columnas que, si están, refuerzan la detección */
  refuerza?: string[];
  /** Columnas que NO deben estar */
  excluye?: string[];
  pista: string;
}

const SIGNATURES: SchemaSignature[] = [
  // ----- INE 2024 -----
  {
    origen: "INE_2024",
    tipo_eleccion: "presidencia",
    anio: 2024,
    requiere: ["ID_ESTADO", "SECCION", "CASILLA"],
    refuerza: ["CLAUDIA", "XOCHITL", "MAYNEZ", "PRESIDENCIA"],
    pista: "Encabezados con candidatas/os 2024 a presidencia",
  },
  {
    origen: "INE_2024",
    tipo_eleccion: "diputacion_federal",
    anio: 2024,
    requiere: ["ID_ESTADO", "SECCION", "ID_DISTRITO_FEDERAL"],
    refuerza: ["DIPUTACIONES", "DIP_FED", "FORMULA"],
    excluye: ["CLAUDIA"],
    pista: "INE 2024 con id_distrito_federal y sin columnas presidenciales",
  },

  // ----- INE 2021 (solo dip federal) -----
  {
    origen: "INE_2021",
    tipo_eleccion: "diputacion_federal",
    anio: 2021,
    requiere: ["ID_ESTADO", "SECCION", "ID_DISTRITO"],
    refuerza: ["FXM", "RSP", "PES"], // partidos exclusivos 2021
    pista: "Partidos FxM/RSP/PES exclusivos de 2021",
  },

  // ----- INE 2018 -----
  {
    origen: "INE_2018",
    tipo_eleccion: "presidencia",
    anio: 2018,
    requiere: ["ID_ESTADO", "SECCION", "CASILLA"],
    refuerza: ["AMLO", "ANAYA", "MEADE", "BRONCO", "PRESIDENTE"],
    pista: "Candidatos 2018 (AMLO/Anaya/Meade/Bronco)",
  },
  {
    origen: "INE_2018",
    tipo_eleccion: "diputacion_federal",
    anio: 2018,
    requiere: ["ID_ESTADO", "SECCION", "ID_DISTRITO"],
    refuerza: ["NA"], // Nueva Alianza solo en 2018
    excluye: ["AMLO", "FXM"],
    pista: "Partido NA (Nueva Alianza) presente",
  },

  // ----- IEM Michoacán -----
  {
    origen: "IEM_2024",
    tipo_eleccion: "diputacion_local",
    anio: 2024,
    requiere: ["SECCION"],
    refuerza: ["DISTRITO_LOCAL", "DTTO_LOCAL", "DIP_LOCAL", "IEM"],
    pista: "Encabezado IEM con distrito local",
  },
  {
    origen: "IEM_2024",
    tipo_eleccion: "ayuntamiento",
    anio: 2024,
    requiere: ["SECCION"],
    refuerza: ["MUNICIPIO", "AYUNTAMIENTO", "PRESIDENCIA_MUNICIPAL"],
    excluye: ["DISTRITO_LOCAL"],
    pista: "IEM cómputos municipales",
  },
  {
    origen: "IEM_2021",
    tipo_eleccion: "gobernatura",
    anio: 2021,
    requiere: ["SECCION"],
    refuerza: ["GOBERNATURA", "GOBERNADOR", "RAMIREZ_BEDOLLA", "GUZMAN"],
    pista: "IEM 2021 gobernatura",
  },

// ----- INE Padrón / Lista Nominal -----
  {
    origen: "INE_PADRON",
    tipo_eleccion: "padron_lista_nominal",
    anio: 2026,
    requiere: ["SECCION"],
    refuerza: ["LISTA_NOMINAL", "PADRON_ELECTORAL", "RANGO_EDAD"],
    excluye: ["MORENA", "PAN"],
    pista: "Padrón/lista nominal sin columnas de partido",
  },
];

// ---------- Detección de delimitador y encoding ----------

const DELIMITERS = [",", ";", "\t", "|"] as const;
type Delim = (typeof DELIMITERS)[number];

/** Quita BOM (UTF-8 / UTF-16) si existe. */
function stripBOM(s: string): string {
  if (s.charCodeAt(0) === 0xfeff) return s.slice(1);
  return s;
}

/** Detecta el delimitador más probable en las primeras N líneas no vacías. */
function detectDelimiter(text: string): Delim {
  const lines = text
    .split(/\r?\n/)
    .filter((l) => l.trim().length > 0)
    .slice(0, 15);
  let best: { d: Delim; score: number } = { d: ",", score: -1 };
  for (const d of DELIMITERS) {
    const counts = lines.map((l) => l.split(d).length);
    if (counts.length === 0 || counts[0] < 2) continue;
    const first = counts[0];
    // Estabilidad: # de líneas con el mismo conteo + magnitud
    const stable = counts.filter((c) => c === first).length;
    const score = stable * 10 + first;
    if (score > best.score) best = { d, score };
  }
  return best.d;
}

/**
 * INE/IEM a veces exportan archivos con metadatos arriba del header
 * (líneas con título, fecha, "REPORTE DE...", etc.). Detecta la primera línea
 * que parece ser encabezado real: contiene varios delimitadores Y al menos
 * una palabra clave electoral conocida.
 */
function findHeaderLine(text: string, delim: Delim): number {
  const lines = text.split(/\r?\n/);
  const KEYS = [
    "SECCION", "SECCIÓN", "CASILLA", "DISTRITO", "MUNICIPIO",
    "MORENA", "PAN", "PRI", "LISTA_NOMINAL", "LISTA NOMINAL",
    "ENTIDAD", "ESTADO",
  ];
  for (let i = 0; i < Math.min(lines.length, 30); i++) {
    const l = lines[i];
    if (l.split(delim).length < 3) continue;
    const upper = l.toUpperCase();
    if (KEYS.some((k) => upper.includes(k))) return i;
  }
  return 0;
}

/** Lee el archivo como texto probando UTF-8 y, si hay caracteres de reemplazo, latin1. */
async function readFileSmart(file: File): Promise<{ text: string; encoding: string }> {
  // Intento 1: UTF-8
  const utf8 = stripBOM(await file.text());
  // El "replacement character" U+FFFD aparece cuando UTF-8 falla
  if (!utf8.includes("\uFFFD")) return { text: utf8, encoding: "UTF-8" };
  // Intento 2: latin1 (windows-1252) — común en exports gubernamentales MX
  try {
    const buf = await file.arrayBuffer();
    const text = new TextDecoder("windows-1252").decode(buf);
    return { text: stripBOM(text), encoding: "Windows-1252" };
  } catch {
    return { text: utf8, encoding: "UTF-8 (con caracteres inválidos)" };
  }
}

// ---------- Mapas canónicos de partidos ----------

const PARTIDO_CANONICO: Record<string, string> = {
  PAN: "PAN",
  PRI: "PRI",
  PRD: "PRD",
  PVEM: "PVEM",
  PVM: "PVEM",
  VERDE: "PVEM",
  PT: "PT",
  MC: "MC",
  MOVIMIENTO_CIUDADANO: "MC",
  MORENA: "MORENA",
  // 2021
  FXM: "FXM",
  FUERZA_POR_MEXICO: "FXM",
  RSP: "RSP",
  REDES_SOCIALES_PROGRESISTAS: "RSP",
  PES: "PES",
  // 2018
  NA: "NA",
  PANAL: "NA",
  NUEVA_ALIANZA: "NA",
  ENCUENTRO_SOCIAL: "PES",
  ES: "PES",
  // CI/independientes
  CAND_IND_1: "INDEP",
  CAND_IND_2: "INDEP",
  CI_1: "INDEP",
  CI_2: "INDEP",
  INDEPENDIENTE: "INDEP",
  CANDIDATO_INDEPENDIENTE: "INDEP",
  // Local Michoacán específicos
  PRMI: "PRMI",                  // Partido Renovación Michoacán
  PRM: "PRMI",
  MAS: "MAS_MICH",               // Más por Michoacán (efímero)
  // No registrados / nulos
  NO_REGISTRADOS: "NO_REG",
  CNR: "NO_REG",
  CANDIDATOS_NO_REGISTRADOS: "NO_REG",
  NULOS: "NULOS",
  VOTOS_NULOS: "NULOS",
  VN: "NULOS",
};

// Coaliciones 2024 → distribuir voto (estrategia: contar a partido líder, simple)
// Para análisis fino, el usuario puede des-coalicionar después.
const COALICION_LIDER: Record<string, string> = {
  // Frente Amplio por México (FAM 2024) / Va por México (2021)
  PAN_PRI_PRD: "PAN",
  PAN_PRI: "PAN",
  PAN_PRD: "PAN",
  PRI_PRD: "PRI",
  PRI_PAN: "PAN",
  PRD_PAN: "PAN",
  PRD_PRI: "PRI",
  // Sigamos Haciendo Historia (SHH 2024) / Juntos Hacemos Historia (2021/2018)
  MORENA_PT_PVEM: "MORENA",
  MORENA_PT: "MORENA",
  MORENA_PVEM: "MORENA",
  PT_PVEM: "MORENA",
  PT_MORENA: "MORENA",
  PVEM_MORENA: "MORENA",
  PVEM_PT_MORENA: "MORENA",
  // 2018 Por México al Frente (PAN-PRD-MC)
  PAN_PRD_MC: "PAN",
  PRD_MC: "PRD",
  PAN_MC: "PAN",
};

// ---------- Utilidades ----------

const norm = (s: string): string =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");

const safeNum = (v: unknown): number => {
  if (v === null || v === undefined || v === "" || v === "-") return 0;
  const s = String(v).trim();
  if (s === "" || s.toUpperCase() === "ILEGIBLE" || s.toUpperCase() === "SIN DATO") return 0;
  const n = Number(s.replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
};

function detectSchema(headers: string[]): {
  signature: SchemaSignature | null;
  confianza: number;
  pistas: string[];
} {
  const H = headers.map(norm);
  const Hset = new Set(H);

  let best: { sig: SchemaSignature; score: number; pistas: string[] } | null = null;

  for (const sig of SIGNATURES) {
    const reqOk = sig.requiere.every((r) => Hset.has(norm(r)) || H.some((h) => h.includes(norm(r))));
    if (!reqOk) continue;

    if (sig.excluye?.some((x) => Hset.has(norm(x)))) continue;

    const refuerzos = (sig.refuerza ?? []).filter((r) =>
      H.some((h) => h.includes(norm(r))),
    );
    const score = sig.requiere.length + refuerzos.length * 1.5;

    const pistas = [
      `Requeridas OK: ${sig.requiere.join(", ")}`,
      ...refuerzos.map((r) => `Refuerzo: ${r}`),
      sig.pista,
    ];

    if (!best || score > best.score) {
      best = { sig, score, pistas };
    }
  }

  if (!best) return { signature: null, confianza: 0, pistas: [] };

  // confianza: requeridas (peso 1) + refuerzos (peso 1.5), normalizado
  const maxScore = best.sig.requiere.length + (best.sig.refuerza?.length ?? 0) * 1.5;
  const confianza = Math.min(1, best.score / Math.max(maxScore, 1));

  return { signature: best.sig, confianza, pistas: best.pistas };
}

function detectPartidoColumns(
  headers: string[],
): { col: string; partido: string }[] {
  const cols: { col: string; partido: string }[] = [];
  for (const h of headers) {
    const n = norm(h);
    // Match directo
    if (PARTIDO_CANONICO[n]) {
      cols.push({ col: h, partido: PARTIDO_CANONICO[n] });
      continue;
    }
    // Coaliciones: PAN_PRI_PRD, MORENA_PT_PVEM, etc.
    if (COALICION_LIDER[n]) {
      cols.push({ col: h, partido: COALICION_LIDER[n] });
      continue;
    }
    // Heurística: si el header contiene una sigla conocida en singular
    const partidoBase = ["MORENA", "PAN", "PRI", "PRD", "PVEM", "PT", "MC"].find(
      (p) => n === p || n.startsWith(`${p}_`) || n.endsWith(`_${p}`),
    );
    if (partidoBase) {
      cols.push({ col: h, partido: partidoBase });
    }
  }
  return cols;
}

function findCol(headers: string[], candidates: string[]): string | null {
  const H = headers.map((h) => ({ raw: h, n: norm(h) }));
  for (const c of candidates) {
    const cn = norm(c);
    const exact = H.find((h) => h.n === cn);
    if (exact) return exact.raw;
  }
  for (const c of candidates) {
    const cn = norm(c);
    const partial = H.find((h) => h.n.includes(cn));
    if (partial) return partial.raw;
  }
  return null;
}

// ---------- Parser principal ----------

export async function detectAndParse(file: File): Promise<ParsedDataset> {
  // 1) Leer texto con encoding inteligente (UTF-8 con fallback a Windows-1252)
  const { text: raw, encoding } = await readFileSmart(file);
  // 2) Detectar delimitador (, ; \t |)
  const delim = detectDelimiter(raw);
  // 3) Saltar líneas de metadatos típicas de exports INE/IEM/Excel
  const headerLine = findHeaderLine(raw, delim);
  const text =
    headerLine > 0 ? raw.split(/\r?\n/).slice(headerLine).join("\n") : raw;

  const preWarnings: string[] = [];
  if (encoding !== "UTF-8") preWarnings.push(`Encoding: ${encoding}`);
  if (delim !== ",")
    preWarnings.push(`Delimitador: "${delim === "\t" ? "TAB" : delim}"`);
  if (headerLine > 0)
    preWarnings.push(`Saltadas ${headerLine} líneas de metadatos antes del encabezado`);

  return new Promise((resolve) => {
    Papa.parse<Record<string, unknown>>(text, {
      header: true,
      skipEmptyLines: "greedy",
      delimiter: delim,
      transformHeader: (h) => h.trim(),
      complete: (results) => {
        const headers = (results.meta.fields ?? [])
          .map((h) => h.trim())
          .filter(Boolean);
        const errores: string[] = [];
        const warnings: string[] = [...preWarnings];

        if (headers.length === 0) {
          resolve(emptyResult(["No se encontraron encabezados en el CSV"]));
          return;
        }

        const det = detectSchema(headers);
        if (!det.signature) {
          resolve(
            emptyResult([
              `No se reconoció el esquema. Encabezados: ${headers.slice(0, 12).join(", ")}...`,
            ]),
          );
          return;
        }

        const sig = det.signature;
        const partidoCols = detectPartidoColumns(headers);
        const partidosDetectados = [...new Set(partidoCols.map((p) => p.partido))];

        const colSeccion = findCol(headers, [
          "SECCION", "SECCIÓN", "ID_SECCION", "CVE_SECCION", "CLAVE_SECCION",
          "NUM_SECCION", "NO_SECCION", "SECC", "SECC_ELECTORAL",
        ]);
        const colDistFed = findCol(headers, [
          "ID_DISTRITO_FEDERAL", "DISTRITO_FEDERAL", "DISTRITO_FED",
          "ID_DISTRITO_FED", "DTTO_FEDERAL", "ID_DTTO_FEDERAL",
          "ID_DISTRITO", "DISTRITO", "CLAVE_DISTRITO_FEDERAL", "CVE_DISTRITO_FED",
        ]);
        const colDistLoc = findCol(headers, [
          "DISTRITO_LOCAL", "ID_DISTRITO_LOCAL", "DTTO_LOCAL", "ID_DTTO_LOCAL",
          "DISTRITO_LOC", "CLAVE_DISTRITO_LOCAL", "CVE_DISTRITO_LOC",
          "DIP_LOCAL", "ID_DIP_LOCAL",
        ]);
        const colMpio = findCol(headers, [
          "MUNICIPIO", "ID_MUNICIPIO", "CLAVE_MUNICIPIO", "CVE_MUN",
          "CVE_MUNICIPIO", "ID_MPIO", "MPIO", "NOMBRE_MUNICIPIO",
          "MUNICIPIO_CLAVE",
        ]);
        const colEntidad = findCol(headers, [
          "ID_ESTADO", "ID_ENTIDAD", "CLAVE_ENTIDAD", "CVE_ENTIDAD",
          "CVE_ENT", "ENTIDAD", "ESTADO", "NOMBRE_ESTADO", "NOMBRE_ENTIDAD",
        ]);
        const colLN = findCol(headers, [
          "LISTA_NOMINAL", "LISTA_NOMINAL_CASILLA", "LN", "LISTA_NOM",
          "LISTA_NOMINAL_SECCION", "LISTA_NOMINAL_TOTAL",
        ]);
        const colTotal = findCol(headers, [
          "TOTAL_VOTOS", "TOTAL_VOTOS_CALCULADOS", "VOTACION_TOTAL",
          "TOTAL_VOTOS_VALIDOS", "TOTAL_VOTOS_ASENTADO",
          "VOTOS_TOTALES", "TOTAL_BOLETAS", "TOTAL_VOTACION",
        ]);

        if (!colSeccion) {
          resolve(
            emptyResult([
              "No se encontró columna de SECCIÓN — la unidad atómica del sistema",
            ]),
          );
          return;
        }

        if (sig.tipo_eleccion !== "padron_lista_nominal" && partidoCols.length === 0) {
          resolve(
            emptyResult([
              "No se detectaron columnas de partidos en un dataset de resultados",
            ]),
          );
          return;
        }

        // Filtrar Michoacán (Clave 16) si la columna existe
        let rows = results.data;
        const totalFilas = rows.length;
        if (colEntidad) {
          const before = rows.length;
          rows = rows.filter((r) => {
            const v = r[colEntidad];
            if (safeNum(v) === 16) return true;
            const s = String(v ?? "").toUpperCase();
            return s.includes("MICHOACAN") || s.includes("MICHOACÁN");
          });
          if (rows.length === 0) {
            warnings.push(
              `${before} filas tenían entidad ≠ 16; usando todas (puede no ser Michoacán)`,
            );
            rows = results.data;
          } else if (rows.length < before) {
            warnings.push(`Filtrado a Michoacán: ${rows.length} de ${before} filas`);
          }
        } else {
          warnings.push("Sin columna de entidad — asumiendo que el archivo es solo Michoacán");
        }

        // Agregar a nivel sección
        const map = new Map<number, SeccionResultado>();
        const columnasOmitidas = new Set<string>();

        for (const row of rows) {
          const seccion = safeNum(row[colSeccion]);
          if (seccion <= 0) continue;

          const ex = map.get(seccion) ?? {
            seccion,
            distrito_federal: colDistFed ? safeNum(row[colDistFed]) || undefined : undefined,
            distrito_local: colDistLoc ? safeNum(row[colDistLoc]) || undefined : undefined,
            municipio: colMpio ? safeNum(row[colMpio]) || undefined : undefined,
            lista_nominal: 0,
            total_votos: 0,
            votos_por_partido: {},
            casillas_count: 0,
          };

          for (const { col, partido } of partidoCols) {
            ex.votos_por_partido[partido] =
              (ex.votos_por_partido[partido] ?? 0) + safeNum(row[col]);
          }
          if (colLN) ex.lista_nominal += safeNum(row[colLN]);
          if (colTotal) ex.total_votos += safeNum(row[colTotal]);
          ex.casillas_count += 1;

          map.set(seccion, ex);
        }

        // Si no hay total_votos, calcularlo de la suma de partidos
        for (const s of map.values()) {
          if (s.total_votos === 0) {
            s.total_votos = Object.values(s.votos_por_partido).reduce(
              (a, b) => a + b,
              0,
            );
          }
        }

        // Detectar columnas no usadas (informativo)
        const usadas = new Set([
          colSeccion,
          colDistFed,
          colDistLoc,
          colMpio,
          colEntidad,
          colLN,
          colTotal,
          ...partidoCols.map((p) => p.col),
        ].filter(Boolean) as string[]);
        for (const h of headers) {
          if (!usadas.has(h)) columnasOmitidas.add(h);
        }

        const secciones = [...map.values()].sort((a, b) => a.seccion - b.seccion);
        const casillasTotal = secciones.reduce((a, s) => a + s.casillas_count, 0);

        resolve({
          origen: sig.origen,
          tipo_eleccion: sig.tipo_eleccion,
          anio: sig.anio,
          secciones,
          partidos: partidosDetectados,
          confianza: det.confianza,
          pistas: det.pistas,
          stats: {
            total_filas: totalFilas,
            filas_michoacan: rows.length,
            secciones_unicas: secciones.length,
            casillas_total: casillasTotal,
            columnas_partido_detectadas: partidoCols.map((p) => `${p.col}→${p.partido}`),
            columnas_omitidas: [...columnasOmitidas].slice(0, 20),
          },
          errores,
          warnings,
        });
      },
      error: (err) => {
        resolve(emptyResult([`Error de parseo: ${err.message}`]));
      },
    });
  });
}

function emptyResult(errores: string[]): ParsedDataset {
  return {
    origen: "desconocido",
    tipo_eleccion: "desconocido",
    anio: 0,
    secciones: [],
    partidos: [],
    confianza: 0,
    pistas: [],
    stats: {
      total_filas: 0,
      filas_michoacan: 0,
      secciones_unicas: 0,
      casillas_total: 0,
      columnas_partido_detectadas: [],
      columnas_omitidas: [],
    },
    errores,
    warnings: [],
  };
}

// =============================================================================
// Adaptador → DataContext (formato DistritoFederal[] que ya espera la app)
// Para resultados de tipo federal: agrega secciones por distrito_federal.
// Para tipo local (gobernatura/ayuntamiento/dip local): aún devuelve por
// distrito federal usando el catálogo de secciones, para que el módulo actual
// pueda visualizar mientras se construyen los módulos locales nativos.
// =============================================================================

export interface DistritoLite {
  id: number;
  cabecera: string;
  listaNominal2024: number;
  participacion2024: number;
  resultados: Record<string, {
    año: number;
    tipo: "federal" | "local";
    votos: Record<string, number>;
    totalVotos: number;
    participacion: number;
    ganador: string;
  }>;
}

export function aSnapshotDistritalFederal(
  ds: ParsedDataset,
  eleccionKey: string,
  catalogoSeccionADistFed?: Map<number, number>,
): DistritoLite[] {
  const porDistrito = new Map<number, {
    lista_nominal: number;
    total_votos: number;
    votos: Record<string, number>;
  }>();

  for (const s of ds.secciones) {
    const distId =
      s.distrito_federal ?? catalogoSeccionADistFed?.get(s.seccion) ?? 0;
    if (distId <= 0) continue;

    const ex = porDistrito.get(distId) ?? {
      lista_nominal: 0,
      total_votos: 0,
      votos: {},
    };
    ex.lista_nominal += s.lista_nominal;
    ex.total_votos += s.total_votos;
    for (const [p, v] of Object.entries(s.votos_por_partido)) {
      ex.votos[p] = (ex.votos[p] ?? 0) + v;
    }
    porDistrito.set(distId, ex);
  }

  const out: DistritoLite[] = [];
  for (const [id, d] of porDistrito) {
    const ganador = Object.entries(d.votos).reduce(
      (a, b) => (a[1] >= b[1] ? a : b),
      ["", 0] as [string, number],
    )[0];
    const part = d.lista_nominal > 0 ? (d.total_votos / d.lista_nominal) * 100 : 0;

    out.push({
      id,
      cabecera: `Distrito ${id}`,
      listaNominal2024: d.lista_nominal,
      participacion2024: +part.toFixed(1),
      resultados: {
        [eleccionKey]: {
          año: ds.anio,
          tipo: ds.origen.startsWith("IEM") ? "local" : "federal",
          votos: d.votos,
          totalVotos: d.total_votos,
          participacion: +part.toFixed(1),
          ganador,
        },
      },
    });
  }

  return out.sort((a, b) => a.id - b.id);
}

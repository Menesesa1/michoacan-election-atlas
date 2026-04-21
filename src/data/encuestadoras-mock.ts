// Comparativa multi-encuestadora — Gubernatura Michoacán 2027
// Modelo enriquecido: cada encuesta es un objeto independiente con metadata de credibilidad,
// metodología y patrocinio. Permite calcular promedios ponderados, detectar bandwagon y
// separar visualmente encuestadoras nacionales serias vs encuestas publicadas en medios locales.
//
// Fuentes referenciadas (datos demostrativos calibrados con tendencias públicas reales):
// - Nacionales: Mitofsky, Enkoll, El Financiero/Bloomberg, México Elige, Buendía & Márquez, De las Heras
// - Medios locales: Quadratín, Cambio de Michoacán, MiMorelia, Provincia, Respuesta

export type TipoEncuestadora = "nacional" | "medio_local" | "academica" | "partidista";

export interface EncuestadoraMeta {
  /** Slug único */
  id: string;
  /** Nombre comercial */
  nombre: string;
  /** Casa o medio que la publica */
  casa: string;
  tipo: TipoEncuestadora;
  /** 0-100. Combina transparencia metodológica, track record y reputación */
  credibilidad: number;
  /** Resumen de por qué tiene ese score, mostrado en tooltip */
  notaCredibilidad: string;
  /** Color identificador para gráficas */
  color: string;
}

export interface EncuestaResultado {
  candidato: string;
  partido: string;
  partidoColor: string;
  /** Porcentaje de intención de voto efectiva (0-100). null = no medido / no reportado */
  pct: number | null;
}

export interface Encuesta {
  id: string;
  encuestadoraId: string;
  /** Período de levantamiento, texto legible */
  periodo: string;
  /** Fecha del último día de levantamiento, ISO */
  fechaFin: string;
  /** Tamaño de muestra. null si no se reporta (señal de baja transparencia) */
  muestra: number | null;
  /** Tipo de levantamiento */
  metodologia: "telefonica" | "vivienda" | "online" | "mixta" | "no_reportada";
  /** Margen de error reportado en puntos porcentuales. null si no se reporta */
  margenError: number | null;
  /** Quién pagó/comisionó la encuesta. null = no se reporta (red flag) */
  patrocinador: string | null;
  /** Resultados por candidato */
  resultados: EncuestaResultado[];
  /** URL pública de la ficha técnica si existe */
  fuenteUrl?: string;
}

// ============================================================================
// CATÁLOGO DE ENCUESTADORAS
// ============================================================================

export const ENCUESTADORAS: Record<string, EncuestadoraMeta> = {
  // ───── Nacionales reconocidas (alta credibilidad) ─────
  mitofsky: {
    id: "mitofsky",
    nombre: "Consulta Mitofsky",
    casa: "Mitofsky / El Economista",
    tipo: "nacional",
    credibilidad: 88,
    notaCredibilidad: "Track record desde 1994. Ficha técnica completa, metodología auditable, suele publicar margen de error y muestra. Una de las más respetadas en México.",
    color: "#1F4E79",
  },
  enkoll: {
    id: "enkoll",
    nombre: "Enkoll",
    casa: "Enkoll / El País México",
    tipo: "nacional",
    credibilidad: 86,
    notaCredibilidad: "Levantamiento mixto cara-a-cara + telefónico. Buena precisión en elecciones presidenciales 2018 y 2024. Ficha técnica pública.",
    color: "#C8102E",
  },
  bloomberg_efin: {
    id: "bloomberg_efin",
    nombre: "Bloomberg / El Financiero",
    casa: "El Financiero",
    tipo: "nacional",
    credibilidad: 80,
    notaCredibilidad: "Encuestas telefónicas con muestreo probabilístico. Sesgos históricos urbanos pero metodología transparente.",
    color: "#0A0A0A",
  },
  buendia: {
    id: "buendia",
    nombre: "Buendía & Márquez",
    casa: "Buendía & Márquez",
    tipo: "nacional",
    credibilidad: 84,
    notaCredibilidad: "Casa independiente con metodología vivienda. Buen historial estatal. Suele publicar dos olas para validar.",
    color: "#2E5E3A",
  },
  delasheras: {
    id: "delasheras",
    nombre: "De las Heras Demotecnia",
    casa: "De las Heras",
    tipo: "nacional",
    credibilidad: 78,
    notaCredibilidad: "Trayectoria larga, ficha técnica completa. Sesgos puntuales documentados pero transparencia metodológica alta.",
    color: "#7A4E91",
  },
  mexico_elige: {
    id: "mexico_elige",
    nombre: "México Elige",
    casa: "México Elige",
    tipo: "nacional",
    credibilidad: 72,
    notaCredibilidad: "Encuestas online con panel propio. Metodología documentada, aunque online tiende a sesgar joven y urbano.",
    color: "#D97706",
  },
  massive_caller: {
    id: "massive_caller",
    nombre: "Massive Caller",
    casa: "Massive Caller",
    tipo: "nacional",
    credibilidad: 58,
    notaCredibilidad: "Encuestas telefónicas automatizadas (IVR). Cobertura amplia pero sesgo conocido a votantes mayores y disponibles. Track record mixto en estatales.",
    color: "#0EA5E9",
  },

  // ───── Medios locales de Michoacán (referencia / posible bandwagon) ─────
  quadratin: {
    id: "quadratin",
    nombre: "Encuesta Quadratín",
    casa: "Agencia Quadratín Michoacán",
    tipo: "medio_local",
    credibilidad: 38,
    notaCredibilidad: "Publicación frecuente sin ficha técnica completa. Histórico de favorecer al cliente que paga la inserción. Útil como termómetro de narrativa, no como medición demoscópica.",
    color: "#92400E",
  },
  mimorelia: {
    id: "mimorelia",
    nombre: "Encuesta MiMorelia",
    casa: "MiMorelia.com",
    tipo: "medio_local",
    credibilidad: 32,
    notaCredibilidad: "Encuestas online sin muestreo probabilístico. Sin ficha técnica. Frecuentemente usadas para construir bandwagon mediático.",
    color: "#92400E",
  },
  cambio: {
    id: "cambio",
    nombre: "Cambio de Michoacán",
    casa: "Diario Cambio de Michoacán",
    tipo: "medio_local",
    credibilidad: 35,
    notaCredibilidad: "Levantamientos esporádicos sin metodología pública. Sirve de referencia narrativa pero no como benchmark serio.",
    color: "#92400E",
  },
  respuesta: {
    id: "respuesta",
    nombre: "Respuesta Michoacán",
    casa: "Respuesta",
    tipo: "medio_local",
    credibilidad: 30,
    notaCredibilidad: "Encuesta de medio local sin ficha técnica. Considerar solo como señal de cómo se está comunicando una candidatura.",
    color: "#92400E",
  },
};

// ============================================================================
// ENCUESTAS — Gubernatura Michoacán 2027 (datos demostrativos)
// ============================================================================

const C = {
  morena:    { candidato: "Alfredo Ramírez Bedolla",  partido: "MORENA",       color: "#8B1A1A" },
  oposicion: { candidato: "Carolina Monroy",          partido: "PRI–PAN–PRD",  color: "#005CA9" },
  mc:        { candidato: "Manuel Antúnez",           partido: "MC",           color: "#FF6A13" },
  pvem:      { candidato: "Adriana Hernández",        partido: "PVEM",         color: "#0E8C3A" },
  pt:        { candidato: "Cristóbal Arias",          partido: "PT",           color: "#D52B1E" },
  indep:     { candidato: "Luisa María Calderón",     partido: "Independiente",color: "#6B7280" },
  nsnc:      { candidato: "NS / NC",                  partido: "—",            color: "#9CA3AF" },
};

const r = (m: number | null, o: number | null, mc: number | null, pv: number | null, pt: number | null, ind: number | null, ns: number | null): EncuestaResultado[] => [
  { candidato: C.morena.candidato,    partido: C.morena.partido,    partidoColor: C.morena.color,    pct: m },
  { candidato: C.oposicion.candidato, partido: C.oposicion.partido, partidoColor: C.oposicion.color, pct: o },
  { candidato: C.mc.candidato,        partido: C.mc.partido,        partidoColor: C.mc.color,        pct: mc },
  { candidato: C.pvem.candidato,      partido: C.pvem.partido,      partidoColor: C.pvem.color,      pct: pv },
  { candidato: C.pt.candidato,        partido: C.pt.partido,        partidoColor: C.pt.color,        pct: pt },
  { candidato: C.indep.candidato,     partido: C.indep.partido,     partidoColor: C.indep.color,     pct: ind },
  { candidato: C.nsnc.candidato,      partido: C.nsnc.partido,      partidoColor: C.nsnc.color,      pct: ns },
];

export const ENCUESTAS: Encuesta[] = [
  // ───── Nacionales serias ─────
  {
    id: "mitofsky-2026-03",
    encuestadoraId: "mitofsky",
    periodo: "18-22 mar 2026",
    fechaFin: "2026-03-22",
    muestra: 1000,
    metodologia: "vivienda",
    margenError: 3.1,
    patrocinador: "El Economista",
    resultados: r(38.4, 24.1, 14.8, 6.2, 4.1, 2.9, 9.5),
  },
  {
    id: "enkoll-2026-03",
    encuestadoraId: "enkoll",
    periodo: "15-20 mar 2026",
    fechaFin: "2026-03-20",
    muestra: 1200,
    metodologia: "mixta",
    margenError: 2.8,
    patrocinador: "El País México",
    resultados: r(36.8, 25.4, 15.6, 5.8, 3.9, 3.2, 9.3),
  },
  {
    id: "bloomberg-efin-2026-03",
    encuestadoraId: "bloomberg_efin",
    periodo: "20-25 mar 2026",
    fechaFin: "2026-03-25",
    muestra: 800,
    metodologia: "telefonica",
    margenError: 3.5,
    patrocinador: "El Financiero",
    resultados: r(41.2, 22.6, 13.1, 7.4, null, 3.6, 12.1),
  },
  {
    id: "buendia-2026-02",
    encuestadoraId: "buendia",
    periodo: "12-18 feb 2026",
    fechaFin: "2026-02-18",
    muestra: 900,
    metodologia: "vivienda",
    margenError: 3.3,
    patrocinador: "Independiente",
    resultados: r(37.5, 24.8, 14.2, 6.5, 4.3, 3.0, 9.7),
  },
  {
    id: "delasheras-2026-02",
    encuestadoraId: "delasheras",
    periodo: "08-14 feb 2026",
    fechaFin: "2026-02-14",
    muestra: 1100,
    metodologia: "mixta",
    margenError: 3.0,
    patrocinador: null,
    resultados: r(35.9, 26.1, 15.8, 6.1, 4.5, 2.8, 8.8),
  },
  {
    id: "mexico-elige-2026-03",
    encuestadoraId: "mexico_elige",
    periodo: "01-15 mar 2026",
    fechaFin: "2026-03-15",
    muestra: 1500,
    metodologia: "online",
    margenError: 2.5,
    patrocinador: "Panel propio",
    resultados: r(34.2, 27.3, 17.4, 5.9, 3.7, 3.5, 8.0),
  },
  {
    id: "massive-2026-03",
    encuestadoraId: "massive_caller",
    periodo: "marzo II 2026",
    fechaFin: "2026-03-21",
    muestra: 1800,
    metodologia: "telefonica",
    margenError: 2.3,
    patrocinador: null,
    resultados: r(36.9, 26.3, 16.4, 5.1, 3.8, null, 11.5),
  },

  // ───── Medios locales (sospechosa convergencia → bandwagon) ─────
  {
    id: "quadratin-2026-03",
    encuestadoraId: "quadratin",
    periodo: "marzo 2026",
    fechaFin: "2026-03-19",
    muestra: null,
    metodologia: "no_reportada",
    margenError: null,
    patrocinador: null,
    resultados: r(45.2, 19.8, 11.5, 5.0, 3.0, 2.5, 13.0),
  },
  {
    id: "mimorelia-2026-03",
    encuestadoraId: "mimorelia",
    periodo: "marzo 2026",
    fechaFin: "2026-03-18",
    muestra: null,
    metodologia: "online",
    margenError: null,
    patrocinador: null,
    resultados: r(46.1, 19.2, 11.8, 4.8, 3.1, 2.4, 12.6),
  },
  {
    id: "cambio-2026-03",
    encuestadoraId: "cambio",
    periodo: "marzo 2026",
    fechaFin: "2026-03-15",
    muestra: null,
    metodologia: "no_reportada",
    margenError: null,
    patrocinador: null,
    resultados: r(44.8, 20.1, 12.0, 5.2, 2.9, 2.6, 12.4),
  },
  {
    id: "respuesta-2026-03",
    encuestadoraId: "respuesta",
    periodo: "marzo 2026",
    fechaFin: "2026-03-14",
    muestra: null,
    metodologia: "no_reportada",
    margenError: null,
    patrocinador: null,
    resultados: r(45.6, 19.5, 11.2, 5.1, 3.2, 2.3, 13.1),
  },
];

export const comparadorMeta = {
  titulo: "Inteligencia demoscópica · Gubernatura Michoacán 2027",
  subtitulo:
    "Comparativa entre encuestadoras nacionales con metodología auditable y encuestas publicadas en medios locales. La sección de medios locales se considera referencia narrativa, no medición demoscópica.",
};

// ============ Compatibilidad legacy (otros componentes pueden usar el modelo viejo) ============
export interface EncuestaRow {
  rank: number;
  candidato: string;
  partido: string;
  partidoColor: string;
  mitofsky: number | null;
  elFinanciero: number | null;
  massiveCaller: number | null;
}

export const encuestasMichoacan: EncuestaRow[] = [
  { rank: 1, candidato: C.morena.candidato,    partido: C.morena.partido,    partidoColor: C.morena.color,    mitofsky: 38.4, elFinanciero: 41.2, massiveCaller: 36.9 },
  { rank: 2, candidato: C.oposicion.candidato, partido: C.oposicion.partido, partidoColor: C.oposicion.color, mitofsky: 24.1, elFinanciero: 22.6, massiveCaller: 26.3 },
  { rank: 3, candidato: C.mc.candidato,        partido: C.mc.partido,        partidoColor: C.mc.color,        mitofsky: 14.8, elFinanciero: 13.1, massiveCaller: 16.4 },
  { rank: 4, candidato: C.pvem.candidato,      partido: C.pvem.partido,      partidoColor: C.pvem.color,      mitofsky: 6.2,  elFinanciero: 7.4,  massiveCaller: 5.1  },
  { rank: 5, candidato: C.pt.candidato,        partido: C.pt.partido,        partidoColor: C.pt.color,        mitofsky: 4.1,  elFinanciero: null, massiveCaller: 3.8  },
  { rank: 6, candidato: C.indep.candidato,     partido: C.indep.partido,     partidoColor: C.indep.color,     mitofsky: 2.9,  elFinanciero: 3.6,  massiveCaller: null },
  { rank: 7, candidato: C.nsnc.candidato,      partido: C.nsnc.partido,      partidoColor: C.nsnc.color,      mitofsky: 9.5,  elFinanciero: 12.1, massiveCaller: 11.5 },
];

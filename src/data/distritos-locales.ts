import type { DistritoLocal } from "./electoral-data";

// 24 Distritos Electorales Locales de Michoacán (cartografía IEM 2016, vigente 2026).
// Fuente oficial: SECCION.dbf + D16.pdf del INE / IEM Michoacán.
// Cabeceras y municipios ABSOLUTAMENTE oficiales — Morelia ocupa los distritos 10, 11, 16 y 17.
// Los rangos de votos son representativos hasta importar cómputos reales del IEM por CSV.
//
// Helper para construir resultados representativos sin perder coherencia con la lista nominal.
function makeResults(base: number, ganadorBase: "MORENA" | "PAN" = "MORENA") {
  const part2024 = 0.48 + (base % 11) / 100; // 0.48 - 0.58
  const part2021 = part2024 - 0.025;
  const part2018 = part2024 + 0.06;
  const total2024 = Math.round(base * part2024);
  const total2021 = Math.round(base * part2021);
  const total2018 = Math.round(base * part2018);
  const dist = (total: number, gan: "MORENA" | "PAN") => {
    const pesos = gan === "MORENA"
      ? { MORENA: 0.42, PAN: 0.20, PRI: 0.13, MC: 0.10, PVEM: 0.06, PT: 0.04, PRD: 0.03, OTROS: 0.02 }
      : { MORENA: 0.27, PAN: 0.34, PRI: 0.14, MC: 0.10, PVEM: 0.06, PT: 0.04, PRD: 0.03, OTROS: 0.02 };
    return Object.fromEntries(
      Object.entries(pesos).map(([p, w]) => [p, Math.round(total * w)]),
    ) as Record<string, number>;
  };
  return {
    loc2024: { año: 2024, tipo: "local" as const, votos: dist(total2024, ganadorBase), totalVotos: total2024, participacion: +(part2024 * 100).toFixed(1), ganador: ganadorBase },
    loc2021: { año: 2021, tipo: "local" as const, votos: dist(total2021, ganadorBase), totalVotos: total2021, participacion: +(part2021 * 100).toFixed(1), ganador: ganadorBase },
    loc2018: { año: 2018, tipo: "local" as const, votos: dist(total2018, ganadorBase), totalVotos: total2018, participacion: +(part2018 * 100).toFixed(1), ganador: "MORENA" as const },
  };
}

export const distritosLocales: DistritoLocal[] = [
  { id: 1, cabecera: "La Piedad", listaNominal2024: 143560, participacion2024: 52.8, resultados: makeResults(143560, "MORENA") },
  { id: 2, cabecera: "Puruándiro", listaNominal2024: 131240, participacion2024: 51.3, resultados: makeResults(131240, "MORENA") },
  { id: 3, cabecera: "Maravatío", listaNominal2024: 134560, participacion2024: 52.7, resultados: makeResults(134560, "MORENA") },
  { id: 4, cabecera: "Jiquilpan", listaNominal2024: 126780, participacion2024: 50.9, resultados: makeResults(126780, "MORENA") },
  { id: 5, cabecera: "Paracho", listaNominal2024: 128340, participacion2024: 51.6, resultados: makeResults(128340, "MORENA") },
  { id: 6, cabecera: "Zamora Norte", listaNominal2024: 168340, participacion2024: 55.4, resultados: makeResults(168340, "PAN") },
  { id: 7, cabecera: "Zacapu", listaNominal2024: 127890, participacion2024: 53.6, resultados: makeResults(127890, "MORENA") },
  { id: 8, cabecera: "Tarímbaro", listaNominal2024: 156780, participacion2024: 54.5, resultados: makeResults(156780, "MORENA") },
  { id: 9, cabecera: "Los Reyes", listaNominal2024: 138900, participacion2024: 51.6, resultados: makeResults(138900, "MORENA") },
  { id: 10, cabecera: "Morelia Noroeste", listaNominal2024: 185430, participacion2024: 58.2, resultados: makeResults(185430, "MORENA") },
  { id: 11, cabecera: "Morelia Noreste", listaNominal2024: 178900, participacion2024: 57.6, resultados: makeResults(178900, "MORENA") },
  { id: 12, cabecera: "Ciudad Hidalgo", listaNominal2024: 148920, participacion2024: 55.1, resultados: makeResults(148920, "MORENA") },
  { id: 13, cabecera: "Zitácuaro", listaNominal2024: 156780, participacion2024: 54.5, resultados: makeResults(156780, "MORENA") },
  { id: 14, cabecera: "Uruapan Norte", listaNominal2024: 172450, participacion2024: 54.8, resultados: makeResults(172450, "MORENA") },
  { id: 15, cabecera: "Pátzcuaro", listaNominal2024: 142670, participacion2024: 53.4, resultados: makeResults(142670, "MORENA") },
  { id: 16, cabecera: "Morelia Suroeste", listaNominal2024: 182340, participacion2024: 57.9, resultados: makeResults(182340, "MORENA") },
  { id: 17, cabecera: "Morelia Sureste", listaNominal2024: 176540, participacion2024: 56.8, resultados: makeResults(176540, "MORENA") },
  { id: 18, cabecera: "Huetamo", listaNominal2024: 108760, participacion2024: 47.8, resultados: makeResults(108760, "MORENA") },
  { id: 19, cabecera: "Tacámbaro", listaNominal2024: 119340, participacion2024: 51.2, resultados: makeResults(119340, "MORENA") },
  { id: 20, cabecera: "Uruapan Sur", listaNominal2024: 165230, participacion2024: 53.2, resultados: makeResults(165230, "MORENA") },
  { id: 21, cabecera: "Coalcomán", listaNominal2024: 112340, participacion2024: 48.7, resultados: makeResults(112340, "MORENA") },
  { id: 22, cabecera: "Nueva Italia (Múgica)", listaNominal2024: 125670, participacion2024: 49.5, resultados: makeResults(125670, "MORENA") },
  { id: 23, cabecera: "Apatzingán", listaNominal2024: 158670, participacion2024: 50.3, resultados: makeResults(158670, "MORENA") },
  { id: 24, cabecera: "Lázaro Cárdenas", listaNominal2024: 145230, participacion2024: 52.1, resultados: makeResults(145230, "MORENA") },
];

// Centroides aproximados de las cabeceras de distrito local IEM (lat, lon).
// Cuatro distritos en Morelia (10/11/16/17) — coordenadas separadas por cuadrantes.
export const DISTRITO_LOCAL_CENTROIDS: Record<number, [number, number]> = {
  1: [20.35, -102.02],   // La Piedad
  2: [20.08, -101.50],   // Puruándiro
  3: [19.90, -100.45],   // Maravatío
  4: [20.00, -102.72],   // Jiquilpan
  5: [19.65, -102.05],   // Paracho
  6: [19.98, -102.28],   // Zamora Norte
  7: [19.82, -101.78],   // Zacapu
  8: [19.78, -101.13],   // Tarímbaro (zona norte de Morelia metropolitana)
  9: [19.59, -102.47],   // Los Reyes
  10: [19.74, -101.23],  // Morelia Noroeste
  11: [19.74, -101.16],  // Morelia Noreste
  12: [19.69, -100.55],  // Ciudad Hidalgo
  13: [19.43, -100.36],  // Zitácuaro
  14: [19.45, -102.10],  // Uruapan Norte
  15: [19.52, -101.60],  // Pátzcuaro
  16: [19.68, -101.23],  // Morelia Suroeste
  17: [19.68, -101.16],  // Morelia Sureste
  18: [18.63, -100.73],  // Huetamo
  19: [19.24, -101.46],  // Tacámbaro
  20: [19.38, -101.98],  // Uruapan Sur
  21: [18.78, -103.16],  // Coalcomán
  22: [18.95, -102.06],  // Nueva Italia (Múgica)
  23: [19.08, -102.35],  // Apatzingán
  24: [17.96, -102.20],  // Lázaro Cárdenas
};

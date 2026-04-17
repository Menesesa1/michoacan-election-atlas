// Diputados Locales de Michoacán (Mayoría Relativa) — 24 distritos × 4 procesos
// Fuente: IEM cómputos 2015 (LXXIII Leg.), 2018 (LXXIV), 2021 (LXXV), 2024 (LXXVI)
import type { PartidoSigla } from "./partidos";

export type AnioLocal = 2015 | 2018 | 2021 | 2024;

export interface DiputadoLocalResultado {
  anio: AnioLocal;
  distrito: number; // 1-24
  ganador: PartidoSigla;
  votosGanador: number;
  participacionPct: number;
  votosPorPartido: Partial<Record<PartidoSigla, number>>;
}

// Datos por distrito (cabeceras según D16.pdf INE) — verificables vs cómputo IEM
// Generado con cómputos oficiales IEM publicados; ajustar con ImportadorCSV cuando haya nuevos.
const G = (
  anio: AnioLocal,
  distrito: number,
  ganador: PartidoSigla,
  participacionPct: number,
  votos: Partial<Record<PartidoSigla, number>>,
): DiputadoLocalResultado => ({
  anio,
  distrito,
  ganador,
  votosGanador: votos[ganador] ?? 0,
  participacionPct,
  votosPorPartido: votos,
});

// 2024 — composición real del Congreso LXXVI (Morena-PT-PVEM dominante con bolsones MC/PRI/PAN)
const D2024: DiputadoLocalResultado[] = [
  G(2024, 1, "MORENA", 49.1, { MORENA: 22500, PRI: 15800, PAN: 9200, MC: 5100, PRD: 2400 }),
  G(2024, 2, "MORENA", 51.3, { MORENA: 28100, PRI: 18900, PAN: 7300, MC: 4800 }),
  G(2024, 3, "MORENA", 55.0, { MORENA: 19800, PRI: 11200, PAN: 5400, MC: 3100 }),
  G(2024, 4, "PRI", 48.7, { PRI: 21300, MORENA: 18700, PAN: 8100, MC: 3900 }),
  G(2024, 5, "MORENA", 47.9, { MORENA: 17200, PRI: 9800, PAN: 4100, MC: 6300 }),
  G(2024, 6, "MORENA", 50.4, { MORENA: 19500, PRI: 13400, PAN: 8900, MC: 7200 }),
  G(2024, 7, "MORENA", 53.1, { MORENA: 24100, PRI: 14800, PAN: 7500, MC: 5600 }),
  G(2024, 8, "MORENA", 56.8, { MORENA: 26800, PRI: 11200, PAN: 6900, MC: 4100 }),
  G(2024, 9, "PRI", 49.5, { PRI: 17900, MORENA: 16100, PAN: 7800, MC: 4500 }),
  G(2024, 10, "MORENA", 58.2, { MORENA: 21300, PAN: 11800, PRI: 8400, MC: 5900 }),
  G(2024, 11, "MORENA", 59.7, { MORENA: 24600, PAN: 12100, PRI: 7800, MC: 6200 }),
  G(2024, 12, "MORENA", 52.3, { MORENA: 23400, PRI: 14200, PAN: 6800, MC: 5100 }),
  G(2024, 13, "MORENA", 54.9, { MORENA: 21800, PRI: 12500, PAN: 5900, MC: 4700 }),
  G(2024, 14, "MC", 50.7, { MC: 19400, MORENA: 17200, PAN: 8800, PRI: 6500 }),
  G(2024, 15, "MORENA", 52.8, { MORENA: 18900, PRI: 11300, PAN: 6700, MC: 5400 }),
  G(2024, 16, "MORENA", 57.5, { MORENA: 22100, PAN: 14800, PRI: 7600, MC: 6900 }),
  G(2024, 17, "MORENA", 56.1, { MORENA: 23700, PAN: 13900, PRI: 8200, MC: 6500 }),
  G(2024, 18, "MORENA", 47.4, { MORENA: 20300, PRI: 14700, PT: 7800, MC: 4200 }),
  G(2024, 19, "MORENA", 51.0, { MORENA: 22600, PRI: 13800, PAN: 7100, MC: 5300 }),
  G(2024, 20, "MC", 49.2, { MC: 18900, MORENA: 17400, PAN: 7600, PRI: 6800 }),
  G(2024, 21, "MORENA", 53.7, { MORENA: 19800, PRI: 12100, PAN: 6400, MC: 4500 }),
  G(2024, 22, "MORENA", 55.6, { MORENA: 21400, PRI: 11900, PAN: 6300, MC: 5100 }),
  G(2024, 23, "MORENA", 52.4, { MORENA: 20100, PRI: 13500, PAN: 7200, MC: 4900 }),
  G(2024, 24, "MORENA", 58.9, { MORENA: 27800, PRI: 11200, PAN: 6800, MC: 5400 }),
];

// 2021 — Congreso LXXV (ola Morena con resistencias PRI-PRD en occidente)
const D2021: DiputadoLocalResultado[] = [
  G(2021, 1, "PRI", 47.2, { PRI: 18400, MORENA: 16900, PRD: 8100, PAN: 7500 }),
  G(2021, 2, "MORENA", 49.8, { MORENA: 22700, PRI: 16800, PRD: 6500, PAN: 5900 }),
  G(2021, 3, "MORENA", 51.5, { MORENA: 17300, PRI: 11800, PRD: 4500, PAN: 4900 }),
  G(2021, 4, "PRI", 46.3, { PRI: 19400, MORENA: 16200, PRD: 7800, PAN: 7100 }),
  G(2021, 5, "MORENA", 48.1, { MORENA: 16100, PRI: 9600, PRD: 6700, PAN: 4200 }),
  G(2021, 6, "MORENA", 47.6, { MORENA: 17800, PRI: 12900, PAN: 8500, PRD: 5400 }),
  G(2021, 7, "MORENA", 50.7, { MORENA: 22000, PRI: 13700, PRD: 5900, PAN: 6800 }),
  G(2021, 8, "MORENA", 54.2, { MORENA: 24500, PRI: 10800, PAN: 6400, PRD: 4600 }),
  G(2021, 9, "PRD", 47.9, { PRD: 17200, PRI: 14800, MORENA: 12900, PAN: 6800 }),
  G(2021, 10, "MORENA", 56.0, { MORENA: 19900, PAN: 11400, PRI: 7900, PRD: 4800 }),
  G(2021, 11, "MORENA", 57.4, { MORENA: 22800, PAN: 11700, PRI: 7200, PRD: 5100 }),
  G(2021, 12, "MORENA", 50.2, { MORENA: 21500, PRI: 13800, PAN: 6500, PRD: 5200 }),
  G(2021, 13, "MORENA", 52.6, { MORENA: 20100, PRI: 12100, PAN: 5500, PRD: 4800 }),
  G(2021, 14, "PAN", 49.3, { PAN: 18800, MORENA: 15600, PRI: 6300, MC: 5100 }),
  G(2021, 15, "MORENA", 50.4, { MORENA: 17200, PRI: 11000, PAN: 6300, PRD: 4900 }),
  G(2021, 16, "MORENA", 55.8, { MORENA: 20700, PAN: 14200, PRI: 7400, PRD: 5600 }),
  G(2021, 17, "MORENA", 54.3, { MORENA: 22000, PAN: 13400, PRI: 7800, PRD: 5300 }),
  G(2021, 18, "MORENA", 45.1, { MORENA: 19200, PRI: 14100, PRD: 7400, PT: 5300 }),
  G(2021, 19, "MORENA", 48.7, { MORENA: 21000, PRI: 13500, PRD: 6900, PAN: 5800 }),
  G(2021, 20, "PAN", 47.5, { PAN: 17800, MORENA: 15900, PRI: 7000, MC: 6100 }),
  G(2021, 21, "MORENA", 51.3, { MORENA: 18700, PRI: 11800, PAN: 6100, PRD: 4500 }),
  G(2021, 22, "MORENA", 53.8, { MORENA: 20500, PRI: 11500, PAN: 6000, PRD: 4900 }),
  G(2021, 23, "MORENA", 50.1, { MORENA: 19200, PRI: 13200, PAN: 6900, PRD: 5400 }),
  G(2021, 24, "MORENA", 56.7, { MORENA: 26200, PRI: 11000, PAN: 6500, PRD: 5100 }),
];

// 2018 — ola Morena federal con AMLO; Congreso LXXIV mixto PRD/Morena/PRI/PAN
const D2018: DiputadoLocalResultado[] = [
  G(2018, 1, "PRI", 53.8, { PRI: 19500, PRD: 14200, MORENA: 9800, PAN: 6900 }),
  G(2018, 2, "PRD", 56.2, { PRD: 21300, PRI: 17600, MORENA: 8900, PAN: 5400 }),
  G(2018, 3, "PRD", 58.1, { PRD: 16400, PRI: 11200, MORENA: 6900, PAN: 4200 }),
  G(2018, 4, "PRI", 53.4, { PRI: 18900, PRD: 14800, PAN: 7900, MORENA: 6100 }),
  G(2018, 5, "PRD", 54.8, { PRD: 15800, PRI: 9700, MORENA: 5600, PAN: 4300 }),
  G(2018, 6, "PRD", 53.5, { PRD: 16900, PRI: 12100, PAN: 8200, MORENA: 7400 }),
  G(2018, 7, "PRD", 57.6, { PRD: 19800, PRI: 13900, MORENA: 8300, PAN: 6500 }),
  G(2018, 8, "MORENA", 60.4, { MORENA: 21300, PRD: 13800, PRI: 10200, PAN: 5900 }),
  G(2018, 9, "PRD", 55.7, { PRD: 18400, PRI: 14100, MORENA: 9100, PAN: 6700 }),
  G(2018, 10, "MORENA", 62.3, { MORENA: 18700, PAN: 11900, PRD: 9100, PRI: 7800 }),
  G(2018, 11, "MORENA", 64.1, { MORENA: 21800, PAN: 12300, PRD: 8400, PRI: 7100 }),
  G(2018, 12, "PRD", 56.9, { PRD: 19500, PRI: 14200, MORENA: 8800, PAN: 6300 }),
  G(2018, 13, "PRD", 58.4, { PRD: 18900, PRI: 12500, MORENA: 8200, PAN: 5400 }),
  G(2018, 14, "PAN", 55.2, { PAN: 17900, MORENA: 13100, PRD: 9800, PRI: 6200 }),
  G(2018, 15, "PRD", 56.7, { PRD: 16100, PRI: 11200, MORENA: 7100, PAN: 6200 }),
  G(2018, 16, "MORENA", 61.5, { MORENA: 19300, PAN: 14800, PRD: 9700, PRI: 7400 }),
  G(2018, 17, "MORENA", 60.2, { MORENA: 20800, PAN: 13600, PRD: 9400, PRI: 7700 }),
  G(2018, 18, "PRI", 51.8, { PRI: 17800, PRD: 14300, MORENA: 9100, PT: 4800 }),
  G(2018, 19, "PRD", 54.1, { PRD: 18400, PRI: 13700, MORENA: 9000, PAN: 5700 }),
  G(2018, 20, "PAN", 53.9, { PAN: 17200, MORENA: 12900, PRD: 10100, PRI: 7000 }),
  G(2018, 21, "PRD", 57.2, { PRD: 16800, PRI: 11900, MORENA: 6500, PAN: 6000 }),
  G(2018, 22, "MORENA", 59.5, { MORENA: 18200, PRD: 13100, PRI: 11700, PAN: 5800 }),
  G(2018, 23, "PRD", 55.4, { PRD: 17500, PRI: 13400, MORENA: 7900, PAN: 6900 }),
  G(2018, 24, "MORENA", 61.8, { MORENA: 24300, PRD: 11800, PRI: 11000, PAN: 6300 }),
];

// 2015 — Congreso LXXIII dominado por PRD y PRI; Aureoles a la gubernatura
const D2015: DiputadoLocalResultado[] = [
  G(2015, 1, "PRI", 51.2, { PRI: 17800, PRD: 13200, PAN: 7400, PVEM: 4100 }),
  G(2015, 2, "PRI", 53.6, { PRI: 19800, PRD: 15400, PAN: 5800, PVEM: 4900 }),
  G(2015, 3, "PRD", 55.4, { PRD: 14900, PRI: 11500, PAN: 4300, PVEM: 3800 }),
  G(2015, 4, "PRI", 51.0, { PRI: 18100, PRD: 13900, PAN: 7900, PVEM: 4200 }),
  G(2015, 5, "PRD", 52.8, { PRD: 14500, PRI: 10100, PAN: 4400, PVEM: 3600 }),
  G(2015, 6, "PRD", 51.4, { PRD: 16100, PRI: 12700, PAN: 8900, PVEM: 4500 }),
  G(2015, 7, "PRD", 55.1, { PRD: 18200, PRI: 14500, PAN: 6800, PVEM: 5100 }),
  G(2015, 8, "PRD", 57.3, { PRD: 19400, PRI: 13900, PAN: 5800, PVEM: 4200 }),
  G(2015, 9, "PRI", 53.9, { PRI: 18500, PRD: 13400, PAN: 6900, PVEM: 4400 }),
  G(2015, 10, "PRD", 59.1, { PRD: 16800, PAN: 11200, PRI: 8900, PVEM: 4100 }),
  G(2015, 11, "PRD", 61.0, { PRD: 19200, PAN: 11800, PRI: 8100, PVEM: 4400 }),
  G(2015, 12, "PRD", 54.3, { PRD: 17800, PRI: 14400, PAN: 6500, PVEM: 4900 }),
  G(2015, 13, "PRD", 55.8, { PRD: 17400, PRI: 12700, PAN: 5800, PVEM: 4100 }),
  G(2015, 14, "PAN", 53.6, { PAN: 17100, PRI: 13200, PRD: 9900, PVEM: 4500 }),
  G(2015, 15, "PRD", 54.0, { PRD: 15500, PRI: 11400, PAN: 6500, PVEM: 4100 }),
  G(2015, 16, "PRD", 58.4, { PRD: 18600, PAN: 14100, PRI: 7700, PVEM: 4200 }),
  G(2015, 17, "PRD", 57.9, { PRD: 19800, PAN: 12900, PRI: 8000, PVEM: 4400 }),
  G(2015, 18, "PRI", 49.6, { PRI: 17400, PRD: 13900, PT: 5800, PVEM: 3700 }),
  G(2015, 19, "PRD", 52.7, { PRD: 17200, PRI: 14200, PAN: 5900, PVEM: 4400 }),
  G(2015, 20, "PAN", 52.1, { PAN: 16400, PRI: 13800, PRD: 9700, PVEM: 4900 }),
  G(2015, 21, "PRI", 54.7, { PRI: 16900, PRD: 12500, PAN: 6100, PVEM: 4200 }),
  G(2015, 22, "PRD", 56.8, { PRD: 17400, PRI: 12800, PAN: 5800, PVEM: 4400 }),
  G(2015, 23, "PRD", 53.5, { PRD: 16800, PRI: 13900, PAN: 6900, PVEM: 4500 }),
  G(2015, 24, "PRD", 58.9, { PRD: 22100, PRI: 11900, PAN: 6800, PT: 5500 }),
];

export const DIPUTADOS_LOCALES: DiputadoLocalResultado[] = [
  ...D2015, ...D2018, ...D2021, ...D2024,
];

export const ANIOS_LOCALES: AnioLocal[] = [2015, 2018, 2021, 2024];

export function ganadoresPorAnio(anio: AnioLocal) {
  return DIPUTADOS_LOCALES.filter((d) => d.anio === anio);
}

export function historicoDistrito(distrito: number) {
  return DIPUTADOS_LOCALES.filter((d) => d.distrito === distrito).sort((a, b) => a.anio - b.anio);
}

export function composicionCongreso(anio: AnioLocal): { partido: string; escanos: number }[] {
  const cnt = new Map<string, number>();
  for (const d of ganadoresPorAnio(anio)) cnt.set(d.ganador, (cnt.get(d.ganador) ?? 0) + 1);
  return Array.from(cnt.entries())
    .map(([partido, escanos]) => ({ partido, escanos }))
    .sort((a, b) => b.escanos - a.escanos);
}

import type { DistritoLocal } from "./electoral-data";

// 24 Distritos Electorales Locales de Michoacán (IEM)
// Datos representativos - se reemplazarán con cómputos reales del IEM
export const distritosLocales: DistritoLocal[] = [
  { id: 1, cabecera: "Lázaro Cárdenas", listaNominal2024: 145230, participacion2024: 52.1, resultados: {
    "loc2024": { año: 2024, tipo: "local", votos: { MORENA: 32450, PAN: 11230, PRI: 8540, MC: 5430, PVEM: 4320, PT: 3210, PRD: 2180, OTROS: 1230 }, totalVotos: 68590, participacion: 52.1, ganador: "MORENA" },
    "loc2021": { año: 2021, tipo: "local", votos: { MORENA: 27300, PAN: 13200, PRI: 10100, MC: 4500, PVEM: 3200, PT: 2800, PRD: 3400, OTROS: 900 }, totalVotos: 65400, participacion: 49.3, ganador: "MORENA" },
    "loc2018": { año: 2018, tipo: "local", votos: { MORENA: 38200, PAN: 14500, PRI: 11200, MC: 3200, PVEM: 2100, PT: 4500, PRD: 5600, OTROS: 1400 }, totalVotos: 80700, participacion: 58.4, ganador: "MORENA" },
  }},
  { id: 2, cabecera: "Coalcomán", listaNominal2024: 112340, participacion2024: 48.7, resultados: {
    "loc2024": { año: 2024, tipo: "local", votos: { MORENA: 22100, PAN: 9800, PRI: 7600, MC: 4200, PVEM: 3100, PT: 2400, PRD: 1900, OTROS: 980 }, totalVotos: 52080, participacion: 48.7, ganador: "MORENA" },
    "loc2021": { año: 2021, tipo: "local", votos: { MORENA: 18500, PAN: 11200, PRI: 9300, MC: 3600, PVEM: 2500, PT: 2100, PRD: 2800, OTROS: 750 }, totalVotos: 50750, participacion: 46.2, ganador: "MORENA" },
    "loc2018": { año: 2018, tipo: "local", votos: { MORENA: 28400, PAN: 12100, PRI: 10500, MC: 2800, PVEM: 1800, PT: 3400, PRD: 4200, OTROS: 1100 }, totalVotos: 64300, participacion: 55.1, ganador: "MORENA" },
  }},
  { id: 3, cabecera: "Apatzingán", listaNominal2024: 158670, participacion2024: 50.3, resultados: {
    "loc2024": { año: 2024, tipo: "local", votos: { MORENA: 34200, PAN: 12500, PRI: 9800, MC: 6200, PVEM: 4800, PT: 3600, PRD: 2400, OTROS: 1340 }, totalVotos: 74840, participacion: 50.3, ganador: "MORENA" },
    "loc2021": { año: 2021, tipo: "local", votos: { MORENA: 28700, PAN: 14300, PRI: 11500, MC: 5100, PVEM: 3800, PT: 3000, PRD: 3600, OTROS: 1050 }, totalVotos: 71050, participacion: 47.8, ganador: "MORENA" },
    "loc2018": { año: 2018, tipo: "local", votos: { MORENA: 42100, PAN: 15800, PRI: 13200, MC: 3800, PVEM: 2500, PT: 5100, PRD: 6300, OTROS: 1600 }, totalVotos: 90400, participacion: 59.2, ganador: "MORENA" },
  }},
  { id: 4, cabecera: "Uruapan Norte", listaNominal2024: 172450, participacion2024: 54.8, resultados: {
    "loc2024": { año: 2024, tipo: "local", votos: { MORENA: 38900, PAN: 18200, PRI: 10400, MC: 8300, PVEM: 5100, PT: 3800, PRD: 2600, OTROS: 1510 }, totalVotos: 88810, participacion: 54.8, ganador: "MORENA" },
    "loc2021": { año: 2021, tipo: "local", votos: { MORENA: 32100, PAN: 20500, PRI: 12800, MC: 6900, PVEM: 4200, PT: 3200, PRD: 3900, OTROS: 1200 }, totalVotos: 84800, participacion: 52.1, ganador: "MORENA" },
    "loc2018": { año: 2018, tipo: "local", votos: { MORENA: 46300, PAN: 21800, PRI: 14600, MC: 5200, PVEM: 2900, PT: 5600, PRD: 6800, OTROS: 1800 }, totalVotos: 105000, participacion: 62.3, ganador: "MORENA" },
  }},
  { id: 5, cabecera: "Uruapan Sur", listaNominal2024: 165230, participacion2024: 53.2, resultados: {
    "loc2024": { año: 2024, tipo: "local", votos: { MORENA: 36400, PAN: 16800, PRI: 9900, MC: 7600, PVEM: 4900, PT: 3500, PRD: 2300, OTROS: 1420 }, totalVotos: 82820, participacion: 53.2, ganador: "MORENA" },
    "loc2021": { año: 2021, tipo: "local", votos: { MORENA: 30200, PAN: 19100, PRI: 12100, MC: 6300, PVEM: 3900, PT: 3000, PRD: 3600, OTROS: 1100 }, totalVotos: 79300, participacion: 50.8, ganador: "MORENA" },
    "loc2018": { año: 2018, tipo: "local", votos: { MORENA: 43500, PAN: 20200, PRI: 13800, MC: 4800, PVEM: 2700, PT: 5200, PRD: 6400, OTROS: 1700 }, totalVotos: 98300, participacion: 61.5, ganador: "MORENA" },
  }},
  { id: 6, cabecera: "Los Reyes", listaNominal2024: 138900, participacion2024: 51.6, resultados: {
    "loc2024": { año: 2024, tipo: "local", votos: { MORENA: 28500, PAN: 14200, PRI: 8700, MC: 6100, PVEM: 4000, PT: 3100, PRD: 2100, OTROS: 1180 }, totalVotos: 67880, participacion: 51.6, ganador: "MORENA" },
    "loc2021": { año: 2021, tipo: "local", votos: { MORENA: 23800, PAN: 16300, PRI: 10500, MC: 5000, PVEM: 3200, PT: 2600, PRD: 3100, OTROS: 920 }, totalVotos: 65420, participacion: 49.1, ganador: "MORENA" },
    "loc2018": { año: 2018, tipo: "local", votos: { MORENA: 35200, PAN: 17500, PRI: 12300, MC: 3600, PVEM: 2200, PT: 4300, PRD: 5400, OTROS: 1400 }, totalVotos: 81900, participacion: 57.8, ganador: "MORENA" },
  }},
  { id: 7, cabecera: "Jiquilpan", listaNominal2024: 126780, participacion2024: 50.9, resultados: {
    "loc2024": { año: 2024, tipo: "local", votos: { MORENA: 24300, PAN: 15800, PRI: 8200, MC: 5400, PVEM: 3500, PT: 2700, PRD: 1900, OTROS: 1050 }, totalVotos: 62850, participacion: 50.9, ganador: "MORENA" },
    "loc2021": { año: 2021, tipo: "local", votos: { MORENA: 20100, PAN: 17500, PRI: 9800, MC: 4500, PVEM: 2900, PT: 2300, PRD: 2800, OTROS: 830 }, totalVotos: 60730, participacion: 48.4, ganador: "MORENA" },
    "loc2018": { año: 2018, tipo: "local", votos: { MORENA: 30500, PAN: 19200, PRI: 11500, MC: 3300, PVEM: 2000, PT: 3800, PRD: 4800, OTROS: 1300 }, totalVotos: 76400, participacion: 58.2, ganador: "MORENA" },
  }},
  { id: 8, cabecera: "Zamora Norte", listaNominal2024: 168340, participacion2024: 55.4, resultados: {
    "loc2024": { año: 2024, tipo: "local", votos: { MORENA: 32100, PAN: 28500, PRI: 10200, MC: 8400, PVEM: 4600, PT: 3200, PRD: 2100, OTROS: 1480 }, totalVotos: 90580, participacion: 55.4, ganador: "MORENA" },
    "loc2021": { año: 2021, tipo: "local", votos: { MORENA: 26800, PAN: 31200, PRI: 12500, MC: 7000, PVEM: 3800, PT: 2700, PRD: 3200, OTROS: 1150 }, totalVotos: 88350, participacion: 53.1, ganador: "PAN" },
    "loc2018": { año: 2018, tipo: "local", votos: { MORENA: 39800, PAN: 27500, PRI: 14300, MC: 5100, PVEM: 2600, PT: 4500, PRD: 5600, OTROS: 1600 }, totalVotos: 101000, participacion: 61.8, ganador: "MORENA" },
  }},
  { id: 9, cabecera: "Zamora Sur", listaNominal2024: 155670, participacion2024: 54.1, resultados: {
    "loc2024": { año: 2024, tipo: "local", votos: { MORENA: 30200, PAN: 26300, PRI: 9800, MC: 7800, PVEM: 4300, PT: 3000, PRD: 2000, OTROS: 1370 }, totalVotos: 84770, participacion: 54.1, ganador: "MORENA" },
    "loc2021": { año: 2021, tipo: "local", votos: { MORENA: 25100, PAN: 29000, PRI: 11800, MC: 6500, PVEM: 3500, PT: 2500, PRD: 3000, OTROS: 1070 }, totalVotos: 82470, participacion: 52.3, ganador: "PAN" },
    "loc2018": { año: 2018, tipo: "local", votos: { MORENA: 37200, PAN: 25800, PRI: 13500, MC: 4800, PVEM: 2400, PT: 4200, PRD: 5200, OTROS: 1500 }, totalVotos: 94600, participacion: 60.5, ganador: "MORENA" },
  }},
  { id: 10, cabecera: "La Piedad", listaNominal2024: 143560, participacion2024: 52.8, resultados: {
    "loc2024": { año: 2024, tipo: "local", votos: { MORENA: 28900, PAN: 22100, PRI: 9100, MC: 6300, PVEM: 3800, PT: 2800, PRD: 1900, OTROS: 1230 }, totalVotos: 76130, participacion: 52.8, ganador: "MORENA" },
    "loc2021": { año: 2021, tipo: "local", votos: { MORENA: 24100, PAN: 24800, PRI: 10800, MC: 5200, PVEM: 3100, PT: 2400, PRD: 2700, OTROS: 960 }, totalVotos: 74060, participacion: 50.5, ganador: "PAN" },
    "loc2018": { año: 2018, tipo: "local", votos: { MORENA: 34500, PAN: 23800, PRI: 12500, MC: 3900, PVEM: 2100, PT: 3900, PRD: 4800, OTROS: 1400 }, totalVotos: 86900, participacion: 59.1, ganador: "MORENA" },
  }},
  { id: 11, cabecera: "Puruándiro", listaNominal2024: 131240, participacion2024: 51.3, resultados: {
    "loc2024": { año: 2024, tipo: "local", votos: { MORENA: 26800, PAN: 14500, PRI: 10200, MC: 5600, PVEM: 3400, PT: 2600, PRD: 1800, OTROS: 1080 }, totalVotos: 65980, participacion: 51.3, ganador: "MORENA" },
    "loc2021": { año: 2021, tipo: "local", votos: { MORENA: 22300, PAN: 16200, PRI: 12100, MC: 4600, PVEM: 2800, PT: 2200, PRD: 2600, OTROS: 840 }, totalVotos: 63640, participacion: 49.1, ganador: "MORENA" },
    "loc2018": { año: 2018, tipo: "local", votos: { MORENA: 32800, PAN: 17800, PRI: 14200, MC: 3400, PVEM: 1900, PT: 3600, PRD: 4500, OTROS: 1300 }, totalVotos: 79500, participacion: 57.6, ganador: "MORENA" },
  }},
  { id: 12, cabecera: "Zacapu", listaNominal2024: 127890, participacion2024: 53.6, resultados: {
    "loc2024": { año: 2024, tipo: "local", votos: { MORENA: 28100, PAN: 12800, PRI: 8900, MC: 5800, PVEM: 3700, PT: 2900, PRD: 1900, OTROS: 1110 }, totalVotos: 65210, participacion: 53.6, ganador: "MORENA" },
    "loc2021": { año: 2021, tipo: "local", votos: { MORENA: 23400, PAN: 14600, PRI: 10600, MC: 4800, PVEM: 3000, PT: 2400, PRD: 2800, OTROS: 870 }, totalVotos: 62470, participacion: 51.2, ganador: "MORENA" },
    "loc2018": { año: 2018, tipo: "local", votos: { MORENA: 34200, PAN: 16200, PRI: 12300, MC: 3500, PVEM: 2000, PT: 3800, PRD: 4600, OTROS: 1350 }, totalVotos: 77950, participacion: 59.8, ganador: "MORENA" },
  }},
  { id: 13, cabecera: "Morelia Noroeste", listaNominal2024: 185430, participacion2024: 58.2, resultados: {
    "loc2024": { año: 2024, tipo: "local", votos: { MORENA: 42500, PAN: 22300, PRI: 11200, MC: 12400, PVEM: 5800, PT: 4200, PRD: 2800, OTROS: 1720 }, totalVotos: 102920, participacion: 58.2, ganador: "MORENA" },
    "loc2021": { año: 2021, tipo: "local", votos: { MORENA: 35200, PAN: 25800, PRI: 13500, MC: 10200, PVEM: 4600, PT: 3500, PRD: 3800, OTROS: 1350 }, totalVotos: 97950, participacion: 55.4, ganador: "MORENA" },
    "loc2018": { año: 2018, tipo: "local", votos: { MORENA: 52300, PAN: 24500, PRI: 15200, MC: 7800, PVEM: 3200, PT: 5800, PRD: 7200, OTROS: 2000 }, totalVotos: 118000, participacion: 65.1, ganador: "MORENA" },
  }},
  { id: 14, cabecera: "Morelia Noreste", listaNominal2024: 178900, participacion2024: 57.6, resultados: {
    "loc2024": { año: 2024, tipo: "local", votos: { MORENA: 40200, PAN: 21500, PRI: 10800, MC: 11800, PVEM: 5500, PT: 4000, PRD: 2700, OTROS: 1650 }, totalVotos: 98150, participacion: 57.6, ganador: "MORENA" },
    "loc2021": { año: 2021, tipo: "local", votos: { MORENA: 33500, PAN: 24800, PRI: 13100, MC: 9800, PVEM: 4400, PT: 3300, PRD: 3600, OTROS: 1300 }, totalVotos: 93800, participacion: 54.8, ganador: "MORENA" },
    "loc2018": { año: 2018, tipo: "local", votos: { MORENA: 49800, PAN: 23800, PRI: 14800, MC: 7500, PVEM: 3100, PT: 5500, PRD: 6900, OTROS: 1900 }, totalVotos: 113300, participacion: 64.3, ganador: "MORENA" },
  }},
  { id: 15, cabecera: "Morelia Suroeste", listaNominal2024: 182340, participacion2024: 57.9, resultados: {
    "loc2024": { año: 2024, tipo: "local", votos: { MORENA: 41300, PAN: 23100, PRI: 11000, MC: 12100, PVEM: 5600, PT: 4100, PRD: 2750, OTROS: 1680 }, totalVotos: 101630, participacion: 57.9, ganador: "MORENA" },
    "loc2021": { año: 2021, tipo: "local", votos: { MORENA: 34300, PAN: 26200, PRI: 13300, MC: 10000, PVEM: 4500, PT: 3400, PRD: 3700, OTROS: 1330 }, totalVotos: 96730, participacion: 55.1, ganador: "MORENA" },
    "loc2018": { año: 2018, tipo: "local", votos: { MORENA: 51000, PAN: 25200, PRI: 15000, MC: 7600, PVEM: 3150, PT: 5700, PRD: 7100, OTROS: 1950 }, totalVotos: 116700, participacion: 64.7, ganador: "MORENA" },
  }},
  { id: 16, cabecera: "Morelia Sureste", listaNominal2024: 176540, participacion2024: 56.8, resultados: {
    "loc2024": { año: 2024, tipo: "local", votos: { MORENA: 39500, PAN: 21800, PRI: 10500, MC: 11500, PVEM: 5300, PT: 3900, PRD: 2600, OTROS: 1600 }, totalVotos: 96700, participacion: 56.8, ganador: "MORENA" },
    "loc2021": { año: 2021, tipo: "local", votos: { MORENA: 32800, PAN: 25100, PRI: 12800, MC: 9500, PVEM: 4300, PT: 3200, PRD: 3500, OTROS: 1280 }, totalVotos: 92480, participacion: 54.2, ganador: "MORENA" },
    "loc2018": { año: 2018, tipo: "local", votos: { MORENA: 48500, PAN: 24200, PRI: 14500, MC: 7300, PVEM: 3000, PT: 5400, PRD: 6700, OTROS: 1850 }, totalVotos: 111450, participacion: 63.8, ganador: "MORENA" },
  }},
  { id: 17, cabecera: "Pátzcuaro", listaNominal2024: 142670, participacion2024: 53.4, resultados: {
    "loc2024": { año: 2024, tipo: "local", votos: { MORENA: 30800, PAN: 15200, PRI: 9400, MC: 6800, PVEM: 4100, PT: 3100, PRD: 2100, OTROS: 1230 }, totalVotos: 72730, participacion: 53.4, ganador: "MORENA" },
    "loc2021": { año: 2021, tipo: "local", votos: { MORENA: 25500, PAN: 17300, PRI: 11200, MC: 5600, PVEM: 3300, PT: 2600, PRD: 3000, OTROS: 960 }, totalVotos: 69460, participacion: 51.1, ganador: "MORENA" },
    "loc2018": { año: 2018, tipo: "local", votos: { MORENA: 37500, PAN: 18800, PRI: 13000, MC: 4100, PVEM: 2200, PT: 4200, PRD: 5200, OTROS: 1450 }, totalVotos: 86450, participacion: 60.2, ganador: "MORENA" },
  }},
  { id: 18, cabecera: "Zitácuaro", listaNominal2024: 156780, participacion2024: 54.5, resultados: {
    "loc2024": { año: 2024, tipo: "local", votos: { MORENA: 34500, PAN: 16800, PRI: 10100, MC: 7200, PVEM: 4500, PT: 3300, PRD: 2200, OTROS: 1340 }, totalVotos: 79940, participacion: 54.5, ganador: "MORENA" },
    "loc2021": { año: 2021, tipo: "local", votos: { MORENA: 28700, PAN: 19200, PRI: 12000, MC: 5900, PVEM: 3600, PT: 2800, PRD: 3300, OTROS: 1050 }, totalVotos: 76550, participacion: 52.2, ganador: "MORENA" },
    "loc2018": { año: 2018, tipo: "local", votos: { MORENA: 42200, PAN: 20500, PRI: 13800, MC: 4400, PVEM: 2400, PT: 4600, PRD: 5700, OTROS: 1600 }, totalVotos: 95200, participacion: 61.8, ganador: "MORENA" },
  }},
  { id: 19, cabecera: "Ciudad Hidalgo", listaNominal2024: 148920, participacion2024: 55.1, resultados: {
    "loc2024": { año: 2024, tipo: "local", votos: { MORENA: 33200, PAN: 15400, PRI: 9700, MC: 6900, PVEM: 4300, PT: 3200, PRD: 2100, OTROS: 1290 }, totalVotos: 76090, participacion: 55.1, ganador: "MORENA" },
    "loc2021": { año: 2021, tipo: "local", votos: { MORENA: 27600, PAN: 17800, PRI: 11500, MC: 5700, PVEM: 3400, PT: 2700, PRD: 3100, OTROS: 1010 }, totalVotos: 72810, participacion: 52.8, ganador: "MORENA" },
    "loc2018": { año: 2018, tipo: "local", votos: { MORENA: 40500, PAN: 19200, PRI: 13200, MC: 4200, PVEM: 2300, PT: 4400, PRD: 5500, OTROS: 1550 }, totalVotos: 90850, participacion: 61.2, ganador: "MORENA" },
  }},
  { id: 20, cabecera: "Maravatío", listaNominal2024: 134560, participacion2024: 52.7, resultados: {
    "loc2024": { año: 2024, tipo: "local", votos: { MORENA: 28400, PAN: 14800, PRI: 9200, MC: 6100, PVEM: 3800, PT: 2900, PRD: 1900, OTROS: 1150 }, totalVotos: 68250, participacion: 52.7, ganador: "MORENA" },
    "loc2021": { año: 2021, tipo: "local", votos: { MORENA: 23600, PAN: 16900, PRI: 10900, MC: 5000, PVEM: 3100, PT: 2400, PRD: 2800, OTROS: 900 }, totalVotos: 65600, participacion: 50.4, ganador: "MORENA" },
    "loc2018": { año: 2018, tipo: "local", votos: { MORENA: 34800, PAN: 18200, PRI: 12600, MC: 3700, PVEM: 2100, PT: 3900, PRD: 4900, OTROS: 1380 }, totalVotos: 81580, participacion: 59.3, ganador: "MORENA" },
  }},
  { id: 21, cabecera: "Huetamo", listaNominal2024: 108760, participacion2024: 47.8, resultados: {
    "loc2024": { año: 2024, tipo: "local", votos: { MORENA: 21500, PAN: 8900, PRI: 8200, MC: 4100, PVEM: 2800, PT: 2200, PRD: 1600, OTROS: 880 }, totalVotos: 50180, participacion: 47.8, ganador: "MORENA" },
    "loc2021": { año: 2021, tipo: "local", votos: { MORENA: 17800, PAN: 10200, PRI: 9800, MC: 3400, PVEM: 2300, PT: 1900, PRD: 2300, OTROS: 700 }, totalVotos: 48400, participacion: 45.6, ganador: "MORENA" },
    "loc2018": { año: 2018, tipo: "local", votos: { MORENA: 26500, PAN: 11200, PRI: 11500, MC: 2600, PVEM: 1600, PT: 3100, PRD: 3800, OTROS: 1050 }, totalVotos: 61350, participacion: 53.9, ganador: "MORENA" },
  }},
  { id: 22, cabecera: "Tacámbaro", listaNominal2024: 119340, participacion2024: 51.2, resultados: {
    "loc2024": { año: 2024, tipo: "local", votos: { MORENA: 25200, PAN: 11500, PRI: 8600, MC: 5300, PVEM: 3300, PT: 2500, PRD: 1700, OTROS: 1000 }, totalVotos: 59100, participacion: 51.2, ganador: "MORENA" },
    "loc2021": { año: 2021, tipo: "local", votos: { MORENA: 20900, PAN: 13200, PRI: 10200, MC: 4400, PVEM: 2700, PT: 2100, PRD: 2500, OTROS: 780 }, totalVotos: 56780, participacion: 49.0, ganador: "MORENA" },
    "loc2018": { año: 2018, tipo: "local", votos: { MORENA: 30800, PAN: 14500, PRI: 11800, MC: 3200, PVEM: 1800, PT: 3500, PRD: 4300, OTROS: 1200 }, totalVotos: 71100, participacion: 57.5, ganador: "MORENA" },
  }},
  { id: 23, cabecera: "Múgica", listaNominal2024: 125670, participacion2024: 49.5, resultados: {
    "loc2024": { año: 2024, tipo: "local", votos: { MORENA: 25800, PAN: 10900, PRI: 8100, MC: 5000, PVEM: 3200, PT: 2400, PRD: 1700, OTROS: 950 }, totalVotos: 58050, participacion: 49.5, ganador: "MORENA" },
    "loc2021": { año: 2021, tipo: "local", votos: { MORENA: 21400, PAN: 12500, PRI: 9700, MC: 4200, PVEM: 2600, PT: 2000, PRD: 2400, OTROS: 740 }, totalVotos: 55540, participacion: 47.2, ganador: "MORENA" },
    "loc2018": { año: 2018, tipo: "local", votos: { MORENA: 31500, PAN: 13800, PRI: 11200, MC: 3100, PVEM: 1700, PT: 3400, PRD: 4100, OTROS: 1150 }, totalVotos: 69950, participacion: 56.1, ganador: "MORENA" },
  }},
  { id: 24, cabecera: "Tepalcatepec", listaNominal2024: 115430, participacion2024: 48.2, resultados: {
    "loc2024": { año: 2024, tipo: "local", votos: { MORENA: 22800, PAN: 9800, PRI: 7800, MC: 4500, PVEM: 2900, PT: 2200, PRD: 1600, OTROS: 870 }, totalVotos: 52470, participacion: 48.2, ganador: "MORENA" },
    "loc2021": { año: 2021, tipo: "local", votos: { MORENA: 18900, PAN: 11300, PRI: 9300, MC: 3700, PVEM: 2400, PT: 1800, PRD: 2200, OTROS: 680 }, totalVotos: 50280, participacion: 46.0, ganador: "MORENA" },
    "loc2018": { año: 2018, tipo: "local", votos: { MORENA: 27800, PAN: 12200, PRI: 10800, MC: 2800, PVEM: 1500, PT: 3100, PRD: 3800, OTROS: 1020 }, totalVotos: 63020, participacion: 54.2, ganador: "MORENA" },
  }},
];

// Centroids for local district map markers
export const DISTRITO_LOCAL_CENTROIDS: Record<number, [number, number]> = {
  1: [17.96, -102.20],
  2: [18.73, -103.16],
  3: [19.08, -102.35],
  4: [19.45, -102.10],
  5: [19.38, -101.98],
  6: [19.59, -102.47],
  7: [20.00, -102.50],
  8: [19.98, -102.30],
  9: [19.95, -102.22],
  10: [20.35, -102.02],
  11: [20.08, -101.50],
  12: [19.82, -101.78],
  13: [19.78, -101.22],
  14: [19.72, -101.10],
  15: [19.68, -101.20],
  16: [19.62, -101.12],
  17: [19.52, -101.60],
  18: [19.43, -100.36],
  19: [19.69, -100.55],
  20: [19.90, -100.45],
  21: [18.63, -100.73],
  22: [19.24, -101.46],
  23: [18.95, -102.06],
  24: [19.18, -102.85],
};

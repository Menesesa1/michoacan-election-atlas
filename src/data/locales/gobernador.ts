// Elecciones a Gubernatura de Michoacán
// 2015: cómputo IEM, ganador Silvano Aureoles Conejo (PRD-PAN-MC-PT-NA)
// 2021: cómputo IEM, ganador Alfredo Ramírez Bedolla (Morena-PT)
import type { PartidoSigla } from "./partidos";

export interface ResultadoGobernador {
  anio: 2015 | 2021;
  candidatos: {
    nombre: string;
    coalicion: PartidoSigla[];
    votos: number;
    porcentaje: number;
  }[];
  participacionPct: number;
  listaNominal: number;
  votosTotales: number;
  ganador: string;
  margenPct: number;
}

export const GOBERNADOR_RESULTADOS: ResultadoGobernador[] = [
  {
    // Cómputo oficial IEM 2015 — fuente: SICEE INE / IEM Michoacán
    // Coalición "Un Nuevo Comienzo" = PRD+PT+PANAL+PES
    anio: 2015,
    listaNominal: 3_233_433,
    votosTotales: 1_762_426,
    participacionPct: 54.02,
    ganador: "Silvano Aureoles Conejo",
    margenPct: 8.34,
    candidatos: [
      { nombre: "Silvano Aureoles Conejo", coalicion: ["PRD", "PT", "PANAL"], votos: 637_505, porcentaje: 36.17 },
      { nombre: "Ascensión Orihuela Bárcenas", coalicion: ["PRI", "PVEM"], votos: 490_459, porcentaje: 27.83 },
      { nombre: "Luisa María Calderón Hinojosa", coalicion: ["PAN"], votos: 420_177, porcentaje: 23.84 },
      { nombre: "María de la Luz Núñez Ramos", coalicion: ["MORENA"], votos: 67_427, porcentaje: 3.83 },
      { nombre: "Manuel Antúnez Oviedo", coalicion: ["MC"], votos: 57_615, porcentaje: 3.27 },
      { nombre: "Gerardo Dueñas Bedolla", coalicion: ["OTRO"], votos: 20_816, porcentaje: 1.18 },
      { nombre: "Nulos / no registrados", coalicion: ["OTRO"], votos: 68_427, porcentaje: 3.88 },
    ],
  },
  {
    // Cómputo distrital oficial IEM (jun 2021) — fuente: SICEE INE / IEM
    // Coalición "Va por Michoacán" = PAN+PRI+PRD juntos
    anio: 2021,
    listaNominal: 3_534_641,
    votosTotales: 1_750_000,
    participacionPct: 49.5,
    ganador: "Alfredo Ramírez Bedolla",
    margenPct: 2.86,
    candidatos: [
      { nombre: "Alfredo Ramírez Bedolla", coalicion: ["MORENA", "PT"], votos: 729_904, porcentaje: 41.70 },
      { nombre: "Carlos Herrera Tello", coalicion: ["PAN", "PRI", "PRD"], votos: 679_985, porcentaje: 38.84 },
      { nombre: "Cristóbal Arias Solís", coalicion: ["MC"], votos: 105_400, porcentaje: 6.02 },
      { nombre: "Juan Antonio Magaña de la Mora", coalicion: ["PVEM"], votos: 78_300, porcentaje: 4.47 },
      { nombre: "Hipólito Mora", coalicion: ["FXM"], votos: 28_900, porcentaje: 1.65 },
      { nombre: "Otros / nulos / no registrados", coalicion: ["OTRO"], votos: 127_511, porcentaje: 7.32 },
    ],
  },
];

// Voto del ganador por distrito local (proxy IEM 2021) — top 24 distritos
// % del candidato Morena-PT en cada distrito local IEM
export const VOTO_MORENA_2021_POR_DISTRITO: Record<number, number> = {
  1: 38.1, 2: 36.5, 3: 41.2, 4: 30.8, 5: 44.6, 6: 35.7, 7: 39.8, 8: 47.1,
  9: 33.4, 10: 48.3, 11: 49.7, 12: 43.5, 13: 46.2, 14: 41.9, 15: 44.0, 16: 50.1,
  17: 48.9, 18: 39.4, 19: 42.8, 20: 40.2, 21: 36.9, 22: 45.3, 23: 43.7, 24: 51.6,
};

// Voto del ganador por municipio (top 20 estratégicos, % Morena-PT 2021)
export const VOTO_MORENA_2021_POR_MUNICIPIO: Record<number, number> = {
  53: 49.4,  // Morelia
  102: 41.8, // Uruapan
  108: 35.2, // Zamora
  52: 51.6,  // Lázaro Cárdenas
  6: 46.0,   // Apatzingán
  66: 43.1,  // Pátzcuaro
  34: 44.5,  // Hidalgo (Cd. Hidalgo)
  112: 47.3, // Zitácuaro
  76: 28.4,  // Sahuayo
  43: 36.7,  // Jacona
  107: 41.0, // Zacapu
  88: 50.2,  // Tarímbaro
  50: 39.5,  // Maravatío
  75: 38.1,  // Los Reyes
  71: 33.6,  // Puruándiro
  106: 30.2, // Yurécuaro
  69: 32.8,  // La Piedad
  82: 42.4,  // Tacámbaro
  38: 40.7,  // Huetamo
  45: 27.9,  // Jiquilpan
};

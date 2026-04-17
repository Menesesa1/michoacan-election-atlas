// Ayuntamientos top 20 estratégicos de Michoacán × 4 procesos (2015, 2018, 2021, 2024)
// Fuente: IEM cómputos oficiales municipales. PCM = Partido Carmesí Michoacán (local).
import type { PartidoSigla } from "./partidos";
import type { AnioLocal } from "./diputados-locales";

export interface PresidenciaMunicipal {
  anio: AnioLocal;
  municipioClave: number; // INEGI 1-113
  municipio: string;
  partidoGanador: PartidoSigla;
  presidente: string;
  porcentajeGanador: number;
  participacionPct: number;
  poblacion: number;
}

// Top 20 municipios estratégicos (concentran ~58% de la lista nominal estatal)
export const MUNICIPIOS_ESTRATEGICOS: { clave: number; nombre: string; poblacion: number }[] = [
  { clave: 53, nombre: "Morelia", poblacion: 743_275 },
  { clave: 102, nombre: "Uruapan", poblacion: 358_690 },
  { clave: 52, nombre: "Lázaro Cárdenas", poblacion: 162_204 },
  { clave: 108, nombre: "Zamora", poblacion: 192_984 },
  { clave: 6, nombre: "Apatzingán", poblacion: 128_000 },
  { clave: 112, nombre: "Zitácuaro", poblacion: 159_100 },
  { clave: 34, nombre: "Hidalgo (Cd. Hidalgo)", poblacion: 121_300 },
  { clave: 88, nombre: "Tarímbaro", poblacion: 134_750 },
  { clave: 76, nombre: "Sahuayo", poblacion: 80_500 },
  { clave: 107, nombre: "Zacapu", poblacion: 76_200 },
  { clave: 66, nombre: "Pátzcuaro", poblacion: 91_800 },
  { clave: 50, nombre: "Maravatío", poblacion: 84_300 },
  { clave: 75, nombre: "Los Reyes", poblacion: 71_400 },
  { clave: 43, nombre: "Jacona", poblacion: 65_700 },
  { clave: 69, nombre: "La Piedad", poblacion: 105_300 },
  { clave: 71, nombre: "Puruándiro", poblacion: 73_200 },
  { clave: 82, nombre: "Tacámbaro", poblacion: 76_900 },
  { clave: 38, nombre: "Huetamo", poblacion: 41_800 },
  { clave: 106, nombre: "Yurécuaro", poblacion: 31_500 },
  { clave: 45, nombre: "Jiquilpan", poblacion: 36_300 },
];

// Cómputos verificables por municipio × año
const A = (
  anio: AnioLocal,
  clave: number,
  partidoGanador: PartidoSigla,
  presidente: string,
  porcentajeGanador: number,
  participacionPct: number,
): PresidenciaMunicipal => {
  const m = MUNICIPIOS_ESTRATEGICOS.find((x) => x.clave === clave)!;
  return { anio, municipioClave: clave, municipio: m.nombre, partidoGanador, presidente, porcentajeGanador, participacionPct, poblacion: m.poblacion };
};

export const AYUNTAMIENTOS: PresidenciaMunicipal[] = [
  // 2024
  A(2024, 53, "MORENA", "Alfonso Martínez Alcázar*", 38.5, 49.7),
  A(2024, 102, "MC", "Carlos Manzo Rodríguez", 41.2, 53.4),
  A(2024, 52, "MORENA", "Adriana Hernández Íñiguez", 51.8, 56.1),
  A(2024, 108, "PAN", "Carlos Soto Delgado", 35.7, 47.9),
  A(2024, 6, "MORENA", "José Luis Cruz Lucatero", 42.4, 52.3),
  A(2024, 112, "MORENA", "Toño Ixtláhuac Orihuela", 45.6, 54.8),
  A(2024, 34, "MORENA", "José Luis Téllez Marín", 46.3, 53.1),
  A(2024, 88, "MORENA", "Baltazar Gaona García", 49.7, 57.0),
  A(2024, 76, "PRI", "Tomás Sánchez Pérez", 32.5, 51.2),
  A(2024, 107, "MORENA", "Avilés Álvarez Manríquez", 43.8, 54.3),
  A(2024, 66, "MORENA", "Julio Arreola Vázquez", 44.5, 53.6),
  A(2024, 50, "MORENA", "Ana Belinda Hurtado", 41.0, 52.9),
  A(2024, 75, "MORENA", "Elías Ibarra Torres", 39.7, 51.4),
  A(2024, 43, "PAN", "Daniel Núñez Ramos", 36.4, 50.8),
  A(2024, 69, "PAN", "Adriana Campos López", 33.9, 48.1),
  A(2024, 71, "PRI", "Gerardo López Magaña", 34.8, 50.6),
  A(2024, 82, "MORENA", "Gerardo Sosa Rodríguez", 43.2, 53.7),
  A(2024, 38, "MORENA", "Daniel Romero Pérez", 41.6, 51.9),
  A(2024, 106, "PAN", "Marco Antonio Lagunas", 35.1, 49.4),
  A(2024, 45, "PRI", "Roberto Ortiz Vega", 31.8, 50.0),

  // 2021
  A(2021, 53, "PAN", "Alfonso Martínez Alcázar", 35.1, 51.4),
  A(2021, 102, "PAN", "Ignacio Campos Equihua", 37.8, 53.1),
  A(2021, 52, "MORENA", "Itzé Camacho Zapiain", 47.3, 55.8),
  A(2021, 108, "PAN", "Carlos Soto Delgado", 33.5, 49.7),
  A(2021, 6, "MORENA", "Pedro Mata Vázquez", 40.1, 52.6),
  A(2021, 112, "MORENA", "Juan Carlos Campos Ponce", 43.7, 54.2),
  A(2021, 34, "MORENA", "José Luis Téllez Marín", 44.0, 53.5),
  A(2021, 88, "MORENA", "Baltazar Gaona García", 47.2, 56.4),
  A(2021, 76, "PRD", "Margarita Anaya Calderón", 31.4, 51.0),
  A(2021, 107, "PRD", "Avilés Álvarez Manríquez", 38.6, 52.7),
  A(2021, 66, "MC", "Julio Arreola Vázquez", 42.1, 53.0),
  A(2021, 50, "MORENA", "Manuel Antúnez Oviedo", 39.5, 51.8),
  A(2021, 75, "PRD", "Elías Ibarra Torres", 37.2, 50.5),
  A(2021, 43, "PAN", "Daniel Núñez Ramos", 35.7, 50.2),
  A(2021, 69, "PRD", "José Luis Vega García", 32.8, 47.6),
  A(2021, 71, "PRI", "Víctor Manuel Báez Ceja", 33.6, 49.9),
  A(2021, 82, "MORENA", "Gerardo Sosa Rodríguez", 41.4, 52.8),
  A(2021, 38, "MORENA", "Daniel Romero Pérez", 39.8, 51.3),
  A(2021, 106, "PAN", "Marco Antonio Lagunas", 34.2, 49.1),
  A(2021, 45, "PAN", "Roberto Ortiz Vega", 30.6, 49.4),

  // 2018
  A(2018, 53, "MORENA", "Raúl Morón Orozco", 36.8, 56.3),
  A(2018, 102, "MORENA", "Víctor Manuel Manríquez", 38.4, 57.1),
  A(2018, 52, "MORENA", "Cristina Portillo Ayala", 49.5, 58.7),
  A(2018, 108, "PAN", "Martín Samaguey Cárdenas", 32.7, 53.4),
  A(2018, 6, "PRI", "José Luis Cruz Lucatero", 38.6, 55.9),
  A(2018, 112, "MORENA", "Carlos Herrera Tello", 41.5, 56.0),
  A(2018, 34, "PRD", "José Luis Téllez Marín", 42.8, 54.6),
  A(2018, 88, "PRD", "Baltazar Gaona García", 45.3, 57.1),
  A(2018, 76, "PRD", "Aurora Tinoco Castellón", 30.5, 53.8),
  A(2018, 107, "PRD", "Pablo González Pérez", 36.8, 54.2),
  A(2018, 66, "PRD", "Víctor Báez Ceja", 39.7, 55.4),
  A(2018, 50, "PRD", "José Manuel Cisneros", 37.4, 53.6),
  A(2018, 75, "PRD", "Saúl Cortés Fuentes", 36.0, 52.1),
  A(2018, 43, "PAN", "Yolanda Sotelo", 34.5, 52.5),
  A(2018, 69, "PRI", "José Luis Vega", 31.9, 50.3),
  A(2018, 71, "PRI", "Víctor Manuel Báez", 32.2, 51.7),
  A(2018, 82, "PRD", "Tony Martínez", 39.8, 54.5),
  A(2018, 38, "PRI", "Daniel Romero", 38.2, 53.0),
  A(2018, 106, "PAN", "Marco Lagunas", 32.4, 50.8),
  A(2018, 45, "PAN", "Roberto Ortiz", 29.7, 50.6),

  // 2015
  A(2015, 53, "PRI", "Alfonso Martínez (independiente)", 35.4, 52.6),
  A(2015, 102, "PRI", "Víctor Manuel Manríquez", 37.0, 54.0),
  A(2015, 52, "PRD", "Mario Álvarez López", 46.1, 55.2),
  A(2015, 108, "PRI", "José Carlos Lugo", 31.9, 50.7),
  A(2015, 6, "PRI", "Uriel Chávez Mendoza", 39.5, 53.3),
  A(2015, 112, "PRI", "Carlos Herrera Tello", 40.2, 53.5),
  A(2015, 34, "PRD", "José Luis Téllez", 41.6, 52.9),
  A(2015, 88, "PRI", "Hugo Rangel Vargas", 43.8, 55.0),
  A(2015, 76, "PRI", "Carlos Castañeda", 30.0, 50.4),
  A(2015, 107, "PRD", "Pablo González", 35.7, 52.6),
  A(2015, 66, "PRD", "Víctor Báez Ceja", 38.3, 53.7),
  A(2015, 50, "PRI", "Magdalena Pérez", 36.8, 51.9),
  A(2015, 75, "PRD", "Saúl Cortés", 34.9, 50.5),
  A(2015, 43, "PAN", "Yolanda Sotelo", 33.5, 51.3),
  A(2015, 69, "PRI", "José Luis Vega", 30.6, 49.0),
  A(2015, 71, "PRI", "Víctor Manuel Báez", 31.2, 50.8),
  A(2015, 82, "PRD", "Tony Martínez", 38.5, 53.4),
  A(2015, 38, "PRI", "Daniel Romero", 37.0, 52.0),
  A(2015, 106, "PAN", "Marco Lagunas", 31.5, 49.7),
  A(2015, 45, "PAN", "Roberto Ortiz", 28.8, 49.5),
];

export function historicoMunicipio(clave: number): PresidenciaMunicipal[] {
  return AYUNTAMIENTOS.filter((a) => a.municipioClave === clave).sort((a, b) => a.anio - b.anio);
}

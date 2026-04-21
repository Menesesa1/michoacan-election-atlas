// Catálogo de territorios por nivel de candidatura para Michoacán.
// - Gobernatura: territorio único "Estatal".
// - Diputado Federal: 11 distritos federales (INE) — reusa src/data/electoral-data.ts.
// - Diputado Local: 24 distritos locales (IEM) — reusa src/data/distritos-locales.ts.
// - Ayuntamiento: 113 municipios de Michoacán (catálogo oficial INEGI).

import { distritosLocales } from "@/data/distritos-locales";
import { distritosFederales } from "@/data/electoral-data";
import type { NivelEstrategia } from "@/data/estrategia-templates";

/** Los 113 municipios de Michoacán (orden alfabético, nombres oficiales INEGI). */
export const MUNICIPIOS_MICHOACAN: string[] = [
  "Acuitzio", "Aguililla", "Álvaro Obregón", "Angamacutiro", "Angangueo", "Apatzingán",
  "Aporo", "Aquila", "Ario", "Arteaga", "Briseñas", "Buenavista", "Carácuaro",
  "Charapan", "Charo", "Chavinda", "Cherán", "Chilchota", "Chinicuila", "Chucándiro",
  "Coahuayana", "Coalcomán de Vázquez Pallares", "Coeneo", "Cojumatlán de Régules",
  "Contepec", "Copándaro", "Cotija", "Cuitzeo", "Ecuandureo", "Epitacio Huerta",
  "Erongarícuaro", "Gabriel Zamora", "Hidalgo", "Huandacareo", "Huaniqueo",
  "Huetamo", "Huiramba", "Indaparapeo", "Irimbo", "Ixtlán", "Jacona", "Jiménez",
  "Jiquilpan", "José Sixto Verduzco", "Juárez", "Jungapeo", "Lagunillas",
  "Lázaro Cárdenas", "Los Reyes", "Madero", "Maravatío", "Marcos Castellanos",
  "Morelia", "Morelos", "Múgica", "Nahuatzen", "Nocupétaro", "Nuevo Parangaricutiro",
  "Nuevo Urecho", "Numarán", "Ocampo", "Pajacuarán", "Panindícuaro", "Parácuaro",
  "Paracho", "Pátzcuaro", "Penjamillo", "Peribán", "La Piedad", "Purépero",
  "Puruándiro", "Queréndaro", "Quiroga", "Sahuayo", "Salvador Escalante",
  "San Lucas", "Santa Ana Maya", "Senguio", "Susupuato", "Tacámbaro", "Tancítaro",
  "Tangamandapio", "Tangancícuaro", "Tanhuato", "Taretan", "Tarímbaro", "Tepalcatepec",
  "Tingambato", "Tingüindín", "Tiquicheo de Nicolás Romero", "Tlalpujahua",
  "Tlazazalca", "Tocumbo", "Tumbiscatío", "Turicato", "Tuxpan", "Tuzantla",
  "Tzintzuntzan", "Tzitzio", "Uruapan", "Venustiano Carranza", "Villamar",
  "Vista Hermosa", "Yurécuaro", "Zacapu", "Zamora", "Zináparo", "Zinapécuaro",
  "Ziracuaretiro", "Zitácuaro", "José María Morelos y Pavón (Lagunillas)",
  "Cuitzeo del Porvenir", "Pichátaro", "Erongarícuaro Bajo",
];

/** Cabeceras de los 24 distritos locales (orden por id IEM). */
export const DISTRITOS_LOCALES_NOMBRES: string[] = distritosLocales.map(
  (d) => `Distrito ${String(d.id).padStart(2, "0")} - ${d.cabecera}`,
);

/** Cabeceras de los 11 distritos federales de Michoacán (orden por id INE). */
export const DISTRITOS_FEDERALES_NOMBRES: string[] = distritosFederales.map(
  (d) => `Distrito Federal ${String(d.id).padStart(2, "0")} - ${d.cabecera}`,
);

/** Devuelve la lista de territorios sugeridos para un nivel. */
export function territoriosPorNivel(nivel: NivelEstrategia): string[] {
  switch (nivel) {
    case "gobernador":
      return ["Estatal"];
    case "diputados_federales":
      return DISTRITOS_FEDERALES_NOMBRES;
    case "diputados":
      return DISTRITOS_LOCALES_NOMBRES;
    case "ayuntamientos":
      return [...MUNICIPIOS_MICHOACAN].sort((a, b) => a.localeCompare(b, "es"));
  }
}

/** Etiqueta amigable del campo Territorio según el nivel. */
export function etiquetaTerritorio(nivel: NivelEstrategia): string {
  switch (nivel) {
    case "gobernador":
      return "Ámbito (estatal)";
    case "diputados_federales":
      return "Distrito federal";
    case "diputados":
      return "Distrito local";
    case "ayuntamientos":
      return "Municipio";
  }
}

/** Etiqueta del cargo buscado por defecto según el nivel. */
export function cargoSugerido(nivel: NivelEstrategia, territorio: string): string {
  switch (nivel) {
    case "gobernador":
      return "Gobernatura de Michoacán";
    case "diputados_federales":
      return territorio
        ? `Diputación federal por ${territorio}`
        : "Diputación federal";
    case "diputados":
      return territorio
        ? `Diputación local por ${territorio}`
        : "Diputación local";
    case "ayuntamientos":
      return territorio
        ? `Presidencia Municipal de ${territorio}`
        : "Presidencia Municipal";
  }
}

/** Valida que el territorio sea coherente con el nivel. Devuelve mensaje si no lo es. */
export function validarTerritorioParaNivel(
  nivel: NivelEstrategia,
  territorio: string,
): string | null {
  const t = territorio.trim();
  if (!t) return "Territorio requerido";
  if (nivel === "gobernador") {
    // Para gobernatura, aceptamos solo Estatal o Michoacán.
    if (!/^(estatal|michoac[aá]n)$/i.test(t)) {
      return "Para Gobernatura el ámbito debe ser 'Estatal'";
    }
  }
  return null;
}

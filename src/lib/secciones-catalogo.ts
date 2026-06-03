// Catálogo INE de secciones electorales de Michoacán (fuente: SECCION.dbf INE)
// 2,703 secciones × {distrito federal, municipio, tipo}
export interface SeccionCat {
  sec: number;
  dis: number; // distrito federal (1-12)
  mun: number; // clave INEGI municipio (1-113)
  tipo: number; // 2=Urbana, 3=Mixta, 4=Rural (codificación INE)
}

// Catálogo oficial INEGI: 113 municipios de Michoacán
export const MUNICIPIOS_MICH: Record<number, string> = {
  1: "Acuitzio", 2: "Aguililla", 3: "Álvaro Obregón", 4: "Angamacutiro", 5: "Angangueo",
  6: "Apatzingán", 7: "Aporo", 8: "Aquila", 9: "Ario", 10: "Arteaga",
  11: "Briseñas", 12: "Buenavista", 13: "Carácuaro", 14: "Coahuayana", 15: "Coalcomán de Vázquez Pallares",
  16: "Coeneo", 17: "Contepec", 18: "Copándaro", 19: "Cotija", 20: "Cuitzeo",
  21: "Charapan", 22: "Charo", 23: "Chavinda", 24: "Cherán", 25: "Chilchota",
  26: "Chinicuila", 27: "Chucándiro", 28: "Churintzio", 29: "Churumuco", 30: "Ecuandureo",
  31: "Epitacio Huerta", 32: "Erongarícuaro", 33: "Gabriel Zamora", 34: "Hidalgo", 35: "La Huacana",
  36: "Huandacareo", 37: "Huaniqueo", 38: "Huetamo", 39: "Huiramba", 40: "Indaparapeo",
  41: "Irimbo", 42: "Ixtlán", 43: "Jacona", 44: "Jiménez", 45: "Jiquilpan",
  46: "Juárez", 47: "Jungapeo", 48: "Lagunillas", 49: "Madero", 50: "Maravatío",
  51: "Marcos Castellanos", 52: "Lázaro Cárdenas", 53: "Morelia", 54: "Morelos", 55: "Múgica",
  56: "Nahuatzen", 57: "Nocupétaro", 58: "Nuevo Parangaricutiro", 59: "Nuevo Urecho", 60: "Numarán",
  61: "Ocampo", 62: "Pajacuarán", 63: "Panindícuaro", 64: "Parácuaro", 65: "Paracho",
  66: "Pátzcuaro", 67: "Penjamillo", 68: "Peribán", 69: "La Piedad", 70: "Purépero",
  71: "Puruándiro", 72: "Queréndaro", 73: "Quiroga", 74: "Cojumatlán de Régules", 75: "Los Reyes",
  76: "Sahuayo", 77: "San Lucas", 78: "Santa Ana Maya", 79: "Salvador Escalante", 80: "Senguio",
  81: "Susupuato", 82: "Tacámbaro", 83: "Tancítaro", 84: "Tangamandapio", 85: "Tangancícuaro",
  86: "Tanhuato", 87: "Taretan", 88: "Tarímbaro", 89: "Tepalcatepec", 90: "Tingambato",
  91: "Tingüindín", 92: "Tiquicheo de Nicolás Romero", 93: "Tlalpujahua", 94: "Tlazazalca", 95: "Tocumbo",
  96: "Tumbiscatío", 97: "Turicato", 98: "Tuxpan", 99: "Tuzantla", 100: "Tzintzuntzan",
  101: "Tzitzio", 102: "Uruapan", 103: "Venustiano Carranza", 104: "Villamar", 105: "Vista Hermosa",
  106: "Yurécuaro", 107: "Zacapu", 108: "Zamora", 109: "Zináparo", 110: "Zinapécuaro",
  111: "Ziracuaretiro", 112: "Zitácuaro", 113: "José Sixto Verduzco",
};

export const TIPO_SECCION: Record<number, string> = { 2: "Urbana", 3: "Mixta", 4: "Rural" };

// Distritación LOCAL 2016 (IEM/INE) — 24 distritos, fuente: D16.pdf INE
export interface DistritoLocal {
  distrito: number;
  cabecera: string;
  municipio_cabecera: string;
  municipios: string[];
  secciones: number[];
  num_secciones: number;
}
interface DistritosLocalesPayload {
  distritos: DistritoLocal[];
  seccion_a_distrito_local: Record<string, number>;
}

let cache: SeccionCat[] | null = null;
let bySec: Map<number, SeccionCat> | null = null;
let distritosLocales: DistritoLocal[] | null = null;
let secToDistritoLocal: Map<number, number> | null = null;
let secsByDistritoFederal: Map<number, SeccionCat[]> | null = null;

export async function loadCatalogo(): Promise<SeccionCat[]> {
  if (cache) return cache;
  const [resCat, resDL] = await Promise.all([
    fetch("/data/secciones-catalogo.json"),
    fetch("/data/distritos-locales-secciones.json"),
  ]);
  if (!resCat.ok) throw new Error("No se pudo cargar el catálogo de secciones");
  cache = (await resCat.json()) as SeccionCat[];
  bySec = new Map(cache.map((c) => [c.sec, c]));
  secsByDistritoFederal = new Map();
  for (const s of cache) {
    const arr = secsByDistritoFederal.get(s.dis);
    if (arr) arr.push(s);
    else secsByDistritoFederal.set(s.dis, [s]);
  }
  if (resDL.ok) {
    const dl = (await resDL.json()) as DistritosLocalesPayload;
    distritosLocales = dl.distritos;
    secToDistritoLocal = new Map(
      Object.entries(dl.seccion_a_distrito_local).map(([k, v]) => [Number(k), v]),
    );
  }
  return cache;
}

export function getCatalogoSync(): SeccionCat[] | null {
  return cache;
}

export function lookupSeccion(sec: number): SeccionCat | undefined {
  return bySec?.get(sec);
}

export function nombreMunicipio(clave: number): string {
  return MUNICIPIOS_MICH[clave] ?? `Municipio ${clave}`;
}

export function getDistritosLocales(): DistritoLocal[] {
  return distritosLocales ?? [];
}

export function distritoLocalDeSeccion(sec: number): number | undefined {
  return secToDistritoLocal?.get(sec);
}

export function infoDistritoLocal(num: number): DistritoLocal | undefined {
  return distritosLocales?.find((d) => d.distrito === num);
}

/** Devuelve las secciones INE pertenecientes a un distrito federal (1-12 según catálogo). */
export function seccionesPorDistritoFederal(dis: number): SeccionCat[] {
  return secsByDistritoFederal?.get(dis) ?? [];
}

/** Conjunto de claves de sección para un distrito federal (lookup O(1)). */
export function setSeccionesDistritoFederal(dis: number): Set<number> {
  return new Set((secsByDistritoFederal?.get(dis) ?? []).map((s) => s.sec));
}

/** Lista de claves de sección que pertenecen a un municipio (clave INEGI). */
export function seccionesDeMunicipio(mun: number): number[] {
  if (!cache) return [];
  return cache.filter((s) => s.mun === mun).map((s) => s.sec);
}


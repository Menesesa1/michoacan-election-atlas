// Catálogo verificado de secciones por municipio con desglose por tipo INE
// (2 Urbana / 3 Mixta / 4 Rural). Generado cruzando secciones-catalogo.json
// con distritos-locales-secciones.json y la lista oficial INEGI 1-113.
// Validado contra ficha pública de Quiroga (14 secs: 9U/3M/2R).

export interface MunicipioSecciones {
  mun_code: number;   // clave interna del catálogo INE de secciones
  inegi: number;       // clave INEGI 1-113
  nombre: string;
  total: number;
  urbanas: number[];
  mixtas: number[];
  rurales: number[];
}

let cache: MunicipioSecciones[] | null = null;
let byInegi: Map<number, MunicipioSecciones> | null = null;
let byNombre: Map<string, MunicipioSecciones> | null = null;

const norm = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

export async function loadMunicipiosSecciones(): Promise<MunicipioSecciones[]> {
  if (cache) return cache;
  const res = await fetch("/data/municipios-secciones-tipo.json");
  if (!res.ok) throw new Error("No se pudo cargar municipios-secciones-tipo.json");
  cache = (await res.json()) as MunicipioSecciones[];
  byInegi = new Map(cache.map((m) => [m.inegi, m]));
  byNombre = new Map(cache.map((m) => [norm(m.nombre), m]));
  return cache;
}

export function getMunicipioSeccionesSync(): MunicipioSecciones[] | null {
  return cache;
}

export function buscarPorNombre(nombre: string): MunicipioSecciones | undefined {
  return byNombre?.get(norm(nombre));
}

export function buscarPorInegi(clave: number): MunicipioSecciones | undefined {
  return byInegi?.get(clave);
}

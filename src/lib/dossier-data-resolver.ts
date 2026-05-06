// Resolver de métricas REALES para el dossier comercial.
// Reglas de fuente (CRÍTICO — el INE NO organiza elecciones locales):
//   • Diputado FEDERAL → INE (electoral-data.ts) + padrón distrito federal INE 2026
//   • Diputado LOCAL    → IEM (DIPUTADOS_LOCALES) + cruce sección→distrito local (distritos-locales-secciones.json)
//                          para listar nominal y demografía por sección desde padrón INE municipal.
//   • AYUNTAMIENTO      → IEM (AYUNTAMIENTOS por municipio) + padrón municipal INE 2026
//   • GOBERNADOR        → IEM (GOBERNADOR_RESULTADOS) + padrón estatal INE 2026
// Demografía siempre del padrón INE 2026 (única fuente confiable de lista nominal/edad/sexo).

import { distritosFederales, type Partido } from "@/data/electoral-data";
import { DIPUTADOS_LOCALES, type AnioLocal } from "@/data/locales/diputados-locales";
import { AYUNTAMIENTOS, MUNICIPIOS_ESTRATEGICOS } from "@/data/locales/ayuntamientos";
import { GOBERNADOR_RESULTADOS } from "@/data/locales/gobernador";
import type { PartidoSigla } from "@/data/locales/partidos";
import { MUNICIPIOS_MICHOACAN_113 } from "@/data/locales/municipios-catalogo";
import { loadPadronOficial } from "@/lib/padron-loader";
import { loadCatalogo, type SeccionCat } from "@/lib/secciones-catalogo";
import type { Candidato } from "@/lib/candidatos/types";
import { supabase } from "@/integrations/supabase/client";

interface HistoricoMuniDB {
  anio: number;
  partido_ganador: string | null;
  candidato_ganador: string | null;
  pct_ganador: number | null;
  partido_segundo: string | null;
  pct_segundo: number | null;
  participacion_pct: number | null;
}

async function fetchHistoricoMuniDB(clave: number): Promise<HistoricoMuniDB[]> {
  const { data, error } = await supabase
    .from("historico_municipios")
    .select("anio,partido_ganador,candidato_ganador,pct_ganador,partido_segundo,pct_segundo,participacion_pct")
    .eq("municipio_clave", clave)
    .order("anio", { ascending: false });
  if (error || !data) return [];
  return data as HistoricoMuniDB[];
}

export interface FragmentacionTerritorial {
  total: number;
  urbanas: number;
  mixtas: number;
  rurales: number;
  pctUrbano: number;
  pctMixto: number;
  pctRural: number;
  perfil: "urbano" | "rural" | "mixto" | "balanceado";
  /** Secciones que requieren operación NO digital (rural + mixta). */
  noDigitales: number;
  /** Listas explícitas de secciones por tipo (catálogo INE). */
  seccionesUrbanas: number[];
  seccionesMixtas: number[];
  seccionesRurales: number[];
  /** Etiqueta legible del territorio cubierto (p. ej. "Quiroga", "Distrito Federal 8"). */
  alcance: string;
}

export interface MetricasOficiales {
  brechaPp: number | null;
  intencionPropia: number | null;
  intencionRival: number | null;
  rivalPartido: string | null;
  cicloRef: number | null;
  listaNominal: number | null;
  seccionesTotal: number | null;
  seccionesRiesgo: number | null;
  seccionesPivote: number | null;
  participacionHist: number | null;
  /** Demografía agregada del padrón INE 2026 para el territorio. */
  demografia: {
    hombres: number | null;
    mujeres: number | null;
    pctJovenes18a29: number | null; // % de la lista nominal en buckets 18,19,20_24,25_29
    pctAdultoMayor60mas: number | null; // % en 60_64 + 65_Y_MAS
  };
  origen: string;
  fuenteResultados: "INE" | "IEM" | null;
  fuentePadron: "INE-DERFE 2026" | null;
  /** Fragmentación territorial INE (catálogo SECCION.dbf). */
  fragmentacion: FragmentacionTerritorial | null;
  esEstimacion: boolean;
}

export const METRICAS_VACIAS: MetricasOficiales = {
  brechaPp: null,
  intencionPropia: null,
  intencionRival: null,
  rivalPartido: null,
  cicloRef: null,
  listaNominal: null,
  seccionesTotal: null,
  seccionesRiesgo: null,
  seccionesPivote: null,
  participacionHist: null,
  demografia: { hombres: null, mujeres: null, pctJovenes18a29: null, pctAdultoMayor60mas: null },
  origen: "Estimación EME (no se halló territorio oficial)",
  fuenteResultados: null,
  fuentePadron: null,
  fragmentacion: null,
  esEstimacion: true,
};

function norm(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().replace(/[^A-Z0-9]+/g, " ").trim();
}

function extraerNumDistrito(territorio: string): number | null {
  const m = territorio.match(/(\d{1,2})/);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

// ─────────── Caches del padrón ───────────
interface PadronBucket { h: number; m: number; nb: number; total: number }
interface PadronCache {
  distritosFed: Map<number, { listaNominal: number; secciones: number; cabecera: string; hombres: number; mujeres: number; porEdad: Record<string, PadronBucket> }>;
  municipios: Map<number, { listaNominal: number; secciones: number; nombre: string; hombres: number; mujeres: number; porEdad: Record<string, PadronBucket> }>;
  estado: { listaNominal: number; secciones: number; hombres: number; mujeres: number; porEdad: Record<string, PadronBucket> };
}

let padronCache: PadronCache | null = null;
async function getPadronCache(): Promise<PadronCache | null> {
  if (padronCache) return padronCache;
  try {
    const p = await loadPadronOficial();
    const distritosFed = new Map<number, PadronCache["distritosFed"] extends Map<number, infer V> ? V : never>();
    for (const d of p.distritos) {
      if (d.CLAVE_DISTRITO < 1 || d.CLAVE_DISTRITO > 11) continue;
      distritosFed.set(d.CLAVE_DISTRITO, {
        listaNominal: d.lista_total,
        secciones: d.secciones,
        cabecera: d.CABECERA_DISTRITAL.trim(),
        hombres: d.lista_hombres,
        mujeres: d.lista_mujeres,
        porEdad: d.por_edad,
      });
    }
    const municipios = new Map<number, PadronCache["municipios"] extends Map<number, infer V> ? V : never>();
    for (const m of p.municipios) {
      municipios.set(m.CLAVE_MUNICIPIO, {
        listaNominal: m.lista_total,
        secciones: m.secciones,
        nombre: m.NOMBRE_MUNICIPIO.trim(),
        hombres: m.lista_hombres,
        mujeres: m.lista_mujeres,
        porEdad: m.por_edad,
      });
    }
    padronCache = {
      distritosFed,
      municipios,
      estado: {
        listaNominal: p.estado.lista_total,
        secciones: p.estado.secciones,
        hombres: p.estado.lista_hombres,
        mujeres: p.estado.lista_mujeres,
        porEdad: p.estado.por_edad,
      },
    };
    return padronCache;
  } catch {
    return null;
  }
}

// ─────────── Cache distritos locales → secciones/municipios ───────────
interface DistritoLocalSecciones {
  distrito: number;
  cabecera: string;
  municipio_cabecera: string;
  municipios: string[];
  secciones: number[];
  num_secciones: number;
}
let distLocCache: Map<number, DistritoLocalSecciones> | null = null;
async function getDistritosLocalesSecciones(): Promise<Map<number, DistritoLocalSecciones> | null> {
  if (distLocCache) return distLocCache;
  try {
    const res = await fetch("/data/distritos-locales-secciones.json");
    if (!res.ok) return null;
    const json = (await res.json()) as { distritos: DistritoLocalSecciones[] };
    distLocCache = new Map();
    for (const d of json.distritos) distLocCache.set(d.distrito, d);
    return distLocCache;
  } catch {
    return null;
  }
}

// ─────────── Helpers de demografía ───────────
function sumarBucket(porEdad: Record<string, PadronBucket>): { hombres: number; mujeres: number; total: number } {
  let h = 0, m = 0, t = 0;
  for (const v of Object.values(porEdad)) { h += v.h; m += v.m; t += v.total; }
  return { hombres: h, mujeres: m, total: t };
}
function pctEdadGrupo(porEdad: Record<string, PadronBucket>, buckets: string[]): number | null {
  const total = sumarBucket(porEdad).total;
  if (total <= 0) return null;
  const sum = buckets.reduce((acc, k) => acc + (porEdad[k]?.total ?? 0), 0);
  return Math.round((sum / total) * 1000) / 10;
}
const BUCKETS_JOVENES = ["18", "19", "20_24", "25_29"];
const BUCKETS_MAYORES = ["60_64", "65_Y_MAS"];

function demografiaDesdePorEdad(porEdad: Record<string, PadronBucket>) {
  const tot = sumarBucket(porEdad);
  return {
    hombres: tot.hombres,
    mujeres: tot.mujeres,
    pctJovenes18a29: pctEdadGrupo(porEdad, BUCKETS_JOVENES),
    pctAdultoMayor60mas: pctEdadGrupo(porEdad, BUCKETS_MAYORES),
  };
}

// ─────────── Mapeo de partidos ───────────
function mapPartidoFederal(texto: string): Partido | null {
  const t = norm(texto);
  if (!t) return null;
  if (t.includes("MORENA")) return "MORENA";
  if (t === "PAN" || t.includes("ACCION NACIONAL")) return "PAN";
  if (t === "PRI" || t.includes("REVOLUCIONARIO INSTITUCIONAL")) return "PRI";
  if (t === "PVEM" || t.includes("VERDE")) return "PVEM";
  if (t === "MC" || t.includes("MOVIMIENTO CIUDADANO")) return "MC";
  if (t === "PT" || t.includes("DEL TRABAJO")) return "PT";
  if (t === "PRD" || t.includes("REVOLUCION DEMOCRATICA")) return "PRD";
  return null;
}
function mapPartidoIEM(texto: string): PartidoSigla | null {
  const t = norm(texto);
  if (!t) return null;
  if (t.includes("MORENA")) return "MORENA";
  if (t === "PAN" || t.includes("ACCION NACIONAL")) return "PAN";
  if (t === "PRI" || t.includes("REVOLUCIONARIO INSTITUCIONAL")) return "PRI";
  if (t === "PVEM" || t.includes("VERDE")) return "PVEM";
  if (t === "MC" || t.includes("MOVIMIENTO CIUDADANO")) return "MC";
  if (t === "PT" || t.includes("DEL TRABAJO")) return "PT";
  if (t === "PRD" || t.includes("REVOLUCION DEMOCRATICA")) return "PRD";
  if (t === "FXM" || t.includes("FUERZA")) return "FXM";
  return null;
}

// Estimaciones de secciones de riesgo/pivote a partir de la brecha y total de secciones.
function estimarSecciones(seccionesTotal: number | null, brechaPp: number) {
  if (!seccionesTotal || seccionesTotal <= 0) return { riesgo: null as number | null, pivote: null as number | null };
  const fr = Math.min(0.6, Math.max(0.05, brechaPp / 60));
  const fp = Math.min(0.35, Math.max(0.06, 0.30 - Math.abs(brechaPp) / 100));
  return { riesgo: Math.round(seccionesTotal * fr), pivote: Math.round(seccionesTotal * fp) };
}

// ─────────── Fragmentación territorial INE (catálogo SECCION.dbf) ───────────
let catalogoCache: SeccionCat[] | null = null;
async function getCatalogo(): Promise<SeccionCat[] | null> {
  if (catalogoCache) return catalogoCache;
  try {
    catalogoCache = await loadCatalogo();
    return catalogoCache;
  } catch {
    return null;
  }
}

function fragmentar(subset: SeccionCat[], alcance: string): FragmentacionTerritorial | null {
  const total = subset.length;
  if (total === 0) return null;
  const urbSecs = subset.filter((s) => s.tipo === 2).map((s) => s.sec).sort((a, b) => a - b);
  const mixSecs = subset.filter((s) => s.tipo === 3).map((s) => s.sec).sort((a, b) => a - b);
  const rurSecs = subset.filter((s) => s.tipo === 4).map((s) => s.sec).sort((a, b) => a - b);
  const pctU = +((urbSecs.length / total) * 100).toFixed(1);
  const pctM = +((mixSecs.length / total) * 100).toFixed(1);
  const pctR = +((rurSecs.length / total) * 100).toFixed(1);
  let perfil: FragmentacionTerritorial["perfil"] = "balanceado";
  if (pctU >= 60) perfil = "urbano";
  else if (pctR >= 60) perfil = "rural";
  else if (pctM >= 50) perfil = "mixto";
  return {
    total,
    urbanas: urbSecs.length,
    mixtas: mixSecs.length,
    rurales: rurSecs.length,
    pctUrbano: pctU,
    pctMixto: pctM,
    pctRural: pctR,
    perfil,
    noDigitales: mixSecs.length + rurSecs.length,
    seccionesUrbanas: urbSecs,
    seccionesMixtas: mixSecs,
    seccionesRurales: rurSecs,
    alcance,
  };
}

// El campo `mun` en secciones-catalogo.json NO es la clave INEGI 1-113.
// Resolvemos cruzando con el mapeo verificado por distritos locales.
import type { MunicipioSecciones } from "@/lib/municipios-secciones-tipo";
let _munMap: Map<number, MunicipioSecciones> | null = null;
async function getMunMap(): Promise<Map<number, MunicipioSecciones> | null> {
  if (_munMap) return _munMap;
  try {
    const res = await fetch("/data/municipios-secciones-tipo.json");
    if (!res.ok) return null;
    const arr = (await res.json()) as MunicipioSecciones[];
    _munMap = new Map(arr.map((m) => [m.inegi, m]));
    return _munMap;
  } catch { return null; }
}
async function inegiToMunCodes(claves: number[]): Promise<Set<number>> {
  const map = await getMunMap();
  if (!map) return new Set();
  const out = new Set<number>();
  for (const k of claves) { const m = map.get(k); if (m) out.add(m.mun_code); }
  return out;
}

async function fragEstatal(): Promise<FragmentacionTerritorial | null> {
  const cat = await getCatalogo();
  return cat ? fragmentar(cat, "Estado de Michoacán") : null;
}
async function fragDistritoFederal(num: number): Promise<FragmentacionTerritorial | null> {
  const cat = await getCatalogo();
  return cat ? fragmentar(cat.filter((s) => s.dis === num), `Distrito Federal ${num}`) : null;
}
async function fragMunicipio(claveInegi: number, nombre: string): Promise<FragmentacionTerritorial | null> {
  const cat = await getCatalogo();
  if (!cat) return null;
  const munCodes = await inegiToMunCodes([claveInegi]);
  if (munCodes.size === 0) return null;
  return fragmentar(cat.filter((s) => munCodes.has(s.mun)), nombre);
}
async function fragMunicipios(claves: number[], alcance: string): Promise<FragmentacionTerritorial | null> {
  const cat = await getCatalogo();
  if (!cat) return null;
  const munCodes = await inegiToMunCodes(claves);
  if (munCodes.size === 0) return null;
  return fragmentar(cat.filter((s) => munCodes.has(s.mun)), alcance);
}

// ─────────── Resolución por nivel ───────────
async function resolverFederal(c: Candidato, padron: PadronCache | null): Promise<MetricasOficiales | null> {
  const num = extraerNumDistrito(c.territorio);
  if (num == null) return null;
  const distrito = distritosFederales.find((d) => d.id === num);
  if (!distrito) return null;
  const partido = mapPartidoFederal(c.partido);
  const ciclos = Object.entries(distrito.resultados).sort((a, b) => b[1].año - a[1].año);
  if (ciclos.length === 0) return null;
  const r = ciclos[0][1];
  const total = r.totalVotos;
  const pcts = (Object.entries(r.votos) as Array<[Partido, number]>)
    .map(([p, v]) => ({ p, pct: ((v ?? 0) / total) * 100 }))
    .sort((a, b) => b.pct - a.pct);
  const dom = pcts[0];
  const propio = partido ? pcts.find((x) => x.p === partido) : null;
  const rival = partido && dom.p === partido ? pcts[1] ?? dom : dom;
  const propioPct = propio ? propio.pct : Math.max(8, dom.pct - 12);
  const brechaPp = Math.round((rival.pct - propioPct) * 10) / 10;
  const padronD = padron?.distritosFed.get(num) ?? null;
  const secT = padronD?.secciones ?? null;
  const sec = estimarSecciones(secT, brechaPp);
  const fragmentacion = await fragDistritoFederal(num);
  return {
    brechaPp,
    intencionPropia: Math.round(propioPct * 10) / 10,
    intencionRival: Math.round(rival.pct * 10) / 10,
    rivalPartido: rival.p,
    cicloRef: r.año,
    listaNominal: padronD?.listaNominal ?? distrito.listaNominal2024,
    seccionesTotal: secT,
    seccionesRiesgo: sec.riesgo,
    seccionesPivote: sec.pivote,
    participacionHist: r.participacion,
    demografia: padronD ? demografiaDesdePorEdad(padronD.porEdad) : METRICAS_VACIAS.demografia,
    origen: `INE · Distrito Federal ${num} · ${distrito.cabecera} · cómputos ${r.año}${padronD ? " + padrón INE 2026" : ""}`,
    fuenteResultados: "INE",
    fuentePadron: padronD ? "INE-DERFE 2026" : null,
    fragmentacion,
    esEstimacion: false,
  };
}

async function resolverLocal(c: Candidato, padron: PadronCache | null): Promise<MetricasOficiales | null> {
  const num = extraerNumDistrito(c.territorio);
  if (num == null) return null;
  const historico = DIPUTADOS_LOCALES.filter((d) => d.distrito === num).sort((a, b) => b.anio - a.anio);
  if (historico.length === 0) return null;
  const ult = historico[0];
  const partido = mapPartidoIEM(c.partido);
  const totalVotos = Object.values(ult.votosPorPartido).reduce((a, b) => a + (b ?? 0), 0);
  if (totalVotos <= 0) return null;
  const pcts = (Object.entries(ult.votosPorPartido) as Array<[PartidoSigla, number]>)
    .map(([p, v]) => ({ p, pct: ((v ?? 0) / totalVotos) * 100 }))
    .sort((a, b) => b.pct - a.pct);
  const dom = pcts[0];
  const propio = partido ? pcts.find((x) => x.p === partido) : null;
  const rival = partido && dom.p === partido ? pcts[1] ?? dom : dom;
  const propioPct = propio ? propio.pct : Math.max(8, dom.pct - 14);
  const brechaPp = Math.round((rival.pct - propioPct) * 10) / 10;

  // Lista nominal + demografía: agregamos los municipios del distrito local desde el padrón INE.
  const distLocSec = await getDistritosLocalesSecciones();
  const distLocMeta = distLocSec?.get(num) ?? null;
  let lista = 0, secs = 0, hombres = 0, mujeres = 0;
  const porEdadAcc: Record<string, PadronBucket> = {};
  if (distLocMeta && padron) {
    for (const muniNombre of distLocMeta.municipios) {
      const mn = norm(muniNombre);
      // Buscar municipio por nombre normalizado
      let muniClave: number | null = null;
      for (const cm of MUNICIPIOS_MICHOACAN_113) {
        if (norm(cm.nombre) === mn) { muniClave = cm.clave; break; }
      }
      if (muniClave == null) continue;
      const padM = padron.municipios.get(muniClave);
      if (!padM) continue;
      // Atribución proporcional: aprox sección/total_secciones_municipio del padrón.
      // Si todas las secciones del municipio están en este distrito local (común en municipios chicos), asignamos 100%.
      // Si el municipio se reparte (Morelia, Uruapan, Zamora), atribuimos por proporción de secciones del JSON.
      const seccionesEnDist = distLocMeta.secciones.length; // total del distrito; aprox suficiente sin desagregar
      // Para municipios grandes con presencia en varios distritos, no podemos hacer mejor sin sección→municipio fino.
      // Usamos 100% del municipio cuando es el único en el distrito o cuando hay <=2 municipios.
      const factor = distLocMeta.municipios.length <= 2 ? 1
        : Math.min(1, (seccionesEnDist / Math.max(1, distLocMeta.num_secciones)));
      lista += padM.listaNominal * factor;
      secs += padM.secciones * factor;
      hombres += padM.hombres * factor;
      mujeres += padM.mujeres * factor;
      for (const [k, v] of Object.entries(padM.porEdad)) {
        if (!porEdadAcc[k]) porEdadAcc[k] = { h: 0, m: 0, nb: 0, total: 0 };
        porEdadAcc[k].h += v.h * factor;
        porEdadAcc[k].m += v.m * factor;
        porEdadAcc[k].nb += v.nb * factor;
        porEdadAcc[k].total += v.total * factor;
      }
    }
  }
  const listaFinal = lista > 0 ? Math.round(lista) : null;
  const secT = distLocMeta?.num_secciones ?? (secs > 0 ? Math.round(secs) : null);
  const sec = estimarSecciones(secT, brechaPp);
  const demografia = lista > 0
    ? {
        hombres: Math.round(hombres),
        mujeres: Math.round(mujeres),
        pctJovenes18a29: pctEdadGrupo(porEdadAcc, BUCKETS_JOVENES),
        pctAdultoMayor60mas: pctEdadGrupo(porEdadAcc, BUCKETS_MAYORES),
      }
    : METRICAS_VACIAS.demografia;

  // Fragmentación: cruzar municipios del distrito local con catálogo INE
  let fragmentacion: FragmentacionTerritorial | null = null;
  if (distLocMeta) {
    const claves: number[] = [];
    for (const muniNombre of distLocMeta.municipios) {
      const mn = norm(muniNombre);
      const cm = MUNICIPIOS_MICHOACAN_113.find((x) => norm(x.nombre) === mn);
      if (cm) claves.push(cm.clave);
    }
    if (claves.length > 0) fragmentacion = await fragMunicipios(claves, distLocMeta ? `Distrito Local ${distLocMeta.distrito} · ${distLocMeta.cabecera}` : "Distrito Local");
  }

  return {
    brechaPp,
    intencionPropia: Math.round(propioPct * 10) / 10,
    intencionRival: Math.round(rival.pct * 10) / 10,
    rivalPartido: rival.p,
    cicloRef: ult.anio,
    listaNominal: listaFinal,
    seccionesTotal: secT,
    seccionesRiesgo: sec.riesgo,
    seccionesPivote: sec.pivote,
    participacionHist: ult.participacionPct,
    demografia,
    origen: `IEM · Distrito Local ${num}${distLocMeta ? " · " + distLocMeta.cabecera : ""} · cómputos ${ult.anio}${listaFinal ? " + padrón INE 2026 (agregado municipal)" : ""}`,
    fuenteResultados: "IEM",
    fuentePadron: listaFinal ? "INE-DERFE 2026" : null,
    fragmentacion,
    esEstimacion: false,
  };
}

async function resolverAyuntamiento(c: Candidato, padron: PadronCache | null): Promise<MetricasOficiales | null> {
  const tNorm = norm(c.territorio);
  const muni = MUNICIPIOS_MICHOACAN_113.find((m) => norm(m.nombre) === tNorm)
    ?? MUNICIPIOS_MICHOACAN_113.find((m) => norm(m.nombre).includes(tNorm) || tNorm.includes(norm(m.nombre)));
  if (!muni) return null;
  const partido = mapPartidoIEM(c.partido);

  // 1) Histórico desde DB (Perplexity ingerido) — preferente si existe para este municipio.
  const histDB = await fetchHistoricoMuniDB(muni.clave);
  // 2) Histórico seed estático IEM (21 municipios)
  const histSeed = AYUNTAMIENTOS.filter((a) => a.municipioClave === muni.clave).sort((a, b) => b.anio - a.anio);
  const ciclos: AnioLocal[] = [2021, 2018, 2015];

  // Normalizamos al mismo shape: {anio, partidoGanador, porcentajeGanador, participacionPct, partido2, pct2}
  type HistN = {
    anio: number;
    partidoGanador: string;
    porcentajeGanador: number;
    participacionPct: number | null;
    partido2: string | null;
    pct2: number | null;
    fuente: "DB" | "SEED";
  };
  const histNorm: HistN[] = [];
  for (const h of histDB) {
    if (h.partido_ganador && h.pct_ganador != null) {
      histNorm.push({
        anio: h.anio,
        partidoGanador: h.partido_ganador,
        porcentajeGanador: h.pct_ganador,
        participacionPct: h.participacion_pct,
        partido2: h.partido_segundo,
        pct2: h.pct_segundo,
        fuente: "DB",
      });
    }
  }
  // Añadir años del seed que no estén en DB
  for (const s of histSeed) {
    if (!histNorm.some((h) => h.anio === s.anio)) {
      histNorm.push({
        anio: s.anio,
        partidoGanador: s.partidoGanador,
        porcentajeGanador: s.porcentajeGanador,
        participacionPct: s.participacionPct,
        partido2: null,
        pct2: null,
        fuente: "SEED",
      });
    }
  }
  histNorm.sort((a, b) => b.anio - a.anio);
  const ult = histNorm[0] ?? null;

  let brechaPp: number | null = null;
  let intencionPropia: number | null = null;
  let intencionRival: number | null = null;
  let rivalPartido: string | null = null;
  let cicloRef: number | null = null;
  let participacionHist: number | null = null;

  if (ult) {
    cicloRef = ult.anio;
    participacionHist = ult.participacionPct;
    // Si el partido propio coincide con el ganador del último ciclo:
    if (partido && partido === ult.partidoGanador) {
      intencionPropia = ult.porcentajeGanador;
      // 2do real si lo tenemos en DB, si no aproximación
      if (ult.partido2 && ult.pct2 != null) {
        rivalPartido = ult.partido2;
        intencionRival = ult.pct2;
      } else {
        rivalPartido = "Oposición histórica";
        intencionRival = Math.round(ult.porcentajeGanador * 0.78 * 10) / 10;
      }
    } else {
      rivalPartido = ult.partidoGanador;
      intencionRival = ult.porcentajeGanador;
      const previas = partido ? histNorm.filter((h) => h.partidoGanador === partido) : [];
      if (previas.length > 0) {
        intencionPropia = Math.round(
          (previas.reduce((a, b) => a + b.porcentajeGanador, 0) / previas.length) * 10,
        ) / 10;
      } else {
        intencionPropia = Math.round(ult.porcentajeGanador * 0.55 * 10) / 10;
      }
    }
    brechaPp = Math.round((intencionRival! - intencionPropia!) * 10) / 10;
  }

  const padM = padron?.municipios.get(muni.clave) ?? null;
  if (!ult && !padM) return null;
  const lista = padM?.listaNominal ?? null;
  const secT = padM?.secciones ?? null;
  const sec = brechaPp != null
    ? estimarSecciones(secT, brechaPp)
    : { riesgo: null as number | null, pivote: null as number | null };
  const fragmentacion = await fragMunicipio(muni.clave);

  const fuenteHist = ult?.fuente === "DB" ? "IEM (Perplexity/Wikipedia)" : "IEM seed";
  const origenPartes: string[] = [`IEM · Ayuntamiento ${muni.nombre}`];
  if (cicloRef) origenPartes.push(`cómputo ${cicloRef} · ${fuenteHist}`);
  else origenPartes.push("sin histórico IEM cargado");
  if (padM) origenPartes.push("padrón INE 2026");

  return {
    brechaPp,
    intencionPropia,
    intencionRival,
    rivalPartido,
    cicloRef,
    listaNominal: lista,
    seccionesTotal: secT,
    seccionesRiesgo: sec.riesgo,
    seccionesPivote: sec.pivote,
    participacionHist,
    demografia: padM ? demografiaDesdePorEdad(padM.porEdad) : METRICAS_VACIAS.demografia,
    origen: origenPartes.join(" · "),
    fuenteResultados: ult ? "IEM" : null,
    fuentePadron: padM ? "INE-DERFE 2026" : null,
    fragmentacion,
    esEstimacion: false,
  };
}

async function resolverGobernador(c: Candidato, padron: PadronCache | null): Promise<MetricasOficiales | null> {
  // Cómputo IEM 2021 como referencia (último ciclo de gubernatura).
  const ref = GOBERNADOR_RESULTADOS.find((g) => g.anio === 2021) ?? GOBERNADOR_RESULTADOS[0];
  if (!ref) return null;
  const partido = mapPartidoIEM(c.partido);
  // Sumar votos por partido a partir de coaliciones
  const votosPorPartido = new Map<string, number>();
  for (const cand of ref.candidatos) {
    if (cand.coalicion[0] === "OTRO") continue;
    for (const p of cand.coalicion) {
      votosPorPartido.set(p, (votosPorPartido.get(p) ?? 0) + cand.votos / cand.coalicion.length);
    }
  }
  const total = ref.votosTotales;
  const pcts = Array.from(votosPorPartido.entries())
    .map(([p, v]) => ({ p, pct: (v / total) * 100 }))
    .sort((a, b) => b.pct - a.pct);
  const dom = pcts[0];
  const propio = partido ? pcts.find((x) => x.p === partido) : null;
  const rival = partido && dom.p === partido ? pcts[1] ?? dom : dom;
  const propioPct = propio ? propio.pct : Math.max(12, dom.pct - 10);
  const brechaPp = Math.round((rival.pct - propioPct) * 10) / 10;
  const lista = padron?.estado.listaNominal ?? ref.listaNominal;
  const secT = padron?.estado.secciones ?? null;
  const sec = estimarSecciones(secT, brechaPp);
  const fragmentacion = await fragEstatal();
  return {
    brechaPp,
    intencionPropia: Math.round(propioPct * 10) / 10,
    intencionRival: Math.round(rival.pct * 10) / 10,
    rivalPartido: rival.p,
    cicloRef: ref.anio,
    listaNominal: lista,
    seccionesTotal: secT,
    seccionesRiesgo: sec.riesgo,
    seccionesPivote: sec.pivote,
    participacionHist: ref.participacionPct,
    demografia: padron ? demografiaDesdePorEdad(padron.estado.porEdad) : METRICAS_VACIAS.demografia,
    origen: `IEM · Gubernatura Michoacán · cómputo ${ref.anio}${padron ? " + padrón INE 2026 estatal" : ""}`,
    fuenteResultados: "IEM",
    fuentePadron: padron ? "INE-DERFE 2026" : null,
    fragmentacion,
    esEstimacion: false,
  };
}

/** Resuelve métricas oficiales para un candidato según su nivel. */
export async function resolverMetricasOficiales(c: Candidato): Promise<MetricasOficiales> {
  const padron = await getPadronCache();

  let result: MetricasOficiales | null = null;
  if (c.nivel === "diputados_federales") result = await resolverFederal(c, padron);
  else if (c.nivel === "diputados") result = await resolverLocal(c, padron);
  else if (c.nivel === "ayuntamientos") result = await resolverAyuntamiento(c, padron);
  else if (c.nivel === "gobernador") result = await resolverGobernador(c, padron);

  if (result) return result;
  return { ...METRICAS_VACIAS, origen: `Sin match oficial para ${c.nivel} · ${c.territorio}` };
}

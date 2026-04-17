// Loader for INEGI ECEG (Estadísticas Censales a Escalas Geoelectorales)
// Source: ECEG_16_Michoacan.xlsx — 2,694 secciones × 192 indicadores
import * as XLSX from "xlsx";
import { loadCatalogo, lookupSeccion, nombreMunicipio, distritoLocalDeSeccion, infoDistritoLocal, type SeccionCat } from "./secciones-catalogo";

export interface SeccionCenso {
  entidad: number;
  seccion: number;
  POBTOT: number;
  POBMAS: number;
  POBFEM: number;
  POB0_14: number;
  POB15_64: number;
  POB65_MA: number;
  P_18YMAS: number;
  // Educación
  GRAPROES: number; // grado promedio escolaridad
  P15YM_AN: number; // analfabetas 15+
  P18YM_PB: number; // 18+ con educación postbásica
  // Empleo
  PEA: number;
  POCUPADA: number;
  PDESOCUP: number;
  // Salud
  PSINDER: number; // sin derechohabiencia
  PDER_SS: number;
  // Vivienda
  TVIVHAB: number;
  VPH_INTER: number;
  VPH_AUTOM: number;
  VPH_PC: number;
  VPH_CEL: number;
  VPH_REFRI: number;
  VPH_LAVAD: number;
  VPH_C_SERV: number; // viviendas con todos los servicios
  // Lengua / hogares
  P3YM_HLI: number; // habla lengua indígena
  PHOG_IND: number;
  TOTHOG: number;
  HOGJEF_F: number; // hogares jefatura femenina
  // Religión
  PCATOLICA: number;
  PNCATOLICA: number;
  PSIN_RELIG: number;
  [key: string]: number;
}

let cache: SeccionCenso[] | null = null;

export async function loadECEG(): Promise<SeccionCenso[]> {
  if (cache) return cache;
  const [, res] = await Promise.all([loadCatalogo(), fetch("/data/ECEG_16_Michoacan.xlsx")]);
  if (!res.ok) throw new Error("No se pudo cargar el dataset ECEG");
  const buf = await res.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<SeccionCenso>(sheet, { defval: 0 });
  cache = rows.filter((r) => Number(r.entidad) === 16 && Number(r.seccion) > 0);
  return cache;
}

// Agrupa secciones por municipio o distrito federal (usa catálogo INE)
export interface GrupoCenso {
  clave: number;
  nombre: string;
  numSecciones: number;
  resumen: ResumenCenso;
}

export function agruparPor(
  rows: SeccionCenso[],
  dimension: "municipio" | "distrito",
): GrupoCenso[] {
  const groups = new Map<number, SeccionCenso[]>();
  for (const r of rows) {
    const cat = lookupSeccion(Number(r.seccion));
    if (!cat) continue;
    const key = dimension === "municipio" ? cat.mun : cat.dis;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(r);
  }
  return Array.from(groups.entries())
    .map(([clave, secs]) => ({
      clave,
      nombre: dimension === "municipio" ? nombreMunicipio(clave) : `Distrito ${clave.toString().padStart(2, "0")}`,
      numSecciones: secs.length,
      resumen: resumir(secs),
    }))
    .sort((a, b) => b.resumen.POBTOT - a.resumen.POBTOT);
}

export interface ResumenCenso {
  totalSecciones: number;
  POBTOT: number;
  POBMAS: number;
  POBFEM: number;
  POB18YMAS: number;
  POB0_14: number;
  POB15_64: number;
  POB65_MA: number;
  graProEscolaridad: number; // promedio ponderado
  pctAnalfabetismo: number;
  pctPostBasica: number;
  pctOcupacion: number;
  pctDesocupacion: number;
  pctSinDerechohabiencia: number;
  pctVivConInternet: number;
  pctVivConAuto: number;
  pctVivConCelular: number;
  pctVivConServicios: number;
  pctHablaLenguaIndigena: number;
  pctHogJefFemenina: number;
  pctCatolica: number;
  pctNoCatolica: number;
  pctSinReligion: number;
}

export function resumir(rows: SeccionCenso[]): ResumenCenso {
  const sum = (k: keyof SeccionCenso) => rows.reduce((a, r) => a + (Number(r[k]) || 0), 0);
  const POBTOT = sum("POBTOT");
  const P15YMAS = sum("P_15YMAS" as any) || sum("P_18YMAS");
  const P18YMAS = sum("P_18YMAS");
  const TVIVHAB = sum("TVIVHAB");
  const PEA = sum("PEA");
  const P3YMAS = sum("P_3YMAS" as any) || POBTOT;
  const TOTHOG = sum("TOTHOG");

  // Promedio ponderado de escolaridad por población 15+
  const escolaridadPond =
    rows.reduce((a, r) => a + (Number(r.GRAPROES) || 0) * (Number(r["P_15YMAS" as any]) || 0), 0) /
    Math.max(1, P15YMAS);

  const pct = (n: number, d: number) => (d > 0 ? (n / d) * 100 : 0);

  return {
    totalSecciones: rows.length,
    POBTOT,
    POBMAS: sum("POBMAS"),
    POBFEM: sum("POBFEM"),
    POB18YMAS: P18YMAS,
    POB0_14: sum("POB0_14"),
    POB15_64: sum("POB15_64"),
    POB65_MA: sum("POB65_MA"),
    graProEscolaridad: escolaridadPond,
    pctAnalfabetismo: pct(sum("P15YM_AN"), P15YMAS),
    pctPostBasica: pct(sum("P18YM_PB"), P18YMAS),
    pctOcupacion: pct(sum("POCUPADA"), PEA),
    pctDesocupacion: pct(sum("PDESOCUP"), PEA),
    pctSinDerechohabiencia: pct(sum("PSINDER"), POBTOT),
    pctVivConInternet: pct(sum("VPH_INTER"), TVIVHAB),
    pctVivConAuto: pct(sum("VPH_AUTOM"), TVIVHAB),
    pctVivConCelular: pct(sum("VPH_CEL"), TVIVHAB),
    pctVivConServicios: pct(sum("VPH_C_SERV"), TVIVHAB),
    pctHablaLenguaIndigena: pct(sum("P3YM_HLI"), P3YMAS),
    pctHogJefFemenina: pct(sum("HOGJEF_F"), TOTHOG),
    pctCatolica: pct(sum("PCATOLICA"), POBTOT),
    pctNoCatolica: pct(sum("PNCATOLICA"), POBTOT),
    pctSinReligion: pct(sum("PSIN_RELIG"), POBTOT),
  };
}

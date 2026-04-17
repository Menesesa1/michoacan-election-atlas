// Extrae snapshot de contexto del territorio elegido a partir del DataContext

import type { DistritoFederal, DistritoLocal, Partido } from "@/data/electoral-data";
import type { NivelEstrategia, Posicion } from "@/data/estrategia-templates";
import { MUNICIPIOS_ESTRATEGICOS } from "@/data/locales/ayuntamientos";
import {
  getCatalogoSync,
  getDistritosLocales,
  type SeccionCat,
} from "@/lib/secciones-catalogo";

export interface SnapshotPayload {
  nivel: NivelEstrategia;
  nivelLabel: string;
  territorio: string;
  posicion: Posicion;
  coalicion: string[];
  horizonte: string;
  historico: {
    año: number;
    ganador: string;
    margen_pp: number;
    participacion_pct: number;
    voto_morena_pct?: number;
    voto_pan_pct?: number;
    voto_pri_pct?: number;
    voto_mc_pct?: number;
  }[];
  demografia?: {
    lista_nominal: number;
    pct_jovenes_18_29?: number;
    pct_mujeres?: number;
    pct_adultos_mayores?: number;
  };
  composicion_territorial?: {
    secciones_total: number;
    pct_urbano: number;
    pct_mixto: number;
    pct_rural: number;
    perfil: "urbano" | "rural" | "mixto" | "balanceado";
  };
  competitividad?: {
    margen_ultimo_pct: number;
    riesgo_alternancia?: "alto" | "medio" | "bajo";
  };
  alertas_activas?: string[];
  supuestos_usuario?: {
    participacion_esperada_pct?: number;
    voto_duro_pct?: number;
    presupuesto_total_mxn?: number;
  };
}

export interface TerritorioOption {
  value: string;
  label: string;
  poblacion?: number;
}

export function getTerritorios(nivel: NivelEstrategia, distritosLocales: DistritoLocal[]): TerritorioOption[] {
  if (nivel === "gobernador") {
    return [{ value: "estatal", label: "Estado de Michoacán (estatal)" }];
  }
  if (nivel === "diputados") {
    return distritosLocales.map((d) => ({
      value: `distrito-${d.id}`,
      label: `Distrito ${d.id} — ${d.cabecera}`,
    }));
  }
  return MUNICIPIOS_ESTRATEGICOS.map((m) => ({
    value: `mun-${m.clave}`,
    label: m.nombre,
    poblacion: m.poblacion,
  }));
}

function pctVoto(votos: Partial<Record<Partido, number>> | undefined, total: number, p: Partido) {
  if (!votos || !total) return undefined;
  const v = votos[p] ?? 0;
  return (v / total) * 100;
}

function calcMargenPp(votos: Partial<Record<Partido, number>> | undefined, total: number) {
  if (!votos || !total) return 0;
  const sorted = Object.entries(votos)
    .map(([, v]) => (v ?? 0))
    .sort((a, b) => b - a);
  if (sorted.length < 2) return 0;
  return ((sorted[0] - sorted[1]) / total) * 100;
}

export function buildSnapshot(params: {
  nivel: NivelEstrategia;
  nivelLabel: string;
  territorio: string;
  territorioLabel: string;
  posicion: Posicion;
  coalicion: string[];
  horizonte: string;
  distritosFederales: DistritoFederal[];
  distritosLocales: DistritoLocal[];
  alertas?: string[];
  supuestos?: SnapshotPayload["supuestos_usuario"];
}): SnapshotPayload {
  const {
    nivel, nivelLabel, territorio, territorioLabel, posicion, coalicion, horizonte,
    distritosFederales, distritosLocales, alertas, supuestos,
  } = params;

  const historico: SnapshotPayload["historico"] = [];
  let demografia: SnapshotPayload["demografia"];
  let competitividad: SnapshotPayload["competitividad"];

  if (nivel === "diputados" && territorio.startsWith("distrito-")) {
    const id = parseInt(territorio.replace("distrito-", ""), 10);
    const d = distritosLocales.find((x) => x.id === id);
    if (d) {
      Object.values(d.resultados).forEach((r) => {
        historico.push({
          año: r.año,
          ganador: r.ganador,
          margen_pp: calcMargenPp(r.votos, r.totalVotos),
          participacion_pct: r.participacion,
          voto_morena_pct: pctVoto(r.votos, r.totalVotos, "MORENA"),
          voto_pan_pct: pctVoto(r.votos, r.totalVotos, "PAN"),
          voto_pri_pct: pctVoto(r.votos, r.totalVotos, "PRI"),
          voto_mc_pct: pctVoto(r.votos, r.totalVotos, "MC"),
        });
      });
      demografia = { lista_nominal: d.listaNominal2024 };
      const ultimo = historico.sort((a, b) => b.año - a.año)[0];
      if (ultimo) {
        const margen = ultimo.margen_pp;
        competitividad = {
          margen_ultimo_pct: margen,
          riesgo_alternancia: margen < 5 ? "alto" : margen < 12 ? "medio" : "bajo",
        };
      }
    }
  } else if (nivel === "gobernador") {
    // Agregado estatal: suma de distritos locales últimos 3 procesos
    const años = new Set<number>();
    distritosLocales.forEach((d) =>
      Object.values(d.resultados).forEach((r) => años.add(r.año)),
    );
    [...años].sort((a, b) => a - b).forEach((año) => {
      const totales: Partial<Record<Partido, number>> = {};
      let total = 0;
      let participaciones = 0;
      let count = 0;
      distritosLocales.forEach((d) => {
        const r = Object.values(d.resultados).find((x) => x.año === año);
        if (r) {
          (Object.entries(r.votos) as [Partido, number][]).forEach(([p, v]) => {
            totales[p] = (totales[p] ?? 0) + (v ?? 0);
          });
          total += r.totalVotos;
          participaciones += r.participacion;
          count++;
        }
      });
      const ganador = (Object.entries(totales).sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))[0]?.[0] ?? "—") as Partido;
      historico.push({
        año,
        ganador,
        margen_pp: calcMargenPp(totales, total),
        participacion_pct: count > 0 ? participaciones / count : 0,
        voto_morena_pct: pctVoto(totales, total, "MORENA"),
        voto_pan_pct: pctVoto(totales, total, "PAN"),
        voto_pri_pct: pctVoto(totales, total, "PRI"),
        voto_mc_pct: pctVoto(totales, total, "MC"),
      });
    });
    const totalLn = distritosLocales.reduce((s, d) => s + d.listaNominal2024, 0);
    demografia = { lista_nominal: totalLn };
    const ultimo = historico.sort((a, b) => b.año - a.año)[0];
    if (ultimo) {
      competitividad = {
        margen_ultimo_pct: ultimo.margen_pp,
        riesgo_alternancia: ultimo.margen_pp < 5 ? "alto" : ultimo.margen_pp < 12 ? "medio" : "bajo",
      };
    }
  } else if (nivel === "ayuntamientos" && territorio.startsWith("mun-")) {
    const clave = parseInt(territorio.replace("mun-", ""), 10);
    const mun = MUNICIPIOS_ESTRATEGICOS.find((m) => m.clave === clave);
    if (mun) {
      demografia = { lista_nominal: Math.round(mun.poblacion * 0.72) };
    }
  }

  return {
    nivel,
    nivelLabel,
    territorio: territorioLabel,
    posicion,
    coalicion,
    horizonte,
    historico: historico.sort((a, b) => a.año - b.año),
    demografia,
    competitividad,
    alertas_activas: alertas,
    supuestos_usuario: supuestos,
  };
}

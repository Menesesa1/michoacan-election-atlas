// Construye el SnapshotPayload completo a partir de los parámetros del wizard
import type { DistritoFederal, DistritoLocal } from "@/data/electoral-data";
import type { NivelEstrategia, Posicion } from "@/data/estrategia-templates";
import { MUNICIPIOS_ESTRATEGICOS } from "@/data/locales/ayuntamientos";
import { getDistritosLocales } from "@/lib/secciones-catalogo";
import { calcComposicion } from "./composicion-territorial";
import {
  calcRiesgo,
  historicoDistrito,
  historicoEstatal,
} from "./historico-electoral";
import type { SnapshotPayload } from "./types";

export interface BuildSnapshotParams {
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
}

export function buildSnapshot(params: BuildSnapshotParams): SnapshotPayload {
  const {
    nivel, nivelLabel, territorio, territorioLabel, posicion, coalicion, horizonte,
    distritosLocales, alertas, supuestos,
  } = params;

  let historico: SnapshotPayload["historico"] = [];
  let demografia: SnapshotPayload["demografia"];
  let competitividad: SnapshotPayload["competitividad"];
  let composicion_territorial: SnapshotPayload["composicion_territorial"];

  // Mapa secciones por distrito local (catálogo IEM)
  const distritoLocalSecciones = new Map<number, Set<number>>();
  getDistritosLocales().forEach((dl) => {
    distritoLocalSecciones.set(dl.distrito, new Set(dl.secciones));
  });

  if (nivel === "diputados" && territorio.startsWith("distrito-")) {
    const id = parseInt(territorio.replace("distrito-", ""), 10);
    const d = distritosLocales.find((x) => x.id === id);
    if (d) {
      historico = historicoDistrito(d);
      demografia = { lista_nominal: d.listaNominal2024 };
      const ultimo = [...historico].sort((a, b) => b.año - a.año)[0];
      if (ultimo) {
        competitividad = {
          margen_ultimo_pct: ultimo.margen_pp,
          riesgo_alternancia: calcRiesgo(ultimo.margen_pp),
        };
      }
      const secciones = distritoLocalSecciones.get(id);
      if (secciones) composicion_territorial = calcComposicion((s) => secciones.has(s.sec));
    }
  } else if (nivel === "gobernador") {
    historico = historicoEstatal(distritosLocales);
    const totalLn = distritosLocales.reduce((s, d) => s + d.listaNominal2024, 0);
    demografia = { lista_nominal: totalLn };
    const ultimo = [...historico].sort((a, b) => b.año - a.año)[0];
    if (ultimo) {
      competitividad = {
        margen_ultimo_pct: ultimo.margen_pp,
        riesgo_alternancia: calcRiesgo(ultimo.margen_pp),
      };
    }
    composicion_territorial = calcComposicion(() => true);
  } else if (nivel === "ayuntamientos" && territorio.startsWith("mun-")) {
    const clave = parseInt(territorio.replace("mun-", ""), 10);
    const mun = MUNICIPIOS_ESTRATEGICOS.find((m) => m.clave === clave);
    if (mun) {
      demografia = { lista_nominal: Math.round(mun.poblacion * 0.72) };
    }
    composicion_territorial = calcComposicion((s) => s.mun === clave);
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
    composicion_territorial,
    competitividad,
    alertas_activas: alertas,
    supuestos_usuario: supuestos,
  };
}

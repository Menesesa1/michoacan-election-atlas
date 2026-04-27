// Construye el SnapshotPayload completo a partir de los parámetros del wizard
import type { DistritoFederal, DistritoLocal } from "@/data/electoral-data";
import type { NivelEstrategia, Posicion } from "@/data/estrategia-templates";
import { MUNICIPIOS_MICHOACAN_113 } from "@/data/locales/municipios-catalogo";
import {
  getCatalogoSync,
  getDistritosLocales,
  nombreMunicipio,
  seccionesPorDistritoFederal,
  TIPO_SECCION,
  type SeccionCat,
} from "@/lib/secciones-catalogo";
import { calcComposicion } from "./composicion-territorial";
import {
  calcRiesgo,
  historicoDistrito,
  historicoEstatal,
} from "./historico-electoral";
import type { MetaVictoriaCalc, SnapshotPayload } from "./types";

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
  candidatos?: SnapshotPayload["candidatos"];
  supuestos?: SnapshotPayload["supuestos_usuario"];
}

/**
 * Calcula meta de victoria determinística:
 * - votos_requeridos = lista_nominal × participación × umbral
 * - umbral = max(35%, margen_ultimo + 2pp colchón); si no hay margen, 38%
 * - secciones a movilizar = ceil(votos_requeridos / promedio_votos_por_sección)
 *   donde promedio_votos_por_sección = (lista_nominal/secciones) × participación
 */
function buildMetaVictoria(
  listaNominal: number,
  secciones: SeccionCat[],
  participacionPct: number | undefined,
  margenUltimoPp: number | undefined,
): MetaVictoriaCalc | undefined {
  if (!secciones.length || listaNominal <= 0) return undefined;

  const participacion = Math.max(20, Math.min(85, participacionPct ?? 55));
  const umbralBase = margenUltimoPp != null ? margenUltimoPp + 2 : 38;
  const umbral = Math.max(35, Math.min(60, umbralBase));

  const votosRequeridos = Math.round((listaNominal * participacion * umbral) / 10000);
  const promedioListaPorSeccion = Math.round(listaNominal / secciones.length);
  const promedioVotosPorSeccion = Math.max(
    1,
    Math.round(promedioListaPorSeccion * (participacion / 100)),
  );
  const seccionesMinimas = Math.min(
    secciones.length,
    Math.ceil(votosRequeridos / promedioVotosPorSeccion),
  );

  // Agrupar por municipio
  const porMunicipio = new Map<number, number>();
  secciones.forEach((s) => {
    porMunicipio.set(s.mun, (porMunicipio.get(s.mun) ?? 0) + 1);
  });
  const total = secciones.length;
  const municipiosPivote = Array.from(porMunicipio.entries())
    .map(([clave, num]) => ({
      clave,
      nombre: nombreMunicipio(clave),
      secciones: num,
      peso_pct_total: +((num / total) * 100).toFixed(1),
    }))
    .sort((a, b) => b.secciones - a.secciones)
    .slice(0, 8);

  // Top 12 secciones (urbanas y mixtas primero por densidad esperada)
  const seccionesClaveTop = [...secciones]
    .sort((a, b) => {
      const wa = a.tipo === 2 ? 3 : a.tipo === 3 ? 2 : 1;
      const wb = b.tipo === 2 ? 3 : b.tipo === 3 ? 2 : 1;
      return wb - wa;
    })
    .slice(0, 12)
    .map((s) => ({
      sec: s.sec,
      municipio: nombreMunicipio(s.mun),
      tipo: (TIPO_SECCION[s.tipo] ?? "Mixta") as "Urbana" | "Mixta" | "Rural",
    }));

  return {
    lista_nominal: listaNominal,
    participacion_supuesta_pct: +participacion.toFixed(1),
    umbral_victoria_pct: +umbral.toFixed(1),
    votos_requeridos_estimado: votosRequeridos,
    secciones_totales: total,
    promedio_lista_por_seccion: promedioListaPorSeccion,
    secciones_minimas_a_movilizar: seccionesMinimas,
    municipios_pivote: municipiosPivote,
    secciones_clave_top: seccionesClaveTop,
  };
}

export function buildSnapshot(params: BuildSnapshotParams): SnapshotPayload {
  const {
    nivel, nivelLabel, territorio, territorioLabel, posicion, coalicion, horizonte,
    distritosFederales, distritosLocales, alertas, candidatos, supuestos,
  } = params;

  let historico: SnapshotPayload["historico"] = [];
  let demografia: SnapshotPayload["demografia"];
  let competitividad: SnapshotPayload["competitividad"];
  let composicion_territorial: SnapshotPayload["composicion_territorial"];
  let meta_victoria: MetaVictoriaCalc | undefined;

  // Mapa secciones por distrito local (catálogo IEM)
  const distritoLocalSecciones = new Map<number, Set<number>>();
  getDistritosLocales().forEach((dl) => {
    distritoLocalSecciones.set(dl.distrito, new Set(dl.secciones));
  });

  const catalogo = getCatalogoSync();
  const participacionSupuesta = supuestos?.participacion_esperada_pct;

  if (nivel === "diputados" && territorio.startsWith("distrito-") && !territorio.startsWith("distrito-fed-")) {
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
      const seccionesSet = distritoLocalSecciones.get(id);
      if (seccionesSet) composicion_territorial = calcComposicion((s) => seccionesSet.has(s.sec));
      if (catalogo && seccionesSet) {
        const subset = catalogo.filter((s) => seccionesSet.has(s.sec));
        meta_victoria = buildMetaVictoria(
          d.listaNominal2024,
          subset,
          participacionSupuesta ?? ultimo?.participacion_pct,
          ultimo?.margen_pp,
        );
      }
    }
  } else if (nivel === "diputados_federales" && territorio.startsWith("distrito-fed-")) {
    const id = parseInt(territorio.replace("distrito-fed-", ""), 10);
    const d = distritosFederales.find((x) => x.id === id);
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
      // Mapeo INE: filtrar secciones cuyo campo `dis` (distrito federal) coincide
      const subsetFed = seccionesPorDistritoFederal(id);
      if (subsetFed.length > 0) {
        const setFed = new Set(subsetFed.map((s) => s.sec));
        composicion_territorial = calcComposicion((s) => setFed.has(s.sec));
        meta_victoria = buildMetaVictoria(
          d.listaNominal2024,
          subsetFed,
          participacionSupuesta ?? ultimo?.participacion_pct,
          ultimo?.margen_pp,
        );
      } else if (catalogo) {
        // Fallback (catálogo no cargado aún o id sin mapeo): vista estatal
        composicion_territorial = calcComposicion(() => true);
        meta_victoria = buildMetaVictoria(
          d.listaNominal2024,
          catalogo,
          participacionSupuesta ?? ultimo?.participacion_pct,
          ultimo?.margen_pp,
        );
      }
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
    if (catalogo) {
      meta_victoria = buildMetaVictoria(
        totalLn,
        catalogo,
        participacionSupuesta ?? ultimo?.participacion_pct,
        ultimo?.margen_pp,
      );
    }
  } else if (nivel === "ayuntamientos" && territorio.startsWith("mun-")) {
    const clave = parseInt(territorio.replace("mun-", ""), 10);
    const mun = MUNICIPIOS_MICHOACAN_113.find((m) => m.clave === clave);
    if (mun) {
      const ln = Math.round(mun.poblacion * 0.72);
      demografia = { lista_nominal: ln };
      composicion_territorial = calcComposicion((s) => s.mun === clave);
      if (catalogo) {
        const subset = catalogo.filter((s) => s.mun === clave);
        meta_victoria = buildMetaVictoria(
          ln,
          subset,
          participacionSupuesta,
          undefined,
        );
      }
    } else {
      composicion_territorial = calcComposicion((s) => s.mun === clave);
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
    composicion_territorial,
    competitividad,
    meta_victoria,
    alertas_activas: alertas,
    candidatos,
    supuestos_usuario: supuestos,
  };
}

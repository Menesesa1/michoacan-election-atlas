// Tipos compartidos del módulo de Estrategia 360
import type { NivelEstrategia, Posicion } from "@/data/estrategia-templates";
import type { CandidatoSnapshot } from "@/lib/candidatos/types";
import type { SlotContendiente } from "@/lib/candidatos/contendientes-esperados";

export interface MetaVictoriaCalc {
  lista_nominal: number;
  participacion_supuesta_pct: number;
  umbral_victoria_pct: number;
  votos_requeridos_estimado: number;
  secciones_totales: number;
  promedio_lista_por_seccion: number;
  secciones_minimas_a_movilizar: number;
  municipios_pivote: {
    clave: number;
    nombre: string;
    secciones: number;
    peso_pct_total: number;
  }[];
  secciones_clave_top: {
    sec: number;
    municipio: string;
    tipo: "Urbana" | "Mixta" | "Rural";
  }[];
}

/** Inteligencia agregada del territorio (sentimiento, CIB, narrativas). */
export interface InteligenciaSnapshot {
  sentimiento_promedio?: number;
  pct_negativo?: number;
  pct_positivo?: number;
  total_menciones?: number;
  top_temas?: { tema: string; n: number }[];
  cib_alertas_activas?: number;
  cib_severidad_max?: "baja" | "media" | "alta" | "critica";
  alertas_crisis_activas?: number;
  alertas_urgentes?: number;
  narrativas_pendientes?: { mensaje: string; tono?: string; urgencia: number }[];
}

/** Pulso de Google Trends. */
export interface TrendsSnapshot {
  termino?: string;
  promedio_interes?: number;
  pico_interes?: number;
  variacion_pct?: number;
  contexto_narrativo?: string;
  related_top?: { query: string; value?: number }[];
}

export interface SnapshotPayload {
  nivel: NivelEstrategia;
  nivelLabel: string;
  territorio: string;
  posicion: Posicion;
  coalicion: string[];
  horizonte: string;
  /** Lista nominal estatal oficial INE-DERFE — referencia invariante. */
  lista_nominal_estatal_oficial?: number;
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
  meta_victoria?: MetaVictoriaCalc;
  alertas_activas?: string[];
  inteligencia?: InteligenciaSnapshot;
  trends?: TrendsSnapshot;
  /** Universo COMPLETO esperado por cargo (partidos + indep), antes de lista oficial. */
  contendientes_esperados?: SlotContendiente[];
  candidatos?: {
    propio?: CandidatoSnapshot;
    adversarios: CandidatoSnapshot[];
  };
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

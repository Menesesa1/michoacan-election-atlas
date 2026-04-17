// Tipos compartidos del módulo de Estrategia 360
import type { NivelEstrategia, Posicion } from "@/data/estrategia-templates";
import type { CandidatoSnapshot } from "@/lib/candidatos/types";

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

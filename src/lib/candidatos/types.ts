// Tipos del módulo Candidatos

import type { NivelEstrategia } from "@/data/estrategia-templates";

export type TipoAnalisis = "perfil" | "osint" | "discurso";

export interface CandidatoRedes {
  twitter?: string;
  facebook?: string;
  instagram?: string;
  web?: string;
  tiktok?: string;
  youtube?: string;
}

export interface Candidato {
  id: string;
  user_id: string;
  nombre: string;
  partido: string;
  nivel: NivelEstrategia;
  territorio: string;
  fase: import("./fase").FaseCandidatura;
  es_propio: boolean;
  cargo_buscado?: string | null;
  bio_breve?: string | null;
  redes: CandidatoRedes;
  foto_url?: string | null;
  tags: string[];
  notas?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AnalisisPerfil {
  fortalezas: string[];
  debilidades: string[];
  oportunidades: string[];
  amenazas: string[];
  score_competitividad: number; // 0-100
  perfil_votante_natural: string;
}

export interface AnalisisOSINT {
  presencia_digital: {
    nivel: "alta" | "media" | "baja";
    plataformas_fuertes: string[];
    observaciones: string;
  };
  controversias: { tema: string; gravedad: "alta" | "media" | "baja"; descripcion: string }[];
  aliados_clave: string[];
  temas_recurrentes: string[];
  menciones_recientes: { fuente: string; titular: string; tono: "positivo" | "neutral" | "negativo" }[];
}

export interface AnalisisDiscurso {
  ejes_narrativos: string[];
  tono: string;
  frames_dominantes: string[];
  vulnerabilidades_argumentales: string[];
  contraargumentos_sugeridos: { vs_eje: string; respuesta: string }[];
}

export type AnalisisOutput = AnalisisPerfil | AnalisisOSINT | AnalisisDiscurso;

export interface CandidatoAnalisisRow {
  id: string;
  candidato_id: string;
  user_id: string;
  tipo: TipoAnalisis;
  output_json: AnalisisOutput;
  model: string;
  created_at: string;
}

// Resumen compacto que se inyecta al snapshot de Estrategia 360
export interface CandidatoSnapshot {
  id: string;
  nombre: string;
  partido: string;
  cargo_buscado?: string;
  fortalezas_top?: string[];
  debilidades_top?: string[];
  ejes_narrativos?: string[];
  vulnerabilidades_argumentales?: string[];
  score_competitividad?: number;
}

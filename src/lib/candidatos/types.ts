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
  threads?: string;
  whatsapp_community?: string; // URL/invite a comunidad de WhatsApp
}

export type WarRoomRol =
  | "jefe_campana"
  | "vocero"
  | "consultor_estrategia"
  | "consultor_digital"
  | "consultor_imagen"
  | "financista"
  | "coordinador_territorial"
  | "asesor_juridico"
  | "operador_politico"
  | "otro";

export const WAR_ROOM_ROL_LABEL: Record<WarRoomRol, string> = {
  jefe_campana: "Jefe de campaña",
  vocero: "Vocero",
  consultor_estrategia: "Consultor de estrategia",
  consultor_digital: "Consultor digital",
  consultor_imagen: "Consultor de imagen / comunicación",
  financista: "Financista",
  coordinador_territorial: "Coordinador territorial",
  asesor_juridico: "Asesor jurídico",
  operador_politico: "Operador político",
  otro: "Otro",
};

export interface WarRoomMiembro {
  id: string; // local uuid
  nombre: string;
  rol: WarRoomRol;
  tipo: "persona" | "consultora";
  visible: boolean; // true = oficial / público; false = operador en la sombra
  trayectoria_breve?: string;
  inconsistencias: string[];
  fuentes: string[]; // URLs
  notas_internas?: string;
}

// ===== Trayectoria política =====
export type TrayectoriaTipo =
  | "electo"
  | "designado"
  | "candidatura"
  | "cambio_partido"
  | "dirigencia"
  | "otro";

export const TRAYECTORIA_TIPO_LABEL: Record<TrayectoriaTipo, string> = {
  electo: "Cargo electo",
  designado: "Cargo designado",
  candidatura: "Candidatura (sin ganar)",
  cambio_partido: "Cambio de partido",
  dirigencia: "Dirigencia partidaria",
  otro: "Otro",
};

export interface TrayectoriaHito {
  id: string;
  anio: number;
  cargo: string;
  partido?: string;
  tipo: TrayectoriaTipo;
  descripcion?: string;
  fuentes: string[];
}

// ===== Métricas de redes =====
export type PlataformaRed = "facebook" | "twitter" | "instagram" | "tiktok" | "youtube" | "threads";

export const PLATAFORMA_LABEL: Record<PlataformaRed, string> = {
  facebook: "Facebook",
  twitter: "Twitter / X",
  instagram: "Instagram",
  tiktok: "TikTok",
  youtube: "YouTube",
  threads: "Threads",
};

export interface MetricaRed {
  seguidores?: number;
  engagement_rate?: number; // porcentaje 0-100
  ultima_actualizacion?: string; // ISO date
  notas?: string;
}

export type MetricasRedes = Partial<Record<PlataformaRed, MetricaRed>>;

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
  war_room: WarRoomMiembro[];
  trayectoria: TrayectoriaHito[];
  metricas_redes: MetricasRedes;
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
  /** Análisis del War Room capturado por el consultor: coherencia con narrativa pública + alertas reputacionales por miembro. */
  war_room_resumen?: {
    coherencia_con_narrativa: string;
    alertas_reputacionales: { miembro: string; alerta: string; gravedad: "alta" | "media" | "baja" }[];
    observaciones: string;
  };
}

export interface AnalisisDiscurso {
  ejes_narrativos: string[];
  tono: string;
  frames_dominantes: string[];
  vulnerabilidades_argumentales: string[];
  contraargumentos_sugeridos: { vs_eje: string; respuesta: string }[];
}

// ===== Evaluación digital (estimación IA + diagnóstico) =====
export interface EstimacionMetricaIA {
  plataforma: PlataformaRed;
  seguidores_estimados: number;
  engagement_estimado: number;
  base_estimacion: string;
  confianza: "alta" | "media" | "baja";
}

export interface EvaluacionRedes {
  estimacion_metricas: EstimacionMetricaIA[];
  diagnostico_global: {
    nivel_presencia: "alta" | "media" | "baja" | "inexistente";
    score_digital: number;
    resumen_ejecutivo: string;
    brecha_vs_cargo: string;
  };
  foda_digital: {
    fortalezas: string[];
    debilidades: string[];
    oportunidades: string[];
    amenazas: string[];
  };
  recomendaciones: {
    plataforma: PlataformaRed | "general";
    prioridad: "alta" | "media" | "baja";
    accion: string;
    kpi_objetivo: string;
  }[];
  comparables_referencia?: { referencia: string; observacion: string }[];
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
  war_room?: {
    nombre: string;
    rol: WarRoomRol;
    tipo: "persona" | "consultora";
    visible: boolean;
    trayectoria_breve?: string;
    inconsistencias?: string[];
  }[];
}

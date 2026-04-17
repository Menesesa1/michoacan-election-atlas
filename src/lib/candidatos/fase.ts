// Tipos y helpers para la fase de candidatura (precampaña, campaña, etc.)

export type FaseCandidatura = "aspirante" | "precampana" | "campana" | "electo";

export const FASES_CANDIDATURA: FaseCandidatura[] = [
  "aspirante",
  "precampana",
  "campana",
  "electo",
];

export const FASE_LABEL: Record<FaseCandidatura, string> = {
  aspirante: "Aspirante (interna)",
  precampana: "Precampaña",
  campana: "Campaña",
  electo: "Electo",
};

export const FASE_LABEL_CORTO: Record<FaseCandidatura, string> = {
  aspirante: "Aspirante",
  precampana: "Precampaña",
  campana: "Campaña",
  electo: "Electo",
};

export const FASE_DESCRIPCION: Record<FaseCandidatura, string> = {
  aspirante:
    "Busca la candidatura dentro de su partido. Compite contra otros aspirantes de la misma fuerza política.",
  precampana:
    "Precampaña oficial registrada ante el INE/IEM. Promueve su perfil sin pedir el voto explícitamente.",
  campana:
    "Campaña constitucional iniciada. Pide el voto y enfrenta a candidatos de otros partidos.",
  electo:
    "Ya ganó el cargo. Análisis enfocado en gestión y posicionamiento.",
};

/** Identificador estable de una contienda: mismo cargo + territorio + partido + fase. */
export interface ContiendaKey {
  nivel: string;
  territorio: string;
  partido: string;
  fase: FaseCandidatura;
}

/** Genera una clave única de contienda para agrupar candidatos. */
export function contiendaKey(c: ContiendaKey): string {
  return `${c.nivel}::${c.territorio}::${c.partido}::${c.fase}`;
}

/** Etiqueta amigable de una contienda. */
export function contiendaLabel(c: ContiendaKey): string {
  return `${FASE_LABEL_CORTO[c.fase]} · ${c.partido} · ${c.territorio}`;
}

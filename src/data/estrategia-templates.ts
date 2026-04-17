// Plantillas y catálogos para Estrategia 360

import type { PartidoSigla } from "./locales/partidos";

export type Posicion = "oficialismo" | "oposicion" | "aspirante";
export type NivelEstrategia = "gobernador" | "diputados" | "ayuntamientos";

export const POSICION_LABEL: Record<Posicion, string> = {
  oficialismo: "Oficialismo (incumbente)",
  oposicion: "Oposición",
  aspirante: "Aspirante nuevo",
};

export const PARTIDOS_DISPONIBLES: PartidoSigla[] = [
  "MORENA", "PT", "PVEM", "PRD", "PRI", "PAN", "MC",
];

export const SEGMENTO_STYLE: Record<string, { label: string; color: string }> = {
  duro: { label: "Voto duro", color: "text-emerald-400 border-emerald-500/40 bg-emerald-500/10" },
  blando: { label: "Voto blando", color: "text-sky-400 border-sky-500/40 bg-sky-500/10" },
  indeciso: { label: "Indecisos", color: "text-amber-400 border-amber-500/40 bg-amber-500/10" },
  opositor: { label: "Opositor", color: "text-rose-400 border-rose-500/40 bg-rose-500/10" },
};

export const RUBRO_LABEL: Record<string, string> = {
  territorio: "Territorio / Brigadeo",
  digital: "Digital / Redes",
  medios: "Medios tradicionales",
  eventos: "Eventos / Mítines",
  defensa_voto: "Defensa del voto",
  operacion: "Operación / Logística",
  investigacion: "Investigación / Encuestas",
};

export const ZONA_TIPO_STYLE: Record<string, { label: string; color: string }> = {
  bastion: { label: "Bastión", color: "text-emerald-400 bg-emerald-500/15 border-emerald-500/40" },
  bisagra: { label: "Bisagra", color: "text-amber-400 bg-amber-500/15 border-amber-500/40" },
  oposicion_ablandable: { label: "Oposición ablandable", color: "text-sky-400 bg-sky-500/15 border-sky-500/40" },
  expansion: { label: "Expansión", color: "text-violet-400 bg-violet-500/15 border-violet-500/40" },
};

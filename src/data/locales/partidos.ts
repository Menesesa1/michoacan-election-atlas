// Paleta de partidos políticos relevantes en Michoacán (2015-2024)
export type PartidoSigla =
  | "MORENA" | "PT" | "PVEM" | "PRD" | "PRI" | "PAN" | "MC" | "PES" | "PANAL" | "RSP" | "FXM" | "PCM" | "OTRO";

export const PARTIDO_COLOR: Record<PartidoSigla, string> = {
  MORENA: "#8B1E3F",
  PT: "#D52B1E",
  PVEM: "#1B7E3D",
  PRD: "#FFCC00",
  PRI: "#0F5E3F",
  PAN: "#0033A0",
  MC: "#F58220",
  PES: "#522D80",
  PANAL: "#00B5BD",
  RSP: "#A0006A",
  FXM: "#E94B8B",
  PCM: "#7A6F5C",
  OTRO: "#6B7280",
};

export const PARTIDO_NOMBRE: Record<PartidoSigla, string> = {
  MORENA: "Movimiento Regeneración Nacional",
  PT: "Partido del Trabajo",
  PVEM: "Partido Verde Ecologista de México",
  PRD: "Partido de la Revolución Democrática",
  PRI: "Partido Revolucionario Institucional",
  PAN: "Partido Acción Nacional",
  MC: "Movimiento Ciudadano",
  PES: "Partido Encuentro Social",
  PANAL: "Nueva Alianza",
  RSP: "Redes Sociales Progresistas",
  FXM: "Fuerza por México",
  PCM: "Partido Carmesí Michoacán",
  OTRO: "Otros / Independientes",
};

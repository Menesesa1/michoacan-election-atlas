// Helpers para manejar tipo de candidatura: partido único, coalición,
// candidato independiente o candidatura única (consenso).

import { PARTIDO_COLOR, PARTIDO_NOMBRE, type PartidoSigla } from "@/data/locales/partidos";

export type TipoCandidatura =
  | "partido"
  | "coalicion"
  | "independiente"
  | "candidatura_unica";

// Coaliciones históricas/recurrentes en Michoacán y México (referencia rápida).
export const COALICIONES_SUGERIDAS: { etiqueta: string; partidos: PartidoSigla[] }[] = [
  { etiqueta: "Sigamos Haciendo Historia (MORENA-PT-PVEM)", partidos: ["MORENA", "PT", "PVEM"] },
  { etiqueta: "Fuerza y Corazón por México (PAN-PRI-PRD)", partidos: ["PAN", "PRI", "PRD"] },
  { etiqueta: "Va por México (PAN-PRI-PRD)", partidos: ["PAN", "PRI", "PRD"] },
  { etiqueta: "MORENA-PT", partidos: ["MORENA", "PT"] },
  { etiqueta: "MORENA-PVEM", partidos: ["MORENA", "PVEM"] },
  { etiqueta: "PAN-PRD", partidos: ["PAN", "PRD"] },
  { etiqueta: "PRI-PRD", partidos: ["PRI", "PRD"] },
];

export const TOKEN_INDEPENDIENTE = "INDEPENDIENTE";
export const TOKEN_CANDIDATURA_UNICA = "CANDIDATURA_UNICA";

/**
 * Codifica una candidatura como string para guardar en `candidatos.partido`.
 * Compatible con valores existentes (un solo partido).
 */
export function codificarPartido(
  tipo: TipoCandidatura,
  partidos: PartidoSigla[],
): string {
  if (tipo === "independiente") return TOKEN_INDEPENDIENTE;
  if (tipo === "candidatura_unica") return TOKEN_CANDIDATURA_UNICA;
  if (tipo === "coalicion") return partidos.join("-");
  return partidos[0] ?? "OTRO";
}

/**
 * Decodifica un string almacenado en `partido` a su tipo y lista de partidos.
 */
export function decodificarPartido(raw: string): {
  tipo: TipoCandidatura;
  partidos: PartidoSigla[];
} {
  if (!raw) return { tipo: "partido", partidos: ["OTRO"] };
  if (raw === TOKEN_INDEPENDIENTE) return { tipo: "independiente", partidos: [] };
  if (raw === TOKEN_CANDIDATURA_UNICA) return { tipo: "candidatura_unica", partidos: [] };
  const partes = raw.split("-").filter(Boolean) as PartidoSigla[];
  if (partes.length > 1) return { tipo: "coalicion", partidos: partes };
  return { tipo: "partido", partidos: partes.length ? partes : ["OTRO"] };
}

export function etiquetaPartido(raw: string): string {
  const { tipo, partidos } = decodificarPartido(raw);
  if (tipo === "independiente") return "Independiente";
  if (tipo === "candidatura_unica") return "Candidatura única";
  if (tipo === "coalicion") return partidos.join(" + ");
  return PARTIDO_NOMBRE[partidos[0]] ?? partidos[0];
}

export function siglasPartido(raw: string): string {
  const { tipo, partidos } = decodificarPartido(raw);
  if (tipo === "independiente") return "IND";
  if (tipo === "candidatura_unica") return "ÚNICA";
  return partidos.join("-");
}

export function colorPrincipal(raw: string): string {
  const { tipo, partidos } = decodificarPartido(raw);
  if (tipo === "independiente") return "#6B7280";
  if (tipo === "candidatura_unica") return "#94A3B8";
  return PARTIDO_COLOR[partidos[0]] ?? "#6B7280";
}

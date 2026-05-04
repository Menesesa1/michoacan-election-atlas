// Universo de contendientes ESPERADOS por cargo en Michoacán 2027.
// La lista oficial IEM/INE se publicará durante el proceso. Mientras tanto,
// la estrategia debe contemplar TODOS los partidos con registro vigente +
// el slot de candidatura independiente. Cuando llegue la lista oficial,
// cada slot se enlaza al candidato real registrado en `candidatos`.

import type { PartidoSigla } from "@/data/locales/partidos";
import type { NivelEstrategia } from "@/data/estrategia-templates";

// Partidos con registro nacional vigente 2025 (post-INE 2024).
// PRD, PES, PANAL, RSP, FXM perdieron registro nacional; PRD mantiene
// estatal en algunos estados pero no en MIC. PCM es local Michoacán.
export const PARTIDOS_VIGENTES_2027: PartidoSigla[] = [
  "MORENA", "PAN", "PRI", "MC", "PVEM", "PT", "PCM",
];

// Coaliciones probables 2027 a partir de patrón histórico (2018-2024).
export interface CoalicionEsperada {
  etiqueta: string;
  partidos: PartidoSigla[];
  bloque: "oficialista" | "oposicion" | "centro";
  probabilidad: "alta" | "media" | "baja";
}

export const COALICIONES_ESPERADAS_2027: CoalicionEsperada[] = [
  { etiqueta: "Sigamos Haciendo Historia", partidos: ["MORENA", "PT", "PVEM"], bloque: "oficialista", probabilidad: "alta" },
  { etiqueta: "Fuerza y Corazón por Michoacán", partidos: ["PAN", "PRI"], bloque: "oposicion", probabilidad: "alta" },
  { etiqueta: "Movimiento Ciudadano (solo)", partidos: ["MC"], bloque: "centro", probabilidad: "alta" },
  { etiqueta: "PCM (local)", partidos: ["PCM"], bloque: "centro", probabilidad: "media" },
];

export type SlotEsperadoTipo = "coalicion" | "partido" | "independiente";

export interface SlotContendiente {
  slot_id: string;                 // estable: ej. "MORENA-PT-PVEM" o "INDEPENDIENTE-1"
  tipo: SlotEsperadoTipo;
  etiqueta: string;                // visible
  partidos: PartidoSigla[];        // vacío si independiente
  bloque?: "oficialista" | "oposicion" | "centro";
  probabilidad: "alta" | "media" | "baja" | "registrado";
  estado: "pendiente_registro" | "registrado";
  candidato_id?: string;           // se llena al enlazar
  /** Sólo informativo: cuántos espacios independientes contemplar por defecto. */
  nota?: string;
}

/** Universo esperado para el cargo dado, antes de tener lista oficial. */
export function contendientesEsperados(nivel: NivelEstrategia): SlotContendiente[] {
  // Coaliciones / partidos solos
  const slots: SlotContendiente[] = COALICIONES_ESPERADAS_2027.map((c) => ({
    slot_id: c.partidos.join("-") || c.etiqueta,
    tipo: c.partidos.length > 1 ? "coalicion" : "partido",
    etiqueta: c.etiqueta,
    partidos: c.partidos,
    bloque: c.bloque,
    probabilidad: c.probabilidad,
    estado: "pendiente_registro",
  }));

  // Independientes: depende del cargo
  // Gobernatura: 1 slot (alto requisito de firmas).
  // Diputaciones: 1-2 slots.
  // Ayuntamientos grandes: 2 slots, pequeños: 1.
  const numIndep = nivel === "gobernador" ? 1 : nivel === "ayuntamientos" ? 2 : 1;
  for (let i = 1; i <= numIndep; i++) {
    slots.push({
      slot_id: `INDEPENDIENTE-${i}`,
      tipo: "independiente",
      etiqueta: numIndep > 1 ? `Candidatura independiente ${i}` : "Candidatura independiente",
      partidos: [],
      probabilidad: nivel === "gobernador" ? "baja" : "media",
      estado: "pendiente_registro",
      nota: nivel === "gobernador"
        ? "Requiere ~2% del padrón en firmas verificadas"
        : "Slot reservado por si surge candidatura ciudadana",
    });
  }

  return slots;
}

/** Marca como registrados los slots que ya tienen candidato en BD. */
export function enlazarConRegistrados(
  slots: SlotContendiente[],
  candidatos: Array<{ id: string; partido: string; nombre: string }>,
): SlotContendiente[] {
  return slots.map((slot) => {
    let match: { id: string; nombre: string } | undefined;

    if (slot.tipo === "independiente") {
      const ind = candidatos.find((c) => c.partido === "INDEPENDIENTE");
      if (ind) match = { id: ind.id, nombre: ind.nombre };
    } else {
      // Coincidencia exacta (orden) o por contenido de partidos.
      const cand = candidatos.find((c) => {
        const partes = c.partido.split("-").filter(Boolean);
        if (partes.length !== slot.partidos.length) return false;
        return slot.partidos.every((p) => partes.includes(p));
      });
      if (cand) match = { id: cand.id, nombre: cand.nombre };
    }

    if (!match) return slot;
    return {
      ...slot,
      estado: "registrado",
      probabilidad: "registrado",
      candidato_id: match.id,
      etiqueta: `${slot.etiqueta} · ${match.nombre}`,
    };
  });
}

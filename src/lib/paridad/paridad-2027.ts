// Motor de paridad de género para proceso electoral Michoacán 2027.
// Reglas base aplicadas históricamente por el IEM y el TEEM:
//
//   1. Paridad horizontal (ayuntamientos): cada partido/coalición debe postular
//      el 50% de fórmulas encabezadas por mujer y 50% por hombre, en bloques
//      de competitividad alta/media/baja (no concentrar mujeres en municipios
//      perdedores).
//
//   2. Alternancia (diputaciones MR): si en el proceso inmediato anterior un
//      distrito fue ganado por hombre, en el siguiente la postulación del
//      mismo partido tiende a ser mujer (y viceversa). Esta regla la aplican
//      INE/IEM sobre todo cuando hay reelección o herencia de fórmula.
//
//   3. Bloques de competitividad: el IEM clasifica distritos/municipios en
//      tres tercios según porcentaje de votos del partido en proceso anterior.
//      Aquí lo aproximamos con el % del ganador histórico.
//
// La salida es una *sugerencia* — el TEEM puede emitir lineamientos finales
// distintos. Marcamos con confianza para no dar falsa certeza.

import type { Genero } from "./inferir-genero";

export type CompetitividadBloque = "alta" | "media" | "baja";

export interface SugerenciaParidad {
  generoSugerido: Genero;
  motivo: string;
  confianza: "alta" | "media" | "baja";
  bloqueCompetitividad: CompetitividadBloque;
  generoHistorico2021?: Genero;
  generoHistorico2018?: Genero;
}

export interface HistoricoTerritorial {
  anio: number;
  generoGanador: Genero;
  partidoGanador: string;
  porcentajeGanador: number;
}

/** Clasifica el bloque de competitividad por el % del partido ganador. */
export function clasificarBloque(porcentajeGanador: number): CompetitividadBloque {
  if (porcentajeGanador >= 50) return "alta";
  if (porcentajeGanador >= 40) return "media";
  return "baja";
}

/**
 * Sugiere género para postulación 2027 dado el histórico del territorio.
 * @param historico Lista de procesos previos (más reciente primero o cualquier orden).
 * @param partidoEvaluado Sigla del partido que va a postular (para evaluar alternancia interna).
 */
export function sugerirGenero2027(
  historico: HistoricoTerritorial[],
  partidoEvaluado?: string,
): SugerenciaParidad {
  const ordenado = [...historico].sort((a, b) => b.anio - a.anio);
  const ultimo = ordenado[0];
  const anterior = ordenado[1];

  const bloque = ultimo ? clasificarBloque(ultimo.porcentajeGanador) : "media";

  if (!ultimo) {
    return {
      generoSugerido: "ambiguo",
      motivo: "Sin histórico disponible — se requiere validación manual.",
      confianza: "baja",
      bloqueCompetitividad: bloque,
    };
  }

  const generoHistorico2021 = ultimo.generoGanador;
  const generoHistorico2018 = anterior?.generoGanador;

  // Regla 1: alternancia para el mismo partido
  if (partidoEvaluado && partidoEvaluado === ultimo.partidoGanador && ultimo.generoGanador !== "ambiguo") {
    const sugerido: Genero = ultimo.generoGanador === "M" ? "H" : "M";
    return {
      generoSugerido: sugerido,
      motivo: `Alternancia: ${ultimo.partidoGanador} ganó en ${ultimo.anio} con ${ultimo.generoGanador === "M" ? "mujer" : "hombre"}; por paridad interna toca ${sugerido === "M" ? "mujer" : "hombre"}.`,
      confianza: "alta",
      bloqueCompetitividad: bloque,
      generoHistorico2021,
      generoHistorico2018,
    };
  }

  // Regla 2: si el último ganador fue hombre y bloque de alta competitividad,
  // alta probabilidad de que se exija mujer (paridad horizontal en bloques fuertes).
  if (ultimo.generoGanador === "H" && bloque === "alta") {
    return {
      generoSugerido: "M",
      motivo: `Bloque de alta competitividad ganado por hombre en ${ultimo.anio}: paridad horizontal favorece postulación femenina.`,
      confianza: "media",
      bloqueCompetitividad: bloque,
      generoHistorico2021,
      generoHistorico2018,
    };
  }

  if (ultimo.generoGanador === "M" && bloque === "alta") {
    return {
      generoSugerido: "H",
      motivo: `Bloque de alta competitividad ganado por mujer en ${ultimo.anio}: equilibrio sugiere postulación masculina.`,
      confianza: "media",
      bloqueCompetitividad: bloque,
      generoHistorico2021,
      generoHistorico2018,
    };
  }

  // Regla 3: bloque de baja competitividad → libre, recomendamos opuesto al patrón histórico
  if (ultimo.generoGanador !== "ambiguo") {
    const sugerido: Genero = ultimo.generoGanador === "M" ? "H" : "M";
    return {
      generoSugerido: sugerido,
      motivo: `Bloque ${bloque}: tendencia de equilibrio sugiere ${sugerido === "M" ? "mujer" : "hombre"}, pero hay flexibilidad.`,
      confianza: "baja",
      bloqueCompetitividad: bloque,
      generoHistorico2021,
      generoHistorico2018,
    };
  }

  return {
    generoSugerido: "ambiguo",
    motivo: "No se pudo determinar género histórico — validación manual requerida.",
    confianza: "baja",
    bloqueCompetitividad: bloque,
    generoHistorico2021,
    generoHistorico2018,
  };
}

/** Verifica si una candidatura propuesta cumple la sugerencia de paridad. */
export function validarPostulacion(
  generoPropuesto: Genero,
  sugerencia: SugerenciaParidad,
): { cumple: boolean; nivel: "ok" | "advertencia" | "bloqueo"; mensaje: string } {
  if (sugerencia.generoSugerido === "ambiguo") {
    return { cumple: true, nivel: "ok", mensaje: "Sin restricción inferida." };
  }
  if (generoPropuesto === sugerencia.generoSugerido) {
    return { cumple: true, nivel: "ok", mensaje: "Coincide con sugerencia de paridad." };
  }
  if (sugerencia.confianza === "alta") {
    return {
      cumple: false,
      nivel: "bloqueo",
      mensaje: `Posible incumplimiento de paridad: ${sugerencia.motivo}`,
    };
  }
  return {
    cumple: false,
    nivel: "advertencia",
    mensaje: `Revisar paridad: ${sugerencia.motivo}`,
  };
}

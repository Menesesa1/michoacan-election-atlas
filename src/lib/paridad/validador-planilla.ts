// Validador de PLANILLA / BLOQUE de candidaturas según fórmulas IEM Michoacán.
//
// Reglas implementadas (PEOL 2023-2024 / 2024-2025):
//
// 1) Paridad horizontal: del total de postulaciones de un partido/coalición
//    (ayuntamientos o diputaciones MR), 50% mujeres / 50% hombres. Si N es
//    impar, se admite N±1.
//
// 2) Bloques de competitividad (alto/medio/bajo): los territorios se ordenan
//    por % de votación obtenida en la elección anterior y se dividen en
//    tres tercios. Cada bloque debe tener 50/50 (con tolerancia ±1 si impar).
//    Esto evita que las mujeres se concentren en territorios perdedores.
//
// 3) Fórmula propietario/suplente: ambos del mismo género.
//
// 4) Alternancia en listas plurinominales: M-H-M-H… o H-M-H-M…
//
// 5) Gubernatura: cargo unipersonal, paridad aplica a nivel partido (alternancia
//    histórica entre procesos, no se valida aquí pero se reporta).

import type { Genero } from "./inferir-genero";

export type TipoPlanilla = "ayuntamientos" | "diputaciones_mr" | "plurinominal";

export interface PostulacionTerritorio {
  /** Identificador del territorio (clave municipal, núm. distrito, posición en lista). */
  territorioId: string;
  /** Nombre legible para el reporte. */
  territorioNombre: string;
  /** Género del propietario. */
  generoPropietario: Genero;
  /** Género del suplente (opcional para listas RP). */
  generoSuplente?: Genero;
  /** % de votación del partido en la elección inmediata anterior (para bloques). */
  porcentajeAnterior?: number;
}

export interface ResultadoBloque {
  bloque: "alto" | "medio" | "bajo";
  total: number;
  mujeres: number;
  hombres: number;
  diferencia: number;        // |M - H|
  cumple: boolean;           // diferencia ≤ 1
  pctMujeres: number;
}

export interface HallazgoParidad {
  nivel: "ok" | "advertencia" | "bloqueo";
  regla: string;
  mensaje: string;
  territorioId?: string;
}

export interface ResultadoValidacion {
  tipo: TipoPlanilla;
  totalPostulaciones: number;
  mujeres: number;
  hombres: number;
  ambiguos: number;
  pctMujeres: number;
  pctHombres: number;
  cumpleHorizontal: boolean;
  bloques?: ResultadoBloque[];
  hallazgos: HallazgoParidad[];
}

const ABS = (n: number) => Math.abs(n);

/** Divide los territorios en tres bloques por % de votación anterior (descendente). */
export function partirEnBloques<T extends { porcentajeAnterior?: number }>(
  items: T[],
): { alto: T[]; medio: T[]; bajo: T[] } {
  const ordenados = [...items].sort(
    (a, b) => (b.porcentajeAnterior ?? 0) - (a.porcentajeAnterior ?? 0),
  );
  const n = ordenados.length;
  const tercio = Math.ceil(n / 3);
  return {
    alto: ordenados.slice(0, tercio),
    medio: ordenados.slice(tercio, tercio * 2),
    bajo: ordenados.slice(tercio * 2),
  };
}

function contar(p: PostulacionTerritorio[]) {
  let m = 0, h = 0, x = 0;
  for (const it of p) {
    if (it.generoPropietario === "M") m++;
    else if (it.generoPropietario === "H") h++;
    else x++;
  }
  return { m, h, x };
}

function evaluarBloque(
  nombre: "alto" | "medio" | "bajo",
  items: PostulacionTerritorio[],
): ResultadoBloque {
  const { m, h } = contar(items);
  const total = items.length;
  const diferencia = ABS(m - h);
  // Si total es par → diferencia debe ser 0; si impar → ≤ 1
  const tolerancia = total % 2 === 0 ? 0 : 1;
  return {
    bloque: nombre,
    total,
    mujeres: m,
    hombres: h,
    diferencia,
    cumple: diferencia <= tolerancia,
    pctMujeres: total > 0 ? (m / total) * 100 : 0,
  };
}

/** Validador principal de paridad horizontal + bloques + fórmula. */
export function validarPlanilla(
  tipo: TipoPlanilla,
  postulaciones: PostulacionTerritorio[],
): ResultadoValidacion {
  const hallazgos: HallazgoParidad[] = [];
  const { m, h, x } = contar(postulaciones);
  const total = postulaciones.length;
  const tolerancia = total % 2 === 0 ? 0 : 1;
  const cumpleHorizontal = ABS(m - h) <= tolerancia;

  // 1) Horizontal global
  if (!cumpleHorizontal) {
    hallazgos.push({
      nivel: "bloqueo",
      regla: "Paridad horizontal 50/50",
      mensaje: `Desbalance: ${m} mujeres vs ${h} hombres (diferencia ${ABS(m - h)} > tolerancia ${tolerancia}).`,
    });
  } else {
    hallazgos.push({
      nivel: "ok",
      regla: "Paridad horizontal 50/50",
      mensaje: `Cumple: ${m}M / ${h}H sobre ${total} postulaciones.`,
    });
  }

  if (x > 0) {
    hallazgos.push({
      nivel: "advertencia",
      regla: "Postulaciones sin género definido",
      mensaje: `${x} postulaciones tienen género ambiguo o no capturado — corregir antes de validar al IEM.`,
    });
  }

  // 2) Fórmula propietario/suplente del mismo género
  for (const p of postulaciones) {
    if (
      p.generoSuplente &&
      p.generoSuplente !== "ambiguo" &&
      p.generoPropietario !== "ambiguo" &&
      p.generoSuplente !== p.generoPropietario
    ) {
      hallazgos.push({
        nivel: "bloqueo",
        regla: "Fórmula mismo género (propietario/suplente)",
        mensaje: `${p.territorioNombre}: propietario ${p.generoPropietario} y suplente ${p.generoSuplente} no coinciden.`,
        territorioId: p.territorioId,
      });
    }
  }

  // 3) Bloques de competitividad (solo si tenemos % anterior)
  let bloques: ResultadoBloque[] | undefined;
  const conPct = postulaciones.filter((p) => p.porcentajeAnterior != null);
  if (tipo !== "plurinominal" && conPct.length >= 6) {
    const { alto, medio, bajo } = partirEnBloques(conPct);
    bloques = [
      evaluarBloque("alto", alto),
      evaluarBloque("medio", medio),
      evaluarBloque("bajo", bajo),
    ];
    for (const b of bloques) {
      if (!b.cumple) {
        hallazgos.push({
          nivel: "bloqueo",
          regla: `Bloque de competitividad ${b.bloque}`,
          mensaje: `Bloque ${b.bloque}: ${b.mujeres}M / ${b.hombres}H (diferencia ${b.diferencia}). Riesgo de impugnación por concentración de género en territorios ${b.bloque === "bajo" ? "perdedores" : "favorables"}.`,
        });
      } else {
        hallazgos.push({
          nivel: "ok",
          regla: `Bloque de competitividad ${b.bloque}`,
          mensaje: `Bloque ${b.bloque} balanceado: ${b.mujeres}M / ${b.hombres}H.`,
        });
      }
    }
  } else if (tipo !== "plurinominal" && conPct.length < 6 && total >= 6) {
    hallazgos.push({
      nivel: "advertencia",
      regla: "Bloques de competitividad",
      mensaje: "Falta % de votación anterior en la mayoría de territorios; no se pueden calcular bloques alto/medio/bajo.",
    });
  }

  // 4) Alternancia en plurinominales (orden por territorioId numérico)
  if (tipo === "plurinominal" && total >= 2) {
    const lista = [...postulaciones].sort(
      (a, b) => Number(a.territorioId) - Number(b.territorioId),
    );
    let ok = true;
    for (let i = 1; i < lista.length; i++) {
      const prev = lista[i - 1].generoPropietario;
      const cur = lista[i].generoPropietario;
      if (prev !== "ambiguo" && cur !== "ambiguo" && prev === cur) {
        hallazgos.push({
          nivel: "bloqueo",
          regla: "Alternancia en lista RP",
          mensaje: `Posiciones ${lista[i - 1].territorioId} y ${lista[i].territorioId} son del mismo género (${cur}). Debe alternarse M-H-M-H.`,
          territorioId: lista[i].territorioId,
        });
        ok = false;
      }
    }
    if (ok) {
      hallazgos.push({
        nivel: "ok",
        regla: "Alternancia en lista RP",
        mensaje: "La lista alterna correctamente por género.",
      });
    }
  }

  return {
    tipo,
    totalPostulaciones: total,
    mujeres: m,
    hombres: h,
    ambiguos: x,
    pctMujeres: total > 0 ? (m / total) * 100 : 0,
    pctHombres: total > 0 ? (h / total) * 100 : 0,
    cumpleHorizontal,
    bloques,
    hallazgos,
  };
}

// Motor de proyección electoral 2027 para Michoacán
// Dos métodos en paralelo + banda de incertidumbre.
// Honesto sobre limitaciones: n bajo (3-4 ciclos), proyección sensible al método.

import type { DistritoFederal, DistritoLocal, Partido } from "@/data/electoral-data";

export const PARTIDOS_PROYECCION: Partido[] = ["MORENA", "PAN", "PRI", "MC", "PVEM", "PT", "PRD"];

export interface PuntoHistorico {
  año: number;
  pct: number;
}

export interface ProyeccionPartido {
  partido: Partido;
  historico: PuntoHistorico[];
  /** Resultado más reciente real */
  ultimoReal: number;
  /** Año del último resultado real */
  ultimoAño: number;
  /** Proyección por regresión lineal sobre histórico */
  regresion: number;
  /** Proyección por swing uniforme (último ± swing promedio entre 2 últimos) */
  swing: number;
  /** Promedio simple de ambos métodos */
  consenso: number;
  /** Banda inferior 80% confianza (consenso - 1.28σ) */
  bandaInf: number;
  /** Banda superior 80% confianza (consenso + 1.28σ) */
  bandaSup: number;
  /** Desviación estándar histórica de variaciones */
  volatilidad: number;
  /** Tendencia: alza/baja/estable según pendiente regresión */
  tendencia: "alza" | "baja" | "estable";
}

export interface ProyeccionDistrito {
  id: number;
  cabecera: string;
  ganadorActual: Partido;
  pctGanador: number;
  margenActual: number;
  proyeccion: { partido: Partido; pct: number }[];
  ganadorProyectado: Partido;
  pctProyectado: number;
  margenProyectado: number;
  /** Cambio: defiende, conquista, pierde, mantiene */
  estatus: "consolidado" | "riesgo" | "oportunidad" | "competido" | "volteado";
  /** Diferencia entre margen actual y proyectado (positivo = se afianza) */
  delta: number;
}

// ───────────────── Utilidades estadísticas ─────────────────

/** Regresión lineal simple. Devuelve {pendiente, intercepto, r2}. */
function regresionLineal(puntos: { x: number; y: number }[]) {
  const n = puntos.length;
  if (n < 2) return { pendiente: 0, intercepto: puntos[0]?.y ?? 0, r2: 0 };
  const sumX = puntos.reduce((s, p) => s + p.x, 0);
  const sumY = puntos.reduce((s, p) => s + p.y, 0);
  const meanX = sumX / n;
  const meanY = sumY / n;
  let num = 0, den = 0;
  for (const p of puntos) {
    num += (p.x - meanX) * (p.y - meanY);
    den += (p.x - meanX) ** 2;
  }
  const pendiente = den === 0 ? 0 : num / den;
  const intercepto = meanY - pendiente * meanX;
  // R² (calidad del ajuste)
  let ssRes = 0, ssTot = 0;
  for (const p of puntos) {
    const yPred = pendiente * p.x + intercepto;
    ssRes += (p.y - yPred) ** 2;
    ssTot += (p.y - meanY) ** 2;
  }
  const r2 = ssTot === 0 ? 1 : 1 - ssRes / ssTot;
  return { pendiente, intercepto, r2 };
}

/** Desviación estándar de las variaciones inter-elecciones (volatilidad). */
function volatilidadHistorica(puntos: PuntoHistorico[]): number {
  if (puntos.length < 2) return 3; // default conservador
  const diffs: number[] = [];
  for (let i = 1; i < puntos.length; i++) {
    diffs.push(puntos[i].pct - puntos[i - 1].pct);
  }
  const mean = diffs.reduce((s, d) => s + d, 0) / diffs.length;
  const variance = diffs.reduce((s, d) => s + (d - mean) ** 2, 0) / diffs.length;
  return Math.sqrt(variance);
}

function clamp(v: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, v));
}

// ───────────────── Construcción de histórico ─────────────────

interface ResumenAño {
  año: number;
  totalVotos: number;
  totales: Partial<Record<Partido, number>>;
}

/** Agrega votos de un set de distritos por año, filtrando por tipo de elección. */
function construirHistoricoEstatal(
  distritos: (DistritoFederal | DistritoLocal)[],
  tipo: "federal" | "local",
): ResumenAño[] {
  const porAño = new Map<number, ResumenAño>();
  for (const d of distritos) {
    for (const r of Object.values(d.resultados)) {
      if (r.tipo !== tipo) continue;
      if (!r.totalVotos) continue;
      let bucket = porAño.get(r.año);
      if (!bucket) {
        bucket = { año: r.año, totalVotos: 0, totales: {} };
        porAño.set(r.año, bucket);
      }
      bucket.totalVotos += r.totalVotos;
      for (const [p, v] of Object.entries(r.votos)) {
        bucket.totales[p as Partido] = (bucket.totales[p as Partido] ?? 0) + (v ?? 0);
      }
    }
  }
  return [...porAño.values()].sort((a, b) => a.año - b.año);
}

// ───────────────── Proyección por partido (estatal) ─────────────────

const AÑO_OBJETIVO = 2027;

export function proyectarEstatal(
  distritos: (DistritoFederal | DistritoLocal)[],
  tipo: "federal" | "local",
  /** Ajustes manuales en pp por partido (sumados al consenso) */
  ajustes: Partial<Record<Partido, number>> = {},
): {
  proyecciones: ProyeccionPartido[];
  ciclos: number[];
  añoObjetivo: number;
  calidad: "alta" | "media" | "baja";
  notaCalidad: string;
} {
  const historico = construirHistoricoEstatal(distritos, tipo);
  const ciclos = historico.map((h) => h.año);

  const proyecciones: ProyeccionPartido[] = PARTIDOS_PROYECCION.map((partido) => {
    const puntos: PuntoHistorico[] = historico
      .filter((h) => (h.totales[partido] ?? 0) > 0)
      .map((h) => ({
        año: h.año,
        pct: +(((h.totales[partido] ?? 0) / h.totalVotos) * 100).toFixed(2),
      }));

    const ultimo = puntos[puntos.length - 1];
    const previo = puntos[puntos.length - 2];
    const ultimoReal = ultimo?.pct ?? 0;
    const ultimoAño = ultimo?.año ?? AÑO_OBJETIVO - 3;

    // Regresión lineal
    const { pendiente, intercepto, r2 } = regresionLineal(puntos.map((p) => ({ x: p.año, y: p.pct })));
    const regresion = clamp(pendiente * AÑO_OBJETIVO + intercepto);

    // Swing uniforme
    const swingPP = previo ? ultimo!.pct - previo.pct : 0;
    const swing = clamp(ultimoReal + swingPP);

    // Consenso (promedio) + ajuste manual
    const ajuste = ajustes[partido] ?? 0;
    const consensoBase = (regresion + swing) / 2;
    const consenso = clamp(consensoBase + ajuste);

    // Volatilidad → banda 80%
    const vol = volatilidadHistorica(puntos);
    const margenIncert = 1.28 * Math.max(vol, 1.5); // mínimo 1.5pp para no ser irrealmente estrecho
    const bandaInf = clamp(consenso - margenIncert);
    const bandaSup = clamp(consenso + margenIncert);

    const tendencia: ProyeccionPartido["tendencia"] =
      pendiente > 0.5 ? "alza" : pendiente < -0.5 ? "baja" : "estable";

    return {
      partido,
      historico: puntos,
      ultimoReal,
      ultimoAño,
      regresion: +regresion.toFixed(1),
      swing: +swing.toFixed(1),
      consenso: +consenso.toFixed(1),
      bandaInf: +bandaInf.toFixed(1),
      bandaSup: +bandaSup.toFixed(1),
      volatilidad: +vol.toFixed(2),
      tendencia,
    };
  }).filter((p) => p.historico.length >= 2); // solo partidos con histórico real

  // Calidad de la proyección según número de ciclos disponibles
  const n = ciclos.length;
  const calidad: "alta" | "media" | "baja" = n >= 4 ? "alta" : n === 3 ? "media" : "baja";
  const notaCalidad =
    n >= 4
      ? `${n} ciclos comparables · proyección con base estadística sólida`
      : n === 3
      ? `${n} ciclos comparables · proyección indicativa, banda ancha recomendada`
      : `${n} ciclo(s) · insuficiente para tendencia, mostrar como referencia`;

  return { proyecciones, ciclos, añoObjetivo: AÑO_OBJETIVO, calidad, notaCalidad };
}

// ───────────────── Proyección por distrito ─────────────────

export function proyectarPorDistrito(
  distritos: (DistritoFederal | DistritoLocal)[],
  tipo: "federal" | "local",
  ajustes: Partial<Record<Partido, number>> = {},
): ProyeccionDistrito[] {
  return distritos
    .map((d): ProyeccionDistrito | null => {
      const historicos = Object.values(d.resultados)
        .filter((r) => r.tipo === tipo && r.totalVotos > 0)
        .sort((a, b) => a.año - b.año);
      if (historicos.length < 2) return null;

      const ultimo = historicos[historicos.length - 1];
      const previo = historicos[historicos.length - 2];

      // Pct actual por partido
      const pctsUltimo: Partial<Record<Partido, number>> = {};
      for (const [p, v] of Object.entries(ultimo.votos)) {
        pctsUltimo[p as Partido] = ((v ?? 0) / ultimo.totalVotos) * 100;
      }
      const pctsPrevio: Partial<Record<Partido, number>> = {};
      for (const [p, v] of Object.entries(previo.votos)) {
        pctsPrevio[p as Partido] = ((v ?? 0) / previo.totalVotos) * 100;
      }

      // Proyección: swing uniforme + ajuste manual
      const proyeccion = PARTIDOS_PROYECCION.map((p) => {
        const u = pctsUltimo[p] ?? 0;
        const pr = pctsPrevio[p] ?? 0;
        const swing = u - pr;
        const ajuste = ajustes[p] ?? 0;
        return { partido: p, pct: clamp(u + swing + ajuste) };
      }).sort((a, b) => b.pct - a.pct);

      // Ganador actual
      const ordActual = Object.entries(pctsUltimo).sort(([, a], [, b]) => (b ?? 0) - (a ?? 0));
      const ganadorActual = ordActual[0][0] as Partido;
      const pctGanador = +(ordActual[0][1] ?? 0).toFixed(1);
      const segActual = +(ordActual[1]?.[1] ?? 0).toFixed(1);
      const margenActual = +(pctGanador - segActual).toFixed(1);

      const ganadorProyectado = proyeccion[0].partido;
      const pctProyectado = +proyeccion[0].pct.toFixed(1);
      const margenProyectado = +(proyeccion[0].pct - proyeccion[1].pct).toFixed(1);
      const delta = +(margenProyectado - margenActual).toFixed(1);

      let estatus: ProyeccionDistrito["estatus"];
      if (ganadorProyectado !== ganadorActual) {
        estatus = "volteado";
      } else if (margenProyectado >= 15) {
        estatus = "consolidado";
      } else if (margenProyectado < 5) {
        estatus = "competido";
      } else if (delta < -3) {
        estatus = "riesgo";
      } else if (delta > 3) {
        estatus = "oportunidad";
      } else {
        estatus = "consolidado";
      }

      return {
        id: d.id,
        cabecera: d.cabecera,
        ganadorActual,
        pctGanador,
        margenActual,
        proyeccion,
        ganadorProyectado,
        pctProyectado,
        margenProyectado,
        estatus,
        delta,
      };
    })
    .filter((d): d is ProyeccionDistrito => d !== null)
    .sort((a, b) => a.margenProyectado - b.margenProyectado);
}

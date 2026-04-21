// Inteligencia demoscópica: cálculo de promedio ponderado tipo FiveThirtyEight
// y detector de patrón bandwagon en encuestas publicadas en medios locales.

import { ENCUESTADORAS, ENCUESTAS, type Encuesta, type EncuestadoraMeta } from "@/data/encuestadoras-mock";

export interface PromedioCandidato {
  candidato: string;
  partido: string;
  partidoColor: string;
  /** Promedio ponderado por credibilidad + recencia + tamaño de muestra */
  promedio: number;
  /** Mínimo y máximo entre encuestas serias (excluye medios locales) */
  min: number;
  max: number;
  /** Desviación estándar para visualizar dispersión */
  desviacion: number;
  /** Cuántas encuestas serias lo midieron */
  encuestasContadas: number;
}

export interface AlertaBandwagon {
  candidato: string;
  partido: string;
  partidoColor: string;
  /** Promedio entre medios locales */
  promedioMediosLocales: number;
  /** Promedio entre encuestas nacionales serias */
  promedioNacionales: number;
  /** Brecha en puntos porcentuales (positiva = medios locales lo inflan) */
  brecha: number;
  /** Varianza entre medios locales (muy baja = sospecha de coordinación) */
  varianzaMediosLocales: number;
  /** Cuántos medios locales convergen */
  cantidadMedios: number;
  severidad: "alta" | "media" | "baja";
}

/**
 * Peso de una encuesta = credibilidad × factor_recencia × factor_muestra
 * - Recencia: encuestas de hace >60 días valen 50%, lineal entre 0 y 60.
 * - Muestra: log-normalizada contra 1000 como referencia. null = penalización.
 */
function pesoEncuesta(enc: Encuesta, encuestadora: EncuestadoraMeta, ahora: Date): number {
  const credibilidad = encuestadora.credibilidad / 100;
  const dias = Math.max(0, (ahora.getTime() - new Date(enc.fechaFin).getTime()) / (1000 * 60 * 60 * 24));
  const factorRecencia = Math.max(0.5, 1 - (dias / 60) * 0.5);
  let factorMuestra = 0.6;
  if (enc.muestra) {
    factorMuestra = Math.min(1, 0.5 + Math.log10(enc.muestra / 100) / 2);
  }
  return credibilidad * factorRecencia * factorMuestra;
}

/**
 * Calcula promedio ponderado por candidato usando solo encuestadoras nacionales (no medios locales).
 */
export function calcularPromedioPonderado(encuestas: Encuesta[] = ENCUESTAS): PromedioCandidato[] {
  const ahora = new Date();
  const seriasOnly = encuestas.filter(e => {
    const ec = ENCUESTADORAS[e.encuestadoraId];
    return ec && (ec.tipo === "nacional" || ec.tipo === "academica");
  });

  // Agrupar por candidato
  const porCandidato = new Map<string, { partido: string; color: string; muestras: { pct: number; peso: number }[] }>();
  for (const enc of seriasOnly) {
    const ec = ENCUESTADORAS[enc.encuestadoraId];
    if (!ec) continue;
    const peso = pesoEncuesta(enc, ec, ahora);
    for (const r of enc.resultados) {
      if (r.pct === null) continue;
      const key = r.candidato;
      if (!porCandidato.has(key)) {
        porCandidato.set(key, { partido: r.partido, color: r.partidoColor, muestras: [] });
      }
      porCandidato.get(key)!.muestras.push({ pct: r.pct, peso });
    }
  }

  const resultado: PromedioCandidato[] = [];
  for (const [candidato, data] of porCandidato) {
    if (!data.muestras.length) continue;
    const sumaPesos = data.muestras.reduce((s, m) => s + m.peso, 0);
    const promedio = data.muestras.reduce((s, m) => s + m.pct * m.peso, 0) / sumaPesos;
    const valores = data.muestras.map(m => m.pct);
    const min = Math.min(...valores);
    const max = Math.max(...valores);
    const media = valores.reduce((a, b) => a + b, 0) / valores.length;
    const desviacion = Math.sqrt(valores.reduce((s, v) => s + (v - media) ** 2, 0) / valores.length);
    resultado.push({
      candidato,
      partido: data.partido,
      partidoColor: data.color,
      promedio: +promedio.toFixed(1),
      min: +min.toFixed(1),
      max: +max.toFixed(1),
      desviacion: +desviacion.toFixed(2),
      encuestasContadas: data.muestras.length,
    });
  }

  return resultado.sort((a, b) => b.promedio - a.promedio);
}

/**
 * Detecta patrón bandwagon: medios locales que reportan números sospechosamente
 * convergentes y desviados de las encuestas nacionales serias.
 *
 * Severidad:
 *   - alta: brecha >= 6pp + varianza local <= 1.5 + 3+ medios locales
 *   - media: brecha >= 4pp + varianza local <= 2.5
 *   - baja: brecha >= 2pp en al menos 2 medios locales
 */
export function detectarBandwagon(encuestas: Encuesta[] = ENCUESTAS): AlertaBandwagon[] {
  const mediosLocales = encuestas.filter(e => ENCUESTADORAS[e.encuestadoraId]?.tipo === "medio_local");
  const nacionales = encuestas.filter(e => {
    const t = ENCUESTADORAS[e.encuestadoraId]?.tipo;
    return t === "nacional" || t === "academica";
  });
  if (mediosLocales.length < 2 || nacionales.length === 0) return [];

  // Agrupar por candidato
  const candidatos = new Map<string, { partido: string; color: string; locales: number[]; nacionales: { pct: number; peso: number }[] }>();
  const ahora = new Date();

  for (const enc of mediosLocales) {
    for (const r of enc.resultados) {
      if (r.pct === null) continue;
      if (!candidatos.has(r.candidato)) candidatos.set(r.candidato, { partido: r.partido, color: r.partidoColor, locales: [], nacionales: [] });
      candidatos.get(r.candidato)!.locales.push(r.pct);
    }
  }
  for (const enc of nacionales) {
    const ec = ENCUESTADORAS[enc.encuestadoraId];
    if (!ec) continue;
    const peso = pesoEncuesta(enc, ec, ahora);
    for (const r of enc.resultados) {
      if (r.pct === null) continue;
      if (!candidatos.has(r.candidato)) continue;
      candidatos.get(r.candidato)!.nacionales.push({ pct: r.pct, peso });
    }
  }

  const alertas: AlertaBandwagon[] = [];
  for (const [candidato, data] of candidatos) {
    if (data.locales.length < 2 || data.nacionales.length === 0) continue;
    const promLocales = data.locales.reduce((a, b) => a + b, 0) / data.locales.length;
    const sumaPesos = data.nacionales.reduce((s, m) => s + m.peso, 0);
    const promNacionales = data.nacionales.reduce((s, m) => s + m.pct * m.peso, 0) / sumaPesos;
    const brecha = +(promLocales - promNacionales).toFixed(1);
    const varianza = data.locales.reduce((s, v) => s + (v - promLocales) ** 2, 0) / data.locales.length;
    const absBrecha = Math.abs(brecha);

    let severidad: AlertaBandwagon["severidad"] | null = null;
    if (absBrecha >= 6 && varianza <= 1.5 && data.locales.length >= 3) severidad = "alta";
    else if (absBrecha >= 4 && varianza <= 2.5) severidad = "media";
    else if (absBrecha >= 2 && data.locales.length >= 2) severidad = "baja";

    if (severidad) {
      alertas.push({
        candidato,
        partido: data.partido,
        partidoColor: data.color,
        promedioMediosLocales: +promLocales.toFixed(1),
        promedioNacionales: +promNacionales.toFixed(1),
        brecha,
        varianzaMediosLocales: +varianza.toFixed(2),
        cantidadMedios: data.locales.length,
        severidad,
      });
    }
  }

  return alertas.sort((a, b) => Math.abs(b.brecha) - Math.abs(a.brecha));
}

/**
 * Devuelve la lista de encuestas separadas por tipo, ordenadas por fecha desc.
 */
export function agruparPorTipo(encuestas: Encuesta[] = ENCUESTAS) {
  const sortFn = (a: Encuesta, b: Encuesta) => new Date(b.fechaFin).getTime() - new Date(a.fechaFin).getTime();
  return {
    nacionales: encuestas.filter(e => {
      const t = ENCUESTADORAS[e.encuestadoraId]?.tipo;
      return t === "nacional" || t === "academica";
    }).sort(sortFn),
    mediosLocales: encuestas.filter(e => ENCUESTADORAS[e.encuestadoraId]?.tipo === "medio_local").sort(sortFn),
  };
}

/**
 * Etiqueta cualitativa basada en credibilidad numérica.
 */
export function nivelCredibilidad(score: number): { label: string; color: string } {
  if (score >= 80) return { label: "Alta", color: "text-emerald-400" };
  if (score >= 65) return { label: "Buena", color: "text-cyan-400" };
  if (score >= 50) return { label: "Media", color: "text-amber-400" };
  if (score >= 35) return { label: "Baja", color: "text-orange-400" };
  return { label: "Muy baja", color: "text-red-400" };
}

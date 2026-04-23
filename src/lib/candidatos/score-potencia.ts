// Calcula un "score de potencia" para que el partido vea qué aspirantes
// son los más sólidos en la etapa de internas. Basado en señales objetivas:
// trayectoria, war room, redes y completitud de información.

import type { Candidato, MetricasRedes } from "./types";

export interface ScorePotencia {
  total: number; // 0-100
  desglose: {
    trayectoria: number; // 0-30
    war_room: number; // 0-25
    redes: number; // 0-30
    completitud: number; // 0-15
  };
  fortalezas: string[];
  brechas: string[];
}

const seguidoresTotal = (m: MetricasRedes): number => {
  let total = 0;
  for (const k of Object.keys(m) as (keyof MetricasRedes)[]) {
    total += m[k]?.seguidores ?? 0;
  }
  return total;
};

const engagementPromedio = (m: MetricasRedes): number => {
  const vals: number[] = [];
  for (const k of Object.keys(m) as (keyof MetricasRedes)[]) {
    const e = m[k]?.engagement_rate;
    if (typeof e === "number") vals.push(e);
  }
  if (vals.length === 0) return 0;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
};

export function calcularScorePotencia(c: Candidato): ScorePotencia {
  const fortalezas: string[] = [];
  const brechas: string[] = [];

  // === Trayectoria (0-30) ===
  const hitos = c.trayectoria?.length ?? 0;
  const electos = c.trayectoria?.filter((t) => t.tipo === "electo").length ?? 0;
  let trayectoria = Math.min(20, hitos * 4) + Math.min(10, electos * 5);
  trayectoria = Math.min(30, trayectoria);
  if (electos >= 2) fortalezas.push(`${electos} cargos electos previos`);
  else if (hitos === 0) brechas.push("Sin trayectoria documentada");

  // === War Room (0-25) ===
  const wr = c.war_room?.length ?? 0;
  const wrVisibles = c.war_room?.filter((m) => m.visible).length ?? 0;
  const conJefe = c.war_room?.some((m) => m.rol === "jefe_campana") ? 1 : 0;
  const conConsultor = c.war_room?.some((m) => m.rol.startsWith("consultor")) ? 1 : 0;
  let warRoom = Math.min(15, wr * 3) + conJefe * 5 + conConsultor * 5;
  warRoom = Math.min(25, warRoom);
  if (wr >= 3 && conJefe && conConsultor) fortalezas.push("War Room consolidado");
  else if (wr === 0) brechas.push("Sin equipo de campaña visible");
  else if (wrVisibles === 0) brechas.push("Equipo opera 100% en la sombra");

  // === Redes (0-30) ===
  const totalSeg = seguidoresTotal(c.metricas_redes ?? {});
  const eng = engagementPromedio(c.metricas_redes ?? {});
  // Escala log: 1k→8, 10k→16, 100k→24, 1M→30
  let redesScore = 0;
  if (totalSeg > 0) {
    redesScore = Math.min(22, Math.log10(Math.max(1, totalSeg)) * 6);
  }
  redesScore += Math.min(8, eng * 1.5); // engagement de 5% → +7.5
  redesScore = Math.min(30, redesScore);
  if (totalSeg >= 50000) fortalezas.push(`${(totalSeg / 1000).toFixed(0)}k seguidores totales`);
  else if (totalSeg < 1000) brechas.push("Presencia digital muy débil (<1k)");
  if (eng >= 3) fortalezas.push(`Engagement promedio ${eng.toFixed(1)}%`);

  // === Completitud (0-15) ===
  let completitud = 0;
  if (c.bio_breve && c.bio_breve.length > 50) completitud += 4;
  if (c.foto_url) completitud += 3;
  if (c.cargo_buscado) completitud += 2;
  if (Object.keys(c.redes ?? {}).length >= 2) completitud += 3;
  if ((c.tags?.length ?? 0) >= 2) completitud += 3;
  completitud = Math.min(15, completitud);
  if (completitud < 8) brechas.push("Ficha de candidato incompleta");

  const total = Math.round(trayectoria + warRoom + redesScore + completitud);

  return {
    total,
    desglose: {
      trayectoria: Math.round(trayectoria),
      war_room: Math.round(warRoom),
      redes: Math.round(redesScore),
      completitud: Math.round(completitud),
    },
    fortalezas,
    brechas,
  };
}

export function nivelPotencia(score: number): {
  label: string;
  color: string;
  emoji: string;
} {
  if (score >= 75) return { label: "Élite", color: "text-emerald-400 border-emerald-500/40 bg-emerald-500/10", emoji: "🔥" };
  if (score >= 55) return { label: "Sólido", color: "text-primary border-primary/40 bg-primary/10", emoji: "💪" };
  if (score >= 35) return { label: "En construcción", color: "text-amber-400 border-amber-500/40 bg-amber-500/10", emoji: "⚙️" };
  return { label: "Inicial", color: "text-muted-foreground border-border bg-muted/30", emoji: "🌱" };
}

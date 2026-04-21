// Cálculos de histórico electoral y competitividad por territorio
import type { DistritoFederal, DistritoLocal, Partido } from "@/data/electoral-data";
import type { SnapshotPayload } from "./types";

export function pctVoto(
  votos: Partial<Record<Partido, number>> | undefined,
  total: number,
  p: Partido,
): number | undefined {
  if (!votos || !total) return undefined;
  const v = votos[p] ?? 0;
  return (v / total) * 100;
}

export function calcMargenPp(
  votos: Partial<Record<Partido, number>> | undefined,
  total: number,
): number {
  if (!votos || !total) return 0;
  const sorted = Object.entries(votos)
    .map(([, v]) => v ?? 0)
    .sort((a, b) => b - a);
  if (sorted.length < 2) return 0;
  return ((sorted[0] - sorted[1]) / total) * 100;
}

export function calcRiesgo(margen: number): "alto" | "medio" | "bajo" {
  return margen < 5 ? "alto" : margen < 12 ? "medio" : "bajo";
}

/** Histórico de un distrito (local o federal) — misma forma de datos */
export function historicoDistrito(d: DistritoLocal | DistritoFederal): SnapshotPayload["historico"] {
  return Object.values(d.resultados).map((r) => ({
    año: r.año,
    ganador: r.ganador,
    margen_pp: calcMargenPp(r.votos, r.totalVotos),
    participacion_pct: r.participacion,
    voto_morena_pct: pctVoto(r.votos, r.totalVotos, "MORENA"),
    voto_pan_pct: pctVoto(r.votos, r.totalVotos, "PAN"),
    voto_pri_pct: pctVoto(r.votos, r.totalVotos, "PRI"),
    voto_mc_pct: pctVoto(r.votos, r.totalVotos, "MC"),
  }));
}

/** Histórico estatal: agrega los 24 distritos locales por año */
export function historicoEstatal(distritosLocales: DistritoLocal[]): SnapshotPayload["historico"] {
  const años = new Set<number>();
  distritosLocales.forEach((d) =>
    Object.values(d.resultados).forEach((r) => años.add(r.año)),
  );

  const out: SnapshotPayload["historico"] = [];
  [...años].sort((a, b) => a - b).forEach((año) => {
    const totales: Partial<Record<Partido, number>> = {};
    let total = 0;
    let participaciones = 0;
    let count = 0;
    distritosLocales.forEach((d) => {
      const r = Object.values(d.resultados).find((x) => x.año === año);
      if (!r) return;
      (Object.entries(r.votos) as [Partido, number][]).forEach(([p, v]) => {
        totales[p] = (totales[p] ?? 0) + (v ?? 0);
      });
      total += r.totalVotos;
      participaciones += r.participacion;
      count++;
    });
    const ganador = (Object.entries(totales).sort(
      (a, b) => (b[1] ?? 0) - (a[1] ?? 0),
    )[0]?.[0] ?? "—") as Partido;
    out.push({
      año,
      ganador,
      margen_pp: calcMargenPp(totales, total),
      participacion_pct: count > 0 ? participaciones / count : 0,
      voto_morena_pct: pctVoto(totales, total, "MORENA"),
      voto_pan_pct: pctVoto(totales, total, "PAN"),
      voto_pri_pct: pctVoto(totales, total, "PRI"),
      voto_mc_pct: pctVoto(totales, total, "MC"),
    });
  });
  return out;
}

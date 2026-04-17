// Filtra alertas del feed de /crisis según el territorio elegido en /escenarios
// Devuelve cadenas listas para inyectar en snapshot.alertas_activas

import type { Alerta } from "@/data/alertas-mock";
import type { NivelEstrategia } from "@/data/estrategia-templates";

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

/** Normaliza para matching laxo (sin acentos, lowercase) */
function norm(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export interface FiltroTerritorio {
  nivel: NivelEstrategia;
  /** Etiqueta legible del territorio: "Distrito 11 — Morelia", "Morelia", "Estado de Michoacán (estatal)" */
  territorioLabel: string;
}

/**
 * Filtra alertas relevantes al territorio. Para nivel "gobernador" devuelve todas
 * (visión estatal). Para distritos/municipios hace match por palabras clave del
 * label contra el campo `distrito` y `descripcion` de la alerta.
 */
export function filtrarAlertasTerritorio(
  alertas: Alerta[],
  filtro: FiltroTerritorio,
): Alerta[] {
  if (filtro.nivel === "gobernador") return alertas;

  // Extraer palabras clave significativas del label (>3 chars, no genéricas)
  const stop = new Set(["distrito", "estado", "michoacan", "estatal", "para", "con", "por"]);
  const tokens = norm(filtro.territorioLabel)
    .split(/[\s—\-·,()]+/)
    .filter((t) => t.length > 3 && !stop.has(t));

  if (tokens.length === 0) return [];

  return alertas.filter((a) => {
    const hay = norm(`${a.distrito} ${a.descripcion} ${a.titulo}`);
    return tokens.some((t) => hay.includes(t));
  });
}

/**
 * Convierte alertas en strings compactos para `snapshot.alertas_activas`.
 * Formato: "[Urgente · 8m] Bloqueo carretero en Apatzingán — D9"
 */
export function alertasASnapshot(alertas: Alerta[], max = 6): string[] {
  return alertas
    .slice(0, max)
    .map((a) => `[${a.prioridad} · ${timeAgo(a.timestamp)}] ${a.titulo} — ${a.distrito}`);
}

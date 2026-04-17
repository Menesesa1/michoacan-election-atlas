// Calcula composición urbano/mixto/rural a partir del catálogo INE de secciones.
// Tipo INE: 2=Urbana, 3=Mixta, 4=Rural.

import { getCatalogoSync, type SeccionCat } from "@/lib/secciones-catalogo";
import type { SnapshotPayload } from "./types";

/**
 * Devuelve `undefined` si el catálogo aún no se cargó (no bloqueante)
 * o si no hay secciones que cumplan el filtro.
 */
export function calcComposicion(
  filter: (s: SeccionCat) => boolean,
): SnapshotPayload["composicion_territorial"] {
  const cat = getCatalogoSync();
  if (!cat) return undefined;
  const subset = cat.filter(filter);
  const total = subset.length;
  if (total === 0) return undefined;

  const urb = subset.filter((s) => s.tipo === 2).length;
  const mix = subset.filter((s) => s.tipo === 3).length;
  const rur = subset.filter((s) => s.tipo === 4).length;
  const pct_urbano = +((urb / total) * 100).toFixed(1);
  const pct_mixto = +((mix / total) * 100).toFixed(1);
  const pct_rural = +((rur / total) * 100).toFixed(1);

  let perfil: "urbano" | "rural" | "mixto" | "balanceado" = "balanceado";
  if (pct_urbano >= 60) perfil = "urbano";
  else if (pct_rural >= 60) perfil = "rural";
  else if (pct_mixto >= 50) perfil = "mixto";

  return { secciones_total: total, pct_urbano, pct_mixto, pct_rural, perfil };
}

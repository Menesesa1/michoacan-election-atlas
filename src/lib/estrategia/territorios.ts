// Catálogo de territorios elegibles según nivel
import type { DistritoLocal } from "@/data/electoral-data";
import type { NivelEstrategia } from "@/data/estrategia-templates";
import { MUNICIPIOS_ESTRATEGICOS } from "@/data/locales/ayuntamientos";
import type { TerritorioOption } from "./types";

export function getTerritorios(
  nivel: NivelEstrategia,
  distritosLocales: DistritoLocal[],
): TerritorioOption[] {
  if (nivel === "gobernador") {
    return [{ value: "estatal", label: "Estado de Michoacán (estatal)" }];
  }
  if (nivel === "diputados") {
    return distritosLocales.map((d) => ({
      value: `distrito-${d.id}`,
      label: `Distrito ${d.id} — ${d.cabecera}`,
    }));
  }
  return MUNICIPIOS_ESTRATEGICOS.map((m) => ({
    value: `mun-${m.clave}`,
    label: m.nombre,
    poblacion: m.poblacion,
  }));
}

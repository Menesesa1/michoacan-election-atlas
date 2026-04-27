// Catálogo de territorios elegibles según nivel.
// Regla central: la sección es la unidad atómica → todo módulo expone los 113
// municipios, los 24 distritos locales y los 11 distritos federales completos.
import type { DistritoFederal, DistritoLocal } from "@/data/electoral-data";
import type { NivelEstrategia } from "@/data/estrategia-templates";
import { MUNICIPIOS_MICHOACAN_113 } from "@/data/locales/municipios-catalogo";
import type { TerritorioOption } from "./types";

export function getTerritorios(
  nivel: NivelEstrategia,
  distritosLocales: DistritoLocal[],
  distritosFederales: DistritoFederal[] = [],
): TerritorioOption[] {
  if (nivel === "gobernador") {
    return [{ value: "estatal", label: "Estado de Michoacán (estatal)" }];
  }
  if (nivel === "diputados_federales") {
    return distritosFederales.map((d) => ({
      value: `distrito-fed-${d.id}`,
      label: `Distrito Federal ${String(d.id).padStart(2, "0")} — ${d.cabecera}`,
    }));
  }
  if (nivel === "diputados") {
    return distritosLocales.map((d) => ({
      value: `distrito-${d.id}`,
      label: `Distrito ${String(d.id).padStart(2, "0")} — ${d.cabecera}`,
    }));
  }
  // Ayuntamientos: TODOS los 113 municipios INEGI, ordenados alfabéticamente.
  return [...MUNICIPIOS_MICHOACAN_113]
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"))
    .map((m) => ({
      value: `mun-${m.clave}`,
      label: m.nombre,
      poblacion: m.poblacion,
    }));
}

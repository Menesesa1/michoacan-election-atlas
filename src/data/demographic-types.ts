export interface DemograficoSeccion {
  seccion: number;
  distritoFederal: number;
  distritoLocal: number;
  municipio: string;
  listaNominal: number;
  hombres: number;
  mujeres: number;
  rangoEdad: RangoEdad[];
}

export interface RangoEdad {
  rango: string;
  hombres: number;
  mujeres: number;
  total: number;
}

export interface DemograficoDistrito {
  distritoId: number;
  tipo: "federal" | "local";
  listaNominal: number;
  hombres: number;
  mujeres: number;
  secciones: number;
  rangoEdad: RangoEdad[];
  poblacionPrincipal: string; // rango de edad con más electores
}

export const RANGOS_EDAD_INE = [
  "18-19", "20-24", "25-29", "30-34", "35-39",
  "40-44", "45-49", "50-54", "55-59", "60-64", "65+"
] as const;

export function emptyRangos(): RangoEdad[] {
  return RANGOS_EDAD_INE.map(r => ({ rango: r, hombres: 0, mujeres: 0, total: 0 }));
}

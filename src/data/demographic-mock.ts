import type { DemograficoDistrito } from "./demographic-types";

// Distribución porcentual por rango de edad basada en datos INE Michoacán 2024
// Fuente aproximada: Lista Nominal por rangos de edad y sexo
const DIST_EDAD = [
  { rango: "18-19", pct: 0.045 },
  { rango: "20-24", pct: 0.105 },
  { rango: "25-29", pct: 0.105 },
  { rango: "30-34", pct: 0.100 },
  { rango: "35-39", pct: 0.100 },
  { rango: "40-44", pct: 0.095 },
  { rango: "45-49", pct: 0.090 },
  { rango: "50-54", pct: 0.082 },
  { rango: "55-59", pct: 0.072 },
  { rango: "60-64", pct: 0.060 },
  { rango: "65+",   pct: 0.146 },
];

// Ratio mujeres/total varía ligeramente por distrito (51-53% mujeres es típico en Michoacán)
function buildDistrito(
  id: number,
  tipo: "federal" | "local",
  listaNominal: number,
  pctMujeres: number,
  secciones: number
): DemograficoDistrito {
  const mujeres = Math.round(listaNominal * pctMujeres);
  const hombres = listaNominal - mujeres;

  const rangoEdad = DIST_EDAD.map(({ rango, pct }) => {
    const total = Math.round(listaNominal * pct);
    const rm = Math.round(total * pctMujeres);
    const rh = total - rm;
    return { rango, hombres: rh, mujeres: rm, total };
  });

  const max = rangoEdad.reduce((a, b) => (a.total >= b.total ? a : b));

  return {
    distritoId: id,
    tipo,
    listaNominal,
    hombres,
    mujeres,
    secciones,
    rangoEdad,
    poblacionPrincipal: max.rango,
  };
}

// 11 Distritos Federales — datos aproximados de Lista Nominal INE 2024 Michoacán
export const demograficosFederalesMock: DemograficoDistrito[] = [
  buildDistrito(1,  "federal", 378542, 0.521, 412),
  buildDistrito(2,  "federal", 342187, 0.518, 389),
  buildDistrito(3,  "federal", 395230, 0.525, 435),
  buildDistrito(4,  "federal", 412876, 0.522, 458),
  buildDistrito(5,  "federal", 387654, 0.519, 421),
  buildDistrito(6,  "federal", 356789, 0.523, 398),
  buildDistrito(7,  "federal", 401234, 0.520, 443),
  buildDistrito(8,  "federal", 389456, 0.517, 427),
  buildDistrito(9,  "federal", 367890, 0.524, 405),
  buildDistrito(10, "federal", 345678, 0.516, 382),
  buildDistrito(11, "federal", 423456, 0.521, 467),
];

// 24 Distritos Locales — datos aproximados IEM 2024
export const demograficosLocalesMock: DemograficoDistrito[] = [
  buildDistrito(1,  "local", 145230, 0.522, 168),
  buildDistrito(2,  "local", 112340, 0.518, 134),
  buildDistrito(3,  "local", 158670, 0.525, 182),
  buildDistrito(4,  "local", 172450, 0.521, 198),
  buildDistrito(5,  "local", 165230, 0.519, 190),
  buildDistrito(6,  "local", 138900, 0.523, 160),
  buildDistrito(7,  "local", 126780, 0.520, 146),
  buildDistrito(8,  "local", 168340, 0.517, 194),
  buildDistrito(9,  "local", 155670, 0.524, 179),
  buildDistrito(10, "local", 143560, 0.516, 165),
  buildDistrito(11, "local", 131240, 0.521, 151),
  buildDistrito(12, "local", 189450, 0.523, 218),
  buildDistrito(13, "local", 176890, 0.519, 204),
  buildDistrito(14, "local", 162340, 0.522, 187),
  buildDistrito(15, "local", 148760, 0.518, 171),
  buildDistrito(16, "local", 195670, 0.525, 225),
  buildDistrito(17, "local", 183210, 0.520, 211),
  buildDistrito(18, "local", 156780, 0.517, 181),
  buildDistrito(19, "local", 141230, 0.523, 163),
  buildDistrito(20, "local", 167890, 0.521, 193),
  buildDistrito(21, "local", 134560, 0.519, 155),
  buildDistrito(22, "local", 178340, 0.522, 205),
  buildDistrito(23, "local", 152670, 0.518, 176),
  buildDistrito(24, "local", 163450, 0.524, 188),
];

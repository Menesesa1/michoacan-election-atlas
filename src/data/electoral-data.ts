// Mock electoral data for Michoacán - structured to match INE's data format
// This will be replaced with real data from INE APIs/downloads

export type Partido = "MORENA" | "PAN" | "PRI" | "PVEM" | "MC" | "PT" | "PRD" | "OTROS";

export const PARTIDOS_CONFIG: Record<Partido, { color: string; label: string; colorVar: string }> = {
  MORENA: { color: "#8B2332", label: "MORENA", colorVar: "var(--chart-morena)" },
  PAN: { color: "#0066CC", label: "PAN", colorVar: "var(--chart-pan)" },
  PRI: { color: "#CC1B1B", label: "PRI", colorVar: "var(--chart-pri)" },
  PVEM: { color: "#2D8B46", label: "PVEM", colorVar: "var(--chart-pvem)" },
  MC: { color: "#F5A623", label: "MC", colorVar: "var(--chart-mc)" },
  PT: { color: "#CC3333", label: "PT", colorVar: "var(--chart-pt)" },
  PRD: { color: "#FFD700", label: "PRD", colorVar: "var(--chart-prd)" },
  OTROS: { color: "#666666", label: "Otros", colorVar: "hsl(var(--muted-foreground))" },
};

export interface DistritoFederal {
  id: number;
  cabecera: string;
  listaNominal2024: number;
  participacion2024: number;
  resultados: Record<string, ResultadoEleccion>;
}

export interface DistritoLocal {
  id: number;
  cabecera: string;
  listaNominal2024: number;
  participacion2024: number;
  resultados: Record<string, ResultadoEleccion>;
}

export interface ResultadoEleccion {
  año: number;
  tipo: "federal" | "local";
  votos: Partial<Record<Partido, number>>;
  totalVotos: number;
  participacion: number;
  ganador: Partido;
}

// 11 Distritos Federales de Michoacán
export const distritosFederales: DistritoFederal[] = [
  {
    id: 1, cabecera: "Lázaro Cárdenas", listaNominal2024: 378542, participacion2024: 58.2,
    resultados: {
      "fed2024": { año: 2024, tipo: "federal", votos: { MORENA: 98432, PAN: 34521, PRI: 22134, MC: 15432, PVEM: 12345, PT: 8765, PRD: 6543, OTROS: 3210 }, totalVotos: 201382, participacion: 58.2, ganador: "MORENA" },
      "fed2021": { año: 2021, tipo: "federal", votos: { MORENA: 72345, PAN: 38765, PRI: 28432, MC: 12345, PVEM: 8765, PT: 6543, PRD: 9876, OTROS: 2100 }, totalVotos: 179171, participacion: 52.1, ganador: "MORENA" },
      "fed2018": { año: 2018, tipo: "federal", votos: { MORENA: 105432, PAN: 42345, PRI: 31234, MC: 8765, PVEM: 6543, PT: 12345, PRD: 15432, OTROS: 4321 }, totalVotos: 226417, participacion: 65.3, ganador: "MORENA" },
    }
  },
  {
    id: 2, cabecera: "Puruándiro", listaNominal2024: 342187, participacion2024: 55.8,
    resultados: {
      "fed2024": { año: 2024, tipo: "federal", votos: { MORENA: 78654, PAN: 42345, PRI: 28765, MC: 18432, PVEM: 9876, PT: 7654, PRD: 5432, OTROS: 2876 }, totalVotos: 194034, participacion: 55.8, ganador: "MORENA" },
      "fed2021": { año: 2021, tipo: "federal", votos: { MORENA: 62345, PAN: 45678, PRI: 32456, MC: 14567, PVEM: 7890, PT: 5678, PRD: 8901, OTROS: 1890 }, totalVotos: 179405, participacion: 51.2, ganador: "MORENA" },
      "fed2018": { año: 2018, tipo: "federal", votos: { MORENA: 89765, PAN: 48901, PRI: 38765, MC: 11234, PVEM: 5678, PT: 9876, PRD: 12345, OTROS: 3456 }, totalVotos: 220020, participacion: 63.1, ganador: "MORENA" },
    }
  },
  {
    id: 3, cabecera: "Zitácuaro", listaNominal2024: 365432, participacion2024: 57.1,
    resultados: {
      "fed2024": { año: 2024, tipo: "federal", votos: { MORENA: 85432, PAN: 38765, PRI: 25432, MC: 21345, PVEM: 11234, PT: 8765, PRD: 6543, OTROS: 3210 }, totalVotos: 200726, participacion: 57.1, ganador: "MORENA" },
      "fed2021": { año: 2021, tipo: "federal", votos: { MORENA: 68765, PAN: 42345, PRI: 30123, MC: 16789, PVEM: 8901, PT: 6543, PRD: 10234, OTROS: 2345 }, totalVotos: 186045, participacion: 53.4, ganador: "MORENA" },
      "fed2018": { año: 2018, tipo: "federal", votos: { MORENA: 98765, PAN: 45678, PRI: 35432, MC: 9876, PVEM: 6789, PT: 11234, PRD: 14567, OTROS: 4321 }, totalVotos: 226662, participacion: 64.8, ganador: "MORENA" },
    }
  },
  {
    id: 4, cabecera: "Jiquilpan", listaNominal2024: 312456, participacion2024: 54.3,
    resultados: {
      "fed2024": { año: 2024, tipo: "federal", votos: { MORENA: 65432, PAN: 45678, PRI: 22345, MC: 19876, PVEM: 8765, PT: 6543, PRD: 4321, OTROS: 2876 }, totalVotos: 175836, participacion: 54.3, ganador: "MORENA" },
      "fed2021": { año: 2021, tipo: "federal", votos: { MORENA: 52345, PAN: 48765, PRI: 26789, MC: 15432, PVEM: 7654, PT: 5432, PRD: 7890, OTROS: 1987 }, totalVotos: 166294, participacion: 50.8, ganador: "MORENA" },
      "fed2018": { año: 2018, tipo: "federal", votos: { MORENA: 78901, PAN: 52345, PRI: 32456, MC: 12345, PVEM: 5678, PT: 8901, PRD: 11234, OTROS: 3456 }, totalVotos: 205316, participacion: 62.5, ganador: "MORENA" },
    }
  },
  {
    id: 5, cabecera: "Zamora", listaNominal2024: 398765, participacion2024: 56.7,
    resultados: {
      "fed2024": { año: 2024, tipo: "federal", votos: { MORENA: 72345, PAN: 68901, PRI: 28765, MC: 22345, PVEM: 10234, PT: 7654, PRD: 5432, OTROS: 3456 }, totalVotos: 219132, participacion: 56.7, ganador: "MORENA" },
      "fed2021": { año: 2021, tipo: "federal", votos: { MORENA: 58901, PAN: 72345, PRI: 32456, MC: 18765, PVEM: 8901, PT: 5678, PRD: 9876, OTROS: 2345 }, totalVotos: 209267, participacion: 53.9, ganador: "PAN" },
      "fed2018": { año: 2018, tipo: "federal", votos: { MORENA: 85678, PAN: 62345, PRI: 38901, MC: 14567, PVEM: 6789, PT: 9876, PRD: 12345, OTROS: 4567 }, totalVotos: 235068, participacion: 63.7, ganador: "MORENA" },
    }
  },
  {
    id: 6, cabecera: "Ciudad Hidalgo", listaNominal2024: 345678, participacion2024: 59.4,
    resultados: {
      "fed2024": { año: 2024, tipo: "federal", votos: { MORENA: 92345, PAN: 35678, PRI: 24567, MC: 16789, PVEM: 12345, PT: 9876, PRD: 6543, OTROS: 3210 }, totalVotos: 201353, participacion: 59.4, ganador: "MORENA" },
      "fed2021": { año: 2021, tipo: "federal", votos: { MORENA: 74567, PAN: 38901, PRI: 28765, MC: 13456, PVEM: 9876, PT: 7654, PRD: 8901, OTROS: 2345 }, totalVotos: 184465, participacion: 55.2, ganador: "MORENA" },
      "fed2018": { año: 2018, tipo: "federal", votos: { MORENA: 108765, PAN: 42345, PRI: 32456, MC: 10234, PVEM: 7890, PT: 12345, PRD: 14567, OTROS: 4321 }, totalVotos: 232923, participacion: 67.1, ganador: "MORENA" },
    }
  },
  {
    id: 7, cabecera: "Morelia NE", listaNominal2024: 425678, participacion2024: 61.2,
    resultados: {
      "fed2024": { año: 2024, tipo: "federal", votos: { MORENA: 105432, PAN: 52345, PRI: 28765, MC: 32456, PVEM: 14567, PT: 10234, PRD: 7890, OTROS: 4321 }, totalVotos: 256010, participacion: 61.2, ganador: "MORENA" },
      "fed2021": { año: 2021, tipo: "federal", votos: { MORENA: 82345, PAN: 58901, PRI: 32456, MC: 28765, PVEM: 11234, PT: 8901, PRD: 10234, OTROS: 3210 }, totalVotos: 236046, participacion: 57.4, ganador: "MORENA" },
      "fed2018": { año: 2018, tipo: "federal", votos: { MORENA: 125678, PAN: 56789, PRI: 35432, MC: 22345, PVEM: 9876, PT: 14567, PRD: 16789, OTROS: 5432 }, totalVotos: 286908, participacion: 68.9, ganador: "MORENA" },
    }
  },
  {
    id: 8, cabecera: "Morelia SO", listaNominal2024: 412345, participacion2024: 60.5,
    resultados: {
      "fed2024": { año: 2024, tipo: "federal", votos: { MORENA: 98765, PAN: 55432, PRI: 30234, MC: 28765, PVEM: 13456, PT: 9876, PRD: 7654, OTROS: 4321 }, totalVotos: 248503, participacion: 60.5, ganador: "MORENA" },
      "fed2021": { año: 2021, tipo: "federal", votos: { MORENA: 78901, PAN: 58765, PRI: 34567, MC: 24567, PVEM: 10234, PT: 7890, PRD: 9876, OTROS: 2987 }, totalVotos: 227787, participacion: 56.8, ganador: "MORENA" },
      "fed2018": { año: 2018, tipo: "federal", votos: { MORENA: 118765, PAN: 62345, PRI: 38901, MC: 18765, PVEM: 8901, PT: 13456, PRD: 15678, OTROS: 5234 }, totalVotos: 282045, participacion: 68.2, ganador: "MORENA" },
    }
  },
  {
    id: 9, cabecera: "Uruapan", listaNominal2024: 389765, participacion2024: 57.8,
    resultados: {
      "fed2024": { año: 2024, tipo: "federal", votos: { MORENA: 88765, PAN: 48901, PRI: 26789, MC: 20345, PVEM: 11234, PT: 8765, PRD: 6543, OTROS: 3456 }, totalVotos: 214798, participacion: 57.8, ganador: "MORENA" },
      "fed2021": { año: 2021, tipo: "federal", votos: { MORENA: 70234, PAN: 52345, PRI: 30234, MC: 16789, PVEM: 9876, PT: 6789, PRD: 8765, OTROS: 2456 }, totalVotos: 197488, participacion: 54.1, ganador: "MORENA" },
      "fed2018": { año: 2018, tipo: "federal", votos: { MORENA: 102345, PAN: 55678, PRI: 36789, MC: 13456, PVEM: 7890, PT: 11234, PRD: 13456, OTROS: 4567 }, totalVotos: 245415, participacion: 66.4, ganador: "MORENA" },
    }
  },
  {
    id: 10, cabecera: "Pátzcuaro", listaNominal2024: 356789, participacion2024: 56.3,
    resultados: {
      "fed2024": { año: 2024, tipo: "federal", votos: { MORENA: 82345, PAN: 42345, PRI: 24567, MC: 18765, PVEM: 10234, PT: 7890, PRD: 5678, OTROS: 3210 }, totalVotos: 195034, participacion: 56.3, ganador: "MORENA" },
      "fed2021": { año: 2021, tipo: "federal", votos: { MORENA: 65432, PAN: 45678, PRI: 28901, MC: 14567, PVEM: 8765, PT: 6543, PRD: 8234, OTROS: 2345 }, totalVotos: 180465, participacion: 52.7, ganador: "MORENA" },
      "fed2018": { año: 2018, tipo: "federal", votos: { MORENA: 95678, PAN: 48765, PRI: 32456, MC: 11234, PVEM: 6789, PT: 10234, PRD: 12345, OTROS: 4321 }, totalVotos: 221822, participacion: 64.9, ganador: "MORENA" },
    }
  },
  {
    id: 11, cabecera: "Apatzingán", listaNominal2024: 332456, participacion2024: 53.6,
    resultados: {
      "fed2024": { año: 2024, tipo: "federal", votos: { MORENA: 75432, PAN: 32456, PRI: 22345, MC: 15678, PVEM: 9876, PT: 7654, PRD: 5432, OTROS: 2987 }, totalVotos: 171860, participacion: 53.6, ganador: "MORENA" },
      "fed2021": { año: 2021, tipo: "federal", votos: { MORENA: 58765, PAN: 35432, PRI: 26789, MC: 12345, PVEM: 8234, PT: 5678, PRD: 7890, OTROS: 1876 }, totalVotos: 157009, participacion: 49.8, ganador: "MORENA" },
      "fed2018": { año: 2018, tipo: "federal", votos: { MORENA: 85432, PAN: 38901, PRI: 30234, MC: 10234, PVEM: 5678, PT: 9876, PRD: 11234, OTROS: 3876 }, totalVotos: 195465, participacion: 61.7, ganador: "MORENA" },
    }
  },
];

// Summary stats
export function getResumenEstatal(año: string, distritosInput?: DistritoFederal[]) {
  const datos = distritosInput || distritosFederales;
  const totales: Partial<Record<Partido, number>> = {};
  let totalVotos = 0;
  let totalListaNominal = 0;

  datos.forEach(d => {
    const r = d.resultados[año];
    if (r) {
      Object.entries(r.votos).forEach(([partido, votos]) => {
        totales[partido as Partido] = (totales[partido as Partido] || 0) + (votos || 0);
      });
      totalVotos += r.totalVotos;
    }
    totalListaNominal += d.listaNominal2024;
  });

  return { totales, totalVotos, totalListaNominal, participacion: totalListaNominal > 0 ? (totalVotos / totalListaNominal) * 100 : 0 };
}

export function getCompetitividadDistrito(distrito: DistritoFederal, eleccion: string) {
  const r = distrito.resultados[eleccion];
  if (!r) return { margen: 0, nivel: "N/A" as const };
  
  const votosOrdenados = Object.values(r.votos).sort((a, b) => (b || 0) - (a || 0));
  const margen = ((votosOrdenados[0]! - votosOrdenados[1]!) / r.totalVotos) * 100;
  
  const nivel = margen < 5 ? "Muy competido" : margen < 10 ? "Competido" : margen < 20 ? "Moderado" : "Bastión";
  return { margen, nivel };
}

export const ELECCIONES = [
  { key: "fed2024", label: "Federal 2024", tipo: "federal" as const, año: 2024 },
  { key: "fed2021", label: "Federal 2021", tipo: "federal" as const, año: 2021 },
  { key: "fed2018", label: "Federal 2018", tipo: "federal" as const, año: 2018 },
  { key: "loc2024", label: "Local 2024", tipo: "local" as const, año: 2024 },
  { key: "loc2021", label: "Local 2021", tipo: "local" as const, año: 2021 },
  { key: "loc2018", label: "Local 2018", tipo: "local" as const, año: 2018 },
];

export const FUENTES_DATOS = [
  { nombre: "Cómputos Distritales 2024", url: "https://computos2024.ine.mx/", estado: "disponible" },
  { nombre: "Cómputos Distritales 2021", url: "https://computos2021.ine.mx/", estado: "disponible" },
  { nombre: "Cómputos Distritales 2018", url: "https://computos2018.ine.mx/", estado: "disponible" },
  { nombre: "Lista Nominal por Edad y Sexo", url: "https://www.ine.mx/transparencia/datos-abiertos/#/archivo/datos-por-rangos-de-edad-entidad-de-origen-y-sexo-del-padron-electoral-y-lista-nominal-2026", estado: "disponible" },
  { nombre: "Cartografía Seccional SIGE", url: "https://cartografia.ine.mx/sige8/mapas/mapas-digitales", estado: "disponible" },
  { nombre: "Estudios Geoelectorales · Distritación 2017/2023", url: "https://cartografia.ine.mx/sige8/estudiosGeoelectorales/resultados-distritacion", estado: "disponible" },
  { nombre: "Cómputos PJ 2025", url: "https://computospj2025.ine.mx/scjn/nacional/candidatas", estado: "disponible" },
  { nombre: "Lista Nominal DERFE", url: "https://www.ine.mx/transparencia/datos-abiertos/", estado: "disponible" },
  { nombre: "Cartografía Electoral Descargable", url: "https://portal.ine.mx/productos-geografia-electoral-descargables/", estado: "disponible" },
  { nombre: "Resultados Electorales Históricos", url: "https://www.ine.mx/voto-y-elecciones/resultados-electorales/", estado: "disponible" },
  { nombre: "API GeoJSON Cartografía", url: "https://mexicoendatos.com/documentacion/mapas-ine", estado: "disponible" },
  { nombre: "IEM Cómputos Locales", url: "https://iem.org.mx/", estado: "disponible" },
];

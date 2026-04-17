// Comparativa multi-encuestadora — Gubernatura / Senaduría Michoacán
// Reemplazar con datos reales vía useRemoteData(...) cuando estén disponibles.

export interface EncuestaRow {
  rank: number;
  candidato: string;
  partido: string;
  partidoColor: string; // hex
  mitofsky: number | null;
  elFinanciero: number | null;
  massiveCaller: number | null;
}

export interface ComparadorMeta {
  titulo: string;
  subtitulo: string;
  fechaMitofsky: string;
  fechaElFinanciero: string;
  fechaMassiveCaller: string;
}

export const comparadorMeta: ComparadorMeta = {
  titulo: "Mitofsky vs El Financiero vs Massive Caller — Marzo 2026",
  subtitulo:
    "Intención de voto en Michoacán según tres casas encuestadoras. Las divergencias revelan voto oculto y tendencias emergentes.",
  fechaMitofsky: "18-22 mar",
  fechaElFinanciero: "20-25 mar",
  fechaMassiveCaller: "mar II",
};

export const encuestasMichoacan: EncuestaRow[] = [
  {
    rank: 1,
    candidato: "Alfredo Ramírez Bedolla",
    partido: "MORENA",
    partidoColor: "#8B1A1A",
    mitofsky: 38.4,
    elFinanciero: 41.2,
    massiveCaller: 36.9,
  },
  {
    rank: 2,
    candidato: "Carolina Monroy",
    partido: "PRI–PAN–PRD",
    partidoColor: "#005CA9",
    mitofsky: 24.1,
    elFinanciero: 22.6,
    massiveCaller: 26.3,
  },
  {
    rank: 3,
    candidato: "Manuel Antúnez",
    partido: "MC",
    partidoColor: "#FF6A13",
    mitofsky: 14.8,
    elFinanciero: 13.1,
    massiveCaller: 16.4,
  },
  {
    rank: 4,
    candidato: "Adriana Hernández",
    partido: "PVEM",
    partidoColor: "#0E8C3A",
    mitofsky: 6.2,
    elFinanciero: 7.4,
    massiveCaller: 5.1,
  },
  {
    rank: 5,
    candidato: "Cristóbal Arias",
    partido: "PT",
    partidoColor: "#D52B1E",
    mitofsky: 4.1,
    elFinanciero: null,
    massiveCaller: 3.8,
  },
  {
    rank: 6,
    candidato: "Luisa María Calderón",
    partido: "Independiente",
    partidoColor: "#6B7280",
    mitofsky: 2.9,
    elFinanciero: 3.6,
    massiveCaller: null,
  },
  {
    rank: 7,
    candidato: "Sin definir / NS-NC",
    partido: "—",
    partidoColor: "#9CA3AF",
    mitofsky: 9.5,
    elFinanciero: 12.1,
    massiveCaller: 11.5,
  },
];

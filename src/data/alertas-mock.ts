export type PrioridadAlerta = "Urgente" | "Preventivo" | "Informativo";

export interface Alerta {
  id: string;
  prioridad: PrioridadAlerta;
  titulo: string;
  descripcion: string;
  distrito: string;
  fuente: string;
  timestamp: string; // ISO
}

const now = Date.now();
const m = (mins: number) => new Date(now - mins * 60_000).toISOString();

export const alertasMock: Alerta[] = [
  {
    id: "a1",
    prioridad: "Urgente",
    titulo: "Bloqueo carretero en Apatzingán",
    descripcion: "Manifestación de productores limita movilidad en zona electoral D9. Se recomienda activar protocolo de comunicación con líderes locales.",
    distrito: "D9 · Apatzingán",
    fuente: "Reporte de campo · 911 Michoacán",
    timestamp: m(8),
  },
  {
    id: "a2",
    prioridad: "Urgente",
    titulo: "Caída de intención de voto en Morelia",
    descripcion: "Encuesta semanal muestra -3.2% en preferencia electoral entre jóvenes 18-29 en cabecera. Requiere ajuste de mensaje.",
    distrito: "D10 · Morelia",
    fuente: "Tracking semanal interno",
    timestamp: m(45),
  },
  {
    id: "a3",
    prioridad: "Preventivo",
    titulo: "Tendencia negativa en redes sociales",
    descripcion: "Hashtag adverso al candidato local ganando tracción en X. Volumen +180% en últimas 6h. Sugerir respuesta coordinada.",
    distrito: "D7 · Pátzcuaro",
    fuente: "Monitor de redes",
    timestamp: m(95),
  },
  {
    id: "a4",
    prioridad: "Preventivo",
    titulo: "Reunión de oposición en Zamora",
    descripcion: "Coalición opositora coordinando evento masivo el próximo sábado en plaza principal. Coordinar contraevento.",
    distrito: "D5 · Zamora",
    fuente: "Inteligencia territorial",
    timestamp: m(180),
  },
  {
    id: "a5",
    prioridad: "Informativo",
    titulo: "Publicación oficial INE",
    descripcion: "INE publicó actualización de lista nominal 2026. Datos demográficos disponibles para descarga.",
    distrito: "Michoacán · Estatal",
    fuente: "ine.mx · Datos abiertos",
    timestamp: m(360),
  },
  {
    id: "a6",
    prioridad: "Informativo",
    titulo: "Sentimiento positivo +5% semanal",
    descripcion: "Análisis de sentimiento social muestra mejora sostenida en Lázaro Cárdenas tras gira territorial.",
    distrito: "D1 · Lázaro Cárdenas",
    fuente: "Análisis NLP semanal",
    timestamp: m(720),
  },
  {
    id: "a7",
    prioridad: "Preventivo",
    titulo: "Riesgo electoral medio en D6",
    descripcion: "Margen competitivo <4% en Maravatío según último corte. Reforzar estructura territorial.",
    distrito: "D6 · Maravatío",
    fuente: "Modelo predictivo",
    timestamp: m(1440),
  },
];

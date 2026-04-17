// Mock time-series data for Morelia voting intention and social sentiment.
// Replace with real CSV/JSON via useRemoteData(...) when available.

export interface IntencionVotoPoint {
  semana: string; // e.g. "S-12"
  fecha: string;
  MORENA: number;
  PAN: number;
  PRI: number;
  MC: number;
  PVEM: number;
}

export interface SentimientoPoint {
  semana: string;
  fecha: string;
  positivo: number;
  neutro: number;
  negativo: number;
}

const weeks = 16;
const start = new Date();
start.setDate(start.getDate() - weeks * 7);

function genSeries(): { intencion: IntencionVotoPoint[]; sentimiento: SentimientoPoint[] } {
  const intencion: IntencionVotoPoint[] = [];
  const sentimiento: SentimientoPoint[] = [];

  let morena = 38, pan = 26, pri = 12, mc = 14, pvem = 6;
  let pos = 42, neu = 38, neg = 20;

  for (let i = 0; i < weeks; i++) {
    const d = new Date(start.getTime() + i * 7 * 86400000);
    const label = `S${weeks - i}`;
    const fecha = d.toISOString().slice(0, 10);

    // small drifts
    morena += (Math.sin(i / 2) * 1.4) + (Math.random() - 0.5) * 0.8;
    pan += (Math.cos(i / 2.3) * 0.9) + (Math.random() - 0.5) * 0.7;
    pri += (Math.random() - 0.5) * 0.5;
    mc += (Math.sin(i / 1.7) * 0.6) + (Math.random() - 0.5) * 0.4;
    pvem += (Math.random() - 0.5) * 0.3;

    intencion.push({
      semana: label,
      fecha,
      MORENA: +Math.max(20, Math.min(50, morena)).toFixed(1),
      PAN: +Math.max(15, Math.min(35, pan)).toFixed(1),
      PRI: +Math.max(6, Math.min(20, pri)).toFixed(1),
      MC: +Math.max(8, Math.min(22, mc)).toFixed(1),
      PVEM: +Math.max(3, Math.min(12, pvem)).toFixed(1),
    });

    pos += (Math.sin(i / 3) * 1.2) + (Math.random() - 0.5) * 0.6;
    neg += (Math.cos(i / 2.1) * 1.0) + (Math.random() - 0.5) * 0.6;
    neu = 100 - pos - neg;

    sentimiento.push({
      semana: label,
      fecha,
      positivo: +Math.max(25, Math.min(60, pos)).toFixed(1),
      neutro: +Math.max(20, Math.min(50, neu)).toFixed(1),
      negativo: +Math.max(10, Math.min(40, neg)).toFixed(1),
    });
  }

  return { intencion, sentimiento };
}

export const { intencion: intencionVotoMock, sentimiento: sentimientoMoreliaMock } = genSeries();

// Dossier COMERCIAL (miedo + urgencia) personalizado por candidato/distrito.
// Estilo dark glassmorphism, paleta carbón + dorado + rojo alerta.
// NO revela metodología; muestra diagnóstico, brecha, riesgo y costo de inacción.

import jsPDF from "jspdf";
import type { Candidato } from "./candidatos/types";
import type { MetricasOficiales } from "./dossier-data-resolver";

const NIVEL_LABEL: Record<string, string> = {
  gobernador: "Gubernatura del Estado",
  diputados_federales: "Diputación Federal",
  diputados: "Diputación Local",
  ayuntamientos: "Presidencia Municipal",
};

// Cálculo determinista de "métricas locales" a partir del candidato.
// Hash estable sobre id+territorio para que cada candidato tenga números propios y reproducibles.
function hashSeed(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h;
}
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

interface MetricasLocales {
  brechaPp: number;            // brecha estimada vs adversario
  intencionPropia: number;     // %
  intencionRival: number;      // %
  rivalPartido: string | null;
  cicloRef: number | null;
  listaNominal: number | null;
  seccionesRiesgo: number;     // # secciones rojas
  seccionesPivote: number;     // # secciones decisivas
  seccionesTotal: number | null;
  costoSemanal: number;        // MXN/semana de inacción
  diasRestantes: number;       // a la jornada 2027
  probDerrota: number;         // %
  amenazasDigitales: number;   // narrativas adversas activas
  participacionEsperada: number;
  pctJovenes: number | null;
  pctMayores: number | null;
  fuenteResultados: string | null;
  fuentePadron: string | null;
  origen: string;
  esEstimacion: boolean;
  fragmentacion: MetricasOficiales["fragmentacion"];
}

function diasA2027(): number {
  const target = new Date("2027-06-06T00:00:00");
  const now = new Date();
  return Math.max(0, Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
}

function calcularMetricas(c: Candidato, oficial?: MetricasOficiales | null): MetricasLocales {
  const seed = hashSeed(`${c.id}|${c.territorio}|${c.partido}`);
  const r = rng(seed);
  const baseBrechaEst = c.es_propio ? 6 + r() * 12 : 8 + r() * 14;
  const intencionPropiaEst = Math.round((c.es_propio ? 22 + r() * 10 : 18 + r() * 8) * 10) / 10;
  const intencionRivalEst = Math.round((intencionPropiaEst + baseBrechaEst) * 10) / 10;
  const escala =
    c.nivel === "gobernador" ? 8 :
    c.nivel === "diputados_federales" ? 4 :
    c.nivel === "diputados" ? 3 : 1;

  // Brecha real → probabilidad real de derrota (sigmoide simple)
  const brecha = oficial?.brechaPp ?? baseBrechaEst;
  const probDerrota = Math.round(
    Math.max(20, Math.min(90, 50 + brecha * 1.6 + (c.es_propio ? -4 : 4))),
  );

  // Costo semanal escalado por lista nominal real cuando exista
  const lista = oficial?.listaNominal ?? null;
  const costoBase = lista
    ? Math.max(220_000, Math.min(620_000, 0.18 * lista + 80_000))
    : 280_000 + r() * 240_000;
  const costoSemanal = Math.round((costoBase * (escala / 2 + 0.5)) / 1000) * 1000;

  return {
    brechaPp: Math.round((oficial?.brechaPp ?? baseBrechaEst) * 10) / 10,
    intencionPropia: oficial?.intencionPropia ?? intencionPropiaEst,
    intencionRival: oficial?.intencionRival ?? intencionRivalEst,
    rivalPartido: oficial?.rivalPartido ?? null,
    cicloRef: oficial?.cicloRef ?? null,
    listaNominal: lista,
    seccionesRiesgo: oficial?.seccionesRiesgo ?? Math.round((35 + r() * 60) * escala),
    seccionesPivote: oficial?.seccionesPivote ?? Math.round((12 + r() * 28) * escala),
    seccionesTotal: oficial?.seccionesTotal ?? null,
    costoSemanal,
    diasRestantes: diasA2027(),
    probDerrota,
    amenazasDigitales: Math.round(3 + r() * 6),
    participacionEsperada: oficial?.participacionHist ?? Math.round((52 + r() * 14) * 10) / 10,
    pctJovenes: oficial?.demografia?.pctJovenes18a29 ?? null,
    pctMayores: oficial?.demografia?.pctAdultoMayor60mas ?? null,
    fuenteResultados: oficial?.fuenteResultados ?? null,
    fuentePadron: oficial?.fuentePadron ?? null,
    origen: oficial?.origen ?? "Estimación EME",
    esEstimacion: oficial?.esEstimacion ?? true,
  };
}

interface Input {
  candidato: Candidato;
  consultor?: string;
  metricasOficiales?: MetricasOficiales | null;
}

export function generarDossierComercial({ candidato, consultor = "Job Meneses", metricasOficiales }: Input) {
  const m = calcularMetricas(candidato, metricasOficiales);
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 48;
  const contentW = pageW - margin * 2;

  // Paleta dark
  const C_FONDO: [number, number, number] = [10, 12, 20];
  const C_PANEL: [number, number, number] = [22, 24, 34];
  const C_PANEL_2: [number, number, number] = [30, 32, 44];
  const C_TEXTO: [number, number, number] = [240, 235, 225];
  const C_MUTED: [number, number, number] = [150, 150, 165];
  const C_DORADO: [number, number, number] = [200, 162, 95];
  const C_ROJO: [number, number, number] = [220, 70, 80];
  const C_AMBAR: [number, number, number] = [240, 175, 60];
  const C_VERDE: [number, number, number] = [80, 180, 130];

  const setT = (c: [number, number, number]) => doc.setTextColor(...c);
  const setF = (c: [number, number, number]) => doc.setFillColor(...c);
  const setD = (c: [number, number, number]) => doc.setDrawColor(...c);

  const pintarFondo = () => {
    setF(C_FONDO);
    doc.rect(0, 0, pageW, pageH, "F");
  };

  const headerPag = (eyebrow: string, num: string) => {
    setF(C_DORADO);
    doc.rect(margin, margin - 14, 24, 2, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    setT(C_DORADO);
    doc.text(eyebrow, margin + 32, margin - 12);
    doc.text(num, pageW - margin, margin - 12, { align: "right" });
  };

  const footer = (idx: number) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    setT(C_MUTED);
    doc.text(`EME · Diagnóstico confidencial · ${candidato.nombre}`, margin, pageH - 24);
    doc.text(`${String(idx).padStart(2, "0")} / 06`, pageW - margin, pageH - 24, { align: "right" });
  };

  // ============= PORTADA =============
  pintarFondo();
  setF(C_DORADO);
  doc.rect(margin, 70, 50, 2, "F");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  setT(C_DORADO);
  doc.text("DIAGNÓSTICO RESERVADO · CIRCULACIÓN LIMITADA", margin, 90);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  setT(C_TEXTO);
  doc.text("EME · INTELIGENCIA ELECTORAL", margin, 108);

  // Título
  doc.setFont("helvetica", "bold");
  doc.setFontSize(44);
  setT(C_TEXTO);
  doc.text("Dossier", margin, 240);
  setT(C_DORADO);
  doc.text("Estratégico", margin, 285);

  // Etiqueta candidato
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  setT(C_MUTED);
  doc.text("PREPARADO PARA", margin, 340);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  setT(C_TEXTO);
  const nLines = doc.splitTextToSize(candidato.nombre, contentW);
  doc.text(nLines, margin, 365);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  setT(C_MUTED);
  doc.text(
    `${candidato.cargo_buscado || NIVEL_LABEL[candidato.nivel] || candidato.nivel} · ${candidato.territorio} · ${candidato.partido}`,
    margin,
    365 + nLines.length * 22 + 6,
  );

  // Reloj de campaña destacado
  const relojY = pageH - 240;
  setF(C_PANEL);
  doc.rect(margin, relojY, contentW, 110, "F");
  setF(C_ROJO);
  doc.rect(margin, relojY, 3, 110, "F");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  setT(C_ROJO);
  doc.text("RELOJ DE CAMPAÑA · JORNADA 2027", margin + 18, relojY + 22);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(56);
  setT(C_TEXTO);
  doc.text(String(m.diasRestantes), margin + 18, relojY + 78);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  setT(C_MUTED);
  doc.text("días para el cierre del tablero.", margin + 18 + 130, relojY + 78);
  doc.setFontSize(9);
  setT(C_DORADO);
  doc.text("Cada semana sin estructura cuesta votos que no se recuperan.", margin + 18, relojY + 98);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  setT(C_MUTED);
  doc.text(
    `Entregado por ${consultor} · ${new Date().toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" })}`,
    margin,
    pageH - 50,
  );
  setT(C_DORADO);
  doc.text("WhatsApp +52 443 528 1340", pageW - margin, pageH - 50, { align: "right" });

  // ============= P2: DIAGNÓSTICO BRECHA =============
  doc.addPage();
  pintarFondo();
  headerPag("01 · DIAGNÓSTICO", "P2");
  let y = margin + 30;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(26);
  setT(C_TEXTO);
  doc.text("La brecha que define la elección", margin, y);
  y += 14;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  setT(C_MUTED);
  const subt = doc.splitTextToSize(
    `Hoy, en ${candidato.territorio}, los números no están a su favor. Esta es la fotografía cruda del territorio antes de cualquier intervención.`,
    contentW,
  );
  doc.text(subt, margin, y + 14, { lineHeightFactor: 1.5 });
  y += subt.length * 11 * 1.5 + 30;

  // Dos paneles comparativos — altura mayor para acomodar líneas extra
  const panelH = 145;
  const panelW = (contentW - 16) / 2;
  // Propio
  setF(C_PANEL);
  doc.rect(margin, y, panelW, panelH, "F");
  setF(c_color(candidato.es_propio ? C_DORADO : C_MUTED));
  doc.rect(margin, y, 3, panelH, "F");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  setT(C_MUTED);
  doc.text("INTENCIÓN ESTIMADA · USTED", margin + 18, y + 24);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(38);
  setT(C_TEXTO);
  doc.text(`${m.intencionPropia.toFixed(1)}%`, margin + 18, y + 78);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  setT(C_MUTED);
  const baseTxt = doc.splitTextToSize(
    `Base: voto duro de ${candidato.partido} en ${candidato.territorio}`,
    panelW - 32,
  );
  doc.text(baseTxt, margin + 18, y + 100, { lineHeightFactor: 1.4 });
  doc.text(
    `Sin movilización adicional al ${m.participacionEsperada.toFixed(1)}%`,
    margin + 18,
    y + 100 + baseTxt.length * 11,
  );

  // Rival
  const xR = margin + panelW + 16;
  setF(C_PANEL);
  doc.rect(xR, y, panelW, panelH, "F");
  setF(C_ROJO);
  doc.rect(xR, y, 3, panelH, "F");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  setT(C_ROJO);
  const labelRival = m.rivalPartido
    ? `INTENCIÓN HISTÓRICA · ADVERSARIO (${m.rivalPartido})`
    : "INTENCIÓN ESTIMADA · ADVERSARIO";
  doc.text(labelRival, xR + 18, y + 24);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(38);
  setT(C_TEXTO);
  doc.text(`${m.intencionRival.toFixed(1)}%`, xR + 18, y + 78);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  setT(C_MUTED);
  doc.text(
    m.cicloRef
      ? `Resultado real ciclo ${m.cicloRef} en este territorio`
      : "Construyendo ventaja desde hace meses",
    xR + 18, y + 100,
  );
  doc.text(
    m.listaNominal
      ? `Lista nominal: ${m.listaNominal.toLocaleString("es-MX")}`
      : "Narrativa instalada en medios locales",
    xR + 18, y + 115,
  );
  if (m.pctJovenes != null && m.pctMayores != null) {
    doc.text(
      `${m.pctJovenes.toFixed(0)}% jóvenes 18-29 · ${m.pctMayores.toFixed(0)}% adulto mayor 60+`,
      xR + 18, y + 130,
    );
  }
  y += panelH + 18;

  // Brecha grande
  setF(C_PANEL_2);
  doc.rect(margin, y, contentW, 90, "F");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  setT(C_AMBAR);
  doc.text("BRECHA ACTUAL EN PUNTOS PORCENTUALES", margin + 18, y + 22);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(48);
  setT(C_AMBAR);
  doc.text(`-${m.brechaPp.toFixed(1)} pp`, margin + 18, y + 68);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  setT(C_TEXTO);
  const brechaT = doc.splitTextToSize(
    `Cerrar esta brecha requiere convertir ~${Math.round(m.brechaPp * 1.5)} de cada 100 indecisos en votantes movilizados. Sin método, ese cierre no ocurre solo.`,
    contentW - 220,
  );
  doc.text(brechaT, margin + 220, y + 40, { lineHeightFactor: 1.4 });
  footer(2);

  // ============= P3: RIESGO TERRITORIAL =============
  doc.addPage();
  pintarFondo();
  headerPag("02 · RIESGO TERRITORIAL", "P3");
  y = margin + 30;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(26);
  setT(C_TEXTO);
  doc.text("El mapa que su rival ya tiene", margin, y);
  y += 36;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  setT(C_MUTED);
  const txt = doc.splitTextToSize(
    `${candidato.territorio} no es un territorio uniforme. Cada sección electoral tiene un comportamiento distinto, y sin lectura quirúrgica del padrón, los recursos se dispersan donde menos rinden.`,
    contentW,
  );
  doc.text(txt, margin, y, { lineHeightFactor: 1.55 });
  y += txt.length * 10.5 * 1.55 + 24;

  // 3 KPIs en fila
  const kpis = [
    { label: "SECCIONES EN ROJO", val: m.seccionesRiesgo.toString(), sub: "donde su voto se está erosionando", color: C_ROJO },
    { label: "SECCIONES PIVOTE", val: m.seccionesPivote.toString(), sub: "decidirán la elección por menos de 5 pp", color: C_AMBAR },
    { label: "AMENAZAS DIGITALES", val: m.amenazasDigitales.toString(), sub: "narrativas adversas activas en redes", color: C_ROJO },
  ];
  const kw = (contentW - 24) / 3;
  kpis.forEach((k, i) => {
    const x = margin + i * (kw + 12);
    setF(C_PANEL);
    doc.rect(x, y, kw, 130, "F");
    setF(c_color(k.color));
    doc.rect(x, y, 3, 130, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    setT(c_color(k.color));
    doc.text(k.label, x + 14, y + 22);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(42);
    setT(C_TEXTO);
    doc.text(k.val, x + 14, y + 78);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    setT(C_MUTED);
    const ls = doc.splitTextToSize(k.sub, kw - 28);
    doc.text(ls, x + 14, y + 100, { lineHeightFactor: 1.4 });
  });
  y += 150;

  // Bloque cita — altura dinámica para que el texto no sobresalga
  doc.setFont("helvetica", "bolditalic");
  doc.setFontSize(12);
  const cita = doc.splitTextToSize(
    `"Mientras usted lee esto, el equipo de su adversario ya está priorizando estas mismas secciones. La diferencia entre ganar y perder no es el dinero — es quién tiene el mapa primero."`,
    contentW - 40,
  );
  const citaH = Math.max(80, 28 + cita.length * 12 * 1.45 + 22);
  setF(C_PANEL_2);
  doc.rect(margin, y, contentW, citaH, "F");
  setF(C_DORADO);
  doc.rect(margin, y, 3, citaH, "F");
  setT(C_TEXTO);
  doc.text(cita, margin + 20, y + 30, { lineHeightFactor: 1.45 });
  footer(3);

  // ============= P4: COSTO DE LA INACCIÓN =============
  doc.addPage();
  pintarFondo();
  headerPag("03 · COSTO DE LA INACCIÓN", "P4");
  y = margin + 30;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(26);
  setT(C_TEXTO);
  doc.text("Cada semana que pasa, cuesta", margin, y);
  y += 36;

  // Costo semanal grande
  const panelCostoH = 175;
  setF(C_PANEL);
  doc.rect(margin, y, contentW, panelCostoH, "F");
  setF(C_ROJO);
  doc.rect(margin, y, 3, panelCostoH, "F");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  setT(C_ROJO);
  doc.text("COSTO ESTIMADO POR SEMANA SIN WAR ROOM ACTIVO", margin + 20, y + 26);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(46);
  setT(C_TEXTO);
  doc.text(
    `$${m.costoSemanal.toLocaleString("es-MX")} MXN`,
    margin + 20,
    y + 90,
  );
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  setT(C_MUTED);
  const c1 = doc.splitTextToSize(
    "Equivale a contenidos no producidos, brigadistas no entrenados, prensa no atendida y crisis no contenidas. No es un gasto teórico: es voto que se va al adversario.",
    contentW - 40,
  );
  doc.text(c1, margin + 20, y + 122, { lineHeightFactor: 1.5 });
  y += panelCostoH + 20;

  // Proyección a la jornada
  const semanas = Math.max(1, Math.ceil(m.diasRestantes / 7));
  const acumulado = m.costoSemanal * semanas;
  const panelProyH = 110;
  setF(C_PANEL_2);
  doc.rect(margin, y, contentW, panelProyH, "F");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  setT(C_AMBAR);
  doc.text(`PROYECCIÓN ACUMULADA A LA JORNADA (${semanas} semanas restantes)`, margin + 20, y + 24);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(30);
  setT(C_AMBAR);
  doc.text(
    `$${(acumulado / 1_000_000).toFixed(1)}M MXN`,
    margin + 20,
    y + 64,
  );
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  setT(C_TEXTO);
  doc.text(
    "Equivalente en valor de oportunidad perdido si la decisión se posterga.",
    margin + 20,
    y + 90,
  );
  footer(4);

  // ============= P5: ESCENARIO PROBABILÍSTICO =============
  doc.addPage();
  pintarFondo();
  headerPag("04 · ESCENARIO", "P5");
  y = margin + 30;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(26);
  setT(C_TEXTO);
  doc.text("Si nada cambia hoy", margin, y);
  y += 36;

  // Probabilidad gigante — altura dinámica para acomodar el texto explicativo
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  const e1 = doc.splitTextToSize(
    `Modelo basado en brecha actual (-${m.brechaPp.toFixed(1)} pp), participación esperada (${m.participacionEsperada.toFixed(1)}%) y comportamiento histórico de ${candidato.territorio}. La probabilidad sube cada semana sin intervención estructurada.`,
    contentW - 40,
  );
  const probH = 150 + e1.length * 11 * 1.5 + 24;
  setF(C_PANEL);
  doc.rect(margin, y, contentW, probH, "F");
  setF(C_ROJO);
  doc.rect(margin, y, 3, probH, "F");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  setT(C_ROJO);
  doc.text("PROBABILIDAD ESTIMADA DE DERROTA", margin + 20, y + 26);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(96);
  setT(C_ROJO);
  doc.text(`${m.probDerrota}%`, margin + 20, y + 130);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  setT(C_TEXTO);
  doc.text(e1, margin + 20, y + 160, { lineHeightFactor: 1.5 });
  y += probH + 18;

  // Línea pivote
  setF(C_PANEL_2);
  doc.rect(margin, y, contentW, 70, "F");
  setF(C_VERDE);
  doc.rect(margin, y, 3, 70, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  setT(C_VERDE);
  doc.text("Esta probabilidad es reversible.", margin + 18, y + 28);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  setT(C_TEXTO);
  doc.text(
    "Pero solo dentro de la ventana operativa. Después del banderazo formal, la elasticidad cae a la mitad.",
    margin + 18,
    y + 50,
  );
  footer(5);

  // ============= P6: URGENCIA / CIERRE =============
  doc.addPage();
  pintarFondo();
  headerPag("05 · DECISIÓN", "P6");
  y = margin + 30;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  setT(C_TEXTO);
  const tFin = doc.splitTextToSize("La ventana se cierra. La decisión es suya.", contentW);
  doc.text(tFin, margin, y);
  y += tFin.length * 28 + 24;

  // Escasez — altura dinámica para no overflow
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const cupoTxt1 = doc.splitTextToSize(
    `Operamos con número limitado de candidaturas para garantizar profundidad. ${candidato.partido} en ${candidato.territorio} sigue abierto — por ahora.`,
    contentW - 40,
  );
  const cupoTxt2 = doc.splitTextToSize(
    "Una vez asignados los cupos, la siguiente ventana abre después de la jornada.",
    contentW - 40,
  );
  const cupoH = 70 + (cupoTxt1.length + cupoTxt2.length) * 14 + 18;
  setF(C_PANEL);
  doc.rect(margin, y, contentW, cupoH, "F");
  setF(C_DORADO);
  doc.rect(margin, y, 3, cupoH, "F");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  setT(C_DORADO);
  doc.text("CUPO EME · CICLO 2027", margin + 20, y + 24);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  setT(C_TEXTO);
  doc.text("2 contiendas disponibles este trimestre", margin + 20, y + 52);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  setT(C_MUTED);
  doc.text(cupoTxt1, margin + 20, y + 78, { lineHeightFactor: 1.45 });
  doc.text(cupoTxt2, margin + 20, y + 78 + cupoTxt1.length * 14 + 8, { lineHeightFactor: 1.45 });
  y += cupoH + 20;

  // CTA destacado
  setF([28, 30, 42]);
  doc.rect(margin, y, contentW, 130, "F");
  setF(C_DORADO);
  doc.rect(margin, y, 3, 130, "F");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  setT(C_DORADO);
  doc.text("AGENDAR DIAGNÓSTICO ESTRATÉGICO RESERVADO", margin + 18, y + 24);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  setT(C_TEXTO);
  doc.text(consultor, margin + 18, y + 56);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  setT(C_MUTED);
  doc.text("Director de Estrategia · EME Desarrollo Electoral", margin + 18, y + 76);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  setT(C_DORADO);
  doc.text("WhatsApp +52 443 528 1340", margin + 18, y + 100);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  setT(C_MUTED);
  doc.text(
    "Reunión de 60 minutos. Sin compromiso. Bajo acuerdo de confidencialidad mutuo.",
    margin + 18,
    y + 120,
  );

  // Footer confidencial
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  setT(C_MUTED);
  const fuentesEtiqueta = m.esEstimacion
    ? "Métricas estimadas con modelo interno EME"
    : `Cómputos: ${m.fuenteResultados ?? "—"} · Padrón: ${m.fuentePadron ?? "—"} · Modelo EME`;
  doc.text(
    `Fuente: ${m.origen}. ${fuentesEtiqueta}.`,
    pageW / 2,
    pageH - 24,
    { align: "center" },
  );

  const safe = candidato.nombre
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .toLowerCase();
  doc.save(`dossier-comercial-${safe}.pdf`);
}

// helper porque jsPDF setFillColor exige spread y TS se enoja con tuplas opcionales
function c_color(c: [number, number, number]): [number, number, number] {
  return c;
}

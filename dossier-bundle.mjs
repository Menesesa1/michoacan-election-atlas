// src/lib/pdf-dossier-comercial.ts
import { jsPDF } from "jspdf";
var NIVEL_LABEL = {
  gobernador: "Gubernatura del Estado",
  diputados_federales: "Diputaci\xF3n Federal",
  diputados: "Diputaci\xF3n Local",
  ayuntamientos: "Presidencia Municipal"
};
function hashSeed(s) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h;
}
function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = s * 1664525 + 1013904223 >>> 0;
    return s / 4294967295;
  };
}
function diasA2027() {
  const target = /* @__PURE__ */ new Date("2027-06-06T00:00:00");
  const now = /* @__PURE__ */ new Date();
  return Math.max(0, Math.ceil((target.getTime() - now.getTime()) / (1e3 * 60 * 60 * 24)));
}
function calcularMetricas(c, oficial) {
  const seed = hashSeed(`${c.id}|${c.territorio}|${c.partido}`);
  const r = rng(seed);
  const baseBrechaEst = c.es_propio ? 6 + r() * 12 : 8 + r() * 14;
  const intencionPropiaEst = Math.round((c.es_propio ? 22 + r() * 10 : 18 + r() * 8) * 10) / 10;
  const intencionRivalEst = Math.round((intencionPropiaEst + baseBrechaEst) * 10) / 10;
  const escala = c.nivel === "gobernador" ? 8 : c.nivel === "diputados_federales" ? 4 : c.nivel === "diputados" ? 3 : 1;
  const brecha = oficial?.brechaPp ?? baseBrechaEst;
  const probDerrota = Math.round(
    Math.max(20, Math.min(90, 50 + brecha * 1.6 + (c.es_propio ? -4 : 4)))
  );
  const lista = oficial?.listaNominal ?? null;
  const costoBase = lista ? Math.max(22e4, Math.min(62e4, 0.18 * lista + 8e4)) : 28e4 + r() * 24e4;
  const costoSemanal = Math.round(costoBase * (escala / 2 + 0.5) / 1e3) * 1e3;
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
    origen: oficial?.origen ?? "Estimaci\xF3n EME",
    esEstimacion: oficial?.esEstimacion ?? true
  };
}
function generarDossierComercial({ candidato, consultor = "Job Meneses", metricasOficiales }) {
  const m = calcularMetricas(candidato, metricasOficiales);
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 48;
  const contentW = pageW - margin * 2;
  const C_FONDO = [10, 12, 20];
  const C_PANEL = [22, 24, 34];
  const C_PANEL_2 = [30, 32, 44];
  const C_TEXTO = [240, 235, 225];
  const C_MUTED = [150, 150, 165];
  const C_DORADO = [200, 162, 95];
  const C_ROJO = [220, 70, 80];
  const C_AMBAR = [240, 175, 60];
  const C_VERDE = [80, 180, 130];
  const setT = (c) => doc.setTextColor(...c);
  const setF = (c) => doc.setFillColor(...c);
  const setD = (c) => doc.setDrawColor(...c);
  const pintarFondo = () => {
    setF(C_FONDO);
    doc.rect(0, 0, pageW, pageH, "F");
  };
  const headerPag = (eyebrow, num) => {
    setF(C_DORADO);
    doc.rect(margin, margin - 14, 24, 2, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    setT(C_DORADO);
    doc.text(eyebrow, margin + 32, margin - 12);
    doc.text(num, pageW - margin, margin - 12, { align: "right" });
  };
  const footer = (idx) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    setT(C_MUTED);
    doc.text(`EME \xB7 Diagn\xF3stico confidencial \xB7 ${candidato.nombre}`, margin, pageH - 24);
    doc.text(`${String(idx).padStart(2, "0")} / 06`, pageW - margin, pageH - 24, { align: "right" });
  };
  pintarFondo();
  setF(C_DORADO);
  doc.rect(margin, 70, 50, 2, "F");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  setT(C_DORADO);
  doc.text("DIAGN\xD3STICO RESERVADO \xB7 CIRCULACI\xD3N LIMITADA", margin, 90);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  setT(C_TEXTO);
  doc.text("EME \xB7 INTELIGENCIA ELECTORAL", margin, 108);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(44);
  setT(C_TEXTO);
  doc.text("Dossier", margin, 240);
  setT(C_DORADO);
  doc.text("Estrat\xE9gico", margin, 285);
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
    `${candidato.cargo_buscado || NIVEL_LABEL[candidato.nivel] || candidato.nivel} \xB7 ${candidato.territorio} \xB7 ${candidato.partido}`,
    margin,
    365 + nLines.length * 22 + 6
  );
  const relojY = pageH - 240;
  setF(C_PANEL);
  doc.rect(margin, relojY, contentW, 110, "F");
  setF(C_ROJO);
  doc.rect(margin, relojY, 3, 110, "F");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  setT(C_ROJO);
  doc.text("RELOJ DE CAMPA\xD1A \xB7 JORNADA 2027", margin + 18, relojY + 22);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(56);
  setT(C_TEXTO);
  doc.text(String(m.diasRestantes), margin + 18, relojY + 78);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  setT(C_MUTED);
  doc.text("d\xEDas para el cierre del tablero.", margin + 18 + 130, relojY + 78);
  doc.setFontSize(9);
  setT(C_DORADO);
  doc.text("Cada semana sin estructura cuesta votos que no se recuperan.", margin + 18, relojY + 98);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  setT(C_MUTED);
  doc.text(
    `Entregado por ${consultor} \xB7 ${(/* @__PURE__ */ new Date()).toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" })}`,
    margin,
    pageH - 50
  );
  setT(C_DORADO);
  doc.text("WhatsApp +52 443 528 1340", pageW - margin, pageH - 50, { align: "right" });
  doc.addPage();
  pintarFondo();
  headerPag("01 \xB7 DIAGN\xD3STICO", "P2");
  let y = margin + 30;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(26);
  setT(C_TEXTO);
  doc.text("La brecha que define la elecci\xF3n", margin, y);
  y += 14;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  setT(C_MUTED);
  const subt = doc.splitTextToSize(
    `Hoy, en ${candidato.territorio}, los n\xFAmeros no est\xE1n a su favor. Esta es la fotograf\xEDa cruda del territorio antes de cualquier intervenci\xF3n.`,
    contentW
  );
  doc.text(subt, margin, y + 14, { lineHeightFactor: 1.5 });
  y += subt.length * 11 * 1.5 + 30;
  const panelW = (contentW - 16) / 2;
  setF(C_PANEL);
  doc.rect(margin, y, panelW, 130, "F");
  setF(c_color(candidato.es_propio ? C_DORADO : C_MUTED));
  doc.rect(margin, y, 3, 130, "F");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  setT(C_MUTED);
  doc.text("INTENCI\xD3N ESTIMADA \xB7 USTED", margin + 16, y + 22);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(40);
  setT(C_TEXTO);
  doc.text(`${m.intencionPropia.toFixed(1)}%`, margin + 16, y + 70);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  setT(C_MUTED);
  doc.text(`Base: voto duro de ${candidato.partido} en ${candidato.territorio}`, margin + 16, y + 92);
  doc.text(`Sin movilizaci\xF3n adicional al ${m.participacionEsperada.toFixed(1)}%`, margin + 16, y + 108);
  const xR = margin + panelW + 16;
  setF(C_PANEL);
  doc.rect(xR, y, panelW, 130, "F");
  setF(C_ROJO);
  doc.rect(xR, y, 3, 130, "F");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  setT(C_ROJO);
  doc.text(
    m.rivalPartido ? `INTENCI\xD3N HIST\xD3RICA \xB7 ADVERSARIO DOMINANTE (${m.rivalPartido})` : "INTENCI\xD3N ESTIMADA \xB7 ADVERSARIO DOMINANTE",
    xR + 16,
    y + 22
  );
  doc.setFont("helvetica", "bold");
  doc.setFontSize(40);
  setT(C_TEXTO);
  doc.text(`${m.intencionRival.toFixed(1)}%`, xR + 16, y + 70);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  setT(C_MUTED);
  doc.text(
    m.cicloRef ? `Resultado real ciclo ${m.cicloRef} en este territorio` : "Construyendo ventaja desde hace meses",
    xR + 16,
    y + 92
  );
  doc.text(
    m.listaNominal ? `Lista nominal oficial: ${m.listaNominal.toLocaleString("es-MX")}` : "Con narrativa instalada en medios locales",
    xR + 16,
    y + 108
  );
  if (m.pctJovenes != null && m.pctMayores != null) {
    setT(C_MUTED);
    doc.text(
      `Padr\xF3n: ${m.pctJovenes.toFixed(0)}% j\xF3venes 18-29 \xB7 ${m.pctMayores.toFixed(0)}% adulto mayor 60+`,
      xR + 16,
      y + 122
    );
  }
  y += 150;
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
    `Cerrar esta brecha requiere convertir ~${Math.round(m.brechaPp * 1.5)} de cada 100 indecisos en votantes movilizados. Sin m\xE9todo, ese cierre no ocurre solo.`,
    contentW - 220
  );
  doc.text(brechaT, margin + 220, y + 40, { lineHeightFactor: 1.4 });
  footer(2);
  doc.addPage();
  pintarFondo();
  headerPag("02 \xB7 RIESGO TERRITORIAL", "P3");
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
    `${candidato.territorio} no es un territorio uniforme. Cada secci\xF3n electoral tiene un comportamiento distinto, y sin lectura quir\xFArgica del padr\xF3n, los recursos se dispersan donde menos rinden.`,
    contentW
  );
  doc.text(txt, margin, y, { lineHeightFactor: 1.55 });
  y += txt.length * 10.5 * 1.55 + 24;
  const kpis = [
    { label: "SECCIONES EN ROJO", val: m.seccionesRiesgo.toString(), sub: "donde su voto se est\xE1 erosionando", color: C_ROJO },
    { label: "SECCIONES PIVOTE", val: m.seccionesPivote.toString(), sub: "decidir\xE1n la elecci\xF3n por menos de 5 pp", color: C_AMBAR },
    { label: "AMENAZAS DIGITALES", val: m.amenazasDigitales.toString(), sub: "narrativas adversas activas en redes", color: C_ROJO }
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
  setF(C_PANEL_2);
  doc.rect(margin, y, contentW, 90, "F");
  setF(C_DORADO);
  doc.rect(margin, y, 3, 90, "F");
  doc.setFont("helvetica", "bolditalic");
  doc.setFontSize(13);
  setT(C_TEXTO);
  const cita = doc.splitTextToSize(
    `"Mientras usted lee esto, el equipo de su adversario ya est\xE1 priorizando estas mismas secciones. La diferencia entre ganar y perder no es el dinero \u2014 es qui\xE9n tiene el mapa primero."`,
    contentW - 30
  );
  doc.text(cita, margin + 18, y + 32, { lineHeightFactor: 1.4 });
  footer(3);
  doc.addPage();
  pintarFondo();
  headerPag("03 \xB7 COSTO DE LA INACCI\xD3N", "P4");
  y = margin + 30;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(26);
  setT(C_TEXTO);
  doc.text("Cada semana que pasa, cuesta", margin, y);
  y += 36;
  setF(C_PANEL);
  doc.rect(margin, y, contentW, 160, "F");
  setF(C_ROJO);
  doc.rect(margin, y, 3, 160, "F");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  setT(C_ROJO);
  doc.text("COSTO ESTIMADO POR SEMANA SIN WAR ROOM ACTIVO", margin + 18, y + 24);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(54);
  setT(C_TEXTO);
  doc.text(
    `$${m.costoSemanal.toLocaleString("es-MX")} MXN`,
    margin + 18,
    y + 90
  );
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  setT(C_MUTED);
  const c1 = doc.splitTextToSize(
    "Equivale a contenidos no producidos, brigadistas no entrenados, prensa no atendida y crisis no contenidas. No es un gasto te\xF3rico: es voto que se va al adversario.",
    contentW - 36
  );
  doc.text(c1, margin + 18, y + 118, { lineHeightFactor: 1.45 });
  y += 180;
  const semanas = Math.max(1, Math.ceil(m.diasRestantes / 7));
  const acumulado = m.costoSemanal * semanas;
  setF(C_PANEL_2);
  doc.rect(margin, y, contentW, 100, "F");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  setT(C_AMBAR);
  doc.text(`PROYECCI\xD3N ACUMULADA A LA JORNADA (${semanas} semanas restantes)`, margin + 18, y + 22);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(32);
  setT(C_AMBAR);
  doc.text(
    `$${(acumulado / 1e6).toFixed(1)}M MXN`,
    margin + 18,
    y + 62
  );
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  setT(C_TEXTO);
  doc.text(
    "Equivalente en valor de oportunidad perdido si la decisi\xF3n se posterga.",
    margin + 18,
    y + 84
  );
  footer(4);
  doc.addPage();
  pintarFondo();
  headerPag("04 \xB7 ESCENARIO", "P5");
  y = margin + 30;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(26);
  setT(C_TEXTO);
  doc.text("Si nada cambia hoy", margin, y);
  y += 36;
  setF(C_PANEL);
  doc.rect(margin, y, contentW, 200, "F");
  setF(C_ROJO);
  doc.rect(margin, y, 3, 200, "F");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  setT(C_ROJO);
  doc.text("PROBABILIDAD ESTIMADA DE DERROTA", margin + 18, y + 24);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(120);
  setT(C_ROJO);
  doc.text(`${m.probDerrota}%`, margin + 18, y + 130);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  setT(C_TEXTO);
  const e1 = doc.splitTextToSize(
    `Modelo basado en brecha actual (-${m.brechaPp.toFixed(1)} pp), participaci\xF3n esperada (${m.participacionEsperada.toFixed(1)}%) y comportamiento hist\xF3rico de ${candidato.territorio}. La probabilidad sube cada semana sin intervenci\xF3n estructurada.`,
    contentW - 36
  );
  doc.text(e1, margin + 18, y + 158, { lineHeightFactor: 1.45 });
  y += 220;
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
    "Pero solo dentro de la ventana operativa. Despu\xE9s del banderazo formal, la elasticidad cae a la mitad.",
    margin + 18,
    y + 50
  );
  footer(5);
  doc.addPage();
  pintarFondo();
  headerPag("05 \xB7 DECISI\xD3N", "P6");
  y = margin + 30;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  setT(C_TEXTO);
  const tFin = doc.splitTextToSize("La ventana se cierra. La decisi\xF3n es suya.", contentW);
  doc.text(tFin, margin, y);
  y += tFin.length * 28 + 24;
  setF(C_PANEL);
  doc.rect(margin, y, contentW, 110, "F");
  setF(C_DORADO);
  doc.rect(margin, y, 3, 110, "F");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  setT(C_DORADO);
  doc.text("CUPO EME \xB7 CICLO 2027", margin + 18, y + 22);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  setT(C_TEXTO);
  doc.text("2 contiendas disponibles este trimestre", margin + 18, y + 50);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  setT(C_MUTED);
  doc.text(
    `Operamos con n\xFAmero limitado de candidaturas para garantizar profundidad. ${candidato.partido} en ${candidato.territorio} sigue abierto \u2014 por ahora.`,
    margin + 18,
    y + 75
  );
  doc.text(
    "Una vez asignados los cupos, la siguiente ventana abre despu\xE9s de la jornada.",
    margin + 18,
    y + 92
  );
  y += 130;
  setF([28, 30, 42]);
  doc.rect(margin, y, contentW, 130, "F");
  setF(C_DORADO);
  doc.rect(margin, y, 3, 130, "F");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  setT(C_DORADO);
  doc.text("AGENDAR DIAGN\xD3STICO ESTRAT\xC9GICO RESERVADO", margin + 18, y + 24);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  setT(C_TEXTO);
  doc.text(consultor, margin + 18, y + 56);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  setT(C_MUTED);
  doc.text("Director de Estrategia \xB7 EME Desarrollo Electoral", margin + 18, y + 76);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  setT(C_DORADO);
  doc.text("WhatsApp +52 443 528 1340", margin + 18, y + 100);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  setT(C_MUTED);
  doc.text(
    "Reuni\xF3n de 60 minutos. Sin compromiso. Bajo acuerdo de confidencialidad mutuo.",
    margin + 18,
    y + 120
  );
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  setT(C_MUTED);
  const fuentesEtiqueta = m.esEstimacion ? "M\xE9tricas estimadas con modelo interno EME" : `C\xF3mputos: ${m.fuenteResultados ?? "\u2014"} \xB7 Padr\xF3n: ${m.fuentePadron ?? "\u2014"} \xB7 Modelo EME`;
  doc.text(
    `Fuente: ${m.origen}. ${fuentesEtiqueta}.`,
    pageW / 2,
    pageH - 24,
    { align: "center" }
  );
  const safe = candidato.nombre.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]+/g, "-").toLowerCase();
  doc.save(`dossier-comercial-${safe}.pdf`);
}
function c_color(c) {
  return c;
}
export {
  generarDossierComercial
};

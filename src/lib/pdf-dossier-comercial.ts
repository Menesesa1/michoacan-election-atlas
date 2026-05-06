// Dossier COMERCIAL — versión ligera de "carta de presentación".
// Objetivo: demostrar que tenemos el territorio BIEN investigado (datos duros: secciones,
// lista nominal, demografía, presencia digital, histórico) sin meter miedo ni dar estrategia.
// Tono: profesional, sereno, cercano. Cierre = invitación a conversar.

import jsPDF from "jspdf";
import type { Candidato, MetricasRedes, PlataformaRed } from "./candidatos/types";
import { PLATAFORMA_LABEL } from "./candidatos/types";
import type { MetricasOficiales } from "./dossier-data-resolver";

const NIVEL_LABEL: Record<string, string> = {
  gobernador: "Gubernatura del Estado",
  diputados_federales: "Diputación Federal",
  diputados: "Diputación Local",
  ayuntamientos: "Presidencia Municipal",
};

interface Input {
  candidato: Candidato;
  consultor?: string;
  metricasOficiales?: MetricasOficiales | null;
}

const fmtNum = (n: number | null | undefined) =>
  n == null ? "—" : n.toLocaleString("es-MX");

const fmtSecs = (arr: number[] | undefined, max = 18): string => {
  if (!arr || arr.length === 0) return "—";
  if (arr.length <= max) return arr.join(", ");
  return arr.slice(0, max).join(", ") + `, … (+${arr.length - max})`;
};

function plataformasConDatos(m: MetricasRedes | undefined): Array<{
  plataforma: PlataformaRed;
  seguidores?: number;
  engagement?: number;
}> {
  if (!m) return [];
  return Object.entries(m)
    .map(([p, v]) => ({
      plataforma: p as PlataformaRed,
      seguidores: v?.seguidores,
      engagement: v?.engagement_rate,
    }))
    .filter((x) => x.seguidores != null || x.engagement != null);
}

export function generarDossierComercial({ candidato, consultor = "Job Meneses", metricasOficiales }: Input) {
  const oficial = metricasOficiales ?? null;
  const frag = oficial?.fragmentacion ?? null;

  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 48;
  const contentW = pageW - margin * 2;

  // Paleta clara, sobria
  const C_FONDO: [number, number, number] = [252, 250, 246];
  const C_PANEL: [number, number, number] = [245, 241, 233];
  const C_PANEL_2: [number, number, number] = [255, 255, 255];
  const C_TEXTO: [number, number, number] = [28, 30, 38];
  const C_MUTED: [number, number, number] = [110, 110, 120];
  const C_DORADO: [number, number, number] = [165, 130, 60];
  const C_VERDE: [number, number, number] = [60, 130, 90];
  const C_AMBAR: [number, number, number] = [200, 145, 50];
  const C_AZUL: [number, number, number] = [55, 90, 160];

  const setT = (c: [number, number, number]) => doc.setTextColor(...c);
  const setF = (c: [number, number, number]) => doc.setFillColor(...c);
  const setD = (c: [number, number, number]) => doc.setDrawColor(...c);

  const pintarFondo = () => {
    setF(C_FONDO);
    doc.rect(0, 0, pageW, pageH, "F");
  };

  const headerPag = (eyebrow: string) => {
    setF(C_DORADO);
    doc.rect(margin, margin - 14, 24, 2, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    setT(C_DORADO);
    doc.text(eyebrow, margin + 32, margin - 12);
    doc.text("EME · INTELIGENCIA ELECTORAL", pageW - margin, margin - 12, { align: "right" });
  };

  const footer = (idx: number, total: number) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    setT(C_MUTED);
    doc.text(`Reporte de territorio · ${candidato.nombre}`, margin, pageH - 24);
    doc.text(`${String(idx).padStart(2, "0")} / 0${total}`, pageW - margin, pageH - 24, { align: "right" });
  };

  // ============ PORTADA ============
  pintarFondo();
  setF(C_DORADO);
  doc.rect(margin, 70, 50, 2, "F");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  setT(C_DORADO);
  doc.text("REPORTE DE TERRITORIO · USO RESERVADO", margin, 90);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  setT(C_TEXTO);
  doc.text("EME · INTELIGENCIA ELECTORAL", margin, 108);

  // Título
  doc.setFont("helvetica", "bold");
  doc.setFontSize(40);
  setT(C_TEXTO);
  doc.text("Lo que ya", margin, 220);
  setT(C_DORADO);
  doc.text("sabemos de su", margin, 262);
  setT(C_TEXTO);
  doc.text("territorio.", margin, 304);

  // Subtítulo
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  setT(C_MUTED);
  const sub = doc.splitTextToSize(
    "Una fotografía con datos oficiales del INE y del IEM, integrados con la información pública sobre su candidatura. Sin estrategia. Sin presión. Solo el punto de partida.",
    contentW - 60,
  );
  doc.text(sub, margin, 340, { lineHeightFactor: 1.5 });

  // Tarjeta destinatario
  const destY = 410;
  setF(C_PANEL);
  doc.rect(margin, destY, contentW, 110, "F");
  setF(C_DORADO);
  doc.rect(margin, destY, 3, 110, "F");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  setT(C_MUTED);
  doc.text("PREPARADO PARA", margin + 18, destY + 24);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  setT(C_TEXTO);
  const nLines = doc.splitTextToSize(candidato.nombre, contentW - 36);
  doc.text(nLines, margin + 18, destY + 52);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  setT(C_MUTED);
  doc.text(
    `${candidato.cargo_buscado || NIVEL_LABEL[candidato.nivel] || candidato.nivel} · ${candidato.territorio} · ${candidato.partido}`,
    margin + 18,
    destY + 52 + nLines.length * 20 + 8,
  );

  // Pie portada
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  setT(C_MUTED);
  doc.text(
    `${consultor} · ${new Date().toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" })}`,
    margin,
    pageH - 60,
  );
  setT(C_DORADO);
  doc.text("WhatsApp +52 443 528 1340", pageW - margin, pageH - 60, { align: "right" });
  doc.setFontSize(7.5);
  setT(C_MUTED);
  doc.text(
    "Datos: INE-DERFE 2026 · IEM cómputos oficiales · Catálogo INE de secciones · Información pública del candidato.",
    margin,
    pageH - 40,
  );

  // ============ P2 · TERRITORIO ============
  doc.addPage();
  pintarFondo();
  headerPag("01 · TERRITORIO");
  let y = margin + 30;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  setT(C_TEXTO);
  doc.text("Su territorio en datos", margin, y);
  y += 14;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  setT(C_MUTED);
  const intro = doc.splitTextToSize(
    `Esto es lo que el INE y el IEM registran hoy para ${candidato.territorio}. Son los mismos números con los que cualquier equipo serio empieza a trabajar.`,
    contentW,
  );
  doc.text(intro, margin, y + 14, { lineHeightFactor: 1.5 });
  y += intro.length * 10 * 1.5 + 24;

  // KPIs simples: Lista nominal · Total secciones · Participación histórica
  const kpis = [
    { label: "LISTA NOMINAL", val: fmtNum(oficial?.listaNominal), sub: "Padrón INE-DERFE 2026", color: C_AZUL },
    { label: "SECCIONES", val: fmtNum(oficial?.seccionesTotal ?? frag?.total ?? null), sub: "Catálogo oficial INE", color: C_DORADO },
    { label: "PARTICIPACIÓN HIST.", val: oficial?.participacionHist != null ? `${oficial.participacionHist.toFixed(1)}%` : "—", sub: "Promedio ciclos previos", color: C_VERDE },
  ];
  const kw = (contentW - 24) / 3;
  kpis.forEach((k, i) => {
    const x = margin + i * (kw + 12);
    setF(C_PANEL_2);
    doc.rect(x, y, kw, 110, "F");
    setF(k.color);
    doc.rect(x, y, 3, 110, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    setT(k.color);
    doc.text(k.label, x + 14, y + 22);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(26);
    setT(C_TEXTO);
    doc.text(k.val, x + 14, y + 62);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    setT(C_MUTED);
    doc.text(k.sub, x + 14, y + 88);
  });
  y += 130;

  // Composición territorial (urbano/mixto/rural) — sin alarmismo
  if (frag) {
    setF(C_PANEL_2);
    const fragH = 130;
    doc.rect(margin, y, contentW, fragH, "F");
    setF(C_DORADO);
    doc.rect(margin, y, 3, fragH, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    setT(C_DORADO);
    doc.text(`COMPOSICIÓN TERRITORIAL · PERFIL ${frag.perfil.toUpperCase()}`, margin + 18, y + 22);

    const subW = (contentW - 40 - 24) / 3;
    const subY = y + 38;
    const items: Array<{ label: string; n: number; pct: number; color: [number, number, number] }> = [
      { label: "URBANAS", n: frag.urbanas, pct: frag.pctUrbano, color: C_AZUL },
      { label: "MIXTAS", n: frag.mixtas, pct: frag.pctMixto, color: C_AMBAR },
      { label: "RURALES", n: frag.rurales, pct: frag.pctRural, color: C_VERDE },
    ];
    items.forEach((it, i) => {
      const sx = margin + 18 + i * (subW + 12);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      setT(C_MUTED);
      doc.text(it.label, sx, subY);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      setT(it.color);
      doc.text(`${it.n}`, sx, subY + 22);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      setT(C_MUTED);
      doc.text(`${it.pct.toFixed(1)}% del territorio`, sx, subY + 38);
      setF([225, 222, 215]);
      doc.rect(sx, subY + 46, subW, 4, "F");
      setF(it.color);
      doc.rect(sx, subY + 46, (subW * it.pct) / 100, 4, "F");
    });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    setT(C_TEXTO);
    doc.text(
      `Fuente: catálogo INE (clasificación oficial de secciones por tipo de área).`,
      margin + 18,
      y + fragH - 14,
    );
    y += fragH + 16;

    // Lista explícita de secciones — DEMUESTRA precisión
    const listaH = 150;
    setF(C_PANEL);
    doc.rect(margin, y, contentW, listaH, "F");
    setF(C_DORADO);
    doc.rect(margin, y, 3, listaH, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    setT(C_DORADO);
    doc.text(`SECCIONES IDENTIFICADAS · ${frag.alcance.toUpperCase()}`, margin + 18, y + 22);

    let ly = y + 40;
    const renderLinea = (label: string, count: number, secs: number[] | undefined, color: [number, number, number]) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      setT(color);
      doc.text(`${label} (${count})`, margin + 18, ly);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      setT(C_TEXTO);
      const txt = doc.splitTextToSize(fmtSecs(secs, 22), contentW - 130);
      doc.text(txt, margin + 110, ly, { lineHeightFactor: 1.4 });
      ly += Math.max(14, txt.length * 11);
    };
    renderLinea("Urbanas", frag.urbanas, frag.seccionesUrbanas, C_AZUL);
    renderLinea("Mixtas", frag.mixtas, frag.seccionesMixtas, C_AMBAR);
    renderLinea("Rurales", frag.rurales, frag.seccionesRurales, C_VERDE);
    y += listaH + 16;
  }

  // Demografía breve
  if (oficial?.demografia && (oficial.demografia.pctJovenes18a29 != null || oficial.demografia.pctAdultoMayor60mas != null)) {
    setF(C_PANEL_2);
    doc.rect(margin, y, contentW, 70, "F");
    setF(C_VERDE);
    doc.rect(margin, y, 3, 70, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    setT(C_VERDE);
    doc.text("PERFIL DEMOGRÁFICO DEL PADRÓN", margin + 18, y + 22);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    setT(C_TEXTO);
    const partes: string[] = [];
    if (oficial.demografia.pctJovenes18a29 != null) partes.push(`${oficial.demografia.pctJovenes18a29.toFixed(0)}% jóvenes 18-29`);
    if (oficial.demografia.pctAdultoMayor60mas != null) partes.push(`${oficial.demografia.pctAdultoMayor60mas.toFixed(0)}% adulto mayor 60+`);
    if (oficial.demografia.hombres != null && oficial.demografia.mujeres != null) {
      const total = oficial.demografia.hombres + oficial.demografia.mujeres;
      if (total > 0) {
        const pctM = (oficial.demografia.mujeres / total) * 100;
        partes.push(`${pctM.toFixed(0)}% mujeres`);
      }
    }
    doc.text(partes.join("  ·  ") || "—", margin + 18, y + 48);
  }

  footer(2, 4);

  // ============ P3 · LO QUE ENCONTRAMOS DE USTED ============
  doc.addPage();
  pintarFondo();
  headerPag("02 · SU CANDIDATURA");
  y = margin + 30;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  setT(C_TEXTO);
  doc.text("Lo que vemos públicamente de usted", margin, y);
  y += 14;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  setT(C_MUTED);
  const introP = doc.splitTextToSize(
    "Resumen de su huella pública: redes, trayectoria registrada y cómo se ve desde fuera. Solo lo que cualquiera puede consultar.",
    contentW,
  );
  doc.text(introP, margin, y + 14, { lineHeightFactor: 1.5 });
  y += introP.length * 10 * 1.5 + 24;

  // Bio breve si existe
  if (candidato.bio_breve) {
    setF(C_PANEL_2);
    const bioLines = doc.splitTextToSize(candidato.bio_breve, contentW - 36);
    const bioH = Math.max(60, 30 + bioLines.length * 12 * 1.4 + 14);
    doc.rect(margin, y, contentW, bioH, "F");
    setF(C_DORADO);
    doc.rect(margin, y, 3, bioH, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    setT(C_DORADO);
    doc.text("PERFIL REGISTRADO", margin + 18, y + 22);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    setT(C_TEXTO);
    doc.text(bioLines, margin + 18, y + 40, { lineHeightFactor: 1.4 });
    y += bioH + 16;
  }

  // Presencia en redes
  const redes = plataformasConDatos(candidato.metricas_redes);
  const redesDeclaradas = Object.entries(candidato.redes || {}).filter(([_, v]) => !!v).map(([k]) => k);
  if (redes.length > 0 || redesDeclaradas.length > 0) {
    const redesH = redes.length > 0 ? 40 + redes.length * 22 + 30 : 80;
    setF(C_PANEL);
    doc.rect(margin, y, contentW, redesH, "F");
    setF(C_AZUL);
    doc.rect(margin, y, 3, redesH, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    setT(C_AZUL);
    doc.text("PRESENCIA DIGITAL DETECTADA", margin + 18, y + 22);

    if (redes.length > 0) {
      let ry = y + 40;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      setT(C_MUTED);
      doc.text("Plataforma", margin + 18, ry);
      doc.text("Seguidores", margin + 220, ry);
      doc.text("Engagement", margin + 350, ry);
      ry += 14;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      setT(C_TEXTO);
      redes.forEach((r) => {
        doc.text(PLATAFORMA_LABEL[r.plataforma] ?? r.plataforma, margin + 18, ry);
        doc.text(r.seguidores != null ? r.seguidores.toLocaleString("es-MX") : "—", margin + 220, ry);
        doc.text(r.engagement != null ? `${r.engagement.toFixed(2)}%` : "—", margin + 350, ry);
        ry += 18;
      });
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      setT(C_MUTED);
      doc.text(
        `Plataformas declaradas en sitios públicos: ${redesDeclaradas.join(", ") || "—"}`,
        margin + 18,
        y + redesH - 14,
      );
    } else {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      setT(C_TEXTO);
      doc.text(
        `Detectamos perfiles públicos en: ${redesDeclaradas.join(", ")}.`,
        margin + 18,
        y + 48,
      );
    }
    y += redesH + 16;
  }

  // Trayectoria breve (top 4 hitos)
  if (candidato.trayectoria && candidato.trayectoria.length > 0) {
    const hitos = [...candidato.trayectoria]
      .sort((a, b) => (b.anio || 0) - (a.anio || 0))
      .slice(0, 4);
    const trH = 40 + hitos.length * 22 + 12;
    setF(C_PANEL_2);
    doc.rect(margin, y, contentW, trH, "F");
    setF(C_VERDE);
    doc.rect(margin, y, 3, trH, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    setT(C_VERDE);
    doc.text("TRAYECTORIA REGISTRADA", margin + 18, y + 22);
    let ty = y + 42;
    hitos.forEach((h) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      setT(C_TEXTO);
      doc.text(String(h.anio ?? "—"), margin + 18, ty);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      const linea = `${h.cargo}${h.partido ? ` · ${h.partido}` : ""}`;
      const t = doc.splitTextToSize(linea, contentW - 80);
      doc.text(t, margin + 70, ty);
      ty += Math.max(18, t.length * 11);
    });
    y += trH + 16;
  }

  footer(3, 4);

  // ============ P4 · CIERRE INVITACIÓN ============
  doc.addPage();
  pintarFondo();
  headerPag("03 · SIGUIENTE PASO");
  y = margin + 30;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  setT(C_TEXTO);
  doc.text("Esto es solo el inicio.", margin, y);
  y += 36;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  setT(C_TEXTO);
  const cierreLines = doc.splitTextToSize(
    "Lo que acaba de ver son los datos públicos integrados — territorio, padrón, secciones, su huella digital. Es la base con la que arrancamos cualquier conversación seria. Si decide platicar, le mostramos lo que esos números significan para su elección y qué se puede hacer con ellos.",
    contentW - 40,
  );
  doc.text(cierreLines, margin, y, { lineHeightFactor: 1.6 });
  y += cierreLines.length * 11 * 1.6 + 30;

  // Tarjeta consultor
  setF(C_PANEL);
  doc.rect(margin, y, contentW, 130, "F");
  setF(C_DORADO);
  doc.rect(margin, y, 3, 130, "F");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  setT(C_DORADO);
  doc.text("CONVERSEMOS", margin + 18, y + 24);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  setT(C_TEXTO);
  doc.text(consultor, margin + 18, y + 56);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
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
    "Una llamada de 30 minutos. Sin compromiso. Bajo confidencialidad.",
    margin + 18,
    y + 120,
  );

  // Pie con fuentes
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  setT(C_MUTED);
  const fuentesEtiqueta = oficial?.esEstimacion === false
    ? `Cómputos: ${oficial?.fuenteResultados ?? "—"} · Padrón: ${oficial?.fuentePadron ?? "—"}`
    : "Datos integrados con fuentes públicas oficiales";
  doc.text(
    `Fuentes: INE-DERFE 2026 · Catálogo INE de secciones · IEM Michoacán. ${fuentesEtiqueta}.`,
    pageW / 2,
    pageH - 24,
    { align: "center" },
  );

  const safe = candidato.nombre
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .toLowerCase();
  doc.save(`reporte-territorio-${safe}.pdf`);
}

// Genera un Briefing Ejecutivo PDF combinando KPIs, alertas urgentes,
// discurso ciudadano (último análisis) y top menciones recientes.
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { supabase } from "@/integrations/supabase/client";

interface AlertaRow {
  prioridad: string;
  titulo: string;
  descripcion: string;
  distrito: string;
  fuente: string;
  url_fuente: string | null;
}
interface MencionRow {
  titulo: string;
  fragmento: string | null;
  fuente: string | null;
  sentimiento: number;
  entidad_nombre: string;
  entidad_tipo: string;
  tema: string | null;
}
interface ResumenRow {
  entidad_nombre: string;
  entidad_tipo: string;
  total_menciones: number;
  sentimiento_promedio: number | null;
  pct_positivo: number | null;
  pct_negativo: number | null;
  top_temas: { value: string; count: number }[] | null;
}

const HEX = {
  ink: "#0F172A",
  sub: "#475569",
  rule: "#E2E8F0",
  primary: "#1D4ED8",
  ok: "#059669",
  warn: "#D97706",
  bad: "#DC2626",
};

function fmtDate(iso?: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" });
}

function ensureRoom(doc: jsPDF, y: number, needed: number, marginBottom = 60): number {
  const pageH = doc.internal.pageSize.getHeight();
  if (y + needed > pageH - marginBottom) {
    doc.addPage();
    return 60;
  }
  return y;
}

function drawHeading(doc: jsPDF, text: string, y: number): number {
  y = ensureRoom(doc, y, 30);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(HEX.ink);
  doc.text(text, 40, y);
  doc.setDrawColor(HEX.primary);
  doc.setLineWidth(1.2);
  doc.line(40, y + 4, 555, y + 4);
  return y + 22;
}

function drawText(doc: jsPDF, text: string, y: number, opts?: { color?: string; size?: number; bold?: boolean }): number {
  doc.setFont("helvetica", opts?.bold ? "bold" : "normal");
  doc.setFontSize(opts?.size ?? 10);
  doc.setTextColor(opts?.color ?? HEX.ink);
  const lines = doc.splitTextToSize(text, 515);
  y = ensureRoom(doc, y, lines.length * 12 + 6);
  doc.text(lines, 40, y);
  return y + lines.length * 12 + 4;
}

export async function generarBriefingPDF(): Promise<Blob> {
  // ============= Carga de datos =============
  const [crisisRunRes, socialRunRes] = await Promise.all([
    supabase.from("alertas_crisis_runs").select("*").is("error", null).gt("total_alertas", 0).order("ejecutada_en", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("social_runs").select("*").is("error", null).gt("total_menciones", 0).order("ejecutada_en", { ascending: false }).limit(1).maybeSingle(),
  ]);
  const crisisRun = crisisRunRes.data;
  const socialRun = socialRunRes.data;

  const alertasP = crisisRun?.batch_id
    ? supabase.from("alertas_crisis").select("prioridad,titulo,descripcion,distrito,fuente,url_fuente").eq("batch_id", crisisRun.batch_id).order("prioridad", { ascending: true }).limit(15)
    : Promise.resolve({ data: [] as AlertaRow[] });
  const resumenesP = socialRun?.batch_id
    ? supabase.from("social_resumen").select("entidad_nombre,entidad_tipo,total_menciones,sentimiento_promedio,pct_positivo,pct_negativo,top_temas").eq("batch_id", socialRun.batch_id)
    : Promise.resolve({ data: [] as ResumenRow[] });
  const mencionesP = socialRun?.batch_id
    ? supabase.from("social_menciones").select("titulo,fragmento,fuente,sentimiento,entidad_nombre,entidad_tipo,tema").eq("batch_id", socialRun.batch_id).order("detectada_en", { ascending: false }).limit(20)
    : Promise.resolve({ data: [] as MencionRow[] });

  const [alertasRes, resumenesRes, mencionesRes] = await Promise.all([alertasP, resumenesP, mencionesP]);
  const alertas = (alertasRes.data ?? []) as AlertaRow[];
  const resumenes = (resumenesRes.data ?? []) as ResumenRow[];
  const menciones = (mencionesRes.data ?? []) as MencionRow[];

  // Discurso ciudadano: intentamos invocar la función para obtener el análisis fresco
  let discurso: any = null;
  try {
    const { data } = await supabase.functions.invoke("analizar-discurso-ciudadano", { body: {} });
    if (data?.success) discurso = data;
  } catch (_e) {
    discurso = null;
  }

  // ============= Render PDF =============
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  let y = 40;

  // Cabecera
  doc.setFillColor(HEX.primary);
  doc.rect(0, 0, 595, 8, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(HEX.ink);
  doc.text("Briefing Ejecutivo · Michoacán 2027", 40, 50);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(HEX.sub);
  doc.text(`Generado: ${fmtDate(new Date().toISOString())}`, 40, 66);
  doc.text(
    `Crisis: ${crisisRun ? fmtDate(crisisRun.ejecutada_en) : "sin datos"}   ·   Listening: ${socialRun ? fmtDate(socialRun.ejecutada_en) : "sin datos"}`,
    40,
    80,
  );
  y = 110;

  // ============= 1. KPIs =============
  y = drawHeading(doc, "1 · Indicadores clave", y);
  const urg = alertas.filter((a) => a.prioridad === "Urgente").length;
  const prev = alertas.filter((a) => a.prioridad === "Preventivo").length;
  const totalMenciones = resumenes.reduce((s, r) => s + (r.total_menciones || 0), 0);
  const estatal = resumenes.find((r) => r.entidad_tipo === "estatal");
  const propios = resumenes.filter((r) => r.entidad_tipo === "candidato_propio");
  const rivales = resumenes.filter((r) => r.entidad_tipo === "rival");

  autoTable(doc, {
    startY: y,
    theme: "grid",
    head: [["Indicador", "Valor"]],
    body: [
      ["Alertas urgentes", String(urg)],
      ["Alertas preventivas", String(prev)],
      ["Menciones totales (último batch)", String(totalMenciones)],
      ["Sentimiento promedio Michoacán", estatal?.sentimiento_promedio?.toFixed(2) ?? "—"],
      ["Candidatos propios monitoreados", String(propios.length)],
      ["Rivales monitoreados", String(rivales.length)],
    ],
    styles: { fontSize: 9, cellPadding: 6 },
    headStyles: { fillColor: [29, 78, 216], textColor: 255 },
    columnStyles: { 1: { halign: "right", fontStyle: "bold" } },
    margin: { left: 40, right: 40 },
  });
  // @ts-expect-error lastAutoTable proporcionada por autoTable
  y = (doc.lastAutoTable?.finalY ?? y) + 18;

  // ============= 2. Alertas urgentes =============
  y = drawHeading(doc, "2 · Alertas urgentes y preventivas", y);
  const alertasTop = alertas.filter((a) => a.prioridad === "Urgente" || a.prioridad === "Preventivo").slice(0, 8);
  if (alertasTop.length === 0) {
    y = drawText(doc, "Sin alertas activas en el último monitoreo.", y, { color: HEX.sub });
  } else {
    autoTable(doc, {
      startY: y,
      theme: "striped",
      head: [["Prioridad", "Título", "Ámbito", "Fuente"]],
      body: alertasTop.map((a) => [a.prioridad, a.titulo, a.distrito ?? "—", a.fuente ?? "—"]),
      styles: { fontSize: 8, cellPadding: 5, valign: "top" },
      headStyles: { fillColor: [220, 38, 38], textColor: 255 },
      columnStyles: { 0: { cellWidth: 60 }, 1: { cellWidth: 270 }, 2: { cellWidth: 90 }, 3: { cellWidth: 95 } },
      margin: { left: 40, right: 40 },
    });
    // @ts-expect-error lastAutoTable
    y = (doc.lastAutoTable?.finalY ?? y) + 18;
  }

  // ============= 3. Propios vs Rivales =============
  y = drawHeading(doc, "3 · Propios vs Rivales", y);
  if (propios.length === 0 && rivales.length === 0) {
    y = drawText(doc, "Sin candidatos monitoreados todavía. Agrégalos en /candidatos.", y, { color: HEX.sub });
  } else {
    autoTable(doc, {
      startY: y,
      theme: "grid",
      head: [["Tipo", "Candidato", "Menciones", "Sent.", "% Pos", "% Neg"]],
      body: [...propios, ...rivales].map((r) => [
        r.entidad_tipo === "candidato_propio" ? "Propio" : "Rival",
        r.entidad_nombre,
        String(r.total_menciones),
        r.sentimiento_promedio?.toFixed(2) ?? "—",
        (r.pct_positivo ?? 0).toFixed(0),
        (r.pct_negativo ?? 0).toFixed(0),
      ]),
      styles: { fontSize: 9, cellPadding: 5 },
      headStyles: { fillColor: [29, 78, 216], textColor: 255 },
      columnStyles: { 2: { halign: "right" }, 3: { halign: "right" }, 4: { halign: "right" }, 5: { halign: "right" } },
      margin: { left: 40, right: 40 },
    });
    // @ts-expect-error lastAutoTable
    y = (doc.lastAutoTable?.finalY ?? y) + 18;
  }

  // ============= 4. Discurso ciudadano =============
  y = drawHeading(doc, "4 · Discurso ciudadano", y);
  if (!discurso) {
    y = drawText(doc, "No hay análisis de discurso ciudadano disponible. Genera uno desde Inteligencia → Sentimiento Estatal.", y, { color: HEX.sub });
  } else {
    if (discurso.resumen_ejecutivo) {
      y = drawText(doc, discurso.resumen_ejecutivo, y, { size: 10 });
      y += 4;
    }
    if (discurso.temas_relevantes?.length) {
      y = drawText(doc, "Temas dominantes:", y, { bold: true, size: 10 });
      autoTable(doc, {
        startY: y,
        theme: "plain",
        head: [["Tema", "Intensidad", "Descripción"]],
        body: discurso.temas_relevantes.slice(0, 6).map((t: any) => [t.tema, String(Math.round(t.intensidad ?? 0)), t.descripcion ?? "—"]),
        styles: { fontSize: 8, cellPadding: 4, valign: "top" },
        headStyles: { fillColor: [241, 245, 249], textColor: HEX.ink, fontStyle: "bold" },
        columnStyles: { 0: { cellWidth: 120, fontStyle: "bold" }, 1: { cellWidth: 60, halign: "right" }, 2: { cellWidth: 335 } },
        margin: { left: 40, right: 40 },
      });
      // @ts-expect-error lastAutoTable
      y = (doc.lastAutoTable?.finalY ?? y) + 12;
    }
    if (discurso.emociones?.length) {
      y = drawText(doc, "Emociones que mueven al votante:", y, { bold: true, size: 10 });
      const emo = discurso.emociones.slice(0, 6).map((e: any) => `• ${e.emocion} (${Math.round(e.intensidad ?? 0)}/100): ${e.disparador ?? ""}`).join("\n");
      y = drawText(doc, emo, y, { size: 9, color: HEX.sub });
    }
    if (discurso.insumos_discurso?.que_decir?.length) {
      y = drawText(doc, "Qué decir:", y, { bold: true, size: 10, color: HEX.ok });
      y = drawText(doc, discurso.insumos_discurso.que_decir.map((x: string) => `✓ ${x}`).join("\n"), y, { size: 9 });
    }
    if (discurso.insumos_discurso?.que_evitar?.length) {
      y = drawText(doc, "Qué evitar:", y, { bold: true, size: 10, color: HEX.bad });
      y = drawText(doc, discurso.insumos_discurso.que_evitar.map((x: string) => `✗ ${x}`).join("\n"), y, { size: 9 });
    }
  }

  // ============= 5. Top menciones =============
  y = drawHeading(doc, "5 · Menciones más relevantes", y);
  if (menciones.length === 0) {
    y = drawText(doc, "Sin menciones en el último batch.", y, { color: HEX.sub });
  } else {
    const top = menciones.slice(0, 10);
    autoTable(doc, {
      startY: y,
      theme: "striped",
      head: [["Sent.", "Título", "Entidad", "Fuente"]],
      body: top.map((m) => [m.sentimiento.toFixed(2), m.titulo, m.entidad_nombre, m.fuente ?? "—"]),
      styles: { fontSize: 8, cellPadding: 4, valign: "top" },
      headStyles: { fillColor: [29, 78, 216], textColor: 255 },
      columnStyles: { 0: { cellWidth: 40, halign: "right" }, 1: { cellWidth: 290 }, 2: { cellWidth: 100 }, 3: { cellWidth: 85 } },
      margin: { left: 40, right: 40 },
    });
  }

  // Pie de página en todas las páginas
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(HEX.sub);
    doc.text(`Briefing 360 · Michoacán · pág ${i} de ${pages}`, 40, 822);
    doc.text("Generado por Analista Electoral · Lovable Cloud", 555, 822, { align: "right" });
  }

  return doc.output("blob");
}

export async function descargarBriefingPDF() {
  const blob = await generarBriefingPDF();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `briefing-michoacan-${new Date().toISOString().slice(0, 10)}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

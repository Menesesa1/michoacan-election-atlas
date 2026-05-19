// Utilidades compartidas para exportación PDF/XLSX
import jsPDF from "jspdf";
import autoTable, { type UserOptions } from "jspdf-autotable";
import * as XLSX from "xlsx";
import { autoSubirSiActivo } from "@/lib/gdrive";

export const BRAND = {
  primary: "#1D4ED8",
  ink: "#0F172A",
  sub: "#475569",
  rule: "#E2E8F0",
  ok: "#059669",
  warn: "#D97706",
  bad: "#DC2626",
  bg: "#F8FAFC",
};

export const fmtFecha = (d?: Date | string | null) => {
  const date = d ? new Date(d) : new Date();
  return date.toLocaleString("es-MX", {
    dateStyle: "long",
    timeStyle: "short",
  });
};

export const fmtNum = (n: number | null | undefined, dec = 0) => {
  if (n === null || n === undefined || isNaN(n)) return "—";
  return n.toLocaleString("es-MX", {
    minimumFractionDigits: dec,
    maximumFractionDigits: dec,
  });
};

export const fmtPct = (n: number | null | undefined, dec = 1) => {
  if (n === null || n === undefined || isNaN(n)) return "—";
  return `${n.toFixed(dec)}%`;
};

/** PDF helpers ─────────────────────────────────────────────── */

export function createPDF(orientation: "p" | "l" = "p") {
  const doc = new jsPDF({ orientation, unit: "pt", format: "letter" });
  return doc;
}

export function addHeader(doc: jsPDF, titulo: string, subtitulo?: string) {
  const w = doc.internal.pageSize.getWidth();
  doc.setFillColor(BRAND.primary);
  doc.rect(0, 0, w, 56, "F");
  doc.setTextColor("#ffffff");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("EME · Michoacán 360", 36, 24);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(titulo, 36, 42);
  if (subtitulo) {
    doc.setFontSize(8);
    doc.text(subtitulo, w - 36, 42, { align: "right" });
  }
  doc.setTextColor(BRAND.ink);
}

export function addFooter(doc: jsPDF) {
  const pages = doc.getNumberOfPages();
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setDrawColor(BRAND.rule);
    doc.line(36, h - 32, w - 36, h - 32);
    doc.setFontSize(8);
    doc.setTextColor(BRAND.sub);
    doc.text(
      `Generado ${fmtFecha()} · Producto verificado por Job Meneses`,
      36,
      h - 18,
    );
    doc.text(`Pág. ${i}/${pages}`, w - 36, h - 18, { align: "right" });
  }
}

export function addSection(doc: jsPDF, y: number, titulo: string): number {
  if (y > doc.internal.pageSize.getHeight() - 100) {
    doc.addPage();
    y = 80;
  }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(BRAND.primary);
  doc.text(titulo, 36, y);
  doc.setDrawColor(BRAND.primary);
  doc.line(36, y + 4, 130, y + 4);
  doc.setTextColor(BRAND.ink);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  return y + 22;
}

export function addParagraph(doc: jsPDF, y: number, texto: string): number {
  const w = doc.internal.pageSize.getWidth() - 72;
  const lines = doc.splitTextToSize(texto, w);
  if (y + lines.length * 12 > doc.internal.pageSize.getHeight() - 60) {
    doc.addPage();
    y = 80;
  }
  doc.setFontSize(10);
  doc.setTextColor(BRAND.ink);
  doc.text(lines, 36, y);
  return y + lines.length * 12 + 6;
}

export function addKPIs(
  doc: jsPDF,
  y: number,
  kpis: { label: string; value: string; color?: string }[],
): number {
  const w = doc.internal.pageSize.getWidth() - 72;
  const colW = w / kpis.length;
  kpis.forEach((k, i) => {
    const x = 36 + colW * i;
    doc.setFillColor(BRAND.bg);
    doc.roundedRect(x + 4, y, colW - 8, 50, 4, 4, "F");
    doc.setFontSize(8);
    doc.setTextColor(BRAND.sub);
    doc.text(k.label.toUpperCase(), x + 12, y + 14);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(k.color || BRAND.ink);
    doc.text(k.value, x + 12, y + 36);
    doc.setFont("helvetica", "normal");
  });
  return y + 64;
}

/** Nube de palabras renderizada como bloque de texto con tamaño proporcional a la frecuencia. */
export function addWordCloud(
  doc: jsPDF,
  y: number,
  palabras: { palabra: string; peso: number }[],
  opts: { maxFont?: number; minFont?: number; maxPalabras?: number } = {},
): number {
  if (!palabras.length) return y;
  const items = palabras.slice(0, opts.maxPalabras ?? 40);
  const max = Math.max(...items.map((p) => p.peso));
  const min = Math.min(...items.map((p) => p.peso));
  const fMax = opts.maxFont ?? 26;
  const fMin = opts.minFont ?? 9;
  const palette = [BRAND.primary, BRAND.ink, BRAND.ok, BRAND.warn, BRAND.sub];

  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const left = 36;
  const right = pageW - 36;
  const lineGap = 6;

  let x = left;
  let lineH = 0;

  for (let i = 0; i < items.length; i++) {
    const { palabra, peso } = items[i];
    const t = max === min ? 1 : (peso - min) / (max - min);
    const fs = Math.round(fMin + t * (fMax - fMin));
    const color = palette[i % palette.length];
    doc.setFont("helvetica", t > 0.6 ? "bold" : "normal");
    doc.setFontSize(fs);
    doc.setTextColor(color);
    const w = doc.getTextWidth(palabra);
    if (x + w > right) {
      y += lineH + lineGap;
      x = left;
      lineH = 0;
      if (y > pageH - 80) {
        doc.addPage();
        y = 80;
      }
    }
    doc.text(palabra, x, y + fs);
    x += w + 10;
    if (fs > lineH) lineH = fs;
  }
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(BRAND.ink);
  return y + lineH + 14;
}

export function addTable(
  doc: jsPDF,
  options: UserOptions & { head: any[][]; body: any[][] },
): number {
  autoTable(doc, {
    margin: { left: 36, right: 36 },
    headStyles: { fillColor: BRAND.primary, textColor: "#ffffff", fontSize: 9 },
    bodyStyles: { fontSize: 8.5, textColor: BRAND.ink },
    alternateRowStyles: { fillColor: BRAND.bg },
    styles: { cellPadding: 4 },
    ...options,
  });
  return (doc as any).lastAutoTable.finalY + 16;
}

/** XLSX helpers ─────────────────────────────────────────────── */

export interface SheetSpec {
  name: string;
  rows: (string | number | null | undefined)[][];
  /** primera fila se trata como header */
  header?: boolean;
}

export function generarXLSX(filename: string, sheets: SheetSpec[]) {
  const wb = XLSX.utils.book_new();
  sheets.forEach((s) => {
    const ws = XLSX.utils.aoa_to_sheet(s.rows);
    XLSX.utils.book_append_sheet(wb, ws, s.name.slice(0, 31));
  });
  XLSX.writeFile(wb, filename);
  try {
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([wbout], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    autoSubirSiActivo(blob, filename);
  } catch {
    /* noop */
  }
}

export function descargarPDF(doc: jsPDF, filename: string) {
  addFooter(doc);
  doc.save(filename);
  try {
    const blob = doc.output("blob") as Blob;
    autoSubirSiActivo(blob, filename);
  } catch {
    /* noop */
  }
}

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import jsPDF from "jspdf";
import type { EstrategiaOutput } from "./ResultadoTabs";
import type { SnapshotPayload } from "@/lib/estrategia-context";
import { RUBRO_LABEL } from "@/data/estrategia-templates";

interface Props {
  snapshot: SnapshotPayload;
  data: EstrategiaOutput;
}

export function ExportarPDF({ snapshot, data }: Props) {
  const exportar = () => {
    const doc = new jsPDF({ unit: "pt", format: "letter" });
    const margin = 40;
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    let y = margin;

    const ensureSpace = (h: number) => {
      if (y + h > pageH - margin) {
        doc.addPage();
        y = margin;
      }
    };

    const heading = (txt: string) => {
      ensureSpace(28);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(40, 30, 70);
      doc.text(txt, margin, y);
      y += 18;
      doc.setDrawColor(180, 180, 200);
      doc.line(margin, y - 4, pageW - margin, y - 4);
      y += 6;
    };

    const para = (txt: string, opts: { bold?: boolean; size?: number; color?: [number, number, number] } = {}) => {
      doc.setFont("helvetica", opts.bold ? "bold" : "normal");
      doc.setFontSize(opts.size ?? 10);
      doc.setTextColor(...(opts.color ?? [40, 40, 40]));
      const lines = doc.splitTextToSize(txt, pageW - margin * 2);
      lines.forEach((line: string) => {
        ensureSpace(14);
        doc.text(line, margin, y);
        y += 13;
      });
    };

    const bullet = (txt: string) => {
      const lines = doc.splitTextToSize(`• ${txt}`, pageW - margin * 2 - 10);
      lines.forEach((line: string, i: number) => {
        ensureSpace(13);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9.5);
        doc.setTextColor(40, 40, 40);
        doc.text(line, margin + (i === 0 ? 0 : 10), y);
        y += 12;
      });
    };

    // Portada
    doc.setFillColor(20, 15, 40);
    doc.rect(0, 0, pageW, 110, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(255, 255, 255);
    doc.text("ESTRATEGIA 360", margin, 50);
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(`${snapshot.nivelLabel} · ${snapshot.territorio}`, margin, 72);
    doc.setFontSize(9);
    doc.setTextColor(200, 180, 240);
    doc.text(`EME · Job Meneses · Campaña Alfonso Martínez · Horizonte ${snapshot.horizonte}`, margin, 92);
    y = 140;

    heading("Resumen ejecutivo");
    para(data.resumen_ejecutivo);
    y += 4;

    heading("Narrativa central");
    para(`"${data.narrativa_central.slogan}"`, { bold: true, size: 12, color: [80, 50, 140] });
    para(data.narrativa_central.tesis);
    data.narrativa_central.tres_pilares.forEach((p, i) => bullet(`Pilar ${i + 1}: ${p}`));

    heading("FODA");
    (["fortalezas", "oportunidades", "debilidades", "amenazas"] as const).forEach((k) => {
      para(k.toUpperCase(), { bold: true, size: 10, color: [80, 50, 140] });
      data.foda[k].forEach(bullet);
      y += 2;
    });

    heading("Escenarios");
    data.escenarios.forEach((e) => {
      para(`${e.tipo.toUpperCase()} (${e.probabilidad_pct}%) — ${e.margen_estimado}`, { bold: true });
      para(e.narrativa);
      e.condiciones_disparadoras.forEach(bullet);
      y += 4;
    });

    heading("Segmentación");
    data.segmentacion.forEach((s) => {
      para(`${s.segmento.toUpperCase()} — ${s.pct_estimado}% (${s.volumen_estimado.toLocaleString()} pers.)`, { bold: true });
      para(`Perfil: ${s.perfil}`);
      para(`Mensaje: "${s.mensaje_clave}"`);
      para(`Táctica: ${s.tactica}`);
      y += 4;
    });

    heading("Plan territorial");
    data.plan_territorial.forEach((z) => {
      para(`${z.zona} [${z.tipo}] · ROI ${z.roi_estimado}`, { bold: true });
      para(z.justificacion);
      para(`→ ${z.accion_prioritaria}`, { color: [80, 50, 140] });
      y += 3;
    });

    heading("Calendario");
    data.calendario.forEach((v) => {
      para(v.ventana.replace("_", " ").toUpperCase(), { bold: true });
      v.hitos.forEach(bullet);
      y += 3;
    });

    heading("Presupuesto sugerido");
    data.presupuesto.forEach((p) => {
      para(`${RUBRO_LABEL[p.rubro] ?? p.rubro}: ${p.pct}% · $${p.monto_sugerido_mxn.toLocaleString()} MXN`, { bold: true });
      para(p.justificacion);
      y += 3;
    });

    heading("Estructura mínima");
    para(`Brigadistas estimados: ${data.estructura.brigadistas_estimados.toLocaleString()}`);
    para(`Casas de campaña: ${data.estructura.casas_campaña}`);
    para("Coordinaciones:", { bold: true });
    data.estructura.coordinaciones.forEach(bullet);
    para(data.estructura.notas);

    heading("Matriz de riesgos");
    data.riesgos.forEach((r) => {
      para(`${r.riesgo} [P:${r.probabilidad} · I:${r.impacto}]`, { bold: true });
      para(`Mitigación: ${r.mitigacion}`);
      y += 3;
    });

    heading("KPIs semanales");
    data.kpis.forEach((k) => {
      para(`${k.nombre} — Meta: ${k.meta} (${k.frecuencia})`, { bold: true });
      para(`Fuente: ${k.fuente}`);
      y += 2;
    });

    // Footer en última página
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 130);
    doc.text(
      "Producto exclusivo EME · Uso restringido · War Room Alfonso Martínez & aliados",
      margin,
      pageH - 20,
    );

    const fname = `estrategia-360-${snapshot.nivel}-${snapshot.territorio.replace(/\s+/g, "-")}.pdf`;
    doc.save(fname);
  };

  return (
    <Button onClick={exportar} variant="outline" size="sm">
      <Download className="w-4 h-4 mr-1.5" /> Exportar PDF ejecutivo
    </Button>
  );
}

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
    const candidatoNombre = snapshot.candidatos?.propio?.nombre?.trim() || "Aspirante sin definir";
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
    doc.text(`EME · Campaña ${candidatoNombre} · Horizonte ${snapshot.horizonte}`, margin, 92);
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

    // CAMINO A LA VICTORIA
    if (data.meta_victoria) {
      heading("Camino a la victoria");
      para(`Votos objetivo: ${data.meta_victoria.votos_objetivo.toLocaleString()} · Participación supuesta: ${data.meta_victoria.participacion_supuesta_pct}% · Umbral: ${data.meta_victoria.umbral_pct}%`, { bold: true });
      para(data.meta_victoria.narrativa_camino);
      y += 4;
      para("Municipios pivote:", { bold: true, color: [80, 50, 140] });
      data.meta_victoria.municipios_pivote.forEach((m) => {
        bullet(`${m.nombre} — ${m.secciones} sec (${m.peso_pct_total}%) → ${m.accion_clave}`);
      });
      y += 3;
      para("Secciones clave:", { bold: true, color: [80, 50, 140] });
      data.meta_victoria.secciones_clave.forEach((s) => {
        bullet(`${s.municipio} [${s.tipo_seccion}] — ${s.num_secciones} sec · +${s.votos_aporte_estimado.toLocaleString()} votos: ${s.justificacion}`);
      });
    }

    // COMUNICACIÓN 360
    if (data.estrategia_digital_comunicacion) {
      const ec = data.estrategia_digital_comunicacion;
      heading("Estrategia de comunicación 360");
      para(`Tono actual detectado: ${ec.diagnostico_sentimiento.tono_actual.toUpperCase()}`, { bold: true });
      para(ec.diagnostico_sentimiento.sintesis);
      if (ec.diagnostico_sentimiento.temas_calientes.length) {
        para(`Temas calientes: ${ec.diagnostico_sentimiento.temas_calientes.join(", ")}`);
      }
      if (ec.diagnostico_sentimiento.adversarios_dominantes_en_red.length) {
        para(`Adversarios dominantes en red: ${ec.diagnostico_sentimiento.adversarios_dominantes_en_red.join(", ")}`);
      }
      y += 3;
      para("Arquitectura de mensaje:", { bold: true, color: [80, 50, 140] });
      para(`Eje emocional: ${ec.arquitectura_mensaje.eje_emocional}`);
      para(`Eje racional: ${ec.arquitectura_mensaje.eje_racional}`);
      ec.arquitectura_mensaje.frases_paraguas.forEach((f, i) => bullet(`Frase ${i + 1}: "${f}"`));
      if (ec.arquitectura_mensaje.tabues.length) {
        para(`Tabúes: ${ec.arquitectura_mensaje.tabues.join(", ")}`, { color: [180, 60, 80] });
      }
      y += 3;
      para("Plataformas:", { bold: true, color: [80, 50, 140] });
      ec.plataformas.forEach((p) => {
        bullet(`${p.red} [${p.prioridad}] — ${p.formato_dominante}, ${p.frecuencia_semanal} · KPI: ${p.kpi_principal}`);
      });
      y += 3;
      para("Voceros:", { bold: true, color: [80, 50, 140] });
      ec.voceros.forEach((v) => bullet(`${v.perfil} → ${v.funcion}`));
      y += 3;
      para("Calendario semanal:", { bold: true, color: [80, 50, 140] });
      (["lunes","martes","miercoles","jueves","viernes","sabado","domingo"] as const).forEach((d) => {
        bullet(`${d.toUpperCase()}: ${ec.calendario_contenido_semanal[d]}`);
      });
      y += 3;
      para("Contraataque y crisis:", { bold: true, color: [180, 60, 80] });
      ec.contraataque_y_crisis.triggers.forEach((t) => bullet(`Trigger: ${t}`));
      para(`Protocolo 24h: ${ec.contraataque_y_crisis.protocolo_24h}`);
      ec.contraataque_y_crisis.mensajes_pre_aprobados.forEach((m) => bullet(`Mensaje listo: "${m}"`));
      if (ec.aliados_influencia.length) {
        y += 3;
        para("Aliados de influencia:", { bold: true, color: [80, 50, 140] });
        ec.aliados_influencia.forEach((a) => bullet(`${a.perfil} (${a.region}) — ${a.tipo.replace(/_/g, " ")}`));
      }
    }

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

// Generador de Ficha Técnica de Briefing Interno (PDF 4-6 págs)
// Pensado para leer 5 minutos antes de una reunión con el equipo: OSINT digital,
// territorial/secciones, histórico+demografía, talking points + riesgos.
// Reusa resolverMetricasOficiales (padrón INE + cómputos por nivel) y carga
// análisis OSINT/perfil/discurso desde Supabase (tabla candidato_analisis).

import jsPDF from "jspdf";
import { supabase } from "@/integrations/supabase/client";
import type { Candidato } from "@/lib/candidatos/types";
import type {
  AnalisisPerfil,
  AnalisisOSINT,
  AnalisisDiscurso,
} from "@/lib/candidatos/types";
import { FASE_LABEL_CORTO } from "@/lib/candidatos/fase";
import {
  resolverMetricasOficiales,
  type MetricasOficiales,
} from "@/lib/dossier-data-resolver";

const NIVEL_LABEL: Record<string, string> = {
  gobernador: "Gubernatura",
  diputados_federales: "Diputación Federal",
  diputados: "Diputación Local",
  ayuntamientos: "Ayuntamiento",
};

// Paleta (RGB) — coherente con el dark theme de EME pero impresa en claro
const COLOR = {
  ink: [22, 22, 30] as [number, number, number],
  muted: [110, 110, 125] as [number, number, number],
  accent: [180, 130, 30] as [number, number, number], // amber/dorado EME
  ok: [22, 130, 90] as [number, number, number],
  danger: [185, 50, 60] as [number, number, number],
  divider: [200, 200, 210] as [number, number, number],
  bgPanel: [245, 243, 235] as [number, number, number],
  bgPanelDark: [25, 22, 38] as [number, number, number],
};

interface BriefingInput {
  candidato: Candidato;
}

async function cargarAnalisis(candidatoId: string): Promise<{
  perfil?: AnalisisPerfil;
  osint?: AnalisisOSINT;
  discurso?: AnalisisDiscurso;
}> {
  const { data } = await supabase
    .from("candidato_analisis")
    .select("tipo, output_json, created_at")
    .eq("candidato_id", candidatoId)
    .order("created_at", { ascending: false });
  const out: { perfil?: AnalisisPerfil; osint?: AnalisisOSINT; discurso?: AnalisisDiscurso } = {};
  for (const row of data ?? []) {
    const tipo = (row.tipo === "osint_profundo" ? "osint" : row.tipo) as
      | "perfil"
      | "osint"
      | "discurso";
    if (tipo === "perfil" && !out.perfil) out.perfil = row.output_json as unknown as AnalisisPerfil;
    else if (tipo === "osint" && !out.osint) out.osint = row.output_json as unknown as AnalisisOSINT;
    else if (tipo === "discurso" && !out.discurso) out.discurso = row.output_json as unknown as AnalisisDiscurso;
  }
  return out;
}

function fmtNum(n: number | null | undefined, fallback = "—"): string {
  if (n == null || !Number.isFinite(n)) return fallback;
  return n.toLocaleString("es-MX");
}
function fmtPct(n: number | null | undefined, decimals = 1): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return `${n.toFixed(decimals)}%`;
}

export async function generarBriefingInterno({ candidato }: BriefingInput): Promise<void> {
  const [metricas, analisis] = await Promise.all([
    resolverMetricasOficiales(candidato).catch(() => null as MetricasOficiales | null),
    cargarAnalisis(candidato.id),
  ]);

  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 48;
  const contentW = pageW - margin * 2;
  let y = margin;

  // ───────── Helpers de layout ─────────
  const headerStrip = () => {
    doc.setFillColor(...COLOR.bgPanelDark);
    doc.rect(0, 0, pageW, 24, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);
    doc.text("EME · BRIEFING INTERNO · CONFIDENCIAL", margin, 15);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(220, 200, 140);
    doc.text(candidato.nombre.toUpperCase(), pageW - margin, 15, { align: "right" });
    y = 50;
  };

  const footer = () => {
    const pageNum = doc.getNumberOfPages();
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...COLOR.muted);
    doc.text(
      `Generado ${new Date().toLocaleString("es-MX")} · Uso interno · No distribuir`,
      margin,
      pageH - 18,
    );
    doc.text(`p. ${pageNum}`, pageW - margin, pageH - 18, { align: "right" });
  };

  const ensure = (h: number) => {
    if (y + h > pageH - margin - 28) {
      footer();
      doc.addPage();
      headerStrip();
    }
  };

  const sectionTitle = (label: string, badge?: string) => {
    // Espacio generoso antes de cada sección
    y += 8;
    ensure(40);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...COLOR.ink);
    doc.text(label.toUpperCase(), margin, y);
    if (badge) {
      const w = doc.getTextWidth(badge) + 12;
      doc.setFillColor(...COLOR.accent);
      doc.roundedRect(pageW - margin - w, y - 11, w, 15, 2, 2, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(255, 255, 255);
      doc.text(badge, pageW - margin - w / 2, y - 1, { align: "center" });
    }
    y += 8;
    doc.setDrawColor(...COLOR.accent);
    doc.setLineWidth(1.4);
    doc.line(margin, y, margin + 48, y);
    doc.setDrawColor(...COLOR.divider);
    doc.setLineWidth(0.4);
    doc.line(margin + 50, y, pageW - margin, y);
    y += 16;
  };

  const para = (
    text: string,
    opts: { bold?: boolean; size?: number; color?: [number, number, number]; indent?: number } = {},
  ) => {
    if (!text) return;
    const size = opts.size ?? 9.5;
    const lh = size * 1.45;
    doc.setFont("helvetica", opts.bold ? "bold" : "normal");
    doc.setFontSize(size);
    doc.setTextColor(...(opts.color ?? COLOR.ink));
    const indent = opts.indent ?? 0;
    const lines = doc.splitTextToSize(text, contentW - indent);
    for (const line of lines) {
      ensure(lh);
      doc.text(line, margin + indent, y);
      y += lh;
    }
    y += 2;
  };

  const subtitle = (text: string, color?: [number, number, number]) => {
    y += 4;
    ensure(14);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(...(color ?? COLOR.muted));
    doc.text(text.toUpperCase(), margin, y);
    y += 12;
  };

  const bullet = (text: string, color?: [number, number, number]) => {
    if (!text) return;
    const size = 9;
    const lh = size * 1.5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(size);
    const lines = doc.splitTextToSize(text, contentW - 18);
    for (let i = 0; i < lines.length; i++) {
      ensure(lh);
      if (i === 0) {
        doc.setTextColor(...COLOR.accent);
        doc.setFont("helvetica", "bold");
        doc.text("›", margin + 4, y);
        doc.setFont("helvetica", "normal");
      }
      doc.setTextColor(...(color ?? COLOR.ink));
      doc.text(lines[i], margin + 16, y);
      y += lh;
    }
  };

  const kvRow = (
    items: Array<{ label: string; value: string; tone?: "ok" | "danger" | "muted" }>,
  ) => {
    const cols = items.length;
    const gap = 8;
    const colW = (contentW - gap * (cols - 1)) / cols;
    const cardH = 44;
    ensure(cardH + 8);
    items.forEach((it, i) => {
      const x = margin + i * (colW + gap);
      doc.setFillColor(248, 246, 240);
      doc.roundedRect(x, y, colW, cardH, 3, 3, "F");
      doc.setDrawColor(...COLOR.divider);
      doc.setLineWidth(0.4);
      doc.roundedRect(x, y, colW, cardH, 3, 3, "S");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.5);
      doc.setTextColor(...COLOR.muted);
      doc.text(it.label.toUpperCase(), x + 8, y + 13);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      const c =
        it.tone === "ok" ? COLOR.ok : it.tone === "danger" ? COLOR.danger : COLOR.ink;
      doc.setTextColor(...c);
      const valLines = doc.splitTextToSize(it.value, colW - 16);
      doc.text(valLines[0] ?? it.value, x + 8, y + 32);
    });
    y += cardH + 10;
  };

  const panel = (
    title: string,
    body: () => void,
    tone: "default" | "warn" | "ok" = "default",
  ) => {
    const padX = 14;
    const padTop = 22;
    const padBottom = 12;
    const toneColor =
      tone === "warn" ? COLOR.danger : tone === "ok" ? COLOR.ok : COLOR.accent;

    ensure(60);
    const top = y;
    // Reservamos espacio para el título antes de ejecutar el body
    y = top + padTop;

    // Sangra el contenido del panel desde el margen del panel
    const prevMargin = innerMarginRef.value;
    innerMarginRef.value = margin + padX;
    body();
    innerMarginRef.value = prevMargin;

    const bottom = y + padBottom;
    // Fondo sutil
    doc.setFillColor(
      tone === "warn" ? 252 : tone === "ok" ? 244 : 250,
      tone === "warn" ? 244 : tone === "ok" ? 250 : 247,
      tone === "warn" ? 244 : tone === "ok" ? 246 : 235,
    );
    doc.roundedRect(margin, top, contentW, bottom - top, 4, 4, "F");
    // Borde lateral acentuado
    doc.setFillColor(...toneColor);
    doc.rect(margin, top, 3, bottom - top, "F");
    // Borde fino
    doc.setDrawColor(...toneColor);
    doc.setLineWidth(0.5);
    doc.roundedRect(margin, top, contentW, bottom - top, 4, 4, "S");

    // Título encima del contenido (lo escribimos al final para que quede sobre el fondo)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...toneColor);
    doc.text(title.toUpperCase(), margin + padX, top + 14);

    y = bottom + 10;
  };

  // Permite que bullet/para dentro de panel respeten un margen interno
  const innerMarginRef = { value: margin };
  const _origText = doc.text.bind(doc);
  // No mutamos doc.text: en su lugar, bullet/para usan margin directamente.
  // Para sangría dentro de panel, reescribimos bullet/para para leer innerMarginRef.
  void _origText;

  // ───────── PORTADA ─────────
  doc.setFillColor(...COLOR.bgPanelDark);
  doc.rect(0, 0, pageW, 200, "F");
  // Banda dorada
  doc.setFillColor(...COLOR.accent);
  doc.rect(0, 200, pageW, 4, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(220, 200, 140);
  doc.text("BRIEFING INTERNO · DOSSIER DE TRABAJO", margin, 50);

  doc.setFontSize(28);
  doc.setTextColor(255, 255, 255);
  const nombreLines = doc.splitTextToSize(candidato.nombre, contentW);
  doc.text(nombreLines, margin, 90);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(210, 210, 220);
  doc.text(
    `${NIVEL_LABEL[candidato.nivel] ?? candidato.nivel} · ${candidato.territorio}`,
    margin,
    90 + nombreLines.length * 30 + 8,
  );

  doc.setFontSize(9);
  doc.setTextColor(180, 180, 200);
  const headerMeta = [
    `Partido / coalición: ${candidato.partido}`,
    `Fase: ${FASE_LABEL_CORTO[candidato.fase] ?? candidato.fase}`,
    candidato.cargo_buscado ? `Cargo: ${candidato.cargo_buscado}` : null,
  ]
    .filter(Boolean)
    .join("  ·  ");
  doc.text(headerMeta, margin, 90 + nombreLines.length * 30 + 26);

  y = 230;

  // ───────── BLOQUE 1 — IDENTIDAD + OSINT DIGITAL ─────────
  sectionTitle("1 · Identidad y radar digital", "OSINT");

  if (candidato.bio_breve) {
    para(candidato.bio_breve);
    y += 4;
  }

  // Métricas redes (si están capturadas)
  const redes = candidato.metricas_redes ?? {};
  const seguidoresPorRed: Array<[string, number]> = Object.entries(redes)
    .map(([k, v]) => [k, (v as { seguidores?: number })?.seguidores ?? 0] as [string, number])
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1]);
  if (seguidoresPorRed.length > 0) {
    const total = seguidoresPorRed.reduce((s, [, n]) => s + n, 0);
    para("Huella digital (seguidores capturados):", { bold: true, size: 9 });
    seguidoresPorRed
      .slice(0, 5)
      .forEach(([red, n]) =>
        bullet(`${red.toUpperCase()}: ${fmtNum(n)} seguidores (${((n / total) * 100).toFixed(0)}% del total)`),
      );
    y += 2;
  }

  if (analisis.osint) {
    const o = analisis.osint;
    if (o.resumen_ejecutivo) {
      para("Síntesis OSINT:", { bold: true, size: 9 });
      para(o.resumen_ejecutivo);
      y += 3;
    }
    if (o.presencia_digital) {
      para(
        `Presencia digital: ${o.presencia_digital.nivel.toUpperCase()}${
          o.presencia_digital.plataformas_fuertes?.length
            ? ` · Fuertes en: ${o.presencia_digital.plataformas_fuertes.join(", ")}`
            : ""
        }`,
        { bold: true, color: COLOR.accent, size: 9 },
      );
      if (o.presencia_digital.observaciones) para(o.presencia_digital.observaciones);
      y += 3;
    }
    if (o.controversias?.length) {
      panel(
        `Riesgos reputacionales (${o.controversias.length})`,
        () => {
          o.controversias.slice(0, 4).forEach((c) =>
            bullet(`[${c.gravedad.toUpperCase()}] ${c.tema}: ${c.descripcion}`,
              c.gravedad === "alta" ? COLOR.danger : undefined,
            ),
          );
        },
        "warn",
      );
    }
    if (o.temas_recurrentes?.length) {
      para(`Temas recurrentes en su narrativa: ${o.temas_recurrentes.join(" · ")}`, {
        size: 9,
      });
      y += 4;
    }
  } else {
    para(
      "⚠ Sin análisis OSINT generado todavía. Ejecuta 'Generar OSINT' en la ficha del candidato antes de la reunión.",
      { color: COLOR.danger, size: 9 },
    );
    y += 4;
  }

  // ───────── BLOQUE 2 — TERRITORIAL + SECCIONES ─────────
  sectionTitle("2 · Mapa territorial y secciones", metricas?.fuenteResultados ?? "TERRITORIAL");

  if (metricas && !metricas.esEstimacion) {
    kvRow([
      {
        label: "Brecha vs rival",
        value:
          metricas.brechaPp != null
            ? `${metricas.brechaPp > 0 ? "-" : "+"}${Math.abs(metricas.brechaPp).toFixed(1)} pp`
            : "s/d",
        tone:
          metricas.brechaPp == null
            ? "muted"
            : metricas.brechaPp > 0
              ? "danger"
              : "ok",
      },
      { label: "Lista nominal", value: fmtNum(metricas.listaNominal) },
      {
        label: "Secciones",
        value: metricas.seccionesTotal
          ? `${metricas.seccionesTotal}`
          : "—",
      },
      {
        label: "Secciones rojas",
        value: fmtNum(metricas.seccionesRiesgo),
        tone: "danger",
      },
    ]);

    if (metricas.fragmentacion) {
      const f = metricas.fragmentacion;
      para("Fragmentación territorial (catálogo INE SECCION.dbf):", { bold: true, size: 9 });
      bullet(
        `${f.urbanas} urbanas (${f.pctUrbano.toFixed(0)}%) — terreno digital, RRSS y medios`,
        COLOR.ok,
      );
      bullet(
        `${f.mixtas} mixtas (${f.pctMixto.toFixed(0)}%) — combinar digital + territorial`,
      );
      bullet(
        `${f.rurales} rurales (${f.pctRural.toFixed(0)}%) — operación NO digital, perifoneo, brigadas`,
        COLOR.danger,
      );
      bullet(
        `Perfil dominante: ${f.perfil.toUpperCase()} · ${f.noDigitales} secciones requieren operación territorial intensiva`,
        COLOR.accent,
      );
      y += 4;
    }

    if (metricas.rivalPartido && metricas.intencionRival != null) {
      para(
        `Rival dominante en ${metricas.cicloRef ?? "ciclo previo"}: ${metricas.rivalPartido} (${fmtPct(metricas.intencionRival)}${metricas.intencionPropia != null ? ` vs ${fmtPct(metricas.intencionPropia)} propio` : ""})`,
        { bold: true, color: COLOR.danger, size: 9 },
      );
      y += 2;
    } else if (metricas.fuenteResultados == null) {
      para(
        "Sin histórico IEM cargado para este municipio (no entra en los 21 municipios estratégicos). Bloque territorial y demografía vienen del padrón INE 2026.",
        { color: COLOR.muted, size: 8 },
      );
      y += 2;
    }
    para(`Fuente: ${metricas.origen}`, { color: COLOR.muted, size: 8 });
    y += 4;
  } else {
    para(
      "⚠ No se pudo cruzar el territorio con el padrón INE / cómputos oficiales. Verifica que el campo 'territorio' coincida con el catálogo (Distrito XX, Municipio o estatal).",
      { color: COLOR.danger, size: 9 },
    );
    y += 4;
  }

  // ───────── BLOQUE 3 — HISTÓRICO + DEMOGRAFÍA ─────────
  sectionTitle("3 · Histórico electoral y demografía", "PADRÓN INE 2026");

  if (metricas && !metricas.esEstimacion) {
    if (metricas.cicloRef && metricas.rivalPartido) {
      para(
        `Resultado de referencia (${metricas.cicloRef}): ${metricas.rivalPartido} ganó con ${fmtPct(metricas.intencionRival)}. Participación histórica: ${fmtPct(metricas.participacionHist)}.`,
      );
      y += 2;
    } else {
      para(
        "Sin cómputo IEM histórico cargado para este territorio. Los escenarios usan tendencia estatal y padrón INE 2026.",
        { color: COLOR.muted, size: 9 },
      );
      y += 2;
    }

    // Escenarios proyectados rápidos a partir de brecha
    const lista = metricas.listaNominal ?? 0;
    const partHist = (metricas.participacionHist ?? 55) / 100;
    const propio = (metricas.intencionPropia ?? 30) / 100;
    if (lista > 0) {
      const votosBase = Math.round(lista * partHist * propio);
      const votosPiso = Math.round(votosBase * 0.85);
      const votosTecho = Math.round(votosBase * 1.18);
      panel("Escenarios rápidos (proyección lineal sobre lista nominal)", () => {
        bullet(`PISO (escenario adverso): ~${fmtNum(votosPiso)} votos propios`, COLOR.danger);
        bullet(`BASE (tendencia actual): ~${fmtNum(votosBase)} votos propios`);
        bullet(`TECHO (escenario favorable): ~${fmtNum(votosTecho)} votos propios`, COLOR.ok);
      });
    }

    if (metricas.demografia.hombres != null || metricas.demografia.mujeres != null) {
      const h = metricas.demografia.hombres ?? 0;
      const m = metricas.demografia.mujeres ?? 0;
      const tot = h + m;
      kvRow([
        {
          label: "Mujeres",
          value: tot > 0 ? `${fmtNum(m)} (${((m / tot) * 100).toFixed(0)}%)` : fmtNum(m),
        },
        {
          label: "Hombres",
          value: tot > 0 ? `${fmtNum(h)} (${((h / tot) * 100).toFixed(0)}%)` : fmtNum(h),
        },
        { label: "Jóvenes 18-29", value: fmtPct(metricas.demografia.pctJovenes18a29) },
        { label: "60+ años", value: fmtPct(metricas.demografia.pctAdultoMayor60mas) },
      ]);
    }
  } else {
    para("Sin datos oficiales cruzados: el bloque histórico requiere territorio resuelto.", {
      color: COLOR.muted,
      size: 9,
    });
    y += 4;
  }

  // FODA del análisis de perfil
  if (analisis.perfil) {
    const p = analisis.perfil;
    para(`Score competitividad IA: ${p.score_competitividad}/100`, {
      bold: true,
      color: COLOR.accent,
      size: 10,
    });
    if (p.perfil_votante_natural) {
      para(`Votante natural: ${p.perfil_votante_natural}`, { size: 9 });
    }
    y += 4;
  }

  // ───────── BLOQUE 4 — TALKING POINTS + RIESGOS ─────────
  sectionTitle("4 · Talking points y riesgos para la mesa", "ACCIÓN");

  if (analisis.discurso) {
    const d = analisis.discurso;
    if (d.ejes_narrativos?.length) {
      para("Ejes narrativos a defender:", { bold: true, size: 9 });
      d.ejes_narrativos.slice(0, 4).forEach((e) => bullet(e));
      y += 3;
    }
    if (d.frames_dominantes?.length) {
      para(`Frames dominantes: ${d.frames_dominantes.join(" · ")}`, { size: 9 });
      y += 3;
    }
    if (d.vulnerabilidades_argumentales?.length) {
      panel(
        "Vulnerabilidades argumentales (prepárate)",
        () => {
          d.vulnerabilidades_argumentales!.slice(0, 4).forEach((v) => bullet(v, COLOR.danger));
        },
        "warn",
      );
    }
    if (d.contraargumentos_sugeridos?.length) {
      para("Contraargumentos listos:", { bold: true, size: 9 });
      d.contraargumentos_sugeridos.slice(0, 4).forEach((c) =>
        bullet(`Si atacan «${c.vs_eje}» → "${c.respuesta}"`),
      );
      y += 3;
    }
  }

  if (analisis.perfil) {
    const p = analisis.perfil;
    if (p.fortalezas?.length) {
      para("Fortalezas a explotar:", { bold: true, color: COLOR.ok, size: 9 });
      p.fortalezas.slice(0, 4).forEach((f) => bullet(f, COLOR.ok));
      y += 2;
    }
    if (p.amenazas?.length) {
      panel(
        "Amenazas activas",
        () => {
          p.amenazas.slice(0, 4).forEach((a) => bullet(a, COLOR.danger));
        },
        "warn",
      );
    }
  }

  // Próximos pasos sugeridos
  panel(
    "Agenda mínima de la reunión",
    () => {
      bullet("Validar último OSINT (riesgos reputacionales detectados arriba)");
      bullet("Acordar mensaje paraguas para los próximos 14 días");
      if (metricas?.fragmentacion && metricas.fragmentacion.noDigitales > 0) {
        bullet(
          `Asignar brigadas a ${metricas.fragmentacion.noDigitales} secciones rurales/mixtas (operación NO digital)`,
          COLOR.accent,
        );
      }
      if (metricas?.seccionesRiesgo) {
        bullet(`Plan de remontada en ${metricas.seccionesRiesgo} secciones rojas`, COLOR.danger);
      }
      bullet("Definir KPIs semanales y responsables");
    },
    "ok",
  );

  // Footer en la última página
  footer();

  // Guarda
  const slug = candidato.nombre
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const fecha = new Date().toISOString().slice(0, 10);
  doc.save(`briefing-interno-${slug}-${fecha}.pdf`);
}

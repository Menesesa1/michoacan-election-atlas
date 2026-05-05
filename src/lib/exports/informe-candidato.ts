// Informe ejecutivo PDF + XLSX por candidato
import { supabase } from "@/integrations/supabase/client";
import {
  createPDF, addHeader, addSection, addParagraph, addKPIs, addTable,
  descargarPDF, fmtFecha, fmtNum, fmtPct, generarXLSX, type SheetSpec,
} from "./utils";

interface CandidatoBase {
  id: string;
  nombre: string;
  partido: string;
  nivel: string;
  territorio: string;
  cargo_buscado?: string | null;
  fase: string;
  bio_breve?: string | null;
  es_propio: boolean;
  redes?: any;
  metricas_redes?: any;
  trayectoria?: any;
}

async function cargar(candidatoId: string) {
  const { data: candidato } = await supabase
    .from("candidatos")
    .select("*")
    .eq("id", candidatoId)
    .maybeSingle();

  if (!candidato) throw new Error("Candidato no encontrado");

  const [analisisRes, resumenRes, mencionesRes, trendsRes] = await Promise.all([
    supabase.from("candidato_analisis")
      .select("tipo, output_json, created_at")
      .eq("candidato_id", candidatoId)
      .order("created_at", { ascending: false }),
    supabase.from("social_resumen")
      .select("*")
      .eq("candidato_id", candidatoId)
      .order("generado_en", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.from("social_menciones")
      .select("titulo, fragmento, fuente, sentimiento, tema, url, detectada_en")
      .eq("candidato_id", candidatoId)
      .order("detectada_en", { ascending: false })
      .limit(30),
    supabase.from("trends_candidato")
      .select("termino, promedio_interes, pico_interes, contexto_narrativo, ejecutada_en")
      .eq("candidato_id", candidatoId)
      .order("ejecutada_en", { ascending: false })
      .limit(5),
  ]);

  return {
    candidato: candidato as CandidatoBase,
    analisis: analisisRes.data ?? [],
    resumen: resumenRes.data,
    menciones: mencionesRes.data ?? [],
    trends: trendsRes.data ?? [],
  };
}

export async function descargarInformeCandidatoPDF(candidatoId: string) {
  const { candidato, analisis, resumen, menciones, trends } = await cargar(candidatoId);

  const doc = createPDF("p");
  addHeader(
    doc,
    `Informe ejecutivo · ${candidato.nombre}`,
    `${candidato.partido} · ${candidato.cargo_buscado || candidato.nivel} · ${candidato.territorio}`,
  );

  let y = 80;

  // Lectura ejecutiva
  y = addSection(doc, y, "Lectura ejecutiva");
  const tipoLabel = candidato.es_propio ? "Candidatura propia" : "Contendiente externo";
  const lectura = [
    `${candidato.nombre} (${candidato.partido}) busca ${candidato.cargo_buscado || candidato.nivel} en ${candidato.territorio}.`,
    `Estado actual: ${candidato.fase}. Clasificación interna: ${tipoLabel}.`,
    candidato.bio_breve || "Sin biografía registrada.",
    resumen
      ? `En el último monitoreo se registraron ${resumen.total_menciones} menciones con sentimiento promedio ${(resumen.sentimiento_promedio ?? 0).toFixed(2)} (${fmtPct(resumen.pct_positivo)} positivo / ${fmtPct(resumen.pct_negativo)} negativo).`
      : "Aún no hay monitoreo social registrado para este candidato.",
  ].join(" ");
  y = addParagraph(doc, y, lectura);

  // KPIs
  y = addKPIs(doc, y, [
    { label: "Menciones", value: fmtNum(resumen?.total_menciones ?? 0) },
    { label: "Sentimiento", value: (resumen?.sentimiento_promedio ?? 0).toFixed(2) },
    { label: "% Positivo", value: fmtPct(resumen?.pct_positivo) },
    { label: "% Negativo", value: fmtPct(resumen?.pct_negativo) },
  ]);

  // Trends
  if (trends.length) {
    y = addSection(doc, y, "Google Trends");
    y = addTable(doc, {
      startY: y,
      head: [["Término", "Promedio", "Pico", "Última corrida"]],
      body: trends.map((t: any) => [
        t.termino,
        fmtNum(t.promedio_interes, 1),
        fmtNum(t.pico_interes, 1),
        fmtFecha(t.ejecutada_en),
      ]),
    });
    if (trends[0]?.contexto_narrativo) {
      y = addParagraph(doc, y, `Contexto: ${trends[0].contexto_narrativo}`);
    }
  }

  // Análisis IA
  const perfil = analisis.find((a: any) => a.tipo === "perfil");
  const osint = analisis.find((a: any) => a.tipo === "osint");
  const discurso = analisis.find((a: any) => a.tipo === "discurso");

  if (perfil?.output_json) {
    y = addSection(doc, y, "Perfil estratégico");
    const p = perfil.output_json as any;
    if (p.fortalezas?.length) {
      y = addParagraph(doc, y, "Fortalezas: " + (Array.isArray(p.fortalezas) ? p.fortalezas.join("; ") : String(p.fortalezas)));
    }
    if (p.debilidades?.length) {
      y = addParagraph(doc, y, "Debilidades: " + (Array.isArray(p.debilidades) ? p.debilidades.join("; ") : String(p.debilidades)));
    }
    if (p.resumen) y = addParagraph(doc, y, p.resumen);
  }

  if (osint?.output_json) {
    y = addSection(doc, y, "OSINT / Inconsistencias");
    const o = osint.output_json as any;
    if (o.hallazgos && Array.isArray(o.hallazgos)) {
      y = addTable(doc, {
        startY: y,
        head: [["Riesgo", "Hallazgo", "Fuente"]],
        body: o.hallazgos.slice(0, 10).map((h: any) => [
          h.severidad || "—",
          h.descripcion || h.titulo || "—",
          h.fuente || "—",
        ]),
      });
    }
  }

  if (discurso?.output_json) {
    y = addSection(doc, y, "Discurso recomendado");
    const d = discurso.output_json as any;
    if (d.que_decir) {
      y = addParagraph(doc, y, "✓ Qué decir: " + (Array.isArray(d.que_decir) ? d.que_decir.join("; ") : d.que_decir));
    }
    if (d.que_evitar) {
      y = addParagraph(doc, y, "✗ Qué evitar: " + (Array.isArray(d.que_evitar) ? d.que_evitar.join("; ") : d.que_evitar));
    }
  }

  // Menciones recientes
  if (menciones.length) {
    y = addSection(doc, y, "Menciones recientes (top 15)");
    y = addTable(doc, {
      startY: y,
      head: [["Sent.", "Título", "Fuente", "Tema"]],
      body: menciones.slice(0, 15).map((m: any) => [
        (m.sentimiento ?? 0).toFixed(2),
        (m.titulo || "").slice(0, 80),
        m.fuente || "—",
        m.tema || "—",
      ]),
    });
  }

  const slug = candidato.nombre.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40);
  descargarPDF(doc, `informe-${slug}-${new Date().toISOString().slice(0, 10)}.pdf`);
}

export async function descargarInformeCandidatoXLSX(candidatoId: string) {
  const { candidato, analisis, resumen, menciones, trends } = await cargar(candidatoId);
  const slug = candidato.nombre.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40);

  const sheets: SheetSpec[] = [
    {
      name: "Resumen",
      rows: [
        [`Informe · ${candidato.nombre}`],
        [`${candidato.partido} · ${candidato.cargo_buscado || candidato.nivel} · ${candidato.territorio}`],
        [`Generado: ${new Date().toLocaleString("es-MX")}`],
        [],
        ["Campo", "Valor"],
        ["Nombre", candidato.nombre],
        ["Partido", candidato.partido],
        ["Nivel", candidato.nivel],
        ["Cargo buscado", candidato.cargo_buscado ?? "—"],
        ["Territorio", candidato.territorio],
        ["Fase", candidato.fase],
        ["Tipo", candidato.es_propio ? "Propio" : "Externo"],
        ["Bio breve", candidato.bio_breve ?? "—"],
        [],
        ["Métrica social", "Valor"],
        ["Menciones", resumen?.total_menciones ?? 0],
        ["Sentimiento prom.", resumen?.sentimiento_promedio ?? null],
        ["% Positivo", resumen?.pct_positivo ?? null],
        ["% Negativo", resumen?.pct_negativo ?? null],
        ["% Neutro", resumen?.pct_neutro ?? null],
      ],
    },
    {
      name: "Trends",
      rows: [
        ["Término", "Promedio", "Pico", "Contexto", "Ejecutada"],
        ...trends.map((t: any) => [
          t.termino, t.promedio_interes, t.pico_interes, t.contexto_narrativo, t.ejecutada_en,
        ]),
      ],
    },
    {
      name: "Menciones",
      rows: [
        ["Sent.", "Título", "Fragmento", "Fuente", "Tema", "URL", "Detectada"],
        ...menciones.map((m: any) => [
          m.sentimiento, m.titulo, m.fragmento, m.fuente, m.tema, m.url, m.detectada_en,
        ]),
      ],
    },
    {
      name: "Análisis IA",
      rows: [
        ["Tipo", "Generado", "JSON"],
        ...analisis.map((a: any) => [a.tipo, a.created_at, JSON.stringify(a.output_json)]),
      ],
    },
  ];

  generarXLSX(`informe-${slug}-${new Date().toISOString().slice(0, 10)}.xlsx`, sheets);
}

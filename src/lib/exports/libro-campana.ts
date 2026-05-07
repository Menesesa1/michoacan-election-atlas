// LIBRO DE CAMPAÑA — informe integral por candidato
// Compila TODO con las MISMAS fuentes que el briefing interno y el dossier:
//  • Métricas oficiales (padrón INE 2026 + cómputos INE/IEM por nivel) vía resolverMetricasOficiales
//  • Histórico territorial (historico_municipios DB + seeds IEM)
//  • Análisis IA por candidato (perfil/OSINT/discurso/eval. digital)
//  • Estrategia 360 guardada
//  • Escucha social (social_resumen + social_menciones)
//  • Belief shifts, CIB, narrativas sugeridas
//  • Trends, Meta Ads
//  • Alertas de crisis del territorio
//  • Discurso ciudadano (analizar-discurso-ciudadano)
//  • Sugerencia de paridad 2027
// REGLA: si una sección no tiene datos reales, se OMITE (no se imprime "sin datos").
// REGLA: capítulos numerados dinámicamente.

import { supabase } from "@/integrations/supabase/client";
import {
  createPDF, addParagraph, addKPIs, addTable,
  descargarPDF, fmtFecha, fmtNum, fmtPct, BRAND,
} from "./utils";
import type jsPDF from "jspdf";
import { resolverMetricasOficiales, type MetricasOficiales } from "@/lib/dossier-data-resolver";
import type { Candidato } from "@/lib/candidatos/types";
import { sugerirGenero2027, type HistoricoTerritorial } from "@/lib/paridad/paridad-2027";
import { inferirGenero, type Genero } from "@/lib/paridad/inferir-genero";

const PRIMARY: [number, number, number] = [29, 78, 216];
const INK: [number, number, number] = [15, 23, 42];
const SUB: [number, number, number] = [71, 85, 105];
const ACCENT: [number, number, number] = [124, 58, 237];

const slug = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 50);

const arr = (v: any): string[] =>
  Array.isArray(v) ? v.map(String).filter(Boolean) : v ? [String(v)] : [];

const hasData = (v: any): boolean => {
  if (v == null) return false;
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === "object") return Object.keys(v).length > 0;
  if (typeof v === "string") return v.trim().length > 0;
  return true;
};

// ─────────── CARGA DE DATOS ───────────

async function cargarTodo(candidatoId: string) {
  const { data: candidato } = await supabase
    .from("candidatos").select("*").eq("id", candidatoId).maybeSingle();
  if (!candidato) throw new Error("Candidato no encontrado");

  const [
    analisisRes, resumenRes, mencionesRes, trendsRes,
    metaAdsRes, beliefRes, cibRes, estrategiaRes,
    narrativasRes, alertasCrisisRes, histMuniRes,
    metricasRes, discursoCiudadanoRes,
  ] = await Promise.all([
    supabase.from("candidato_analisis")
      .select("tipo, output_json, created_at, model")
      .eq("candidato_id", candidatoId)
      .order("created_at", { ascending: false }),
    supabase.from("social_resumen")
      .select("*").eq("candidato_id", candidatoId)
      .order("generado_en", { ascending: false }).limit(5),
    supabase.from("social_menciones")
      .select("titulo, fragmento, fuente, sentimiento, tema, url, detectada_en, hashtags, emociones, municipio")
      .eq("candidato_id", candidatoId)
      .order("detectada_en", { ascending: false }).limit(80),
    supabase.from("trends_candidato")
      .select("termino, promedio_interes, pico_interes, contexto_narrativo, ejecutada_en, related_top, related_rising")
      .eq("candidato_id", candidatoId)
      .order("ejecutada_en", { ascending: false }).limit(5),
    supabase.from("meta_ads")
      .select("page_name, ad_creative_body, spend_lower, spend_upper, impressions_lower, impressions_upper, currency, ad_delivery_start_time, publisher_platforms")
      .eq("candidato_id", candidatoId)
      .order("ad_delivery_start_time", { ascending: false }).limit(40),
    supabase.from("belief_shifts")
      .select("tipo_shift, severidad, titulo, descripcion, delta, valor_anterior, valor_actual, temas_nuevos, temas_abandonados, detectado_en")
      .eq("entidad_nombre", candidato.nombre)
      .order("detectado_en", { ascending: false }).limit(20),
    supabase.from("cib_alertas")
      .select("tipo_patron, severidad, titulo, descripcion, detectada_en")
      .eq("entidad_nombre", candidato.nombre)
      .order("detectada_en", { ascending: false }).limit(15),
    supabase.from("estrategias_guardadas")
      .select("output_json, snapshot_json, titulo, created_at")
      .eq("nivel", candidato.nivel)
      .ilike("territorio", `%${candidato.territorio}%`)
      .order("created_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("narrativas_sugeridas")
      .select("tipo, mensaje, tono, urgencia, plataforma, emocion_objetivo, contexto, created_at")
      .eq("entidad_nombre", candidato.nombre)
      .order("created_at", { ascending: false }).limit(15),
    supabase.from("alertas_crisis")
      .select("prioridad, titulo, descripcion, distrito, fuente, url_fuente, timestamp")
      .or(`distrito.ilike.%${candidato.territorio}%,distrito.ilike.%Michoacán%`)
      .order("timestamp", { ascending: false }).limit(20),
    candidato.nivel === "ayuntamientos"
      ? supabase.from("historico_municipios")
          .select("anio,partido_ganador,candidato_ganador,pct_ganador,partido_segundo,pct_segundo,participacion_pct")
          .ilike("municipio_nombre", `%${candidato.territorio}%`)
          .order("anio", { ascending: false }).limit(5)
      : Promise.resolve({ data: [] }),
    resolverMetricasOficiales(candidato as unknown as Candidato).catch(() => null as MetricasOficiales | null),
    supabase.functions.invoke("analizar-discurso-ciudadano", { body: {} })
      .then((r) => (r.data?.success ? r.data : null))
      .catch(() => null),
  ]);

  return {
    candidato,
    analisis: analisisRes.data ?? [],
    resumenes: resumenRes.data ?? [],
    menciones: mencionesRes.data ?? [],
    trends: trendsRes.data ?? [],
    metaAds: metaAdsRes.data ?? [],
    beliefShifts: beliefRes.data ?? [],
    cib: cibRes.data ?? [],
    estrategia: estrategiaRes.data,
    narrativas: narrativasRes.data ?? [],
    alertasCrisis: alertasCrisisRes.data ?? [],
    historicoMuni: (histMuniRes.data ?? []) as any[],
    metricas: metricasRes,
    discursoCiudadano: discursoCiudadanoRes,
  };
}

// ─────────── HELPERS DE LAYOUT ───────────

function portada(doc: jsPDF, c: any) {
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  doc.setFillColor(...PRIMARY);
  doc.rect(0, 0, w, h, "F");
  doc.setFillColor(...ACCENT);
  doc.rect(0, h * 0.55, w, h * 0.45, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("EME · MICHOACÁN 360", 36, 56);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Inteligencia electoral · Producto verificado", 36, 70);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(36, h * 0.30, 220, 24, 4, 4, "F");
  doc.setTextColor(...PRIMARY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("LIBRO DE CAMPAÑA · EDICIÓN COMPLETA", 46, h * 0.30 + 16);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(34);
  doc.setFont("helvetica", "bold");
  const lineas = doc.splitTextToSize(c.nombre.toUpperCase(), w - 72);
  doc.text(lineas, 36, h * 0.40);
  doc.setFontSize(14);
  doc.setFont("helvetica", "normal");
  doc.text(`${c.partido} · ${c.cargo_buscado || c.nivel}`, 36, h * 0.40 + 32 + lineas.length * 12);
  doc.text(`${c.territorio}`, 36, h * 0.40 + 50 + lineas.length * 12);
  doc.setFontSize(10);
  doc.text(`Edición: ${fmtFecha()}`, 36, h - 60);
  doc.setFontSize(9);
  doc.text("Documento confidencial · Uso restringido al war room", 36, h - 44);
  doc.text("Producto verificado por Job Meneses · EME", 36, h - 30);
}

function tituloCapitulo(doc: jsPDF, num: string, titulo: string, subtitulo?: string) {
  doc.addPage();
  const w = doc.internal.pageSize.getWidth();
  doc.setFillColor(...PRIMARY);
  doc.rect(0, 0, w, 80, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(`CAPÍTULO ${num}`, 36, 32);
  doc.setFontSize(22);
  doc.text(titulo, 36, 58);
  if (subtitulo) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(subtitulo, 36, 74);
  }
  doc.setTextColor(...INK);
  return 110;
}

function subseccion(doc: jsPDF, y: number, titulo: string): number {
  if (y > doc.internal.pageSize.getHeight() - 80) { doc.addPage(); y = 60; }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...ACCENT);
  doc.text(titulo, 36, y);
  doc.setDrawColor(...ACCENT);
  doc.line(36, y + 4, 36 + doc.getTextWidth(titulo), y + 4);
  doc.setTextColor(...INK);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  return y + 22;
}

function citaDestacada(doc: jsPDF, y: number, texto: string): number {
  const w = doc.internal.pageSize.getWidth() - 72;
  doc.setFont("helvetica", "italic");
  doc.setFontSize(11);
  const lines = doc.splitTextToSize(`"${texto}"`, w - 20);
  const h = lines.length * 14 + 16;
  if (y + h > doc.internal.pageSize.getHeight() - 60) { doc.addPage(); y = 60; }
  doc.setFillColor(245, 240, 255);
  doc.roundedRect(36, y, w, h, 4, 4, "F");
  doc.setDrawColor(...ACCENT);
  doc.setLineWidth(2);
  doc.line(36, y, 36, y + h);
  doc.setLineWidth(0.5);
  doc.setTextColor(...INK);
  doc.text(lines, 46, y + 18);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  return y + h + 10;
}

function listaBullets(doc: jsPDF, y: number, items: string[]): number {
  const w = doc.internal.pageSize.getWidth() - 72;
  items.forEach((it) => {
    const lines = doc.splitTextToSize(`•  ${it}`, w - 12);
    if (y + lines.length * 12 > doc.internal.pageSize.getHeight() - 60) {
      doc.addPage(); y = 60;
    }
    doc.setFontSize(10);
    doc.setTextColor(...INK);
    doc.text(lines, 42, y);
    y += lines.length * 12 + 2;
  });
  return y + 4;
}

// ─────────── GENERADOR ───────────

export async function descargarLibroDeCampana(candidatoId: string) {
  const data = await cargarTodo(candidatoId);
  const {
    candidato, analisis, resumenes, menciones, trends, metaAds,
    beliefShifts, cib, estrategia, narrativas, alertasCrisis,
    historicoMuni, metricas, discursoCiudadano,
  } = data;

  const perfil = analisis.find((a: any) => a.tipo === "perfil")?.output_json as any;
  const osint = analisis.find((a: any) => a.tipo === "osint" || a.tipo === "osint_profundo")?.output_json as any;
  const discurso = analisis.find((a: any) => a.tipo === "discurso")?.output_json as any;
  const evalDigital = analisis.find((a: any) => a.tipo === "evaluacion_digital")?.output_json as any;
  const estrat = (estrategia?.output_json ?? null) as any;
  const resumen = resumenes[0];

  const doc = createPDF("p");
  portada(doc, candidato);

  // Reservar página para índice
  doc.addPage();
  const indiceMarkerPage = doc.getNumberOfPages();
  const indiceMarker: { num: string; titulo: string; pagina: number }[] = [];

  // Numeración dinámica de capítulos
  let capNum = 0;
  const nextCap = () => String(++capNum).padStart(2, "0");

  const abrirCap = (titulo: string, subtitulo?: string) => {
    const num = nextCap();
    const pag = doc.getNumberOfPages() + 1;
    indiceMarker.push({ num, titulo, pagina: pag });
    return tituloCapitulo(doc, num, titulo, subtitulo);
  };

  // ========== CAP: SÍNTESIS EJECUTIVA (siempre) ==========
  let y = abrirCap("Síntesis ejecutiva", "Lectura de 90 segundos para el comité estratégico");
  const tipoLabel = candidato.es_propio ? "Candidatura propia" : "Contendiente externo";
  y = addParagraph(doc, y,
    `${candidato.nombre} (${candidato.partido}) compite por ${candidato.cargo_buscado || candidato.nivel} en ${candidato.territorio}. ` +
    `Fase actual: ${candidato.fase}. Clasificación interna: ${tipoLabel}.` +
    (candidato.bio_breve ? ` ${candidato.bio_breve}` : "")
  );

  // KPIs combinados (oficiales + escucha)
  const kpisCore: { label: string; value: string; color?: string }[] = [];
  if (metricas?.listaNominal) kpisCore.push({ label: "Lista nominal", value: fmtNum(metricas.listaNominal) });
  if (metricas?.intencionPropia != null) kpisCore.push({ label: "Intención propia", value: fmtPct(metricas.intencionPropia) });
  if (metricas?.intencionRival != null) kpisCore.push({ label: `Rival ${metricas.rivalPartido ?? ""}`, value: fmtPct(metricas.intencionRival), color: BRAND.bad });
  if (metricas?.brechaPp != null) kpisCore.push({ label: "Brecha (pp)", value: `${metricas.brechaPp > 0 ? "+" : ""}${metricas.brechaPp}`, color: metricas.brechaPp <= 0 ? BRAND.ok : BRAND.bad });
  if (kpisCore.length) y = addKPIs(doc, y, kpisCore.slice(0, 4));

  if (resumen) {
    y = addKPIs(doc, y, [
      { label: "Menciones (último batch)", value: fmtNum(resumen.total_menciones ?? 0) },
      { label: "Sentimiento", value: (resumen.sentimiento_promedio ?? 0).toFixed(2),
        color: (resumen.sentimiento_promedio ?? 0) >= 0 ? BRAND.ok : BRAND.bad },
      { label: "% Positivo", value: fmtPct(resumen.pct_positivo) },
      { label: "% Negativo", value: fmtPct(resumen.pct_negativo), color: BRAND.bad },
    ]);
  }

  if (perfil?.resumen) {
    y = subseccion(doc, y, "Lectura del analista");
    y = addParagraph(doc, y, perfil.resumen);
  }

  // ========== CAP: PERFIL Y TRAYECTORIA ==========
  if (candidato.bio_breve || hasData(candidato.trayectoria) || hasData(perfil)) {
    y = abrirCap("Perfil y trayectoria", "Quién es, de dónde viene, qué representa");
    y = subseccion(doc, y, "Datos básicos");
    y = addTable(doc, {
      startY: y,
      head: [["Campo", "Valor"]],
      body: [
        ["Nombre", candidato.nombre],
        ["Partido / coalición", candidato.partido],
        ["Cargo buscado", candidato.cargo_buscado || candidato.nivel],
        ["Territorio", candidato.territorio],
        ["Fase", candidato.fase],
        ["Tipo", tipoLabel],
        ...(arr(candidato.tags).length ? [["Tags", arr(candidato.tags).join(", ")]] : []),
      ],
    });

    if (Array.isArray(candidato.trayectoria) && candidato.trayectoria.length) {
      y = subseccion(doc, y, "Trayectoria pública");
      y = addTable(doc, {
        startY: y,
        head: [["Año", "Cargo / hito", "Resultado"]],
        body: candidato.trayectoria.map((t: any) => [
          t.anio || t.año || "—", t.cargo || t.descripcion || "—", t.resultado || "—",
        ]),
      });
    }

    if (perfil?.fortalezas?.length || perfil?.debilidades?.length) {
      y = subseccion(doc, y, "FODA del perfil");
      (["fortalezas","debilidades","oportunidades","amenazas"] as const).forEach((k) => {
        if (perfil[k]?.length) {
          y = addParagraph(doc, y, k.toUpperCase());
          y = listaBullets(doc, y, arr(perfil[k]));
        }
      });
    }
  }

  // ========== CAP: DATOS ELECTORALES OFICIALES (padrón INE + cómputos) ==========
  if (metricas && (metricas.listaNominal || metricas.cicloRef || metricas.fragmentacion)) {
    y = abrirCap("Datos electorales oficiales", "Padrón INE 2026 + cómputos por nivel");
    y = addParagraph(doc, y, `Fuente: ${metricas.origen}.`);

    const kpisOf: { label: string; value: string; color?: string }[] = [];
    if (metricas.listaNominal) kpisOf.push({ label: "Lista nominal", value: fmtNum(metricas.listaNominal) });
    if (metricas.seccionesTotal) kpisOf.push({ label: "Secciones", value: fmtNum(metricas.seccionesTotal) });
    if (metricas.participacionHist != null) kpisOf.push({ label: `Participación ${metricas.cicloRef ?? ""}`, value: fmtPct(metricas.participacionHist) });
    if (metricas.seccionesPivote != null) kpisOf.push({ label: "Secc. pivote (est.)", value: fmtNum(metricas.seccionesPivote) });
    if (kpisOf.length) y = addKPIs(doc, y, kpisOf.slice(0, 4));

    if (metricas.demografia.hombres || metricas.demografia.mujeres) {
      y = subseccion(doc, y, "Demografía del padrón (INE-DERFE 2026)");
      y = addTable(doc, {
        startY: y,
        head: [["Indicador", "Valor"]],
        body: [
          ["Hombres", fmtNum(metricas.demografia.hombres)],
          ["Mujeres", fmtNum(metricas.demografia.mujeres)],
          ["% Jóvenes 18-29", fmtPct(metricas.demografia.pctJovenes18a29)],
          ["% Adulto mayor 60+", fmtPct(metricas.demografia.pctAdultoMayor60mas)],
        ],
      });
    }

    if (metricas.fragmentacion) {
      const f = metricas.fragmentacion;
      y = subseccion(doc, y, `Fragmentación territorial · ${f.alcance}`);
      y = addKPIs(doc, y, [
        { label: "Total secciones", value: fmtNum(f.total) },
        { label: "Urbanas", value: `${f.urbanas} (${f.pctUrbano}%)` },
        { label: "Mixtas", value: `${f.mixtas} (${f.pctMixto}%)` },
        { label: "Rurales", value: `${f.rurales} (${f.pctRural}%)` },
      ]);
      y = addParagraph(doc, y,
        `Perfil del territorio: ${f.perfil.toUpperCase()}. Secciones que requieren operación NO digital (mixta + rural): ${fmtNum(f.noDigitales)}.`
      );
    }

    if (historicoMuni.length) {
      y = subseccion(doc, y, "Histórico municipal (DB)");
      y = addTable(doc, {
        startY: y,
        head: [["Año", "Ganador", "Partido", "% gana", "2°", "% 2°", "Particip."]],
        body: historicoMuni.map((h) => [
          h.anio,
          (h.candidato_ganador || "—").slice(0, 30),
          h.partido_ganador || "—",
          fmtPct(h.pct_ganador),
          h.partido_segundo || "—",
          fmtPct(h.pct_segundo),
          fmtPct(h.participacion_pct),
        ]),
      });
    }
  }

  // ========== CAP: PARIDAD 2027 ==========
  if (historicoMuni.length || metricas?.cicloRef) {
    const generoCand = inferirGenero(candidato.nombre) as Genero;
    const histParidad: HistoricoTerritorial[] = historicoMuni
      .filter((h) => h.partido_ganador && h.pct_ganador != null && h.candidato_ganador)
      .map((h) => ({
        anio: h.anio,
        generoGanador: inferirGenero(h.candidato_ganador) as Genero,
        partidoGanador: h.partido_ganador!,
        porcentajeGanador: Number(h.pct_ganador),
      }));

    if (histParidad.length || metricas?.intencionRival != null) {
      y = abrirCap("Paridad de género 2027", "Cumplimiento horizontal y alternancia IEM/TEEM");
      const sug = sugerirGenero2027(histParidad, candidato.partido);
      y = addTable(doc, {
        startY: y,
        head: [["Aspecto", "Valor"]],
        body: [
          ["Género del candidato", generoCand === "M" ? "Mujer" : generoCand === "H" ? "Hombre" : "No determinado"],
          ["Sugerencia 2027", sug.generoSugerido === "M" ? "Mujer" : sug.generoSugerido === "H" ? "Hombre" : "Ambiguo"],
          ["Bloque competitividad", sug.bloqueCompetitividad.toUpperCase()],
          ["Confianza", sug.confianza.toUpperCase()],
          ...(sug.generoHistorico2021 ? [["Ganador 2021", sug.generoHistorico2021 === "M" ? "Mujer" : "Hombre"]] : []),
          ...(sug.generoHistorico2018 ? [["Ganador 2018", sug.generoHistorico2018 === "M" ? "Mujer" : "Hombre"]] : []),
        ],
      });
      y = addParagraph(doc, y, sug.motivo);

      if (generoCand !== "ambiguo" && sug.generoSugerido !== "ambiguo") {
        const cumple = generoCand === sug.generoSugerido;
        y = addParagraph(doc, y,
          cumple
            ? "✓ La candidatura COINCIDE con la sugerencia de paridad para este territorio."
            : `⚠ La candidatura NO coincide con la sugerencia. Riesgo: posible objeción ante TEEM si el partido no equilibra otros bloques.`
        );
      }
    }
  }

  // ========== CAP: TERRITORIO Y CAMINO A LA VICTORIA ==========
  if (estrat?.meta_victoria) {
    y = abrirCap("Camino a la victoria", "Estimación cuantitativa territorial");
    const mv = estrat.meta_victoria;
    y = addKPIs(doc, y, [
      { label: "Votos objetivo", value: fmtNum(mv.votos_objetivo) },
      { label: "Participación", value: fmtPct(mv.participacion_supuesta_pct) },
      { label: "Umbral", value: fmtPct(mv.umbral_pct) },
      { label: "Pivote (mun.)", value: String(mv.municipios_pivote?.length ?? 0) },
    ]);
    if (mv.narrativa_camino) y = addParagraph(doc, y, mv.narrativa_camino);
    if (mv.municipios_pivote?.length) {
      y = subseccion(doc, y, "Municipios pivote");
      y = addTable(doc, {
        startY: y,
        head: [["Municipio", "Secciones", "Peso %", "Acción clave"]],
        body: mv.municipios_pivote.map((m: any) => [m.nombre, m.secciones, `${m.peso_pct_total}%`, m.accion_clave]),
      });
    }
    if (mv.secciones_clave?.length) {
      y = subseccion(doc, y, "Secciones clave");
      y = addTable(doc, {
        startY: y,
        head: [["Municipio", "Tipo", "# Sec", "Aporte votos", "Justificación"]],
        body: mv.secciones_clave.slice(0, 20).map((s: any) => [
          s.municipio, s.tipo_seccion, s.num_secciones, fmtNum(s.votos_aporte_estimado), s.justificacion,
        ]),
      });
    }
  }

  // ========== CAP: ESCUCHA SOCIAL ==========
  if (resumen || menciones.length) {
    y = abrirCap("Escucha social y conversación", "Qué dicen, cómo lo dicen, qué sienten");
    if (resumen) {
      y = addKPIs(doc, y, [
        { label: "Total menciones", value: fmtNum(resumen.total_menciones) },
        { label: "Sentimiento", value: (resumen.sentimiento_promedio ?? 0).toFixed(2) },
        { label: "% Positivo", value: fmtPct(resumen.pct_positivo), color: BRAND.ok },
        { label: "% Negativo", value: fmtPct(resumen.pct_negativo), color: BRAND.bad },
      ]);
    }
    if (Array.isArray(resumen?.top_temas) && resumen.top_temas.length) {
      y = subseccion(doc, y, "Top temas en conversación");
      y = addTable(doc, {
        startY: y,
        head: [["Tema", "Menciones"]],
        body: resumen.top_temas.map((t: any) => [t.value || t.tema, t.count || t.n]),
      });
    }
    if (Array.isArray(resumen?.top_hashtags) && resumen.top_hashtags.length) {
      y = subseccion(doc, y, "Hashtags dominantes");
      y = addParagraph(doc, y, resumen.top_hashtags.map((h: any) => `#${h.value || h}`).join("  "));
    }
    if (menciones.length) {
      y = subseccion(doc, y, `Menciones representativas (top ${Math.min(menciones.length, 25)})`);
      y = addTable(doc, {
        startY: y,
        head: [["Fecha", "Sent.", "Fuente", "Tema", "Título"]],
        body: menciones.slice(0, 25).map((m: any) => [
          new Date(m.detectada_en).toLocaleDateString("es-MX"),
          (m.sentimiento ?? 0).toFixed(2),
          (m.fuente || "—").slice(0, 18),
          (m.tema || "—").slice(0, 14),
          (m.titulo || "").slice(0, 70),
        ]),
      });
    }
  }

  // ========== CAP: DISCURSO CIUDADANO ESTATAL ==========
  if (discursoCiudadano && (discursoCiudadano.resumen_ejecutivo || discursoCiudadano.temas_relevantes?.length)) {
    y = abrirCap("Discurso ciudadano (estatal)", "Qué le preocupa al votante michoacano");
    if (discursoCiudadano.resumen_ejecutivo) y = addParagraph(doc, y, discursoCiudadano.resumen_ejecutivo);
    if (discursoCiudadano.temas_relevantes?.length) {
      y = subseccion(doc, y, "Temas dominantes");
      y = addTable(doc, {
        startY: y,
        head: [["Tema", "Intensidad", "Descripción"]],
        body: discursoCiudadano.temas_relevantes.slice(0, 10).map((t: any) => [
          t.tema, String(Math.round(t.intensidad ?? 0)), (t.descripcion ?? "—").slice(0, 90),
        ]),
      });
    }
    if (discursoCiudadano.emociones?.length) {
      y = subseccion(doc, y, "Emociones que mueven al votante");
      y = listaBullets(doc, y, discursoCiudadano.emociones.slice(0, 8).map((e: any) =>
        `${e.emocion} (${Math.round(e.intensidad ?? 0)}/100): ${e.disparador ?? ""}`
      ));
    }
    if (discursoCiudadano.insumos_discurso?.que_decir?.length) {
      y = subseccion(doc, y, "Qué decir (insumos)");
      y = listaBullets(doc, y, arr(discursoCiudadano.insumos_discurso.que_decir));
    }
    if (discursoCiudadano.insumos_discurso?.que_evitar?.length) {
      y = subseccion(doc, y, "Qué evitar (insumos)");
      y = listaBullets(doc, y, arr(discursoCiudadano.insumos_discurso.que_evitar));
    }
    if (discursoCiudadano.palabras_clave?.length) {
      y = subseccion(doc, y, "Palabras clave en la conversación");
      y = addParagraph(doc, y, discursoCiudadano.palabras_clave.slice(0, 30)
        .map((p: any) => typeof p === "string" ? p : `${p.palabra}(${p.peso})`).join("  ·  "));
    }
  }

  // ========== CAP: INTELIGENCIA — CIB + BELIEF SHIFTS ==========
  if (beliefShifts.length || cib.length) {
    y = abrirCap("Inteligencia digital", "Cambios de creencias y comportamiento coordinado");
    if (beliefShifts.length) {
      y = subseccion(doc, y, "Belief shift detector");
      y = addTable(doc, {
        startY: y,
        head: [["Fecha", "Tipo", "Severidad", "Δ", "Título"]],
        body: beliefShifts.map((s: any) => [
          new Date(s.detectado_en).toLocaleDateString("es-MX"),
          (s.tipo_shift || "").replace("_", " "),
          s.severidad,
          s.delta != null ? Number(s.delta).toFixed(2) : "—",
          (s.titulo || "").slice(0, 60),
        ]),
      });
      beliefShifts.slice(0, 4).forEach((s: any) => {
        y = addParagraph(doc, y, `• ${s.titulo} — ${s.descripcion}`);
      });
    }
    if (cib.length) {
      y = subseccion(doc, y, "Comportamiento coordinado inauténtico (CIB)");
      y = addTable(doc, {
        startY: y,
        head: [["Fecha", "Patrón", "Severidad", "Descripción"]],
        body: cib.map((c: any) => [
          new Date(c.detectada_en).toLocaleDateString("es-MX"),
          (c.tipo_patron || "").replace("_", " "),
          c.severidad,
          (c.descripcion || c.titulo || "").slice(0, 80),
        ]),
      });
    }
  }

  // ========== CAP: ALERTAS DE CRISIS ==========
  if (alertasCrisis.length) {
    y = abrirCap("Alertas de crisis del territorio", "Monitor de eventos de impacto reputacional");
    y = addTable(doc, {
      startY: y,
      head: [["Fecha", "Prioridad", "Título", "Distrito", "Fuente"]],
      body: alertasCrisis.slice(0, 15).map((a: any) => [
        new Date(a.timestamp).toLocaleDateString("es-MX"),
        a.prioridad,
        (a.titulo || "").slice(0, 60),
        (a.distrito || "—").slice(0, 25),
        (a.fuente || "—").slice(0, 18),
      ]),
    });
    alertasCrisis.slice(0, 3).forEach((a: any) => {
      if (a.descripcion) y = addParagraph(doc, y, `• ${a.titulo}: ${a.descripcion}`);
    });
  }

  // ========== CAP: NARRATIVAS ACCIONABLES ==========
  if (narrativas.length) {
    y = abrirCap("Narrativas accionables sugeridas", "Mensajes listos para war room");
    narrativas.slice(0, 10).forEach((n: any) => {
      y = subseccion(doc, y, `${(n.tipo || "").toUpperCase()} · ${n.tono || ""} · urgencia ${n.urgencia ?? "—"}`);
      if (n.contexto) y = addParagraph(doc, y, `Contexto: ${n.contexto}`);
      y = citaDestacada(doc, y, n.mensaje);
      if (n.plataforma || n.emocion_objetivo) {
        y = addParagraph(doc, y, `Plataforma: ${n.plataforma || "—"} · Emoción objetivo: ${n.emocion_objetivo || "—"}`);
      }
    });
  }

  // ========== CAP: GOOGLE TRENDS ==========
  if (trends.length) {
    y = abrirCap("Google Trends", "Búsqueda activa sobre el candidato");
    y = addTable(doc, {
      startY: y,
      head: [["Término", "Promedio", "Pico", "Última corrida"]],
      body: trends.map((t: any) => [t.termino, fmtNum(t.promedio_interes, 1), fmtNum(t.pico_interes, 1), fmtFecha(t.ejecutada_en)]),
    });
    if (trends[0]?.contexto_narrativo) y = addParagraph(doc, y, `Contexto: ${trends[0].contexto_narrativo}`);
    const top = trends[0]?.related_top;
    if (Array.isArray(top) && top.length) {
      y = subseccion(doc, y, "Búsquedas relacionadas top");
      y = listaBullets(doc, y, top.slice(0, 10).map((r: any) => `${r.query || r.value} (${r.value || r.score || ""})`));
    }
  }

  // ========== CAP: META ADS ==========
  if (metaAds.length) {
    y = abrirCap("Publicidad digital · Meta Ads Library", "Qué se está pagando en redes");
    const totalSpend = metaAds.reduce((s: number, a: any) => s + (Number(a.spend_upper) || 0), 0);
    const totalImp = metaAds.reduce((s: number, a: any) => s + (Number(a.impressions_upper) || 0), 0);
    y = addKPIs(doc, y, [
      { label: "Anuncios", value: String(metaAds.length) },
      { label: "Inversión total", value: `$${fmtNum(totalSpend)} ${metaAds[0]?.currency || "MXN"}` },
      { label: "Impresiones", value: fmtNum(totalImp) },
      { label: "Páginas únicas", value: String(new Set(metaAds.map((a: any) => a.page_name)).size) },
    ]);
    y = addTable(doc, {
      startY: y,
      head: [["Inicio", "Página", "Spend MXN (rango)", "Impresiones", "Plataformas"]],
      body: metaAds.slice(0, 25).map((a: any) => [
        a.ad_delivery_start_time ? new Date(a.ad_delivery_start_time).toLocaleDateString("es-MX") : "—",
        (a.page_name || "—").slice(0, 22),
        `${fmtNum(a.spend_lower)}–${fmtNum(a.spend_upper)}`,
        `${fmtNum(a.impressions_lower)}–${fmtNum(a.impressions_upper)}`,
        arr(a.publisher_platforms).join(", ").slice(0, 22),
      ]),
    });
    const conCreativo = metaAds.find((a: any) => a.ad_creative_body);
    if (conCreativo) {
      y = subseccion(doc, y, "Muestra de creatividad");
      y = citaDestacada(doc, y, String(conCreativo.ad_creative_body).slice(0, 500));
    }
  }

  // ========== CAP: OSINT ==========
  if (osint && (osint.hallazgos?.length || osint.resumen)) {
    y = abrirCap("OSINT y riesgo reputacional", "Hallazgos abiertos sobre el candidato");
    if (osint.resumen) y = addParagraph(doc, y, osint.resumen);
    if (Array.isArray(osint.hallazgos) && osint.hallazgos.length) {
      y = addTable(doc, {
        startY: y,
        head: [["Severidad", "Hallazgo", "Fuente"]],
        body: osint.hallazgos.slice(0, 20).map((h: any) => [
          h.severidad || "—", h.descripcion || h.titulo || "—", h.fuente || "—",
        ]),
      });
    }
    if (Array.isArray(osint.controversias) && osint.controversias.length) {
      y = subseccion(doc, y, "Controversias documentadas");
      osint.controversias.slice(0, 5).forEach((c: any) => {
        y = addParagraph(doc, y, `• ${c.titulo || c.descripcion} (${c.anio || "—"})`);
      });
    }
  }

  // ========== CAP: ESTRATEGIA 360 ==========
  if (estrat) {
    y = abrirCap("Estrategia 360", `Plan integral · ${estrategia?.titulo || "última versión"}`);
    if (estrat.resumen_ejecutivo) y = addParagraph(doc, y, estrat.resumen_ejecutivo);

    if (estrat.narrativa_central) {
      y = subseccion(doc, y, "Narrativa central");
      if (estrat.narrativa_central.slogan) y = citaDestacada(doc, y, estrat.narrativa_central.slogan);
      if (estrat.narrativa_central.tesis) y = addParagraph(doc, y, estrat.narrativa_central.tesis);
      if (estrat.narrativa_central.tres_pilares?.length) y = listaBullets(doc, y, estrat.narrativa_central.tres_pilares);
    }
    if (estrat.foda) {
      y = subseccion(doc, y, "FODA estratégico");
      (["fortalezas", "oportunidades", "debilidades", "amenazas"] as const).forEach((k) => {
        if (estrat.foda[k]?.length) {
          y = addParagraph(doc, y, k.toUpperCase());
          y = listaBullets(doc, y, estrat.foda[k]);
        }
      });
    }
    if (estrat.escenarios?.length) {
      y = subseccion(doc, y, "Escenarios");
      y = addTable(doc, {
        startY: y,
        head: [["Tipo", "Prob.", "Margen", "Narrativa"]],
        body: estrat.escenarios.map((e: any) => [
          e.tipo, `${e.probabilidad_pct}%`, e.margen_estimado, (e.narrativa || "").slice(0, 80),
        ]),
      });
    }
    if (estrat.segmentacion?.length) {
      y = subseccion(doc, y, "Segmentación de votantes");
      estrat.segmentacion.forEach((s: any) => {
        y = addParagraph(doc, y, `${s.segmento.toUpperCase()} — ${s.pct_estimado}% · ${fmtNum(s.volumen_estimado)} personas`);
        y = addParagraph(doc, y, `Perfil: ${s.perfil}`);
        if (s.mensaje_clave) y = citaDestacada(doc, y, s.mensaje_clave);
        y = addParagraph(doc, y, `Táctica: ${s.tactica}`);
      });
    }
    if (estrat.plan_territorial?.length) {
      y = subseccion(doc, y, "Plan territorial");
      y = addTable(doc, {
        startY: y,
        head: [["Zona", "Tipo", "ROI", "Acción prioritaria"]],
        body: estrat.plan_territorial.map((z: any) => [z.zona, z.tipo, z.roi_estimado, z.accion_prioritaria]),
      });
    }
    if (estrat.calendario?.length) {
      y = subseccion(doc, y, "Calendario de campaña");
      estrat.calendario.forEach((c: any) => {
        y = addParagraph(doc, y, `· ${String(c.ventana).replace("_", " ").toUpperCase()}`);
        y = listaBullets(doc, y, arr(c.hitos));
      });
    }
    if (estrat.presupuesto?.length) {
      y = subseccion(doc, y, "Presupuesto sugerido");
      y = addTable(doc, {
        startY: y,
        head: [["Rubro", "%", "Monto MXN", "Justificación"]],
        body: estrat.presupuesto.map((p: any) => [
          p.rubro, `${p.pct}%`, fmtNum(p.monto_sugerido_mxn), (p.justificacion || "").slice(0, 60),
        ]),
      });
    }
    if (estrat.estructura) {
      y = subseccion(doc, y, "Estructura mínima");
      y = addParagraph(doc, y, `Brigadistas estimados: ${fmtNum(estrat.estructura.brigadistas_estimados)} · Casas de campaña: ${estrat.estructura.casas_campaña}`);
      if (estrat.estructura.coordinaciones?.length) y = listaBullets(doc, y, estrat.estructura.coordinaciones);
      if (estrat.estructura.notas) y = addParagraph(doc, y, estrat.estructura.notas);
    }
    if (estrat.riesgos?.length) {
      y = subseccion(doc, y, "Matriz de riesgos");
      y = addTable(doc, {
        startY: y,
        head: [["Riesgo", "P", "I", "Mitigación"]],
        body: estrat.riesgos.map((r: any) => [r.riesgo, r.probabilidad, r.impacto, r.mitigacion]),
      });
    }
    if (estrat.kpis?.length) {
      y = subseccion(doc, y, "KPIs de seguimiento");
      y = addTable(doc, {
        startY: y,
        head: [["KPI", "Meta", "Frecuencia", "Fuente"]],
        body: estrat.kpis.map((k: any) => [k.nombre, k.meta, k.frecuencia, k.fuente]),
      });
    }
  }

  // ========== CAP: COMUNICACIÓN 360 ==========
  if (estrat?.estrategia_digital_comunicacion) {
    const ec = estrat.estrategia_digital_comunicacion;
    y = abrirCap("Estrategia de comunicación 360", "Mensaje, plataformas, voceros, crisis");
    if (ec.diagnostico_sentimiento) {
      y = subseccion(doc, y, "Diagnóstico de sentimiento");
      if (ec.diagnostico_sentimiento.tono_actual)
        y = addParagraph(doc, y, `Tono actual: ${String(ec.diagnostico_sentimiento.tono_actual).toUpperCase()}`);
      if (ec.diagnostico_sentimiento.sintesis) y = addParagraph(doc, y, ec.diagnostico_sentimiento.sintesis);
    }
    if (ec.arquitectura_mensaje) {
      y = subseccion(doc, y, "Arquitectura de mensaje");
      if (ec.arquitectura_mensaje.eje_emocional) y = addParagraph(doc, y, `Eje emocional: ${ec.arquitectura_mensaje.eje_emocional}`);
      if (ec.arquitectura_mensaje.eje_racional) y = addParagraph(doc, y, `Eje racional: ${ec.arquitectura_mensaje.eje_racional}`);
      if (ec.arquitectura_mensaje.frases_paraguas?.length) {
        ec.arquitectura_mensaje.frases_paraguas.slice(0, 3).forEach((f: string) => { y = citaDestacada(doc, y, f); });
      }
    }
    if (ec.plataformas?.length) {
      y = subseccion(doc, y, "Plataformas y formatos");
      y = addTable(doc, {
        startY: y,
        head: [["Red", "Prioridad", "Formato", "Frecuencia", "KPI"]],
        body: ec.plataformas.map((p: any) => [p.red, p.prioridad, p.formato_dominante, p.frecuencia_semanal, p.kpi_principal]),
      });
    }
    if (ec.calendario_contenido_semanal) {
      y = subseccion(doc, y, "Calendario semanal de contenido");
      y = addTable(doc, {
        startY: y,
        head: [["Día", "Contenido"]],
        body: (["lunes","martes","miercoles","jueves","viernes","sabado","domingo"] as const)
          .filter((d) => ec.calendario_contenido_semanal[d])
          .map((d) => [d.toUpperCase(), ec.calendario_contenido_semanal[d]]),
      });
    }
    if (ec.contraataque_y_crisis) {
      y = subseccion(doc, y, "Protocolo de contraataque y crisis");
      if (ec.contraataque_y_crisis.protocolo_24h) y = addParagraph(doc, y, ec.contraataque_y_crisis.protocolo_24h);
      if (ec.contraataque_y_crisis.triggers?.length) {
        y = addParagraph(doc, y, "Triggers monitoreados:");
        y = listaBullets(doc, y, ec.contraataque_y_crisis.triggers);
      }
      if (ec.contraataque_y_crisis.mensajes_pre_aprobados?.length) {
        y = addParagraph(doc, y, "Mensajes pre-aprobados:");
        ec.contraataque_y_crisis.mensajes_pre_aprobados.slice(0, 4).forEach((m: string) => { y = citaDestacada(doc, y, m); });
      }
    }
  }

  // ========== CAP: DISCURSO RECOMENDADO (análisis IA del candidato) ==========
  if (discurso && (discurso.ejes_narrativos?.length || discurso.frames_dominantes?.length || discurso.contraargumentos_sugeridos?.length)) {
    y = abrirCap("Discurso recomendado", "Qué decir, cómo encuadrar, cómo contrarrestar");
    if (discurso.tono) y = addParagraph(doc, y, `Tono recomendado: ${discurso.tono}`);
    if (discurso.ejes_narrativos?.length) {
      y = subseccion(doc, y, "Ejes narrativos");
      y = listaBullets(doc, y, arr(discurso.ejes_narrativos));
    }
    if (discurso.frames_dominantes?.length) {
      y = subseccion(doc, y, "Frames dominantes");
      y = listaBullets(doc, y, arr(discurso.frames_dominantes));
    }
    if (discurso.vulnerabilidades_argumentales?.length) {
      y = subseccion(doc, y, "Vulnerabilidades argumentales");
      y = listaBullets(doc, y, arr(discurso.vulnerabilidades_argumentales));
    }
    if (discurso.contraargumentos_sugeridos?.length) {
      y = subseccion(doc, y, "Contraargumentos sugeridos");
      y = addTable(doc, {
        startY: y,
        head: [["Vs eje", "Respuesta"]],
        body: discurso.contraargumentos_sugeridos.map((c: any) => [c.vs_eje, c.respuesta]),
      });
    }
  }

  // ========== CAP: EVALUACIÓN DIGITAL ==========
  if (evalDigital) {
    y = abrirCap("Evaluación digital de redes", "Diagnóstico cuantitativo y cualitativo");
    if (evalDigital.diagnostico_global) {
      y = addKPIs(doc, y, [
        { label: "Score digital", value: String(evalDigital.diagnostico_global.score_digital ?? "—") },
        { label: "Nivel presencia", value: String(evalDigital.diagnostico_global.nivel_presencia ?? "—") },
      ]);
      if (evalDigital.diagnostico_global.resumen_ejecutivo) y = addParagraph(doc, y, evalDigital.diagnostico_global.resumen_ejecutivo);
      if (evalDigital.diagnostico_global.brecha_vs_cargo) y = addParagraph(doc, y, `Brecha vs cargo: ${evalDigital.diagnostico_global.brecha_vs_cargo}`);
    }
    if (evalDigital.estimacion_metricas?.length) {
      y = subseccion(doc, y, "Métricas estimadas");
      y = addTable(doc, {
        startY: y,
        head: [["Plataforma", "Seguidores", "Engagement", "Confianza"]],
        body: evalDigital.estimacion_metricas.map((m: any) => [
          m.plataforma, fmtNum(m.seguidores_estimados), `${m.engagement_estimado}%`, m.confianza,
        ]),
      });
    }
    if (evalDigital.recomendaciones?.length) {
      y = subseccion(doc, y, "Recomendaciones");
      y = listaBullets(doc, y, evalDigital.recomendaciones.map((r: any) =>
        `[${r.prioridad?.toUpperCase()}] ${r.plataforma}: ${r.accion} (KPI: ${r.kpi_objetivo})`
      ));
    }
  }

  // ========== CAP FINAL: METODOLOGÍA Y FUENTES ==========
  y = abrirCap("Metodología, fuentes y notas técnicas", "Cómo se construyó este documento");
  y = addParagraph(doc, y,
    "Este libro de campaña integra todas las capas de inteligencia que la plataforma EME procesa para Michoacán: " +
    "datos electorales históricos del INE e IEM (2018-2024), padrón nominal INE-DERFE 2026, escucha social en medios y redes, " +
    "Google Trends estatal y por candidato, monitoreo de Meta Ad Library, análisis OSINT con IA, detección de " +
    "Comportamiento Coordinado Inauténtico (CIB), detección de cambios de creencias por deriva de sentimiento, " +
    "validación de paridad 2027 con criterios IEM/TEEM, y la estrategia 360 generada por modelos de razonamiento de última generación."
  );
  y = subseccion(doc, y, "Inventario de fuentes utilizadas");
  y = listaBullets(doc, y, [
    `Ficha del candidato: ${candidato.nombre}`,
    metricas?.origen ? `Métricas oficiales: ${metricas.origen}` : "Métricas oficiales: no disponibles",
    `Análisis IA registrados: ${analisis.length} (${analisis.map((a: any) => a.tipo).join(", ") || "ninguno"})`,
    `Resúmenes sociales: ${resumenes.length} corridas · Menciones analizadas: ${menciones.length}`,
    `Google Trends: ${trends.length} corridas · Anuncios Meta: ${metaAds.length}`,
    `Belief shifts: ${beliefShifts.length} · CIB: ${cib.length} · Narrativas sugeridas: ${narrativas.length}`,
    `Alertas de crisis del territorio: ${alertasCrisis.length}`,
    `Histórico municipal (DB): ${historicoMuni.length} ciclos`,
    `Discurso ciudadano estatal: ${discursoCiudadano ? "incluido" : "no disponible"}`,
    `Estrategia 360 base: ${estrategia ? `versión "${estrategia.titulo}" del ${new Date(estrategia.created_at).toLocaleDateString("es-MX")}` : "no generada"}`,
  ]);
  y = subseccion(doc, y, "Modelo de unidad atómica");
  y = addParagraph(doc, y,
    "Toda agregación territorial se construye sumando secciones electorales del catálogo INE. " +
    "Una sección pertenece simultáneamente a Municipio, Distrito Local, Distrito Federal y Estado " +
    "(jerarquía cruzada, no 1:1). Las casillas se clasifican en básica, contigua, extraordinaria y especial. " +
    "Los municipios bajo régimen de autogobierno son tratados como 'sin proceso' y excluidos de los conteos locales."
  );
  y = subseccion(doc, y, "Limitaciones");
  y = listaBullets(doc, y, [
    "Las estimaciones cuantitativas son escenarios probabilísticos, no predicciones.",
    "Los hallazgos OSINT requieren validación legal antes de uso público.",
    "Meta Ads sólo refleja anuncios declarados como político-electorales en la API oficial.",
    "El detector CIB usa heurísticas; no sustituye análisis forense.",
    "La sugerencia de paridad 2027 anticipa criterios IEM/TEEM; lineamientos finales pueden variar.",
    "Documento confidencial · uso interno del war room.",
  ]);

  // ========== CONTRAPORTADA ==========
  doc.addPage();
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  doc.setFillColor(...INK);
  doc.rect(0, 0, w, h, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("EME · Michoacán 360", 36, h / 2 - 30);
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text("Inteligencia electoral verificada · 2018-2027", 36, h / 2 - 10);
  doc.setTextColor(180, 180, 200);
  doc.setFontSize(9);
  doc.text(`Edición generada: ${fmtFecha()}`, 36, h - 60);
  doc.text("Producto verificado por Job Meneses", 36, h - 44);
  doc.text("Documento confidencial · Prohibida su reproducción", 36, h - 30);

  // ========== ÍNDICE EN PÁGINA RESERVADA ==========
  doc.setPage(indiceMarkerPage);
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, w, h, "F");
  doc.setFillColor(...PRIMARY);
  doc.rect(0, 0, w, 80, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("EME · MICHOACÁN 360", 36, 32);
  doc.setFontSize(22);
  doc.text("Índice general", 36, 58);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Libro de campaña · Edición completa", 36, 74);
  doc.setTextColor(...INK);
  let yi = 110;
  doc.setFontSize(11);
  indiceMarker.forEach((s) => {
    if (yi > h - 60) return;
    doc.setTextColor(...PRIMARY);
    doc.setFont("helvetica", "bold");
    doc.text(s.num, 36, yi);
    doc.setTextColor(...INK);
    doc.setFont("helvetica", "normal");
    doc.text(s.titulo, 80, yi);
    doc.setDrawColor(220, 220, 220);
    doc.setLineDashPattern([1, 2], 0);
    doc.line(80 + doc.getTextWidth(s.titulo) + 6, yi - 3, w - 60, yi - 3);
    doc.setLineDashPattern([], 0);
    doc.setTextColor(...SUB);
    doc.text(String(s.pagina), w - 36, yi, { align: "right" });
    yi += 20;
  });

  descargarPDF(doc, `libro-campana-${slug(candidato.nombre)}-${new Date().toISOString().slice(0, 10)}.pdf`);
}

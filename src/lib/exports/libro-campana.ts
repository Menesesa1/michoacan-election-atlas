// LIBRO DE CAMPAÑA — informe integral por candidato
// Compila TODO: perfil, FODA, estrategia 360 (si existe), social listening, Trends,
// Meta Ads, OSINT, narrativa, belief shifts, CIB relevante, histórico territorial,
// proyecciones, calendario, presupuesto, KPIs, anexos.
// Estructura larga, paginada, con portada, índice, secciones numeradas y back-cover.
import { supabase } from "@/integrations/supabase/client";
import {
  createPDF, addHeader, addSection, addParagraph, addKPIs, addTable,
  descargarPDF, fmtFecha, fmtNum, fmtPct, BRAND,
} from "./utils";
import type jsPDF from "jspdf";

const PRIMARY: [number, number, number] = [29, 78, 216];
const INK: [number, number, number] = [15, 23, 42];
const SUB: [number, number, number] = [71, 85, 105];
const ACCENT: [number, number, number] = [124, 58, 237];

const slug = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 50);

const arr = (v: any): string[] =>
  Array.isArray(v) ? v.map(String) : v ? [String(v)] : [];

async function cargarTodo(candidatoId: string) {
  const { data: candidato } = await supabase
    .from("candidatos").select("*").eq("id", candidatoId).maybeSingle();
  if (!candidato) throw new Error("Candidato no encontrado");

  const [
    analisisRes, resumenRes, mencionesRes, trendsRes,
    metaAdsRes, beliefRes, cibRes, estrategiaRes,
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
  };
}

// ========= Helpers de formato =========

function portada(doc: jsPDF, c: any) {
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  // Fondo
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

  // Etiqueta
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(36, h * 0.30, 200, 24, 4, 4, "F");
  doc.setTextColor(...PRIMARY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("LIBRO DE CAMPAÑA · EDICIÓN COMPLETA", 46, h * 0.30 + 16);

  // Título
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(34);
  doc.setFont("helvetica", "bold");
  const lineas = doc.splitTextToSize(c.nombre.toUpperCase(), w - 72);
  doc.text(lineas, 36, h * 0.40);

  doc.setFontSize(14);
  doc.setFont("helvetica", "normal");
  doc.text(`${c.partido} · ${c.cargo_buscado || c.nivel}`, 36, h * 0.40 + 32 + lineas.length * 12);
  doc.text(`${c.territorio}`, 36, h * 0.40 + 50 + lineas.length * 12);

  // Pie
  doc.setFontSize(10);
  doc.text(`Edición: ${fmtFecha()}`, 36, h - 60);
  doc.setFontSize(9);
  doc.text("Documento confidencial · Uso restringido al war room", 36, h - 44);
  doc.text("Producto verificado por Job Meneses · EME", 36, h - 30);
}

function indice(doc: jsPDF, secciones: { num: string; titulo: string; pagina: number }[]) {
  doc.addPage();
  const w = doc.internal.pageSize.getWidth();
  doc.setFillColor(...PRIMARY);
  doc.rect(0, 0, w, 56, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("Índice general", 36, 36);
  doc.setTextColor(...INK);
  let y = 90;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  secciones.forEach((s) => {
    if (y > doc.internal.pageSize.getHeight() - 60) { doc.addPage(); y = 60; }
    doc.setTextColor(...PRIMARY);
    doc.setFont("helvetica", "bold");
    doc.text(s.num, 36, y);
    doc.setTextColor(...INK);
    doc.setFont("helvetica", "normal");
    const tw = doc.getTextWidth(s.titulo);
    doc.text(s.titulo, 80, y);
    doc.setDrawColor(220, 220, 220);
    doc.setLineDashPattern([1, 2], 0);
    doc.line(80 + tw + 6, y - 3, w - 60, y - 3);
    doc.setLineDashPattern([], 0);
    doc.setTextColor(...SUB);
    doc.text(String(s.pagina), w - 36, y, { align: "right" });
    y += 18;
  });
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

// ========= GENERADOR PRINCIPAL =========

export async function descargarLibroDeCampana(candidatoId: string) {
  const data = await cargarTodo(candidatoId);
  const { candidato, analisis, resumenes, menciones, trends, metaAds, beliefShifts, cib, estrategia } = data;

  const doc = createPDF("p");
  portada(doc, candidato);

  const perfil = analisis.find((a: any) => a.tipo === "perfil")?.output_json as any;
  const osint = analisis.find((a: any) => a.tipo === "osint")?.output_json as any;
  const discurso = analisis.find((a: any) => a.tipo === "discurso")?.output_json as any;
  const evalDigital = analisis.find((a: any) => a.tipo === "evaluacion_digital")?.output_json as any;
  const estrat = (estrategia?.output_json ?? null) as any;
  const resumen = resumenes[0];

  // Reservamos espacio para índice (lo escribimos al final con páginas reales)
  const indiceMarker: { num: string; titulo: string; pagina: number }[] = [];
  // Página placeholder para índice
  doc.addPage();
  const indiceMarkerPage = doc.getNumberOfPages();

  // ============ CAP 1: SÍNTESIS EJECUTIVA ============
  let pagInicio = doc.getNumberOfPages() + 1;
  let y = tituloCapitulo(doc, "01", "Síntesis ejecutiva", "Lectura de 90 segundos para el comité estratégico");
  indiceMarker.push({ num: "01", titulo: "Síntesis ejecutiva", pagina: pagInicio });

  const tipoLabel = candidato.es_propio ? "Candidatura propia" : "Contendiente externo";
  y = addParagraph(doc, y,
    `${candidato.nombre} (${candidato.partido}) compite por ${candidato.cargo_buscado || candidato.nivel} en ${candidato.territorio}. ` +
    `Fase actual: ${candidato.fase}. Clasificación interna: ${tipoLabel}. ` +
    (candidato.bio_breve ? candidato.bio_breve : "Aún no se registra biografía operativa.")
  );

  y = addKPIs(doc, y, [
    { label: "Menciones 7d", value: fmtNum(resumen?.total_menciones ?? 0) },
    { label: "Sentimiento", value: (resumen?.sentimiento_promedio ?? 0).toFixed(2),
      color: (resumen?.sentimiento_promedio ?? 0) >= 0 ? BRAND.ok : BRAND.bad },
    { label: "% Positivo", value: fmtPct(resumen?.pct_positivo) },
    { label: "% Negativo", value: fmtPct(resumen?.pct_negativo), color: BRAND.bad },
  ]);

  y = addKPIs(doc, y, [
    { label: "Anuncios Meta", value: fmtNum(metaAds.length) },
    { label: "Inversión Meta MXN", value: fmtNum(metaAds.reduce((s, a) => s + (Number(a.spend_upper) || 0), 0)) },
    { label: "Pico Trends", value: fmtNum(trends[0]?.pico_interes ?? 0, 0) },
    { label: "Belief shifts", value: fmtNum(beliefShifts.length) },
  ]);

  if (perfil?.resumen) {
    y = subseccion(doc, y, "Lectura del analista");
    y = addParagraph(doc, y, perfil.resumen);
  }

  // ============ CAP 2: PERFIL Y TRAYECTORIA ============
  pagInicio = doc.getNumberOfPages() + 1;
  y = tituloCapitulo(doc, "02", "Perfil y trayectoria", "Quién es, de dónde viene, qué representa");
  indiceMarker.push({ num: "02", titulo: "Perfil y trayectoria", pagina: pagInicio });

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
      ["Tags", arr(candidato.tags).join(", ") || "—"],
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
    if (perfil.fortalezas?.length) {
      y = addParagraph(doc, y, "FORTALEZAS");
      y = listaBullets(doc, y, arr(perfil.fortalezas));
    }
    if (perfil.debilidades?.length) {
      y = addParagraph(doc, y, "DEBILIDADES");
      y = listaBullets(doc, y, arr(perfil.debilidades));
    }
    if (perfil.oportunidades?.length) {
      y = addParagraph(doc, y, "OPORTUNIDADES");
      y = listaBullets(doc, y, arr(perfil.oportunidades));
    }
    if (perfil.amenazas?.length) {
      y = addParagraph(doc, y, "AMENAZAS");
      y = listaBullets(doc, y, arr(perfil.amenazas));
    }
  }

  // ============ CAP 3: TERRITORIO Y CONTEXTO ============
  pagInicio = doc.getNumberOfPages() + 1;
  y = tituloCapitulo(doc, "03", "Territorio y contexto electoral", "El terreno donde se libra la batalla");
  indiceMarker.push({ num: "03", titulo: "Territorio y contexto electoral", pagina: pagInicio });

  y = addParagraph(doc, y,
    `El territorio de competencia es ${candidato.territorio}, en el nivel ${candidato.nivel}. ` +
    `Michoacán organiza sus elecciones en 113 municipios, 24 distritos locales y 11 distritos federales, ` +
    `con la sección electoral como unidad atómica. Los municipios de autogobierno (Cherán, Nahuatzen y otros) ` +
    `no instalan casillas locales y se procesan como "sin proceso", no como datos faltantes.`
  );

  if (estrat?.meta_victoria) {
    const mv = estrat.meta_victoria;
    y = subseccion(doc, y, "Camino a la victoria · estimación cuantitativa");
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

  // ============ CAP 4: ESCUCHA SOCIAL Y CONVERSACIÓN ============
  pagInicio = doc.getNumberOfPages() + 1;
  y = tituloCapitulo(doc, "04", "Escucha social y conversación", "Qué dicen, cómo lo dicen, qué sienten");
  indiceMarker.push({ num: "04", titulo: "Escucha social y conversación", pagina: pagInicio });

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
    y = subseccion(doc, y, `Menciones recientes representativas (top ${Math.min(menciones.length, 25)})`);
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

  // ============ CAP 5: BELIEF SHIFTS Y CIB ============
  pagInicio = doc.getNumberOfPages() + 1;
  y = tituloCapitulo(doc, "05", "Cambios de creencias y comportamiento coordinado",
    "Movimientos en la opinión pública y operaciones detectadas");
  indiceMarker.push({ num: "05", titulo: "Cambios de creencias y CIB", pagina: pagInicio });

  if (beliefShifts.length) {
    y = subseccion(doc, y, "Belief shift detector");
    y = addTable(doc, {
      startY: y,
      head: [["Fecha", "Tipo", "Severidad", "Δ", "Título"]],
      body: beliefShifts.map((s: any) => [
        new Date(s.detectado_en).toLocaleDateString("es-MX"),
        s.tipo_shift.replace("_", " "),
        s.severidad,
        s.delta != null ? Number(s.delta).toFixed(2) : "—",
        (s.titulo || "").slice(0, 60),
      ]),
    });
    beliefShifts.slice(0, 4).forEach((s: any) => { y = addParagraph(doc, y, `• ${s.titulo} — ${s.descripcion}`); });
  } else {
    y = addParagraph(doc, y, "Aún no se han detectado cambios significativos de creencias para este candidato.");
  }

  if (cib.length) {
    y = subseccion(doc, y, "Comportamiento Coordinado Inauténtico (CIB)");
    y = addTable(doc, {
      startY: y,
      head: [["Fecha", "Patrón", "Severidad", "Descripción"]],
      body: cib.map((c: any) => [
        new Date(c.detectada_en).toLocaleDateString("es-MX"),
        c.tipo_patron.replace("_", " "),
        c.severidad,
        (c.descripcion || c.titulo || "").slice(0, 80),
      ]),
    });
  }

  // ============ CAP 6: GOOGLE TRENDS ============
  pagInicio = doc.getNumberOfPages() + 1;
  y = tituloCapitulo(doc, "06", "Google Trends y búsqueda activa", "Qué busca Michoacán sobre el candidato");
  indiceMarker.push({ num: "06", titulo: "Google Trends y búsqueda activa", pagina: pagInicio });

  if (trends.length) {
    y = addTable(doc, {
      startY: y,
      head: [["Término", "Promedio", "Pico", "Última corrida"]],
      body: trends.map((t: any) => [t.termino, fmtNum(t.promedio_interes, 1), fmtNum(t.pico_interes, 1), fmtFecha(t.ejecutada_en)]),
    });
    if (trends[0]?.contexto_narrativo) y = addParagraph(doc, y, `Contexto narrativo: ${trends[0].contexto_narrativo}`);
    const top = trends[0]?.related_top;
    if (Array.isArray(top) && top.length) {
      y = subseccion(doc, y, "Búsquedas relacionadas top");
      y = listaBullets(doc, y, top.slice(0, 10).map((r: any) => `${r.query || r.value} (${r.value || r.score || ""})`));
    }
  } else {
    y = addParagraph(doc, y, "Sin corridas de Google Trends para este candidato. Ejecuta el módulo Trends en la ficha para poblar esta sección.");
  }

  // ============ CAP 7: META ADS / PUBLICIDAD DIGITAL ============
  pagInicio = doc.getNumberOfPages() + 1;
  y = tituloCapitulo(doc, "07", "Publicidad digital · Meta Ads Library", "Qué se está pagando en redes");
  indiceMarker.push({ num: "07", titulo: "Publicidad digital · Meta Ads", pagina: pagInicio });

  if (metaAds.length) {
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
  } else {
    y = addParagraph(doc, y, "Sin anuncios activos detectados en Meta Ad Library. Ejecuta el monitor desde la ficha del candidato para refrescar.");
  }

  // ============ CAP 8: OSINT Y RIESGO REPUTACIONAL ============
  pagInicio = doc.getNumberOfPages() + 1;
  y = tituloCapitulo(doc, "08", "OSINT y riesgo reputacional", "Hallazgos abiertos sobre el candidato");
  indiceMarker.push({ num: "08", titulo: "OSINT y riesgo reputacional", pagina: pagInicio });

  if (osint?.hallazgos && Array.isArray(osint.hallazgos)) {
    y = addTable(doc, {
      startY: y,
      head: [["Severidad", "Hallazgo", "Fuente"]],
      body: osint.hallazgos.slice(0, 20).map((h: any) => [
        h.severidad || "—", h.descripcion || h.titulo || "—", h.fuente || "—",
      ]),
    });
  } else {
    y = addParagraph(doc, y, "No hay hallazgos OSINT estructurados aún. Genera el análisis OSINT desde la ficha del candidato.");
  }
  if (osint?.resumen) y = addParagraph(doc, y, osint.resumen);

  // ============ CAP 9: ESTRATEGIA 360 ============
  if (estrat) {
    pagInicio = doc.getNumberOfPages() + 1;
    y = tituloCapitulo(doc, "09", "Estrategia 360", `Plan integral · ${estrategia?.titulo || "última versión"}`);
    indiceMarker.push({ num: "09", titulo: "Estrategia 360", pagina: pagInicio });

    if (estrat.resumen_ejecutivo) y = addParagraph(doc, y, estrat.resumen_ejecutivo);

    if (estrat.narrativa_central) {
      y = subseccion(doc, y, "Narrativa central");
      if (estrat.narrativa_central.slogan) y = citaDestacada(doc, y, estrat.narrativa_central.slogan);
      if (estrat.narrativa_central.tesis) y = addParagraph(doc, y, estrat.narrativa_central.tesis);
      if (estrat.narrativa_central.tres_pilares?.length) {
        y = listaBullets(doc, y, estrat.narrativa_central.tres_pilares);
      }
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

  // ============ CAP 10: ESTRATEGIA DE COMUNICACIÓN ============
  if (estrat?.estrategia_digital_comunicacion) {
    const ec = estrat.estrategia_digital_comunicacion;
    pagInicio = doc.getNumberOfPages() + 1;
    y = tituloCapitulo(doc, "10", "Estrategia de comunicación 360", "Mensaje, plataformas, voceros, crisis");
    indiceMarker.push({ num: "10", titulo: "Estrategia de comunicación 360", pagina: pagInicio });

    y = subseccion(doc, y, "Diagnóstico de sentimiento");
    y = addParagraph(doc, y, `Tono actual: ${ec.diagnostico_sentimiento?.tono_actual?.toUpperCase()}`);
    if (ec.diagnostico_sentimiento?.sintesis) y = addParagraph(doc, y, ec.diagnostico_sentimiento.sintesis);

    y = subseccion(doc, y, "Arquitectura de mensaje");
    if (ec.arquitectura_mensaje?.eje_emocional) y = addParagraph(doc, y, `Eje emocional: ${ec.arquitectura_mensaje.eje_emocional}`);
    if (ec.arquitectura_mensaje?.eje_racional) y = addParagraph(doc, y, `Eje racional: ${ec.arquitectura_mensaje.eje_racional}`);
    if (ec.arquitectura_mensaje?.frases_paraguas?.length) {
      ec.arquitectura_mensaje.frases_paraguas.slice(0, 3).forEach((f: string) => { y = citaDestacada(doc, y, f); });
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
        body: (["lunes","martes","miercoles","jueves","viernes","sabado","domingo"] as const).map((d) => [
          d.toUpperCase(), ec.calendario_contenido_semanal[d] || "—",
        ]),
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

  // ============ CAP 11: DISCURSO Y NARRATIVA ============
  pagInicio = doc.getNumberOfPages() + 1;
  y = tituloCapitulo(doc, "11", "Discurso recomendado", "Qué decir, qué evitar, cómo encuadrar");
  indiceMarker.push({ num: "11", titulo: "Discurso recomendado", pagina: pagInicio });

  if (discurso) {
    if (discurso.que_decir) {
      y = subseccion(doc, y, "Qué decir");
      y = listaBullets(doc, y, arr(discurso.que_decir));
    }
    if (discurso.que_evitar) {
      y = subseccion(doc, y, "Qué evitar");
      y = listaBullets(doc, y, arr(discurso.que_evitar));
    }
    if (discurso.frases_clave) {
      y = subseccion(doc, y, "Frases clave");
      arr(discurso.frases_clave).slice(0, 5).forEach((f) => { y = citaDestacada(doc, y, f); });
    }
  } else {
    y = addParagraph(doc, y, "Genera el módulo de Discurso Ciudadano desde la ficha para poblar esta sección.");
  }

  // ============ CAP 12: EVALUACIÓN DIGITAL ============
  if (evalDigital) {
    pagInicio = doc.getNumberOfPages() + 1;
    y = tituloCapitulo(doc, "12", "Evaluación digital de redes", "Diagnóstico cuantitativo y cualitativo");
    indiceMarker.push({ num: "12", titulo: "Evaluación digital de redes", pagina: pagInicio });
    if (evalDigital.score_global != null) {
      y = addKPIs(doc, y, [
        { label: "Score global", value: String(evalDigital.score_global) },
        { label: "Engagement", value: String(evalDigital.engagement || "—") },
        { label: "Crecimiento", value: String(evalDigital.crecimiento || "—") },
        { label: "Calidad", value: String(evalDigital.calidad_contenido || "—") },
      ]);
    }
    if (evalDigital.diagnostico) y = addParagraph(doc, y, evalDigital.diagnostico);
    if (evalDigital.recomendaciones?.length) {
      y = subseccion(doc, y, "Recomendaciones");
      y = listaBullets(doc, y, arr(evalDigital.recomendaciones));
    }
  }

  // ============ CAP FINAL: METODOLOGÍA Y FUENTES ============
  pagInicio = doc.getNumberOfPages() + 1;
  y = tituloCapitulo(doc, "A", "Metodología, fuentes y notas técnicas", "Cómo se construyó este documento");
  indiceMarker.push({ num: "A", titulo: "Metodología y fuentes", pagina: pagInicio });

  y = addParagraph(doc, y,
    "Este libro de campaña integra todas las capas de inteligencia que la plataforma EME procesa para Michoacán: " +
    "datos electorales históricos del INE e IEM (2018-2024), padrón nominal, escucha social en medios y redes, " +
    "Google Trends estatal y por candidato, monitoreo de Meta Ad Library, análisis OSINT con IA, detección de " +
    "Comportamiento Coordinado Inauténtico (CIB), detección de cambios de creencias por deriva de sentimiento, " +
    "y la estrategia 360 generada por modelos de razonamiento de última generación."
  );

  y = subseccion(doc, y, "Inventario de fuentes utilizadas");
  y = listaBullets(doc, y, [
    `Tabla candidatos: ficha completa de ${candidato.nombre}`,
    `Análisis IA registrados: ${analisis.length} (${analisis.map((a: any) => a.tipo).join(", ") || "ninguno"})`,
    `Resúmenes sociales: ${resumenes.length} corridas`,
    `Menciones sociales analizadas: ${menciones.length}`,
    `Corridas Google Trends: ${trends.length}`,
    `Anuncios Meta capturados: ${metaAds.length}`,
    `Belief shifts detectados: ${beliefShifts.length}`,
    `Alertas CIB asociadas: ${cib.length}`,
    `Estrategia 360 base: ${estrategia ? `versión "${estrategia.titulo}" del ${new Date(estrategia.created_at).toLocaleDateString("es-MX")}` : "no generada"}`,
  ]);

  y = subseccion(doc, y, "Modelo de unidad atómica");
  y = addParagraph(doc, y,
    "Toda agregación territorial se construye sumando secciones electorales del catálogo INE. " +
    "Una sección pertenece simultáneamente a Municipio, Distrito Local, Distrito Federal y Estado " +
    "(jerarquía cruzada, no 1:1). Las casillas se clasifican en básica, contigua, extraordinaria y especial. " +
    "Los municipios bajo régimen de autogobierno son tratados como 'sin proceso' y excluidos de los conteos locales."
  );

  y = subseccion(doc, y, "Limitaciones y advertencias");
  y = listaBullets(doc, y, [
    "Las estimaciones cuantitativas (votos objetivo, % de apoyo, ROI por zona) son escenarios probabilísticos, no predicciones.",
    "Los hallazgos OSINT requieren validación legal antes de usarse en comunicación pública.",
    "El monitoreo de Meta Ads sólo refleja anuncios declarados como político-electorales en la API oficial.",
    "El detector CIB usa heurísticas (Jaccard ≥0.7, z-score, dominación de fuente, ráfaga temporal); no sustituye análisis forense.",
    "Este documento es confidencial y de uso interno del war room.",
  ]);

  // ============ CONTRAPORTADA ============
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

  // ============ ESCRIBIR ÍNDICE EN PÁGINA RESERVADA ============
  // Reescribir la página del índice
  doc.setPage(indiceMarkerPage);
  // Limpiar página (dibujar fondo blanco encima)
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, w, h, "F");
  // Header del índice
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
    if (yi > h - 60) return; // evitar desbordar la página única del índice
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

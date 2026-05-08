// Reporte mensual de monitoreo (estilo Ernesto Núñez) + Diagnóstico táctico
// Soporta comparación con un segundo candidato y split rol candidato/funcionario.
import { supabase } from "@/integrations/supabase/client";
import {
  createPDF,
  addHeader,
  addSection,
  addParagraph,
  addKPIs,
  addTable,
  descargarPDF,
  fmtFecha,
  fmtNum,
  fmtPct,
  BRAND,
} from "./utils";

interface Mencion {
  id: string;
  titulo: string;
  fragmento: string | null;
  fuente: string | null;
  tema: string | null;
  sentimiento: number;
  detectada_en: string;
  url: string | null;
}

interface Candidato {
  id: string;
  nombre: string;
  partido: string;
  nivel: string;
  territorio: string;
  cargo_buscado: string | null;
  cargo_publico_actual: string | null;
  es_funcionario_publico: boolean;
  bio_breve: string | null;
}

export interface OpcionesReporte {
  candidatoId: string;
  comparativoId?: string | null;
  desde: Date;
  hasta: Date;
  splitRol?: boolean; // sólo si es funcionario público
}

async function cargarCandidato(id: string): Promise<Candidato> {
  const { data, error } = await supabase
    .from("candidatos")
    .select(
      "id, nombre, partido, nivel, territorio, cargo_buscado, cargo_publico_actual, es_funcionario_publico, bio_breve",
    )
    .eq("id", id)
    .maybeSingle();
  if (error || !data) throw new Error("Candidato no encontrado");
  return data as Candidato;
}

async function cargarMenciones(
  candidatoId: string,
  desde: Date,
  hasta: Date,
): Promise<Mencion[]> {
  const { data, error } = await supabase
    .from("social_menciones")
    .select("id, titulo, fragmento, fuente, tema, sentimiento, detectada_en, url")
    .eq("candidato_id", candidatoId)
    .gte("detectada_en", desde.toISOString())
    .lte("detectada_en", hasta.toISOString())
    .order("detectada_en", { ascending: true })
    .limit(2000);
  if (error) throw error;
  return (data ?? []) as Mencion[];
}

async function cargarClasificaciones(
  candidatoId: string,
): Promise<Map<string, "candidato" | "funcionario" | "ambos" | "indefinido">> {
  const { data } = await supabase
    .from("mencion_rol_clasificacion")
    .select("mencion_id, rol")
    .eq("candidato_id", candidatoId);
  const m = new Map();
  for (const r of data ?? []) m.set(r.mencion_id, r.rol);
  return m;
}

async function disparaClasificacion(
  candidatoId: string,
  desde: Date,
  hasta: Date,
) {
  await supabase.functions.invoke("clasificar-rol-menciones", {
    body: {
      candidato_id: candidatoId,
      desde: desde.toISOString(),
      hasta: hasta.toISOString(),
    },
  });
}

function agruparPorDia(menciones: Mencion[], desde: Date, hasta: Date) {
  const dias = new Map<string, number>();
  const cursor = new Date(desde);
  while (cursor <= hasta) {
    dias.set(cursor.toISOString().slice(0, 10), 0);
    cursor.setDate(cursor.getDate() + 1);
  }
  for (const m of menciones) {
    const k = m.detectada_en.slice(0, 10);
    dias.set(k, (dias.get(k) ?? 0) + 1);
  }
  return Array.from(dias.entries());
}

function agruparPorSemana(menciones: Mencion[]) {
  const sem = new Map<string, number>();
  for (const m of menciones) {
    const d = new Date(m.detectada_en);
    const inicio = new Date(d);
    inicio.setDate(d.getDate() - d.getDay());
    const k = inicio.toISOString().slice(0, 10);
    sem.set(k, (sem.get(k) ?? 0) + 1);
  }
  return Array.from(sem.entries()).sort();
}

function sentimientoPcts(menciones: Mencion[]) {
  if (!menciones.length) return { pos: 0, neu: 0, neg: 0, prom: 0 };
  let pos = 0, neg = 0, neu = 0, sum = 0;
  for (const m of menciones) {
    sum += m.sentimiento;
    if (m.sentimiento > 0.15) pos++;
    else if (m.sentimiento < -0.15) neg++;
    else neu++;
  }
  const t = menciones.length;
  return {
    pos: (pos / t) * 100,
    neu: (neu / t) * 100,
    neg: (neg / t) * 100,
    prom: sum / t,
  };
}

function topMedios(menciones: Mencion[], n = 10) {
  const m = new Map<string, number>();
  for (const x of menciones) {
    const k = x.fuente?.trim() || "Sin fuente";
    m.set(k, (m.get(k) ?? 0) + 1);
  }
  return Array.from(m.entries()).sort((a, b) => b[1] - a[1]).slice(0, n);
}

function topTemas(menciones: Mencion[], n = 6) {
  const m = new Map<string, { count: number; ejemplos: string[] }>();
  for (const x of menciones) {
    if (!x.tema) continue;
    const cur = m.get(x.tema) ?? { count: 0, ejemplos: [] };
    cur.count++;
    if (cur.ejemplos.length < 2) cur.ejemplos.push(x.titulo);
    m.set(x.tema, cur);
  }
  return Array.from(m.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, n);
}

function picoDelMes(menciones: Mencion[]) {
  const dias = new Map<string, { count: number; ejemplo: string }>();
  for (const m of menciones) {
    const k = m.detectada_en.slice(0, 10);
    const cur = dias.get(k) ?? { count: 0, ejemplo: m.titulo };
    cur.count++;
    dias.set(k, cur);
  }
  let max = { fecha: "—", count: 0, ejemplo: "—" };
  for (const [fecha, v] of dias) {
    if (v.count > max.count) max = { fecha, count: v.count, ejemplo: v.ejemplo };
  }
  return max;
}

// ──────────────────────────────────────────────────────────────────
// Bloque que dibuja secciones por subset (para split rol)
function bloqueDeSubset(
  doc: any,
  y: number,
  titulo: string,
  menciones: Mencion[],
  candNombre: string,
): number {
  if (!menciones.length) {
    y = addSection(doc, y, titulo);
    y = addParagraph(doc, y, "Sin menciones registradas en este rol durante el periodo.");
    return y;
  }
  y = addSection(doc, y, titulo);

  const sent = sentimientoPcts(menciones);
  const pico = picoDelMes(menciones);

  y = addKPIs(doc, y, [
    { label: "Menciones", value: fmtNum(menciones.length) },
    { label: "Sentimiento", value: sent.prom.toFixed(2), color: sent.prom >= 0 ? BRAND.ok : BRAND.bad },
    { label: "Pico", value: `${pico.count}` },
    { label: "Día pico", value: pico.fecha },
  ]);

  y = addKPIs(doc, y, [
    { label: "% Positivo", value: fmtPct(sent.pos), color: BRAND.ok },
    { label: "% Neutro", value: fmtPct(sent.neu) },
    { label: "% Negativo", value: fmtPct(sent.neg), color: BRAND.bad },
  ]);

  // Temas
  const temas = topTemas(menciones, 6);
  if (temas.length) {
    y = addTable(doc, {
      startY: y,
      head: [["Tema", "Menciones", "Ejemplo"]],
      body: temas.map(([t, v]) => [t, String(v.count), v.ejemplos[0]?.slice(0, 80) ?? "—"]),
    });
  }

  // Pico narrativo
  y = addParagraph(
    doc,
    y,
    `Pico del periodo: ${pico.fecha} con ${pico.count} menciones. Tema dominante: "${pico.ejemplo.slice(0, 140)}". ${candNombre} concentra la conversación pública en torno a esta narrativa durante esa ventana.`,
  );
  return y;
}

// ──────────────────────────────────────────────────────────────────
export async function generarReporteMensual(opts: OpcionesReporte) {
  const cand = await cargarCandidato(opts.candidatoId);
  const menciones = await cargarMenciones(opts.candidatoId, opts.desde, opts.hasta);

  const necesitaSplit = opts.splitRol && cand.es_funcionario_publico;
  let clsMap: Map<string, string> = new Map();
  if (necesitaSplit) {
    await disparaClasificacion(opts.candidatoId, opts.desde, opts.hasta);
    clsMap = await cargarClasificaciones(opts.candidatoId);
  }

  let comp: Candidato | null = null;
  let mencionesComp: Mencion[] = [];
  if (opts.comparativoId) {
    comp = await cargarCandidato(opts.comparativoId);
    mencionesComp = await cargarMenciones(opts.comparativoId, opts.desde, opts.hasta);
  }

  const doc = createPDF("p");
  const periodo = `${opts.desde.toLocaleDateString("es-MX", { day: "2-digit", month: "short" })} – ${opts.hasta.toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })}`;
  addHeader(doc, `Reporte mensual · ${cand.nombre}`, periodo);
  let y = 80;

  // PORTADA / lectura ejecutiva
  y = addSection(doc, y, "Lectura ejecutiva");
  const sentTotal = sentimientoPcts(menciones);
  const ejecutiva = [
    `${cand.nombre} (${cand.partido}) — ${cand.cargo_buscado || cand.nivel} · ${cand.territorio}.`,
    cand.es_funcionario_publico && cand.cargo_publico_actual
      ? `Cargo público actual: ${cand.cargo_publico_actual}. El reporte separa la conversación en su rol de candidato y en su rol de funcionario.`
      : `Reporte del periodo ${periodo}.`,
    `Total de menciones detectadas: ${menciones.length}, sentimiento promedio ${sentTotal.prom.toFixed(2)} (${fmtPct(sentTotal.pos)} positivo / ${fmtPct(sentTotal.neg)} negativo).`,
    comp
      ? `Comparativo con ${comp.nombre} (${comp.partido}): ${mencionesComp.length} menciones en el mismo periodo.`
      : "",
  ]
    .filter(Boolean)
    .join(" ");
  y = addParagraph(doc, y, ejecutiva);

  // KPIs principales
  y = addKPIs(doc, y, [
    { label: "Menciones totales", value: fmtNum(menciones.length) },
    { label: "Sentimiento", value: sentTotal.prom.toFixed(2), color: sentTotal.prom >= 0 ? BRAND.ok : BRAND.bad },
    { label: "Medios únicos", value: fmtNum(new Set(menciones.map((m) => m.fuente)).size) },
    { label: "Días con act.", value: fmtNum(new Set(menciones.map((m) => m.detectada_en.slice(0, 10))).size) },
  ]);

  // Tabla por semana
  const semanas = agruparPorSemana(menciones);
  if (semanas.length) {
    y = addSection(doc, y, "Volumen semanal");
    y = addTable(doc, {
      startY: y,
      head: [["Semana", "Menciones"]],
      body: semanas.map(([k, v]) => [k, String(v)]),
    });
  }

  // Tabla por día
  const dias = agruparPorDia(menciones, opts.desde, opts.hasta);
  if (dias.length) {
    y = addSection(doc, y, "Distribución diaria");
    y = addTable(doc, {
      startY: y,
      head: [["Día", "Menciones"]],
      body: dias.map(([k, v]) => [k, String(v)]),
    });
  }

  // SPLIT por rol si aplica
  if (necesitaSplit) {
    const candidatoSet = menciones.filter((m) => {
      const r = clsMap.get(m.id);
      return r === "candidato" || r === "ambos";
    });
    const funcionarioSet = menciones.filter((m) => {
      const r = clsMap.get(m.id);
      return r === "funcionario" || r === "ambos";
    });

    doc.addPage();
    y = 80;
    y = addSection(doc, y, "ROL CANDIDATO — actividad de campaña");
    y = bloqueDeSubset(doc, y, "Resumen como candidato", candidatoSet, cand.nombre);

    doc.addPage();
    y = 80;
    y = addSection(doc, y, `ROL FUNCIONARIO — ${cand.cargo_publico_actual ?? "gestión institucional"}`);
    y = bloqueDeSubset(doc, y, "Resumen como funcionario público", funcionarioSet, cand.nombre);
  } else {
    // Bloque único
    doc.addPage();
    y = 80;
    y = bloqueDeSubset(doc, y, "Análisis temático y narrativas", menciones, cand.nombre);
  }

  // Top medios
  const medios = topMedios(menciones, 12);
  if (medios.length) {
    y = addSection(doc, y, "Relación de medios");
    y = addTable(doc, {
      startY: y,
      head: [["#", "Medio", "Menciones"]],
      body: medios.map(([m, v], i) => [String(i + 1), m, String(v)]),
    });
  }

  // COMPARATIVO
  if (comp) {
    doc.addPage();
    y = 80;
    addHeader(doc, `Comparativa · ${cand.nombre} vs ${comp.nombre}`, periodo);
    y = 80;
    y = addSection(doc, y, "Comparativo de cobertura");
    const sentComp = sentimientoPcts(mencionesComp);

    y = addTable(doc, {
      startY: y,
      head: [["Indicador", cand.nombre, comp.nombre, "Diferencial"]],
      body: [
        ["Menciones totales", fmtNum(menciones.length), fmtNum(mencionesComp.length), fmtNum(menciones.length - mencionesComp.length)],
        ["Sentimiento promedio", sentTotal.prom.toFixed(2), sentComp.prom.toFixed(2), (sentTotal.prom - sentComp.prom).toFixed(2)],
        ["% Positivo", fmtPct(sentTotal.pos), fmtPct(sentComp.pos), fmtPct(sentTotal.pos - sentComp.pos)],
        ["% Negativo", fmtPct(sentTotal.neg), fmtPct(sentComp.neg), fmtPct(sentTotal.neg - sentComp.neg)],
        ["Medios únicos", String(new Set(menciones.map((m) => m.fuente)).size), String(new Set(mencionesComp.map((m) => m.fuente)).size), "—"],
      ],
    });

    // Comparativo semanal
    const semA = new Map(agruparPorSemana(menciones));
    const semB = new Map(agruparPorSemana(mencionesComp));
    const todas = Array.from(new Set([...semA.keys(), ...semB.keys()])).sort();
    if (todas.length) {
      y = addSection(doc, y, "Comparativo semanal");
      y = addTable(doc, {
        startY: y,
        head: [["Semana", cand.nombre, comp.nombre]],
        body: todas.map((k) => [k, String(semA.get(k) ?? 0), String(semB.get(k) ?? 0)]),
      });
    }

    // Lectura comparativa
    const dom =
      menciones.length > mencionesComp.length
        ? `${cand.nombre} domina la conversación con ${menciones.length - mencionesComp.length} menciones de ventaja.`
        : menciones.length < mencionesComp.length
          ? `${comp.nombre} lleva la delantera mediática con ${mencionesComp.length - menciones.length} menciones más.`
          : `Ambos contendientes presentan volúmenes equivalentes.`;
    y = addParagraph(
      doc,
      y,
      `${dom} El sentimiento neto favorece a ${sentTotal.prom >= sentComp.prom ? cand.nombre : comp.nombre} con un diferencial de ${Math.abs(sentTotal.prom - sentComp.prom).toFixed(2)} puntos.`,
    );
  }

  // CONCLUSIONES
  doc.addPage();
  y = 80;
  y = addSection(doc, y, "Conclusiones de mando");
  const pico = picoDelMes(menciones);
  const conclusiones = [
    `1. Volumen y consistencia: el periodo registra ${menciones.length} menciones distribuidas en ${new Set(menciones.map((m) => m.detectada_en.slice(0, 10))).size} días con actividad. La presencia mediática de ${cand.nombre} ${menciones.length > 30 ? "se mantiene activa" : "es discreta"} y requiere ${menciones.length > 30 ? "sostener el ritmo" : "intensificar la generación de notas"}.`,
    `2. Eje narrativo: el pico se observa el ${pico.fecha} (${pico.count} menciones) en torno a "${pico.ejemplo.slice(0, 120)}". Convertirlo en mensaje rector para las próximas semanas amplifica el retorno mediático.`,
    `3. Tono percibido: con ${fmtPct(sentTotal.pos)} positivo y ${fmtPct(sentTotal.neg)} negativo, la conversación es ${sentTotal.prom >= 0.15 ? "favorable" : sentTotal.prom <= -0.15 ? "adversa" : "mayormente neutra"}. ${sentTotal.neg > 25 ? "Conviene activar protocolo de respuesta para los temas negativos detectados." : "Hay margen para reforzar el contraste con la oposición sin riesgo reputacional inmediato."}`,
    necesitaSplit
      ? `4. Doble rol: la separación candidato vs funcionario evita confusiones de marca; el equipo debe mantener disciplina narrativa para que la gestión institucional no canibalice los actos de campaña ni viceversa.`
      : `4. Próximos pasos: incrementar la diversificación de medios y abrir espacio para narrativa propositiva más allá de la coyuntura.`,
  ];
  for (const c of conclusiones) y = addParagraph(doc, y, c);

  const slug = cand.nombre.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40);
  descargarPDF(
    doc,
    `reporte-mensual-${slug}-${opts.desde.toISOString().slice(0, 10)}.pdf`,
  );
}

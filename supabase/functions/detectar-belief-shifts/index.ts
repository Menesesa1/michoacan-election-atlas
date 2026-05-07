// Edge function: detectar-belief-shifts
// Detecta cambios de creencias por entidad comparando dos ventanas de social_resumen:
//   - actual:   últimas 48h
//   - baseline: 7 días previos a esa ventana
// Heurísticas:
//   1. deriva_sentimiento: |Δsentimiento_promedio| ≥ 0.25
//   2. polarizacion: pct_negativo sube ≥ 20 puntos
//   3. tema_emergente: tema en top actual con ≥3 menciones que NO estaba en baseline
//   4. tema_abandonado: tema dominante en baseline (≥5 menc) que cae a 0 en actual
import { createClient } from "npm:@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ResumenRow {
  entidad_nombre: string;
  entidad_tipo: string;
  candidato_id: string | null;
  generado_en: string;
  total_menciones: number;
  sentimiento_promedio: number | null;
  pct_positivo: number | null;
  pct_negativo: number | null;
  pct_neutro: number | null;
  top_temas: any;
}

interface TemaCount { value: string; count: number }

function normalizarTemas(top: any): TemaCount[] {
  if (!Array.isArray(top)) return [];
  return top
    .map((t: any) => ({
      value: String(t.value ?? t.tema ?? "").toLowerCase().trim(),
      count: Number(t.count ?? t.n ?? 0),
    }))
    .filter((t) => t.value && t.count > 0);
}

function agregarTemas(rows: ResumenRow[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const r of rows) {
    for (const t of normalizarTemas(r.top_temas)) {
      m.set(t.value, (m.get(t.value) ?? 0) + t.count);
    }
  }
  return m;
}

function promedioPonderado(rows: ResumenRow[], campo: keyof ResumenRow): number | null {
  let num = 0, den = 0;
  for (const r of rows) {
    const v = r[campo] as number | null;
    if (v == null) continue;
    const w = r.total_menciones || 1;
    num += Number(v) * w;
    den += w;
  }
  return den === 0 ? null : num / den;
}

function severidadDelta(abs: number): string {
  if (abs >= 0.5) return "critica";
  if (abs >= 0.35) return "alta";
  if (abs >= 0.25) return "media";
  return "baja";
}
function severidadPct(abs: number): string {
  if (abs >= 40) return "critica";
  if (abs >= 30) return "alta";
  if (abs >= 20) return "media";
  return "baja";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const startedAt = Date.now();

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return new Response(JSON.stringify({ error: "Faltan envs" }), { status: 500, headers: corsHeaders });
  }
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const ahora = new Date();
  const corteActual = new Date(ahora.getTime() - 48 * 3600 * 1000);
  const corteBaseline = new Date(ahora.getTime() - 9 * 24 * 3600 * 1000);
  const batchId = crypto.randomUUID();

  const { data: resumenes, error: errRes } = await supabase
    .from("social_resumen")
    .select("entidad_nombre, entidad_tipo, candidato_id, generado_en, total_menciones, sentimiento_promedio, pct_positivo, pct_negativo, pct_neutro, top_temas")
    .gte("generado_en", corteBaseline.toISOString())
    .order("generado_en", { ascending: false })
    .limit(5000);

  if (errRes) {
    return new Response(JSON.stringify({ error: errRes.message }), { status: 500, headers: corsHeaders });
  }

  const filas = (resumenes ?? []) as ResumenRow[];
  const porEntidad = new Map<string, ResumenRow[]>();
  for (const r of filas) {
    if (!porEntidad.has(r.entidad_nombre)) porEntidad.set(r.entidad_nombre, []);
    porEntidad.get(r.entidad_nombre)!.push(r);
  }

  const shifts: any[] = [];

  for (const [entidad, rows] of porEntidad) {
    const actual = rows.filter((r) => new Date(r.generado_en) >= corteActual);
    const baseline = rows.filter((r) => new Date(r.generado_en) < corteActual);
    if (actual.length === 0 || baseline.length === 0) continue;

    const totalActual = actual.reduce((s, r) => s + (r.total_menciones || 0), 0);
    const totalBaseline = baseline.reduce((s, r) => s + (r.total_menciones || 0), 0);
    if (totalActual < 3 || totalBaseline < 5) continue;

    const sentA = promedioPonderado(actual, "sentimiento_promedio");
    const sentB = promedioPonderado(baseline, "sentimiento_promedio");
    const negA = promedioPonderado(actual, "pct_negativo");
    const negB = promedioPonderado(baseline, "pct_negativo");

    const candidato_id = actual[0].candidato_id ?? baseline[0].candidato_id ?? null;
    const ventanaA = actual[0].generado_en;
    const ventanaB = baseline[0].generado_en;

    // 1. Deriva de sentimiento
    if (sentA != null && sentB != null) {
      const delta = sentA - sentB;
      if (Math.abs(delta) >= 0.25) {
        const direccion = delta > 0 ? "positivo" : "negativo";
        shifts.push({
          batch_id: batchId,
          entidad_nombre: entidad,
          candidato_id,
          tipo_shift: "deriva_sentimiento",
          severidad: severidadDelta(Math.abs(delta)),
          titulo: `Deriva de sentimiento ${direccion} en ${entidad}`,
          descripcion: `Sentimiento pasó de ${sentB.toFixed(2)} a ${sentA.toFixed(2)} (Δ ${delta >= 0 ? "+" : ""}${delta.toFixed(2)}) entre últimas 48h y los 7 días previos.`,
          delta,
          valor_anterior: sentB,
          valor_actual: sentA,
          temas_nuevos: [],
          temas_abandonados: [],
          ventana_anterior: ventanaB,
          ventana_actual: ventanaA,
          evidencia: {
            total_actual: totalActual,
            total_baseline: totalBaseline,
            sent_actual: sentA,
            sent_baseline: sentB,
          },
        });
      }
    }

    // 2. Polarización (subida de pct_negativo)
    if (negA != null && negB != null) {
      const dPct = negA - negB;
      if (dPct >= 20) {
        shifts.push({
          batch_id: batchId,
          entidad_nombre: entidad,
          candidato_id,
          tipo_shift: "polarizacion",
          severidad: severidadPct(dPct),
          titulo: `Polarización creciente sobre ${entidad}`,
          descripcion: `Menciones negativas subieron de ${negB.toFixed(0)}% a ${negA.toFixed(0)}% (+${dPct.toFixed(0)} pts).`,
          delta: dPct,
          valor_anterior: negB,
          valor_actual: negA,
          temas_nuevos: [],
          temas_abandonados: [],
          ventana_anterior: ventanaB,
          ventana_actual: ventanaA,
          evidencia: { neg_actual: negA, neg_baseline: negB, total_actual: totalActual },
        });
      }
    }

    // 3 y 4. Temas emergentes / abandonados
    const temasA = agregarTemas(actual);
    const temasB = agregarTemas(baseline);

    const emergentes: { tema: string; count: number }[] = [];
    for (const [tema, count] of temasA) {
      if (count >= 3 && !temasB.has(tema)) emergentes.push({ tema, count });
    }
    const abandonados: { tema: string; count: number }[] = [];
    for (const [tema, count] of temasB) {
      if (count >= 5 && (temasA.get(tema) ?? 0) === 0) abandonados.push({ tema, count });
    }

    if (emergentes.length > 0) {
      emergentes.sort((a, b) => b.count - a.count);
      shifts.push({
        batch_id: batchId,
        entidad_nombre: entidad,
        candidato_id,
        tipo_shift: "tema_emergente",
        severidad: emergentes[0].count >= 7 ? "alta" : "media",
        titulo: `Nuevos temas en conversación sobre ${entidad}`,
        descripcion: `Aparecen ${emergentes.length} tema(s) sin precedente en últimas 48h: ${emergentes.slice(0, 3).map((t) => `"${t.tema}" (${t.count})`).join(", ")}.`,
        delta: emergentes.length,
        valor_anterior: 0,
        valor_actual: emergentes[0].count,
        temas_nuevos: emergentes.slice(0, 8),
        temas_abandonados: [],
        ventana_anterior: ventanaB,
        ventana_actual: ventanaA,
        evidencia: { temas_actual: Object.fromEntries(temasA), temas_baseline: Object.fromEntries(temasB) },
      });
    }

    if (abandonados.length > 0) {
      abandonados.sort((a, b) => b.count - a.count);
      shifts.push({
        batch_id: batchId,
        entidad_nombre: entidad,
        candidato_id,
        tipo_shift: "tema_abandonado",
        severidad: abandonados[0].count >= 10 ? "alta" : "media",
        titulo: `Temas abandonados en torno a ${entidad}`,
        descripcion: `${abandonados.length} tema(s) dominantes en los 7 días previos desaparecieron de la conversación: ${abandonados.slice(0, 3).map((t) => `"${t.tema}" (${t.count}→0)`).join(", ")}.`,
        delta: -abandonados[0].count,
        valor_anterior: abandonados[0].count,
        valor_actual: 0,
        temas_nuevos: [],
        temas_abandonados: abandonados.slice(0, 8),
        ventana_anterior: ventanaB,
        ventana_actual: ventanaA,
        evidencia: { temas_actual: Object.fromEntries(temasA), temas_baseline: Object.fromEntries(temasB) },
      });
    }
  }

  if (shifts.length > 0) {
    const { error: insErr } = await supabase.from("belief_shifts").insert(shifts);
    if (insErr) console.error("insert belief_shifts:", insErr.message);
  }

  const porTipo = shifts.reduce((acc: Record<string, number>, s) => {
    acc[s.tipo_shift] = (acc[s.tipo_shift] ?? 0) + 1;
    return acc;
  }, {});

  await supabase.from("belief_shifts_runs").insert({
    trigger: "manual",
    entidades_analizadas: porEntidad.size,
    shifts_detectados: shifts.length,
    por_tipo: porTipo,
    duracion_ms: Date.now() - startedAt,
  });

  return new Response(
    JSON.stringify({
      success: true,
      batch_id: batchId,
      entidades_analizadas: porEntidad.size,
      shifts_detectados: shifts.length,
      por_tipo: porTipo,
      duracion_ms: Date.now() - startedAt,
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});

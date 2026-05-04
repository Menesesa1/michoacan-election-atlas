// Edge function: detectar-cib
// Aplica heurísticas sobre social_menciones de las últimas 24-48h
// para detectar Comportamiento Coordinado Inauténtico (CIB):
//   1. spike_anomalo: menciones >300% sobre media móvil 7d por entidad
//   2. copy_paste: ≥4 menciones con fragmentos casi idénticos en <2h
//   3. dominacion_fuente: una sola fuente concentra >60% en 24h
//   4. rafaga_temporal: ≥6 menciones del mismo tema en <30 min
import { createClient } from "npm:@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Mencion {
  id: string;
  entidad_nombre: string;
  entidad_tipo: string;
  candidato_id: string | null;
  fuente: string | null;
  titulo: string;
  fragmento: string | null;
  tema: string | null;
  url: string | null;
  detectada_en: string;
}

// Similitud Jaccard sobre tokens
function similitud(a: string, b: string): number {
  const ta = new Set(a.toLowerCase().split(/\W+/).filter((w) => w.length > 3));
  const tb = new Set(b.toLowerCase().split(/\W+/).filter((w) => w.length > 3));
  const inter = [...ta].filter((x) => tb.has(x)).length;
  const union = new Set([...ta, ...tb]).size;
  return union === 0 ? 0 : inter / union;
}

function sevPorPct(pct: number): string {
  if (pct >= 500) return "critica";
  if (pct >= 300) return "alta";
  if (pct >= 200) return "media";
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
  const batchId = crypto.randomUUID();
  const ahora = new Date();
  const hace24h = new Date(ahora.getTime() - 24 * 3600 * 1000);
  const hace7d = new Date(ahora.getTime() - 7 * 24 * 3600 * 1000);

  const { data: ultimas } = await supabase
    .from("social_menciones")
    .select("id, entidad_nombre, entidad_tipo, candidato_id, fuente, titulo, fragmento, tema, url, detectada_en")
    .gte("detectada_en", hace24h.toISOString())
    .order("detectada_en", { ascending: false })
    .limit(2000);

  const menciones: Mencion[] = (ultimas ?? []) as Mencion[];

  const alertas: any[] = [];

  // Agrupar por entidad
  const porEntidad = new Map<string, Mencion[]>();
  for (const m of menciones) {
    const k = m.entidad_nombre;
    if (!porEntidad.has(k)) porEntidad.set(k, []);
    porEntidad.get(k)!.push(m);
  }

  // 1. SPIKE ANÓMALO — comparar conteo 24h vs media diaria 7d
  for (const [entidad, lista] of porEntidad) {
    const conteo24h = lista.length;
    if (conteo24h < 5) continue;

    const { count: total7d } = await supabase
      .from("social_menciones")
      .select("id", { count: "exact", head: true })
      .eq("entidad_nombre", entidad)
      .gte("detectada_en", hace7d.toISOString())
      .lt("detectada_en", hace24h.toISOString());
    const mediaDiaria = (total7d ?? 0) / 6;
    if (mediaDiaria < 1) continue;
    const pct = (conteo24h / mediaDiaria) * 100;
    if (pct < 200) continue;

    alertas.push({
      batch_id: batchId,
      tipo_patron: "spike_anomalo",
      severidad: sevPorPct(pct),
      entidad_tipo: lista[0].entidad_tipo,
      entidad_nombre: entidad,
      candidato_id: lista[0].candidato_id,
      titulo: `Pico anómalo de menciones sobre ${entidad}`,
      descripcion: `${conteo24h} menciones en 24h vs media de ${mediaDiaria.toFixed(1)}/día (últimos 7d). Incremento ${pct.toFixed(0)}%.`,
      evidencia: {
        conteo_24h: conteo24h,
        media_diaria_7d: mediaDiaria,
        pct_incremento: pct,
        urls_muestra: lista.slice(0, 5).map((m) => m.url).filter(Boolean),
      },
      ventana_inicio: hace24h.toISOString(),
      ventana_fin: ahora.toISOString(),
    });
  }

  // 2. COPY-PASTE — fragmentos similares en ventana corta
  for (const [entidad, lista] of porEntidad) {
    if (lista.length < 4) continue;
    const conFrag = lista.filter((m) => m.fragmento && m.fragmento.length > 50);
    const visitados = new Set<string>();
    for (let i = 0; i < conFrag.length; i++) {
      if (visitados.has(conFrag[i].id)) continue;
      const cluster = [conFrag[i]];
      for (let j = i + 1; j < conFrag.length; j++) {
        if (visitados.has(conFrag[j].id)) continue;
        const dt = Math.abs(new Date(conFrag[i].detectada_en).getTime() - new Date(conFrag[j].detectada_en).getTime());
        if (dt > 2 * 3600 * 1000) continue;
        if (similitud(conFrag[i].fragmento!, conFrag[j].fragmento!) >= 0.7) {
          cluster.push(conFrag[j]);
          visitados.add(conFrag[j].id);
        }
      }
      if (cluster.length >= 4) {
        cluster.forEach((c) => visitados.add(c.id));
        alertas.push({
          batch_id: batchId,
          tipo_patron: "copy_paste",
          severidad: cluster.length >= 8 ? "alta" : "media",
          entidad_tipo: entidad,
          entidad_nombre: entidad,
          candidato_id: cluster[0].candidato_id,
          titulo: `${cluster.length} menciones casi idénticas sobre ${entidad}`,
          descripcion: `Detectado cluster de ${cluster.length} fragmentos con similitud >70% en menos de 2 horas. Posible operación de copia-pega.`,
          evidencia: {
            cluster_size: cluster.length,
            fragmento_base: cluster[0].fragmento?.slice(0, 200),
            urls: cluster.map((c) => c.url).filter(Boolean),
            fuentes: [...new Set(cluster.map((c) => c.fuente).filter(Boolean))],
          },
          ventana_inicio: cluster[cluster.length - 1].detectada_en,
          ventana_fin: cluster[0].detectada_en,
        });
      }
    }
  }

  // 3. DOMINACIÓN DE FUENTE
  for (const [entidad, lista] of porEntidad) {
    if (lista.length < 6) continue;
    const porFuente = new Map<string, number>();
    lista.forEach((m) => {
      if (!m.fuente) return;
      porFuente.set(m.fuente, (porFuente.get(m.fuente) ?? 0) + 1);
    });
    const top = [...porFuente.entries()].sort((a, b) => b[1] - a[1])[0];
    if (!top) continue;
    const pct = (top[1] / lista.length) * 100;
    if (pct >= 60) {
      alertas.push({
        batch_id: batchId,
        tipo_patron: "dominacion_fuente",
        severidad: pct >= 80 ? "alta" : "media",
        entidad_tipo: lista[0].entidad_tipo,
        entidad_nombre: entidad,
        candidato_id: lista[0].candidato_id,
        titulo: `${top[0]} concentra ${pct.toFixed(0)}% de menciones sobre ${entidad}`,
        descripcion: `Una sola fuente (${top[0]}) generó ${top[1]} de ${lista.length} menciones en 24h. Posible amplificación dirigida.`,
        evidencia: {
          fuente_dominante: top[0],
          conteo_fuente: top[1],
          total_menciones: lista.length,
          pct_dominacion: pct,
        },
        ventana_inicio: hace24h.toISOString(),
        ventana_fin: ahora.toISOString(),
      });
    }
  }

  // 4. RÁFAGA TEMPORAL — ≥6 menciones del mismo tema en <30min
  for (const [entidad, lista] of porEntidad) {
    const porTema = new Map<string, Mencion[]>();
    lista.forEach((m) => {
      if (!m.tema) return;
      if (!porTema.has(m.tema)) porTema.set(m.tema, []);
      porTema.get(m.tema)!.push(m);
    });
    for (const [tema, items] of porTema) {
      if (items.length < 6) continue;
      const sorted = items.sort((a, b) => new Date(a.detectada_en).getTime() - new Date(b.detectada_en).getTime());
      for (let i = 0; i < sorted.length - 5; i++) {
        const ventana = sorted.slice(i, i + 6);
        const dt = new Date(ventana[5].detectada_en).getTime() - new Date(ventana[0].detectada_en).getTime();
        if (dt <= 30 * 60 * 1000) {
          alertas.push({
            batch_id: batchId,
            tipo_patron: "rafaga_temporal",
            severidad: "media",
            entidad_tipo: lista[0].entidad_tipo,
            entidad_nombre: entidad,
            candidato_id: lista[0].candidato_id,
            titulo: `Ráfaga sobre "${tema}" en ${entidad}`,
            descripcion: `6+ menciones del tema "${tema}" en menos de 30 minutos. Posible coordinación.`,
            evidencia: {
              tema,
              ventana_min: dt / 60000,
              urls: ventana.map((v) => v.url).filter(Boolean),
            },
            ventana_inicio: ventana[0].detectada_en,
            ventana_fin: ventana[5].detectada_en,
          });
          break;
        }
      }
    }
  }

  if (alertas.length > 0) {
    const { error: insErr } = await supabase.from("cib_alertas").insert(alertas);
    if (insErr) console.error("Insert cib_alertas:", insErr.message);
  }

  return new Response(
    JSON.stringify({
      success: true,
      batch_id: batchId,
      menciones_analizadas: menciones.length,
      alertas_generadas: alertas.length,
      por_tipo: alertas.reduce((acc: Record<string, number>, a) => {
        acc[a.tipo_patron] = (acc[a.tipo_patron] ?? 0) + 1;
        return acc;
      }, {}),
      duracion_ms: Date.now() - startedAt,
    }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});

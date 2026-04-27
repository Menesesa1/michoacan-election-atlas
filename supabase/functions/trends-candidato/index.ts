// Consulta on-demand de Google Trends para un candidato.
// Combina:
//   - SerpApi (engine=google_trends) → serie temporal + related queries en geo MX-MIC
//   - Perplexity (sonar) → contexto narrativo (por qué sube/baja el interés) con citas
//
// Persiste en public.trends_candidato bajo el RLS del usuario que invoca.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const GEO_DEFAULT = "MX-MIC";
const TZ = "360";

async function fetchSerpapi(params: Record<string, string>): Promise<unknown> {
  const SERPAPI_KEY = Deno.env.get("SERPAPI_KEY");
  if (!SERPAPI_KEY) throw new Error("SERPAPI_KEY no configurada");
  const url = new URL("https://serpapi.com/search.json");
  url.searchParams.set("engine", "google_trends");
  url.searchParams.set("api_key", SERPAPI_KEY);
  url.searchParams.set("tz", TZ);
  url.searchParams.set("hl", "es");
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const r = await fetch(url.toString());
  if (!r.ok) {
    const text = await r.text();
    throw new Error(`SerpApi error [${r.status}]: ${text.slice(0, 300)}`);
  }
  return await r.json();
}

async function perplexityContextoCandidato(opts: {
  nombre: string;
  partido?: string;
  territorio?: string;
  picoFecha?: string;
  picoValor?: number;
}): Promise<{ resumen: string; citas: { url: string; medio?: string }[] }> {
  const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");
  if (!PERPLEXITY_API_KEY) return { resumen: "", citas: [] };

  const dominios = [
    "lavozdemichoacan.com.mx",
    "elsoldemorelia.com.mx",
    "quadratin.com.mx",
    "respuesta.com.mx",
    "changoonga.com",
    "contramuro.com",
    "milenio.com",
    "eluniversal.com.mx",
    "jornada.com.mx",
    "proceso.com.mx",
    "animalpolitico.com",
    "infobae.com",
  ];

  const territorio = opts.territorio ?? "Michoacán";
  const pico = opts.picoFecha
    ? `\nEl pico de búsquedas en Google Trends ocurrió el ${opts.picoFecha}${opts.picoValor ? ` (interés relativo ${opts.picoValor}/100)` : ""}.`
    : "";
  const prompt = `Eres analista político especializado en Michoacán.
Sujeto: ${opts.nombre}${opts.partido ? ` (${opts.partido})` : ""}, en ${territorio}.${pico}

Investiga en medios mexicanos:
1. ¿Qué eventos o noticias explican picos de interés en Google sobre esta persona en los últimos 12 meses?
2. ¿Hay correlación con escándalos, anuncios, eventos públicos, declaraciones?
3. ¿Existen búsquedas relacionadas problemáticas (ej: "denuncias", "renuncia", "investigación")?
Devuelve análisis conciso (máx 8 frases) con citas a medios verificables.`;

  try {
    const r = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${PERPLEXITY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar-pro",
        messages: [
          { role: "system", content: "Sé preciso. Cita medios mexicanos. Si no hay información, dilo." },
          { role: "user", content: prompt },
        ],
        search_domain_filter: dominios,
        search_recency_filter: "year",
        temperature: 0.2,
      }),
    });
    if (!r.ok) return { resumen: "", citas: [] };
    const data = await r.json();
    const resumen: string = data?.choices?.[0]?.message?.content ?? "";
    const urls: string[] = data?.citations ?? [];
    const citas = urls.map((url) => {
      try {
        const u = new URL(url);
        return { url, medio: u.hostname.replace(/^www\./, "") };
      } catch {
        return { url };
      }
    });
    return { resumen, citas };
  } catch (e) {
    console.error("perplexity error", e);
    return { resumen: "", citas: [] };
  }
}

interface BodyShape {
  candidato_id: string;
  nombre: string;
  partido?: string;
  territorio?: string;
  geo?: string;
  rango?: string; // "today 12-m", "today 3-m", etc
  comparar_con?: string[]; // términos para comparativo
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json() as BodyShape;
    if (!body?.candidato_id || !body?.nombre) {
      return new Response(
        JSON.stringify({ error: "candidato_id y nombre son requeridos" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Validar JWT del usuario
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No autenticado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: userData, error: userErr } = await supabaseUser.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(
        JSON.stringify({ error: "Token inválido" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const geo = body.geo ?? GEO_DEFAULT;
    const rango = body.rango ?? "today 12-m";
    const terminos = [body.nombre, ...(body.comparar_con ?? [])].filter(Boolean).slice(0, 5);
    const qParam = terminos.join(",");

    // 1. Serie temporal (interest over time) — comparativo si hay varios
    const iot = await fetchSerpapi({
      data_type: "TIMESERIES",
      q: qParam,
      date: rango,
      geo,
    }) as { interest_over_time?: { timeline_data?: { date?: string; values?: { extracted_value?: number; query?: string }[] }[] } };

    const timeline = iot.interest_over_time?.timeline_data ?? [];
    const serie = timeline.map((p) => {
      const punto: Record<string, unknown> = { fecha: p.date };
      (p.values ?? []).forEach((v, idx) => {
        const key = terminos[idx] ?? `serie_${idx}`;
        punto[key] = v.extracted_value ?? null;
      });
      return punto;
    });

    // Estadísticas del término principal
    const valoresMain: number[] = serie
      .map((p) => p[body.nombre] as number | null)
      .filter((v): v is number => typeof v === "number");
    const pico = valoresMain.length ? Math.max(...valoresMain) : 0;
    const promedio = valoresMain.length
      ? valoresMain.reduce((a, b) => a + b, 0) / valoresMain.length
      : 0;
    const idxPico = valoresMain.indexOf(pico);
    const fechaPico = idxPico >= 0 ? (serie[idxPico]?.fecha as string | undefined) : undefined;

    // 2. Related queries (solo término principal)
    let relatedTop: unknown[] = [];
    let relatedRising: unknown[] = [];
    try {
      const rq = await fetchSerpapi({
        data_type: "RELATED_QUERIES",
        q: body.nombre,
        date: rango,
        geo,
      }) as { related_queries?: { top?: unknown[]; rising?: unknown[] } };
      relatedTop = rq.related_queries?.top ?? [];
      relatedRising = rq.related_queries?.rising ?? [];
    } catch (e) {
      console.error("related_queries error", e);
    }

    // 3. Contexto Perplexity
    const { resumen, citas } = await perplexityContextoCandidato({
      nombre: body.nombre,
      partido: body.partido,
      territorio: body.territorio,
      picoFecha: fechaPico,
      picoValor: pico,
    });

    // 4. Persistir bajo RLS del usuario
    const { data: row, error: insertErr } = await supabaseUser
      .from("trends_candidato")
      .insert([{
        candidato_id: body.candidato_id,
        user_id: userData.user.id,
        termino: body.nombre,
        geo,
        rango_temporal: rango,
        pico_interes: pico,
        promedio_interes: Math.round(promedio * 100) / 100,
        serie_temporal: serie,
        related_top: relatedTop,
        related_rising: relatedRising,
        comparativos: terminos.slice(1),
        contexto_narrativo: resumen,
        citas,
      }])
      .select()
      .single();

    if (insertErr) throw insertErr;

    return new Response(
      JSON.stringify({ ok: true, trend: row }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Error desconocido";
    console.error("trends-candidato error", errorMsg);
    return new Response(
      JSON.stringify({ ok: false, error: errorMsg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

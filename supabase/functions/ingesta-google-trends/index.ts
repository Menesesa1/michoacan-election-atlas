// Ingesta de Google Trends para Michoacán (geo MX-MIC).
// Usa SerpApi (engine=google_trends) para datos numéricos y Perplexity
// (sonar) para enriquecer con contexto narrativo y citas a medios MX.
//
// Persiste en public.trends_estatal y registra la corrida en public.trends_runs.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const GEO = "MX-MIC";
const TZ = "360"; // CDMX -6h

interface SerpTrendingPoint {
  date?: string;
  timestamp?: string;
  values?: { extracted_value?: number; query?: string }[];
}

interface SerpRelatedQuery {
  query: string;
  value?: string | number;
  extracted_value?: number;
}

async function fetchSerpapi(params: Record<string, string>): Promise<unknown> {
  const SERPAPI_KEY = Deno.env.get("SERPAPI_KEY");
  if (!SERPAPI_KEY) throw new Error("SERPAPI_KEY no configurada");
  const url = new URL("https://serpapi.com/search.json");
  url.searchParams.set("engine", "google_trends");
  url.searchParams.set("api_key", SERPAPI_KEY);
  url.searchParams.set("geo", GEO);
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

async function perplexityContexto(terminos: string[]): Promise<{
  resumen: string;
  citas: { url: string; titulo?: string; medio?: string }[];
}> {
  const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");
  if (!PERPLEXITY_API_KEY) {
    return { resumen: "", citas: [] };
  }
  const dominios = [
    "lavozdemichoacan.com.mx",
    "elsoldemorelia.com.mx",
    "quadratin.com.mx",
    "respuesta.com.mx",
    "changoonga.com",
    "milenio.com",
    "eluniversal.com.mx",
    "jornada.com.mx",
    "proceso.com.mx",
    "animalpolitico.com",
  ];
  const prompt = `Estos términos son tendencia hoy en Michoacán según Google Trends: ${terminos.slice(0, 10).join(", ")}.
Explica brevemente (máximo 6 frases) por qué cada uno está repuntando esta semana, citando notas de medios mexicanos. Si un término es ambiguo o no tiene contexto político/social, dilo.`;
  try {
    const r = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${PERPLEXITY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar",
        messages: [
          { role: "system", content: "Eres analista político mexicano. Sé conciso y cita medios." },
          { role: "user", content: prompt },
        ],
        search_domain_filter: dominios,
        search_recency_filter: "week",
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

// Extrae el primer bloque JSON balanceado de un string (más robusto que regex simple).
function extraerJsonBalanceado(txt: string): string | null {
  // Quitar fences markdown si vienen
  const limpio = txt.replace(/```(?:json)?/gi, "").replace(/```/g, "").trim();
  const start = limpio.indexOf("{");
  if (start === -1) return null;
  let depth = 0;
  let inStr = false;
  let escape = false;
  for (let i = start; i < limpio.length; i++) {
    const c = limpio[i];
    if (inStr) {
      if (escape) escape = false;
      else if (c === "\\") escape = true;
      else if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') inStr = true;
    else if (c === "{") depth++;
    else if (c === "}") {
      depth--;
      if (depth === 0) return limpio.slice(start, i + 1);
    }
  }
  return null;
}

function parsearTerminos(rawContent: string): string[] {
  const candidato = extraerJsonBalanceado(rawContent) ?? rawContent;
  try {
    const parsed = JSON.parse(candidato);
    const arr = Array.isArray(parsed?.terminos)
      ? parsed.terminos
      : Array.isArray(parsed?.terms)
        ? parsed.terms
        : Array.isArray(parsed)
          ? parsed
          : [];
    return arr
      .map((t: unknown) => (typeof t === "string" ? t.trim() : ""))
      .filter((t: string) => t.length > 0 && t.length < 80)
      .slice(0, 10);
  } catch {
    return [];
  }
}

async function descubrirTerminosConReintentos(
  apiKey: string,
  maxIntentos: number,
): Promise<string[]> {
  const userPrompt = `Identifica los 10 temas/personas/eventos que están generando MÁS búsquedas y conversación pública esta semana específicamente en Michoacán, México.
Responde EXACTAMENTE con este JSON, sin markdown, sin texto antes ni después:
{"terminos":["término 1","término 2","término 3","término 4","término 5","término 6","término 7","término 8","término 9","término 10"]}
Cada término debe ser corto (1-4 palabras), sin comillas internas, ideal para una búsqueda de Google. Prioriza nombres propios de políticos michoacanos, municipios en crisis, eventos noticiosos del estado, no temas nacionales genéricos.`;

  for (let intento = 1; intento <= maxIntentos; intento++) {
    try {
      const resp = await fetch("https://api.perplexity.ai/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "sonar",
          messages: [
            {
              role: "system",
              content:
                "Devuelve EXCLUSIVAMENTE un objeto JSON válido. Nada de markdown, nada de explicaciones, nada de texto fuera del JSON.",
            },
            { role: "user", content: userPrompt },
          ],
          search_recency_filter: "week",
          temperature: intento === 1 ? 0.1 : 0.3,
        }),
      });
      if (!resp.ok) {
        const errTxt = await resp.text();
        console.warn(`[descubrir] intento ${intento} HTTP ${resp.status}: ${errTxt.slice(0, 200)}`);
        continue;
      }
      const data = await resp.json();
      const rawContent: string = data?.choices?.[0]?.message?.content ?? "";
      const terminos = parsearTerminos(rawContent);
      if (terminos.length > 0) {
        return terminos;
      }
      console.warn(
        `[descubrir] intento ${intento} JSON inválido o vacío. Raw (primeros 500 chars): ${rawContent.slice(0, 500)}`,
      );
    } catch (e) {
      console.warn(`[descubrir] intento ${intento} excepción:`, e instanceof Error ? e.message : e);
    }
  }
  return [];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const t0 = Date.now();
  const batch_id = crypto.randomUUID();
  let trigger = "manual";
  let total = 0;

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    try {
      const body = await req.json();
      if (body?.trigger) trigger = String(body.trigger);
    } catch { /* sin body */ }

    // 1. Descubrir términos tendencia en Michoacán via Perplexity
    //    (SerpApi/Google Trends ya no expone TRENDING/DAILY_SEARCH_TRENDS;
    //    todos los data_type vigentes requieren `q`).
    const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");
    if (!PERPLEXITY_API_KEY) {
      throw new Error("PERPLEXITY_API_KEY no configurada para descubrir tendencias");
    }

    const topTerminos = await descubrirTerminosConReintentos(PERPLEXITY_API_KEY, 3);
    if (topTerminos.length === 0) {
      throw new Error("Perplexity no devolvió términos tendencia parseables tras varios intentos");
    }
    console.log(`Términos descubiertos (${topTerminos.length}):`, topTerminos.join(", "));

    const filas: Record<string, unknown>[] = [];
    const ahora = new Date().toISOString();
    for (const termino of topTerminos) {
      filas.push({
        batch_id,
        geo: GEO,
        tipo: "rising_searches",
        termino,
        valor_interes: null,
        variacion_pct: null,
        ejecutada_en: ahora,
      });
    }

    // 2. Interest over time + related queries para los 5 términos top en geo Michoacán
    for (const termino of topTerminos.slice(0, 5)) {
      try {
        const iot = await fetchSerpapi({
          data_type: "TIMESERIES",
          q: termino,
          date: "today 3-m",
          geo: GEO,
        }) as { interest_over_time?: { timeline_data?: SerpTrendingPoint[] } };

        const serie = (iot.interest_over_time?.timeline_data ?? []).map((p) => ({
          fecha: p.date,
          valor: p.values?.[0]?.extracted_value ?? null,
        }));
        const valores = serie.map((s) => s.valor).filter((v): v is number => typeof v === "number");
        const pico = valores.length ? Math.max(...valores) : null;

        const rq = await fetchSerpapi({
          data_type: "RELATED_QUERIES",
          q: termino,
          date: "today 3-m",
          geo: GEO,
        }) as { related_queries?: { top?: SerpRelatedQuery[]; rising?: SerpRelatedQuery[] } };

        filas.push({
          batch_id,
          geo: GEO,
          tipo: "interest_over_time",
          termino,
          valor_interes: pico,
          serie_temporal: serie,
          related: {
            top: rq.related_queries?.top ?? [],
            rising: rq.related_queries?.rising ?? [],
          },
          ejecutada_en: ahora,
        });
      } catch (e) {
        console.error(`Error consultando ${termino}:`, e);
      }
    }

    // 3. Contexto narrativo + citas (Perplexity)
    const { resumen, citas } = await perplexityContexto(topTerminos);
    if (resumen) {
      filas.push({
        batch_id,
        geo: GEO,
        tipo: "contexto_narrativo",
        termino: "_resumen_",
        contexto_narrativo: resumen,
        citas,
        ejecutada_en: ahora,
      });
    }

    // 4. Persistir
    if (filas.length) {
      const { error } = await supabaseAdmin.from("trends_estatal").insert(filas);
      if (error) throw error;
    }
    total = topTerminos.length;

    await supabaseAdmin.from("trends_runs").insert([{
      batch_id,
      trigger,
      total_terminos: total,
      duracion_ms: Date.now() - t0,
    }]);

    return new Response(
      JSON.stringify({
        ok: true,
        batch_id,
        total_terminos: total,
        filas_insertadas: filas.length,
        contexto_disponible: Boolean(resumen),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Error desconocido";
    console.error("ingesta-google-trends error", errorMsg);
    await supabaseAdmin.from("trends_runs").insert([{
      batch_id,
      trigger,
      total_terminos: total,
      duracion_ms: Date.now() - t0,
      error: errorMsg,
    }]);
    return new Response(
      JSON.stringify({ ok: false, error: errorMsg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

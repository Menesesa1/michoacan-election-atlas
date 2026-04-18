// Edge function: monitor-crisis
// Pipeline:
// 1. Firecrawl Search → últimas noticias Michoacán electoral (24h)
// 2. Lovable AI (Gemini Flash) → triaje + clasificación → ≥20 alertas estructuradas
// 3. Persistir en alertas_crisis + bitácora en alertas_crisis_runs
import { createClient } from "npm:@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FIRECRAWL_V2 = "https://api.firecrawl.dev/v2";
const LOVABLE_AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

interface AlertaOut {
  prioridad: "Urgente" | "Preventivo" | "Informativo";
  titulo: string;
  descripcion: string;
  distrito: string;
  fuente: string;
  url_fuente?: string;
  timestamp?: string;
}

interface SearchHit {
  title?: string;
  url?: string;
  description?: string;
  markdown?: string;
  publishedDate?: string;
}

const QUERIES = [
  "Michoacán elecciones 2027 noticias",
  "Morelia política gobierno municipal",
  "Uruapan Apatzingán Lázaro Cárdenas seguridad",
  "Michoacán Bedolla gobernador últimas noticias",
  "Morena PRI PAN PRD Michoacán",
  "Michoacán bloqueo manifestación protesta",
  "Michoacán encuesta intención voto",
  "Michoacán violencia política candidato",
];

async function firecrawlSearch(query: string, apiKey: string): Promise<SearchHit[]> {
  const res = await fetch(`${FIRECRAWL_V2}/search`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query, limit: 5, lang: "es", country: "mx", tbs: "qdr:d" }),
  });
  if (!res.ok) {
    console.error(`Firecrawl search [${res.status}] ${query}:`, await res.text());
    return [];
  }
  const json = await res.json();
  // v2: data.web (array) or data (array depending on shape)
  const arr = json?.data?.web ?? json?.data ?? [];
  return Array.isArray(arr) ? arr : [];
}

async function classifyWithAI(hits: SearchHit[], lovableKey: string): Promise<AlertaOut[]> {
  const corpus = hits
    .slice(0, 60)
    .map((h, i) => `[${i + 1}] ${h.title ?? ""}\n${h.description ?? h.markdown?.slice(0, 300) ?? ""}\nURL: ${h.url ?? ""}`)
    .join("\n\n");

  const systemPrompt = `Eres un analista de inteligencia política para campañas electorales en Michoacán, México.
Tu tarea: leer noticias recientes y producir EXACTAMENTE 20 alertas operativas clasificadas para un War Room electoral.

Clasificación:
- "Urgente": crisis activa que requiere respuesta inmediata (violencia, escándalo, bloqueo, escándalo mediático)
- "Preventivo": tendencia o evento que puede escalar (movilización opositora, narrativa adversa, reunión de actores)
- "Informativo": contexto útil pero sin acción inmediata (datos, declaraciones rutinarias, agenda)

Distribución objetivo: ~5 Urgentes, ~8 Preventivas, ~7 Informativas.
Distrito: nombre del municipio o "Michoacán · Estatal" si es estatal.
Descripción: 1-2 líneas accionables, con recomendación implícita.
Si una noticia no aporta, ignórala y usa otra.

IMPORTANTE: devuelve SIEMPRE 20 alertas, aunque debas inferir 2-3 de contexto general michoacano (etiquétalas como Informativo).`;

  const res = await fetch(LOVABLE_AI_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${lovableKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Noticias recientes (últimas 24h):\n\n${corpus}\n\nGenera las 20 alertas.` },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "emit_alertas",
            description: "Emite la lista de 20 alertas clasificadas",
            parameters: {
              type: "object",
              properties: {
                alertas: {
                  type: "array",
                  minItems: 20,
                  maxItems: 25,
                  items: {
                    type: "object",
                    properties: {
                      prioridad: { type: "string", enum: ["Urgente", "Preventivo", "Informativo"] },
                      titulo: { type: "string", maxLength: 120 },
                      descripcion: { type: "string", maxLength: 280 },
                      distrito: { type: "string" },
                      fuente: { type: "string" },
                      url_fuente: { type: "string" },
                    },
                    required: ["prioridad", "titulo", "descripcion", "distrito", "fuente"],
                  },
                },
              },
              required: ["alertas"],
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "emit_alertas" } },
    }),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Lovable AI [${res.status}]: ${txt}`);
  }
  const json = await res.json();
  const toolCall = json.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall) throw new Error("AI no devolvió tool_call");
  const args = JSON.parse(toolCall.function.arguments);
  return args.alertas as AlertaOut[];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const startedAt = Date.now();
  const trigger = (await req.json().catch(() => ({})))?.trigger ?? "manual";

  const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!FIRECRAWL_API_KEY || !LOVABLE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return new Response(
      JSON.stringify({ error: "Faltan variables de entorno (Firecrawl/Lovable AI/Supabase)" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    // 1. Buscar en paralelo
    const searchResults = await Promise.all(QUERIES.map((q) => firecrawlSearch(q, FIRECRAWL_API_KEY)));
    const allHits = searchResults.flat();
    const fuentesConsultadas = QUERIES.length;

    if (allHits.length === 0) {
      throw new Error("Firecrawl no devolvió resultados (posible límite de créditos o bloqueo)");
    }

    // 2. Clasificar con IA
    const alertas = await classifyWithAI(allHits, LOVABLE_API_KEY);
    if (alertas.length < 20) {
      console.warn(`AI devolvió solo ${alertas.length} alertas; se persisten todas`);
    }

    // 3. Persistir
    const batchId = crypto.randomUUID();
    const detectadaEn = new Date().toISOString();
    const rows = alertas.map((a) => ({
      prioridad: a.prioridad,
      titulo: a.titulo,
      descripcion: a.descripcion,
      distrito: a.distrito || "Michoacán · Estatal",
      fuente: a.fuente || "Monitor Firecrawl + IA",
      url_fuente: a.url_fuente ?? null,
      timestamp: detectadaEn,
      detectada_en: detectadaEn,
      batch_id: batchId,
    }));

    const { error: insErr } = await supabase.from("alertas_crisis").insert(rows);
    if (insErr) throw new Error(`Insert alertas: ${insErr.message}`);

    const counts = {
      urgentes: alertas.filter((a) => a.prioridad === "Urgente").length,
      preventivas: alertas.filter((a) => a.prioridad === "Preventivo").length,
      informativas: alertas.filter((a) => a.prioridad === "Informativo").length,
    };

    await supabase.from("alertas_crisis_runs").insert({
      total_alertas: alertas.length,
      urgentes: counts.urgentes,
      preventivas: counts.preventivas,
      informativas: counts.informativas,
      fuentes_consultadas: fuentesConsultadas,
      duracion_ms: Date.now() - startedAt,
      trigger,
      batch_id: batchId,
    });

    return new Response(
      JSON.stringify({
        success: true,
        batch_id: batchId,
        total: alertas.length,
        ...counts,
        ejecutada_en: detectadaEn,
        duracion_ms: Date.now() - startedAt,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("monitor-crisis error:", msg);
    await supabase.from("alertas_crisis_runs").insert({
      total_alertas: 0,
      urgentes: 0,
      preventivas: 0,
      informativas: 0,
      fuentes_consultadas: QUERIES.length,
      duracion_ms: Date.now() - startedAt,
      error: msg,
      trigger,
    });
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

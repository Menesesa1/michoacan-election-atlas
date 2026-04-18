// Edge function: analizar-discurso-ciudadano
// Toma las menciones estatales del batch más reciente y produce:
// - Nube de palabras (palabras_clave) con peso
// - Temas más relevantes para ciudadanos (qué les preocupa)
// - Búsquedas/preguntas dominantes (qué quieren saber)
// - Emociones que los movilizan (con intensidad 0-100)
// - Insumos para construcción de discurso (qué decir / qué NO decir)
import { createClient } from "npm:@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !LOVABLE_API_KEY) {
    return new Response(JSON.stringify({ error: "Faltan variables de entorno" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    // 1. Tomar último batch con datos
    const { data: run } = await supabase
      .from("social_runs")
      .select("batch_id, ejecutada_en")
      .is("error", null)
      .gt("total_menciones", 0)
      .order("ejecutada_en", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!run) {
      return new Response(JSON.stringify({ success: false, error: "No hay batch reciente" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Cargar menciones estatales (foco ciudadano)
    const { data: menciones } = await supabase
      .from("social_menciones")
      .select("titulo, fragmento, tema, hashtags, sentimiento, fuente")
      .eq("batch_id", run.batch_id)
      .eq("entidad_tipo", "estatal")
      .limit(80);

    if (!menciones || menciones.length === 0) {
      return new Response(JSON.stringify({ success: false, error: "Sin menciones estatales" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. Construir corpus
    const corpus = menciones
      .map((m, i) => `[${i + 1}] ${m.titulo}\n${m.fragmento ?? ""}\nTema: ${m.tema ?? "—"} · Sent: ${m.sentimiento}`)
      .join("\n\n")
      .slice(0, 12000);

    // 4. Pedir a la IA que sintetice el discurso ciudadano
    const aiRes = await fetch(LOVABLE_AI_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content:
              "Eres analista de opinión pública en Michoacán, México. A partir de menciones recientes en medios y redes, sintetiza el DISCURSO CIUDADANO real: qué temas les obsesionan, qué buscan, qué emociones los movilizan y qué insumos sirven para construir el discurso de un candidato. Sé concreto, en español de México, sin tecnicismos. Nada inventado: si algo no está en el corpus, no lo agregues.",
          },
          { role: "user", content: `Corpus de ${menciones.length} menciones recientes sobre Michoacán:\n\n${corpus}\n\nDevuelve el análisis estructurado.` },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "emit_discurso_ciudadano",
              description: "Sintetiza el discurso ciudadano dominante en Michoacán",
              parameters: {
                type: "object",
                properties: {
                  palabras_clave: {
                    type: "array",
                    description: "Entre 20 y 40 palabras o frases breves (máx 30 caracteres) con peso de 1 a 100 y sentimiento positivo/neutro/negativo",
                    items: {
                      type: "object",
                      properties: {
                        palabra: { type: "string" },
                        peso: { type: "number" },
                        sentimiento: { type: "string" },
                      },
                      required: ["palabra", "peso", "sentimiento"],
                    },
                  },
                  temas_relevantes: {
                    type: "array",
                    description: "Entre 5 y 8 temas con mayor preocupación ciudadana, con intensidad 0-100 y descripción breve",
                    items: {
                      type: "object",
                      properties: {
                        tema: { type: "string" },
                        intensidad: { type: "number" },
                        descripcion: { type: "string" },
                      },
                      required: ["tema", "intensidad", "descripcion"],
                    },
                  },
                  busquedas_dominantes: {
                    type: "array",
                    description: "Entre 6 y 10 frases tipo búsqueda/pregunta que el ciudadano se hace",
                    items: { type: "string" },
                  },
                  emociones: {
                    type: "array",
                    description: "Entre 3 y 6 emociones dominantes. Usa solo: miedo, enojo, esperanza, frustración, orgullo, indiferencia, indignación, nostalgia. Incluye intensidad 0-100 y disparador breve",
                    items: {
                      type: "object",
                      properties: {
                        emocion: { type: "string" },
                        intensidad: { type: "number" },
                        disparador: { type: "string" },
                      },
                      required: ["emocion", "intensidad", "disparador"],
                    },
                  },
                  insumos_discurso: {
                    type: "object",
                    description: "Insumos para construir el discurso del candidato",
                    properties: {
                      que_decir: {
                        type: "array",
                        description: "3-6 mensajes que conectan con el sentir ciudadano",
                        items: { type: "string" },
                      },
                      que_evitar: {
                        type: "array",
                        description: "2-5 tabús o temas que generan rechazo",
                        items: { type: "string" },
                      },
                    },
                    required: ["que_decir", "que_evitar"],
                  },
                  resumen_ejecutivo: { type: "string", description: "Resumen ejecutivo en máximo 400 caracteres" },
                },
                required: ["palabras_clave", "temas_relevantes", "busquedas_dominantes", "emociones", "insumos_discurso", "resumen_ejecutivo"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "emit_discurso_ciudadano" } },
      }),
    });

    if (!aiRes.ok) {
      if (aiRes.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit del modelo, intenta en unos minutos" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiRes.status === 402) {
        return new Response(JSON.stringify({ error: "Sin créditos de Lovable AI" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await aiRes.text();
      console.error("AI error:", aiRes.status, t);
      return new Response(JSON.stringify({ error: "Falló la síntesis con IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiJson = await aiRes.json();
    const toolCall = aiJson.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return new Response(JSON.stringify({ error: "La IA no devolvió análisis" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const analisis = JSON.parse(toolCall.function.arguments);

    return new Response(
      JSON.stringify({
        success: true,
        batch_id: run.batch_id,
        generado_en: new Date().toISOString(),
        muestra: menciones.length,
        ...analisis,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("analizar-discurso-ciudadano error:", msg);
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

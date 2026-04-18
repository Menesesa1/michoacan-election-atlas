// Edge function: rapid-response
// Genera 3 borradores (Tweet + WhatsApp) en respuesta a una alerta o mención negativa.
// Usa el último análisis de discurso ciudadano como contexto si está disponible.
import { createClient } from "npm:@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

interface RapidInput {
  tipo: "alerta" | "mencion";
  titulo: string;
  descripcion?: string | null;
  fragmento?: string | null;
  fuente?: string | null;
  url?: string | null;
  distrito_o_entidad?: string | null;
  prioridad?: string | null;
  sentimiento?: number | null;
  candidato_propio?: string | null; // nombre opcional para personalizar el "yo" del mensaje
  tono?: "empatico" | "firme" | "propositivo"; // tono deseado
}

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

  let body: RapidInput;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "JSON inválido" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!body?.titulo) {
    return new Response(JSON.stringify({ error: "Falta 'titulo'" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Cargar último análisis de discurso ciudadano (opcional, mejora calidad)
  let discursoCtx = "";
  try {
    const { data: run } = await supabase
      .from("social_runs")
      .select("batch_id")
      .is("error", null)
      .gt("total_menciones", 0)
      .order("ejecutada_en", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (run?.batch_id) {
      const { data: resumen } = await supabase
        .from("social_resumen")
        .select("top_temas, top_hashtags, sentimiento_promedio")
        .eq("batch_id", run.batch_id)
        .eq("entidad_tipo", "estatal")
        .maybeSingle();
      if (resumen) {
        const temas = (resumen.top_temas as { value: string }[] | null)?.slice(0, 5).map((t) => t.value).join(", ") ?? "";
        const tags = (resumen.top_hashtags as { value: string }[] | null)?.slice(0, 5).map((t) => t.value).join(" ") ?? "";
        discursoCtx = `\n\nContexto del discurso ciudadano actual en Michoacán:\n- Temas dominantes: ${temas}\n- Hashtags activos: ${tags}\n- Sentimiento promedio estatal: ${resumen.sentimiento_promedio ?? "n/a"}`;
      }
    }
  } catch (_e) {
    // ignorable
  }

  const tono = body.tono ?? "empatico";
  const candidato = body.candidato_propio?.trim() || "el equipo de campaña";
  const ctxItem =
    body.tipo === "alerta"
      ? `ALERTA (${body.prioridad ?? "—"})\nTítulo: ${body.titulo}\nDescripción: ${body.descripcion ?? ""}\nÁmbito: ${body.distrito_o_entidad ?? ""}\nFuente: ${body.fuente ?? ""}`
      : `MENCIÓN NEGATIVA (sent: ${body.sentimiento ?? "n/a"})\nTítulo: ${body.titulo}\nFragmento: ${body.fragmento ?? ""}\nEntidad: ${body.distrito_o_entidad ?? ""}\nFuente: ${body.fuente ?? ""}`;

  const sys = `Eres jefe de gabinete de comunicación política en Michoacán, México. Generas RAPID RESPONSE de campaña: respuestas inmediatas, en español natural de México, sin clichés ni "hola buenas tardes". Tono ${tono}. Nunca inventes datos. Si no hay información suficiente, sé prudente y enfócate en el sentir/valor.
- Tweet: máx 270 caracteres, con 1 hashtag relevante de Michoacán si aplica.
- WhatsApp: máx 380 caracteres, formato cercano para reenviar a estructura territorial, puede usar emojis con moderación (máx 2).
Devuelve 3 variantes por canal: A (corto y directo), B (con dato/promesa concreta), C (emocional y movilizador).`;

  const user = `Genera Rapid Response para ${candidato} sobre el siguiente caso:\n\n${ctxItem}${discursoCtx}`;

  const aiRes = await fetch(LOVABLE_AI_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: sys },
        { role: "user", content: user },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "emit_rapid_response",
            description: "Devuelve borradores de respuesta rápida",
            parameters: {
              type: "object",
              properties: {
                analisis: { type: "string", description: "1-2 frases con el ángulo táctico recomendado" },
                tweets: {
                  type: "array",
                  description: "Exactamente 3 borradores de tweet (variantes A, B, C)",
                  items: {
                    type: "object",
                    properties: {
                      variante: { type: "string" },
                      texto: { type: "string" },
                    },
                    required: ["variante", "texto"],
                  },
                },
                whatsapp: {
                  type: "array",
                  description: "Exactamente 3 borradores de WhatsApp (variantes A, B, C)",
                  items: {
                    type: "object",
                    properties: {
                      variante: { type: "string" },
                      texto: { type: "string" },
                    },
                    required: ["variante", "texto"],
                  },
                },
                evitar: {
                  type: "array",
                  description: "2-3 cosas que NO se deben decir en este caso",
                  items: { type: "string" },
                },
              },
              required: ["analisis", "tweets", "whatsapp", "evitar"],
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "emit_rapid_response" } },
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
    return new Response(JSON.stringify({ error: "Falló la generación con IA" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const aiJson = await aiRes.json();
  const toolCall = aiJson.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall) {
    return new Response(JSON.stringify({ error: "La IA no devolvió borradores" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const out = JSON.parse(toolCall.function.arguments);

  return new Response(
    JSON.stringify({ success: true, generado_en: new Date().toISOString(), ...out }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});

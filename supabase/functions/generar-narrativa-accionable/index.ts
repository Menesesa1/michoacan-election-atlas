// Edge function: generar-narrativa-accionable
// Recibe contexto (entidad, emoción dominante, tema caliente, territorio,
// opcionalmente cib_alerta_id) y produce mensajes accionables vía Lovable AI.
// Persiste en narrativas_sugeridas (RLS por user_id).
import { createClient } from "npm:@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

interface Body {
  entidad_nombre: string;
  candidato_id?: string | null;
  contexto: string;
  emocion_dominante?: string | null;
  tema_caliente?: string | null;
  territorio?: string | null;
  cib_alerta_id?: string | null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !LOVABLE_API_KEY) {
    return new Response(JSON.stringify({ error: "Faltan envs" }), { status: 500, headers: corsHeaders });
  }

  // Autenticación: extraer user del JWT (verify_jwt = false por defecto)
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "No autenticado" }), { status: 401, headers: corsHeaders });
  }
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const token = authHeader.replace("Bearer ", "");
  const { data: userData, error: userErr } = await supabase.auth.getUser(token);
  if (userErr || !userData.user) {
    return new Response(JSON.stringify({ error: "Sesión inválida" }), { status: 401, headers: corsHeaders });
  }
  const userId = userData.user.id;

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "JSON inválido" }), { status: 400, headers: corsHeaders });
  }
  if (!body.entidad_nombre || !body.contexto) {
    return new Response(JSON.stringify({ error: "Faltan campos" }), { status: 400, headers: corsHeaders });
  }

  const aiRes = await fetch(LOVABLE_AI_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "system",
          content: `Eres estratega de comunicación política en Michoacán, México. Generas mensajes ACCIONABLES, listos para publicar, en español MX, breves (≤280 caracteres para Twitter, ≤500 para Facebook). Adaptas el tono a la emoción dominante del electorado. NO uses jerga corporativa, NO uses inglés. Habla como político mexicano.`,
        },
        {
          role: "user",
          content: `Entidad: ${body.entidad_nombre}
Territorio: ${body.territorio ?? "Michoacán"}
Tema caliente: ${body.tema_caliente ?? "general"}
Emoción dominante del electorado: ${body.emocion_dominante ?? "neutra"}
Contexto: ${body.contexto}

Genera 5 mensajes accionables (uno por tipo) y un mensaje de oportunidad si aplica.`,
        },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "emit_mensajes",
            parameters: {
              type: "object",
              properties: {
                mensajes: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      tipo: { type: "string", enum: ["defensivo", "contraste", "pivote", "oportunidad", "contranarrativa"] },
                      mensaje: { type: "string", maxLength: 500 },
                      tono: { type: "string", enum: ["firme", "empatico", "optimista", "directo"] },
                      plataforma: { type: "string", enum: ["twitter", "facebook", "rueda_prensa", "whatsapp"] },
                      urgencia: { type: "integer", minimum: 1, maximum: 5 },
                      emocion_objetivo: { type: "string" },
                    },
                    required: ["tipo", "mensaje", "tono", "plataforma", "urgencia", "emocion_objetivo"],
                  },
                },
              },
              required: ["mensajes"],
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "emit_mensajes" } },
    }),
  });

  if (!aiRes.ok) {
    if (aiRes.status === 429) {
      return new Response(JSON.stringify({ error: "Límite de IA, intenta en unos minutos" }), { status: 429, headers: corsHeaders });
    }
    if (aiRes.status === 402) {
      return new Response(JSON.stringify({ error: "Sin créditos de IA" }), { status: 402, headers: corsHeaders });
    }
    const txt = await aiRes.text();
    console.error("AI error:", txt);
    return new Response(JSON.stringify({ error: "Error en IA" }), { status: 500, headers: corsHeaders });
  }

  const aiJson = await aiRes.json();
  const tc = aiJson.choices?.[0]?.message?.tool_calls?.[0];
  if (!tc) {
    return new Response(JSON.stringify({ error: "Sin mensajes" }), { status: 500, headers: corsHeaders });
  }

  let mensajes: any[] = [];
  try {
    mensajes = JSON.parse(tc.function.arguments).mensajes ?? [];
  } catch {
    return new Response(JSON.stringify({ error: "Parse error" }), { status: 500, headers: corsHeaders });
  }

  const rows = mensajes.map((m) => ({
    user_id: userId,
    candidato_id: body.candidato_id ?? null,
    entidad_nombre: body.entidad_nombre,
    contexto: body.contexto,
    tipo: m.tipo,
    mensaje: m.mensaje,
    tono: m.tono,
    plataforma: m.plataforma,
    urgencia: m.urgencia,
    emocion_objetivo: m.emocion_objetivo,
    cib_alerta_id: body.cib_alerta_id ?? null,
  }));

  const { data: insertados, error: insErr } = await supabase
    .from("narrativas_sugeridas")
    .insert(rows)
    .select();
  if (insErr) {
    console.error("Insert narrativas:", insErr.message);
    return new Response(JSON.stringify({ error: insErr.message }), { status: 500, headers: corsHeaders });
  }

  return new Response(JSON.stringify({ success: true, mensajes: insertados }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});

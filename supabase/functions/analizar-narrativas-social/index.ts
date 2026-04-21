// Edge function: analizar-narrativas-social
// Toma menciones del último batch (estatal o candidatos según scope) y devuelve:
// - Narrativas dominantes (3-5) con sentimiento, volumen estimado y tendencia
// - Share of Voice por entidad (cuando scope = candidatos)
// - Alertas accionables (picos negativos, hashtags emergentes)
import { createClient } from "npm:@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
type Scope = "estatal" | "candidatos";

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
    const body = await req.json().catch(() => ({}));
    const scope: Scope = body?.scope === "candidatos" ? "candidatos" : "estatal";

    // 1. Tomar últimos 2 runs con datos (para calcular tendencia)
    const { data: runs } = await supabase
      .from("social_runs")
      .select("batch_id, ejecutada_en, total_menciones")
      .is("error", null)
      .gt("total_menciones", 0)
      .order("ejecutada_en", { ascending: false })
      .limit(2);

    if (!runs || runs.length === 0) {
      return new Response(JSON.stringify({ success: false, error: "No hay runs recientes" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const currentBatch = runs[0].batch_id;
    const previousBatch = runs[1]?.batch_id ?? null;

    const tipos = scope === "estatal" ? ["estatal"] : ["candidato_propio", "rival"];

    // 2. Cargar menciones del batch actual + previo (para tendencias)
    const { data: mensActual } = await supabase
      .from("social_menciones")
      .select("entidad_nombre, entidad_tipo, titulo, fragmento, tema, hashtags, sentimiento, fuente, publicada_en")
      .eq("batch_id", currentBatch)
      .in("entidad_tipo", tipos)
      .limit(120);

    if (!mensActual || mensActual.length === 0) {
      return new Response(JSON.stringify({ success: false, error: "Sin menciones en el scope solicitado" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let mensPrevio: typeof mensActual = [];
    if (previousBatch) {
      const { data } = await supabase
        .from("social_menciones")
        .select("entidad_nombre, tema, hashtags, sentimiento")
        .eq("batch_id", previousBatch)
        .in("entidad_tipo", tipos)
        .limit(120);
      mensPrevio = (data ?? []) as typeof mensActual;
    }

    // 3. Calcular Share of Voice y agregados deterministas
    const sov: Record<string, { tipo: string; menciones: number; sent_promedio: number }> = {};
    for (const m of mensActual) {
      const k = m.entidad_nombre;
      if (!sov[k]) sov[k] = { tipo: m.entidad_tipo, menciones: 0, sent_promedio: 0 };
      sov[k].menciones += 1;
      sov[k].sent_promedio += Number(m.sentimiento ?? 0);
    }
    const sovArr = Object.entries(sov)
      .map(([nombre, v]) => ({
        nombre,
        tipo: v.tipo,
        menciones: v.menciones,
        sentimiento: +(v.sent_promedio / Math.max(1, v.menciones)).toFixed(2),
        share_pct: +((v.menciones / mensActual.length) * 100).toFixed(1),
      }))
      .sort((a, b) => b.menciones - a.menciones);

    // Hashtags emergentes (presentes en actual y casi nulos en previo)
    const countActual = new Map<string, number>();
    const countPrevio = new Map<string, number>();
    for (const m of mensActual) for (const h of m.hashtags ?? []) countActual.set(h.toLowerCase(), (countActual.get(h.toLowerCase()) ?? 0) + 1);
    for (const m of mensPrevio) for (const h of m.hashtags ?? []) countPrevio.set(h.toLowerCase(), (countPrevio.get(h.toLowerCase()) ?? 0) + 1);
    const emergentes = Array.from(countActual.entries())
      .filter(([h, c]) => c >= 2 && (countPrevio.get(h) ?? 0) <= 1)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([h, c]) => ({ hashtag: h, menciones: c }));

    // 4. Construir corpus para la IA
    const corpus = mensActual
      .map((m, i) => `[${i + 1}] (${m.entidad_nombre}) ${m.titulo}\n${(m.fragmento ?? "").slice(0, 240)}\nTema: ${m.tema ?? "—"} · Sent: ${m.sentimiento}`)
      .join("\n\n")
      .slice(0, 14000);

    const sovBrief = sovArr.slice(0, 8).map(s => `${s.nombre} (${s.tipo}): ${s.menciones} menciones, sent ${s.sentimiento}, ${s.share_pct}% SoV`).join("\n");
    const emergentesBrief = emergentes.length ? emergentes.map(e => `#${e.hashtag} (${e.menciones} menciones, casi inexistente en run previo)`).join("\n") : "Sin hashtags emergentes detectados.";

    // 5. Pedir narrativas + alertas a la IA
    const modelos = ["google/gemini-2.5-flash", "google/gemini-2.5-pro", "google/gemini-2.5-flash-lite"];
    const buildBody = (model: string) => JSON.stringify({
      model,
      messages: [
        {
          role: "system",
          content:
            "Eres analista senior de inteligencia política en Michoacán, México. Detectas narrativas dominantes en conversaciones de medios y redes. Una narrativa NO es un tema (ej. 'inseguridad'), sino un relato con argumento (ej. 'La oposición acusa al gobierno estatal de pactar con grupos armados en Tierra Caliente'). Sé concreto, en español de México, sin tecnicismos. Solo usa información presente en el corpus. Si una narrativa es débil o ambigua, no la incluyas.",
        },
        {
          role: "user",
          content:
            `Scope: ${scope === "estatal" ? "Conversación estatal de Michoacán" : "Candidatos propios y rivales registrados"}\n` +
            `Muestra: ${mensActual.length} menciones del run actual, ${mensPrevio.length} del run previo.\n\n` +
            `Share of Voice (precalculado):\n${sovBrief}\n\n` +
            `Hashtags emergentes (precalculado):\n${emergentesBrief}\n\n` +
            `CORPUS:\n${corpus}\n\n` +
            `Devuelve narrativas dominantes y alertas accionables.`,
        },
      ],
      tools: [{
        type: "function",
        function: {
          name: "emit_narrativas",
          description: "Sintetiza narrativas dominantes y alertas para el equipo de campaña",
          parameters: {
            type: "object",
            properties: {
              narrativas: {
                type: "array",
                description: "3 a 5 narrativas dominantes (relatos con argumento, no temas sueltos)",
                items: {
                  type: "object",
                  properties: {
                    titulo: { type: "string", description: "Título corto de la narrativa, máximo 80 caracteres" },
                    descripcion: { type: "string", description: "Qué se dice y quién lo dice, 1-2 frases" },
                    sentimiento: { type: "string", enum: ["muy_positivo", "positivo", "neutro", "negativo", "muy_negativo"] },
                    intensidad: { type: "number", description: "0-100, qué tan dominante es esta narrativa en el corpus" },
                    tendencia: { type: "string", enum: ["creciente", "estable", "decreciente", "nueva"], description: "Comparado con el run previo" },
                    actores_clave: { type: "array", items: { type: "string" }, description: "1-4 actores, candidatos, partidos o medios que sostienen la narrativa" },
                    territorio: { type: "string", description: "Municipio o región si aplica, o 'Estatal'" },
                  },
                  required: ["titulo", "descripcion", "sentimiento", "intensidad", "tendencia", "actores_clave", "territorio"],
                },
              },
              alertas: {
                type: "array",
                description: "1 a 4 alertas accionables. Solo cosas urgentes o muy relevantes para el equipo de campaña.",
                items: {
                  type: "object",
                  properties: {
                    nivel: { type: "string", enum: ["urgente", "atencion", "oportunidad"] },
                    titulo: { type: "string", description: "Máximo 80 caracteres" },
                    descripcion: { type: "string", description: "Por qué importa y qué hacer, 1-2 frases" },
                    accion_sugerida: { type: "string", description: "Acción concreta de respuesta, máximo 120 caracteres" },
                  },
                  required: ["nivel", "titulo", "descripcion", "accion_sugerida"],
                },
              },
              resumen_ejecutivo: { type: "string", description: "Máximo 280 caracteres. Lo más importante en una frase." },
            },
            required: ["narrativas", "alertas", "resumen_ejecutivo"],
          },
        },
      }],
      tool_choice: { type: "function", function: { name: "emit_narrativas" } },
    });

    let aiRes: Response | null = null;
    let lastErrTxt = "";
    let lastStatus = 0;
    for (const model of modelos) {
      try {
        const r = await fetch(LOVABLE_AI_URL, {
          method: "POST",
          headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
          body: buildBody(model),
        });
        if (r.ok) { aiRes = r; break; }
        lastStatus = r.status;
        lastErrTxt = await r.text();
        console.error(`AI ${model} status ${r.status}:`, lastErrTxt.slice(0, 300));
        if (r.status === 429 || r.status === 402) break;
      } catch (e) {
        lastErrTxt = e instanceof Error ? e.message : String(e);
        console.error(`AI ${model} threw:`, lastErrTxt);
      }
    }

    if (!aiRes) {
      if (lastStatus === 429) {
        return new Response(JSON.stringify({ error: "Rate limit del modelo, intenta en unos minutos" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (lastStatus === 402) {
        return new Response(JSON.stringify({ error: "Sin créditos de Lovable AI" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(
        JSON.stringify({ error: "Modelos de IA temporalmente sobrecargados. Intenta de nuevo en 1-2 minutos.", detalle: lastErrTxt.slice(0, 200) }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const aiJson = await aiRes.json();
    const toolCall = aiJson.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return new Response(JSON.stringify({ error: "La IA no devolvió análisis estructurado" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const analisis = JSON.parse(toolCall.function.arguments);

    return new Response(
      JSON.stringify({
        success: true,
        scope,
        batch_id: currentBatch,
        previous_batch_id: previousBatch,
        generado_en: new Date().toISOString(),
        muestra_actual: mensActual.length,
        muestra_previa: mensPrevio.length,
        share_of_voice: sovArr,
        hashtags_emergentes: emergentes,
        ...analisis,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("analizar-narrativas-social error:", msg);
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// Precarga el género de los diputados locales ganadores en Michoacán
// para los procesos 2018, 2021 y 2024 usando Perplexity (sonar) con
// structured output. Devuelve un arreglo de { anio, distrito, nombre, genero }
// que el frontend aplica a los overrides locales del módulo de paridad.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");

interface ItemGenero {
  anio: number;
  distrito: number;
  nombre: string;
  genero: "M" | "H" | "ambiguo";
}

const SYSTEM = `Eres un investigador electoral. Devuelves SOLO datos verificables del Instituto Electoral de Michoacán (IEM) y prensa estatal. Para cada combinación distrito-año, devuelves el NOMBRE COMPLETO del/la diputado/a local de mayoría relativa que ganó la elección, y el género (M=mujer, H=hombre, ambiguo si no se puede determinar).`;

function buildPrompt(): string {
  const distritos = Array.from({ length: 24 }, (_, i) => i + 1);
  const anios = [2018, 2021, 2024];
  const combos: string[] = [];
  for (const a of anios) for (const d of distritos) combos.push(`distrito ${d} año ${a}`);
  return `Para Michoacán, dame el ganador (mayoría relativa) de cada distrito local en estos procesos:\n${combos.join("\n")}\n\nResponde con un JSON estricto. Si no encuentras dato confiable para alguna combinación, omítela del arreglo.`;
}

const SCHEMA = {
  name: "diputados_locales_ganadores",
  schema: {
    type: "object",
    properties: {
      ganadores: {
        type: "array",
        items: {
          type: "object",
          properties: {
            anio: { type: "integer" },
            distrito: { type: "integer" },
            nombre: { type: "string" },
            genero: { type: "string", enum: ["M", "H", "ambiguo"] },
          },
          required: ["anio", "distrito", "nombre", "genero"],
        },
      },
    },
    required: ["ganadores"],
  },
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  if (!PERPLEXITY_API_KEY) {
    return new Response(JSON.stringify({ error: "PERPLEXITY_API_KEY no configurada" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const resp = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar-pro",
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: buildPrompt() },
        ],
        temperature: 0.1,
        response_format: { type: "json_schema", json_schema: SCHEMA },
      }),
    });

    if (!resp.ok) {
      const txt = await resp.text();
      return new Response(JSON.stringify({ error: `Perplexity ${resp.status}`, detail: txt }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await resp.json();
    const raw = data.choices?.[0]?.message?.content ?? "{}";
    let parsed: { ganadores?: ItemGenero[] } = {};
    try {
      parsed = JSON.parse(raw);
    } catch {
      // Algunos modelos devuelven envuelto en ```json
      const m = raw.match(/```json\s*([\s\S]*?)```/);
      if (m) parsed = JSON.parse(m[1]);
    }
    const ganadores = (parsed.ganadores ?? []).filter(
      (g) => g.anio && g.distrito >= 1 && g.distrito <= 24,
    );

    return new Response(
      JSON.stringify({
        total: ganadores.length,
        ganadores,
        citations: data.citations ?? [],
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: (e as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

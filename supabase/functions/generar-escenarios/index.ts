// Edge function: enriquece escenarios base con IA y sugiere estrategias
// Usa Lovable AI Gateway (sin API key del usuario)

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface EscenarioInput {
  tipo: "optimista" | "moderado" | "pesimista";
  titulo: string;
  probabilidad: number;
  supuestos: string[];
  metricas: { label: string; valor: string; delta?: string }[];
}

interface RequestBody {
  nivel: "gobernador" | "diputados" | "ayuntamientos";
  nivelLabel: string;
  escenarios: EscenarioInput[];
  contexto?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY no configurado");
    }

    const body = (await req.json()) as RequestBody;

    if (!body?.nivel || !Array.isArray(body?.escenarios) || body.escenarios.length === 0) {
      return new Response(
        JSON.stringify({ error: "Payload inválido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const systemPrompt = `Eres analista político senior especializado en Michoacán de Ocampo, México.
Trabajas para un equipo estratégico de campaña. Tu tarea: enriquecer escenarios prospectivos
y proponer estrategias accionables, realistas y específicas para el contexto michoacano
(Tierra Caliente, Meseta Purépecha, Bajío, Costa, Morelia metropolitana).

Reglas:
- Cero genéricos. Cita distritos, municipios, regiones reales de Michoacán cuando aplique.
- Estrategias accionables en 30-90 días, no aspiracionales.
- Considera factores reales: seguridad, migración, remesas, agroexportación, narcomenudeo,
  estructura partidista PRI/PAN/PRD/MORENA/MC/PT, autodefensas históricas.
- Responde EXCLUSIVAMENTE con el JSON solicitado vía tool calling.`;

    const userPrompt = `Nivel electoral: ${body.nivelLabel}
${body.contexto ? `Contexto adicional: ${body.contexto}\n` : ""}
Escenarios base a enriquecer:

${body.escenarios
  .map(
    (e) => `### ${e.tipo.toUpperCase()} — ${e.titulo} (probabilidad base ${e.probabilidad}%)
Supuestos: ${e.supuestos.join("; ")}
Métricas: ${e.metricas.map((m) => `${m.label}: ${m.valor}`).join(" · ")}`,
  )
  .join("\n\n")}

Para cada escenario:
1. narrativa: 2-3 frases que expliquen cómo se materializa
2. señales_tempranas: 3-4 indicadores observables en próximos 90 días
3. estrategias: 4-5 acciones concretas (territorio, comunicación, alianzas, defensa, datos)
4. riesgos_clave: 2-3 amenazas que pueden mover el escenario al peor caso
5. ventana_accion: marco temporal recomendado para ejecutar`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "entregar_escenarios",
                description: "Devuelve los 3 escenarios enriquecidos con estrategias",
                parameters: {
                  type: "object",
                  properties: {
                    escenarios: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          tipo: { type: "string", enum: ["optimista", "moderado", "pesimista"] },
                          narrativa: { type: "string" },
                          señales_tempranas: {
                            type: "array",
                            items: { type: "string" },
                          },
                          estrategias: {
                            type: "array",
                            items: {
                              type: "object",
                              properties: {
                                titulo: { type: "string" },
                                detalle: { type: "string" },
                                area: {
                                  type: "string",
                                  enum: ["territorio", "comunicacion", "alianzas", "defensa", "datos", "movilizacion"],
                                },
                                prioridad: {
                                  type: "string",
                                  enum: ["alta", "media", "baja"],
                                },
                              },
                              required: ["titulo", "detalle", "area", "prioridad"],
                              additionalProperties: false,
                            },
                          },
                          riesgos_clave: {
                            type: "array",
                            items: { type: "string" },
                          },
                          ventana_accion: { type: "string" },
                        },
                        required: [
                          "tipo",
                          "narrativa",
                          "señales_tempranas",
                          "estrategias",
                          "riesgos_clave",
                          "ventana_accion",
                        ],
                        additionalProperties: false,
                      },
                    },
                  },
                  required: ["escenarios"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: {
            type: "function",
            function: { name: "entregar_escenarios" },
          },
        }),
      },
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Límite de IA alcanzado, intenta en un minuto." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Sin créditos de IA. Recarga en Settings > Workspace > Usage." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      return new Response(
        JSON.stringify({ error: "Error en gateway de IA" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const data = await response.json();
    const toolCall = data?.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      throw new Error("Respuesta sin tool_call");
    }

    const parsed = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("generar-escenarios error:", err);
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : "Error desconocido",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

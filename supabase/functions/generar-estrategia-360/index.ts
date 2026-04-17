// Edge function: genera estrategia 360 completa enriquecida con datos reales del territorio
// Usa Lovable AI Gateway con tool calling para devolver JSON estructurado de 10 secciones.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SnapshotInput {
  nivel: "gobernador" | "diputados" | "ayuntamientos";
  nivelLabel: string;
  territorio: string;
  posicion: "oficialismo" | "oposicion" | "aspirante";
  coalicion: string[];
  horizonte: string;
  // Datos crudos del territorio
  historico: {
    año: number;
    ganador: string;
    margen_pp: number;
    participacion_pct: number;
    voto_morena_pct?: number;
    voto_pan_pct?: number;
    voto_pri_pct?: number;
    voto_mc_pct?: number;
  }[];
  demografia?: {
    lista_nominal: number;
    pct_jovenes_18_29?: number;
    pct_mujeres?: number;
    pct_adultos_mayores?: number;
  };
  socioeconomico?: {
    nivel_marginacion?: string;
    ocupacion_dominante?: string;
    pct_pobreza?: number;
  };
  competitividad?: {
    margen_ultimo_pct: number;
    indice_lealtad?: number; // 0-100
    riesgo_alternancia?: "alto" | "medio" | "bajo";
  };
  alertas_activas?: string[];
  supuestos_usuario?: {
    participacion_esperada_pct?: number;
    voto_duro_pct?: number;
    presupuesto_total_mxn?: number;
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY no configurado");

    const body = (await req.json()) as SnapshotInput;
    if (!body?.nivel || !body?.territorio) {
      return new Response(JSON.stringify({ error: "Payload inválido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `Eres consultor político senior de élite, especializado en Michoacán de Ocampo, México.
Trabajas para EME (Job Meneses) en las campañas de Alfonso Martínez y aliados.
Conoces a fondo: Tierra Caliente, Meseta Purépecha, Bajío Zamorano, Costa, Morelia metropolitana,
estructura PRI/PAN/PRD/MORENA/MC/PT/PVEM, autodefensas, cárteles, agroexportación, migración, remesas.

Tu salida es un BRIEF EJECUTIVO 360 accionable para War Room, NO genérico.
Cita siempre datos reales del snapshot recibido (margen, participación, demografía).
Si el snapshot indica un dato, úsalo literalmente. Si propones una sección/colonia/calle,
debe ser coherente con el territorio dado.

Responde EXCLUSIVAMENTE vía tool calling con el JSON solicitado.`;

    const userPrompt = `## Snapshot del territorio

**Nivel:** ${body.nivelLabel}
**Territorio:** ${body.territorio}
**Posición de partida:** ${body.posicion}
**Coalición tentativa:** ${body.coalicion.join(", ") || "Aún por definir"}
**Horizonte:** ${body.horizonte}

### Histórico electoral
${body.historico
  .map(
    (h) =>
      `- ${h.año}: ganó ${h.ganador} (margen ${h.margen_pp.toFixed(1)} pp, participación ${h.participacion_pct.toFixed(1)}%${
        h.voto_morena_pct !== undefined
          ? `, MORENA ${h.voto_morena_pct.toFixed(1)}%`
          : ""
      }${h.voto_pan_pct !== undefined ? `, PAN ${h.voto_pan_pct.toFixed(1)}%` : ""})`,
  )
  .join("\n")}

### Demografía
${body.demografia ? `Lista nominal: ${body.demografia.lista_nominal.toLocaleString()}
Jóvenes 18-29: ${body.demografia.pct_jovenes_18_29?.toFixed(1) ?? "n/d"}%
Mujeres: ${body.demografia.pct_mujeres?.toFixed(1) ?? "n/d"}%
Adultos mayores: ${body.demografia.pct_adultos_mayores?.toFixed(1) ?? "n/d"}%` : "Sin datos"}

### Socioeconómico
${body.socioeconomico ? `Marginación: ${body.socioeconomico.nivel_marginacion ?? "n/d"}
Ocupación dominante: ${body.socioeconomico.ocupacion_dominante ?? "n/d"}
Pobreza: ${body.socioeconomico.pct_pobreza?.toFixed(1) ?? "n/d"}%` : "Sin datos"}

### Competitividad
${body.competitividad ? `Margen último proceso: ${body.competitividad.margen_ultimo_pct.toFixed(1)} pp
Lealtad estimada: ${body.competitividad.indice_lealtad ?? "n/d"}/100
Riesgo alternancia: ${body.competitividad.riesgo_alternancia ?? "n/d"}` : "Sin datos"}

### Alertas activas
${body.alertas_activas?.length ? body.alertas_activas.map((a) => `- ${a}`).join("\n") : "Sin alertas reportadas"}

### Supuestos del usuario
${body.supuestos_usuario ? `Participación esperada: ${body.supuestos_usuario.participacion_esperada_pct ?? "n/d"}%
Voto duro estimado: ${body.supuestos_usuario.voto_duro_pct ?? "n/d"}%
Presupuesto total: ${body.supuestos_usuario.presupuesto_total_mxn ? `$${body.supuestos_usuario.presupuesto_total_mxn.toLocaleString()} MXN` : "n/d"}` : "Sin supuestos"}

## Entregables (todos obligatorios)

Genera un brief ejecutivo 360 con las 10 secciones del schema. Cada item debe ser específico,
medible, accionable y citar contexto real del snapshot.`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-pro",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "entregar_estrategia_360",
                description: "Devuelve brief ejecutivo 360 completo",
                parameters: {
                  type: "object",
                  properties: {
                    resumen_ejecutivo: { type: "string", description: "3-4 frases con la tesis estratégica central" },
                    foda: {
                      type: "object",
                      properties: {
                        fortalezas: { type: "array", items: { type: "string" } },
                        oportunidades: { type: "array", items: { type: "string" } },
                        debilidades: { type: "array", items: { type: "string" } },
                        amenazas: { type: "array", items: { type: "string" } },
                      },
                      required: ["fortalezas", "oportunidades", "debilidades", "amenazas"],
                      additionalProperties: false,
                    },
                    escenarios: {
                      type: "array",
                      description: "Exactamente 3: optimista, moderado, pesimista",
                      items: {
                        type: "object",
                        properties: {
                          tipo: { type: "string", enum: ["optimista", "moderado", "pesimista"] },
                          probabilidad_pct: { type: "number" },
                          margen_estimado: { type: "string" },
                          narrativa: { type: "string" },
                          condiciones_disparadoras: { type: "array", items: { type: "string" } },
                        },
                        required: ["tipo", "probabilidad_pct", "margen_estimado", "narrativa", "condiciones_disparadoras"],
                        additionalProperties: false,
                      },
                    },
                    segmentacion: {
                      type: "array",
                      description: "Voto duro, blando, indeciso, opositor (4 elementos)",
                      items: {
                        type: "object",
                        properties: {
                          segmento: { type: "string", enum: ["duro", "blando", "indeciso", "opositor"] },
                          pct_estimado: { type: "number" },
                          volumen_estimado: { type: "number", description: "Personas en el padrón" },
                          perfil: { type: "string" },
                          mensaje_clave: { type: "string" },
                          tactica: { type: "string" },
                        },
                        required: ["segmento", "pct_estimado", "volumen_estimado", "perfil", "mensaje_clave", "tactica"],
                        additionalProperties: false,
                      },
                    },
                    narrativa_central: {
                      type: "object",
                      properties: {
                        slogan: { type: "string" },
                        tesis: { type: "string" },
                        tres_pilares: { type: "array", items: { type: "string" } },
                      },
                      required: ["slogan", "tesis", "tres_pilares"],
                      additionalProperties: false,
                    },
                    plan_territorial: {
                      type: "array",
                      description: "Top 8-10 zonas/secciones/colonias prioritarias",
                      items: {
                        type: "object",
                        properties: {
                          zona: { type: "string" },
                          tipo: { type: "string", enum: ["bastion", "bisagra", "oposicion_ablandable", "expansion"] },
                          justificacion: { type: "string" },
                          accion_prioritaria: { type: "string" },
                          roi_estimado: { type: "string", enum: ["alto", "medio", "bajo"] },
                        },
                        required: ["zona", "tipo", "justificacion", "accion_prioritaria", "roi_estimado"],
                        additionalProperties: false,
                      },
                    },
                    calendario: {
                      type: "array",
                      description: "Hitos en 3 ventanas: 90 días, 60 días, 30 días",
                      items: {
                        type: "object",
                        properties: {
                          ventana: { type: "string", enum: ["90_dias", "60_dias", "30_dias"] },
                          hitos: { type: "array", items: { type: "string" } },
                        },
                        required: ["ventana", "hitos"],
                        additionalProperties: false,
                      },
                    },
                    presupuesto: {
                      type: "array",
                      description: "Distribución sugerida por rubro (suma 100)",
                      items: {
                        type: "object",
                        properties: {
                          rubro: { type: "string", enum: ["territorio", "digital", "medios", "eventos", "defensa_voto", "operacion", "investigacion"] },
                          pct: { type: "number" },
                          monto_sugerido_mxn: { type: "number" },
                          justificacion: { type: "string" },
                        },
                        required: ["rubro", "pct", "monto_sugerido_mxn", "justificacion"],
                        additionalProperties: false,
                      },
                    },
                    estructura: {
                      type: "object",
                      properties: {
                        coordinaciones: { type: "array", items: { type: "string" } },
                        brigadistas_estimados: { type: "number" },
                        casas_campaña: { type: "number" },
                        notas: { type: "string" },
                      },
                      required: ["coordinaciones", "brigadistas_estimados", "casas_campaña", "notas"],
                      additionalProperties: false,
                    },
                    riesgos: {
                      type: "array",
                      description: "Matriz de riesgos clave",
                      items: {
                        type: "object",
                        properties: {
                          riesgo: { type: "string" },
                          probabilidad: { type: "string", enum: ["alta", "media", "baja"] },
                          impacto: { type: "string", enum: ["alto", "medio", "bajo"] },
                          mitigacion: { type: "string" },
                        },
                        required: ["riesgo", "probabilidad", "impacto", "mitigacion"],
                        additionalProperties: false,
                      },
                    },
                    kpis: {
                      type: "array",
                      description: "5-7 KPIs medibles semanalmente",
                      items: {
                        type: "object",
                        properties: {
                          nombre: { type: "string" },
                          meta: { type: "string" },
                          frecuencia: { type: "string", enum: ["diaria", "semanal", "quincenal"] },
                          fuente: { type: "string" },
                        },
                        required: ["nombre", "meta", "frecuencia", "fuente"],
                        additionalProperties: false,
                      },
                    },
                  },
                  required: [
                    "resumen_ejecutivo",
                    "foda",
                    "escenarios",
                    "segmentacion",
                    "narrativa_central",
                    "plan_territorial",
                    "calendario",
                    "presupuesto",
                    "estructura",
                    "riesgos",
                    "kpis",
                  ],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: {
            type: "function",
            function: { name: "entregar_estrategia_360" },
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
      return new Response(JSON.stringify({ error: "Error en gateway de IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data?.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) throw new Error("Respuesta sin tool_call");

    const parsed = JSON.parse(toolCall.function.arguments);
    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("generar-estrategia-360 error:", err);
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : "Error desconocido",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

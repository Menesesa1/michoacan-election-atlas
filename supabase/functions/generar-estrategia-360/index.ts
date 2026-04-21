// Edge function: genera estrategia 360 completa enriquecida con datos reales del territorio
// Usa Lovable AI Gateway con tool calling para devolver JSON estructurado de 10 secciones.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SnapshotInput {
  nivel: "gobernador" | "diputados_federales" | "diputados" | "ayuntamientos";
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
  meta_victoria?: {
    lista_nominal: number;
    participacion_supuesta_pct: number;
    umbral_victoria_pct: number;
    votos_requeridos_estimado: number;
    secciones_totales: number;
    promedio_lista_por_seccion: number;
    secciones_minimas_a_movilizar: number;
    municipios_pivote: { clave: number; nombre: string; secciones: number; peso_pct_total: number }[];
    secciones_clave_top: { sec: number; municipio: string; tipo: string }[];
  };
  candidatos?: {
    propio?: Record<string, unknown>;
    adversarios?: Record<string, unknown>[];
  };
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

### META DE VICTORIA (cálculo determinístico — usa estas cifras tal cual, NO las inventes)
${body.meta_victoria ? `Lista nominal del territorio: ${body.meta_victoria.lista_nominal.toLocaleString()}
Participación supuesta: ${body.meta_victoria.participacion_supuesta_pct}%
Umbral de victoria: ${body.meta_victoria.umbral_victoria_pct}% (sobre votos emitidos)
**VOTOS REQUERIDOS PARA GANAR: ${body.meta_victoria.votos_requeridos_estimado.toLocaleString()}**
Secciones totales: ${body.meta_victoria.secciones_totales}
Promedio lista nominal por sección: ${body.meta_victoria.promedio_lista_por_seccion.toLocaleString()}
**Secciones mínimas a movilizar: ${body.meta_victoria.secciones_minimas_a_movilizar}** (de ${body.meta_victoria.secciones_totales})

Municipios pivote (top por aportación de secciones):
${body.meta_victoria.municipios_pivote.map((m) => `- ${m.nombre} (clave INEGI ${m.clave}): ${m.secciones} secciones (${m.peso_pct_total}% del territorio)`).join("\n")}

Secciones clave priorizables (urbanas/mixtas con mayor densidad):
${body.meta_victoria.secciones_clave_top.map((s) => `- Sec ${s.sec} · ${s.municipio} · ${s.tipo}`).join("\n")}` : "Cálculo no disponible (catálogo INE no cargado). Usa razonamiento cualitativo."}

### Candidatos en disputa
${body.candidatos?.propio ? `**Candidato propio:** ${JSON.stringify(body.candidatos.propio).slice(0, 600)}` : ""}
${body.candidatos?.adversarios?.length ? `**Adversarios:**\n${body.candidatos.adversarios.slice(0, 4).map((a) => `- ${JSON.stringify(a).slice(0, 400)}`).join("\n")}` : ""}

### Supuestos del usuario
${body.supuestos_usuario ? `Participación esperada: ${body.supuestos_usuario.participacion_esperada_pct ?? "n/d"}%
Voto duro estimado: ${body.supuestos_usuario.voto_duro_pct ?? "n/d"}%
Presupuesto total: ${body.supuestos_usuario.presupuesto_total_mxn ? `$${body.supuestos_usuario.presupuesto_total_mxn.toLocaleString()} MXN` : "n/d"}` : "Sin supuestos"}

## Entregables (todos obligatorios)

Genera un brief ejecutivo 360 con TODAS las secciones del schema. Cada item debe ser específico,
medible, accionable y citar contexto real del snapshot.

REGLAS DURAS:
1. En **meta_victoria** usa LITERALMENTE los números ya calculados (votos_requeridos, municipios_pivote, secciones_clave). Tu trabajo es NARRAR y JUSTIFICAR, no recalcular.
2. En **estrategia_digital_comunicacion** sintetiza el sentimiento a partir de alertas_activas + adversarios. Si no hay datos, declara tono "neutro" y no inventes hostilidad.
3. Voceros deben mapearse a War Room del candidato propio si se proporcionó.
4. NO repitas información — cada sección aporta una capa distinta.`;

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
                    meta_victoria: {
                      type: "object",
                      description: "Camino territorial a la victoria. USA los números calculados, narra y justifica.",
                      properties: {
                        votos_objetivo: { type: "number", description: "Repite el votos_requeridos_estimado del snapshot" },
                        participacion_supuesta_pct: { type: "number" },
                        umbral_pct: { type: "number" },
                        narrativa_camino: { type: "string", description: "2-3 frases tipo 'Para ganar X necesitas Y votos en Z secciones de...'" },
                        municipios_pivote: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              nombre: { type: "string" },
                              peso_pct_total: { type: "number" },
                              secciones: { type: "number" },
                              accion_clave: { type: "string", description: "Acción concreta para ese municipio" },
                            },
                            required: ["nombre", "peso_pct_total", "secciones", "accion_clave"],
                            additionalProperties: false,
                          },
                        },
                        secciones_clave: {
                          type: "array",
                          description: "6-12 secciones priorizadas con justificación",
                          items: {
                            type: "object",
                            properties: {
                              municipio: { type: "string" },
                              num_secciones: { type: "number" },
                              votos_aporte_estimado: { type: "number" },
                              tipo_seccion: { type: "string", enum: ["urbana", "mixta", "rural"] },
                              justificacion: { type: "string" },
                            },
                            required: ["municipio", "num_secciones", "votos_aporte_estimado", "tipo_seccion", "justificacion"],
                            additionalProperties: false,
                          },
                        },
                      },
                      required: ["votos_objetivo", "participacion_supuesta_pct", "umbral_pct", "narrativa_camino", "municipios_pivote", "secciones_clave"],
                      additionalProperties: false,
                    },
                    estrategia_digital_comunicacion: {
                      type: "object",
                      description: "Plan integral de comunicación política y digital.",
                      properties: {
                        diagnostico_sentimiento: {
                          type: "object",
                          properties: {
                            tono_actual: { type: "string", enum: ["hostil", "neutro", "favorable", "polarizado"] },
                            temas_calientes: { type: "array", items: { type: "string" } },
                            adversarios_dominantes_en_red: { type: "array", items: { type: "string" } },
                            sintesis: { type: "string" },
                          },
                          required: ["tono_actual", "temas_calientes", "adversarios_dominantes_en_red", "sintesis"],
                          additionalProperties: false,
                        },
                        arquitectura_mensaje: {
                          type: "object",
                          properties: {
                            eje_emocional: { type: "string" },
                            eje_racional: { type: "string" },
                            frases_paraguas: { type: "array", items: { type: "string" }, description: "Exactamente 3" },
                            tabues: { type: "array", items: { type: "string" } },
                          },
                          required: ["eje_emocional", "eje_racional", "frases_paraguas", "tabues"],
                          additionalProperties: false,
                        },
                        plataformas: {
                          type: "array",
                          description: "5-6 plataformas (FB/IG/TikTok/X/YouTube/WhatsApp)",
                          items: {
                            type: "object",
                            properties: {
                              red: { type: "string", enum: ["Facebook", "Instagram", "TikTok", "X", "YouTube", "WhatsApp"] },
                              prioridad: { type: "string", enum: ["alta", "media", "baja"] },
                              formato_dominante: { type: "string" },
                              frecuencia_semanal: { type: "string" },
                              kpi_principal: { type: "string" },
                              justificacion_audiencia: { type: "string" },
                            },
                            required: ["red", "prioridad", "formato_dominante", "frecuencia_semanal", "kpi_principal", "justificacion_audiencia"],
                            additionalProperties: false,
                          },
                        },
                        voceros: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              perfil: { type: "string" },
                              funcion: { type: "string", enum: ["ataque", "empatia", "propuesta", "territorio"] },
                            },
                            required: ["perfil", "funcion"],
                            additionalProperties: false,
                          },
                        },
                        calendario_contenido_semanal: {
                          type: "object",
                          properties: {
                            lunes: { type: "string" },
                            martes: { type: "string" },
                            miercoles: { type: "string" },
                            jueves: { type: "string" },
                            viernes: { type: "string" },
                            sabado: { type: "string" },
                            domingo: { type: "string" },
                          },
                          required: ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"],
                          additionalProperties: false,
                        },
                        contraataque_y_crisis: {
                          type: "object",
                          properties: {
                            triggers: { type: "array", items: { type: "string" } },
                            protocolo_24h: { type: "string" },
                            mensajes_pre_aprobados: { type: "array", items: { type: "string" } },
                          },
                          required: ["triggers", "protocolo_24h", "mensajes_pre_aprobados"],
                          additionalProperties: false,
                        },
                        aliados_influencia: {
                          type: "array",
                          description: "Micro-influencers, medios y voces locales por región",
                          items: {
                            type: "object",
                            properties: {
                              perfil: { type: "string" },
                              region: { type: "string" },
                              tipo: { type: "string", enum: ["micro_influencer", "medio_local", "lider_opinion", "colectivo"] },
                            },
                            required: ["perfil", "region", "tipo"],
                            additionalProperties: false,
                          },
                        },
                      },
                      required: ["diagnostico_sentimiento", "arquitectura_mensaje", "plataformas", "voceros", "calendario_contenido_semanal", "contraataque_y_crisis", "aliados_influencia"],
                      additionalProperties: false,
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
                    "meta_victoria",
                    "estrategia_digital_comunicacion",
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

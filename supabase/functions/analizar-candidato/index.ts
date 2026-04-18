// Edge function: analiza un candidato desde tres ángulos (perfil, OSINT, discurso)
// usando Lovable AI Gateway con tool-calling para garantizar JSON estructurado.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type Tipo = "perfil" | "osint" | "discurso";

interface WarRoomMiembroInput {
  nombre: string;
  rol: string;
  tipo: "persona" | "consultora";
  visible: boolean;
  trayectoria_breve?: string;
  inconsistencias?: string[];
  fuentes?: string[];
}

interface TrayectoriaHitoInput {
  anio: number;
  cargo: string;
  partido?: string;
  tipo: string; // electo | designado | candidatura | cambio_partido | dirigencia | otro
  descripcion?: string;
  fuentes?: string[];
}

interface MetricaRedInput {
  seguidores?: number;
  engagement_rate?: number;
  ultima_actualizacion?: string;
  notas?: string;
}

type MetricasRedesInput = Partial<Record<"facebook" | "twitter" | "instagram" | "tiktok" | "youtube", MetricaRedInput>>;

interface Input {
  tipo: Tipo;
  candidato: {
    nombre: string;
    partido: string;
    nivel: string;
    territorio: string;
    fase?: "aspirante" | "precampana" | "campana" | "electo";
    cargo_buscado?: string;
    bio_breve?: string;
    redes?: Record<string, string>;
    notas?: string;
    war_room?: WarRoomMiembroInput[];
    trayectoria?: TrayectoriaHitoInput[];
    metricas_redes?: MetricasRedesInput;
  };
  contexto_territorial?: string;
  /** Otros aspirantes/competidores en la misma contienda. La IA evaluará fortalezas RELATIVAS. */
  competidores?: { nombre: string; partido: string; bio_breve?: string }[];
}

const TOOLS = {
  perfil: {
    type: "function",
    function: {
      name: "perfil_candidato",
      description: "Devuelve análisis FODA y perfil competitivo del candidato.",
      parameters: {
        type: "object",
        properties: {
          fortalezas: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 6 },
          debilidades: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 6 },
          oportunidades: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 6 },
          amenazas: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 6 },
          score_competitividad: { type: "number", minimum: 0, maximum: 100 },
          perfil_votante_natural: { type: "string" },
        },
        required: ["fortalezas", "debilidades", "oportunidades", "amenazas", "score_competitividad", "perfil_votante_natural"],
        additionalProperties: false,
      },
    },
  },
  osint: {
    type: "function",
    function: {
      name: "osint_candidato",
      description: "Análisis OSINT basado en información pública conocida del modelo.",
      parameters: {
        type: "object",
        properties: {
          presencia_digital: {
            type: "object",
            properties: {
              nivel: { type: "string", enum: ["alta", "media", "baja"] },
              plataformas_fuertes: { type: "array", items: { type: "string" } },
              observaciones: { type: "string" },
            },
            required: ["nivel", "plataformas_fuertes", "observaciones"],
            additionalProperties: false,
          },
          controversias: {
            type: "array",
            items: {
              type: "object",
              properties: {
                tema: { type: "string" },
                gravedad: { type: "string", enum: ["alta", "media", "baja"] },
                descripcion: { type: "string" },
              },
              required: ["tema", "gravedad", "descripcion"],
              additionalProperties: false,
            },
          },
          aliados_clave: { type: "array", items: { type: "string" } },
          temas_recurrentes: { type: "array", items: { type: "string" } },
          menciones_recientes: {
            type: "array",
            items: {
              type: "object",
              properties: {
                fuente: { type: "string" },
                titular: { type: "string" },
                tono: { type: "string", enum: ["positivo", "neutral", "negativo"] },
              },
              required: ["fuente", "titular", "tono"],
              additionalProperties: false,
            },
          },
          war_room_resumen: {
            type: "object",
            description: "Análisis del War Room CAPTURADO POR EL CONSULTOR (no inventes miembros). Coherencia con narrativa pública y alertas reputacionales por miembro.",
            properties: {
              coherencia_con_narrativa: { type: "string" },
              alertas_reputacionales: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    miembro: { type: "string" },
                    alerta: { type: "string" },
                    gravedad: { type: "string", enum: ["alta", "media", "baja"] },
                  },
                  required: ["miembro", "alerta", "gravedad"],
                  additionalProperties: false,
                },
              },
              observaciones: { type: "string" },
            },
            required: ["coherencia_con_narrativa", "alertas_reputacionales", "observaciones"],
            additionalProperties: false,
          },
        },
        required: ["presencia_digital", "controversias", "aliados_clave", "temas_recurrentes", "menciones_recientes"],
        additionalProperties: false,
      },
    },
  },
  discurso: {
    type: "function",
    function: {
      name: "discurso_candidato",
      description: "Análisis discursivo y narrativa del candidato.",
      parameters: {
        type: "object",
        properties: {
          ejes_narrativos: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 6 },
          tono: { type: "string" },
          frames_dominantes: { type: "array", items: { type: "string" } },
          vulnerabilidades_argumentales: { type: "array", items: { type: "string" } },
          contraargumentos_sugeridos: {
            type: "array",
            items: {
              type: "object",
              properties: {
                vs_eje: { type: "string" },
                respuesta: { type: "string" },
              },
              required: ["vs_eje", "respuesta"],
              additionalProperties: false,
            },
          },
        },
        required: ["ejes_narrativos", "tono", "frames_dominantes", "vulnerabilidades_argumentales", "contraargumentos_sugeridos"],
        additionalProperties: false,
      },
    },
  },
} as const;

const NIVEL_CONTEXTO: Record<string, string> = {
  gobernador: `CARGO: GOBERNATURA DEL ESTADO DE MICHOACÁN.
Considera dinámicas estatales completas: 24 distritos locales, 113 municipios, coaliciones estatales,
voto rural vs urbano (Morelia, Uruapan, Zamora, Lázaro Cárdenas), seguridad regional (Tierra Caliente,
Meseta Purépecha), relación con federación, magisterio (CNTE-Sección XVIII) y autodefensas/normalistas.
NO mezcles dinámicas locales municipales como si fueran estatales.`,
  diputados: `CARGO: DIPUTACIÓN LOCAL EN EL CONGRESO DE MICHOACÁN (LXXVI Legislatura).
Considera el distrito específico, su cabecera, composición rural/urbana, voto histórico distrital,
agenda legislativa local (presupuesto, fiscalización, leyes secundarias), relación con presidencia
municipal del distrito y con el gobierno estatal. Enfoca el FODA en territorio acotado y bancada.
NO trates al candidato como si compitiera por gobernatura o alcaldía.`,
  ayuntamientos: `CARGO: PRESIDENCIA MUNICIPAL EN MICHOACÁN.
Considera dinámica MUNICIPAL específica: cabildo, regidurías, sindicatura, servicios públicos
(agua, basura, alumbrado, panteones), seguridad municipal, obra pública local, relación con
gobernador y diputado local del distrito. Si es Morelia/Uruapan/Zamora/Lázaro Cárdenas, factor
metropolitano. Si es municipio rural, factor caciquismo, comunidades indígenas y migración.
NO confundas con cargo legislativo ni estatal.`,
};

const SYSTEM_PROMPT = `Eres un consultor político senior especializado en Michoacán, México.
Analizas candidatos a cargos de elección popular (gobernatura, diputaciones locales, ayuntamientos).

JERARQUÍA DE EVIDENCIA (respétala estrictamente):
1. DATOS VERIFICADOS POR EL CONSULTOR (trayectoria, métricas de redes, war room) → son la BASE DURA.
   Cita estos datos por año/cifra concreta cuando construyas FODA, OSINT y discurso.
2. Información pública conocida por el modelo → úsala SOLO para complementar y siempre marca incertidumbre.
3. NO inventes cargos, años, partidos, cifras de seguidores, engagement, miembros del equipo ni controversias.
   Si la información verificada está vacía o es insuficiente, dilo explícitamente en el campo correspondiente.

CRÍTICO: TODO el análisis debe ser COHERENTE con el NIVEL del cargo:
- Gobernatura → escala estatal (24 distritos, 113 municipios, coaliciones estatales).
- Diputado Local → escala distrital (1 de 24 distritos, agenda legislativa local).
- Ayuntamiento → escala municipal (gestión local, cabildo, servicios).
NO mezcles escalas.

REGLAS ESPECÍFICAS:
- Trayectoria: si hay cambios de partido, considéralos en FODA (lealtad/ductilidad), OSINT (narrativa) y discurso (consistencia ideológica). Si NO hay hitos verificados, NO afirmes trayectorias.
- Métricas de redes: si hay datos verificados, úsalos para definir 'presencia_digital.nivel' (referencia: <10K seguidores=baja, 10K-100K=media, >100K=alta para nivel estatal; ajustar para municipal). Si NO hay métricas, marca nivel como "baja" con observación "sin métricas verificadas capturadas".
- War Room: usa SOLO los miembros capturados, NO inventes operadores.

Responde SIEMPRE invocando la herramienta correspondiente con JSON estructurado.
Idioma: español de México, profesional y neutral.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY no configurado");

    const input = (await req.json()) as Input;
    if (!input?.tipo || !input?.candidato?.nombre) {
      return new Response(JSON.stringify({ error: "Faltan campos requeridos (tipo, candidato.nombre)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const tool = TOOLS[input.tipo];
    if (!tool) {
      return new Response(JSON.stringify({ error: `Tipo inválido: ${input.tipo}` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const contextoNivel = NIVEL_CONTEXTO[input.candidato.nivel] ?? "";

    const warRoomBlock = (input.candidato.war_room ?? []).length > 0
      ? `\nWAR ROOM CAPTURADO POR EL CONSULTOR (información verificada — NO inventes miembros, USA SOLO ESTOS):
${(input.candidato.war_room ?? []).map((m, i) => {
  const visibilidad = m.visible ? "OFICIAL" : "OPERADOR EN LA SOMBRA (no aparece en organigrama público)";
  const inc = m.inconsistencias && m.inconsistencias.length > 0 ? `\n   Inconsistencias: ${m.inconsistencias.join("; ")}` : "";
  const fuentes = m.fuentes && m.fuentes.length > 0 ? `\n   Fuentes: ${m.fuentes.join(", ")}` : "";
  const tray = m.trayectoria_breve ? `\n   Trayectoria: ${m.trayectoria_breve}` : "";
  return `${i + 1}. ${m.nombre} — ${m.rol} (${m.tipo}) — ${visibilidad}${tray}${inc}${fuentes}`;
}).join("\n")}

INSTRUCCIÓN: Considera el War Room como contexto OBLIGATORIO. NO inventes otros operadores.
- En FODA: el equipo puede ser fortaleza (experiencia, redes) o amenaza (operadores cuestionados, consultoras con historial problemático).
- En OSINT: rellena war_room_resumen analizando coherencia con la narrativa pública del candidato y alertas reputacionales por miembro (especialmente operadores en la sombra y miembros con inconsistencias documentadas).
- En Discurso: evalúa si la narrativa pública del candidato refleja al equipo real o lo oculta.`
      : `\nWAR ROOM: No se ha capturado equipo de campaña conocido. NO inventes miembros del equipo. Si tu análisis menciona asesores u operadores, marca explícitamente que no se han documentado.`;

    const trayectoriaArr = [...(input.candidato.trayectoria ?? [])].sort((a, b) => b.anio - a.anio);
    const trayectoriaBlock = trayectoriaArr.length > 0
      ? `\nTRAYECTORIA POLÍTICA VERIFICADA POR EL CONSULTOR (cronológica, más reciente primero — USA SOLO ESTOS HITOS):
${trayectoriaArr.map((h, i) => {
  const fuentes = h.fuentes && h.fuentes.length > 0 ? ` [Fuentes: ${h.fuentes.join(", ")}]` : " [⚠ sin fuentes]";
  const partido = h.partido ? ` — ${h.partido}` : "";
  const desc = h.descripcion ? ` · ${h.descripcion}` : "";
  return `${i + 1}. ${h.anio} · ${h.tipo.toUpperCase()} · ${h.cargo}${partido}${desc}${fuentes}`;
}).join("\n")}

INSTRUCCIÓN: Esta trayectoria es la BASE DURA. Cita años/cargos exactos en FODA y discurso.
Si hay cambios de partido (tipo "cambio_partido"), evalúa coherencia ideológica y riesgo narrativo.
NO menciones cargos que no estén en esta lista. Si el modelo "cree saber" otros cargos, descártalos.`
      : `\nTRAYECTORIA: No se ha capturado trayectoria política verificada. NO inventes cargos previos.
Si necesitas mencionar trayectoria, marca explícitamente "sin historial verificado capturado en el expediente".`;

    const metricasArr = Object.entries(input.candidato.metricas_redes ?? {})
      .filter(([, v]) => v && (v.seguidores !== undefined || v.engagement_rate !== undefined));
    const metricasBlock = metricasArr.length > 0
      ? `\nMÉTRICAS DE REDES VERIFICADAS POR EL CONSULTOR (medidas manualmente — USA ESTAS CIFRAS, NO INVENTES OTRAS):
${metricasArr.map(([plat, m]) => {
  const seg = m?.seguidores !== undefined ? `${m.seguidores.toLocaleString("es-MX")} seguidores` : "sin seguidores capturados";
  const eng = m?.engagement_rate !== undefined ? `, engagement ${m.engagement_rate}%` : "";
  const fecha = m?.ultima_actualizacion ? ` (medido el ${m.ultima_actualizacion.slice(0, 10)})` : "";
  const notas = m?.notas ? ` · ${m.notas}` : "";
  return `- ${plat.toUpperCase()}: ${seg}${eng}${fecha}${notas}`;
}).join("\n")}

INSTRUCCIÓN: Usa ESTAS cifras para determinar 'presencia_digital.nivel' y 'plataformas_fuertes' en OSINT.
NO inventes números de seguidores ni engagement. Si una plataforma no está en la lista, NO la menciones como fuerte.
En FODA, si la presencia digital es baja vs el cargo que busca, márcalo como debilidad/amenaza concreta.`
      : `\nMÉTRICAS DE REDES: No se han capturado métricas verificadas. Marca presencia_digital.nivel como "baja" con observación "sin métricas verificadas capturadas en el expediente".
NO inventes cifras de seguidores ni engagement.`;

    const userPrompt = `Analiza al siguiente candidato político:

NOMBRE: ${input.candidato.nombre}
PARTIDO: ${input.candidato.partido}
NIVEL: ${input.candidato.nivel}
TERRITORIO: ${input.candidato.territorio}
${input.candidato.cargo_buscado ? `CARGO BUSCADO: ${input.candidato.cargo_buscado}` : ""}
${input.candidato.bio_breve ? `BIO: ${input.candidato.bio_breve}` : ""}
${input.candidato.redes && Object.keys(input.candidato.redes).length > 0
  ? `HANDLES DE REDES: ${JSON.stringify(input.candidato.redes)}`
  : ""}
${input.candidato.notas ? `NOTAS DEL CONSULTOR: ${input.candidato.notas}` : ""}
${input.contexto_territorial ? `\nCONTEXTO TERRITORIAL:\n${input.contexto_territorial}` : ""}
${trayectoriaBlock}
${metricasBlock}
${warRoomBlock}

CONTEXTO DEL CARGO (OBLIGATORIO RESPETAR):
${contextoNivel}

Tipo de análisis solicitado: ${input.tipo.toUpperCase()}.
Todo el análisis debe estar acotado al cargo y territorio anteriores.
RECUERDA: trayectoria + métricas + war room son la BASE DURA. No las contradigas ni inventes alternativas.
Devuelve la herramienta con todos los campos requeridos.`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        tools: [tool],
        tool_choice: { type: "function", function: { name: tool.function.name } },
      }),
    });

    if (!aiRes.ok) {
      if (aiRes.status === 429) {
        return new Response(JSON.stringify({ error: "Límite de uso alcanzado. Intenta en un momento." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiRes.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA agotados. Agrega fondos en Settings → Workspace → Usage." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const txt = await aiRes.text();
      console.error("Gateway error:", aiRes.status, txt);
      throw new Error(`AI gateway ${aiRes.status}`);
    }

    const data = await aiRes.json();
    const toolCall = data?.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      throw new Error("La IA no devolvió tool_call estructurado");
    }
    const parsed = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ output: parsed, model: "google/gemini-2.5-flash" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("analizar-candidato error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Error desconocido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

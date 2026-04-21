// Edge function: evaluación integral de presencia digital de un candidato.
// Combina:
//   1. Estimación de métricas por plataforma (seguidores, engagement) basada en
//      conocimiento público del modelo + handles capturados → marca explícitamente
//      como "estimación IA" (no verificada).
//   2. Diagnóstico cualitativo: FODA digital, brechas vs cargo buscado,
//      recomendaciones tácticas por plataforma.
//
// Usa Lovable AI Gateway con tool-calling para garantizar JSON estructurado.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface MetricaActual {
  seguidores?: number;
  engagement_rate?: number;
  ultima_actualizacion?: string;
}

interface RequestBody {
  nombre: string;
  partido: string;
  nivel: "gobernador" | "diputados" | "ayuntamientos";
  territorio: string;
  cargo_buscado?: string;
  bio_breve?: string;
  redes?: Record<string, string | undefined>;
  metricas_actuales?: Partial<Record<"facebook" | "twitter" | "instagram" | "tiktok" | "youtube" | "threads" | "bluesky" | "linkedin", MetricaActual>>;
}

const CANALES_ESPERADOS = ["facebook", "instagram", "tiktok", "twitter", "threads", "bluesky", "linkedin", "landing_page", "whatsapp_community"] as const;
const CANAL_LABEL: Record<string, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  tiktok: "TikTok",
  twitter: "X / Twitter",
  threads: "Threads",
  bluesky: "Bluesky",
  linkedin: "LinkedIn",
  landing_page: "Landing page propia",
  whatsapp_community: "Comunidad de WhatsApp",
};

const TOOL = {
  type: "function",
  function: {
    name: "evaluacion_redes",
    description: "Devuelve estimación de métricas + diagnóstico cualitativo de presencia digital.",
    parameters: {
      type: "object",
      properties: {
        estimacion_metricas: {
          type: "array",
          description: "Estimación por plataforma. SOLO incluye plataformas para las que el candidato tenga handle capturado o sea públicamente conocido.",
          items: {
            type: "object",
            properties: {
              plataforma: { type: "string", enum: ["facebook", "twitter", "instagram", "tiktok", "youtube", "threads", "bluesky", "linkedin"] },
              seguidores_estimados: { type: "number", description: "Número estimado de seguidores. Si no hay base sólida, usa rangos conservadores según el cargo." },
              engagement_estimado: { type: "number", description: "Porcentaje 0-100. Promedios típicos: 1-3% saludable, >5% excelente, <0.5% muerto." },
              base_estimacion: { type: "string", description: "Justifica brevemente: handle público, cargo previo, comparable con rivales, etc." },
              confianza: { type: "string", enum: ["alta", "media", "baja"] },
            },
            required: ["plataforma", "seguidores_estimados", "engagement_estimado", "base_estimacion", "confianza"],
            additionalProperties: false,
          },
        },
        diagnostico_global: {
          type: "object",
          properties: {
            nivel_presencia: { type: "string", enum: ["alta", "media", "baja", "inexistente"] },
            score_digital: { type: "number", minimum: 0, maximum: 100, description: "Score 0-100 ponderando alcance vs cargo buscado." },
            resumen_ejecutivo: { type: "string", description: "1-2 párrafos sobre estado digital relativo al cargo y territorio." },
            brecha_vs_cargo: { type: "string", description: "Qué tan suficiente es la presencia digital actual para competir por el cargo en el territorio." },
          },
          required: ["nivel_presencia", "score_digital", "resumen_ejecutivo", "brecha_vs_cargo"],
          additionalProperties: false,
        },
        foda_digital: {
          type: "object",
          properties: {
            fortalezas: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 5 },
            debilidades: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 5 },
            oportunidades: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 5 },
            amenazas: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 5 },
          },
          required: ["fortalezas", "debilidades", "oportunidades", "amenazas"],
          additionalProperties: false,
        },
        recomendaciones: {
          type: "array",
          minItems: 3,
          maxItems: 8,
          items: {
            type: "object",
            properties: {
              plataforma: { type: "string", enum: ["facebook", "twitter", "instagram", "tiktok", "youtube", "threads", "bluesky", "linkedin", "general"] },
              prioridad: { type: "string", enum: ["alta", "media", "baja"] },
              accion: { type: "string", description: "Acción concreta y medible (ej. 'Pasar de 1 a 5 reels semanales en TikTok con tema seguridad')." },
              kpi_objetivo: { type: "string", description: "Métrica medible esperada en 30-90 días." },
            },
            required: ["plataforma", "prioridad", "accion", "kpi_objetivo"],
            additionalProperties: false,
          },
        },
        comparables_referencia: {
          type: "array",
          description: "Benchmarks de candidatos/políticos similares en Michoacán para contextualizar (no inventes cifras exactas, usa rangos).",
          items: {
            type: "object",
            properties: {
              referencia: { type: "string" },
              observacion: { type: "string" },
            },
            required: ["referencia", "observacion"],
            additionalProperties: false,
          },
        },
      },
      required: ["estimacion_metricas", "diagnostico_global", "foda_digital", "recomendaciones"],
      additionalProperties: false,
    },
  },
} as const;

const NIVEL_BENCHMARK: Record<string, string> = {
  gobernador: `Gobernatura de Michoacán: rango competitivo esperado: FB 200K-1M, X 50K-500K, IG 100K-500K, TikTok 50K-1M.
Punto de comparación: gobernadores actuales y ex-candidatos a gobernatura en Michoacán.`,
  diputados: `Diputación local (1 de 24 distritos): rango competitivo: FB 5K-50K, X 1K-30K, IG 5K-30K, TikTok 5K-100K.
Distritos urbanos (Morelia, Uruapan, Zamora) requieren más volumen que rurales.`,
  ayuntamientos: `Presidencia municipal: rangos según tamaño:
- Morelia/Uruapan/Zamora/Lázaro Cárdenas: FB 50K-300K, X 10K-100K, IG 20K-100K.
- Municipios medianos (>50K hab): FB 5K-30K.
- Rurales (<20K hab): FB 1K-10K, redes opcionales.`,
};

const SYSTEM_PROMPT = `Eres un consultor digital político senior especializado en campañas electorales de México.

TAREA: Evaluar la presencia digital de un candidato en Michoacán y entregar:
1) Estimación de métricas por plataforma (con confianza explícita)
2) Diagnóstico FODA digital
3) Recomendaciones tácticas accionables y medibles

REGLAS DE ESTIMACIÓN:
- Si HAY métricas verificadas en metricas_actuales (capturadas a mano por el consultor), ÚSALAS COMO VALOR ANCLA. NO las contradigas. Reporta esos números EXACTOS y marca confianza="alta".
- Si HAY handle pero NO métrica medida: estima con rangos del benchmark — confianza media o baja según notoriedad.
- Si NO hay handle ni evidencia pública en una plataforma: OMÍTELA del array de estimaciones.
- Si el candidato es PÚBLICAMENTE CONOCIDO (gobernador en funciones, diputado federal con perfil, alcalde de capital), usa rangos realistas — confianza media-alta.
- Si es DESCONOCIDO (aspirante sin trayectoria), estima rangos CONSERVADORES (cientos a pocos miles) — confianza baja.

REGLAS DE OPORTUNIDADES (CRÍTICO):
Los canales esperados para un candidato moderno son: Facebook, Instagram, TikTok, X/Twitter, Threads, Bluesky, LinkedIn, Landing page propia y Comunidad de WhatsApp.
Por CADA canal de la lista CANALES_AUSENTES que recibirás, DEBES agregar al menos UNA oportunidad explícita en foda_digital.oportunidades indicando "Abrir/activar [canal]: [beneficio concreto para el cargo]" Y al menos UNA recomendación de prioridad alta o media para activarlo con KPI medible.
TikTok es prioridad ALTA si el cargo busca voto joven (<35 años). WhatsApp Community es prioridad ALTA siempre para movilización territorial. Landing page es prioridad media para captura de leads.
Bluesky es prioridad BAJA-MEDIA: nicho de early-adopters (periodistas, líderes de opinión digitales), útil para hedging si X se deteriora. NO subestimes su valor como canal de influencia indirecta.
LinkedIn es CANAL PROFESIONAL/ÉLITES, NO masivo: prioridad ALTA solo para gobernador, diputaciones urbanas o municipios con sector empresarial fuerte (Morelia, Uruapan, Zamora, Lázaro Cárdenas). En municipios rurales es prioridad BAJA. NO uses su volumen de seguidores como proxy de fuerza electoral; sí como proxy de credibilidad y red de financistas/aliados institucionales.

REGLAS DE DIAGNÓSTICO:
- score_digital pondera alcance, engagement Y cobertura de canales (un candidato sin TikTok ni WhatsApp NO puede pasar de 70). LinkedIn no influye en el techo del score salvo cargos donde es prioritario (gobernador / urbanos).
- brecha_vs_cargo debe ser CONCRETA: "necesita 5x más seguidores en TikTok para competir con [referencia]".
- FODA debe ser ESPECÍFICO al territorio y cargo, NO genérico.
- Recomendaciones deben ser ACCIONABLES con KPIs medibles en 30-90 días.

CRÍTICO: NO inventes que el candidato tiene métricas verificadas. Toda estimación es ESTIMACIÓN IA y debe quedar marcada con su confianza.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY no configurado");

    const input = (await req.json()) as RequestBody;
    if (!input?.nombre || !input?.nivel) {
      return new Response(JSON.stringify({ error: "Faltan campos requeridos (nombre, nivel)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const benchmark = NIVEL_BENCHMARK[input.nivel] ?? "";
    const redes = input.redes ?? {};
    const handlesCapturados = Object.entries(redes)
      .filter(([, v]) => v)
      .map(([k, v]) => `${k}: ${v}`);

    // Detecta canales ausentes (sin handle / URL capturada) para forzar oportunidades
    const tieneCanal = (k: string) => Boolean((redes as Record<string, string | undefined>)[k]);
    const canalesAusentes = CANALES_ESPERADOS.filter((c) => {
      if (c === "landing_page") return !tieneCanal("web");
      return !tieneCanal(c);
    }).map((c) => CANAL_LABEL[c]);

    const metricasVerificadas = Object.entries(input.metricas_actuales ?? {})
      .filter(([, v]) => v && (v.seguidores !== undefined || v.engagement_rate !== undefined))
      .map(([plat, v]) => `${plat}: ${v?.seguidores ?? "?"} seguidores${v?.engagement_rate !== undefined ? `, engagement ${v.engagement_rate}%` : ""}${v?.ultima_actualizacion ? ` (medido ${v.ultima_actualizacion.slice(0, 10)})` : ""}`);

    const userPrompt = `Evaluar presencia digital de:

NOMBRE: ${input.nombre}
PARTIDO: ${input.partido}
NIVEL: ${input.nivel}
TERRITORIO: ${input.territorio}
${input.cargo_buscado ? `CARGO BUSCADO: ${input.cargo_buscado}` : ""}
${input.bio_breve ? `BIO: ${input.bio_breve}` : ""}

HANDLES / URLS CAPTURADAS:
${handlesCapturados.length > 0 ? handlesCapturados.join("\n") : "(ninguno)"}

MÉTRICAS YA VERIFICADAS POR EL CONSULTOR (ANCLA — usa estos números EXACTOS, no los contradigas):
${metricasVerificadas.length > 0 ? metricasVerificadas.join("\n") : "(ninguna — toda métrica será estimación IA)"}

CANALES_AUSENTES (genera oportunidad + recomendación de activación para cada uno):
${canalesAusentes.length > 0 ? canalesAusentes.join(", ") : "(ninguno — cobertura completa)"}

BENCHMARK DEL CARGO:
${benchmark}

Devuelve la herramienta evaluacion_redes con todos los campos requeridos.
RECUERDA: confianza="alta" cuando uses métricas verificadas; OMITE plataformas sin handle ni evidencia pública del array de estimaciones, pero SÍ inclúyelas en oportunidades como canal a abrir.`;

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
        tools: [TOOL],
        tool_choice: { type: "function", function: { name: "evaluacion_redes" } },
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
    if (!toolCall?.function?.arguments) throw new Error("La IA no devolvió tool_call estructurado");
    const parsed = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ output: parsed, model: "google/gemini-2.5-flash" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("evaluacion-redes-candidato error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Error desconocido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

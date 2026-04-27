// Edge function: OSINT UNIFICADO de candidato.
// Combina dos motores en una sola llamada:
//   1. Perplexity sonar-pro → evidencia web en vivo con citas (medios MX).
//   2. Lovable AI (Gemini) con tool-calling → fusiona la evidencia web con
//      el contexto interno del consultor (war room, trayectoria, métricas)
//      en un dossier estructurado único con citas indexadas.
//
// Este reemplaza tanto el OSINT clásico como el OSINT Profundo: ahora hay UN
// solo análisis OSINT por candidato, profundo, con evidencia citable.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WarRoomMiembroIn {
  nombre: string;
  rol: string;
  tipo: "persona" | "consultora";
  visible: boolean;
  trayectoria_breve?: string;
  inconsistencias?: string[];
  fuentes?: string[];
}

interface TrayectoriaHitoIn {
  anio: number;
  cargo: string;
  partido?: string;
  tipo: string;
  descripcion?: string;
  fuentes?: string[];
}

type MetricaRedIn = { seguidores?: number; engagement_rate?: number; ultima_actualizacion?: string };
type MetricasRedesIn = Partial<Record<string, MetricaRedIn>>;

interface CandidatoIn {
  nombre: string;
  partido?: string;
  nivel?: string;
  territorio?: string;
  cargo_buscado?: string;
  bio_breve?: string;
  redes?: Record<string, string | undefined>;
  notas?: string;
  war_room?: WarRoomMiembroIn[];
  trayectoria?: TrayectoriaHitoIn[];
  metricas_redes?: MetricasRedesIn;
}

interface PerplexityCita {
  url: string;
  titulo?: string;
  fecha?: string;
  medio?: string;
}

// Perplexity acepta máximo 20 dominios en search_domain_filter.
const MEDIOS_MX = [
  "cambiodemichoacan.com.mx",
  "quadratin.com.mx",
  "lavozdemichoacan.com.mx",
  "provincia.com.mx",
  "mimorelia.com",
  "contramuro.com",
  "monitorexpresso.com",
  "atiempo.mx",
  "changoonga.com",
  "respuesta.com.mx",
  "revolucion3-0.mx",
  "elsoldemorelia.com.mx",
  "periodicooficial.michoacan.gob.mx",
  "iem.org.mx",
  "ine.mx",
  "milenio.com",
  "eluniversal.com.mx",
  "jornada.com.mx",
  "proceso.com.mx",
  "animalpolitico.com",
];

const NIVEL_CONTEXTO: Record<string, string> = {
  gobernador: "GOBERNATURA estatal de Michoacán: dinámicas estatales, 24 distritos locales, 113 municipios, coaliciones, voto rural vs urbano, seguridad regional, magisterio, autodefensas.",
  diputados_federales: "DIPUTACIÓN FEDERAL: distrito federal específico (1 de 11), agenda legislativa NACIONAL, presupuesto federal, fiscalización ASF.",
  diputados: "DIPUTACIÓN LOCAL: distrito local (1 de 24), Congreso de Michoacán, agenda legislativa estatal.",
  ayuntamientos: "PRESIDENCIA MUNICIPAL: cabildo, regidurías, servicios públicos, seguridad municipal, obra pública local.",
};

// Tool-calling schema para JSON estructurado garantizado por Gemini.
const OSINT_TOOL = {
  type: "function",
  function: {
    name: "osint_unificado",
    description: "Devuelve dossier OSINT unificado del candidato fusionando evidencia web con contexto interno.",
    parameters: {
      type: "object",
      properties: {
        resumen_ejecutivo: { type: "string", description: "3-5 oraciones de síntesis estratégica del perfil OSINT." },
        presencia_digital: {
          type: "object",
          properties: {
            nivel: { type: "string", enum: ["alta", "media", "baja", "inexistente"] },
            plataformas_fuertes: { type: "array", items: { type: "string" } },
            observaciones: { type: "string" },
          },
          required: ["nivel", "plataformas_fuertes", "observaciones"],
          additionalProperties: false,
        },
        cargos_publicos_detectados: {
          type: "array",
          items: {
            type: "object",
            properties: {
              resumen: { type: "string" },
              fuentes: { type: "array", items: { type: "number" } },
            },
            required: ["resumen", "fuentes"],
            additionalProperties: false,
          },
        },
        menciones_prensa: {
          type: "array",
          items: {
            type: "object",
            properties: {
              fuente: { type: "string", description: "Nombre del medio (ej: Quadratín, Proceso)." },
              titular: { type: "string" },
              tono: { type: "string", enum: ["positivo", "neutral", "negativo"] },
              fuentes: { type: "array", items: { type: "number" } },
            },
            required: ["fuente", "titular", "tono", "fuentes"],
            additionalProperties: false,
          },
        },
        controversias: {
          type: "array",
          items: {
            type: "object",
            properties: {
              tema: { type: "string" },
              gravedad: { type: "string", enum: ["alta", "media", "baja"] },
              descripcion: { type: "string" },
              fuentes: { type: "array", items: { type: "number" } },
            },
            required: ["tema", "gravedad", "descripcion", "fuentes"],
            additionalProperties: false,
          },
        },
        red_de_relaciones: {
          type: "array",
          items: {
            type: "object",
            properties: {
              resumen: { type: "string" },
              fuentes: { type: "array", items: { type: "number" } },
            },
            required: ["resumen", "fuentes"],
            additionalProperties: false,
          },
        },
        actividad_territorial: {
          type: "array",
          items: {
            type: "object",
            properties: {
              resumen: { type: "string" },
              fuentes: { type: "array", items: { type: "number" } },
            },
            required: ["resumen", "fuentes"],
            additionalProperties: false,
          },
        },
        temas_recurrentes: { type: "array", items: { type: "string" } },
        war_room_resumen: {
          type: "object",
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
        vacios_informacion: { type: "array", items: { type: "string" } },
        recomendaciones_busqueda_adicional: { type: "array", items: { type: "string" } },
      },
      required: [
        "resumen_ejecutivo", "presencia_digital", "cargos_publicos_detectados",
        "menciones_prensa", "controversias", "red_de_relaciones", "actividad_territorial",
        "temas_recurrentes", "vacios_informacion", "recomendaciones_busqueda_adicional",
      ],
      additionalProperties: false,
    },
  },
} as const;

const SYSTEM_PROMPT = `Eres un consultor político senior especializado en Michoacán, México, experto en OSINT (Open Source Intelligence) político.

Tu trabajo: producir un DOSSIER OSINT UNIFICADO Y PROFUNDO de un candidato, fusionando:
A) EVIDENCIA WEB EN VIVO recolectada por Perplexity en medios mexicanos (con URLs verificables).
B) CONTEXTO INTERNO ya verificado por el consultor (war room, trayectoria, métricas de redes).

JERARQUÍA DE EVIDENCIA (estricta):
1. Datos del consultor (war room, trayectoria, métricas) → BASE DURA. Cítalos textualmente cuando apliquen.
2. Evidencia web con citas → segundo nivel. SOLO afirma hechos web si tienen una cita correspondiente.
3. Conocimiento previo del modelo → SOLO para contextualizar, nunca como afirmación. Si no hay fuente, NO lo digas.

REGLAS DE CITAS (críticas):
- En cada item con campo "fuentes", cada número DEBE corresponder al índice de una cita en el array global de citas web.
- Si no tienes fuente verificable para una afirmación, NO la incluyas. Es mejor un dossier corto y verídico que largo e inventado.
- Si la evidencia web es nula sobre un tema, deja el array vacío y reporta el vacío en "vacios_informacion".

REGLAS DE PROFUNDIDAD:
- "resumen_ejecutivo" debe sintetizar el perfil estratégico en 3-5 oraciones, integrando hallazgos web + contexto interno.
- "presencia_digital.nivel" se decide así: si hay métricas verificadas usa esas (>100K seguidores=alta para nivel estatal, 10K-100K=media, <10K=baja, sin huella=inexistente). Si no hay métricas, infiere de la evidencia web.
- "controversias" incluye sanciones, denuncias, observaciones de transparencia, vínculos con empresas sancionadas, escándalos cubiertos por prensa.
- "red_de_relaciones" debe identificar padrinos políticos, equipos previos donde militó, alianzas detectables.
- "actividad_territorial" registra eventos, recorridos, presencia en municipios específicos.
- "war_room_resumen" SOLO si el consultor capturó miembros — analiza coherencia con narrativa pública y alertas reputacionales POR MIEMBRO.
- "vacios_informacion" es ORO: marca dónde NO hay rastro y por qué eso importa estratégicamente.
- "recomendaciones_busqueda_adicional" sugiere fuentes offline concretas (Periódico Oficial del Estado, PNT, RPC, actas de cabildo, etc.).

Coherencia con el cargo (OBLIGATORIO):
- Gobernatura → escala estatal completa.
- Diputado Federal → escala distrital federal (CDMX).
- Diputado Local → escala distrital local (Morelia).
- Ayuntamiento → escala municipal.
NO mezcles escalas.

Idioma: español de México, profesional, preciso, sin floritura.
Responde SIEMPRE invocando la herramienta osint_unificado con TODOS los campos requeridos.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const t0 = Date.now();
  try {
    const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!PERPLEXITY_API_KEY) {
      return jerror("PERPLEXITY_API_KEY no configurado", 500);
    }
    if (!LOVABLE_API_KEY) {
      return jerror("LOVABLE_API_KEY no configurado", 500);
    }

    const body = (await req.json()) as { candidato?: CandidatoIn };
    const c = body.candidato;
    if (!c?.nombre) return jerror("Falta candidato.nombre", 400);

    // ============ FASE 1: Perplexity — evidencia web con citas ============
    const queryFrag = [
      c.nombre,
      c.partido && `partido ${c.partido}`,
      c.territorio && c.territorio,
      c.cargo_buscado && `aspirante a ${c.cargo_buscado}`,
    ].filter(Boolean).join(" · ");

    const ppxPrompt = `Investiga y reporta evidencia OSINT verificable sobre este perfil político mexicano: ${queryFrag}.

Busca específicamente:
- Cargos públicos, designaciones, candidaturas previas (con año).
- Menciones en prensa de los últimos 2 años (titular + medio + fecha + tono).
- Controversias, denuncias, sanciones, observaciones de transparencia, vínculos con empresas problemáticas.
- Red política: padrinos, aliados públicos, equipos donde ha militado.
- Actividad territorial detectable: eventos, recorridos, asambleas, municipios donde ha tenido presencia.
- Vacíos o silencios sospechosos en su rastro digital.

Devuelve un INFORME en prosa estructurada, citando explícitamente cada fuente que uses con su URL completa. Si no hay evidencia sobre un punto, dilo. NO inventes datos.`;

    const ppxRes = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${PERPLEXITY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar-pro",
        messages: [
          {
            role: "system",
            content: "Eres un investigador OSINT meticuloso. Solo reportas hechos con fuente verificable. No especulas. Citas SIEMPRE la URL de origen.",
          },
          { role: "user", content: ppxPrompt },
        ],
        temperature: 0.1,
        search_domain_filter: MEDIOS_MX,
        search_recency_filter: "year",
        return_citations: true,
      }),
    });

    if (!ppxRes.ok) {
      const errText = await ppxRes.text();
      console.error("Perplexity error:", ppxRes.status, errText.slice(0, 500));
      return jerror(`Perplexity ${ppxRes.status}: ${errText.slice(0, 300)}`, 502);
    }

    const ppxData = await ppxRes.json() as {
      choices?: { message?: { content?: string } }[];
      citations?: string[];
      search_results?: { url: string; title?: string; date?: string }[];
    };
    const evidenciaWeb = ppxData.choices?.[0]?.message?.content ?? "";
    const ppxCitas = ppxData.citations ?? [];
    const ppxResults = ppxData.search_results ?? [];

    // Construye índice de citas estable: usamos search_results si están disponibles
    // (incluyen título + fecha), si no, citations es solo URLs.
    const citasGlobales: PerplexityCita[] = [];
    const urlSet = new Set<string>();
    for (const r of ppxResults) {
      if (r.url && !urlSet.has(r.url)) {
        citasGlobales.push({ url: r.url, titulo: r.title, fecha: r.date, medio: extraerMedio(r.url) });
        urlSet.add(r.url);
      }
    }
    for (const url of ppxCitas) {
      if (url && !urlSet.has(url)) {
        citasGlobales.push({ url, medio: extraerMedio(url) });
        urlSet.add(url);
      }
    }

    // ============ FASE 2: Lovable AI — síntesis estructurada ============
    const contextoNivel = c.nivel ? (NIVEL_CONTEXTO[c.nivel] ?? "") : "";

    const warRoomBlock = (c.war_room ?? []).length > 0
      ? `\nWAR ROOM CAPTURADO POR EL CONSULTOR (NO inventes otros miembros):
${(c.war_room ?? []).map((m, i) => {
  const vis = m.visible ? "OFICIAL" : "OPERADOR EN LA SOMBRA";
  const inc = m.inconsistencias?.length ? ` | Inconsistencias: ${m.inconsistencias.join("; ")}` : "";
  const tray = m.trayectoria_breve ? ` | ${m.trayectoria_breve}` : "";
  return `${i + 1}. ${m.nombre} — ${m.rol} (${m.tipo}) — ${vis}${tray}${inc}`;
}).join("\n")}`
      : "";

    const trayArr = [...(c.trayectoria ?? [])].sort((a, b) => b.anio - a.anio);
    const trayBlock = trayArr.length > 0
      ? `\nTRAYECTORIA POLÍTICA VERIFICADA (BASE DURA, NO inventes otros cargos):
${trayArr.map((h, i) => `${i + 1}. ${h.anio} · ${h.tipo.toUpperCase()} · ${h.cargo}${h.partido ? ` (${h.partido})` : ""}${h.descripcion ? ` — ${h.descripcion}` : ""}`).join("\n")}`
      : "";

    const metArr = Object.entries(c.metricas_redes ?? {})
      .filter(([, v]) => v && (v.seguidores !== undefined || v.engagement_rate !== undefined));
    const metBlock = metArr.length > 0
      ? `\nMÉTRICAS DE REDES VERIFICADAS:
${metArr.map(([p, m]) => `- ${p.toUpperCase()}: ${m?.seguidores ? `${m.seguidores.toLocaleString("es-MX")} seg.` : "?"}${m?.engagement_rate ? `, eng. ${m.engagement_rate}%` : ""}`).join("\n")}`
      : "";

    // Índice de citas presentado al modelo: numerado, con título/medio/fecha
    const citasBlock = citasGlobales.length > 0
      ? `\nÍNDICE DE CITAS WEB DISPONIBLES (úsalas por NÚMERO en el campo "fuentes" de cada item):
${citasGlobales.map((cit, i) => `[${i}] ${cit.medio ?? "fuente"}${cit.fecha ? ` · ${cit.fecha}` : ""} — ${cit.titulo ?? cit.url}\n     URL: ${cit.url}`).join("\n")}`
      : "\nÍNDICE DE CITAS: vacío (la búsqueda web no arrojó resultados verificables; reporta esto en vacios_informacion).";

    const userPrompt = `CANDIDATO: ${c.nombre}
PARTIDO: ${c.partido ?? "?"}
NIVEL: ${c.nivel ?? "?"}
TERRITORIO: ${c.territorio ?? "?"}
${c.cargo_buscado ? `CARGO BUSCADO: ${c.cargo_buscado}` : ""}
${c.bio_breve ? `BIO INTERNA: ${c.bio_breve}` : ""}
${c.notas ? `NOTAS DEL CONSULTOR: ${c.notas}` : ""}

CONTEXTO DEL CARGO: ${contextoNivel}
${trayBlock}
${metBlock}
${warRoomBlock}

============== EVIDENCIA WEB EN VIVO (Perplexity sobre medios MX) ==============
${evidenciaWeb || "(sin hallazgos web verificables)"}
${citasBlock}
================================================================================

Tu tarea: produce el dossier OSINT UNIFICADO invocando la herramienta osint_unificado.
- Cada item de "fuentes" debe ser un índice [N] del ÍNDICE DE CITAS arriba.
- Integra trayectoria interna + war room + métricas + evidencia web en una visión única.
- Si la evidencia web NO cubre algún tema, deja arrays vacíos y márcalo en vacios_informacion.
- En presencia_digital usa las métricas verificadas si existen; si no, infiere de la evidencia web.
- Si NO hay war room capturado, OMITE war_room_resumen.`;

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
        tools: [OSINT_TOOL],
        tool_choice: { type: "function", function: { name: OSINT_TOOL.function.name } },
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      if (aiRes.status === 429) {
        return jerror("Rate limit Lovable AI. Reintenta en 1 minuto.", 429);
      }
      if (aiRes.status === 402) {
        return jerror("Sin créditos en Lovable AI. Recarga en Settings → Workspace → Usage.", 402);
      }
      console.error("Lovable AI error:", aiRes.status, errText.slice(0, 500));
      return jerror(`Lovable AI ${aiRes.status}: ${errText.slice(0, 300)}`, 502);
    }

    const aiData = await aiRes.json() as {
      choices?: { message?: { tool_calls?: { function?: { name: string; arguments: string } }[] } }[];
    };
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    const argsStr = toolCall?.function?.arguments;
    if (!argsStr) {
      return jerror("Lovable AI no devolvió tool_call esperado", 502);
    }

    let dossier: Record<string, unknown>;
    try {
      dossier = JSON.parse(argsStr);
    } catch (e) {
      console.error("Error parseando tool args:", e, argsStr.slice(0, 500));
      return jerror("Tool args no parseables", 502);
    }

    // Adjuntamos el array global de citas al output final
    dossier.citas = citasGlobales;

    return new Response(
      JSON.stringify({
        output: dossier,
        model: "perplexity/sonar-pro+google/gemini-2.5-flash",
        duracion_ms: Date.now() - t0,
        evidencia_web_chars: evidenciaWeb.length,
        citas_count: citasGlobales.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error desconocido";
    console.error("osint-unificado-candidato error:", msg);
    return jerror(msg, 500);
  }
});

function jerror(error: string, status: number): Response {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function extraerMedio(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    const map: Record<string, string> = {
      "quadratin.com.mx": "Quadratín",
      "cambiodemichoacan.com.mx": "Cambio de Michoacán",
      "lavozdemichoacan.com.mx": "La Voz de Michoacán",
      "provincia.com.mx": "Provincia",
      "mimorelia.com": "MiMorelia",
      "contramuro.com": "Contramuro",
      "monitorexpresso.com": "Monitor Expresso",
      "atiempo.mx": "A Tiempo",
      "changoonga.com": "Changoonga",
      "respuesta.com.mx": "Respuesta",
      "revolucion3-0.mx": "Revolución 3.0",
      "elsoldemorelia.com.mx": "El Sol de Morelia",
      "periodicooficial.michoacan.gob.mx": "Periódico Oficial Michoacán",
      "iem.org.mx": "IEM Michoacán",
      "ine.mx": "INE",
      "milenio.com": "Milenio",
      "eluniversal.com.mx": "El Universal",
      "jornada.com.mx": "La Jornada",
      "proceso.com.mx": "Proceso",
      "animalpolitico.com": "Animal Político",
    };
    return map[host] ?? host;
  } catch {
    return "fuente";
  }
}

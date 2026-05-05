// Edge function: monitor-social
// Pipeline:
// 1. Identificar entidades a monitorear: estatal (5 queries) + candidatos propios + top 3 rivales
// 2. Firecrawl Search por cada entidad → menciones recientes
// 3. Lovable AI clasifica sentimiento, tema, hashtags
// 4. Persistir menciones + agregar resumen por entidad
import { createClient } from "npm:@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FIRECRAWL_V2 = "https://api.firecrawl.dev/v2";
const LOVABLE_AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

interface SearchHit {
  title?: string;
  url?: string;
  description?: string;
  markdown?: string;
  publishedDate?: string;
}

interface EmocionesScore {
  enojo: number;
  miedo: number;
  esperanza: number;
  indignacion: number;
  desconfianza: number;
  orgullo: number;
}

interface MencionClasificada {
  titulo: string;
  fragmento: string;
  url: string;
  fuente: string;
  sentimiento: number; // -1 to 1
  tema: string;
  hashtags: string[];
  municipio?: string | null; // Municipio de Michoacán al que se refiere (o null si es estatal)
  // PSICOINT
  emociones?: EmocionesScore | null;
  sarcasmo?: boolean;
  // GEOINT
  seccion_inferida?: number | null;
  colonia_inferida?: string | null;
}

interface EntidadObjetivo {
  tipo: "estatal" | "candidato_propio" | "rival";
  nombre: string;
  candidato_id: string | null;
  queries: string[];
}

const QUERIES_ESTATALES = [
  "Michoacán política sentimiento ciudadanos",
  "Morelia opinión pública gobierno",
  "Michoacán seguridad violencia",
  "Michoacán economía empleo",
  "Michoacán protesta manifestación",
];

// Municipios principales de Michoacán para filtro geográfico de menciones.
// Si una mención no incluye "michoacán" ni alguno de estos municipios, se descarta.
const MUNICIPIOS_MICHOACAN = [
  "morelia", "uruapan", "zamora", "lázaro cárdenas", "lazaro cardenas", "apatzingán", "apatzingan",
  "hidalgo", "zitácuaro", "zitacuaro", "pátzcuaro", "patzcuaro", "la piedad", "sahuayo",
  "jacona", "tacámbaro", "tacambaro", "ciudad hidalgo", "puruándiro", "puruandiro",
  "los reyes", "maravatío", "maravatio", "paracho", "tepalcatepec", "huetamo", "tangancícuaro",
  "tangancicuaro", "jiquilpan", "cotija", "yurécuaro", "yurecuaro", "nueva italia",
  "buenavista", "múgica", "mugica", "tarímbaro", "tarimbaro", "indaparapeo", "charo",
  "quiroga", "erongarícuaro", "erongaricuaro", "cherán", "cheran", "nahuatzen",
  "coalcomán", "coalcoman", "aguililla", "tepalcatepec", "parácuaro", "paracuaro",
  "michoacán", "michoacan", "michoacano", "michoacana",
];

function esMichoacan(texto: string): boolean {
  const t = texto.toLowerCase();
  return MUNICIPIOS_MICHOACAN.some((m) => t.includes(m));
}

// Whitelist oficial de los 113 municipios de Michoacán (INEGI).
// Para validar el `municipio` que devuelve la IA y evitar inventos.
const MUNICIPIOS_OFICIALES: string[] = [
  "Acuitzio","Aguililla","Álvaro Obregón","Angamacutiro","Angangueo","Apatzingán","Aporo","Aquila","Ario","Arteaga",
  "Briseñas","Buenavista","Carácuaro","Charapan","Charo","Chavinda","Cherán","Chilchota","Chinicuila","Chucándiro",
  "Coahuayana","Coalcomán de Vázquez Pallares","Coeneo","Cojumatlán de Régules","Contepec","Copándaro","Cotija",
  "Cuitzeo","Ecuandureo","Epitacio Huerta","Erongarícuaro","Gabriel Zamora","Hidalgo","Huandacareo","Huaniqueo",
  "Huetamo","Huiramba","Indaparapeo","Irimbo","Ixtlán","Jacona","Jiménez","Jiquilpan","José Sixto Verduzco","Juárez",
  "Jungapeo","Lagunillas","Lázaro Cárdenas","Los Reyes","Madero","Maravatío","Marcos Castellanos","Morelia","Morelos",
  "Múgica","Nahuatzen","Nocupétaro","Nuevo Parangaricutiro","Nuevo Urecho","Numarán","Ocampo","Pajacuarán","Panindícuaro",
  "Parácuaro","Paracho","Pátzcuaro","Penjamillo","Peribán","La Piedad","Purépero","Puruándiro","Queréndaro","Quiroga",
  "Sahuayo","Salvador Escalante","San Lucas","Santa Ana Maya","Senguio","Susupuato","Tacámbaro","Tancítaro",
  "Tangamandapio","Tangancícuaro","Tanhuato","Taretan","Tarímbaro","Tepalcatepec","Tingambato","Tingüindín",
  "Tiquicheo de Nicolás Romero","Tlalpujahua","Tlazazalca","Tocumbo","Tumbiscatío","Turicato","Tuxpan","Tuzantla",
  "Tzintzuntzan","Tzitzio","Uruapan","Venustiano Carranza","Villamar","Vista Hermosa","Yurécuaro","Zacapu","Zamora",
  "Zináparo","Zinapécuaro","Ziracuaretiro","Zitácuaro",
];

function strip(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

const MUNICIPIOS_INDEX = new Map(MUNICIPIOS_OFICIALES.map((m) => [strip(m), m]));

function normalizarMunicipio(input: string | null | undefined): string | null {
  if (!input) return null;
  const key = strip(input);
  // Match exacto
  if (MUNICIPIOS_INDEX.has(key)) return MUNICIPIOS_INDEX.get(key)!;
  // Match por contención (ej: "Hidalgo (Cd. Hidalgo)" → "Hidalgo")
  for (const [k, oficial] of MUNICIPIOS_INDEX) {
    if (key.includes(k) || k.includes(key)) return oficial;
  }
  return null;
}

async function firecrawlSearch(query: string, apiKey: string): Promise<SearchHit[]> {
  const res = await fetch(`${FIRECRAWL_V2}/search`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query, limit: 5, lang: "es", country: "mx", tbs: "qdr:w" }),
  });
  if (!res.ok) {
    console.error(`Firecrawl [${res.status}] ${query}:`, await res.text());
    return [];
  }
  const json = await res.json();
  const arr = json?.data?.web ?? json?.data ?? [];
  return Array.isArray(arr) ? arr : [];
}

async function classifyMenciones(
  hits: SearchHit[],
  entidadNombre: string,
  lovableKey: string,
): Promise<MencionClasificada[]> {
  if (hits.length === 0) return [];

  const corpus = hits
    .slice(0, 25)
    .map((h, i) => `[${i + 1}] ${h.title ?? ""}\n${h.description ?? h.markdown?.slice(0, 400) ?? ""}\nURL: ${h.url ?? ""}`)
    .join("\n\n");

  const res = await fetch(LOVABLE_AI_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${lovableKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "system",
          content: `Eres un analista SOCMINT político en Michoacán. Para cada noticia/mención sobre "${entidadNombre}", extrae:
- sentimiento (-1 muy negativo, 0 neutro, +1 muy positivo)
- tema principal (1-3 palabras: seguridad, economía, gobernanza, escándalo, agenda, etc.)
- hashtags relevantes inferidos
- MUNICIPIO oficial INEGI de Michoacán (los 113), o null si es estatal/no claro. NO inventes municipios fuera de Michoacán
- PSICOINT: scores 0-1 de 6 emociones (enojo, miedo, esperanza, indignacion, desconfianza, orgullo). Asigna 0 si no está presente
- sarcasmo: true si detectas ironía o sarcasmo
- GEOINT fino: si el texto menciona explícitamente número de sección electoral (ej "sección 1234"), devuélvelo en seccion_inferida; si menciona colonia/tenencia/fraccionamiento (ej "colonia Félix Ireta", "tenencia Morelos"), devuelve el nombre en colonia_inferida. Si no, null en ambos.`,
        },
        { role: "user", content: `Menciones sobre ${entidadNombre}:\n\n${corpus}\n\nClasifica cada una.` },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "emit_menciones",
            description: "Emite menciones clasificadas con SOCMINT+PSICOINT+GEOINT",
            parameters: {
              type: "object",
              properties: {
                menciones: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      titulo: { type: "string", maxLength: 200 },
                      fragmento: { type: "string", maxLength: 400 },
                      url: { type: "string" },
                      fuente: { type: "string" },
                      sentimiento: { type: "number", minimum: -1, maximum: 1 },
                      tema: { type: "string" },
                      hashtags: { type: "array", items: { type: "string" }, maxItems: 5 },
                      municipio: { type: ["string", "null"], description: "Municipio oficial de Michoacán o null" },
                      emociones: {
                        type: "object",
                        properties: {
                          enojo: { type: "number", minimum: 0, maximum: 1 },
                          miedo: { type: "number", minimum: 0, maximum: 1 },
                          esperanza: { type: "number", minimum: 0, maximum: 1 },
                          indignacion: { type: "number", minimum: 0, maximum: 1 },
                          desconfianza: { type: "number", minimum: 0, maximum: 1 },
                          orgullo: { type: "number", minimum: 0, maximum: 1 },
                        },
                        required: ["enojo", "miedo", "esperanza", "indignacion", "desconfianza", "orgullo"],
                      },
                      sarcasmo: { type: "boolean" },
                      seccion_inferida: { type: ["integer", "null"], description: "Número de sección INE si se menciona explícitamente" },
                      colonia_inferida: { type: ["string", "null"], description: "Nombre de colonia/tenencia si se menciona" },
                    },
                    required: ["titulo", "fragmento", "url", "fuente", "sentimiento", "tema", "hashtags", "municipio", "emociones", "sarcasmo", "seccion_inferida", "colonia_inferida"],
                  },
                },
              },
              required: ["menciones"],
            },
          },
        },
              },
              required: ["menciones"],
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "emit_menciones" } },
    }),
  });

  if (!res.ok) {
    const txt = await res.text();
    console.error(`AI classify [${res.status}] ${entidadNombre}:`, txt);
    return [];
  }
  const json = await res.json();
  const toolCall = json.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall) return [];
  try {
    const args = JSON.parse(toolCall.function.arguments);
    return (args.menciones ?? []) as MencionClasificada[];
  } catch {
    return [];
  }
}

// (Removido) detectarTopRivales: ahora los rivales se gestionan manualmente desde /candidatos
// para garantizar que el monitor solo procese candidatos relevantes para el usuario en Michoacán.


function topN<T>(items: T[], keyFn: (x: T) => string, n: number): { value: string; count: number }[] {
  const map = new Map<string, number>();
  items.forEach((x) => {
    const k = keyFn(x);
    if (k) map.set(k, (map.get(k) ?? 0) + 1);
  });
  return Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([value, count]) => ({ value, count }));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const startedAt = Date.now();
  const body = await req.json().catch(() => ({}));
  const trigger = body?.trigger ?? "manual";
  const userId = body?.user_id ?? null;

  const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!FIRECRAWL_API_KEY || !LOVABLE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return new Response(JSON.stringify({ error: "Faltan variables de entorno" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const batchId = crypto.randomUUID();

  // Lock: previene runs solapados (mismo cron + manual al mismo tiempo)
  const lockName = userId ? `monitor-social:${userId}` : "monitor-social:global";
  const { data: acquired } = await supabase.rpc("intentar_lock_pipeline", { _nombre: lockName });
  if (!acquired) {
    return new Response(
      JSON.stringify({ success: false, skipped: true, reason: "already_running" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  try {
    // 1. Cargar TODOS los candidatos del usuario (propios y rivales registrados manualmente).
    //    Ya no auto-detectamos rivales con IA: el usuario decide a quién monitorear desde /candidatos.
    let candidatosQuery = supabase
      .from("candidatos")
      .select("id, nombre, partido, nivel, territorio, es_propio");
    if (userId) candidatosQuery = candidatosQuery.eq("user_id", userId);
    const { data: candidatosBD } = await candidatosQuery.limit(50);
    const candidatos = candidatosBD ?? [];
    const candidatosPropios = candidatos.filter((c) => c.es_propio);

    // 2. Construir lista de entidades — todas ancladas a Michoacán + territorio
    const entidades: EntidadObjetivo[] = [
      { tipo: "estatal", nombre: "Michoacán", candidato_id: null, queries: QUERIES_ESTATALES },
      ...candidatos.map((c) => ({
        tipo: (c.es_propio ? "candidato_propio" : "rival") as "candidato_propio" | "rival",
        nombre: c.nombre,
        candidato_id: c.id,
        queries: [
          `"${c.nombre}" Michoacán ${c.territorio}`,
          `"${c.nombre}" ${c.partido} Michoacán`,
          `"${c.nombre}" ${c.territorio}`,
        ],
      })),
    ];

    // 3. Procesar entidades en paralelo con límite de concurrencia para evitar timeout (150s).
    //    Cada entidad: search → classify → filtro Michoacán → persistir.
    let totalMenciones = 0;
    let totalDescartadas = 0;
    const CONCURRENCIA = 5;

    const procesarEntidad = async (ent: EntidadObjetivo) => {
      try {
        const hitsArrays = await Promise.all(ent.queries.map((q) => firecrawlSearch(q, FIRECRAWL_API_KEY)));
        const hits = hitsArrays.flat().filter((h) => {
          if (ent.tipo === "estatal") return true;
          const texto = `${h.title ?? ""} ${h.description ?? ""} ${h.url ?? ""}`;
          return esMichoacan(texto);
        });
        if (hits.length === 0) return 0;

        const mencionesRaw = await classifyMenciones(hits, ent.nombre, LOVABLE_API_KEY);

        let descartadasLocal = 0;
        const menciones = ent.tipo === "estatal"
          ? mencionesRaw
          : mencionesRaw.filter((m) => {
              const ok = esMichoacan(`${m.titulo} ${m.fragmento} ${m.url}`);
              if (!ok) descartadasLocal += 1;
              return ok;
            });
        totalDescartadas += descartadasLocal;

        if (menciones.length === 0) return 0;

        const rows = menciones.map((m) => ({
          batch_id: batchId,
          entidad_tipo: ent.tipo,
          entidad_nombre: ent.nombre,
          candidato_id: ent.candidato_id,
          titulo: m.titulo,
          fragmento: m.fragmento,
          url: m.url,
          fuente: m.fuente,
          sentimiento: Math.max(-1, Math.min(1, m.sentimiento)),
          tema: m.tema,
          hashtags: m.hashtags,
          municipio: normalizarMunicipio(m.municipio),
          emociones: m.emociones ?? {},
          sarcasmo: m.sarcasmo ?? false,
          seccion_inferida: typeof m.seccion_inferida === "number" ? m.seccion_inferida : null,
          colonia_inferida: m.colonia_inferida ?? null,
        }));
        const { error: insErr } = await supabase.from("social_menciones").insert(rows);
        if (insErr) {
          console.error(`Insert menciones ${ent.nombre}:`, insErr.message);
          return 0;
        }

        const sents = menciones.map((m) => m.sentimiento);
        const promedio = sents.reduce((a, b) => a + b, 0) / sents.length;
        const pos = sents.filter((s) => s > 0.2).length;
        const neg = sents.filter((s) => s < -0.2).length;
        const neu = sents.length - pos - neg;
        const total = menciones.length;

        await supabase.from("social_resumen").insert({
          batch_id: batchId,
          entidad_tipo: ent.tipo,
          entidad_nombre: ent.nombre,
          candidato_id: ent.candidato_id,
          total_menciones: total,
          sentimiento_promedio: Number(promedio.toFixed(2)),
          pct_positivo: Number(((pos / total) * 100).toFixed(2)),
          pct_neutro: Number(((neu / total) * 100).toFixed(2)),
          pct_negativo: Number(((neg / total) * 100).toFixed(2)),
          top_hashtags: topN(menciones.flatMap((m) => m.hashtags), (x) => x, 5),
          top_temas: topN(menciones, (m) => m.tema, 5),
        });

        return total;
      } catch (e) {
        console.error(`Error procesando ${ent.nombre}:`, e instanceof Error ? e.message : e);
        return 0;
      }
    };

    // Ejecutar en lotes de CONCURRENCIA entidades simultáneas
    for (let i = 0; i < entidades.length; i += CONCURRENCIA) {
      const lote = entidades.slice(i, i + CONCURRENCIA);
      const resultados = await Promise.all(lote.map(procesarEntidad));
      totalMenciones += resultados.reduce((a, b) => a + b, 0);
    }

    await supabase.from("social_runs").insert({
      batch_id: batchId,
      entidades_procesadas: entidades.length,
      total_menciones: totalMenciones,
      duracion_ms: Date.now() - startedAt,
      trigger,
      user_id: userId,
    });

    return new Response(
      JSON.stringify({
        success: true,
        batch_id: batchId,
        entidades: entidades.length,
        total_menciones: totalMenciones,
        descartadas_fuera_michoacan: totalDescartadas,
        candidatos_monitoreados: candidatos.length,
        candidatos_propios: candidatosPropios.length,
        rivales_registrados: candidatos.length - candidatosPropios.length,
        duracion_ms: Date.now() - startedAt,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("monitor-social error:", msg);
    await supabase.from("social_runs").insert({
      batch_id: batchId,
      entidades_procesadas: 0,
      total_menciones: 0,
      duracion_ms: Date.now() - startedAt,
      trigger,
      user_id: userId,
      error: msg,
    });
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

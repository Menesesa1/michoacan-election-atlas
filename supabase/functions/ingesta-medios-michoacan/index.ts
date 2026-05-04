// Edge function: ingesta-medios-michoacan
// Scrapea 9 medios locales de Michoacán vía Firecrawl Search,
// deduplica por hash de URL y delega clasificación PSICOINT+GEOINT
// invocando monitor-social (que ya hace search+IA) — pero acá usamos
// queries específicas por medio para garantizar cobertura local.
import { createClient } from "npm:@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FIRECRAWL_V2 = "https://api.firecrawl.dev/v2";
const LOVABLE_AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

// 9 medios principales de Michoacán
const MEDIOS = [
  { dominio: "cambiodemichoacan.com.mx", nombre: "Cambio de Michoacán" },
  { dominio: "quadratin.com.mx", nombre: "Quadratín Michoacán" },
  { dominio: "lavozdemichoacan.com.mx", nombre: "La Voz de Michoacán" },
  { dominio: "provincia.com.mx", nombre: "Provincia" },
  { dominio: "respuesta.com.mx", nombre: "Respuesta" },
  { dominio: "mimorelia.com", nombre: "MiMorelia" },
  { dominio: "contramuro.com", nombre: "Contramuro" },
  { dominio: "monitorexpresso.com", nombre: "Monitor Expresso" },
  { dominio: "atiempo.mx", nombre: "Atiempo" },
];

// Temas políticos clave para focalizar el scraping
const TEMAS = ["política", "gobierno", "seguridad", "elecciones", "Bedolla"];

interface SearchHit {
  title?: string;
  url?: string;
  description?: string;
  publishedDate?: string;
}

async function firecrawlSearchSite(dominio: string, tema: string, apiKey: string): Promise<SearchHit[]> {
  const res = await fetch(`${FIRECRAWL_V2}/search`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      query: `site:${dominio} ${tema} Michoacán`,
      limit: 5,
      lang: "es",
      country: "mx",
      tbs: "qdr:d", // últimas 24h (cron corre cada 4h)
    }),
  });
  if (!res.ok) {
    console.error(`Firecrawl ${dominio} ${tema}: ${res.status}`);
    return [];
  }
  const json = await res.json();
  const arr = json?.data?.web ?? json?.data ?? [];
  return Array.isArray(arr) ? arr : [];
}

async function hashUrl(url: string): Promise<string> {
  const data = new TextEncoder().encode(url.toLowerCase().trim());
  const hashBuf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

interface ClasificacionMedio {
  sentimiento: number;
  tema: string;
  hashtags: string[];
  municipio: string | null;
  emociones: Record<string, number>;
  sarcasmo: boolean;
  seccion_inferida: number | null;
  colonia_inferida: string | null;
}

async function clasificarLote(hits: { titulo: string; fragmento: string; url: string; fuente: string }[], lovableKey: string): Promise<ClasificacionMedio[]> {
  if (hits.length === 0) return [];
  const corpus = hits
    .map((h, i) => `[${i + 1}] ${h.titulo}\n${h.fragmento}\nURL: ${h.url}`)
    .join("\n\n");

  const res = await fetch(LOVABLE_AI_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${lovableKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "system",
          content: `Eres analista SOCMINT político en Michoacán. Para cada nota de medio local, devuelve:
- sentimiento (-1 a 1)
- tema (1-3 palabras)
- hashtags inferidos (máx 5)
- municipio oficial INEGI de Michoacán o null
- emociones: scores 0-1 de enojo, miedo, esperanza, indignacion, desconfianza, orgullo
- sarcasmo (bool)
- seccion_inferida: número de sección INE si la nota lo cita, sino null
- colonia_inferida: nombre de colonia/tenencia si aparece, sino null
DEVUELVE EXACTAMENTE EL MISMO NÚMERO DE ELEMENTOS Y EN EL MISMO ORDEN.`,
        },
        { role: "user", content: corpus },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "clasificar",
            parameters: {
              type: "object",
              properties: {
                items: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      sentimiento: { type: "number" },
                      tema: { type: "string" },
                      hashtags: { type: "array", items: { type: "string" } },
                      municipio: { type: ["string", "null"] },
                      emociones: {
                        type: "object",
                        properties: {
                          enojo: { type: "number" },
                          miedo: { type: "number" },
                          esperanza: { type: "number" },
                          indignacion: { type: "number" },
                          desconfianza: { type: "number" },
                          orgullo: { type: "number" },
                        },
                        required: ["enojo", "miedo", "esperanza", "indignacion", "desconfianza", "orgullo"],
                      },
                      sarcasmo: { type: "boolean" },
                      seccion_inferida: { type: ["integer", "null"] },
                      colonia_inferida: { type: ["string", "null"] },
                    },
                    required: ["sentimiento", "tema", "hashtags", "municipio", "emociones", "sarcasmo", "seccion_inferida", "colonia_inferida"],
                  },
                },
              },
              required: ["items"],
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "clasificar" } },
    }),
  });

  if (!res.ok) {
    console.error(`Clasificar lote: ${res.status}`, await res.text());
    return [];
  }
  const json = await res.json();
  const tc = json.choices?.[0]?.message?.tool_calls?.[0];
  if (!tc) return [];
  try {
    return (JSON.parse(tc.function.arguments).items ?? []) as ClasificacionMedio[];
  } catch {
    return [];
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const startedAt = Date.now();
  const body = await req.json().catch(() => ({}));
  const trigger = body?.trigger ?? "manual";

  const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!FIRECRAWL_API_KEY || !LOVABLE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return new Response(JSON.stringify({ error: "Faltan envs" }), { status: 500, headers: corsHeaders });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const batchId = crypto.randomUUID();

  let urlsDescubiertas = 0;
  let urlsNuevas = 0;
  let mencionesCreadas = 0;
  let error: string | null = null;

  try {
    // 1. Buscar en cada medio × tema (en paralelo, lotes de 5)
    const tareas: Promise<{ medio: typeof MEDIOS[0]; hits: SearchHit[] }>[] = [];
    for (const medio of MEDIOS) {
      for (const tema of TEMAS) {
        tareas.push(
          firecrawlSearchSite(medio.dominio, tema, FIRECRAWL_API_KEY).then((hits) => ({ medio, hits })),
        );
      }
    }

    // Ejecutar en lotes de 5 para no saturar
    const resultados: { medio: typeof MEDIOS[0]; hits: SearchHit[] }[] = [];
    for (let i = 0; i < tareas.length; i += 5) {
      const lote = await Promise.all(tareas.slice(i, i + 5));
      resultados.push(...lote);
    }

    // 2. Dedupe por URL (chequeo en BD)
    type Pendiente = { titulo: string; fragmento: string; url: string; fuente: string; url_hash: string };
    const pendientes: Pendiente[] = [];

    for (const { medio, hits } of resultados) {
      for (const h of hits) {
        if (!h.url || !h.title) continue;
        urlsDescubiertas += 1;
        const url_hash = await hashUrl(h.url);
        pendientes.push({
          titulo: h.title.slice(0, 200),
          fragmento: (h.description ?? "").slice(0, 400),
          url: h.url,
          fuente: medio.nombre,
          url_hash,
        });
      }
    }

    // Filtrar URLs ya procesadas
    const hashes = pendientes.map((p) => p.url_hash);
    const { data: yaProcesadas } = await supabase
      .from("medios_urls_procesadas")
      .select("url_hash")
      .in("url_hash", hashes);
    const yaSet = new Set((yaProcesadas ?? []).map((r) => r.url_hash));
    const nuevos = pendientes.filter((p) => !yaSet.has(p.url_hash));
    urlsNuevas = nuevos.length;

    if (nuevos.length === 0) {
      await supabase.from("medios_michoacan_runs").insert({
        batch_id: batchId,
        medios_consultados: MEDIOS.length,
        urls_descubiertas: urlsDescubiertas,
        urls_nuevas: 0,
        menciones_creadas: 0,
        duracion_ms: Date.now() - startedAt,
        trigger,
      });
      return new Response(JSON.stringify({ success: true, batch_id: batchId, urls_descubiertas: urlsDescubiertas, urls_nuevas: 0 }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. Clasificar en lotes de 10
    const clasificadasTodas: { hit: Pendiente; clas: ClasificacionMedio }[] = [];
    for (let i = 0; i < nuevos.length; i += 10) {
      const lote = nuevos.slice(i, i + 10);
      const clas = await clasificarLote(lote, LOVABLE_API_KEY);
      lote.forEach((h, idx) => {
        if (clas[idx]) clasificadasTodas.push({ hit: h, clas: clas[idx] });
      });
    }

    // 4. Insertar menciones
    if (clasificadasTodas.length > 0) {
      const rows = clasificadasTodas.map(({ hit, clas }) => ({
        batch_id: batchId,
        entidad_tipo: "estatal",
        entidad_nombre: "Michoacán · Medios locales",
        candidato_id: null,
        titulo: hit.titulo,
        fragmento: hit.fragmento,
        url: hit.url,
        fuente: hit.fuente,
        sentimiento: Math.max(-1, Math.min(1, clas.sentimiento ?? 0)),
        tema: clas.tema ?? "general",
        hashtags: clas.hashtags ?? [],
        municipio: clas.municipio,
        emociones: clas.emociones ?? {},
        sarcasmo: clas.sarcasmo ?? false,
        seccion_inferida: clas.seccion_inferida,
        colonia_inferida: clas.colonia_inferida,
      }));
      const { error: insErr } = await supabase.from("social_menciones").insert(rows);
      if (insErr) {
        console.error("Insert social_menciones:", insErr.message);
      } else {
        mencionesCreadas = rows.length;
      }

      // Marcar URLs como procesadas
      const dedupeRows = clasificadasTodas.map(({ hit }) => ({
        url_hash: hit.url_hash,
        url: hit.url,
        fuente: hit.fuente,
      }));
      await supabase.from("medios_urls_procesadas").insert(dedupeRows);
    }
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
    console.error("ingesta-medios error:", error);
  }

  await supabase.from("medios_michoacan_runs").insert({
    batch_id: batchId,
    medios_consultados: MEDIOS.length,
    urls_descubiertas: urlsDescubiertas,
    urls_nuevas: urlsNuevas,
    menciones_creadas: mencionesCreadas,
    duracion_ms: Date.now() - startedAt,
    trigger,
    error,
  });

  return new Response(
    JSON.stringify({
      success: !error,
      batch_id: batchId,
      medios_consultados: MEDIOS.length,
      urls_descubiertas: urlsDescubiertas,
      urls_nuevas: urlsNuevas,
      menciones_creadas: mencionesCreadas,
      duracion_ms: Date.now() - startedAt,
      error,
    }),
    { status: error ? 500 : 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});

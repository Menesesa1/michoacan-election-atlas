// Edge function: precarga trayectoria política y métricas de redes para un candidato.
// Estrategia:
//   1. Firecrawl Search → buscar Wikipedia / IEM / sitios oficiales del candidato.
//   2. Firecrawl Scrape → obtener markdown limpio de las páginas más relevantes.
//   3. Para cada red social (URL en `redes`) → scrape público de la página de perfil.
//   4. LLM (Lovable AI Gateway) → normalizar todo a TrayectoriaHito[] + MetricasRedes
//      con fuentes citadas. Marca cada propuesta como "borrador por verificar".
//
// Devuelve propuestas — el usuario valida y guarda manualmente desde la UI.

import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

const FIRECRAWL_V2 = "https://api.firecrawl.dev/v2";
const LOVABLE_AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

interface RequestBody {
  nombre: string;
  partido?: string;
  territorio?: string;
  cargo_buscado?: string;
  nivel?: string;
  redes?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    tiktok?: string;
    youtube?: string;
    web?: string;
  };
}

interface PropuestaTrayectoria {
  anio: number;
  cargo: string;
  partido?: string;
  tipo: "electo" | "designado" | "candidatura" | "cambio_partido" | "dirigencia" | "otro";
  descripcion?: string;
  fuentes: string[];
  confianza: "alta" | "media" | "baja";
}

interface PropuestaMetrica {
  plataforma: "facebook" | "twitter" | "instagram" | "tiktok" | "youtube";
  seguidores?: number;
  engagement_rate?: number;
  fuente_url: string;
  nota_extraccion?: string;
  confianza: "alta" | "media" | "baja";
}

interface ResponseBody {
  trayectoria_propuesta: PropuestaTrayectoria[];
  metricas_propuesta: PropuestaMetrica[];
  fuentes_consultadas: { url: string; titulo?: string; tipo: "wikipedia" | "iem" | "oficial" | "red_social" | "otro" }[];
  notas: string[];
  errores: string[];
}

async function firecrawlSearch(query: string, limit = 5): Promise<Array<{ url: string; title?: string; description?: string; markdown?: string }>> {
  const apiKey = Deno.env.get("FIRECRAWL_API_KEY");
  if (!apiKey) throw new Error("FIRECRAWL_API_KEY no configurada");

  const res = await fetch(`${FIRECRAWL_V2}/search`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      query,
      limit,
      lang: "es",
      country: "mx",
      scrapeOptions: { formats: ["markdown"] },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Firecrawl search ${res.status}: ${body.slice(0, 200)}`);
  }

  const data = await res.json();
  // v2 puede devolver data.web[] o data.data[]
  const items = data?.data?.web ?? data?.data ?? data?.web ?? [];
  return Array.isArray(items) ? items : [];
}

async function firecrawlScrape(url: string, opts?: { onlyMainContent?: boolean }): Promise<{ markdown?: string; metadata?: { title?: string; description?: string } }> {
  const apiKey = Deno.env.get("FIRECRAWL_API_KEY");
  if (!apiKey) throw new Error("FIRECRAWL_API_KEY no configurada");

  const res = await fetch(`${FIRECRAWL_V2}/scrape`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      url,
      formats: ["markdown"],
      onlyMainContent: opts?.onlyMainContent ?? true,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Firecrawl scrape ${res.status}: ${body.slice(0, 200)}`);
  }

  const data = await res.json();
  const doc = data?.data ?? data;
  return { markdown: doc?.markdown, metadata: doc?.metadata };
}

function clasificarFuente(url: string): "wikipedia" | "iem" | "oficial" | "red_social" | "otro" {
  const u = url.toLowerCase();
  if (u.includes("wikipedia.org")) return "wikipedia";
  if (u.includes("iem.org.mx") || u.includes("ieem.org.mx")) return "iem";
  if (u.includes("facebook.com") || u.includes("twitter.com") || u.includes("x.com") || u.includes("instagram.com") || u.includes("tiktok.com") || u.includes("youtube.com")) return "red_social";
  if (u.includes("gob.mx") || u.includes("congreso") || u.includes("morelia.gob") || u.includes("michoacan.gob")) return "oficial";
  return "otro";
}

async function llamarLLM(systemPrompt: string, userPrompt: string): Promise<unknown> {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) throw new Error("LOVABLE_API_KEY no configurada");

  const res = await fetch(LOVABLE_AI_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (res.status === 429) throw new Error("Rate limit del LLM — reintenta en unos segundos");
  if (res.status === 402) throw new Error("Créditos del workspace agotados");
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`LLM ${res.status}: ${body.slice(0, 200)}`);
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error("LLM sin contenido");
  try {
    return JSON.parse(content);
  } catch {
    throw new Error("LLM no devolvió JSON válido");
  }
}

const TRAY_SYSTEM = `Eres un analista político mexicano experto en construir trayectorias verificadas.
Recibes texto crudo de Wikipedia, IEM y sitios oficiales sobre un candidato.
Tu trabajo: extraer SOLO hitos políticos comprobables (cargos electos, designados, candidaturas, cambios de partido, dirigencia partidaria).
Reglas estrictas:
- NO inventes años, partidos ni cargos. Si un dato no está en el texto, NO lo incluyas.
- Cada hito debe citar al menos una URL de las fuentes proporcionadas.
- Marca confianza="alta" solo si Wikipedia + IEM/oficial coinciden. "media" si solo una fuente lo cubre. "baja" si es ambiguo.
- Tipo: "electo" (ganó elección), "designado" (nombrado), "candidatura" (perdió o no concluyó), "cambio_partido", "dirigencia", "otro".
Devuelve JSON: { "hitos": PropuestaTrayectoria[], "notas": string[] } donde notas explica vacíos o ambigüedades.`;

const METRICAS_SYSTEM = `Eres un extractor de métricas de redes sociales.
Recibes el markdown público de páginas de Facebook/Twitter/Instagram/TikTok/YouTube de un político.
Tu trabajo: extraer ÚNICAMENTE el número de seguidores/likes/suscriptores que aparezca textualmente en el contenido.
Reglas:
- NO inventes números. Si no aparece, devuelve seguidores=null.
- Convierte "1.2M" → 1200000, "45K" → 45000.
- engagement_rate solo si aparece explícitamente como porcentaje en el texto (raro). Si no, omítelo.
- Cita siempre la URL exacta de la página.
- confianza="alta" si el número aparece junto a la palabra "seguidores"/"followers"/"suscriptores". "media" si es ambiguo. "baja" si tuviste que interpretar.
Devuelve JSON: { "metricas": PropuestaMetrica[], "notas": string[] }.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const errores: string[] = [];
  const notas: string[] = [];

  try {
    const body = (await req.json()) as RequestBody;
    if (!body.nombre || typeof body.nombre !== "string") {
      return new Response(JSON.stringify({ error: "Campo 'nombre' es obligatorio" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ctxParts = [body.nombre];
    if (body.cargo_buscado) ctxParts.push(body.cargo_buscado);
    if (body.territorio) ctxParts.push(body.territorio);
    ctxParts.push("Michoacán político");
    const queryBase = ctxParts.join(" ");

    // ============ 1. Buscar trayectoria en Wikipedia + IEM + sitios oficiales ============
    const fuentesTexto: { url: string; titulo?: string; markdown: string; tipo: ReturnType<typeof clasificarFuente> }[] = [];
    const fuentesConsultadas: ResponseBody["fuentes_consultadas"] = [];

    // Búsqueda 1: Wikipedia
    try {
      const wikiResults = await firecrawlSearch(`${queryBase} site:wikipedia.org`, 3);
      for (const r of wikiResults.slice(0, 2)) {
        if (!r.url) continue;
        const tipo = clasificarFuente(r.url);
        fuentesConsultadas.push({ url: r.url, titulo: r.title, tipo });
        if (r.markdown && r.markdown.length > 200) {
          fuentesTexto.push({ url: r.url, titulo: r.title, markdown: r.markdown.slice(0, 8000), tipo });
        }
      }
    } catch (e) {
      errores.push(`Búsqueda Wikipedia: ${e instanceof Error ? e.message : "error"}`);
    }

    // Búsqueda 2: IEM / oficial
    try {
      const oficialResults = await firecrawlSearch(`${queryBase} (site:iem.org.mx OR site:gob.mx OR "diputado" OR "presidente municipal")`, 5);
      for (const r of oficialResults.slice(0, 3)) {
        if (!r.url) continue;
        if (fuentesConsultadas.some((f) => f.url === r.url)) continue;
        const tipo = clasificarFuente(r.url);
        fuentesConsultadas.push({ url: r.url, titulo: r.title, tipo });
        if (r.markdown && r.markdown.length > 200) {
          fuentesTexto.push({ url: r.url, titulo: r.title, markdown: r.markdown.slice(0, 6000), tipo });
        }
      }
    } catch (e) {
      errores.push(`Búsqueda oficial/IEM: ${e instanceof Error ? e.message : "error"}`);
    }

    // ============ 2. Normalizar trayectoria con LLM ============
    let trayectoriaPropuesta: PropuestaTrayectoria[] = [];
    if (fuentesTexto.length === 0) {
      notas.push("No se encontró información biográfica pública. Captura la trayectoria manualmente.");
    } else {
      try {
        const userPrompt = `Candidato: ${body.nombre}${body.partido ? ` (${body.partido})` : ""}.
Cargo buscado: ${body.cargo_buscado ?? "no especificado"}.
Territorio: ${body.territorio ?? "Michoacán"}.

Fuentes disponibles:
${fuentesTexto.map((f, i) => `\n--- FUENTE ${i + 1} (${f.tipo}) ---\nURL: ${f.url}\nTítulo: ${f.titulo ?? "?"}\n\n${f.markdown}`).join("\n")}

Extrae la trayectoria política verificable como JSON con la forma:
{ "hitos": [{ "anio": number, "cargo": string, "partido": string|null, "tipo": "electo"|"designado"|"candidatura"|"cambio_partido"|"dirigencia"|"otro", "descripcion": string|null, "fuentes": string[], "confianza": "alta"|"media"|"baja" }], "notas": string[] }`;

        const out = (await llamarLLM(TRAY_SYSTEM, userPrompt)) as { hitos?: PropuestaTrayectoria[]; notas?: string[] };
        trayectoriaPropuesta = (out.hitos ?? []).filter((h) => h.anio && h.cargo);
        if (out.notas) notas.push(...out.notas);
      } catch (e) {
        errores.push(`Normalización trayectoria: ${e instanceof Error ? e.message : "error"}`);
      }
    }

    // ============ 3. Métricas: scrape de cada red social ============
    const metricasFuentes: { plataforma: PropuestaMetrica["plataforma"]; url: string; markdown: string }[] = [];
    const redes = body.redes ?? {};
    const platMap: Record<PropuestaMetrica["plataforma"], string | undefined> = {
      facebook: redes.facebook,
      twitter: redes.twitter,
      instagram: redes.instagram,
      tiktok: redes.tiktok,
      youtube: redes.youtube,
    };

    for (const [plat, url] of Object.entries(platMap)) {
      if (!url) continue;
      try {
        const scraped = await firecrawlScrape(url, { onlyMainContent: false });
        fuentesConsultadas.push({ url, titulo: scraped.metadata?.title, tipo: "red_social" });
        if (scraped.markdown && scraped.markdown.length > 100) {
          metricasFuentes.push({ plataforma: plat as PropuestaMetrica["plataforma"], url, markdown: scraped.markdown.slice(0, 5000) });
        }
      } catch (e) {
        errores.push(`Scrape ${plat}: ${e instanceof Error ? e.message : "error"}`);
      }
    }

    // ============ 4. Normalizar métricas con LLM ============
    let metricasPropuesta: PropuestaMetrica[] = [];
    if (metricasFuentes.length === 0) {
      if (Object.values(platMap).every((v) => !v)) {
        notas.push("Captura las URLs de redes sociales del candidato para precargar métricas automáticamente.");
      } else {
        notas.push("Las páginas de redes no devolvieron contenido legible (posible muro de login). Captura métricas manualmente.");
      }
    } else {
      try {
        const userPrompt = `Candidato: ${body.nombre}.
Páginas públicas de redes a procesar:
${metricasFuentes.map((m, i) => `\n--- ${m.plataforma.toUpperCase()} (${i + 1}) ---\nURL: ${m.url}\n\n${m.markdown}`).join("\n")}

Extrae métricas como JSON:
{ "metricas": [{ "plataforma": "facebook"|"twitter"|"instagram"|"tiktok"|"youtube", "seguidores": number|null, "engagement_rate": number|null, "fuente_url": string, "nota_extraccion": string|null, "confianza": "alta"|"media"|"baja" }], "notas": string[] }`;

        const out = (await llamarLLM(METRICAS_SYSTEM, userPrompt)) as { metricas?: PropuestaMetrica[]; notas?: string[] };
        metricasPropuesta = (out.metricas ?? []).filter((m) => m.plataforma && m.fuente_url);
        if (out.notas) notas.push(...out.notas);
      } catch (e) {
        errores.push(`Normalización métricas: ${e instanceof Error ? e.message : "error"}`);
      }
    }

    const response: ResponseBody = {
      trayectoria_propuesta: trayectoriaPropuesta,
      metricas_propuesta: metricasPropuesta,
      fuentes_consultadas: fuentesConsultadas,
      notas,
      errores,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("firecrawl-precarga-candidato fatal:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Error desconocido", errores, notas }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

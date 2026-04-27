// Edge function: precarga trayectoria política y métricas de redes para un candidato.
// Estrategia (búsqueda PROFUNDA con múltiples fallbacks):
//   1. Múltiples queries de Firecrawl Search (Wikipedia, IEM/oficiales, prensa, redes).
//   2. Scrape directo de URLs prometedoras cuando el search no devuelve markdown.
//   3. Fallbacks: Wikipedia ES + EN, búsqueda libre, búsquedas por cargo+territorio.
//   4. Para cada red social → scrape público (con onlyMainContent=false).
//   5. LLM (Lovable AI Gateway) → normaliza todo a TrayectoriaHito[] + MetricasRedes.
//   6. Nunca devuelve 500: siempre regresa 200 con notas/errores explicando qué pasó.

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
  fuentes_consultadas: { url: string; titulo?: string; tipo: "wikipedia" | "iem" | "oficial" | "red_social" | "prensa" | "otro" }[];
  notas: string[];
  errores: string[];
}

type Tipo = ResponseBody["fuentes_consultadas"][number]["tipo"];

interface SearchHit { url: string; title?: string; description?: string; markdown?: string }

async function firecrawlSearch(query: string, limit = 5): Promise<SearchHit[]> {
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
      scrapeOptions: { formats: ["markdown"], onlyMainContent: true },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Firecrawl search ${res.status}: ${body.slice(0, 200)}`);
  }

  const data = await res.json();
  // v2 puede devolver data.web[] o data.data[] o data.data.web[]
  const items =
    data?.data?.web ??
    (Array.isArray(data?.data) ? data.data : null) ??
    data?.web ??
    [];
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
      waitFor: 1500,
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

function clasificarFuente(url: string): Tipo {
  const u = url.toLowerCase();
  if (u.includes("wikipedia.org")) return "wikipedia";
  if (u.includes("iem.org.mx") || u.includes("ieem.org.mx") || u.includes("ine.mx")) return "iem";
  if (u.includes("facebook.com") || u.includes("twitter.com") || u.includes("x.com") || u.includes("instagram.com") || u.includes("tiktok.com") || u.includes("youtube.com")) return "red_social";
  if (u.includes("gob.mx") || u.includes("congreso") || u.includes("morelia.gob") || u.includes("michoacan.gob")) return "oficial";
  if (u.includes("milenio") || u.includes("eluniversal") || u.includes("jornada") || u.includes("excelsior") || u.includes("animalpolitico") || u.includes("proceso") || u.includes("changoonga") || u.includes("contramuro") || u.includes("monitorexpresso") || u.includes("quadratin")) return "prensa";
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
    // Intenta extraer JSON del texto si vino con prefacio
    const m = content.match(/\{[\s\S]*\}/);
    if (m) {
      try { return JSON.parse(m[0]); } catch { /* ignore */ }
    }
    throw new Error("LLM no devolvió JSON válido");
  }
}

const TRAY_SYSTEM = `Eres un analista político mexicano experto en construir trayectorias verificadas.
Recibes texto crudo de Wikipedia, IEM, sitios oficiales y prensa sobre un candidato.
Tu trabajo: extraer SOLO hitos políticos comprobables (cargos electos, designados, candidaturas, cambios de partido, dirigencia partidaria).
Reglas estrictas:
- NO inventes años, partidos ni cargos. Si un dato no está en el texto, NO lo incluyas.
- Cada hito debe citar al menos una URL de las fuentes proporcionadas.
- Marca confianza="alta" si Wikipedia + IEM/oficial coinciden. "media" si una sola fuente seria lo cubre. "baja" si solo prensa o ambiguo.
- Tipo: "electo" (ganó elección), "designado" (nombrado), "candidatura" (perdió o no concluyó), "cambio_partido", "dirigencia", "otro".
- Sé EXHAUSTIVO: extrae todos los hitos que aparezcan en el texto, no solo los más recientes.
Devuelve JSON: { "hitos": PropuestaTrayectoria[], "notas": string[] } donde notas explica vacíos o ambigüedades.`;

const METRICAS_SYSTEM = `Eres un extractor de métricas de redes sociales.
Recibes el markdown público de páginas de Facebook/Twitter/Instagram/TikTok/YouTube de un político.
Tu trabajo: extraer ÚNICAMENTE el número de seguidores/likes/suscriptores que aparezca textualmente en el contenido.
Reglas:
- NO inventes números. Si no aparece, devuelve seguidores=null pero igual incluye la entrada con confianza="baja" y nota_extraccion="No se encontró número visible".
- Convierte "1.2M" → 1200000, "45K" → 45000, "1,234" → 1234.
- engagement_rate solo si aparece explícitamente como porcentaje. Si no, omítelo.
- Cita siempre la URL exacta de la página.
- confianza="alta" si el número aparece junto a "seguidores"/"followers"/"suscriptores". "media" si es ambiguo. "baja" si tuviste que interpretar o no encontraste.
Devuelve JSON: { "metricas": PropuestaMetrica[], "notas": string[] }.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const errores: string[] = [];
  const notas: string[] = [];

  try {
    const body = (await req.json()) as RequestBody;
    if (!body.nombre || typeof body.nombre !== "string" || body.nombre.trim().length < 3) {
      return new Response(JSON.stringify({ error: "Campo 'nombre' es obligatorio (min 3 caracteres)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const nombre = body.nombre.trim();
    const territorio = body.territorio?.trim() || "Michoacán";
    const partido = body.partido?.trim();
    const cargo = body.cargo_buscado?.trim();

    // ============ 1. BÚSQUEDAS MÚLTIPLES (deep search) ============
    const fuentesTexto: { url: string; titulo?: string; markdown: string; tipo: Tipo }[] = [];
    const fuentesConsultadas: ResponseBody["fuentes_consultadas"] = [];
    const urlsVistas = new Set<string>();

    function registrar(hit: SearchHit, tipoForzado?: Tipo, maxLen = 7000) {
      if (!hit.url || urlsVistas.has(hit.url)) return;
      urlsVistas.add(hit.url);
      const tipo = tipoForzado ?? clasificarFuente(hit.url);
      fuentesConsultadas.push({ url: hit.url, titulo: hit.title, tipo });
      if (hit.markdown && hit.markdown.length > 200) {
        fuentesTexto.push({ url: hit.url, titulo: hit.title, markdown: hit.markdown.slice(0, maxLen), tipo });
      }
    }

    // Queries en orden de prioridad — todas se intentan, fallos se acumulan en errores
    const queries: { q: string; limit: number; etiqueta: string }[] = [
      { q: `"${nombre}" Michoacán político site:wikipedia.org`, limit: 3, etiqueta: "wiki-es" },
      { q: `"${nombre}" Michoacán politician site:en.wikipedia.org`, limit: 2, etiqueta: "wiki-en" },
      { q: `"${nombre}" ${partido ?? ""} ${cargo ?? ""} Michoacán`, limit: 5, etiqueta: "general" },
      { q: `"${nombre}" Michoacán (site:gob.mx OR site:iem.org.mx OR site:congresomich.gob.mx)`, limit: 5, etiqueta: "oficial-iem" },
      { q: `"${nombre}" Michoacán (site:milenio.com OR site:eluniversal.com.mx OR site:quadratin.com.mx OR site:contramuro.com OR site:changoonga.com)`, limit: 4, etiqueta: "prensa" },
    ];

    if (cargo && territorio) {
      queries.push({ q: `"${nombre}" ${cargo} ${territorio} elección`, limit: 3, etiqueta: "cargo-territorio" });
    }

    for (const { q, limit, etiqueta } of queries) {
      try {
        const hits = await firecrawlSearch(q, limit);
        if (hits.length === 0) {
          notas.push(`Sin resultados para query "${etiqueta}".`);
          continue;
        }
        for (const h of hits) registrar(h);
      } catch (e) {
        errores.push(`Search "${etiqueta}": ${e instanceof Error ? e.message : "error"}`);
      }
    }

    // FALLBACK: si Wikipedia no devolvió markdown, intenta scrape directo
    const wikiSinTexto = fuentesConsultadas.filter((f) => f.tipo === "wikipedia" && !fuentesTexto.some((t) => t.url === f.url));
    for (const w of wikiSinTexto.slice(0, 2)) {
      try {
        const scraped = await firecrawlScrape(w.url, { onlyMainContent: true });
        if (scraped.markdown && scraped.markdown.length > 200) {
          fuentesTexto.push({
            url: w.url,
            titulo: scraped.metadata?.title ?? w.titulo,
            markdown: scraped.markdown.slice(0, 8000),
            tipo: "wikipedia",
          });
        }
      } catch (e) {
        errores.push(`Wiki scrape ${w.url}: ${e instanceof Error ? e.message : "error"}`);
      }
    }

    // FALLBACK extra: scrape directo de Wikipedia ES por URL canónica si nada apareció
    if (!fuentesTexto.some((f) => f.tipo === "wikipedia")) {
      const slug = nombre.replace(/\s+/g, "_");
      const wikiUrls = [
        `https://es.wikipedia.org/wiki/${encodeURIComponent(slug)}`,
        `https://en.wikipedia.org/wiki/${encodeURIComponent(slug)}`,
      ];
      for (const url of wikiUrls) {
        if (urlsVistas.has(url)) continue;
        try {
          const scraped = await firecrawlScrape(url, { onlyMainContent: true });
          if (scraped.markdown && scraped.markdown.length > 300 && !/no existe|does not exist/i.test(scraped.markdown.slice(0, 500))) {
            urlsVistas.add(url);
            fuentesConsultadas.push({ url, titulo: scraped.metadata?.title, tipo: "wikipedia" });
            fuentesTexto.push({ url, titulo: scraped.metadata?.title, markdown: scraped.markdown.slice(0, 8000), tipo: "wikipedia" });
            break;
          }
        } catch (_e) {
          // silencio: es un fallback opcional
        }
      }
    }

    // ============ 2. NORMALIZAR TRAYECTORIA CON LLM ============
    let trayectoriaPropuesta: PropuestaTrayectoria[] = [];
    if (fuentesTexto.length === 0) {
      notas.push(`No se encontró información biográfica pública sobre "${nombre}". Verifica el nombre exacto o captura la trayectoria manualmente. Fuentes intentadas: ${fuentesConsultadas.length}.`);
    } else {
      try {
        const userPrompt = `Candidato: ${nombre}${partido ? ` (${partido})` : ""}.
Cargo buscado: ${cargo ?? "no especificado"}.
Territorio: ${territorio}.

Fuentes disponibles (${fuentesTexto.length}):
${fuentesTexto.map((f, i) => `\n--- FUENTE ${i + 1} (${f.tipo}) ---\nURL: ${f.url}\nTítulo: ${f.titulo ?? "?"}\n\n${f.markdown}`).join("\n")}

Extrae TODOS los hitos políticos verificables como JSON:
{ "hitos": [{ "anio": number, "cargo": string, "partido": string|null, "tipo": "electo"|"designado"|"candidatura"|"cambio_partido"|"dirigencia"|"otro", "descripcion": string|null, "fuentes": string[], "confianza": "alta"|"media"|"baja" }], "notas": string[] }`;

        const out = (await llamarLLM(TRAY_SYSTEM, userPrompt)) as { hitos?: PropuestaTrayectoria[]; notas?: string[] };
        trayectoriaPropuesta = (out.hitos ?? []).filter((h) => h.anio && h.cargo);
        if (out.notas) notas.push(...out.notas);
        if (trayectoriaPropuesta.length === 0) {
          notas.push(`Se encontraron ${fuentesTexto.length} fuentes pero el LLM no extrajo hitos verificables. Posiblemente el nombre coincide con otra persona o no es figura pública conocida.`);
        }
      } catch (e) {
        errores.push(`Normalización trayectoria: ${e instanceof Error ? e.message : "error"}`);
      }
    }

    // ============ 3. MÉTRICAS DE REDES ============
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
        if (!urlsVistas.has(url)) {
          urlsVistas.add(url);
          fuentesConsultadas.push({ url, titulo: scraped.metadata?.title, tipo: "red_social" });
        }
        if (scraped.markdown && scraped.markdown.length > 100) {
          metricasFuentes.push({ plataforma: plat as PropuestaMetrica["plataforma"], url, markdown: scraped.markdown.slice(0, 5000) });
        } else {
          notas.push(`${plat}: la página devolvió contenido vacío o muy corto (posible muro de login).`);
        }
      } catch (e) {
        errores.push(`Scrape ${plat}: ${e instanceof Error ? e.message : "error"}`);
      }
    }

    // ============ 4. NORMALIZAR MÉTRICAS CON LLM ============
    let metricasPropuesta: PropuestaMetrica[] = [];
    if (metricasFuentes.length === 0) {
      if (Object.values(platMap).every((v) => !v)) {
        notas.push("Captura las URLs de redes sociales del candidato para precargar métricas automáticamente.");
      }
    } else {
      try {
        const userPrompt = `Candidato: ${nombre}.
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

    // Resumen al final
    notas.unshift(`Resumen: ${fuentesConsultadas.length} URLs consultadas, ${fuentesTexto.length} con contenido, ${trayectoriaPropuesta.length} hitos extraídos, ${metricasPropuesta.length} métricas.`);

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
    // Aún en error fatal, devolvemos 200 con estructura vacía + descripción del error,
    // para que la UI siempre pueda mostrarlo sin lanzar toast destructivo genérico.
    const fatal = err instanceof Error ? err.message : "Error desconocido";
    return new Response(
      JSON.stringify({
        trayectoria_propuesta: [],
        metricas_propuesta: [],
        fuentes_consultadas: [],
        notas,
        errores: [...errores, `Fallo fatal: ${fatal}`],
      } satisfies ResponseBody),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

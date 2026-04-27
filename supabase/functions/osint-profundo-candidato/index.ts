// Edge function: OSINT Profundo de candidato vía Perplexity.
// Diseñada para candidatos con presencia digital nula: rastrea huella en
// medios mexicanos (especialmente michoacanos), registros públicos y
// menciones recientes; devuelve dossier estructurado con citas y enlaces.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CandidatoIn {
  nombre: string;
  partido?: string;
  nivel?: string;
  territorio?: string;
  cargo_buscado?: string;
  bio_breve?: string;
  alias?: string[]; // apodos / nombres alternativos
}

interface DossierFuente {
  url: string;
  titulo?: string;
  fecha?: string;
  medio?: string;
}

interface DossierItem {
  resumen: string;
  fuentes: number[]; // índices a `citas[]`
}

interface DossierOSINT {
  resumen_ejecutivo: string;
  cargos_publicos_detectados: DossierItem[];
  menciones_prensa: DossierItem[];
  controversias_y_riesgos: { tema: string; gravedad: "alta" | "media" | "baja"; descripcion: string; fuentes: number[] }[];
  red_de_relaciones: DossierItem[];
  actividad_territorial: DossierItem[];
  vacios_informacion: string[];
  recomendaciones_busqueda_adicional: string[];
  citas: DossierFuente[];
}

const MEDIOS_MICHOACAN = [
  "cambiodemichoacan.com.mx",
  "quadratin.com.mx",
  "lavozdemichoacan.com.mx",
  "provincia.com.mx",
  "respuesta.com.mx",
  "mimorelia.com",
  "contramuro.com",
  "monitorexpresso.com",
  "atiempo.mx",
  "changoonga.com",
  "indiciopolitico.com",
  "revolucion3-0.mx",
  "elsoldemorelia.com.mx",
  "elsoldezamora.com.mx",
  "milenio.com",
  "eluniversal.com.mx",
  "jornada.com.mx",
  "proceso.com.mx",
  "animalpolitico.com",
  "expansion.mx",
  "infobae.com",
  "periodicooficial.michoacan.gob.mx",
  "iem.org.mx",
  "ine.mx",
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");
    if (!PERPLEXITY_API_KEY) {
      return new Response(JSON.stringify({ error: "PERPLEXITY_API_KEY no configurado" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json()) as { candidato?: CandidatoIn };
    const c = body.candidato;
    if (!c?.nombre) {
      return new Response(JSON.stringify({ error: "Falta candidato.nombre" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aliasFrag = c.alias?.length ? ` También conocido como: ${c.alias.join(", ")}.` : "";
    const territorioFrag = c.territorio ? ` Territorio: ${c.territorio}.` : "";
    const partidoFrag = c.partido ? ` Partido: ${c.partido}.` : "";
    const cargoFrag = c.cargo_buscado ? ` Cargo buscado: ${c.cargo_buscado}.` : "";
    const bioFrag = c.bio_breve ? ` Información previa: ${c.bio_breve}.` : "";

    const userPrompt = `Realiza un dossier OSINT profundo del siguiente perfil político mexicano, priorizando fuentes oficiales y prensa local de Michoacán.

Sujeto: ${c.nombre}.${aliasFrag}${partidoFrag}${territorioFrag}${cargoFrag}${bioFrag}

Investiga y reporta:
1. Cargos públicos, designaciones y candidaturas previas (con año y nivel).
2. Menciones en prensa michoacana y nacional de los últimos 5 años.
3. Controversias, denuncias, sanciones, observaciones de transparencia o vínculos con empresas con sanción del SAT.
4. Red de relaciones políticas (aliados públicos, padrinos, equipos de los que ha formado parte).
5. Actividad territorial detectable (eventos, recorridos, presencia en municipios específicos).
6. Vacíos de información donde el rastro digital es nulo o sospechosamente limpio.
7. Recomendaciones concretas de líneas de búsqueda adicional offline.

Devuelve EXCLUSIVAMENTE un JSON válido con esta forma exacta:
{
  "resumen_ejecutivo": "...",
  "cargos_publicos_detectados": [{"resumen": "...", "fuentes": [0,1]}],
  "menciones_prensa": [{"resumen": "...", "fuentes": [2]}],
  "controversias_y_riesgos": [{"tema": "...", "gravedad": "alta|media|baja", "descripcion": "...", "fuentes": [3]}],
  "red_de_relaciones": [{"resumen": "...", "fuentes": [4]}],
  "actividad_territorial": [{"resumen": "...", "fuentes": [5]}],
  "vacios_informacion": ["..."],
  "recomendaciones_busqueda_adicional": ["..."],
  "citas": [{"url": "https://...", "titulo": "...", "fecha": "YYYY-MM-DD", "medio": "..."}]
}

Reglas estrictas:
- Cada índice en "fuentes" DEBE corresponder a una entrada en "citas".
- Si no hay información para un campo, devuelve [] o "" (no inventes).
- Sé conservador: si una afirmación no tiene fuente verificable, NO la incluyas.
- Prioriza prensa michoacana, periódicos oficiales y registros del INE/IEM.`;

    const t0 = Date.now();
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
            content: "Eres un analista OSINT especializado en política mexicana. Devuelves SIEMPRE JSON válido y solo afirmas hechos con fuente verificable. No inventas datos.",
          },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.1,
        search_domain_filter: MEDIOS_MICHOACAN,
        search_recency_filter: "year",
        return_citations: true,
      }),
    });

    if (!ppxRes.ok) {
      const errText = await ppxRes.text();
      return new Response(JSON.stringify({ error: `Perplexity ${ppxRes.status}: ${errText.slice(0, 500)}` }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ppxData = await ppxRes.json() as {
      choices?: { message?: { content?: string } }[];
      citations?: string[];
    };
    const raw = ppxData.choices?.[0]?.message?.content ?? "";
    const ppxCitas: string[] = ppxData.citations ?? [];

    // Extraer JSON (el modelo a veces lo envuelve en ```json)
    let jsonStr = raw.trim();
    const fence = jsonStr.match(/```json\s*([\s\S]*?)```/);
    if (fence) jsonStr = fence[1].trim();
    else {
      const firstBrace = jsonStr.indexOf("{");
      const lastBrace = jsonStr.lastIndexOf("}");
      if (firstBrace >= 0 && lastBrace > firstBrace) {
        jsonStr = jsonStr.slice(firstBrace, lastBrace + 1);
      }
    }

    let dossier: DossierOSINT;
    try {
      dossier = JSON.parse(jsonStr) as DossierOSINT;
    } catch (parseErr) {
      console.error("Error parseando JSON Perplexity:", parseErr, "raw:", raw.slice(0, 1000));
      return new Response(JSON.stringify({ error: "Respuesta IA no parseable como JSON", raw: raw.slice(0, 2000) }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fusionar/garantizar citas: si Perplexity devolvió citas adicionales no
    // referenciadas por el modelo en `citas`, las anexamos para que el frontend
    // pueda mostrarlas como fuentes complementarias.
    const citasFinales: DossierFuente[] = Array.isArray(dossier.citas) ? [...dossier.citas] : [];
    const urlsExistentes = new Set(citasFinales.map((c) => c.url));
    for (const url of ppxCitas) {
      if (url && !urlsExistentes.has(url)) {
        citasFinales.push({ url });
        urlsExistentes.add(url);
      }
    }
    dossier.citas = citasFinales;

    return new Response(
      JSON.stringify({
        output: dossier,
        model: "perplexity/sonar-pro",
        duracion_ms: Date.now() - t0,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error desconocido";
    console.error("osint-profundo-candidato error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

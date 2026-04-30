// Edge function: ingest-historico-iem
// Para cada municipio de Michoacán + año (2015, 2018, 2021), pregunta a Perplexity
// (con dominio restringido a iem.org.mx, wikipedia.org y ieepco.gob.mx)
// el ganador y % de la elección de ayuntamiento, y lo persiste en historico_municipios.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const ANIOS = [2015, 2018, 2021] as const;

interface RespEsperada {
  partido_ganador: string | null;
  candidato_ganador: string | null;
  pct_ganador: number | null;
  partido_segundo: string | null;
  pct_segundo: number | null;
  participacion_pct: number | null;
  notas: string | null;
}

async function consultarPerplexity(
  municipio: string,
  anio: number,
): Promise<{ datos: RespEsperada; citas: string[] } | { error: string }> {
  if (!PERPLEXITY_API_KEY) return { error: "PERPLEXITY_API_KEY no configurada" };

  const prompt = `Para la elección de ayuntamiento (presidencia municipal) del municipio de ${municipio}, Michoacán, México, en el año ${anio}, dame:
- partido_ganador (siglas: MORENA, PAN, PRI, PRD, PT, PVEM, MC, FXM, PES, RSP, NA, INDEPENDIENTE u OTRO)
- candidato_ganador (nombre completo si es conocido, si no null)
- pct_ganador (porcentaje del voto válido, número entre 0-100, sin signo %)
- partido_segundo (siglas igual que arriba)
- pct_segundo (porcentaje del segundo lugar)
- participacion_pct (porcentaje de participación electoral, lista nominal)
- notas (observaciones breves sobre coalición, anulación, recuento, etc., o null)

Si no encuentras dato confiable, devuelve null en ese campo. NO inventes números.
Fuentes preferentes: IEM Michoacán (cómputos), Wikipedia (Elecciones en Michoacán de ${anio}).`;

  const body = {
    model: "sonar",
    messages: [
      {
        role: "system",
        content:
          "Eres asistente de datos electorales. Responde SOLO con datos verificables del IEM Michoacán o Wikipedia. Devuelve null si no hay fuente clara. Nunca inventes porcentajes.",
      },
      { role: "user", content: prompt },
    ],
    search_domain_filter: ["iem.org.mx", "wikipedia.org", "ieepco.gob.mx"],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "resultado_municipal",
        schema: {
          type: "object",
          properties: {
            partido_ganador: { type: ["string", "null"] },
            candidato_ganador: { type: ["string", "null"] },
            pct_ganador: { type: ["number", "null"] },
            partido_segundo: { type: ["string", "null"] },
            pct_segundo: { type: ["number", "null"] },
            participacion_pct: { type: ["number", "null"] },
            notas: { type: ["string", "null"] },
          },
          required: [
            "partido_ganador",
            "candidato_ganador",
            "pct_ganador",
            "partido_segundo",
            "pct_segundo",
            "participacion_pct",
            "notas",
          ],
          additionalProperties: false,
        },
      },
    },
  };

  try {
    const resp = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    if (!resp.ok) {
      const t = await resp.text();
      return { error: `Perplexity ${resp.status}: ${t.slice(0, 200)}` };
    }
    const data = await resp.json();
    const contenido = data?.choices?.[0]?.message?.content;
    const citas: string[] = Array.isArray(data?.citations) ? data.citations : [];
    if (!contenido) return { error: "Sin contenido en respuesta" };
    const parsed = JSON.parse(contenido) as RespEsperada;
    return { datos: parsed, citas };
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
}

interface ReqBody {
  municipios?: Array<{ clave: number; nombre: string }>;
  anios?: number[];
  /** Si true, solo procesa municipios+años que aún no están en la tabla. */
  solo_faltantes?: boolean;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const t0 = Date.now();
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const body = (await req.json().catch(() => ({}))) as ReqBody;
    const municipios = body.municipios ?? [];
    const aniosUsar = body.anios && body.anios.length > 0 ? body.anios : [...ANIOS];

    if (!municipios.length) {
      return new Response(JSON.stringify({ error: "Falta lista de municipios" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Si solo_faltantes, leer claves+años ya presentes
    let yaCargados = new Set<string>();
    if (body.solo_faltantes) {
      const { data: existentes } = await supabase
        .from("historico_municipios")
        .select("municipio_clave, anio")
        .in(
          "municipio_clave",
          municipios.map((m) => m.clave),
        );
      yaCargados = new Set(
        (existentes ?? []).map((r: any) => `${r.municipio_clave}|${r.anio}`),
      );
    }

    const detalle: any[] = [];
    let exitosos = 0;
    let fallidos = 0;

    for (const muni of municipios) {
      for (const anio of aniosUsar) {
        const k = `${muni.clave}|${anio}`;
        if (yaCargados.has(k)) {
          detalle.push({ municipio: muni.nombre, anio, status: "skip-existente" });
          continue;
        }

        const r = await consultarPerplexity(muni.nombre, anio);
        if ("error" in r) {
          fallidos++;
          detalle.push({ municipio: muni.nombre, anio, status: "error", error: r.error });
          continue;
        }

        const partidoG = r.datos.partido_ganador?.trim().toUpperCase() ?? null;
        if (!partidoG && r.datos.pct_ganador == null) {
          fallidos++;
          detalle.push({ municipio: muni.nombre, anio, status: "sin-datos" });
          continue;
        }

        const { error: insErr } = await supabase
          .from("historico_municipios")
          .upsert(
            {
              municipio_clave: muni.clave,
              municipio_nombre: muni.nombre,
              anio,
              partido_ganador: partidoG,
              candidato_ganador: r.datos.candidato_ganador,
              pct_ganador: r.datos.pct_ganador,
              partido_segundo: r.datos.partido_segundo?.trim().toUpperCase() ?? null,
              pct_segundo: r.datos.pct_segundo,
              participacion_pct: r.datos.participacion_pct,
              fuente: "perplexity",
              fuente_urls: r.citas.slice(0, 5),
              notas: r.datos.notas,
              ingerido_en: new Date().toISOString(),
            },
            { onConflict: "municipio_clave,anio" },
          );
        if (insErr) {
          fallidos++;
          detalle.push({ municipio: muni.nombre, anio, status: "db-error", error: insErr.message });
        } else {
          exitosos++;
          detalle.push({
            municipio: muni.nombre,
            anio,
            status: "ok",
            partido: partidoG,
            pct: r.datos.pct_ganador,
          });
        }

        // Pequeña pausa para no saturar Perplexity.
        await new Promise((res) => setTimeout(res, 250));
      }
    }

    const duracion = Date.now() - t0;
    await supabase.from("historico_municipios_runs").insert({
      total_solicitados: municipios.length * aniosUsar.length,
      total_exitosos: exitosos,
      total_fallidos: fallidos,
      duracion_ms: duracion,
      trigger: "manual",
      detalle,
    });

    return new Response(
      JSON.stringify({
        ok: true,
        exitosos,
        fallidos,
        duracion_ms: duracion,
        detalle: detalle.slice(0, 30),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await supabase.from("historico_municipios_runs").insert({
      trigger: "manual",
      error: msg,
      duracion_ms: Date.now() - t0,
    });
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

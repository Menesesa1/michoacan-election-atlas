// Clasifica menciones de un candidato como rol "candidato" vs "funcionario"
// usando Lovable AI Gateway. Cachea resultado en mencion_rol_clasificacion.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const MODEL = "google/gemini-3-flash-preview";

interface MencionInput {
  id: string;
  titulo: string;
  fragmento?: string | null;
  tema?: string | null;
}

async function clasificarLote(
  candidatoNombre: string,
  cargoActual: string | null,
  menciones: MencionInput[],
): Promise<Record<string, { rol: string; confianza: number; razonamiento: string }>> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY no configurada");

  const sys = `Clasificas menciones públicas sobre figuras políticas mexicanas. Para cada mención determinas si la nota habla de la persona en su rol de CANDIDATO (campaña, propuestas electorales, actos proselitistas, partido, contienda) o en su rol de FUNCIONARIO público (gestión, obra, presupuesto, sesiones, declaraciones institucionales, decisiones de gobierno). Si claramente combina ambos, devuelve "ambos". Si no se puede determinar, "indefinido". Sé estricto: temas de campaña → candidato; gestión institucional → funcionario.`;

  const user = `Persona: ${candidatoNombre}${cargoActual ? ` (cargo actual: ${cargoActual})` : ""}\n\nMenciones:\n${menciones
    .map(
      (m, i) =>
        `[${i}] id=${m.id} | título: ${m.titulo}${m.tema ? ` | tema: ${m.tema}` : ""}${m.fragmento ? ` | fragmento: ${m.fragmento.slice(0, 240)}` : ""}`,
    )
    .join("\n")}`;

  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: sys },
        { role: "user", content: user },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "clasificar_menciones",
            description: "Devuelve clasificación rol por mención",
            parameters: {
              type: "object",
              properties: {
                resultados: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: { type: "string" },
                      rol: {
                        type: "string",
                        enum: ["candidato", "funcionario", "ambos", "indefinido"],
                      },
                      confianza: { type: "number", minimum: 0, maximum: 1 },
                      razonamiento: { type: "string" },
                    },
                    required: ["id", "rol", "confianza", "razonamiento"],
                  },
                },
              },
              required: ["resultados"],
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "clasificar_menciones" } },
    }),
  });

  if (!resp.ok) {
    const t = await resp.text();
    throw new Error(`AI gateway ${resp.status}: ${t}`);
  }
  const data = await resp.json();
  const args = data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
  if (!args) throw new Error("Respuesta IA sin tool_calls");
  const parsed = JSON.parse(args);
  const map: Record<string, any> = {};
  for (const r of parsed.resultados ?? []) {
    map[r.id] = { rol: r.rol, confianza: r.confianza, razonamiento: r.razonamiento };
  }
  return map;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { candidato_id, desde, hasta } = await req.json();
    if (!candidato_id) {
      return new Response(JSON.stringify({ error: "candidato_id requerido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: cand, error: errCand } = await supabase
      .from("candidatos")
      .select("nombre, cargo_publico_actual, es_funcionario_publico")
      .eq("id", candidato_id)
      .maybeSingle();
    if (errCand || !cand) throw new Error("Candidato no encontrado");

    let q = supabase
      .from("social_menciones")
      .select("id, titulo, fragmento, tema, detectada_en")
      .eq("candidato_id", candidato_id)
      .order("detectada_en", { ascending: false })
      .limit(500);
    if (desde) q = q.gte("detectada_en", desde);
    if (hasta) q = q.lte("detectada_en", hasta);
    const { data: menciones, error: errMen } = await q;
    if (errMen) throw errMen;
    const todas = menciones ?? [];

    if (todas.length === 0) {
      return new Response(
        JSON.stringify({ total: 0, nuevas: 0, clasificaciones: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Filtra ya clasificadas
    const ids = todas.map((m: any) => m.id);
    const { data: cacheada } = await supabase
      .from("mencion_rol_clasificacion")
      .select("mencion_id")
      .eq("candidato_id", candidato_id)
      .in("mencion_id", ids);
    const yaClasificadas = new Set((cacheada ?? []).map((c: any) => c.mencion_id));
    const pendientes = todas.filter((m: any) => !yaClasificadas.has(m.id));

    let nuevas = 0;
    const BATCH = 25;
    for (let i = 0; i < pendientes.length; i += BATCH) {
      const lote = pendientes.slice(i, i + BATCH);
      const map = await clasificarLote(cand.nombre, cand.cargo_publico_actual, lote);
      const inserts = Object.entries(map).map(([mid, v]: any) => ({
        mencion_id: mid,
        candidato_id,
        rol: v.rol,
        confianza: v.confianza,
        razonamiento: v.razonamiento,
        modelo: MODEL,
      }));
      if (inserts.length) {
        const { error: errIns } = await supabase
          .from("mencion_rol_clasificacion")
          .upsert(inserts, { onConflict: "mencion_id,candidato_id" });
        if (errIns) console.error("Insert error", errIns);
        else nuevas += inserts.length;
      }
    }

    // Devuelve todas las clasificaciones del rango
    const { data: todasCls } = await supabase
      .from("mencion_rol_clasificacion")
      .select("mencion_id, rol, confianza")
      .eq("candidato_id", candidato_id)
      .in("mencion_id", ids);

    return new Response(
      JSON.stringify({
        total: todas.length,
        nuevas,
        clasificaciones: todasCls ?? [],
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e: any) {
    console.error(e);
    return new Response(JSON.stringify({ error: e?.message ?? "error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

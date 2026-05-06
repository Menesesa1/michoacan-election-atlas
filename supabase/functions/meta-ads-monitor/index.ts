// Meta Ad Library monitor: busca anuncios políticos en MX por nombre de candidato.
// API: https://graph.facebook.com/v20.0/ads_archive
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const META_TOKEN = Deno.env.get("META_ACCESS_TOKEN")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const FIELDS = [
  "id",
  "ad_creation_time",
  "ad_creative_bodies",
  "ad_creative_link_captions",
  "ad_creative_link_titles",
  "ad_creative_link_descriptions",
  "ad_delivery_start_time",
  "ad_delivery_stop_time",
  "ad_snapshot_url",
  "page_id",
  "page_name",
  "publisher_platforms",
  "languages",
  "spend",
  "impressions",
  "currency",
  "demographic_distribution",
  "delivery_by_region",
].join(",");

interface AdRaw {
  id: string;
  page_id?: string;
  page_name?: string;
  ad_creative_bodies?: string[];
  ad_creative_link_captions?: string[];
  ad_creative_link_titles?: string[];
  ad_creative_link_descriptions?: string[];
  ad_snapshot_url?: string;
  ad_delivery_start_time?: string;
  ad_delivery_stop_time?: string;
  spend?: { lower_bound?: string; upper_bound?: string };
  impressions?: { lower_bound?: string; upper_bound?: string };
  currency?: string;
  publisher_platforms?: string[];
  languages?: string[];
  demographic_distribution?: unknown;
  delivery_by_region?: unknown;
}

async function fetchAdsForTerm(term: string, limit = 50): Promise<AdRaw[]> {
  const url = new URL("https://graph.facebook.com/v20.0/ads_archive");
  url.searchParams.set("access_token", META_TOKEN);
  url.searchParams.set("ad_type", "POLITICAL_AND_ISSUE_ADS");
  url.searchParams.set("ad_reached_countries", "['MX']");
  url.searchParams.set("ad_active_status", "ALL");
  url.searchParams.set("search_terms", term);
  url.searchParams.set("fields", FIELDS);
  url.searchParams.set("limit", String(limit));

  const res = await fetch(url.toString());
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Meta API ${res.status}: ${text.slice(0, 300)}`);
  }
  const json = await res.json();
  return (json.data ?? []) as AdRaw[];
}

function num(v: string | undefined): number | null {
  if (v === undefined || v === null || v === "") return null;
  const n = Number(v);
  return isFinite(n) ? n : null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const t0 = Date.now();
  const sb = createClient(SUPABASE_URL, SERVICE_KEY);
  let candidatos_procesados = 0;
  let ads_encontrados = 0;
  let ads_nuevos = 0;
  const detalle: Record<string, { found: number; new: number; error?: string }> = {};

  try {
    if (!META_TOKEN) throw new Error("META_ACCESS_TOKEN no configurado");
    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const trigger = body.trigger ?? (req.method === "POST" ? "manual" : "cron");
    const candidatoId: string | undefined = body.candidato_id;

    let q = sb.from("candidatos").select("id, nombre");
    if (candidatoId) q = q.eq("id", candidatoId);
    const { data: candidatos, error: candErr } = await q;
    if (candErr) throw candErr;

    for (const c of candidatos ?? []) {
      candidatos_procesados++;
      try {
        const ads = await fetchAdsForTerm(c.nombre, 50);
        detalle[c.nombre] = { found: ads.length, new: 0 };
        ads_encontrados += ads.length;

        if (ads.length === 0) continue;

        const rows = ads.map((a) => ({
          candidato_id: c.id,
          ad_archive_id: a.id,
          page_id: a.page_id ?? null,
          page_name: a.page_name ?? null,
          ad_creative_body: (a.ad_creative_bodies ?? [])[0] ?? null,
          ad_creative_link_caption: (a.ad_creative_link_captions ?? [])[0] ?? null,
          ad_creative_link_title: (a.ad_creative_link_titles ?? [])[0] ?? null,
          ad_creative_link_description: (a.ad_creative_link_descriptions ?? [])[0] ?? null,
          ad_snapshot_url: a.ad_snapshot_url ?? null,
          ad_delivery_start_time: a.ad_delivery_start_time ?? null,
          ad_delivery_stop_time: a.ad_delivery_stop_time ?? null,
          spend_lower: num(a.spend?.lower_bound),
          spend_upper: num(a.spend?.upper_bound),
          currency: a.currency ?? null,
          impressions_lower: num(a.impressions?.lower_bound),
          impressions_upper: num(a.impressions?.upper_bound),
          publisher_platforms: a.publisher_platforms ?? null,
          languages: a.languages ?? null,
          demographic_distribution: a.demographic_distribution ?? [],
          region_distribution: a.delivery_by_region ?? [],
          raw: a,
        }));

        const { data: inserted, error: insErr } = await sb
          .from("meta_ads")
          .upsert(rows, { onConflict: "candidato_id,ad_archive_id", ignoreDuplicates: true })
          .select("id");
        if (insErr) {
          detalle[c.nombre].error = insErr.message;
        } else {
          const n = inserted?.length ?? 0;
          detalle[c.nombre].new = n;
          ads_nuevos += n;
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error(`[meta-ads] error ${c.nombre}:`, msg);
        detalle[c.nombre] = { found: 0, new: 0, error: msg };
      }
    }

    await sb.from("meta_ads_runs").insert({
      trigger,
      candidatos_procesados,
      ads_encontrados,
      ads_nuevos,
      duracion_ms: Date.now() - t0,
      detalle,
    });

    return new Response(
      JSON.stringify({ ok: true, candidatos_procesados, ads_encontrados, ads_nuevos, detalle }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[meta-ads] fatal:", msg);
    await sb.from("meta_ads_runs").insert({
      trigger: "error",
      candidatos_procesados,
      ads_encontrados,
      ads_nuevos,
      duracion_ms: Date.now() - t0,
      error: msg,
      detalle,
    });
    return new Response(JSON.stringify({ ok: false, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

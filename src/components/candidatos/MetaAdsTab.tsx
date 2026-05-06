import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Megaphone, RefreshCw, ExternalLink, DollarSign, Eye, Calendar } from "lucide-react";
import { toast } from "sonner";
import type { Candidato } from "@/lib/candidatos/types";

interface MetaAd {
  id: string;
  ad_archive_id: string;
  page_name: string | null;
  ad_creative_body: string | null;
  ad_snapshot_url: string | null;
  ad_delivery_start_time: string | null;
  ad_delivery_stop_time: string | null;
  spend_lower: number | null;
  spend_upper: number | null;
  currency: string | null;
  impressions_lower: number | null;
  impressions_upper: number | null;
  publisher_platforms: string[] | null;
  detectado_en: string;
}

const fmt = (n: number | null) => (n == null ? "—" : n.toLocaleString("es-MX"));
const range = (lo: number | null, up: number | null, prefix = "") =>
  lo == null && up == null ? "—" : `${prefix}${fmt(lo)} – ${prefix}${fmt(up)}`;
const fecha = (s: string | null) =>
  s ? new Date(s).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" }) : "—";

export function MetaAdsTab({ candidato }: { candidato: Candidato }) {
  const [ads, setAds] = useState<MetaAd[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const cargar = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("meta_ads")
      .select(
        "id, ad_archive_id, page_name, ad_creative_body, ad_snapshot_url, ad_delivery_start_time, ad_delivery_stop_time, spend_lower, spend_upper, currency, impressions_lower, impressions_upper, publisher_platforms, detectado_en",
      )
      .eq("candidato_id", candidato.id)
      .order("ad_delivery_start_time", { ascending: false, nullsFirst: false })
      .limit(100);
    if (error) toast.error("Error al cargar Meta Ads", { description: error.message });
    setAds((data ?? []) as MetaAd[]);
    setLoading(false);
  }, [candidato.id]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const refrescar = async () => {
    setRefreshing(true);
    try {
      const { data, error } = await supabase.functions.invoke("meta-ads-monitor", {
        body: { trigger: "manual", candidato_id: candidato.id },
      });
      if (error) throw error;
      const r = data as { ads_encontrados?: number; ads_nuevos?: number };
      toast.success(`Meta Ads actualizado`, {
        description: `${r?.ads_encontrados ?? 0} encontrados · ${r?.ads_nuevos ?? 0} nuevos`,
      });
      await cargar();
    } catch (e) {
      toast.error("No se pudo consultar Meta Ad Library", {
        description: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setRefreshing(false);
    }
  };

  const totalSpendLow = ads.reduce((s, a) => s + (a.spend_lower ?? 0), 0);
  const totalSpendUp = ads.reduce((s, a) => s + (a.spend_upper ?? 0), 0);
  const totalImprLow = ads.reduce((s, a) => s + (a.impressions_lower ?? 0), 0);
  const totalImprUp = ads.reduce((s, a) => s + (a.impressions_upper ?? 0), 0);
  const activos = ads.filter((a) => !a.ad_delivery_stop_time).length;

  return (
    <div className="space-y-3 mt-3">
      <div className="flex items-start justify-between flex-wrap gap-2">
        <div>
          <h3 className="text-base font-bold flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-pink-400" />
            Meta Ad Library · Anuncios políticos
          </h3>
          <p className="text-[11px] text-muted-foreground font-mono">
            Búsqueda en Facebook + Instagram Ads en MX por nombre del candidato.
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={refrescar} disabled={refreshing}>
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${refreshing ? "animate-spin" : ""}`} />
          {refreshing ? "Consultando Meta…" : "Refrescar"}
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <Card className="p-3">
          <div className="text-[9px] uppercase text-muted-foreground">Total anuncios</div>
          <div className="font-mono text-2xl">{ads.length}</div>
        </Card>
        <Card className="p-3">
          <div className="text-[9px] uppercase text-muted-foreground">Activos</div>
          <div className="font-mono text-2xl text-emerald-400">{activos}</div>
        </Card>
        <Card className="p-3">
          <div className="text-[9px] uppercase text-muted-foreground flex items-center gap-1">
            <DollarSign className="w-3 h-3" /> Gasto estimado
          </div>
          <div className="font-mono text-sm">{range(totalSpendLow || null, totalSpendUp || null, "$")}</div>
        </Card>
        <Card className="p-3">
          <div className="text-[9px] uppercase text-muted-foreground flex items-center gap-1">
            <Eye className="w-3 h-3" /> Impresiones
          </div>
          <div className="font-mono text-sm">{range(totalImprLow || null, totalImprUp || null)}</div>
        </Card>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : ads.length === 0 ? (
        <Card className="p-6 text-center text-sm text-muted-foreground">
          Sin anuncios detectados. Pulsa <strong>Refrescar</strong> para consultar Meta Ad Library ahora.
        </Card>
      ) : (
        <div className="space-y-2">
          {ads.map((a) => (
            <Card key={a.id} className="p-3 space-y-2">
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div>
                  <div className="font-semibold text-sm">{a.page_name ?? "Página desconocida"}</div>
                  <div className="text-[10px] font-mono text-muted-foreground flex items-center gap-2 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {fecha(a.ad_delivery_start_time)} → {fecha(a.ad_delivery_stop_time)}
                    </span>
                    {!a.ad_delivery_stop_time && (
                      <Badge variant="default" className="text-[9px] bg-emerald-500/20 text-emerald-300">
                        Activo
                      </Badge>
                    )}
                    {(a.publisher_platforms ?? []).map((p) => (
                      <Badge key={p} variant="outline" className="text-[9px]">
                        {p}
                      </Badge>
                    ))}
                  </div>
                </div>
                {a.ad_snapshot_url && (
                  <a
                    href={a.ad_snapshot_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-primary inline-flex items-center gap-1 hover:underline"
                  >
                    Ver en Meta <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
              {a.ad_creative_body && (
                <p className="text-xs text-foreground/90 line-clamp-3 whitespace-pre-line">
                  {a.ad_creative_body}
                </p>
              )}
              <div className="flex items-center gap-3 text-[10px] font-mono text-muted-foreground">
                <span className="flex items-center gap-1">
                  <DollarSign className="w-3 h-3" />
                  {range(a.spend_lower, a.spend_upper, "$")} {a.currency ?? ""}
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  {range(a.impressions_lower, a.impressions_upper)} impr.
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

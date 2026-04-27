import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { TrendingUp, RefreshCw, ExternalLink, Sparkles, Search } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";

interface TrendRow {
  id: string;
  batch_id: string;
  tipo: string;
  termino: string;
  valor_interes: number | null;
  variacion_pct: number | null;
  serie_temporal: { fecha?: string; valor?: number | null }[] | null;
  related: { top?: { query: string; extracted_value?: number }[]; rising?: { query: string; extracted_value?: number }[] } | null;
  contexto_narrativo: string | null;
  citas: { url: string; medio?: string }[] | null;
  ejecutada_en: string;
}

export function TrendsEstatalPanel() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [batchId, setBatchId] = useState<string | null>(null);
  const [risings, setRisings] = useState<TrendRow[]>([]);
  const [series, setSeries] = useState<TrendRow[]>([]);
  const [contexto, setContexto] = useState<TrendRow | null>(null);
  const [ejecutadaEn, setEjecutadaEn] = useState<string | null>(null);

  const cargarUltimoBatch = async () => {
    setLoading(true);
    try {
      // Encontrar el batch más reciente
      const { data: ultimo } = await supabase
        .from("trends_estatal")
        .select("batch_id, ejecutada_en")
        .order("ejecutada_en", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!ultimo) {
        setBatchId(null);
        setRisings([]);
        setSeries([]);
        setContexto(null);
        return;
      }

      setBatchId(ultimo.batch_id);
      setEjecutadaEn(ultimo.ejecutada_en);

      const { data } = await supabase
        .from("trends_estatal")
        .select("*")
        .eq("batch_id", ultimo.batch_id);

      const rows = (data ?? []) as unknown as TrendRow[];
      setRisings(rows.filter((r) => r.tipo === "rising_searches"));
      setSeries(rows.filter((r) => r.tipo === "interest_over_time"));
      setContexto(rows.find((r) => r.tipo === "contexto_narrativo") ?? null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const ingestar = async () => {
    setRefreshing(true);
    try {
      const { data, error } = await supabase.functions.invoke("ingesta-google-trends", {
        body: { trigger: "manual" },
      });
      if (error) throw error;
      const payload = data as { ok?: boolean; error?: string; total_terminos?: number };
      if (!payload.ok) throw new Error(payload.error ?? "Falló la ingesta");
      toast({
        title: "Trends actualizado",
        description: `${payload.total_terminos ?? 0} términos analizados con contexto narrativo.`,
      });
      await cargarUltimoBatch();
    } catch (err) {
      toast({
        title: "Error en ingesta",
        description: err instanceof Error ? err.message : "Reintenta",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void cargarUltimoBatch();
  }, []);

  return (
    <Card className="p-4 bg-card/50 backdrop-blur border-border/50">
      <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Google Trends · Michoacán</h3>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Tendencias de búsqueda en MX-MIC vía SerpApi + análisis narrativo con citas a medios mexicanos.
          </p>
          {ejecutadaEn && (
            <p className="text-[10px] text-muted-foreground/70 mt-1">
              Última ingesta: {new Date(ejecutadaEn).toLocaleString("es-MX")}
            </p>
          )}
        </div>
        <Button size="sm" variant="outline" onClick={ingestar} disabled={refreshing}>
          {refreshing ? (
            <><RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />Ingestando…</>
          ) : (
            <><RefreshCw className="w-3.5 h-3.5 mr-1.5" />{batchId ? "Actualizar" : "Ejecutar ingesta"}</>
          )}
        </Button>
      </div>

      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : !batchId ? (
        <div className="p-6 text-center text-sm text-muted-foreground border border-dashed border-border rounded-md">
          <Search className="w-8 h-8 mx-auto mb-2 opacity-40" />
          Aún no hay datos ingestados. Pulsa "Ejecutar ingesta" para consultar Google Trends.
        </div>
      ) : (
        <div className="space-y-4">
          {/* Top tendencias */}
          {risings.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-foreground/80 uppercase tracking-wider mb-2">
                Tendencias en alza ({risings.length})
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {risings.slice(0, 20).map((r) => (
                  <Badge key={r.id} variant="secondary" className="text-xs">
                    {r.termino}
                    {r.variacion_pct ? (
                      <span className="ml-1.5 text-emerald-400">+{Math.round(r.variacion_pct)}%</span>
                    ) : null}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Series temporales */}
          {series.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-foreground/80 uppercase tracking-wider mb-2">
                Interés en el tiempo · top 5 (geo MX-MIC, últimos 3 meses)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {series.map((s) => {
                  const data = (s.serie_temporal ?? []).map((p) => ({
                    fecha: p.fecha,
                    valor: p.valor ?? 0,
                  }));
                  return (
                    <div key={s.id} className="p-2 rounded-md bg-background/40 border border-border/30">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-foreground truncate">{s.termino}</span>
                        {s.valor_interes !== null && (
                          <Badge variant="outline" className="text-[10px]">pico {s.valor_interes}</Badge>
                        )}
                      </div>
                      <ResponsiveContainer width="100%" height={80}>
                        <LineChart data={data}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                          <XAxis dataKey="fecha" hide />
                          <YAxis hide domain={[0, 100]} />
                          <Tooltip
                            contentStyle={{
                              background: "hsl(var(--popover))",
                              border: "1px solid hsl(var(--border))",
                              fontSize: 11,
                            }}
                          />
                          <Line type="monotone" dataKey="valor" stroke="hsl(var(--primary))" strokeWidth={1.5} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                      {(s.related?.rising ?? []).length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {(s.related?.rising ?? []).slice(0, 3).map((rq, i) => (
                            <span key={i} className="text-[10px] text-muted-foreground">↗ {rq.query}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Contexto narrativo */}
          {contexto?.contexto_narrativo && (
            <div className="p-3 rounded-md bg-primary/5 border border-primary/20">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-semibold text-foreground">Análisis narrativo</span>
              </div>
              <p className="text-xs text-foreground/90 whitespace-pre-wrap leading-relaxed">
                {contexto.contexto_narrativo}
              </p>
              {(contexto.citas ?? []).length > 0 && (
                <div className="mt-2 pt-2 border-t border-border/30">
                  <p className="text-[10px] text-muted-foreground mb-1">Fuentes:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(contexto.citas ?? []).slice(0, 12).map((c, i) => (
                      <a
                        key={i}
                        href={c.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline"
                      >
                        [{i + 1}] {c.medio ?? "fuente"} <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

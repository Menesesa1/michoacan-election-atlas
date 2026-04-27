import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, RefreshCw, ExternalLink, Sparkles } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import type { Candidato } from "@/lib/candidatos/types";

interface TrendCandidatoRow {
  id: string;
  candidato_id: string;
  termino: string;
  geo: string;
  rango_temporal: string;
  pico_interes: number | null;
  promedio_interes: number | null;
  serie_temporal: Array<Record<string, unknown>> | null;
  related_top: { query: string; extracted_value?: number }[] | null;
  related_rising: { query: string; extracted_value?: number }[] | null;
  contexto_narrativo: string | null;
  citas: { url: string; medio?: string }[] | null;
  ejecutada_en: string;
}

export function TrendsCandidatoTab({ candidato }: { candidato: Candidato }) {
  const { toast } = useToast();
  const [data, setData] = useState<TrendCandidatoRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const cargar = async () => {
    setLoading(true);
    try {
      const { data: rows } = await supabase
        .from("trends_candidato")
        .select("*")
        .eq("candidato_id", candidato.id)
        .order("ejecutada_en", { ascending: false })
        .limit(1)
        .maybeSingle();
      setData(rows as unknown as TrendCandidatoRow | null);
    } finally {
      setLoading(false);
    }
  };

  const ejecutar = async () => {
    setRefreshing(true);
    try {
      const { data: resp, error } = await supabase.functions.invoke("trends-candidato", {
        body: {
          candidato_id: candidato.id,
          nombre: candidato.nombre,
          partido: candidato.partido,
          territorio: candidato.territorio,
          rango: "today 12-m",
        },
      });
      if (error) throw error;
      const payload = resp as { ok?: boolean; error?: string };
      if (!payload.ok) throw new Error(payload.error ?? "Falló");
      toast({ title: "Trends consultado", description: "Datos de Google Trends + contexto actualizados." });
      await cargar();
    } catch (err) {
      toast({
        title: "Error consultando Trends",
        description: err instanceof Error ? err.message : "Reintenta",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candidato.id]);

  if (loading) {
    return (
      <div className="space-y-2 pt-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-3 pt-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            Google Trends · {candidato.nombre}
          </h3>
          {data && (
            <p className="text-[10px] text-muted-foreground">
              Última consulta: {new Date(data.ejecutada_en).toLocaleString("es-MX")} · geo {data.geo} · rango {data.rango_temporal}
            </p>
          )}
        </div>
        <Button size="sm" variant="outline" onClick={ejecutar} disabled={refreshing}>
          {refreshing ? (
            <><RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />Consultando…</>
          ) : (
            <><RefreshCw className="w-3.5 h-3.5 mr-1.5" />{data ? "Actualizar" : "Consultar Trends"}</>
          )}
        </Button>
      </div>

      {!data ? (
        <div className="p-6 text-center text-sm text-muted-foreground border border-dashed border-border rounded-md">
          Sin datos. Pulsa "Consultar Trends" para obtener interés histórico (12 meses) y contexto.
        </div>
      ) : (
        <>
          {/* Métricas */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            <div className="p-2 rounded-md bg-background/40 border border-border/30">
              <p className="text-[10px] text-muted-foreground uppercase">Pico de interés</p>
              <p className="text-lg font-bold text-primary">{data.pico_interes ?? 0}<span className="text-xs text-muted-foreground">/100</span></p>
            </div>
            <div className="p-2 rounded-md bg-background/40 border border-border/30">
              <p className="text-[10px] text-muted-foreground uppercase">Promedio</p>
              <p className="text-lg font-bold text-foreground">{data.promedio_interes ?? 0}</p>
            </div>
            <div className="p-2 rounded-md bg-background/40 border border-border/30">
              <p className="text-[10px] text-muted-foreground uppercase">Puntos en serie</p>
              <p className="text-lg font-bold text-foreground">{(data.serie_temporal ?? []).length}</p>
            </div>
          </div>

          {/* Serie temporal */}
          {(data.serie_temporal ?? []).length > 0 && (
            <div className="p-2 rounded-md bg-background/40 border border-border/30">
              <p className="text-xs font-medium text-foreground mb-2">Interés a lo largo del tiempo</p>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={data.serie_temporal as Array<Record<string, unknown>>}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis dataKey="fecha" tick={{ fontSize: 10 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      fontSize: 11,
                    }}
                  />
                  <Line type="monotone" dataKey={candidato.nombre} stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Related queries */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {(data.related_top ?? []).length > 0 && (
              <div className="p-2 rounded-md bg-background/40 border border-border/30">
                <p className="text-xs font-medium text-foreground mb-2">🔝 Búsquedas relacionadas (top)</p>
                <div className="flex flex-wrap gap-1">
                  {(data.related_top ?? []).slice(0, 10).map((q, i) => (
                    <Badge key={i} variant="secondary" className="text-[10px]">{q.query}</Badge>
                  ))}
                </div>
              </div>
            )}
            {(data.related_rising ?? []).length > 0 && (
              <div className="p-2 rounded-md bg-emerald-500/5 border border-emerald-500/20">
                <p className="text-xs font-medium text-foreground mb-2">↗ En alza (rising)</p>
                <div className="flex flex-wrap gap-1">
                  {(data.related_rising ?? []).slice(0, 10).map((q, i) => (
                    <Badge key={i} variant="outline" className="text-[10px] border-emerald-500/40">{q.query}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Contexto narrativo */}
          {data.contexto_narrativo && (
            <div className="p-3 rounded-md bg-primary/5 border border-primary/20">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-semibold text-foreground">Por qué sube/baja el interés</span>
              </div>
              <p className="text-xs text-foreground/90 whitespace-pre-wrap leading-relaxed">
                {data.contexto_narrativo}
              </p>
              {(data.citas ?? []).length > 0 && (
                <div className="mt-2 pt-2 border-t border-border/30">
                  <p className="text-[10px] text-muted-foreground mb-1">Fuentes:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(data.citas ?? []).slice(0, 12).map((c, i) => (
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
        </>
      )}
    </div>
  );
}

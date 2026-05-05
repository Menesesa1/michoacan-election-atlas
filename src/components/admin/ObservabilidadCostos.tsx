// Panel de observabilidad de costos: gasto diario por servicio + total 30 días.
// Solo visible para admin (RLS protege la tabla).
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DollarSign, RefreshCw, AlertTriangle, Database } from "lucide-react";

interface UsageRow {
  dia: string;
  servicio: string;
  funcion: string;
  llamadas: number;
  errores: number;
  cache_hits: number;
  costo_total_usd: number;
  duracion_promedio_ms: number;
}

const fmtUsd = (n: number) =>
  `$${(n ?? 0).toLocaleString("en-US", { minimumFractionDigits: 4, maximumFractionDigits: 4 })}`;

export default function ObservabilidadCostos() {
  const [rows, setRows] = useState<UsageRow[]>([]);
  const [loading, setLoading] = useState(true);

  const cargar = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("api_usage_diario" as any)
      .select("*")
      .limit(500);
    if (!error && data) setRows(data as unknown as UsageRow[]);
    setLoading(false);
  };

  useEffect(() => {
    cargar();
  }, []);

  // Agregados
  const total30d = rows.reduce((s, r) => s + Number(r.costo_total_usd ?? 0), 0);
  const llamadas30d = rows.reduce((s, r) => s + (r.llamadas ?? 0), 0);
  const errores30d = rows.reduce((s, r) => s + (r.errores ?? 0), 0);
  const cacheHits30d = rows.reduce((s, r) => s + (r.cache_hits ?? 0), 0);
  const cacheRatio = llamadas30d > 0 ? (cacheHits30d / llamadas30d) * 100 : 0;

  // Por servicio
  const porServicio = rows.reduce<Record<string, { llamadas: number; costo: number }>>(
    (acc, r) => {
      const k = r.servicio;
      if (!acc[k]) acc[k] = { llamadas: 0, costo: 0 };
      acc[k].llamadas += r.llamadas ?? 0;
      acc[k].costo += Number(r.costo_total_usd ?? 0);
      return acc;
    },
    {},
  );

  // Por día (últimos 7)
  const porDia = rows.reduce<Record<string, number>>((acc, r) => {
    acc[r.dia] = (acc[r.dia] ?? 0) + Number(r.costo_total_usd ?? 0);
    return acc;
  }, {});
  const dias = Object.entries(porDia)
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .slice(0, 7);

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-primary" />
          Observabilidad de costos · APIs externas
        </h2>
        <Button variant="outline" size="sm" onClick={cargar} disabled={loading}>
          <RefreshCw className={`w-3 h-3 mr-1 ${loading ? "animate-spin" : ""}`} />
          Actualizar
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <div className="p-3 rounded bg-card/40 border border-border/40">
          <div className="text-[10px] text-muted-foreground font-mono uppercase">Gasto 30d</div>
          <div className="text-lg font-bold text-primary">{fmtUsd(total30d)}</div>
        </div>
        <div className="p-3 rounded bg-card/40 border border-border/40">
          <div className="text-[10px] text-muted-foreground font-mono uppercase">Llamadas 30d</div>
          <div className="text-lg font-bold">{llamadas30d.toLocaleString()}</div>
        </div>
        <div className="p-3 rounded bg-card/40 border border-border/40">
          <div className="text-[10px] text-muted-foreground font-mono uppercase flex items-center gap-1">
            <Database className="w-3 h-3" /> Cache hits
          </div>
          <div className="text-lg font-bold text-emerald-500">{cacheRatio.toFixed(1)}%</div>
        </div>
        <div className="p-3 rounded bg-card/40 border border-border/40">
          <div className="text-[10px] text-muted-foreground font-mono uppercase flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> Errores
          </div>
          <div className={`text-lg font-bold ${errores30d > 0 ? "text-destructive" : ""}`}>
            {errores30d}
          </div>
        </div>
      </div>

      {/* Por servicio */}
      <div>
        <h3 className="text-xs font-semibold mb-2 text-muted-foreground">Por servicio (30d)</h3>
        {Object.keys(porServicio).length === 0 ? (
          <p className="text-xs text-muted-foreground font-mono py-3 text-center">
            Aún no hay registros de uso. Las funciones empezarán a registrar consumo
            tras integrar el helper de cost-control.
          </p>
        ) : (
          <div className="space-y-1">
            {Object.entries(porServicio)
              .sort((a, b) => b[1].costo - a[1].costo)
              .map(([servicio, v]) => (
                <div
                  key={servicio}
                  className="flex items-center justify-between gap-2 p-2 rounded bg-card/30 border border-border/30 text-xs"
                >
                  <Badge variant="secondary" className="font-mono uppercase text-[10px]">
                    {servicio}
                  </Badge>
                  <span className="text-muted-foreground font-mono flex-1">
                    {v.llamadas.toLocaleString()} llamadas
                  </span>
                  <span className="font-mono font-semibold text-primary">{fmtUsd(v.costo)}</span>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Últimos 7 días */}
      {dias.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold mb-2 text-muted-foreground">Últimos 7 días</h3>
          <div className="space-y-1">
            {dias.map(([dia, costo]) => {
              const max = Math.max(...dias.map((d) => d[1]));
              const pct = max > 0 ? (costo / max) * 100 : 0;
              return (
                <div key={dia} className="flex items-center gap-2 text-[11px] font-mono">
                  <span className="w-20 text-muted-foreground">{dia}</span>
                  <div className="flex-1 h-2 bg-muted/30 rounded overflow-hidden">
                    <div
                      className="h-full bg-primary/60"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-20 text-right">{fmtUsd(costo)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <p className="text-[10px] text-muted-foreground/70 font-mono pt-2 border-t border-border/40">
        Costos estimados con tarifas estándar (SerpApi $0.01, Perplexity $0.005, Lovable AI $0.0005,
        Firecrawl $0.002 por llamada). Ajusta en `_shared/cost-control.ts` con valores reales de facturación.
      </p>
    </Card>
  );
}

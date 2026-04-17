import { useEffect, useState } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Activity } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { sentimientoMoreliaMock } from "@/data/intencion-voto-mock";

export function SentimientoMoreliaChart() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<typeof sentimientoMoreliaMock>([]);

  useEffect(() => {
    const t = setTimeout(() => {
      setData(sentimientoMoreliaMock);
      setLoading(false);
    }, 600);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="executive-panel p-5 animate-slide-up">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 text-primary text-[10px] font-mono uppercase tracking-widest mb-1">
            <Activity className="w-3 h-3" />
            Sentimiento social · Morelia
          </div>
          <h3 className="text-base font-bold text-foreground">Evolución del sentimiento ciudadano</h3>
          <p className="text-[11px] text-muted-foreground mt-1">Análisis NLP redes sociales · % conversación</p>
        </div>
      </div>

      {loading ? (
        <Skeleton className="w-full h-[280px]" />
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }} stackOffset="expand">
            <defs>
              <linearGradient id="gradPos" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(140, 60%, 50%)" stopOpacity={0.85} />
                <stop offset="100%" stopColor="hsl(140, 60%, 50%)" stopOpacity={0.3} />
              </linearGradient>
              <linearGradient id="gradNeu" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.7} />
                <stop offset="100%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.25} />
              </linearGradient>
              <linearGradient id="gradNeg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--destructive))" stopOpacity={0.85} />
                <stop offset="100%" stopColor="hsl(var(--destructive))" stopOpacity={0.3} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
            <XAxis dataKey="semana" stroke="hsl(var(--muted-foreground))" fontSize={11} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={(v) => `${Math.round(v * 100)}%`} />
            <Tooltip
              contentStyle={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--primary) / 0.4)",
                borderRadius: 8,
                fontSize: 12,
              }}
              labelStyle={{ color: "hsl(var(--primary))", fontWeight: 600 }}
              formatter={(v: number) => `${v.toFixed(1)}%`}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Area type="monotone" dataKey="positivo" stackId="1" stroke="hsl(140, 60%, 50%)" fill="url(#gradPos)" />
            <Area type="monotone" dataKey="neutro" stackId="1" stroke="hsl(var(--muted-foreground))" fill="url(#gradNeu)" />
            <Area type="monotone" dataKey="negativo" stackId="1" stroke="hsl(var(--destructive))" fill="url(#gradNeg)" />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

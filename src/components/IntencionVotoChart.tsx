import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { intencionVotoMock } from "@/data/intencion-voto-mock";
import { PARTIDOS_CONFIG, type Partido } from "@/data/electoral-data";

const PARTIES: Partido[] = ["MORENA", "PAN", "PRI", "MC", "PVEM"];

export function IntencionVotoChart() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<typeof intencionVotoMock>([]);

  useEffect(() => {
    const t = setTimeout(() => {
      setData(intencionVotoMock);
      setLoading(false);
    }, 500);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="executive-panel p-5 animate-slide-up">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 text-primary text-[10px] font-mono uppercase tracking-widest mb-1">
            <TrendingUp className="w-3 h-3" />
            Intención de voto · Morelia
          </div>
          <h3 className="text-base font-bold text-foreground">Evolución semanal por partido</h3>
          <p className="text-[11px] text-muted-foreground mt-1">Últimas 16 semanas · % preferencia efectiva</p>
        </div>
      </div>

      {loading ? (
        <Skeleton className="w-full h-[280px]" />
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
            <XAxis dataKey="semana" stroke="hsl(var(--muted-foreground))" fontSize={11} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} domain={[0, 55]} />
            <Tooltip
              contentStyle={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--primary) / 0.4)",
                borderRadius: 8,
                fontSize: 12,
              }}
              labelStyle={{ color: "hsl(var(--primary))", fontWeight: 600 }}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {PARTIES.map((p) => (
              <Line
                key={p}
                type="monotone"
                dataKey={p}
                stroke={PARTIDOS_CONFIG[p].color}
                strokeWidth={2.2}
                dot={{ r: 2.5 }}
                activeDot={{ r: 5 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

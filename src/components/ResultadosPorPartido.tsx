import { getResumenEstatal, PARTIDOS_CONFIG, type Partido } from "@/data/electoral-data";
import { useElectoralData } from "@/context/DataContext";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

export function ResultadosPorPartido({ eleccion }: { eleccion: string }) {
  const { distritos } = useElectoralData();
  const resumen = getResumenEstatal(eleccion, distritos);

  const data = (Object.entries(resumen.totales) as [Partido, number][])
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([partido, votos]) => ({
      partido,
      votos,
      porcentaje: ((votos / resumen.totalVotos) * 100).toFixed(1),
      color: PARTIDOS_CONFIG[partido]?.color || "#666",
    }));

  return (
    <div className="glass-panel p-4 animate-slide-up">
      <h3 className="text-xs font-semibold text-foreground mb-1">Votación por Partido</h3>
      <p className="text-[10px] text-muted-foreground mb-4 font-mono">Cómputos distritales · Michoacán</p>

      <div className="h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 10, right: 40 }}>
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="partido"
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              width={60}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                fontSize: 12,
                color: "hsl(var(--foreground))",
              }}
              formatter={(value: number) => [value.toLocaleString() + " votos", ""]}
            />
            <Bar dataKey="votos" radius={[0, 4, 4, 0]} barSize={20}>
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-3">
        {data.slice(0, 4).map((d) => (
          <div key={d.partido} className="flex items-center gap-2 text-[11px]">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
            <span className="text-muted-foreground">{d.partido}</span>
            <span className="font-mono font-semibold text-foreground ml-auto">{d.porcentaje}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

import { PARTIDOS_CONFIG, getResumenEstatal, type Partido } from "@/data/electoral-data";
import { useElectoralData } from "@/context/DataContext";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

export function TendenciasHistoricas() {
  const { distritos, elecciones } = useElectoralData();

  // Get all available election keys sorted by year
  const eleccionesOrdenadas = [...elecciones].sort((a, b) => a.año - b.año);

  const data = eleccionesOrdenadas.map((e) => {
    const r = getResumenEstatal(e.key, distritos);
    const row: Record<string, string | number> = { año: String(e.año) };
    if (r.totalVotos > 0) {
      (Object.entries(r.totales) as [Partido, number][]).forEach(([partido, votos]) => {
        row[partido] = +((votos / r.totalVotos) * 100).toFixed(1);
      });
    }
    return row;
  }).filter((row) => Object.keys(row).length > 1); // Only rows with data

  const mainPartidos: Partido[] = ["MORENA", "PAN", "PRI", "MC", "PVEM"];

  return (
    <div className="glass-panel p-4 animate-slide-up">
      <h3 className="text-xs font-semibold text-foreground mb-1">Tendencia Histórica del Voto</h3>
      <p className="text-[10px] text-muted-foreground mb-4 font-mono">Porcentaje de votación · {eleccionesOrdenadas.length} elecciones</p>

      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ left: 0, right: 10, top: 10 }}>
            <XAxis
              dataKey="año"
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => v + "%"}
              width={40}
            />
            <Tooltip
              contentStyle={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                fontSize: 11,
                color: "hsl(var(--foreground))",
              }}
              formatter={(value: number) => [value + "%", ""]}
            />
            <Legend
              wrapperStyle={{ fontSize: 10 }}
              formatter={(value) => <span style={{ color: "hsl(var(--muted-foreground))" }}>{value}</span>}
            />
            {mainPartidos.map((p) => (
              <Line
                key={p}
                type="monotone"
                dataKey={p}
                stroke={PARTIDOS_CONFIG[p].color}
                strokeWidth={2}
                dot={{ r: 4, fill: PARTIDOS_CONFIG[p].color }}
                activeDot={{ r: 6 }}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

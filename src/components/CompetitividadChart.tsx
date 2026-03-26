import { getCompetitividadDistrito } from "@/data/electoral-data";
import { useElectoralData } from "@/context/DataContext";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

export function CompetitividadChart({ eleccion }: { eleccion: string }) {
  const { distritosActivos, nivel } = useElectoralData();

  const data = distritosActivos
    .map((d) => {
      const comp = getCompetitividadDistrito(d, eleccion);
      return {
        distrito: `${nivel === "local" ? "L" : "D"}${d.id}`,
        cabecera: d.cabecera,
        margen: +comp.margen.toFixed(1),
        nivel: comp.nivel,
      };
    })
    .filter((d) => d.margen > 0)
    .sort((a, b) => a.margen - b.margen);

  const getColor = (margen: number) => {
    if (margen < 5) return "hsl(var(--accent))";
    if (margen < 10) return "hsl(var(--gold))";
    if (margen < 20) return "hsl(var(--primary))";
    return "hsl(var(--muted-foreground))";
  };

  return (
    <div className="glass-panel p-4 animate-slide-up">
      <h3 className="text-xs font-semibold text-foreground mb-1">Índice de Competitividad</h3>
      <p className="text-[10px] text-muted-foreground mb-4 font-mono">Margen de victoria · {distritosActivos.length} distritos {nivel === "local" ? "locales" : "federales"}</p>

      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ left: 10, right: 10 }}>
            <XAxis dataKey="distrito" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickFormatter={(v) => v + "%"} width={35} />
            <Tooltip
              contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: 11, color: "hsl(var(--foreground))" }}
              formatter={(value: number) => [value + "% margen", ""]}
              labelFormatter={(label) => { const d = data.find((x) => x.distrito === label); return d ? `${label} · ${d.cabecera}` : label; }}
            />
            <Bar dataKey="margen" radius={[4, 4, 0, 0]} barSize={nivel === "local" ? 14 : 24}>
              {data.map((entry, i) => (
                <Cell key={i} fill={getColor(entry.margen)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex gap-4 mt-3 text-[10px]">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-accent" /> &lt;5% Muy competido</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gold" /> 5-10% Competido</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary" /> 10-20% Moderado</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-muted-foreground" /> &gt;20% Bastión</span>
      </div>
    </div>
  );
}

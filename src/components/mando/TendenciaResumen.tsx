import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, ChevronRight } from "lucide-react";
import { LineChart, Line, ResponsiveContainer, YAxis } from "recharts";
import { useElectoralData } from "@/context/DataContext";
import { getResumenEstatal, PARTIDOS_CONFIG, type Partido } from "@/data/electoral-data";

const PARTIDOS_FOCO: Partido[] = ["MORENA", "PAN", "PRI", "MC"];

export function TendenciaResumen() {
  const { distritos, elecciones } = useElectoralData();
  const ordenadas = [...elecciones].sort((a, b) => a.año - b.año);

  // Serie de % por partido a lo largo de los años
  const serie = ordenadas
    .map((e) => {
      const r = getResumenEstatal(e.key, distritos);
      if (r.totalVotos === 0) return null;
      const row: Record<string, number | string> = { año: e.año };
      for (const p of PARTIDOS_FOCO) {
        row[p] = +(((r.totales[p] ?? 0) / r.totalVotos) * 100).toFixed(1);
      }
      return row;
    })
    .filter(Boolean) as Array<Record<string, number | string>>;

  const ultimo = serie[serie.length - 1];
  const previo = serie[serie.length - 2];

  const swings = PARTIDOS_FOCO.map((p) => {
    const u = (ultimo?.[p] as number) ?? 0;
    const a = (previo?.[p] as number) ?? 0;
    return { partido: p, actual: u, swing: +(u - a).toFixed(1) };
  }).sort((a, b) => b.actual - a.actual);

  return (
    <Card className="p-4 bg-card/60 backdrop-blur border-border">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          <h3 className="text-xs font-semibold uppercase tracking-widest">Tendencia electoral</h3>
        </div>
        <Link to="/tendencias" className="text-[10px] text-muted-foreground hover:text-primary font-mono flex items-center gap-1">
          Análisis completo <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      {serie.length < 2 ? (
        <p className="text-xs text-muted-foreground py-6 text-center">
          Importa más datos electorales para ver tendencias.
        </p>
      ) : (
        <>
          <div className="h-20 mb-3">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={serie}>
                <YAxis hide domain={[0, "auto"]} />
                {PARTIDOS_FOCO.map((p) => (
                  <Line
                    key={p}
                    type="monotone"
                    dataKey={p}
                    stroke={PARTIDOS_CONFIG[p].color}
                    strokeWidth={2}
                    dot={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {swings.map(({ partido, actual, swing }) => {
              const Icon = swing > 0.5 ? TrendingUp : swing < -0.5 ? TrendingDown : Minus;
              const color = swing > 0.5 ? "text-emerald-400" : swing < -0.5 ? "text-destructive" : "text-muted-foreground";
              return (
                <div key={partido} className="flex items-center justify-between bg-secondary/40 rounded-md px-2 py-1.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: PARTIDOS_CONFIG[partido].color }} />
                    <span className="text-[11px] font-mono truncate">{partido}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-mono font-bold">{actual}%</span>
                    <Badge variant="outline" className={`font-mono text-[9px] px-1 py-0 h-4 border-0 ${color}`}>
                      <Icon className="w-2.5 h-2.5 mr-0.5" />
                      {swing > 0 ? "+" : ""}{swing}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-[9px] text-muted-foreground/70 font-mono mt-2 text-center">
            Variación últimas 2 elecciones · {ordenadas[ordenadas.length - 2]?.año} → {ordenadas[ordenadas.length - 1]?.año}
          </p>
        </>
      )}
    </Card>
  );
}

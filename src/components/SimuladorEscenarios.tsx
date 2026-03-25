import { useState } from "react";
import { Slider } from "@/components/ui/slider";
import { distritosFederales, PARTIDOS_CONFIG, type Partido } from "@/data/electoral-data";

const partidos: Partido[] = ["MORENA", "PAN", "PRI", "MC", "PVEM"];

export function SimuladorEscenarios() {
  const [participacion, setParticipacion] = useState(58);
  const [swings, setSwings] = useState<Record<string, number>>({
    MORENA: 0, PAN: 0, PRI: 0, MC: 0, PVEM: 0,
  });

  const base = distritosFederales.map((d) => {
    const r = d.resultados["fed2024"];
    if (!r) return null;
    return { ...d, resultado: r };
  }).filter(Boolean) as Array<typeof distritosFederales[0] & { resultado: NonNullable<typeof distritosFederales[0]["resultados"]["fed2024"]> }>;

  const resultados = base.map((d) => {
    const ajustado: Partial<Record<Partido, number>> = {};
    let total = 0;

    partidos.forEach((p) => {
      const baseVotos = d.resultado.votos[p] || 0;
      const factor = 1 + swings[p] / 100;
      const partFactor = participacion / d.resultado.participacion;
      ajustado[p] = Math.round(baseVotos * factor * partFactor);
      total += ajustado[p]!;
    });

    const ganador = partidos.reduce((a, b) => (ajustado[a]! || 0) >= (ajustado[b]! || 0) ? a : b);
    return { distrito: d.id, cabecera: d.cabecera, votos: ajustado, total, ganador };
  });

  const distritosGanados: Partial<Record<Partido, number>> = {};
  resultados.forEach((r) => {
    distritosGanados[r.ganador] = (distritosGanados[r.ganador] || 0) + 1;
  });

  return (
    <div className="glass-panel p-4 animate-slide-up">
      <h3 className="text-xs font-semibold text-foreground mb-1">Simulador de Escenarios</h3>
      <p className="text-[10px] text-muted-foreground mb-4 font-mono">Proyección basada en resultados 2024</p>

      <div className="space-y-4 mb-6">
        <div>
          <div className="flex justify-between text-[11px] mb-2">
            <span className="text-muted-foreground">Participación esperada</span>
            <span className="font-mono font-bold text-primary">{participacion}%</span>
          </div>
          <Slider value={[participacion]} onValueChange={([v]) => setParticipacion(v)} min={40} max={75} step={1} className="w-full" />
        </div>

        {partidos.map((p) => (
          <div key={p}>
            <div className="flex justify-between text-[11px] mb-1">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: PARTIDOS_CONFIG[p].color }} />
                <span className="text-muted-foreground">{p} swing</span>
              </span>
              <span className="font-mono font-semibold text-foreground">{swings[p] > 0 ? "+" : ""}{swings[p]}%</span>
            </div>
            <Slider
              value={[swings[p]]}
              onValueChange={([v]) => setSwings((s) => ({ ...s, [p]: v }))}
              min={-30}
              max={30}
              step={1}
            />
          </div>
        ))}
      </div>

      <div className="border-t border-border/50 pt-4">
        <p className="text-[10px] text-muted-foreground font-mono mb-3">PROYECCIÓN DE DISTRITOS GANADOS</p>
        <div className="grid grid-cols-2 gap-2">
          {partidos.map((p) => (
            <div key={p} className="flex items-center justify-between bg-secondary/50 rounded-md px-3 py-2">
              <span className="flex items-center gap-1.5 text-xs">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: PARTIDOS_CONFIG[p].color }} />
                {p}
              </span>
              <span className="font-mono font-bold text-lg" style={{ color: PARTIDOS_CONFIG[p].color }}>
                {distritosGanados[p] || 0}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

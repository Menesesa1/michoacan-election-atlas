import { getCompetitividadDistrito, PARTIDOS_CONFIG, type Partido } from "@/data/electoral-data";
import { useElectoralData } from "@/context/DataContext";

export function MapaDistritos({ eleccion }: { eleccion: string }) {
  const { distritosActivos, nivel } = useElectoralData();
  const prefix = nivel === "local" ? "L" : "D";

  return (
    <div className="glass-panel p-4 animate-slide-up">
      <h3 className="text-xs font-semibold text-foreground mb-1">
        Vista de Distritos {nivel === "federal" ? "Federales" : "Locales"}
      </h3>
      <p className="text-[10px] text-muted-foreground mb-4 font-mono">
        Michoacán · {distritosActivos.length} distritos electorales {nivel === "local" ? "(IEM)" : "(INE)"}
      </p>

      <div className={`grid ${nivel === "local" ? "grid-cols-4 sm:grid-cols-6" : "grid-cols-4"} gap-2`}>
        {distritosActivos.map((d) => {
          const r = d.resultados[eleccion];
          if (!r) return null;
          const comp = getCompetitividadDistrito(d, eleccion);
          const color = PARTIDOS_CONFIG[r.ganador as Partido]?.color || "#666";

          return (
            <div
              key={d.id}
              className="relative p-3 rounded-lg border border-border/30 hover:border-primary/50 transition-all cursor-pointer group"
              style={{ backgroundColor: color + "15" }}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono text-xs font-bold" style={{ color }}>{prefix}{d.id}</span>
                <span
                  className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                  style={{ backgroundColor: color + "30", color }}
                >
                  {r.ganador}
                </span>
              </div>
              <p className="text-[10px] text-foreground font-medium truncate">{d.cabecera}</p>
              <div className="flex justify-between mt-1.5 text-[9px] text-muted-foreground">
                <span>Part: {r.participacion}%</span>
                <span>M: {comp.margen.toFixed(0)}%</span>
              </div>
              <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity" style={{ boxShadow: `0 0 15px -3px ${color}40` }} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

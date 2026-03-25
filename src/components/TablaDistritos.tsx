import { getCompetitividadDistrito, PARTIDOS_CONFIG, type Partido } from "@/data/electoral-data";
import { useElectoralData } from "@/context/DataContext";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function TablaDistritos({ eleccion }: { eleccion: string }) {
  const { distritos } = useElectoralData();

  return (
    <div className="glass-panel p-4 animate-slide-up overflow-auto">
      <h3 className="text-xs font-semibold text-foreground mb-1">Resultados por Distrito Federal</h3>
      <p className="text-[10px] text-muted-foreground mb-4 font-mono">{distritos.length} distritos · Michoacán</p>

      <Table>
        <TableHeader>
          <TableRow className="border-border/30 hover:bg-transparent">
            <TableHead className="text-[10px] text-muted-foreground font-mono">DTO</TableHead>
            <TableHead className="text-[10px] text-muted-foreground font-mono">CABECERA</TableHead>
            <TableHead className="text-[10px] text-muted-foreground font-mono text-right">L. NOMINAL</TableHead>
            <TableHead className="text-[10px] text-muted-foreground font-mono text-right">PART.</TableHead>
            <TableHead className="text-[10px] text-muted-foreground font-mono">GANADOR</TableHead>
            <TableHead className="text-[10px] text-muted-foreground font-mono text-right">MARGEN</TableHead>
            <TableHead className="text-[10px] text-muted-foreground font-mono">COMPETITIVIDAD</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {distritos.map((d) => {
            const r = d.resultados[eleccion];
            const comp = getCompetitividadDistrito(d, eleccion);
            if (!r) return null;

            const nivelColor = comp.nivel === "Muy competido" ? "text-accent" : comp.nivel === "Competido" ? "text-gold" : "text-muted-foreground";

            return (
              <TableRow key={d.id} className="border-border/20 hover:bg-secondary/50 transition-colors">
                <TableCell className="font-mono text-xs font-bold text-primary">{String(d.id).padStart(2, "0")}</TableCell>
                <TableCell className="text-xs text-foreground">{d.cabecera}</TableCell>
                <TableCell className="text-xs text-right font-mono text-muted-foreground">{d.listaNominal2024.toLocaleString()}</TableCell>
                <TableCell className="text-xs text-right font-mono text-foreground">{r.participacion.toFixed(1)}%</TableCell>
                <TableCell>
                  <span
                    className="inline-block px-2 py-0.5 rounded text-[10px] font-bold"
                    style={{
                      backgroundColor: PARTIDOS_CONFIG[r.ganador as Partido]?.color + "22",
                      color: PARTIDOS_CONFIG[r.ganador as Partido]?.color,
                    }}
                  >
                    {r.ganador}
                  </span>
                </TableCell>
                <TableCell className="text-xs text-right font-mono font-semibold text-foreground">{comp.margen.toFixed(1)}%</TableCell>
                <TableCell className={`text-[11px] font-medium ${nivelColor}`}>{comp.nivel}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

import { useMemo, useState } from "react";
import { useElectoralData } from "@/context/DataContext";
import { proyectarPorDistrito, type ProyeccionDistrito } from "@/lib/proyeccion-2027";
import { PARTIDOS_CONFIG, type Partido } from "@/data/electoral-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Map, ShieldCheck, AlertTriangle, Target, Swords, RefreshCw } from "lucide-react";

type Filtro = "todos" | "riesgo" | "oportunidad" | "competido" | "volteado" | "consolidado";

const ESTATUS_CFG: Record<ProyeccionDistrito["estatus"], { label: string; icon: typeof ShieldCheck; cls: string; orden: number }> = {
  volteado: { label: "Volteado", icon: Swords, cls: "text-destructive border-destructive/50 bg-destructive/10", orden: 0 },
  competido: { label: "Competido", icon: AlertTriangle, cls: "text-foreground border-foreground/40 bg-foreground/5", orden: 1 },
  riesgo: { label: "En riesgo", icon: AlertTriangle, cls: "text-destructive border-destructive/40 bg-destructive/5", orden: 2 },
  oportunidad: { label: "Oportunidad", icon: Target, cls: "text-emerald-300 border-emerald-500/40 bg-emerald-500/10", orden: 3 },
  consolidado: { label: "Consolidado", icon: ShieldCheck, cls: "text-emerald-400 border-emerald-500/30 bg-emerald-500/5", orden: 4 },
};

const FILTROS: { key: Filtro; label: string }[] = [
  { key: "todos", label: "Todos" },
  { key: "volteado", label: "Volteados" },
  { key: "competido", label: "Competidos" },
  { key: "riesgo", label: "En riesgo" },
  { key: "oportunidad", label: "Oportunidad" },
  { key: "consolidado", label: "Consolidados" },
];

export function ProyeccionDistrital2027() {
  const { distritos, distritosLocales, nivel } = useElectoralData();
  const tipo = nivel === "federal" ? "federal" : "local";
  const fuente = nivel === "federal" ? distritos : distritosLocales;
  const [filtro, setFiltro] = useState<Filtro>("todos");

  const proyecciones = useMemo(() => proyectarPorDistrito(fuente, tipo), [fuente, tipo]);

  // Resumen por estatus
  const resumen = useMemo(() => {
    const r: Record<ProyeccionDistrito["estatus"], number> = {
      consolidado: 0, riesgo: 0, oportunidad: 0, competido: 0, volteado: 0,
    };
    for (const p of proyecciones) r[p.estatus]++;
    return r;
  }, [proyecciones]);

  // Reordenar por urgencia (volteado, competido, riesgo arriba)
  const lista = useMemo(() => {
    const filtrada = filtro === "todos" ? proyecciones : proyecciones.filter((p) => p.estatus === filtro);
    return [...filtrada].sort((a, b) => ESTATUS_CFG[a.estatus].orden - ESTATUS_CFG[b.estatus].orden);
  }, [proyecciones, filtro]);

  const totalConFlip = resumen.volteado + resumen.competido + resumen.riesgo;

  return (
    <section className="executive-panel p-5 space-y-4">
      <header className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2 text-primary text-[10px] font-mono uppercase tracking-widest">
            <Map className="w-3 h-3" /> Proyección distrital 2027
          </div>
          <h3 className="text-xl font-bold text-foreground mt-1">
            {fuente.length} distritos {tipo === "federal" ? "federales" : "locales"}
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Swing uniforme aplicado distrito por distrito sobre el último ciclo. Identifica dónde se gana, dónde se cae y dónde hay que pelear.
          </p>
        </div>
        <Badge variant="outline" className="font-mono text-[10px] text-destructive border-destructive/40">
          {totalConFlip} distritos en disputa
        </Badge>
      </header>

      {/* Resumen */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {(["volteado", "competido", "riesgo", "oportunidad", "consolidado"] as const).map((estatus) => {
          const cfg = ESTATUS_CFG[estatus];
          const Icon = cfg.icon;
          return (
            <button
              key={estatus}
              onClick={() => setFiltro((f) => (f === estatus ? "todos" : estatus))}
              className={`p-2 rounded-md border text-left transition-all hover:scale-[1.02] ${cfg.cls} ${filtro === estatus ? "ring-2 ring-current/50" : ""}`}
            >
              <div className="flex items-center justify-between">
                <Icon className="w-3.5 h-3.5" />
                <span className="font-mono font-bold text-lg">{resumen[estatus]}</span>
              </div>
              <div className="text-[10px] font-mono uppercase tracking-wider mt-1">{cfg.label}</div>
            </button>
          );
        })}
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {FILTROS.map((f) => (
          <Button
            key={f.key}
            variant={filtro === f.key ? "default" : "outline"}
            size="sm"
            onClick={() => setFiltro(f.key)}
            className="h-7 text-[11px]"
          >
            {f.label}
          </Button>
        ))}
        {filtro !== "todos" && (
          <Button variant="ghost" size="sm" onClick={() => setFiltro("todos")} className="h-7 text-[11px] gap-1">
            <RefreshCw className="w-3 h-3" /> Reset
          </Button>
        )}
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto -mx-2">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-[10px] font-mono uppercase text-muted-foreground border-b border-border/40">
              <th className="px-2 py-2">Distrito</th>
              <th className="px-2 py-2">Estatus</th>
              <th className="px-2 py-2">Actual</th>
              <th className="px-2 py-2">Proyección 2027</th>
              <th className="px-2 py-2 text-right">Margen Δ</th>
            </tr>
          </thead>
          <tbody>
            {lista.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center text-muted-foreground py-6 text-sm">
                  Ningún distrito en esta categoría.
                </td>
              </tr>
            ) : (
              lista.map((d) => {
                const cfg = ESTATUS_CFG[d.estatus];
                const Icon = cfg.icon;
                const cActual = PARTIDOS_CONFIG[d.ganadorActual];
                const cProy = PARTIDOS_CONFIG[d.ganadorProyectado];
                const flip = d.ganadorActual !== d.ganadorProyectado;
                return (
                  <tr key={d.id} className="border-b border-border/20 hover:bg-secondary/30">
                    <td className="px-2 py-2">
                      <div className="font-bold text-foreground">D{d.id}</div>
                      <div className="text-[10px] text-muted-foreground truncate max-w-[140px]">{d.cabecera}</div>
                    </td>
                    <td className="px-2 py-2">
                      <Badge variant="outline" className={`text-[9px] font-mono gap-1 ${cfg.cls}`}>
                        <Icon className="w-2.5 h-2.5" /> {cfg.label}
                      </Badge>
                    </td>
                    <td className="px-2 py-2">
                      <div className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full" style={{ background: cActual.color }} />
                        <span className="font-mono text-foreground">{d.ganadorActual} {d.pctGanador}%</span>
                      </div>
                      <div className="text-[10px] text-muted-foreground">margen {d.margenActual}pp</div>
                    </td>
                    <td className="px-2 py-2">
                      <div className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full" style={{ background: cProy.color }} />
                        <span className={`font-mono ${flip ? "font-bold text-destructive" : "text-foreground"}`}>
                          {d.ganadorProyectado} {d.pctProyectado}%
                        </span>
                      </div>
                      <div className="text-[10px] text-muted-foreground">margen {d.margenProyectado}pp</div>
                    </td>
                    <td className="px-2 py-2 text-right font-mono">
                      <span className={d.delta > 0 ? "text-emerald-400" : d.delta < 0 ? "text-destructive" : "text-foreground"}>
                        {d.delta > 0 ? "+" : ""}{d.delta}pp
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="text-[10px] font-mono text-muted-foreground/80 border-t border-border/30 pt-3">
        <strong className="text-foreground/80">Lectura operativa:</strong> distritos "volteados" y "competidos" son
        prioridad de presupuesto y candidato. "En riesgo" requieren contención del territorio. "Oportunidad" son zonas
        donde la tendencia favorece y hay que rematar.
      </div>
    </section>
  );
}

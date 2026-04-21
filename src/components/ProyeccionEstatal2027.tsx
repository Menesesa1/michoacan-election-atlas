import { useMemo, useState } from "react";
import { useElectoralData } from "@/context/DataContext";
import { proyectarEstatal, type ProyeccionPartido, PARTIDOS_PROYECCION } from "@/lib/proyeccion-2027";
import { PARTIDOS_CONFIG, type Partido } from "@/data/electoral-data";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Minus, RotateCcw, Info, Target } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const TENDENCIA_ICON = {
  alza: TrendingUp,
  baja: TrendingDown,
  estable: Minus,
} as const;

const CALIDAD_BADGE: Record<"alta" | "media" | "baja", { label: string; cls: string }> = {
  alta: { label: "Calidad alta", cls: "text-emerald-300 border-emerald-500/40 bg-emerald-500/10" },
  media: { label: "Calidad media", cls: "text-foreground border-foreground/30 bg-foreground/5" },
  baja: { label: "Calidad baja", cls: "text-destructive border-destructive/40 bg-destructive/10" },
};

function FilaProyeccion({ p, max }: { p: ProyeccionPartido; max: number }) {
  const cfg = PARTIDOS_CONFIG[p.partido];
  const Icon = TENDENCIA_ICON[p.tendencia];
  const tendColor =
    p.tendencia === "alza" ? "text-emerald-400" : p.tendencia === "baja" ? "text-destructive" : "text-foreground";

  return (
    <div className="grid grid-cols-12 gap-2 items-center py-2 border-b border-border/30 last:border-0">
      <div className="col-span-3 sm:col-span-2 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: cfg.color }} />
          <span className="text-xs font-bold text-foreground truncate">{p.partido}</span>
        </div>
        <div className={`flex items-center gap-1 text-[10px] font-mono ${tendColor} mt-0.5`}>
          <Icon className="w-2.5 h-2.5" />
          {p.tendencia}
        </div>
      </div>

      {/* Barra con banda de incertidumbre */}
      <div className="col-span-6 sm:col-span-7 relative h-6">
        {/* Banda inf-sup */}
        <div
          className="absolute top-1/2 -translate-y-1/2 h-1.5 rounded-full opacity-40"
          style={{
            left: `${(p.bandaInf / max) * 100}%`,
            width: `${((p.bandaSup - p.bandaInf) / max) * 100}%`,
            background: cfg.color,
          }}
          title={`Banda 80%: ${p.bandaInf}% – ${p.bandaSup}%`}
        />
        {/* Marca regresión */}
        <div
          className="absolute top-0 h-6 w-0.5 opacity-60"
          style={{ left: `${(p.regresion / max) * 100}%`, background: cfg.color }}
          title={`Regresión: ${p.regresion}%`}
        />
        {/* Marca swing */}
        <div
          className="absolute top-1 h-4 w-0.5 opacity-60 border-l border-dashed"
          style={{ left: `${(p.swing / max) * 100}%`, borderColor: cfg.color }}
          title={`Swing: ${p.swing}%`}
        />
        {/* Marca consenso (la principal) */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full ring-2 ring-background"
          style={{ left: `calc(${(p.consenso / max) * 100}% - 6px)`, background: cfg.color }}
          title={`Consenso: ${p.consenso}%`}
        />
        {/* Marca actual */}
        <div
          className="absolute -bottom-0.5 text-[8px] font-mono text-muted-foreground"
          style={{ left: `calc(${(p.ultimoReal / max) * 100}% - 8px)` }}
        >
          ▲{p.ultimoReal}
        </div>
      </div>

      <div className="col-span-3 text-right">
        <div className="font-mono font-bold text-base text-foreground">{p.consenso}%</div>
        <div className="text-[9px] font-mono text-muted-foreground">
          [{p.bandaInf}–{p.bandaSup}] · σ {p.volatilidad}
        </div>
      </div>
    </div>
  );
}

export function ProyeccionEstatal2027() {
  const { distritos, distritosLocales, nivel } = useElectoralData();
  const tipo = nivel === "federal" ? "federal" : "local";
  const fuente = nivel === "federal" ? distritos : distritosLocales;

  const [ajustes, setAjustes] = useState<Partial<Record<Partido, number>>>({});

  const { proyecciones, ciclos, añoObjetivo, calidad, notaCalidad } = useMemo(
    () => proyectarEstatal(fuente, tipo, ajustes),
    [fuente, tipo, ajustes]
  );

  const max = Math.max(...proyecciones.map((p) => p.bandaSup), 50);
  const calBadge = CALIDAD_BADGE[calidad];

  const totalAjustes = Object.values(ajustes).reduce((s, v) => s + Math.abs(v ?? 0), 0);

  return (
    <TooltipProvider delayDuration={200}>
      <section className="executive-panel gold-border p-5 space-y-5">
        <header className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className="flex items-center gap-2 text-primary text-[10px] font-mono uppercase tracking-widest">
              <Target className="w-3 h-3" /> Proyección {añoObjetivo} · {tipo === "federal" ? "Federal" : "Local"}
            </div>
            <h3 className="text-xl font-bold text-foreground mt-1">Escenario base por partido</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-2xl">
              Consenso entre dos métodos: <strong className="text-foreground">regresión lineal</strong> sobre el histórico
              y <strong className="text-foreground">swing uniforme</strong> del último ciclo. Banda 80% calculada sobre
              volatilidad observada.
            </p>
          </div>
          <Badge variant="outline" className={`font-mono text-[10px] ${calBadge.cls}`}>
            {calBadge.label} · n={ciclos.length}
          </Badge>
        </header>

        {/* Leyenda visual */}
        <div className="flex flex-wrap items-center gap-3 text-[10px] font-mono text-muted-foreground bg-muted/20 rounded-md px-3 py-2">
          <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-foreground/60 ring-2 ring-background" /> Consenso</span>
          <span className="inline-flex items-center gap-1"><span className="w-0.5 h-3 bg-foreground/60" /> Regresión</span>
          <span className="inline-flex items-center gap-1"><span className="w-0.5 h-3 border-l border-dashed border-foreground/60" /> Swing</span>
          <span className="inline-flex items-center gap-1"><span className="w-4 h-1 bg-foreground/30 rounded-full" /> Banda 80%</span>
          <span className="inline-flex items-center gap-1">▲ Último real</span>
        </div>

        {/* Proyecciones */}
        {proyecciones.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            Necesitas al menos 2 ciclos electorales del mismo tipo. Importa más datos para activar la proyección.
          </p>
        ) : (
          <div className="space-y-1">
            {proyecciones.map((p) => (
              <FilaProyeccion key={p.partido} p={p} max={max} />
            ))}
          </div>
        )}

        {/* Sliders de ajuste */}
        <div className="border-t border-border/40 pt-4 space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div>
              <h4 className="text-sm font-bold text-foreground inline-flex items-center gap-2">
                Ajustes del estratega
                <Tooltip>
                  <TooltipTrigger><Info className="w-3 h-3 text-muted-foreground" /></TooltipTrigger>
                  <TooltipContent className="max-w-xs text-xs">
                    Mueve cada partido ±10pp sobre la proyección base para modelar supuestos: candidato fuerte/débil,
                    coalición rota, contexto nacional, etc. La proyección recalcula en vivo.
                  </TooltipContent>
                </Tooltip>
              </h4>
              <p className="text-[10px] text-muted-foreground">Modelo "qué pasaría si…" sobre el escenario base</p>
            </div>
            {totalAjustes > 0 && (
              <Button variant="ghost" size="sm" onClick={() => setAjustes({})} className="h-7 text-xs gap-1">
                <RotateCcw className="w-3 h-3" /> Limpiar ajustes
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
            {PARTIDOS_PROYECCION.filter((p) => proyecciones.some((pp) => pp.partido === p)).map((p) => {
              const cfg = PARTIDOS_CONFIG[p];
              const v = ajustes[p] ?? 0;
              return (
                <div key={p} className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ background: cfg.color }} />
                      <span className="font-bold text-foreground">{p}</span>
                    </div>
                    <span className={`font-mono ${v > 0 ? "text-emerald-400" : v < 0 ? "text-destructive" : "text-muted-foreground"}`}>
                      {v > 0 ? "+" : ""}{v.toFixed(1)}pp
                    </span>
                  </div>
                  <Slider
                    value={[v]}
                    onValueChange={([nv]) => setAjustes((prev) => ({ ...prev, [p]: nv }))}
                    min={-10}
                    max={10}
                    step={0.5}
                  />
                </div>
              );
            })}
          </div>
        </div>

        <div className="text-[10px] font-mono text-muted-foreground/80 border-t border-border/30 pt-3">
          <strong className="text-foreground/80">Metodología:</strong> {notaCalidad} · Ciclos usados: {ciclos.join(" → ")} → <strong className="text-primary">{añoObjetivo}</strong>.
          Esta es una proyección, no un pronóstico: depende de que el patrón histórico se mantenga y de los supuestos del estratega.
        </div>
      </section>
    </TooltipProvider>
  );
}

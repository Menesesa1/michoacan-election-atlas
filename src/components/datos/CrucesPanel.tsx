import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import {
  CartesianGrid,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import { GitCompareArrows, Info } from "lucide-react";
import { VOTO_MORENA_2021_POR_DISTRITO } from "@/data/locales/gobernador";
import { ganadoresPorAnio } from "@/data/locales/diputados-locales";
import { loadECEG, type SeccionCenso } from "@/lib/eceg-loader";
import { loadCatalogo, distritoLocalDeSeccion } from "@/lib/secciones-catalogo";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const fmt = (n: number) => (Number.isFinite(n) ? n.toFixed(1) : "—");

type Punto = {
  distrito: number;
  votoMorena: number;
  participacion: number;
  escolaridad: number;
  sinAcceso: number;
  poblacion: number;
};

function correlacion(xs: number[], ys: number[]): number {
  const n = xs.length;
  if (n < 3) return 0;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0,
    dx = 0,
    dy = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - mx) * (ys[i] - my);
    dx += (xs[i] - mx) ** 2;
    dy += (ys[i] - my) ** 2;
  }
  const den = Math.sqrt(dx * dy);
  return den === 0 ? 0 : num / den;
}

export default function CrucesPanel() {
  const [censo, setCenso] = useState<SeccionCenso[] | null>(null);
  const [catalogoReady, setCatalogoReady] = useState(false);
  const [eje, setEje] = useState<"escolaridad" | "sinAcceso" | "participacion">("escolaridad");

  useEffect(() => {
    loadECEG()
      .then(setCenso)
      .catch(() => {});
    loadCatalogo()
      .then(() => setCatalogoReady(true))
      .catch(() => {});
  }, []);

  const puntos = useMemo<Punto[]>(() => {
    if (!censo || !catalogoReady) return [];
    // Acumular censo por distrito local usando lookup del catálogo
    const acum = new Map<number, { esc: number[]; sin: number[]; pob: number }>();
    censo.forEach((s) => {
      const d = distritoLocalDeSeccion(s.seccion);
      if (!d) return;
      const slot = acum.get(d) ?? { esc: [], sin: [], pob: 0 };
      if (typeof s.grado_promedio_escolaridad === "number")
        slot.esc.push(s.grado_promedio_escolaridad);
      if (typeof s.pct_sin_acceso_servicios === "number")
        slot.sin.push(s.pct_sin_acceso_servicios);
      slot.pob += s.poblacion_total ?? 0;
      acum.set(d, slot);
    });

    const ganadores2024 = ganadoresPorAnio(2024);
    const partPorDistrito = new Map<number, number>();
    ganadores2024.forEach((g) => partPorDistrito.set(g.distrito, g.participacionPct));

    const out: Punto[] = [];
    Object.entries(VOTO_MORENA_2021_POR_DISTRITO).forEach(([d, v]) => {
      const dist = Number(d);
      const slot = acum.get(dist);
      if (!slot) return;
      const escolaridad = slot.esc.length
        ? slot.esc.reduce((a, b) => a + b, 0) / slot.esc.length
        : 0;
      const sinAcceso = slot.sin.length
        ? slot.sin.reduce((a, b) => a + b, 0) / slot.sin.length
        : 0;
      out.push({
        distrito: dist,
        votoMorena: v,
        participacion: partPorDistrito.get(dist) ?? 0,
        escolaridad,
        sinAcceso,
        poblacion: slot.pob,
      });
    });
    return out;
  }, [censo, catalogoReady]);

  const ejeConfig = {
    escolaridad: {
      label: "Grado promedio de escolaridad",
      key: "escolaridad" as const,
      domain: [5, 12] as [number, number],
      explica:
        "Hipótesis clásica: a mayor escolaridad, menor voto a partidos populistas. Verifica si en Michoacán se cumple.",
    },
    sinAcceso: {
      label: "% sin acceso a servicios básicos",
      key: "sinAcceso" as const,
      domain: [0, 100] as [number, number],
      explica:
        "A mayor carencia, mayor voto a quien promete cambio. Si la curva sube → voto popular vinculado a marginación.",
    },
    participacion: {
      label: "% participación 2024 (dip. locales)",
      key: "participacion" as const,
      domain: [30, 75] as [number, number],
      explica:
        "Cruce político: participación reciente vs voto MORENA en 2021. Distritos donde MORENA arrasó pero la gente ya no sale = riesgo de desmovilización.",
    },
  } as const;

  const cfg = ejeConfig[eje];
  const xs = puntos.map((p) => p[cfg.key]);
  const ys = puntos.map((p) => p.votoMorena);
  const r = correlacion(xs, ys);

  return (
    <div className="space-y-4">
      <div>
        <div className="text-primary text-[10px] font-mono uppercase tracking-widest">
          Análisis cruzado
        </div>
        <h2 className="text-lg font-bold flex items-center gap-2">
          <GitCompareArrows className="w-5 h-5 text-primary" />
          Voto × Contexto socioeconómico
        </h2>
        <p className="text-xs text-muted-foreground mt-1 max-w-3xl">
          Cruza el % de voto a MORENA en gobernatura 2021 contra variables de contexto por distrito local.
          La correlación de Pearson (r) indica fuerza y dirección: cercano a +1 o -1 = relación fuerte; cercano a 0 = sin relación.
        </p>
      </div>

      <Tabs value={eje} onValueChange={(v) => setEje(v as any)}>
        <TabsList>
          <TabsTrigger value="escolaridad">Escolaridad</TabsTrigger>
          <TabsTrigger value="sinAcceso">Carencia servicios</TabsTrigger>
          <TabsTrigger value="participacion">Participación 2024</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card className="p-4 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-sm font-semibold">{cfg.label} vs % MORENA 2021</h3>
          <div className="text-xs font-mono">
            <span className="text-muted-foreground">r = </span>
            <span
              className={
                Math.abs(r) > 0.5
                  ? r > 0
                    ? "text-emerald-400 font-bold"
                    : "text-red-400 font-bold"
                  : "text-foreground"
              }
            >
              {fmt(r)}
            </span>
            <span className="text-muted-foreground ml-2">({puntos.length} distritos)</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={340}>
          <ScatterChart margin={{ left: 10, right: 20, top: 10, bottom: 30 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              type="number"
              dataKey={cfg.key}
              domain={cfg.domain}
              stroke="hsl(var(--muted-foreground))"
              fontSize={11}
              label={{
                value: cfg.label,
                position: "insideBottom",
                offset: -10,
                fill: "hsl(var(--muted-foreground))",
                fontSize: 11,
              }}
            />
            <YAxis
              type="number"
              dataKey="votoMorena"
              domain={[0, 100]}
              stroke="hsl(var(--muted-foreground))"
              fontSize={11}
              label={{
                value: "% MORENA 2021",
                angle: -90,
                position: "insideLeft",
                fill: "hsl(var(--muted-foreground))",
                fontSize: 11,
              }}
            />
            <ZAxis dataKey="poblacion" range={[40, 400]} />
            <Tooltip
              cursor={{ strokeDasharray: "3 3" }}
              contentStyle={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
              }}
              formatter={(v: number, name: string) => {
                if (name === "votoMorena") return [`${fmt(v)}%`, "MORENA 2021"];
                if (name === cfg.key) return [fmt(v), cfg.label];
                if (name === "poblacion") return [v.toLocaleString("es-MX"), "Población"];
                return [v, name];
              }}
              labelFormatter={(_, p: any) =>
                p?.[0]?.payload ? `Distrito local D${p[0].payload.distrito}` : ""
              }
            />
            <Scatter data={puntos} fill="hsl(var(--primary))" fillOpacity={0.7} />
          </ScatterChart>
        </ResponsiveContainer>
        <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/30 p-3 rounded">
          <Info className="w-3.5 h-3.5 mt-0.5 shrink-0 text-primary" />
          <span>{cfg.explica}</span>
        </div>
      </Card>

      <Card className="p-3 bg-muted/30">
        <p className="text-[11px] text-muted-foreground">
          <span className="text-primary font-mono">FUENTES:</span> IEM Michoacán (gubernatura 2021,
          dip. locales 2024), INEGI ECEG (censo socioeconómico por sección), catálogo INE
          sección→distrito local. Tamaño del punto = población del distrito.
        </p>
      </Card>
    </div>
  );
}

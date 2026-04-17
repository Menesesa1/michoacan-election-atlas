import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { GOBERNADOR_RESULTADOS, VOTO_MORENA_2021_POR_DISTRITO } from "@/data/locales/gobernador";
import { PARTIDO_COLOR, type PartidoSigla } from "@/data/locales/partidos";
import { Trophy, Users, TrendingUp, MapPin } from "lucide-react";

const fmt = (n: number) => new Intl.NumberFormat("es-MX").format(Math.round(n));
const pct = (n: number) => `${n.toFixed(1)}%`;
const colorCoalicion = (c: PartidoSigla[]) => PARTIDO_COLOR[c[0]] ?? PARTIDO_COLOR.OTRO;

export default function Gobernador() {
  const [anio, setAnio] = useState<"2015" | "2021">("2021");
  const r = useMemo(() => GOBERNADOR_RESULTADOS.find((g) => g.anio === Number(anio))!, [anio]);
  const dataChart = r.candidatos.map((c) => ({ ...c, name: c.nombre.split(" ").slice(0, 2).join(" ") }));

  const distritosData = useMemo(
    () =>
      Object.entries(VOTO_MORENA_2021_POR_DISTRITO)
        .map(([d, v]) => ({ distrito: `D${d.padStart(2, "0")}`, voto: v }))
        .sort((a, b) => b.voto - a.voto),
    [],
  );

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="text-primary text-[10px] font-mono uppercase tracking-widest">
            IEM · Cómputo oficial · Gubernatura
          </div>
          <h1 className="text-2xl font-bold text-foreground">Gobernador de Michoacán</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Resultados de elecciones constitucionales para Gobernador del Estado.
          </p>
        </div>
        <Tabs value={anio} onValueChange={(v) => setAnio(v as any)}>
          <TabsList>
            <TabsTrigger value="2015">2015 · Aureoles</TabsTrigger>
            <TabsTrigger value="2021">2021 · Ramírez Bedolla</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPI icon={Trophy} label="Ganador" value={r.ganador.split(" ").slice(0, 3).join(" ")} sub={`Margen ${pct(r.margenPct)}`} />
        <KPI icon={Users} label="Lista nominal" value={fmt(r.listaNominal)} />
        <KPI icon={TrendingUp} label="Participación" value={pct(r.participacionPct)} sub={`${fmt(r.votosTotales)} votos emitidos`} />
        <KPI icon={MapPin} label="Candidatos" value={String(r.candidatos.length)} sub="incluye coaliciones" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">Voto por candidato {anio}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dataChart} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={fmt} />
              <YAxis type="category" dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={10} width={120} />
              <Tooltip
                formatter={(v: number) => `${fmt(v)} votos`}
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
              />
              <Bar dataKey="votos">
                {dataChart.map((c, i) => (
                  <Cell key={i} fill={colorCoalicion(c.coalicion)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">% por candidato</h3>
          <div className="space-y-2.5">
            {r.candidatos.map((c) => (
              <div key={c.nombre}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-foreground truncate pr-2">
                    {c.nombre} <span className="text-muted-foreground">[{c.coalicion.join("-")}]</span>
                  </span>
                  <span className="font-mono text-foreground">{pct(c.porcentaje)}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${Math.min(100, c.porcentaje * 2)}%`, background: colorCoalicion(c.coalicion) }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {anio === "2021" && (
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-foreground mb-1">% Ramírez Bedolla por distrito local IEM</h3>
          <p className="text-xs text-muted-foreground mb-3">
            Distribución del voto del ganador en los 24 distritos locales (IEM/INE Distritación 2016).
          </p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={distritosData} margin={{ left: -10, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="distrito" stroke="hsl(var(--muted-foreground))" fontSize={10} angle={-45} textAnchor="end" height={50} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <Tooltip
                formatter={(v: number) => pct(v)}
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
              />
              <Bar dataKey="voto" fill={PARTIDO_COLOR.MORENA} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      <Card className="p-4 bg-muted/30">
        <p className="text-xs text-muted-foreground">
          <span className="text-primary font-mono">FUENTE:</span> IEM Michoacán · Cómputos oficiales constitucionales 2015 y 2021 · INE PREP.
          Coaliciones registradas en convenios IEM. Datos agregados estatales.
        </p>
      </Card>
    </div>
  );
}

function KPI({ icon: Icon, label, value, sub }: { icon: any; label: string; value: string; sub?: string }) {
  return (
    <Card className="p-3">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{label}</div>
          <div className="text-base font-bold text-foreground mt-1 truncate">{value}</div>
          {sub && <div className="text-[10px] text-muted-foreground mt-0.5 truncate">{sub}</div>}
        </div>
        <Icon className="w-4 h-4 text-primary mt-0.5 shrink-0" />
      </div>
    </Card>
  );
}

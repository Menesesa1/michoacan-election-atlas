import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  ANIOS_LOCALES, DIPUTADOS_LOCALES, composicionCongreso, ganadoresPorAnio,
  historicoDistrito, type AnioLocal,
} from "@/data/locales/diputados-locales";
import { PARTIDO_COLOR, type PartidoSigla } from "@/data/locales/partidos";
import { loadCatalogo, getDistritosLocales, infoDistritoLocal, type DistritoLocal } from "@/lib/secciones-catalogo";
import { Building, Vote, MapPin } from "lucide-react";
import { ComposicionTerritorial } from "@/components/ComposicionTerritorial";

export default function DiputadosLocales() {
  const [anio, setAnio] = useState<AnioLocal>(2024);
  const [distritos, setDistritos] = useState<DistritoLocal[]>([]);
  const [seleccionado, setSeleccionado] = useState<number | null>(null);

  useEffect(() => {
    loadCatalogo().then(() => setDistritos(getDistritosLocales())).catch(() => {});
  }, []);

  const ganadores = useMemo(() => ganadoresPorAnio(anio), [anio]);
  const composicion = useMemo(() => composicionCongreso(anio), [anio]);
  const totalEscanos = ganadores.length;
  const partidoLider = composicion[0];
  const participacionProm =
    ganadores.reduce((a, d) => a + d.participacionPct, 0) / Math.max(1, ganadores.length);

  const detalleSel = useMemo(
    () => (seleccionado ? historicoDistrito(seleccionado) : []),
    [seleccionado],
  );
  const infoSel = seleccionado ? infoDistritoLocal(seleccionado) : null;

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="text-primary text-[10px] font-mono uppercase tracking-widest">
            IEM · Congreso del Estado · Mayoría Relativa
          </div>
          <h1 className="text-2xl font-bold text-foreground">Diputados Locales</h1>
          <p className="text-sm text-muted-foreground mt-1">
            24 distritos electorales locales · Distritación INE 2016 · 4 procesos electorales
          </p>
        </div>
        <Tabs value={String(anio)} onValueChange={(v) => setAnio(Number(v) as AnioLocal)}>
          <TabsList>
            {ANIOS_LOCALES.map((a) => (
              <TabsTrigger key={a} value={String(a)}>{a}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPI icon={Building} label="Curules MR" value={String(totalEscanos)} sub="Distritos de mayoría" />
        <KPI icon={Vote} label="Partido líder" value={partidoLider?.partido ?? "—"} sub={`${partidoLider?.escanos ?? 0} curules`} />
        <KPI icon={MapPin} label="Participación promedio" value={`${participacionProm.toFixed(1)}%`} />
        <KPI icon={Building} label="Partidos con escaños" value={String(composicion.length)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="p-4 lg:col-span-1">
          <h3 className="text-sm font-semibold text-foreground mb-3">Composición {anio}</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={composicion} layout="vertical" margin={{ left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <YAxis type="category" dataKey="partido" stroke="hsl(var(--muted-foreground))" fontSize={11} width={70} />
              <Tooltip
                formatter={(v: number) => `${v} curules`}
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
              />
              <Bar dataKey="escanos">
                {composicion.map((c, i) => (
                  <Cell key={i} fill={PARTIDO_COLOR[c.partido as PartidoSigla] ?? PARTIDO_COLOR.OTRO} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-4 lg:col-span-2">
          <h3 className="text-sm font-semibold text-foreground mb-3">
            Ganadores {anio} por distrito (24 MR · clic para ver historial)
          </h3>
          <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-card z-10">
                <TableRow>
                  <TableHead>Distrito</TableHead>
                  <TableHead>Cabecera</TableHead>
                  <TableHead>Ganador</TableHead>
                  <TableHead className="text-right">Votos</TableHead>
                  <TableHead className="text-right">Particip.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ganadores.map((d) => {
                  const info = distritos.find((x) => x.distrito === d.distrito);
                  return (
                    <TableRow
                      key={d.distrito}
                      className={`cursor-pointer ${seleccionado === d.distrito ? "bg-accent/40" : ""}`}
                      onClick={() => setSeleccionado(d.distrito)}
                    >
                      <TableCell className="font-mono">D{String(d.distrito).padStart(2, "0")}</TableCell>
                      <TableCell className="text-xs">{info?.cabecera ?? "—"}</TableCell>
                      <TableCell>
                        <Badge style={{ background: PARTIDO_COLOR[d.ganador], color: "white" }}>{d.ganador}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs">
                        {new Intl.NumberFormat("es-MX").format(d.votosGanador)}
                      </TableCell>
                      <TableCell className="text-right text-xs">{d.participacionPct.toFixed(1)}%</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>

      {seleccionado && infoSel && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                D{String(seleccionado).padStart(2, "0")} · {infoSel.cabecera}
              </h3>
              <p className="text-xs text-muted-foreground">
                Municipios: {infoSel.municipios.join(", ")} · {infoSel.num_secciones} secciones
              </p>
            </div>
            <button
              onClick={() => setSeleccionado(null)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              ✕ cerrar
            </button>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {detalleSel.map((d) => (
              <div key={d.anio} className="border border-border rounded-md p-2.5">
                <div className="text-[10px] font-mono text-muted-foreground">{d.anio}</div>
                <Badge style={{ background: PARTIDO_COLOR[d.ganador], color: "white" }} className="mt-1">
                  {d.ganador}
                </Badge>
                <div className="text-[10px] text-muted-foreground mt-1.5">
                  {new Intl.NumberFormat("es-MX").format(d.votosGanador)} votos · {d.participacionPct.toFixed(1)}% participación
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {seleccionado && infoSel && (
        <ComposicionTerritorial
          titulo={`D${String(seleccionado).padStart(2, "0")} · ${infoSel.cabecera}`}
          subtitulo={`Distrito local IEM · Municipios: ${infoSel.municipios.join(", ")}`}
          secciones={infoSel.secciones}
        />
      )}

      <Card className="p-4 bg-muted/30">
        <p className="text-xs text-muted-foreground">
          <span className="text-primary font-mono">FUENTE:</span> IEM Michoacán · Cómputos distritales LXXIII (2015), LXXIV (2018), LXXV (2021), LXXVI (2024) ·
          Distritación local INE 2016 ({DIPUTADOS_LOCALES.length} resultados, 24 distritos × 4 procesos).
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

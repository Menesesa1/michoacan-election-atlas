import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { loadECEG, resumir, agruparPor, type SeccionCenso, type GrupoCenso } from "@/lib/eceg-loader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Database, GraduationCap, Home, Users, Wifi, Briefcase } from "lucide-react";
import { EleccionTerritorioSelector } from "@/components/EleccionTerritorioSelector";
import type { TerritorioResuelto } from "@/lib/territorio-cruzado";

const fmt = (n: number) => new Intl.NumberFormat("es-MX").format(Math.round(n));
const pct = (n: number) => `${n.toFixed(1)}%`;

export default function Socioeconomico() {
  const [data, setData] = useState<SeccionCenso[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filtro, setFiltro] = useState("");
  const [territorio, setTerritorio] = useState<TerritorioResuelto | null>(null);

  useEffect(() => {
    loadECEG()
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);

  // Filtra el dataset al territorio seleccionado (suma de secciones del catálogo INE).
  const dataFiltrada = useMemo<SeccionCenso[] | null>(() => {
    if (!data) return null;
    if (!territorio || territorio.tipo === "gobernador") return data;
    return data.filter((r) => territorio.secciones.has(Number(r.seccion)));
  }, [data, territorio]);

  const resumen = useMemo(() => (dataFiltrada ? resumir(dataFiltrada) : null), [dataFiltrada]);
  const porMunicipio = useMemo<GrupoCenso[]>(() => (dataFiltrada ? agruparPor(dataFiltrada, "municipio") : []), [dataFiltrada]);
  const porDistrito = useMemo<GrupoCenso[]>(() => (dataFiltrada ? agruparPor(dataFiltrada, "distrito") : []), [dataFiltrada]);
  const porDistritoLocal = useMemo<GrupoCenso[]>(() => (dataFiltrada ? agruparPor(dataFiltrada, "distritoLocal") : []), [dataFiltrada]);

  const seccionesFiltradas = useMemo(() => {
    if (!data) return [];
    const q = filtro.trim();
    const base = q ? data.filter((r) => String(r.seccion).includes(q)) : data;
    return base.slice(0, 50);
  }, [data, filtro]);

  const piramide = useMemo(() => {
    if (!resumen) return [];
    return [
      { grupo: "0-14", H: resumen.POB0_14 / 2, M: -resumen.POB0_14 / 2 },
      { grupo: "15-64", H: resumen.POB15_64 / 2, M: -resumen.POB15_64 / 2 },
      { grupo: "65+", H: resumen.POB65_MA / 2, M: -resumen.POB65_MA / 2 },
    ];
  }, [resumen]);

  const religion = useMemo(() => {
    if (!resumen) return [];
    return [
      { name: "Católica", value: resumen.pctCatolica },
      { name: "No católica", value: resumen.pctNoCatolica },
      { name: "Sin religión", value: resumen.pctSinReligion },
    ];
  }, [resumen]);

  if (error) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-foreground">Socioeconómico</h1>
        <Card className="p-6 text-destructive">Error: {error}</Card>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <div className="text-primary text-[10px] font-mono uppercase tracking-widest">
          INEGI · Censo 2020 · ECEG
        </div>
        <h1 className="text-2xl font-bold text-foreground">Perfil socioeconómico Michoacán</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {resumen
            ? `${fmt(resumen.totalSecciones)} secciones electorales · ${fmt(resumen.POBTOT)} habitantes · 192 indicadores censales`
            : "Cargando dataset INEGI..."}
        </p>
      </div>

      {!resumen ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KPI icon={Users} label="Población total" value={fmt(resumen.POBTOT)} sub={`${fmt(resumen.POB18YMAS)} mayores 18`} />
            <KPI icon={GraduationCap} label="Escolaridad promedio" value={`${resumen.graProEscolaridad.toFixed(1)} años`} sub={`${pct(resumen.pctPostBasica)} con postbásica`} />
            <KPI icon={Briefcase} label="Tasa ocupación" value={pct(resumen.pctOcupacion)} sub={`${pct(resumen.pctDesocupacion)} desocupada`} />
            <KPI icon={Home} label="Hogares jefatura ♀" value={pct(resumen.pctHogJefFemenina)} sub={`${pct(resumen.pctHablaLenguaIndigena)} habla lengua indígena`} />
            <KPI icon={Wifi} label="Viviendas con internet" value={pct(resumen.pctVivConInternet)} sub={`${pct(resumen.pctVivConCelular)} con celular`} />
            <KPI icon={Home} label="Viviendas c/ servicios" value={pct(resumen.pctVivConServicios)} sub={`${pct(resumen.pctVivConAuto)} con auto`} />
            <KPI icon={Database} label="Sin derechohabiencia" value={pct(resumen.pctSinDerechohabiencia)} sub="salud pública" />
            <KPI icon={GraduationCap} label="Analfabetismo 15+" value={pct(resumen.pctAnalfabetismo)} sub="población vulnerable" />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="p-4">
              <h3 className="text-sm font-semibold text-foreground mb-3">Estructura etaria estatal</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={piramide} layout="vertical" stackOffset="sign">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tickFormatter={(v) => fmt(Math.abs(v))} stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis type="category" dataKey="grupo" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <Tooltip formatter={(v: number) => fmt(Math.abs(v))} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                  <Bar dataKey="M" fill="hsl(var(--primary))" name="Mujeres" />
                  <Bar dataKey="H" fill="hsl(var(--accent))" name="Hombres" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
            <Card className="p-4">
              <h3 className="text-sm font-semibold text-foreground mb-3">Composición religiosa</h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={religion} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80} label={(e: any) => `${e.name}: ${e.value.toFixed(1)}%`}>
                    {religion.map((_, i) => (
                      <Cell key={i} fill={["hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--muted-foreground))"][i]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => `${v.toFixed(1)}%`} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </div>

          {/* Tabs: Municipios / Distritos locales / Distritos federales / Secciones */}
          <Tabs defaultValue="municipios" className="w-full">
            <TabsList className="flex-wrap h-auto">
              <TabsTrigger value="municipios">Municipios ({porMunicipio.length})</TabsTrigger>
              <TabsTrigger value="distritosLocales">Distritos locales IEM ({porDistritoLocal.length})</TabsTrigger>
              <TabsTrigger value="distritos">Distritos federales ({porDistrito.length})</TabsTrigger>
              <TabsTrigger value="secciones">Secciones ({fmt(data!.length)})</TabsTrigger>
            </TabsList>

            <TabsContent value="municipios">
              <Card className="p-4">
                <h3 className="text-sm font-semibold text-foreground mb-3">Perfil por municipio (113 municipios INEGI)</h3>
                <GrupoTable grupos={porMunicipio} colName="Municipio" />
              </Card>
            </TabsContent>

            <TabsContent value="distritosLocales">
              <Card className="p-4">
                <h3 className="text-sm font-semibold text-foreground mb-3">
                  Perfil por distrito local (24 distritos · IEM/INE Distritación 2016)
                </h3>
                <p className="text-xs text-muted-foreground mb-3">
                  Base territorial para análisis de Diputados Locales y campañas IEM. Cabecera + municipios integrantes según D16.pdf INE.
                </p>
                <GrupoTable grupos={porDistritoLocal} colName="Distrito local" />
              </Card>
            </TabsContent>

            <TabsContent value="distritos">
              <Card className="p-4">
                <h3 className="text-sm font-semibold text-foreground mb-3">Perfil por distrito federal (cartografía INE 2022)</h3>
                <GrupoTable grupos={porDistrito} colName="Distrito" />
              </Card>
            </TabsContent>

            <TabsContent value="secciones">
              <Card className="p-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Detalle por sección electoral</h3>
                    <p className="text-xs text-muted-foreground">Mostrando primeras 50 de {fmt(data!.length)} secciones</p>
                  </div>
                  <Input
                    placeholder="Filtrar por número de sección..."
                    value={filtro}
                    onChange={(e) => setFiltro(e.target.value)}
                    className="md:w-64"
                  />
                </div>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Sección</TableHead>
                        <TableHead className="text-right">Población</TableHead>
                        <TableHead className="text-right">18+</TableHead>
                        <TableHead className="text-right">Escolaridad</TableHead>
                        <TableHead className="text-right">% Internet</TableHead>
                        <TableHead className="text-right">% Auto</TableHead>
                        <TableHead className="text-right">% Sin SS</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {seccionesFiltradas.map((r) => {
                        const tviv = Number(r.TVIVHAB) || 1;
                        return (
                          <TableRow key={r.seccion}>
                            <TableCell className="font-mono">{r.seccion}</TableCell>
                            <TableCell className="text-right">{fmt(r.POBTOT)}</TableCell>
                            <TableCell className="text-right">{fmt(r.P_18YMAS)}</TableCell>
                            <TableCell className="text-right">{Number(r.GRAPROES).toFixed(1)}</TableCell>
                            <TableCell className="text-right">{((Number(r.VPH_INTER) / tviv) * 100).toFixed(1)}%</TableCell>
                            <TableCell className="text-right">{((Number(r.VPH_AUTOM) / tviv) * 100).toFixed(1)}%</TableCell>
                            <TableCell className="text-right">{((Number(r.PSINDER) / Math.max(1, Number(r.POBTOT))) * 100).toFixed(1)}%</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            </TabsContent>
          </Tabs>

          <Card className="p-4 bg-muted/30">
            <p className="text-xs text-muted-foreground">
              <span className="text-primary font-mono">FUENTES:</span> INEGI · ECEG Censo 2020 (192 indicadores × 2,694 secciones) ·
              INE · Catálogo de secciones <code className="text-foreground/80">SECCION.dbf</code> (113 municipios + 12 distritos federales) ·
              INE · Descriptivo Distritación Local 2016 <code className="text-foreground/80">D16.pdf</code> (24 distritos locales IEM con cabecera y municipios integrantes).
            </p>
          </Card>
        </>
      )}
    </div>
  );
}

function KPI({ icon: Icon, label, value, sub }: { icon: any; label: string; value: string; sub?: string }) {
  return (
    <Card className="p-3">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{label}</div>
          <div className="text-xl font-bold text-foreground mt-1">{value}</div>
          {sub && <div className="text-[10px] text-muted-foreground mt-0.5">{sub}</div>}
        </div>
        <Icon className="w-4 h-4 text-primary mt-0.5" />
      </div>
    </Card>
  );
}

function GrupoTable({ grupos, colName }: { grupos: GrupoCenso[]; colName: string }) {
  return (
    <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
      <Table>
        <TableHeader className="sticky top-0 bg-card z-10">
          <TableRow>
            <TableHead>{colName}</TableHead>
            <TableHead className="text-right">Secciones</TableHead>
            <TableHead className="text-right">Población</TableHead>
            <TableHead className="text-right">Escolaridad</TableHead>
            <TableHead className="text-right">% Postbásica</TableHead>
            <TableHead className="text-right">% Ocupación</TableHead>
            <TableHead className="text-right">% Internet</TableHead>
            <TableHead className="text-right">% Sin SS</TableHead>
            <TableHead className="text-right">% Lengua ind.</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {grupos.map((g) => (
            <TableRow key={g.clave}>
              <TableCell className="font-medium">{g.nombre}</TableCell>
              <TableCell className="text-right font-mono text-xs">{g.numSecciones}</TableCell>
              <TableCell className="text-right">{fmt(g.resumen.POBTOT)}</TableCell>
              <TableCell className="text-right">{g.resumen.graProEscolaridad.toFixed(1)}</TableCell>
              <TableCell className="text-right">{pct(g.resumen.pctPostBasica)}</TableCell>
              <TableCell className="text-right">{pct(g.resumen.pctOcupacion)}</TableCell>
              <TableCell className="text-right">{pct(g.resumen.pctVivConInternet)}</TableCell>
              <TableCell className="text-right">{pct(g.resumen.pctSinDerechohabiencia)}</TableCell>
              <TableCell className="text-right">{pct(g.resumen.pctHablaLenguaIndigena)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

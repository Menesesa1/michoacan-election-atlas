import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Scale, Users2, Building, Vote, AlertTriangle, CheckCircle2, HelpCircle } from "lucide-react";
import {
  ayuntamientosConGenero,
  diputadosConGenero,
  historicoMunicipioConGenero,
  historicoDistritoConGenero,
  sugerenciaParidadMunicipio,
  sugerenciaParidadDistrito,
  setOverrideGenero,
  type AyuntamientoConGenero,
  type DiputadoConGenero,
} from "@/lib/paridad/historico-genero";
import { MUNICIPIOS_MICHOACAN_113 } from "@/data/locales/municipios-catalogo";
import type { Genero } from "@/lib/paridad/inferir-genero";
import { ImportadorGanadoresCSV } from "@/components/paridad/ImportadorGanadoresCSV";
import ValidadorPlanilla from "@/components/paridad/ValidadorPlanilla";
import PrecargaGeneroDiputados from "@/components/paridad/PrecargaGeneroDiputados";

function GeneroBadge({ genero, confianza }: { genero: Genero; confianza?: "alta" | "media" | "baja" }) {
  if (genero === "M") {
    return (
      <Badge className="bg-pink-500/15 text-pink-400 border-pink-500/40 hover:bg-pink-500/20">
        ♀ Mujer{confianza && confianza !== "alta" ? ` (${confianza})` : ""}
      </Badge>
    );
  }
  if (genero === "H") {
    return (
      <Badge className="bg-blue-500/15 text-blue-400 border-blue-500/40 hover:bg-blue-500/20">
        ♂ Hombre{confianza && confianza !== "alta" ? ` (${confianza})` : ""}
      </Badge>
    );
  }
  return (
    <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/40 hover:bg-amber-500/20">
      <HelpCircle className="w-3 h-3 mr-1" /> Por revisar
    </Badge>
  );
}

function GeneroEditor({
  current,
  onChange,
}: {
  current: Genero;
  onChange: (g: Genero | null) => void;
}) {
  return (
    <Select
      value={current === "ambiguo" ? "ambiguo" : current}
      onValueChange={(v) => onChange(v === "ambiguo" ? null : (v as Genero))}
    >
      <SelectTrigger className="h-7 w-[110px] text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="M">♀ Mujer</SelectItem>
        <SelectItem value="H">♂ Hombre</SelectItem>
        <SelectItem value="ambiguo">Sin definir</SelectItem>
      </SelectContent>
    </Select>
  );
}

export default function ParidadGenero() {
  const [refresh, setRefresh] = useState(0);
  const [filtro, setFiltro] = useState("");
  const reload = () => setRefresh((v) => v + 1);

  const ayuntamientos = useMemo<AyuntamientoConGenero[]>(
    () => ayuntamientosConGenero(),
    [refresh],
  );
  const diputados = useMemo<DiputadoConGenero[]>(() => diputadosConGenero(), [refresh]);

  const filtroLow = filtro.toLowerCase();
  const aytoFiltrados = ayuntamientos.filter(
    (a) =>
      a.municipio.toLowerCase().includes(filtroLow) ||
      a.presidente.toLowerCase().includes(filtroLow),
  );
  const dipFiltrados = diputados.filter((d) =>
    `distrito ${d.distrito} ${d.ganador}`.toLowerCase().includes(filtroLow),
  );

  // KPIs
  const totalAyto = ayuntamientos.length;
  const aytoMujer = ayuntamientos.filter((a) => a.genero === "M").length;
  const aytoHombre = ayuntamientos.filter((a) => a.genero === "H").length;
  const aytoAmbiguo = ayuntamientos.filter((a) => a.genero === "ambiguo").length;
  const dipPorDefinir = diputados.filter((d) => d.genero === "ambiguo").length;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Scale className="w-7 h-7 text-primary" />
            Paridad de género 2027
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-3xl">
            Análisis del género histórico de las candidaturas ganadoras en Michoacán y motor de
            sugerencia de paridad para postulaciones del proceso 2026-2027 (ayuntamientos,
            diputaciones locales). Las inferencias por nombre se marcan con su nivel de confianza
            y se pueden corregir manualmente.
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-4">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Ayuntamientos en base</div>
            <div className="text-2xl font-bold">{totalAyto}</div>
            <div className="text-[11px] text-muted-foreground">2015 · 2018 · 2021</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-[10px] uppercase tracking-wider text-pink-400">♀ Ganadas por mujer</div>
            <div className="text-2xl font-bold">{aytoMujer}</div>
            <div className="text-[11px] text-muted-foreground">{((aytoMujer / Math.max(totalAyto, 1)) * 100).toFixed(1)}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-[10px] uppercase tracking-wider text-blue-400">♂ Ganadas por hombre</div>
            <div className="text-2xl font-bold">{aytoHombre}</div>
            <div className="text-[11px] text-muted-foreground">{((aytoHombre / Math.max(totalAyto, 1)) * 100).toFixed(1)}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-[10px] uppercase tracking-wider text-amber-400">Por revisar</div>
            <div className="text-2xl font-bold">{aytoAmbiguo + dipPorDefinir}</div>
            <div className="text-[11px] text-muted-foreground">
              {aytoAmbiguo} aytos · {dipPorDefinir} dip.
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-2">
        <Input
          placeholder="Filtrar municipio, distrito o nombre…"
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          className="max-w-md"
        />
      </div>

      <ImportadorGanadoresCSV onImported={reload} />

      <Tabs defaultValue="ayuntamientos">
        <TabsList>
          <TabsTrigger value="ayuntamientos">
            <Building className="w-4 h-4 mr-1" /> Ayuntamientos
          </TabsTrigger>
          <TabsTrigger value="diputados">
            <Vote className="w-4 h-4 mr-1" /> Diputados locales
          </TabsTrigger>
          <TabsTrigger value="sugerencias">
            <Users2 className="w-4 h-4 mr-1" /> Sugerencias 2027
          </TabsTrigger>
          <TabsTrigger value="validador">
            <Scale className="w-4 h-4 mr-1" /> Validador IEM
          </TabsTrigger>
        </TabsList>

        {/* Tab Ayuntamientos */}
        <TabsContent value="ayuntamientos" className="space-y-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Ganadores municipales — género inferido</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="text-left py-2 px-2">Año</th>
                    <th className="text-left py-2 px-2">Municipio</th>
                    <th className="text-left py-2 px-2">Presidente/a</th>
                    <th className="text-left py-2 px-2">Partido</th>
                    <th className="text-left py-2 px-2">Género detectado</th>
                    <th className="text-left py-2 px-2">Origen</th>
                    <th className="text-left py-2 px-2">Editar</th>
                  </tr>
                </thead>
                <tbody>
                  {aytoFiltrados.map((a) => (
                    <tr key={a.overrideKey} className="border-b border-border/40 hover:bg-muted/30">
                      <td className="py-2 px-2 font-mono">{a.anio}</td>
                      <td className="py-2 px-2">{a.municipio}</td>
                      <td className="py-2 px-2">{a.presidente}</td>
                      <td className="py-2 px-2">
                        <Badge variant="outline" className="text-[10px]">
                          {a.partidoGanador}
                        </Badge>
                      </td>
                      <td className="py-2 px-2">
                        <GeneroBadge genero={a.genero} confianza={a.generoConfianza} />
                      </td>
                      <td className="py-2 px-2 text-[11px] text-muted-foreground">
                        {a.generoOverridden ? "Manual" : a.generoBasadoEn}
                      </td>
                      <td className="py-2 px-2">
                        <GeneroEditor
                          current={a.genero}
                          onChange={(g) => {
                            setOverrideGenero(a.overrideKey, g);
                            reload();
                          }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Diputados */}
        <TabsContent value="diputados" className="space-y-3">
          <PrecargaGeneroDiputados onDone={reload} />
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Ganadores por distrito local — definir género manualmente</CardTitle>
              <p className="text-xs text-muted-foreground">
                El dataset de diputados locales no incluye nombre del candidato. Captura el género
                del ganador histórico para que el motor de paridad pueda sugerir postulación 2027.
              </p>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="text-left py-2 px-2">Año</th>
                    <th className="text-left py-2 px-2">Distrito</th>
                    <th className="text-left py-2 px-2">Partido ganador</th>
                    <th className="text-left py-2 px-2">% ganador</th>
                    <th className="text-left py-2 px-2">Género</th>
                    <th className="text-left py-2 px-2">Captura</th>
                  </tr>
                </thead>
                <tbody>
                  {dipFiltrados.map((d) => (
                    <tr key={d.overrideKey} className="border-b border-border/40 hover:bg-muted/30">
                      <td className="py-2 px-2 font-mono">{d.anio}</td>
                      <td className="py-2 px-2">Distrito {d.distrito}</td>
                      <td className="py-2 px-2">
                        <Badge variant="outline" className="text-[10px]">
                          {d.ganador}
                        </Badge>
                      </td>
                      <td className="py-2 px-2 font-mono text-xs">{d.porcentajeGanador.toFixed(1)}%</td>
                      <td className="py-2 px-2">
                        <GeneroBadge genero={d.genero} />
                      </td>
                      <td className="py-2 px-2">
                        <GeneroEditor
                          current={d.genero}
                          onChange={(g) => {
                            setOverrideGenero(d.overrideKey, g);
                            reload();
                          }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Sugerencias */}
        <TabsContent value="sugerencias" className="space-y-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Sugerencia de género 2027 — 113 municipios</CardTitle>
              <p className="text-xs text-muted-foreground">
                Aplicación de reglas IEM: alternancia interna por partido, paridad horizontal en
                bloques de alta competitividad, y equilibrio sugerido en bloques medios/bajos.
                Los municipios sin histórico capturado quedan marcados como "por definir" — sirven
                para registrar prospectos y luego enriquecer datos.
              </p>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="text-left py-2 px-2">Municipio</th>
                    <th className="text-left py-2 px-2">2018</th>
                    <th className="text-left py-2 px-2">2021</th>
                    <th className="text-left py-2 px-2">Bloque</th>
                    <th className="text-left py-2 px-2">Sugerencia 2027</th>
                    <th className="text-left py-2 px-2">Motivo</th>
                  </tr>
                </thead>
                <tbody>
                  {MUNICIPIOS_MICHOACAN_113.filter((m) =>
                    m.nombre.toLowerCase().includes(filtroLow),
                  ).map((m) => {
                    const hist = historicoMunicipioConGenero(m.clave);
                    const s = sugerenciaParidadMunicipio(m.clave);
                    const niv =
                      s.confianza === "alta"
                        ? "ok"
                        : s.confianza === "media"
                        ? "advertencia"
                        : "info";
                    return (
                      <tr key={m.clave} className="border-b border-border/40 hover:bg-muted/30">
                        <td className="py-2 px-2 font-medium">{m.nombre}</td>
                        <td className="py-2 px-2">
                          {(() => {
                            const h = hist.find((x) => x.anio === 2018);
                            return h ? <GeneroBadge genero={h.genero} /> : <span className="text-muted-foreground">—</span>;
                          })()}
                        </td>
                        <td className="py-2 px-2">
                          {(() => {
                            const h = hist.find((x) => x.anio === 2021);
                            return h ? <GeneroBadge genero={h.genero} /> : <span className="text-muted-foreground">—</span>;
                          })()}
                        </td>
                        <td className="py-2 px-2">
                          <Badge variant="outline" className="text-[10px] uppercase">
                            {s.bloqueCompetitividad}
                          </Badge>
                        </td>
                        <td className="py-2 px-2">
                          <GeneroBadge genero={s.generoSugerido} confianza={s.confianza} />
                        </td>
                        <td className="py-2 px-2 text-[11px] text-muted-foreground max-w-md">
                          <div className="flex items-start gap-1">
                            {niv === "ok" ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                            ) : niv === "advertencia" ? (
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                            ) : (
                              <HelpCircle className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                            )}
                            <span>{s.motivo}</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Sugerencia 2027 — Distritos locales</CardTitle>
              <p className="text-xs text-muted-foreground">
                Requiere captura de género histórico en la pestaña anterior para producir sugerencias confiables.
              </p>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="text-left py-2 px-2">Distrito</th>
                    <th className="text-left py-2 px-2">2018</th>
                    <th className="text-left py-2 px-2">2021</th>
                    <th className="text-left py-2 px-2">2024</th>
                    <th className="text-left py-2 px-2">Bloque</th>
                    <th className="text-left py-2 px-2">Sugerencia</th>
                    <th className="text-left py-2 px-2">Motivo</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 24 }, (_, i) => i + 1).map((dist) => {
                    const hist = historicoDistritoConGenero(dist);
                    const s = sugerenciaParidadDistrito(dist);
                    return (
                      <tr key={dist} className="border-b border-border/40 hover:bg-muted/30">
                        <td className="py-2 px-2 font-medium">D{dist}</td>
                        {[2018, 2021, 2024].map((y) => {
                          const h = hist.find((x) => x.anio === y);
                          return (
                            <td key={y} className="py-2 px-2">
                              {h ? <GeneroBadge genero={h.genero} /> : <span className="text-muted-foreground">—</span>}
                            </td>
                          );
                        })}
                        <td className="py-2 px-2">
                          <Badge variant="outline" className="text-[10px] uppercase">
                            {s.bloqueCompetitividad}
                          </Badge>
                        </td>
                        <td className="py-2 px-2">
                          <GeneroBadge genero={s.generoSugerido} confianza={s.confianza} />
                        </td>
                        <td className="py-2 px-2 text-[11px] text-muted-foreground max-w-sm">{s.motivo}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Validador IEM */}
        <TabsContent value="validador" className="space-y-3">
          <ValidadorPlanilla />
        </TabsContent>
      </Tabs>
    </div>
  );
}

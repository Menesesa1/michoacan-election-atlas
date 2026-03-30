import { useState, useRef, useEffect } from "react";
import { Upload, Users, BarChart3, Info, CheckCircle2, AlertCircle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Legend, CartesianGrid, ComposedChart, Line } from "recharts";
import { parseDemographicCsv, type DemographicParseResult } from "@/lib/demographic-parser";
import type { DemograficoDistrito } from "@/data/demographic-types";
import { demograficosFederalesMock, demograficosLocalesMock } from "@/data/demographic-mock";
import { useElectoralData } from "@/context/DataContext";
import { useToast } from "@/hooks/use-toast";

export function DemografiaPanel() {
  const { nivel } = useElectoralData();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<DemographicParseResult | null>(null);
  const [selectedDist, setSelectedDist] = useState<number>(1);

  // Use imported data if available, otherwise use mock
  const distritos = data
    ? (nivel === "federal" ? data.distritosFed : data.distritosLoc)
    : (nivel === "federal" ? demograficosFederalesMock : demograficosLocalesMock);
  const selected = distritos.find(d => d.distritoId === selectedDist) || distritos[0] || null;

  // Reset selection when nivel changes
  useEffect(() => {
    const dists = data
      ? (nivel === "federal" ? data.distritosFed : data.distritosLoc)
      : (nivel === "federal" ? demograficosFederalesMock : demograficosLocalesMock);
    if (dists.length > 0 && !dists.find(d => d.distritoId === selectedDist)) {
      setSelectedDist(dists[0].distritoId);
    }
  }, [nivel, data, selectedDist]);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      const result = await parseDemographicCsv(file);
      setData(result);
      if (result.success) {
        toast({ title: "✅ Datos demográficos importados", description: `${result.stats.seccionesFound} secciones procesadas` });
        const dists = nivel === "federal" ? result.distritosFed : result.distritosLoc;
        if (dists.length > 0) setSelectedDist(dists[0].distritoId);
      } else {
        toast({ title: "Error", description: result.errors[0] || "No se pudieron procesar", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Error inesperado", variant: "destructive" });
    } finally {
      setLoading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  // Pyramid chart data
  const pyramidData = selected?.rangoEdad.map(r => ({
    rango: r.rango,
    hombres: -r.hombres,
    mujeres: r.mujeres,
    hombresAbs: r.hombres,
    mujeresAbs: r.mujeres,
    total: r.total,
  })).reverse() || [];

  const maxVal = pyramidData.reduce((m, d) => Math.max(m, Math.abs(d.hombres), d.mujeres), 0);

  return (
    <div className="glass-panel p-4 animate-slide-up space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-semibold text-foreground flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            Demografía Electoral — Lista Nominal
          </h3>
          <p className="text-[10px] text-muted-foreground font-mono">
            Padrón por edad y sexo · Secciones electorales · INE DERFE
          </p>
        </div>
      </div>

      {/* CSV upload option */}
      <div className="p-3 rounded-md bg-primary/5 border border-primary/20 text-[11px]">
        <div className="flex gap-2 items-center">
          <Info className="w-4 h-4 text-primary shrink-0" />
          <span className="text-muted-foreground">
            {data ? "✅ Datos importados del INE" : "Usando datos estimados. Importa CSV del INE para datos reales:"}
          </span>
          {!data && (
            <div className="relative ml-auto">
              <input ref={fileRef} type="file" accept=".csv" onChange={handleFile} className="absolute inset-0 opacity-0 cursor-pointer z-10 w-24" disabled={loading} />
              <span className="px-3 py-1 rounded bg-primary/20 text-primary text-[10px] font-mono cursor-pointer hover:bg-primary/30 transition-colors">
                {loading ? "Procesando..." : "Subir CSV"}
              </span>
            </div>
          )}
        </div>
      </div>

      {(!data || data.success) && distritos.length > 0 && (
        <>
          {/* Summary KPIs */}
          {(() => {
            const totalLN = distritos.reduce((s, d) => s + d.listaNominal, 0);
            const totalH = distritos.reduce((s, d) => s + d.hombres, 0);
            const totalM = distritos.reduce((s, d) => s + d.mujeres, 0);
            const pctH = totalLN > 0 ? ((totalH / totalLN) * 100).toFixed(1) : "0";
            const pctM = totalLN > 0 ? ((totalM / totalLN) * 100).toFixed(1) : "0";
            return (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <KPIBox label="Total Lista Nominal" value={totalLN.toLocaleString()} />
                  <KPIBox label="Secciones" value={distritos.reduce((s, d) => s + d.secciones, 0).toLocaleString()} />
                  <KPIBox label={`Hombres (${pctH}%)`} value={totalH.toLocaleString()} color="text-blue-400" />
                  <KPIBox label={`Mujeres (${pctM}%)`} value={totalM.toLocaleString()} color="text-pink-400" />
                </div>
                {/* Gender distribution bar */}
                <div className="p-3 rounded-md bg-secondary/30 border border-border/30 space-y-1.5">
                  <p className="text-[10px] text-muted-foreground font-mono">DISTRIBUCIÓN POR GÉNERO</p>
                  <div className="flex h-5 rounded-full overflow-hidden">
                    <div className="bg-blue-500 flex items-center justify-center" style={{ width: `${pctH}%` }}>
                      <span className="text-[9px] font-bold text-white">H {pctH}%</span>
                    </div>
                    <div className="bg-pink-500 flex items-center justify-center" style={{ width: `${pctM}%` }}>
                      <span className="text-[9px] font-bold text-white">M {pctM}%</span>
                    </div>
                  </div>
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>👨 {totalH.toLocaleString()} hombres</span>
                    <span>Ratio H/M: <span className="font-mono text-foreground">{totalM > 0 ? (totalH / totalM).toFixed(3) : "N/D"}</span></span>
                    <span>👩 {totalM.toLocaleString()} mujeres</span>
                  </div>
                </div>
              </>
            );
          })()}

          {/* District selector */}
          <div className="flex items-center gap-3">
            <label className="text-[10px] text-muted-foreground font-mono">DISTRITO:</label>
            <select
              value={selectedDist ?? ""}
              onChange={e => setSelectedDist(Number(e.target.value))}
              className="h-8 rounded-md border border-border bg-secondary/50 px-2 text-xs text-foreground"
            >
              {distritos.map(d => (
                <option key={d.distritoId} value={d.distritoId}>
                  {nivel === "federal" ? "D" : "L"}{d.distritoId} · {d.secciones} secciones · LN: {d.listaNominal.toLocaleString()}
                </option>
              ))}
            </select>
          </div>

          {/* Selected district details */}
          {selected && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Population Pyramid */}
              <div className="space-y-2">
                <h4 className="text-[11px] font-semibold text-foreground flex items-center gap-1.5">
                  <BarChart3 className="w-3.5 h-3.5 text-primary" />
                  Pirámide Poblacional — {nivel === "federal" ? "D" : "L"}{selected.distritoId}
                </h4>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={pyramidData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                    <XAxis type="number" domain={[-maxVal * 1.1, maxVal * 1.1]} tickFormatter={v => Math.abs(v).toLocaleString()} tick={{ fontSize: 9, fill: "hsl(215, 12%, 50%)" }} />
                    <YAxis type="category" dataKey="rango" tick={{ fontSize: 10, fill: "hsl(210, 20%, 80%)" }} width={40} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.[0]) return null;
                        const d = payload[0].payload;
                        return (
                          <div className="bg-popover border border-border rounded-md p-2 text-[11px] shadow-lg">
                            <p className="font-semibold text-foreground mb-1">{d.rango} años</p>
                            <p className="text-blue-400">Hombres: {d.hombresAbs.toLocaleString()}</p>
                            <p className="text-pink-400">Mujeres: {d.mujeresAbs.toLocaleString()}</p>
                            <p className="text-muted-foreground">Total: {d.total.toLocaleString()}</p>
                          </div>
                        );
                      }}
                    />
                    <Bar dataKey="hombres" fill="hsl(210, 90%, 50%)" radius={[4, 0, 0, 4]} />
                    <Bar dataKey="mujeres" fill="hsl(330, 70%, 55%)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-6 text-[10px]">
                  <span className="flex items-center gap-1"><span className="w-3 h-2 rounded bg-blue-500" /> Hombres</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-2 rounded bg-pink-500" /> Mujeres</span>
                </div>
              </div>

              {/* Demographics Table */}
              <div className="space-y-2">
                <h4 className="text-[11px] font-semibold text-foreground">Desglose por Rango de Edad</h4>
                <div className="overflow-auto max-h-[340px]">
                  <table className="w-full text-[11px]">
                    <thead className="sticky top-0 bg-card">
                      <tr className="text-muted-foreground font-mono text-[10px]">
                        <th className="text-left p-1.5">Rango</th>
                        <th className="text-right p-1.5">Hombres</th>
                        <th className="text-right p-1.5">Mujeres</th>
                        <th className="text-right p-1.5">Total</th>
                        <th className="text-right p-1.5">%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selected.rangoEdad.map(r => (
                        <tr key={r.rango} className="border-t border-border/30 hover:bg-secondary/30">
                          <td className="p-1.5 font-mono text-foreground">{r.rango}</td>
                          <td className="p-1.5 text-right text-blue-400">{r.hombres.toLocaleString()}</td>
                          <td className="p-1.5 text-right text-pink-400">{r.mujeres.toLocaleString()}</td>
                          <td className="p-1.5 text-right text-foreground font-medium">{r.total.toLocaleString()}</td>
                          <td className="p-1.5 text-right text-muted-foreground">
                            {selected.listaNominal > 0 ? ((r.total / selected.listaNominal) * 100).toFixed(1) : "0"}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-primary/30 font-semibold">
                        <td className="p-1.5 text-foreground">Total</td>
                        <td className="p-1.5 text-right text-blue-400">{selected.hombres.toLocaleString()}</td>
                        <td className="p-1.5 text-right text-pink-400">{selected.mujeres.toLocaleString()}</td>
                        <td className="p-1.5 text-right text-foreground">{selected.listaNominal.toLocaleString()}</td>
                        <td className="p-1.5 text-right text-muted-foreground">100%</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
                <div className="p-2 rounded bg-primary/5 border border-primary/20 text-[10px] text-muted-foreground">
                  <span className="text-primary font-medium">Población principal:</span>{" "}
                  <span className="text-foreground font-mono">{selected.poblacionPrincipal}</span> años ·{" "}
                  {selected.secciones} secciones ·{" "}
                  Ratio H/M: <span className="font-mono text-foreground">{selected.mujeres > 0 ? (selected.hombres / selected.mujeres).toFixed(2) : "N/D"}</span>
                </div>
              </div>
            </div>
          )}

          {/* Comparative gender chart across districts */}
          <div className="space-y-2">
            <h4 className="text-[11px] font-semibold text-foreground flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5 text-primary" />
              Comparativo de Género por Distrito
            </h4>
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart
                data={distritos.map(d => ({
                  name: `${nivel === "federal" ? "D" : "L"}${d.distritoId}`,
                  hombres: d.hombres,
                  mujeres: d.mujeres,
                  pctMujeres: d.listaNominal > 0 ? +((d.mujeres / d.listaNominal) * 100).toFixed(1) : 0,
                }))}
                margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(215, 12%, 20%)" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(215, 12%, 50%)" }} />
                <YAxis yAxisId="abs" tick={{ fontSize: 9, fill: "hsl(215, 12%, 50%)" }} tickFormatter={v => (v / 1000).toFixed(0) + "k"} />
                <YAxis yAxisId="pct" orientation="right" domain={[48, 56]} tick={{ fontSize: 9, fill: "hsl(330, 70%, 55%)" }} tickFormatter={v => v + "%"} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.[0]) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="bg-popover border border-border rounded-md p-2 text-[11px] shadow-lg">
                        <p className="font-semibold text-foreground mb-1">{d.name}</p>
                        <p className="text-blue-400">Hombres: {d.hombres.toLocaleString()}</p>
                        <p className="text-pink-400">Mujeres: {d.mujeres.toLocaleString()}</p>
                        <p className="text-muted-foreground">% Mujeres: {d.pctMujeres}%</p>
                      </div>
                    );
                  }}
                />
                <Bar yAxisId="abs" dataKey="hombres" fill="hsl(210, 90%, 50%)" radius={[3, 3, 0, 0]} barSize={nivel === "local" ? 10 : 18} />
                <Bar yAxisId="abs" dataKey="mujeres" fill="hsl(330, 70%, 55%)" radius={[3, 3, 0, 0]} barSize={nivel === "local" ? 10 : 18} />
                <Line yAxisId="pct" type="monotone" dataKey="pctMujeres" stroke="hsl(45, 90%, 55%)" strokeWidth={2} dot={{ r: 3, fill: "hsl(45, 90%, 55%)" }} name="% Mujeres" />
              </ComposedChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-6 text-[10px]">
              <span className="flex items-center gap-1"><span className="w-3 h-2 rounded bg-blue-500" /> Hombres</span>
              <span className="flex items-center gap-1"><span className="w-3 h-2 rounded bg-pink-500" /> Mujeres</span>
              <span className="flex items-center gap-1"><span className="w-3 h-2 rounded" style={{ background: "hsl(45, 90%, 55%)" }} /> % Mujeres</span>
            </div>
          </div>

          {/* Age-Gender heatmap table across districts */}
          <div className="space-y-2">
            <h4 className="text-[11px] font-semibold text-foreground flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-primary" />
              Distribución Edad × Género por Distrito
            </h4>
            <div className="overflow-auto max-h-[350px]">
              <table className="w-full text-[10px]">
                <thead className="sticky top-0 bg-card z-10">
                  <tr className="text-muted-foreground font-mono">
                    <th className="text-left p-1 sticky left-0 bg-card">Dto.</th>
                    {selected?.rangoEdad.map(r => (
                      <th key={r.rango} className="text-center p-1 whitespace-nowrap" colSpan={2}>{r.rango}</th>
                    ))}
                  </tr>
                  <tr className="text-[8px] text-muted-foreground/70 font-mono">
                    <th className="sticky left-0 bg-card"></th>
                    {selected?.rangoEdad.map(r => (
                      <React.Fragment key={r.rango}>
                        <th className="text-center p-0.5 text-blue-400">H</th>
                        <th className="text-center p-0.5 text-pink-400">M</th>
                      </React.Fragment>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {distritos.map(d => {
                    const maxCell = Math.max(...d.rangoEdad.map(r => Math.max(r.hombres, r.mujeres)));
                    return (
                      <tr key={d.distritoId} className={`border-t border-border/20 hover:bg-secondary/30 ${selectedDist === d.distritoId ? "bg-primary/10" : ""}`} onClick={() => setSelectedDist(d.distritoId)}>
                        <td className="p-1 font-mono font-semibold text-foreground sticky left-0 bg-card cursor-pointer">{nivel === "federal" ? "D" : "L"}{d.distritoId}</td>
                        {d.rangoEdad.map(r => {
                          const hIntensity = maxCell > 0 ? (r.hombres / maxCell) : 0;
                          const mIntensity = maxCell > 0 ? (r.mujeres / maxCell) : 0;
                          return (
                            <React.Fragment key={r.rango}>
                              <td className="p-0.5 text-center" style={{ background: `hsla(210, 90%, 50%, ${hIntensity * 0.4})` }}>
                                {r.hombres > 0 ? (r.hombres / 1000).toFixed(1) + "k" : "–"}
                              </td>
                              <td className="p-0.5 text-center" style={{ background: `hsla(330, 70%, 55%, ${mIntensity * 0.4})` }}>
                                {r.mujeres > 0 ? (r.mujeres / 1000).toFixed(1) + "k" : "–"}
                              </td>
                            </React.Fragment>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="text-[9px] text-muted-foreground">Intensidad del color = proporción relativa dentro del distrito. H = Hombres, M = Mujeres. Valores en miles.</p>
          </div>

          {/* All districts overview */}
          <div>
            <h4 className="text-[11px] font-semibold text-foreground mb-2">Resumen por Distrito — Lista Nominal</h4>
            <div className="overflow-auto max-h-[250px]">
              <table className="w-full text-[11px]">
                <thead className="sticky top-0 bg-card">
                  <tr className="text-muted-foreground font-mono text-[10px]">
                    <th className="text-left p-1.5">Dto.</th>
                    <th className="text-right p-1.5">LN Total</th>
                    <th className="text-right p-1.5">Hombres</th>
                    <th className="text-right p-1.5">Mujeres</th>
                    <th className="text-right p-1.5">% Mujeres</th>
                    <th className="text-right p-1.5">Secciones</th>
                    <th className="text-left p-1.5">Pob. Principal</th>
                  </tr>
                </thead>
                <tbody>
                  {distritos.map(d => (
                    <tr
                      key={d.distritoId}
                      className={`border-t border-border/30 cursor-pointer hover:bg-secondary/40 ${selectedDist === d.distritoId ? "bg-primary/10" : ""}`}
                      onClick={() => setSelectedDist(d.distritoId)}
                    >
                      <td className="p-1.5 font-mono font-semibold text-foreground">{nivel === "federal" ? "D" : "L"}{d.distritoId}</td>
                      <td className="p-1.5 text-right text-foreground">{d.listaNominal.toLocaleString()}</td>
                      <td className="p-1.5 text-right text-blue-400">{d.hombres.toLocaleString()}</td>
                      <td className="p-1.5 text-right text-pink-400">{d.mujeres.toLocaleString()}</td>
                      <td className="p-1.5 text-right text-muted-foreground font-mono">
                        {d.listaNominal > 0 ? ((d.mujeres / d.listaNominal) * 100).toFixed(1) : "0"}%
                      </td>
                      <td className="p-1.5 text-right text-muted-foreground">{d.secciones}</td>
                      <td className="p-1.5 text-foreground font-mono">{d.poblacionPrincipal}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {data && !data.success && (
        <div className="p-3 rounded-md border bg-accent/5 border-accent/20 text-[11px]">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-accent" />
            <span className="font-semibold text-accent">Error en importación</span>
          </div>
          {data.errors.map((e, i) => <p key={i} className="text-accent">❌ {e}</p>)}
          <div className="mt-2">
            <button onClick={() => setData(null)} className="text-primary text-[11px] hover:underline">Intentar de nuevo</button>
          </div>
        </div>
      )}
    </div>
  );
}

function KPIBox({ label, value, color = "text-foreground" }: { label: string; value: string; color?: string }) {
  return (
    <div className="p-3 rounded-md bg-secondary/30 border border-border/30">
      <p className="text-[10px] text-muted-foreground font-mono mb-0.5">{label}</p>
      <p className={`text-sm font-bold ${color}`}>{value}</p>
    </div>
  );
}

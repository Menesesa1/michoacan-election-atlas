import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AYUNTAMIENTOS, MUNICIPIOS_ESTRATEGICOS, historicoMunicipio,
} from "@/data/locales/ayuntamientos";
import { MUNICIPIOS_MICHOACAN_113 } from "@/data/locales/municipios-catalogo";
import { PARTIDO_COLOR, type PartidoSigla } from "@/data/locales/partidos";
import { ANIOS_LOCALES, type AnioLocal } from "@/data/locales/diputados-locales";
import { Building2, RotateCcw, TrendingUp, Users, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

const fmt = (n: number) => new Intl.NumberFormat("es-MX").format(Math.round(n));

const CLAVES_CON_HISTORICO = new Set(MUNICIPIOS_ESTRATEGICOS.map((m) => m.clave));

export default function Ayuntamientos() {
  const [seleccionado, setSeleccionado] = useState<number | null>(null);
  const [filtro, setFiltro] = useState("");

  // Universo COMPLETO: 113 municipios INEGI. Marcamos cuáles tienen histórico verificado.
  const universo = useMemo(() => {
    return MUNICIPIOS_MICHOACAN_113.map((m) => {
      const conHistorico = CLAVES_CON_HISTORICO.has(m.clave);
      const hist = conHistorico ? historicoMunicipio(m.clave) : [];
      let cambios = 0;
      for (let i = 1; i < hist.length; i++) {
        if (hist[i].partidoGanador !== hist[i - 1].partidoGanador) cambios++;
      }
      return { ...m, conHistorico, hist, cambios };
    }).sort((a, b) => b.poblacion - a.poblacion);
  }, []);

  const universoFiltrado = useMemo(() => {
    const q = filtro.trim().toLowerCase();
    if (!q) return universo;
    return universo.filter((m) => m.nombre.toLowerCase().includes(q));
  }, [universo, filtro]);

  const stats = useMemo(() => {
    const conHist = universo.filter((m) => m.conHistorico);
    const totalAlternancias = conHist.reduce((a, x) => a + x.cambios, 0);
    const continuos = conHist.filter((x) => x.cambios === 0).length;
    const poblacionTotal = universo.reduce((a, m) => a + m.poblacion, 0);
    const poblacionConHist = conHist.reduce((a, m) => a + m.poblacion, 0);
    return {
      totalAlternancias,
      continuos,
      poblacionTotal,
      poblacionConHist,
      conHist: conHist.length,
    };
  }, [universo]);

  // Composición por año (entre los que tienen histórico verificado)
  const composicionPorAnio = useMemo(() => {
    return ANIOS_LOCALES.map((anio) => {
      const filas = AYUNTAMIENTOS.filter((a) => a.anio === anio);
      const cnt = new Map<PartidoSigla, number>();
      for (const f of filas) cnt.set(f.partidoGanador, (cnt.get(f.partidoGanador) ?? 0) + 1);
      return { anio, partidos: Array.from(cnt.entries()).sort((a, b) => b[1] - a[1]) };
    });
  }, []);

  const detalle = seleccionado ? historicoMunicipio(seleccionado) : [];
  const muniSel = seleccionado
    ? MUNICIPIOS_MICHOACAN_113.find((m) => m.clave === seleccionado)
    : null;

  return (
    <div className="space-y-5">
      <div>
        <div className="text-primary text-[10px] font-mono uppercase tracking-widest">
          IEM · 113 municipios INEGI · Histórico verificado en {stats.conHist}
        </div>
        <h1 className="text-2xl font-bold text-foreground">Presidencias Municipales</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Universo completo: 113 ayuntamientos de Michoacán. Histórico de cómputos
          verificado en {stats.conHist} (cubre {((stats.poblacionConHist / stats.poblacionTotal) * 100).toFixed(0)}%
          de la población). El resto se carga vía importación CSV del IEM.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPI icon={Building2} label="Municipios totales" value="113" sub={`${stats.conHist} con histórico verificado`} />
        <KPI icon={RotateCcw} label="Alternancias verificadas" value={String(stats.totalAlternancias)} sub="cambios de partido 2015→2024" />
        <KPI icon={TrendingUp} label="Bastiones (sin alternancia)" value={String(stats.continuos)} sub={`de ${stats.conHist} con histórico`} />
        <KPI icon={Users} label="Población total" value={fmt(stats.poblacionTotal)} sub="habitantes (Censo 2020)" />
      </div>

      <Card className="p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3">Reparto por partido (municipios con histórico)</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {composicionPorAnio.map(({ anio, partidos }) => (
            <div key={anio} className="border border-border rounded-md p-3">
              <div className="text-[10px] font-mono text-muted-foreground mb-2">{anio}</div>
              <div className="space-y-1.5">
                {partidos.map(([p, n]) => (
                  <div key={p} className="flex items-center gap-2 text-xs">
                    <span
                      className="inline-block w-2.5 h-2.5 rounded-sm shrink-0"
                      style={{ background: PARTIDO_COLOR[p] }}
                    />
                    <span className="font-medium text-foreground">{p}</span>
                    <span className="ml-auto font-mono text-muted-foreground">{n}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
          <h3 className="text-sm font-semibold text-foreground">
            Universo de 113 ayuntamientos · clic para detalle
          </h3>
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar municipio…"
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              className="h-8 text-xs max-w-[220px]"
            />
            <span className="text-[10px] text-muted-foreground">
              {universoFiltrado.length}/{universo.length}
            </span>
          </div>
        </div>
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-card z-10">
              <tr className="border-b border-border">
                <th className="text-left py-2 px-2 font-medium text-muted-foreground">Municipio</th>
                <th className="text-right py-2 px-2 font-medium text-muted-foreground">Pobl.</th>
                {ANIOS_LOCALES.map((a) => (
                  <th key={a} className="text-center py-2 px-2 font-medium text-muted-foreground">{a}</th>
                ))}
                <th className="text-center py-2 px-2 font-medium text-muted-foreground">Cambios</th>
              </tr>
            </thead>
            <tbody>
              {universoFiltrado.map((m) => (
                <tr
                  key={m.clave}
                  onClick={() => m.conHistorico && setSeleccionado(m.clave)}
                  className={`border-b border-border/40 ${
                    m.conHistorico ? "cursor-pointer hover:bg-accent/40" : "opacity-60"
                  } ${seleccionado === m.clave ? "bg-accent/50" : ""}`}
                >
                  <td className="py-2 px-2 font-medium text-foreground flex items-center gap-1.5">
                    {m.nombre}
                    {!m.conHistorico && (
                      <Badge variant="outline" className="text-[9px] py-0 px-1 font-mono">sin histórico</Badge>
                    )}
                  </td>
                  <td className="py-2 px-2 text-right font-mono text-muted-foreground">{fmt(m.poblacion)}</td>
                  {ANIOS_LOCALES.map((a) => {
                    const r = m.hist.find((h) => h.anio === a);
                    return (
                      <td key={a} className="py-1.5 px-2 text-center">
                        {r ? (
                          <span
                            className="inline-block px-2 py-0.5 rounded text-white font-mono text-[10px]"
                            style={{ background: PARTIDO_COLOR[r.partidoGanador] }}
                            title={`${r.presidente} · ${r.porcentajeGanador}%`}
                          >
                            {r.partidoGanador}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                    );
                  })}
                  <td className="py-2 px-2 text-center font-mono">
                    {m.conHistorico ? (
                      <Badge variant={m.cambios >= 2 ? "destructive" : m.cambios === 0 ? "secondary" : "outline"}>
                        {m.cambios}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {seleccionado && muniSel && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold text-foreground">{muniSel.nombre}</h3>
              <p className="text-xs text-muted-foreground">Clave INEGI {muniSel.clave} · {fmt(muniSel.poblacion)} habitantes</p>
            </div>
            <button onClick={() => setSeleccionado(null)} className="text-xs text-muted-foreground hover:text-foreground">
              ✕ cerrar
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {detalle.map((d) => (
              <div key={d.anio} className="border border-border rounded-md p-3">
                <div className="text-[10px] font-mono text-muted-foreground">{d.anio}</div>
                <Badge style={{ background: PARTIDO_COLOR[d.partidoGanador], color: "white" }} className="mt-1">
                  {d.partidoGanador}
                </Badge>
                <div className="text-xs font-medium text-foreground mt-2">{d.presidente}</div>
                <div className="text-[10px] text-muted-foreground mt-1">
                  {d.porcentajeGanador}% del voto · {d.participacionPct}% participación
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card className="p-4 bg-muted/30">
        <p className="text-xs text-muted-foreground">
          <span className="text-primary font-mono">FUENTE:</span> INEGI · Marco Geoestadístico 2020 (113 municipios) ·
          IEM Michoacán · Cómputos municipales constitucionales 2015, 2018, 2021, 2024 (verificados en {stats.conHist} ayuntamientos).
          Los municipios sin histórico se completan vía importación CSV del IEM.
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

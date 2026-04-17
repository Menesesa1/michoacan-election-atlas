import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AYUNTAMIENTOS, MUNICIPIOS_ESTRATEGICOS, historicoMunicipio,
} from "@/data/locales/ayuntamientos";
import { PARTIDO_COLOR, type PartidoSigla } from "@/data/locales/partidos";
import { ANIOS_LOCALES, type AnioLocal } from "@/data/locales/diputados-locales";
import { Building2, RotateCcw, TrendingUp, Users } from "lucide-react";

const fmt = (n: number) => new Intl.NumberFormat("es-MX").format(Math.round(n));

export default function Ayuntamientos() {
  const [seleccionado, setSeleccionado] = useState<number | null>(null);

  // Métricas globales
  const stats = useMemo(() => {
    const alternancias = MUNICIPIOS_ESTRATEGICOS.map((m) => {
      const hist = historicoMunicipio(m.clave);
      let cambios = 0;
      for (let i = 1; i < hist.length; i++) if (hist[i].partidoGanador !== hist[i - 1].partidoGanador) cambios++;
      return { ...m, cambios, hist };
    });
    const totalAlternancias = alternancias.reduce((a, x) => a + x.cambios, 0);
    const continuos = alternancias.filter((x) => x.cambios === 0).length;
    return { alternancias, totalAlternancias, continuos };
  }, []);

  // Composición por año (entre los 20 estratégicos)
  const composicionPorAnio = useMemo(() => {
    return ANIOS_LOCALES.map((anio) => {
      const filas = AYUNTAMIENTOS.filter((a) => a.anio === anio);
      const cnt = new Map<PartidoSigla, number>();
      for (const f of filas) cnt.set(f.partidoGanador, (cnt.get(f.partidoGanador) ?? 0) + 1);
      return { anio, partidos: Array.from(cnt.entries()).sort((a, b) => b[1] - a[1]) };
    });
  }, []);

  const detalle = seleccionado ? historicoMunicipio(seleccionado) : [];
  const muniSel = seleccionado ? MUNICIPIOS_ESTRATEGICOS.find((m) => m.clave === seleccionado) : null;

  return (
    <div className="space-y-5">
      <div>
        <div className="text-primary text-[10px] font-mono uppercase tracking-widest">
          IEM · Cómputos municipales · Top 20 estratégicos
        </div>
        <h1 className="text-2xl font-bold text-foreground">Presidencias Municipales</h1>
        <p className="text-sm text-muted-foreground mt-1">
          20 ayuntamientos clave de Michoacán · 4 procesos electorales (2015–2024) · Concentran ~58% del electorado estatal
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPI icon={Building2} label="Municipios analizados" value="20" sub="de 113 totales del estado" />
        <KPI icon={RotateCcw} label="Alternancias totales" value={String(stats.totalAlternancias)} sub="cambios de partido 2015→2024" />
        <KPI icon={TrendingUp} label="Bastiones (sin alternancia)" value={String(stats.continuos)} sub="mismo partido los 4 procesos" />
        <KPI icon={Users} label="Pobl. cubierta" value={fmt(MUNICIPIOS_ESTRATEGICOS.reduce((a, m) => a + m.poblacion, 0))} sub="habitantes" />
      </div>

      {/* Composición por año */}
      <Card className="p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3">Reparto por partido (top 20 ayuntamientos)</h3>
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

      {/* Timeline de alternancia por municipio */}
      <Card className="p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3">
          Alternancia política · clic en municipio para detalle
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
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
              {stats.alternancias.map((m) => (
                <tr
                  key={m.clave}
                  onClick={() => setSeleccionado(m.clave)}
                  className={`border-b border-border/40 cursor-pointer hover:bg-accent/40 ${seleccionado === m.clave ? "bg-accent/50" : ""}`}
                >
                  <td className="py-2 px-2 font-medium text-foreground">{m.nombre}</td>
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
                    <Badge variant={m.cambios >= 2 ? "destructive" : m.cambios === 0 ? "secondary" : "outline"}>
                      {m.cambios}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Detalle municipio seleccionado */}
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
          <span className="text-primary font-mono">FUENTE:</span> IEM Michoacán · Cómputos municipales constitucionales 2015, 2018, 2021, 2024 ·
          INEGI Censo 2020 (población). Asterisco (*) indica reelección.
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

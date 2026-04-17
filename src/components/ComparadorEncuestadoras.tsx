import { useMemo } from "react";
import { encuestasMichoacan, comparadorMeta, EncuestaRow } from "@/data/encuestadoras-mock";

function avg(row: EncuestaRow): number {
  const vals = [row.mitofsky, row.elFinanciero, row.massiveCaller].filter(
    (v): v is number => typeof v === "number"
  );
  if (!vals.length) return 0;
  return +(vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1);
}

function fmt(v: number | null): string {
  return typeof v === "number" ? `${v.toFixed(1)}%` : "—";
}

export function ComparadorEncuestadoras() {
  const rows = useMemo(
    () => encuestasMichoacan.map((r) => ({ ...r, prom: avg(r) })),
    []
  );
  const max = Math.max(...rows.flatMap((r) => [r.mitofsky ?? 0, r.elFinanciero ?? 0, r.massiveCaller ?? 0]));

  return (
    <section id="comparador" className="py-20 px-4 sm:px-6 lg:px-12 executive-gradient">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="space-y-3 text-center">
          <div className="inline-flex items-center gap-2 text-primary text-xs font-mono uppercase tracking-widest">
            <span className="h-px w-8 bg-primary" />
            Comparativa Multi-Encuestadora
            <span className="h-px w-8 bg-primary" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
            {comparadorMeta.titulo}
          </h2>
          <p className="text-muted-foreground max-w-3xl mx-auto">
            {comparadorMeta.subtitulo}
          </p>
        </div>

        <div className="executive-panel gold-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-card/60 border-b border-primary/30">
                <tr className="text-left text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                  <th className="p-3 w-12">#</th>
                  <th className="p-3">Candidato / Partido</th>
                  <th className="p-3 text-right">
                    Mitofsky
                    <div className="text-[9px] font-normal text-muted-foreground/70 normal-case">
                      {comparadorMeta.fechaMitofsky}
                    </div>
                  </th>
                  <th className="p-3 text-right">
                    El Financiero
                    <div className="text-[9px] font-normal text-muted-foreground/70 normal-case">
                      {comparadorMeta.fechaElFinanciero}
                    </div>
                  </th>
                  <th className="p-3 text-right">
                    Massive Caller
                    <div className="text-[9px] font-normal text-muted-foreground/70 normal-case">
                      {comparadorMeta.fechaMassiveCaller}
                    </div>
                  </th>
                  <th className="p-3 text-right text-primary">Prom.</th>
                  <th className="p-3 min-w-[200px]">Comparativa</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr
                    key={r.candidato}
                    className="border-b border-border/40 hover:bg-primary/5 transition-colors"
                  >
                    <td className="p-3 font-mono text-muted-foreground">{r.rank}</td>
                    <td className="p-3">
                      <div className="font-semibold text-foreground">{r.candidato}</div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span
                          className="inline-block w-2 h-2 rounded-full"
                          style={{ background: r.partidoColor }}
                        />
                        {r.partido}
                      </div>
                    </td>
                    <td className="p-3 text-right font-mono">{fmt(r.mitofsky)}</td>
                    <td className="p-3 text-right font-mono">{fmt(r.elFinanciero)}</td>
                    <td className="p-3 text-right font-mono">{fmt(r.massiveCaller)}</td>
                    <td className="p-3 text-right font-mono font-bold text-primary">
                      {r.prom.toFixed(1)}%
                    </td>
                    <td className="p-3">
                      <div className="space-y-1 min-w-[180px]">
                        {[
                          { label: "MIT", v: r.mitofsky },
                          { label: "EFC", v: r.elFinanciero },
                          { label: "MAC", v: r.massiveCaller },
                        ].map((b) => (
                          <div key={b.label} className="flex items-center gap-2">
                            <span className="text-[9px] font-mono text-muted-foreground w-7">
                              {b.label}
                            </span>
                            <div className="flex-1 h-1.5 bg-muted/40 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all"
                                style={{
                                  width: typeof b.v === "number" ? `${(b.v / max) * 100}%` : "0%",
                                  background: r.partidoColor,
                                }}
                              />
                            </div>
                            <span className="text-[10px] font-mono text-foreground/70 w-10 text-right">
                              {fmt(b.v)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <p className="text-[10px] text-center text-muted-foreground/70 font-mono">
          Datos demostrativos · Reemplazables vía Google Sheets / JSON desde el módulo Fuentes
        </p>
      </div>
    </section>
  );
}

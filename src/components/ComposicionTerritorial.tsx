// Vista agregada "Composición Territorial" para un bloque (municipio, distrito local
// o federal). Eje: sección electoral. No prorratea: usa LN oficial de cada sección
// y describe qué localidades/colonias la componen (presencia, no estimación).
import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Download, MapPin, Layers } from "lucide-react";
import {
  loadPadronSecciones, type PadronSeccion,
} from "@/lib/padron-loader";
import {
  loadCatalogo, lookupSeccion, TIPO_SECCION,
} from "@/lib/secciones-catalogo";
import {
  loadTerritorioDetalle, getLocalidadesDeSeccion, getColoniasDeSeccion,
} from "@/lib/territorio-detalle";

const fmt = (n: number) => new Intl.NumberFormat("es-MX").format(Math.round(n));

interface Props {
  /** Universo de secciones del bloque (municipio, dist. local o federal). */
  secciones: number[];
  /** Etiqueta del bloque para encabezado y exportación. */
  titulo: string;
  /** Subtítulo opcional (ej. "Distrito local 12 · Pátzcuaro"). */
  subtitulo?: string;
}

interface Fila {
  sec: number;
  tipo: number; // 2/3/4
  ln: number;
  pct: number;
  localidad: string;
  esCabecera: boolean;
  numLocalidades: number;
  numColonias: number;
}

export function ComposicionTerritorial({ secciones, titulo, subtitulo }: Props) {
  const [padron, setPadron] = useState<PadronSeccion[] | null>(null);
  const [ready, setReady] = useState(false);
  const [ordenarPor, setOrdenarPor] = useState<"ln" | "sec">("ln");

  useEffect(() => {
    let cancel = false;
    Promise.all([loadCatalogo(), loadPadronSecciones(), loadTerritorioDetalle()])
      .then(([_c, p]) => {
        if (cancel) return;
        setPadron(p);
        setReady(true);
      })
      .catch(() => setReady(true));
    return () => { cancel = true; };
  }, []);

  const { filas, resumen, topLocalidades, topColonias } = useMemo(() => {
    if (!ready) {
      return { filas: [] as Fila[], resumen: null as any, topLocalidades: [] as Array<{ n: string; ln: number; secs: number }>, topColonias: [] as Array<{ n: string; secs: number }> };
    }
    const bySec = new Map((padron ?? []).map((p) => [p.sec, p]));
    const filasArr: Fila[] = [];
    let lnTotal = 0;
    const conteoTipo = { U: 0, M: 0, R: 0, otro: 0 };
    const aggLoc = new Map<string, { ln: number; secs: Set<number> }>();
    const aggCol = new Map<string, { secs: Set<number> }>();

    for (const sec of secciones) {
      const cat = lookupSeccion(sec);
      const pad = bySec.get(sec);
      const loc = getLocalidadesDeSeccion(sec);
      const col = getColoniasDeSeccion(sec);
      const ln = pad?.lt ?? 0;
      lnTotal += ln;
      const tipo = cat?.tipo ?? 0;
      if (tipo === 2) conteoTipo.U++;
      else if (tipo === 3) conteoTipo.M++;
      else if (tipo === 4) conteoTipo.R++;
      else conteoTipo.otro++;

      const cabeceraNombre = loc?.cabecera ?? "—";
      filasArr.push({
        sec,
        tipo,
        ln,
        pct: 0,
        localidad: cabeceraNombre,
        esCabecera: !!loc?.cabecera,
        numLocalidades: loc?.total ?? 0,
        numColonias: col?.total ?? 0,
      });

      // Acumular localidades (cabecera + lista)
      if (loc) {
        const nombres = new Set<string>();
        if (loc.cabecera) nombres.add(loc.cabecera);
        for (const l of loc.lista) nombres.add(l.n);
        for (const n of nombres) {
          const prev = aggLoc.get(n) ?? { ln: 0, secs: new Set<number>() };
          if (!prev.secs.has(sec)) {
            prev.ln += ln;
            prev.secs.add(sec);
          }
          aggLoc.set(n, prev);
        }
      }
      if (col) {
        for (const c of col.lista) {
          const prev = aggCol.get(c.n) ?? { secs: new Set<number>() };
          prev.secs.add(sec);
          aggCol.set(c.n, prev);
        }
      }
    }

    for (const f of filasArr) f.pct = lnTotal > 0 ? (f.ln / lnTotal) * 100 : 0;
    filasArr.sort((a, b) => (ordenarPor === "ln" ? b.ln - a.ln : a.sec - b.sec));

    // Concentración: cuántas secciones concentran 50% y 80% de la LN
    const ordenLN = [...filasArr].sort((a, b) => b.ln - a.ln);
    let acum = 0, sec50 = 0, sec80 = 0;
    for (let i = 0; i < ordenLN.length; i++) {
      acum += ordenLN[i].ln;
      if (sec50 === 0 && acum / lnTotal >= 0.5) sec50 = i + 1;
      if (sec80 === 0 && acum / lnTotal >= 0.8) { sec80 = i + 1; break; }
    }
    const top10LN = ordenLN.slice(0, 10).reduce((a, x) => a + x.ln, 0);

    const topLoc = Array.from(aggLoc.entries())
      .map(([n, v]) => ({ n, ln: v.ln, secs: v.secs.size }))
      .sort((a, b) => b.ln - a.ln)
      .slice(0, 15);

    const topCol = Array.from(aggCol.entries())
      .map(([n, v]) => ({ n, secs: v.secs.size }))
      .sort((a, b) => b.secs - a.secs)
      .slice(0, 15);

    return {
      filas: filasArr,
      resumen: {
        totalSecciones: secciones.length,
        lnTotal,
        urbanas: conteoTipo.U,
        mixtas: conteoTipo.M,
        rurales: conteoTipo.R,
        otras: conteoTipo.otro,
        sec50,
        sec80,
        top10Pct: lnTotal > 0 ? (top10LN / lnTotal) * 100 : 0,
      },
      topLocalidades: topLoc,
      topColonias: topCol,
    };
  }, [ready, padron, secciones, ordenarPor]);

  const exportCSV = () => {
    const head = ["Sección", "Tipo", "LN", "% bloque", "Localidad principal", "# Localidades", "# Colonias"];
    const rows = filas.map((f) => [
      f.sec,
      TIPO_SECCION[f.tipo] ?? "—",
      f.ln,
      f.pct.toFixed(2),
      `"${f.localidad.replace(/"/g, '""')}"${f.esCabecera ? " (cab.)" : ""}`,
      f.numLocalidades,
      f.numColonias,
    ]);
    const csv = [head.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `composicion-${titulo.replace(/\W+/g, "_")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!ready) {
    return (
      <Card className="p-4">
        <div className="text-xs text-muted-foreground">Cargando composición territorial…</div>
      </Card>
    );
  }
  if (!secciones.length) {
    return (
      <Card className="p-4">
        <div className="text-xs text-muted-foreground">Sin secciones asignadas al bloque.</div>
      </Card>
    );
  }

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="text-primary text-[10px] font-mono uppercase tracking-widest flex items-center gap-1">
            <Layers className="h-3 w-3" /> Composición territorial · INE
          </div>
          <h3 className="text-base font-semibold text-foreground">{titulo}</h3>
          {subtitulo && <p className="text-xs text-muted-foreground">{subtitulo}</p>}
        </div>
        <Button variant="outline" size="sm" onClick={exportCSV}>
          <Download className="h-3.5 w-3.5 mr-1" /> Exportar CSV
        </Button>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <KPI label="Secciones" value={fmt(resumen.totalSecciones)} sub={`${resumen.urbanas} U · ${resumen.mixtas} M · ${resumen.rurales} R`} />
        <KPI label="Lista Nominal" value={fmt(resumen.lnTotal)} sub="Suma oficial INE" />
        <KPI label="50% de la LN" value={resumen.sec50 ? `${resumen.sec50} secc.` : "—"} sub="Concentración mínima" />
        <KPI label="80% de la LN" value={resumen.sec80 ? `${resumen.sec80} secc.` : "—"} sub={`Top 10 = ${resumen.top10Pct.toFixed(1)}%`} />
      </div>

      {/* Tabla maestra */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-semibold text-foreground">Secciones del bloque</h4>
          <div className="flex gap-1">
            <Button
              variant={ordenarPor === "ln" ? "default" : "outline"}
              size="sm"
              onClick={() => setOrdenarPor("ln")}
            >
              Por LN
            </Button>
            <Button
              variant={ordenarPor === "sec" ? "default" : "outline"}
              size="sm"
              onClick={() => setOrdenarPor("sec")}
            >
              Por sección
            </Button>
          </div>
        </div>
        <div className="max-h-[420px] overflow-auto rounded border border-border">
          <Table>
            <TableHeader className="sticky top-0 bg-card z-10">
              <TableRow>
                <TableHead className="w-20">Sección</TableHead>
                <TableHead className="w-20">Tipo</TableHead>
                <TableHead className="text-right w-24">LN</TableHead>
                <TableHead className="text-right w-20">%</TableHead>
                <TableHead>Localidad principal</TableHead>
                <TableHead className="text-right w-16"># Loc.</TableHead>
                <TableHead className="text-right w-16"># Col.</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filas.map((f) => (
                <TableRow key={f.sec}>
                  <TableCell className="font-mono">{f.sec}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px]">
                      {TIPO_SECCION[f.tipo] ?? "—"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono">{fmt(f.ln)}</TableCell>
                  <TableCell className="text-right font-mono text-muted-foreground">
                    {f.pct.toFixed(2)}%
                  </TableCell>
                  <TableCell className="text-sm">
                    {f.localidad}
                    {f.esCabecera && (
                      <Badge variant="secondary" className="ml-1 text-[9px]">cab.</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-mono text-muted-foreground">
                    {f.numLocalidades || "—"}
                  </TableCell>
                  <TableCell className="text-right font-mono text-muted-foreground">
                    {f.numColonias || "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Top localidades / colonias */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" /> Top localidades del bloque
          </h4>
          <p className="text-[11px] text-muted-foreground mb-2">
            Suma de LN de las secciones donde aparece cada localidad (una localidad puede
            estar en varias secciones).
          </p>
          <div className="max-h-[260px] overflow-auto rounded border border-border">
            <Table>
              <TableHeader className="sticky top-0 bg-card">
                <TableRow>
                  <TableHead>Localidad</TableHead>
                  <TableHead className="text-right w-20">Secc.</TableHead>
                  <TableHead className="text-right w-24">LN agreg.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topLocalidades.map((l) => (
                  <TableRow key={l.n}>
                    <TableCell className="text-sm">{l.n}</TableCell>
                    <TableCell className="text-right font-mono">{l.secs}</TableCell>
                    <TableCell className="text-right font-mono">{fmt(l.ln)}</TableCell>
                  </TableRow>
                ))}
                {!topLocalidades.length && (
                  <TableRow><TableCell colSpan={3} className="text-xs text-muted-foreground">Sin catálogo de localidades para estas secciones.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" /> Top colonias del bloque
          </h4>
          <p className="text-[11px] text-muted-foreground mb-2">
            Presencia de cada colonia en las secciones del bloque (sin prorrateo de LN).
          </p>
          <div className="max-h-[260px] overflow-auto rounded border border-border">
            <Table>
              <TableHeader className="sticky top-0 bg-card">
                <TableRow>
                  <TableHead>Colonia</TableHead>
                  <TableHead className="text-right w-20">Secc.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topColonias.map((c) => (
                  <TableRow key={c.n}>
                    <TableCell className="text-sm">{c.n}</TableCell>
                    <TableCell className="text-right font-mono">{c.secs}</TableCell>
                  </TableRow>
                ))}
                {!topColonias.length && (
                  <TableRow><TableCell colSpan={2} className="text-xs text-muted-foreground">Sin catálogo de colonias para estas secciones.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </Card>
  );
}

function KPI({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded border border-border bg-card/40 p-2.5">
      <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold text-foreground">{value}</div>
      {sub && <div className="text-[10px] text-muted-foreground">{sub}</div>}
    </div>
  );
}

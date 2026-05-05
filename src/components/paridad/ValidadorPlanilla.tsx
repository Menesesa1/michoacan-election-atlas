// Validador de planilla 2027: el usuario elige partido y tipo de elección,
// la planilla se prellena con la sugerencia del motor de paridad
// (sugerenciaParidadMunicipio / sugerenciaParidadDistrito) y se puede
// editar a mano. Las fórmulas IEM se evalúan en vivo.

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, AlertTriangle, XCircle, Building, Vote, ListOrdered } from "lucide-react";
import { MUNICIPIOS_MICHOACAN_113 } from "@/data/locales/municipios-catalogo";
import {
  sugerenciaParidadMunicipio,
  sugerenciaParidadDistrito,
  historicoMunicipioConGenero,
  historicoDistritoConGenero,
} from "@/lib/paridad/historico-genero";
import {
  validarPlanilla,
  type PostulacionTerritorio,
  type TipoPlanilla,
} from "@/lib/paridad/validador-planilla";
import type { Genero } from "@/lib/paridad/inferir-genero";

const PARTIDOS = ["MORENA", "PAN", "PRI", "MC", "PVEM", "PT", "PCM", "INDEP"];

function GenSelect({
  value,
  onChange,
}: {
  value: Genero;
  onChange: (g: Genero) => void;
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as Genero)}>
      <SelectTrigger className="h-7 w-[100px] text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="M">♀ Mujer</SelectItem>
        <SelectItem value="H">♂ Hombre</SelectItem>
        <SelectItem value="ambiguo">—</SelectItem>
      </SelectContent>
    </Select>
  );
}

export default function ValidadorPlanilla() {
  const [tipo, setTipo] = useState<TipoPlanilla>("ayuntamientos");
  const [partido, setPartido] = useState<string>("MORENA");
  const [overrides, setOverrides] = useState<Record<string, Genero>>({});

  // Universo base según tipo
  const base = useMemo<PostulacionTerritorio[]>(() => {
    if (tipo === "ayuntamientos") {
      return MUNICIPIOS_MICHOACAN_113.map((m) => {
        const s = sugerenciaParidadMunicipio(m.clave, partido);
        const hist = historicoMunicipioConGenero(m.clave);
        const ult = hist.sort((a, b) => b.anio - a.anio)[0];
        return {
          territorioId: `mun-${m.clave}`,
          territorioNombre: m.nombre,
          generoPropietario: s.generoSugerido,
          porcentajeAnterior: ult?.porcentajeGanador,
        };
      });
    }
    if (tipo === "diputaciones_mr") {
      return Array.from({ length: 24 }, (_, i) => i + 1).map((d) => {
        const s = sugerenciaParidadDistrito(d, partido);
        const hist = historicoDistritoConGenero(d);
        const ult = hist.sort((a, b) => b.anio - a.anio)[0];
        return {
          territorioId: `dist-${d}`,
          territorioNombre: `Distrito ${d}`,
          generoPropietario: s.generoSugerido,
          porcentajeAnterior: ult?.porcentajeGanador,
        };
      });
    }
    // Plurinominal: 8 posiciones tipo (lista RP de diputaciones locales).
    return Array.from({ length: 8 }, (_, i) => ({
      territorioId: `${i + 1}`,
      territorioNombre: `Posición ${i + 1}`,
      generoPropietario: (i % 2 === 0 ? "M" : "H") as Genero,
    }));
  }, [tipo, partido]);

  const planilla = useMemo<PostulacionTerritorio[]>(
    () =>
      base.map((p) => ({
        ...p,
        generoPropietario: overrides[p.territorioId] ?? p.generoPropietario,
        generoSuplente: overrides[p.territorioId] ?? p.generoPropietario,
      })),
    [base, overrides],
  );

  const resultado = useMemo(() => validarPlanilla(tipo, planilla), [tipo, planilla]);

  const setG = (id: string, g: Genero) =>
    setOverrides((prev) => ({ ...prev, [id]: g }));

  const resetOverrides = () => setOverrides({});

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <ListOrdered className="w-5 h-5 text-primary" />
          Validador de planilla — fórmulas IEM
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Aplica las reglas oficiales: paridad horizontal 50/50, bloques de competitividad
          alto/medio/bajo, fórmula propietario-suplente del mismo género y alternancia en
          listas plurinominales.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Controles */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant={tipo === "ayuntamientos" ? "default" : "outline"}
              onClick={() => setTipo("ayuntamientos")}
            >
              <Building className="w-3 h-3 mr-1" />
              Ayuntamientos (113)
            </Button>
            <Button
              size="sm"
              variant={tipo === "diputaciones_mr" ? "default" : "outline"}
              onClick={() => setTipo("diputaciones_mr")}
            >
              <Vote className="w-3 h-3 mr-1" />
              Dip. MR (24)
            </Button>
            <Button
              size="sm"
              variant={tipo === "plurinominal" ? "default" : "outline"}
              onClick={() => setTipo("plurinominal")}
            >
              <ListOrdered className="w-3 h-3 mr-1" />
              Lista RP
            </Button>
          </div>
          <Select value={partido} onValueChange={setPartido}>
            <SelectTrigger className="h-8 w-[140px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PARTIDOS.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" variant="ghost" onClick={resetOverrides}>
            Restaurar sugerencia
          </Button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          <div className="p-3 rounded border border-border/40 bg-card/40">
            <div className="text-[10px] uppercase text-muted-foreground">Total</div>
            <div className="text-xl font-bold">{resultado.totalPostulaciones}</div>
          </div>
          <div className="p-3 rounded border border-pink-500/30 bg-pink-500/5">
            <div className="text-[10px] uppercase text-pink-400">Mujeres</div>
            <div className="text-xl font-bold">
              {resultado.mujeres}{" "}
              <span className="text-xs font-mono text-muted-foreground">
                {resultado.pctMujeres.toFixed(1)}%
              </span>
            </div>
          </div>
          <div className="p-3 rounded border border-blue-500/30 bg-blue-500/5">
            <div className="text-[10px] uppercase text-blue-400">Hombres</div>
            <div className="text-xl font-bold">
              {resultado.hombres}{" "}
              <span className="text-xs font-mono text-muted-foreground">
                {resultado.pctHombres.toFixed(1)}%
              </span>
            </div>
          </div>
          <div className="p-3 rounded border border-amber-500/30 bg-amber-500/5">
            <div className="text-[10px] uppercase text-amber-400">Sin género</div>
            <div className="text-xl font-bold">{resultado.ambiguos}</div>
          </div>
          <div
            className={`p-3 rounded border ${
              resultado.cumpleHorizontal
                ? "border-emerald-500/30 bg-emerald-500/5"
                : "border-destructive/40 bg-destructive/5"
            }`}
          >
            <div className="text-[10px] uppercase text-muted-foreground">Horizontal</div>
            <div className="text-sm font-semibold flex items-center gap-1">
              {resultado.cumpleHorizontal ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Cumple
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 text-destructive" /> No cumple
                </>
              )}
            </div>
          </div>
        </div>

        {/* Bloques de competitividad */}
        {resultado.bloques && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {resultado.bloques.map((b) => (
              <div
                key={b.bloque}
                className={`p-3 rounded border ${
                  b.cumple
                    ? "border-emerald-500/30 bg-emerald-500/5"
                    : "border-destructive/40 bg-destructive/5"
                }`}
              >
                <div className="text-[10px] uppercase text-muted-foreground">
                  Bloque {b.bloque}
                </div>
                <div className="text-sm font-semibold mt-1">
                  {b.mujeres}M / {b.hombres}H
                  <span className="ml-2 text-xs text-muted-foreground font-mono">
                    {b.pctMujeres.toFixed(0)}% mujeres · {b.total} territ.
                  </span>
                </div>
                <div className="text-[11px] text-muted-foreground mt-1">
                  {b.cumple ? "Balanceado ✓" : `Desbalance: diferencia ${b.diferencia}`}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Hallazgos */}
        <div className="space-y-1.5">
          <div className="text-xs font-semibold text-muted-foreground uppercase">
            Hallazgos ({resultado.hallazgos.length})
          </div>
          {resultado.hallazgos.map((h, i) => (
            <div
              key={i}
              className={`flex items-start gap-2 p-2 rounded text-xs ${
                h.nivel === "ok"
                  ? "bg-emerald-500/5 border border-emerald-500/20"
                  : h.nivel === "advertencia"
                    ? "bg-amber-500/5 border border-amber-500/20"
                    : "bg-destructive/5 border border-destructive/30"
              }`}
            >
              {h.nivel === "ok" ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
              ) : h.nivel === "advertencia" ? (
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
              ) : (
                <XCircle className="w-3.5 h-3.5 text-destructive mt-0.5 shrink-0" />
              )}
              <div className="min-w-0">
                <div className="font-semibold">{h.regla}</div>
                <div className="text-muted-foreground">{h.mensaje}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Tabla editable */}
        <div className="overflow-x-auto max-h-[420px] overflow-y-auto border border-border/40 rounded">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-card border-b border-border text-[10px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left py-2 px-2">Territorio</th>
                <th className="text-left py-2 px-2">% anterior</th>
                <th className="text-left py-2 px-2">Sugerencia</th>
                <th className="text-left py-2 px-2">Postulación</th>
              </tr>
            </thead>
            <tbody>
              {planilla.map((p, idx) => (
                <tr key={p.territorioId} className="border-b border-border/40">
                  <td className="py-1.5 px-2 font-medium">{p.territorioNombre}</td>
                  <td className="py-1.5 px-2 font-mono text-xs text-muted-foreground">
                    {p.porcentajeAnterior != null ? `${p.porcentajeAnterior.toFixed(1)}%` : "—"}
                  </td>
                  <td className="py-1.5 px-2">
                    <Badge variant="outline" className="text-[10px]">
                      {base[idx]?.generoPropietario === "M"
                        ? "♀"
                        : base[idx]?.generoPropietario === "H"
                          ? "♂"
                          : "—"}
                    </Badge>
                  </td>
                  <td className="py-1.5 px-2">
                    <GenSelect
                      value={p.generoPropietario}
                      onChange={(g) => setG(p.territorioId, g)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

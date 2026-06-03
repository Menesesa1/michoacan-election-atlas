// Despliega las secciones reales detrás de cada bloque "Secciones clave a movilizar"
// que devuelve la IA. La IA solo indica municipio + tipo + cantidad; aquí resolvemos
// qué secciones específicas (sección INE, LN, localidad principal, # colonias) son las
// mejores candidatas para ese rol, ordenadas por Lista Nominal descendente.
import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, MapPin, Building2 } from "lucide-react";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  loadCatalogo, seccionesDeMunicipio, lookupSeccion, TIPO_SECCION,
} from "@/lib/secciones-catalogo";
import { buscarMunicipio } from "@/data/locales/municipios-catalogo";
import { loadPadronSecciones, type PadronSeccion } from "@/lib/padron-loader";
import {
  loadTerritorioDetalle, getLocalidadesDeSeccion, getColoniasDeSeccion,
} from "@/lib/territorio-detalle";

const fmt = (n: number) => new Intl.NumberFormat("es-MX").format(Math.round(n));

interface Props {
  municipio: string;
  tipoSeccion: "urbana" | "mixta" | "rural";
  numSecciones: number;
}

interface Fila {
  sec: number;
  ln: number;
  localidad: string;
  esCabecera: boolean;
  numColonias: number;
  numLocalidades: number;
}

const TIPO_NUM: Record<string, number> = { urbana: 2, mixta: 3, rural: 4 };

export function SeccionesClaveDetalle({ municipio, tipoSeccion, numSecciones }: Props) {
  const [ready, setReady] = useState(false);
  const [padron, setPadron] = useState<PadronSeccion[] | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancel = false;
    Promise.all([loadCatalogo(), loadPadronSecciones(), loadTerritorioDetalle()])
      .then(([, p]) => {
        if (cancel) return;
        setPadron(p);
        setReady(true);
      })
      .catch(() => setReady(true));
    return () => { cancel = true; };
  }, []);

  const { filas, lnTotal } = useMemo(() => {
    if (!ready) return { filas: [] as Fila[], lnTotal: 0 };
    const mun = buscarMunicipio(municipio);
    if (!mun) return { filas: [] as Fila[], lnTotal: 0 };
    const tipoBuscado = TIPO_NUM[tipoSeccion];
    const bySec = new Map((padron ?? []).map((p) => [p.sec, p]));
    const candidatas = seccionesDeMunicipio(mun.clave)
      .map((sec) => {
        const cat = lookupSeccion(sec);
        return { sec, tipo: cat?.tipo ?? 0, ln: bySec.get(sec)?.lt ?? 0 };
      })
      .filter((c) => c.tipo === tipoBuscado)
      .sort((a, b) => b.ln - a.ln)
      .slice(0, Math.max(1, numSecciones));

    const out: Fila[] = candidatas.map((c) => {
      const loc = getLocalidadesDeSeccion(c.sec);
      const col = getColoniasDeSeccion(c.sec);
      return {
        sec: c.sec,
        ln: c.ln,
        localidad: loc?.cabecera ?? (loc?.lista[0]?.n ?? "—"),
        esCabecera: !!loc?.cabecera,
        numColonias: col?.total ?? 0,
        numLocalidades: loc?.total ?? 0,
      };
    });
    return { filas: out, lnTotal: out.reduce((a, x) => a + x.ln, 0) };
  }, [ready, padron, municipio, tipoSeccion, numSecciones]);

  if (!ready) {
    return <div className="text-[10px] text-muted-foreground">Cargando catálogo de secciones…</div>;
  }
  if (!filas.length) {
    return (
      <div className="text-[10px] text-muted-foreground">
        Sin coincidencia en catálogo INE para "{municipio}" tipo {tipoSeccion}.
      </div>
    );
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="mt-1">
      <CollapsibleTrigger className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-primary hover:text-primary/80 transition">
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} />
        Ver secciones · LN total {fmt(lnTotal)}
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2 rounded-md border border-border/40 bg-background/40 overflow-hidden">
        <div className="max-h-72 overflow-auto">
          <table className="w-full text-[11px]">
            <thead className="sticky top-0 bg-card/80 backdrop-blur">
              <tr className="text-left text-muted-foreground border-b border-border/40">
                <th className="px-2 py-1 font-mono">Sec.</th>
                <th className="px-2 py-1 font-mono text-right">LN</th>
                <th className="px-2 py-1 font-mono">Localidad principal</th>
                <th className="px-2 py-1 font-mono text-right">Loc.</th>
                <th className="px-2 py-1 font-mono text-right">Col.</th>
              </tr>
            </thead>
            <tbody>
              {filas.map((f) => (
                <tr key={f.sec} className="border-b border-border/20 last:border-0">
                  <td className="px-2 py-1 font-mono text-foreground">{f.sec}</td>
                  <td className="px-2 py-1 font-mono text-right text-amber-300">{fmt(f.ln)}</td>
                  <td className="px-2 py-1 text-foreground/90">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="w-2.5 h-2.5 text-muted-foreground" />
                      {f.localidad}
                      {f.esCabecera && (
                        <Badge variant="secondary" className="ml-1 text-[8px] px-1 py-0">cab.</Badge>
                      )}
                    </span>
                  </td>
                  <td className="px-2 py-1 font-mono text-right text-muted-foreground">
                    {f.numLocalidades || "—"}
                  </td>
                  <td className="px-2 py-1 font-mono text-right text-muted-foreground">
                    <span className="inline-flex items-center gap-0.5 justify-end">
                      {f.numColonias > 0 && <Building2 className="w-2.5 h-2.5" />}
                      {f.numColonias || "—"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-2 py-1 text-[9px] text-muted-foreground border-t border-border/40 bg-card/40">
          Top {filas.length} secciones {TIPO_SECCION[TIPO_NUM[tipoSeccion]]?.toLowerCase()} de {municipio} por Lista Nominal (INE). Localidades y colonias son lista descriptiva, sin prorrateo.
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

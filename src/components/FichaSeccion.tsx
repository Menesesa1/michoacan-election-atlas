import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MapPin, Home, Building2 } from "lucide-react";
import {
  loadTerritorioDetalle,
  getLocalidadesDeSeccion,
  getColoniasDeSeccion,
  TIPO_LOCALIDAD_LABEL,
  type DetalleLocalidades,
  type DetalleColonias,
} from "@/lib/territorio-detalle";

interface Props {
  seccion: number;
  /** Datos oficiales de la sección — se muestran sin estimaciones. */
  municipio?: string;
  distritoLocal?: number;
  distritoFederal?: number;
  tipo?: string;
  listaNominal?: number;
  listaHombres?: number;
  listaMujeres?: number;
  compact?: boolean;
}

export function FichaSeccion({
  seccion,
  municipio,
  distritoLocal,
  distritoFederal,
  tipo,
  listaNominal,
  listaHombres,
  listaMujeres,
  compact = false,
}: Props) {
  const [loc, setLoc] = useState<DetalleLocalidades | null>(null);
  const [col, setCol] = useState<DetalleColonias | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    loadTerritorioDetalle().then(() => {
      if (!alive) return;
      setLoc(getLocalidadesDeSeccion(seccion));
      setCol(getColoniasDeSeccion(seccion));
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [seccion]);

  return (
    <Card className="bg-card/60 backdrop-blur border-border/50 p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-widest text-primary">
            Ficha de sección
          </div>
          <h3 className="text-lg font-bold">Sección {seccion}</h3>
          <div className="text-xs text-muted-foreground space-x-2">
            {municipio && <span>{municipio}</span>}
            {distritoLocal != null && <span>· DL {distritoLocal}</span>}
            {distritoFederal != null && <span>· DF {distritoFederal}</span>}
          </div>
        </div>
        {tipo && (
          <Badge variant="outline" className="text-[10px]">
            {tipo}
          </Badge>
        )}
      </div>

      {listaNominal != null && (
        <div className="grid grid-cols-3 gap-2 rounded border border-border/40 p-2">
          <div>
            <div className="text-[9px] uppercase text-muted-foreground">Lista nominal</div>
            <div className="font-mono text-sm">{listaNominal.toLocaleString("es-MX")}</div>
          </div>
          {listaHombres != null && (
            <div>
              <div className="text-[9px] uppercase text-muted-foreground">Hombres</div>
              <div className="font-mono text-sm">{listaHombres.toLocaleString("es-MX")}</div>
            </div>
          )}
          {listaMujeres != null && (
            <div>
              <div className="text-[9px] uppercase text-muted-foreground">Mujeres</div>
              <div className="font-mono text-sm">{listaMujeres.toLocaleString("es-MX")}</div>
            </div>
          )}
        </div>
      )}

      {loading ? (
        <div className="text-xs text-muted-foreground">Cargando catálogo territorial…</div>
      ) : (
        <div className={compact ? "space-y-2" : "grid md:grid-cols-2 gap-3"}>
          <section>
            <div className="flex items-center gap-2 mb-1">
              <Home className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                Localidades ({loc?.total ?? 0})
              </span>
            </div>
            {loc ? (
              <>
                <div className="text-xs mb-1">
                  Cabecera: <span className="font-semibold">{loc.cabecera}</span>
                </div>
                <ScrollArea className="h-32 rounded border border-border/40 p-1">
                  <ul className="text-[11px] space-y-0.5">
                    {loc.lista.map((l, i) => (
                      <li key={i} className="flex items-center justify-between gap-2 px-1">
                        <span className="truncate">
                          <MapPin className="inline w-2.5 h-2.5 mr-1 text-muted-foreground" />
                          {l.n}
                        </span>
                        <Badge variant="outline" className="text-[8px] shrink-0">
                          {TIPO_LOCALIDAD_LABEL[l.t]}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                </ScrollArea>
              </>
            ) : (
              <div className="text-[11px] text-muted-foreground">Sin localidades catalogadas.</div>
            )}
          </section>

          <section>
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="w-3.5 h-3.5 text-sky-400" />
              <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                Colonias ({col?.total ?? 0})
              </span>
            </div>
            {col && col.total > 0 ? (
              <ScrollArea className="h-32 rounded border border-border/40 p-1">
                <ul className="text-[11px] space-y-0.5">
                  {col.lista.map((c, i) => (
                    <li key={i} className="flex items-center justify-between gap-2 px-1">
                      <span className="truncate">{c.n}</span>
                      {c.cp && (
                        <span className="text-[9px] font-mono text-muted-foreground shrink-0">
                          {c.cp}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            ) : (
              <div className="text-[11px] text-muted-foreground">
                Sin colonias catalogadas (sección rural).
              </div>
            )}
          </section>
        </div>
      )}

      <p className="text-[9px] text-muted-foreground font-mono">
        Fuente: catálogos oficiales INE (Localidades con Sección y Colonias). La Lista Nominal
        pertenece a la sección; localidades y colonias se listan tal cual aparecen en el catálogo,
        sin prorrateo de electores.
      </p>
    </Card>
  );
}

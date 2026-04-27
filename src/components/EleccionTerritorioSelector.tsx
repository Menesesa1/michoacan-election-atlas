import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, MapPin, Users, Vote, Network } from "lucide-react";
import { loadCatalogo, nombreMunicipio, infoDistritoLocal } from "@/lib/secciones-catalogo";
import {
  etiquetaTerritorio,
  etiquetaTipoEleccion,
  opcionesTerritorio,
  resolverTerritorio,
  type TerritorioResuelto,
  type TipoEleccion,
} from "@/lib/territorio-cruzado";

interface Props {
  /** Notificación de cambios al padre. */
  onChange?: (sel: TerritorioResuelto) => void;
  /** Tipo de elección inicial. */
  defaultTipo?: TipoEleccion;
  /** Clave de territorio inicial. */
  defaultClave?: number;
  /** Compactar en una sola línea (default false). */
  compact?: boolean;
}

const TIPOS: { value: TipoEleccion; label: string; icon: typeof Vote }[] = [
  { value: "gobernador", label: "Gobernatura", icon: Vote },
  { value: "diputado_federal", label: "Dip. Federal", icon: Building2 },
  { value: "diputado_local", label: "Dip. Local", icon: Building2 },
  { value: "ayuntamiento", label: "Ayuntamiento", icon: MapPin },
];

export function EleccionTerritorioSelector({
  onChange,
  defaultTipo = "diputado_federal",
  defaultClave,
  compact = false,
}: Props) {
  const [tipo, setTipo] = useState<TipoEleccion>(defaultTipo);
  const [clave, setClave] = useState<number | null>(defaultClave ?? null);
  const [catalogoListo, setCatalogoListo] = useState(false);

  useEffect(() => {
    loadCatalogo()
      .then(() => setCatalogoListo(true))
      .catch(() => setCatalogoListo(true));
  }, []);

  const opciones = useMemo(
    () => (catalogoListo ? opcionesTerritorio(tipo) : []),
    [tipo, catalogoListo],
  );

  // Asegurar selección válida cuando cambia el tipo o se cargó el catálogo.
  useEffect(() => {
    if (!catalogoListo || opciones.length === 0) return;
    if (clave == null || !opciones.some((o) => o.clave === clave)) {
      setClave(opciones[0].clave);
    }
  }, [opciones, clave, catalogoListo]);

  const resuelto = useMemo<TerritorioResuelto | null>(() => {
    if (!catalogoListo || clave == null) return null;
    return resolverTerritorio(tipo, clave);
  }, [tipo, clave, catalogoListo]);

  useEffect(() => {
    if (resuelto && onChange) onChange(resuelto);
    // onChange omitido del array de deps a propósito (el padre suele recrearlo).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resuelto]);

  return (
    <div className={`glass-panel p-3 space-y-3 ${compact ? "" : ""}`}>
      <div className="flex flex-col md:flex-row md:items-center gap-3">
        {/* Tipo de elección */}
        <div className="flex items-center gap-1 p-0.5 bg-secondary/50 rounded-lg overflow-x-auto">
          {TIPOS.map((t) => {
            const Icon = t.icon;
            const active = tipo === t.value;
            return (
              <button
                key={t.value}
                onClick={() => setTipo(t.value)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-medium whitespace-nowrap transition-all ${
                  active
                    ? "bg-primary/15 text-primary glow-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="w-3 h-3" />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Territorio */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <label className="text-[10px] font-mono uppercase text-muted-foreground shrink-0">
            {etiquetaTerritorio(tipo)}:
          </label>
          <Select
            value={clave != null ? String(clave) : ""}
            onValueChange={(v) => setClave(Number(v))}
            disabled={!catalogoListo || opciones.length === 0}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder={catalogoListo ? "Selecciona…" : "Cargando catálogo…"} />
            </SelectTrigger>
            <SelectContent className="max-h-[320px]">
              {opciones.map((o) => (
                <SelectItem key={o.clave} value={String(o.clave)} className="text-xs">
                  {o.label}
                  {o.sub ? <span className="text-muted-foreground"> · {o.sub}</span> : null}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Jerarquía cruzada */}
      {resuelto && (
        <div className="flex items-start gap-2 flex-wrap text-[10px]">
          <span className="flex items-center gap-1 text-muted-foreground font-mono uppercase tracking-wider mt-0.5">
            <Network className="w-3 h-3 text-primary" />
            Jerarquía
          </span>

          <Badge variant="outline" className="font-mono text-[10px]">
            <Users className="w-2.5 h-2.5 mr-1" />
            {resuelto.secciones.size} secciones
          </Badge>

          <Badge variant="outline" className="font-mono text-[10px]">
            <MapPin className="w-2.5 h-2.5 mr-1" />
            {resuelto.municipios.length} municipio{resuelto.municipios.length === 1 ? "" : "s"}
            {resuelto.municipios.length <= 3 && (
              <span className="ml-1 text-muted-foreground">
                ({resuelto.municipios.map(nombreMunicipio).join(", ")})
              </span>
            )}
          </Badge>

          <Badge variant="outline" className="font-mono text-[10px]">
            <Building2 className="w-2.5 h-2.5 mr-1" />
            Local: {resuelto.distritosLocales.length === 0
              ? "—"
              : resuelto.distritosLocales
                  .map((d) => {
                    const info = infoDistritoLocal(d);
                    return info ? `D${String(d).padStart(2, "0")} ${info.cabecera}` : `D${d}`;
                  })
                  .slice(0, 4)
                  .join(" · ")}
            {resuelto.distritosLocales.length > 4 && ` +${resuelto.distritosLocales.length - 4}`}
          </Badge>

          <Badge variant="outline" className="font-mono text-[10px]">
            <Building2 className="w-2.5 h-2.5 mr-1" />
            Federal: {resuelto.distritosFederales.length === 0
              ? "—"
              : resuelto.distritosFederales.map((d) => `DF${String(d).padStart(2, "0")}`).join(" · ")}
          </Badge>

          <Badge variant="outline" className="font-mono text-[10px]">
            <Vote className="w-2.5 h-2.5 mr-1" />
            Estatal · Michoacán
          </Badge>

          <span className="ml-auto text-muted-foreground">
            Contexto: {etiquetaTipoEleccion(tipo)}
          </span>
        </div>
      )}
    </div>
  );
}

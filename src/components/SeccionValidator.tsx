import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Building2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  MapPin,
  Network,
  Search,
  Vote,
  Users,
} from "lucide-react";
import { loadCatalogo } from "@/lib/secciones-catalogo";
import {
  validarJerarquiaSeccion,
  type JerarquiaSeccion,
  type SeverityLevel,
} from "@/lib/seccion-validator";

interface Props {
  /** Sección inicial opcional. */
  defaultSeccion?: number;
  /** Notifica al padre cada vez que cambia la sección validada. */
  onValidate?: (jerarquia: JerarquiaSeccion) => void;
  /** Compactar (sin tarjeta exterior). */
  embed?: boolean;
}

const SEVERITY_STYLES: Record<SeverityLevel, { icon: typeof CheckCircle2; color: string; label: string }> = {
  ok: { icon: CheckCircle2, color: "text-emerald-400", label: "Jerarquía verificada" },
  warning: { icon: AlertTriangle, color: "text-amber-400", label: "Verificación con advertencias" },
  error: { icon: XCircle, color: "text-red-400", label: "Sección inválida" },
};

export function SeccionValidator({ defaultSeccion, onValidate, embed = false }: Props) {
  const [input, setInput] = useState<string>(defaultSeccion ? String(defaultSeccion) : "");
  const [catalogoListo, setCatalogoListo] = useState(false);

  useEffect(() => {
    loadCatalogo()
      .then(() => setCatalogoListo(true))
      .catch(() => setCatalogoListo(true));
  }, []);

  const seccionNum = Number(input);
  const jerarquia = useMemo<JerarquiaSeccion | null>(() => {
    if (!catalogoListo || !Number.isFinite(seccionNum) || seccionNum <= 0) return null;
    return validarJerarquiaSeccion(seccionNum);
  }, [seccionNum, catalogoListo]);

  useEffect(() => {
    if (jerarquia && onValidate) onValidate(jerarquia);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jerarquia]);

  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) =>
    embed ? <div className="space-y-3">{children}</div> : <Card className="p-4 space-y-3">{children}</Card>;

  return (
    <Wrapper>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Network className="w-4 h-4 text-primary" />
          <h3 className="text-xs font-semibold text-foreground">
            Validador de jerarquía cruzada · Sección electoral
          </h3>
        </div>
        <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
          Catálogo INE · Michoacán (clave 16)
        </span>
      </div>

      <div className="flex items-center gap-2">
        <Search className="w-3.5 h-3.5 text-muted-foreground" />
        <Input
          type="number"
          inputMode="numeric"
          placeholder={catalogoListo ? "Número de sección (ej. 1547)" : "Cargando catálogo…"}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={!catalogoListo}
          className="h-8 text-xs max-w-[220px]"
        />
        {catalogoListo && (
          <span className="text-[10px] text-muted-foreground">2,703 secciones disponibles</span>
        )}
      </div>

      {jerarquia ? (
        <ReporteJerarquia jerarquia={jerarquia} />
      ) : input.length === 0 ? (
        <p className="text-[11px] text-muted-foreground">
          Escribe un número de sección para confirmar su jerarquía cruzada
          (Municipio · Distrito Local · Distrito Federal · Estado) y los tipos de elección a los que aporta.
        </p>
      ) : (
        <p className="text-[11px] text-amber-400">Ingresa un número de sección válido.</p>
      )}
    </Wrapper>
  );
}

function ReporteJerarquia({ jerarquia }: { jerarquia: JerarquiaSeccion }) {
  const Sev = SEVERITY_STYLES[jerarquia.severidad];

  return (
    <div className="space-y-3">
      <div className={`flex items-center gap-2 text-xs font-semibold ${Sev.color}`}>
        <Sev.icon className="w-4 h-4" />
        Sección {jerarquia.seccion} · {Sev.label}
        {jerarquia.tipo && (
          <Badge variant="outline" className="ml-1 text-[10px] font-mono">
            Tipo {jerarquia.tipo.nombre}
          </Badge>
        )}
      </div>

      {jerarquia.existe && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <Nodo
            icono={MapPin}
            label="Municipio (Ayuntamiento)"
            valor={jerarquia.municipio?.nombre ?? "—"}
            sub={jerarquia.municipio ? `Clave INEGI ${jerarquia.municipio.clave}` : undefined}
          />
          <Nodo
            icono={Building2}
            label="Distrito Local (IEM)"
            valor={
              jerarquia.distritoLocal
                ? `D${String(jerarquia.distritoLocal.clave).padStart(2, "0")} · ${jerarquia.distritoLocal.cabecera}`
                : "—"
            }
            sub={
              jerarquia.distritoLocal
                ? `${jerarquia.distritoLocal.municipios.length} municipios integrantes`
                : undefined
            }
          />
          <Nodo
            icono={Building2}
            label="Distrito Federal (INE)"
            valor={
              jerarquia.distritoFederal
                ? `DF${String(jerarquia.distritoFederal.clave).padStart(2, "0")}`
                : "—"
            }
          />
          <Nodo
            icono={Vote}
            label="Estado"
            valor={jerarquia.estado.nombre}
            sub={`Clave INE ${jerarquia.estado.clave}`}
          />
        </div>
      )}

      {jerarquia.eleccionesAporta.length > 0 && (
        <div className="p-2.5 rounded-md bg-primary/5 border border-primary/20">
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1.5 flex items-center gap-1">
            <Users className="w-3 h-3 text-primary" />
            Aporta votos a {jerarquia.eleccionesAporta.length} contiendas
          </p>
          <div className="flex flex-wrap gap-1">
            {jerarquia.eleccionesAporta.map((e) => (
              <Badge key={e} variant="secondary" className="text-[10px]">
                {e}
              </Badge>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-1">
        <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          Validaciones
        </p>
        {jerarquia.checks.map((c, i) => {
          const S = SEVERITY_STYLES[c.estado];
          return (
            <div key={i} className={`flex items-start gap-1.5 text-[11px] ${S.color}`}>
              <S.icon className="w-3 h-3 mt-0.5 shrink-0" />
              <span>{c.mensaje}</span>
            </div>
          );
        })}
      </div>

      <p className="text-[10px] text-muted-foreground italic border-t border-border/30 pt-2">
        Regla central: la sección es la unidad atómica del sistema. Toda agregación
        territorial (municipio, distrito local, distrito federal, estado) se construye
        sumando secciones del catálogo INE.
      </p>
    </div>
  );
}

function Nodo({
  icono: Icono,
  label,
  valor,
  sub,
}: {
  icono: typeof Building2;
  label: string;
  valor: string;
  sub?: string;
}) {
  return (
    <div className="p-2.5 rounded-md bg-secondary/30 border border-border/30">
      <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
        <Icono className="w-3 h-3 text-primary" />
        {label}
      </div>
      <div className="text-xs font-semibold text-foreground mt-1">{valor}</div>
      {sub && <div className="text-[10px] text-muted-foreground">{sub}</div>}
    </div>
  );
}

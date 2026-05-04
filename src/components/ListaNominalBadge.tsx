// Badge que muestra la Lista Nominal estatal oficial (única fuente de verdad)
// y valida si una LN agregada parcial es consistente con el total INE.

import { Check, AlertTriangle, Loader2 } from "lucide-react";
import { useListaNominalOficial } from "@/hooks/use-lista-nominal-oficial";

const fmt = (n: number) => new Intl.NumberFormat("es-MX").format(Math.round(n));

interface Props {
  /** Si se pasa, se valida contra la LN oficial estatal y muestra cobertura. */
  lnParcial?: number;
  /** Etiqueta del subset (ej. "11 distritos federales"). */
  scope?: string;
  className?: string;
}

export function ListaNominalBadge({ lnParcial, scope, className = "" }: Props) {
  const { loading, total, secciones, esConsistente, cobertura } = useListaNominalOficial();

  if (loading) {
    return (
      <div className={`inline-flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground ${className}`}>
        <Loader2 className="w-3 h-3 animate-spin" /> Validando padrón…
      </div>
    );
  }

  // Sin parcial: solo el dato oficial estatal.
  if (typeof lnParcial !== "number") {
    return (
      <div className={`inline-flex items-center gap-1.5 text-[10px] font-mono ${className}`} title={`${secciones} secciones · INE-DERFE`}>
        <Check className="w-3 h-3 text-primary" />
        <span className="text-muted-foreground">LN estatal oficial:</span>
        <span className="text-foreground font-semibold">{fmt(total)}</span>
      </div>
    );
  }

  // Con parcial: comparar y validar.
  const cob = cobertura(lnParcial);
  const consistente = esConsistente(lnParcial);
  const esEstatal = cob >= 95;

  return (
    <div
      className={`inline-flex items-center gap-1.5 text-[10px] font-mono ${className}`}
      title={`Oficial INE: ${fmt(total)} · agregado: ${fmt(lnParcial)}`}
    >
      {esEstatal && consistente ? (
        <Check className="w-3 h-3 text-primary" />
      ) : esEstatal && !consistente ? (
        <AlertTriangle className="w-3 h-3 text-destructive" />
      ) : (
        <Check className="w-3 h-3 text-muted-foreground" />
      )}
      <span className="text-muted-foreground">{scope ? `${scope}:` : "LN agregada:"}</span>
      <span className="text-foreground font-semibold">{fmt(lnParcial)}</span>
      <span className="text-muted-foreground">
        ({cob.toFixed(0)}% del estatal {fmt(total)})
      </span>
    </div>
  );
}

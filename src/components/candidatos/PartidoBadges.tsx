import { Badge } from "@/components/ui/badge";
import { PARTIDO_COLOR } from "@/data/locales/partidos";
import { decodificarPartido } from "@/lib/candidatos/coaliciones";

interface Props {
  partido: string;
  size?: "xs" | "sm";
}

/**
 * Renderiza la candidatura: chip único para partido/independiente/única,
 * o varios chips coloreados para coaliciones.
 */
export function PartidoBadges({ partido, size = "xs" }: Props) {
  const { tipo, partidos } = decodificarPartido(partido);
  const cls = size === "xs" ? "text-[10px] font-mono" : "text-xs font-mono";

  if (tipo === "independiente") {
    return (
      <Badge variant="outline" className={`${cls} border-muted-foreground/40 text-muted-foreground`}>
        INDEPENDIENTE
      </Badge>
    );
  }
  if (tipo === "candidatura_unica") {
    return (
      <Badge variant="outline" className={`${cls} border-primary/40 text-primary`}>
        CANDIDATURA ÚNICA
      </Badge>
    );
  }
  return (
    <div className="flex flex-wrap gap-1">
      {partidos.map((p) => (
        <Badge
          key={p}
          variant="outline"
          className={cls}
          style={{
            borderColor: `${PARTIDO_COLOR[p] ?? "#6B7280"}80`,
            color: PARTIDO_COLOR[p] ?? undefined,
          }}
        >
          {p}
        </Badge>
      ))}
      {tipo === "coalicion" && (
        <span className="text-[9px] text-muted-foreground self-center font-mono uppercase">
          coalición
        </span>
      )}
    </div>
  );
}

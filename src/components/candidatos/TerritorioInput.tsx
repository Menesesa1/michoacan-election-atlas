// Input con autocompletado de territorios según el nivel del candidato.
// Texto libre (permite valores no listados, ej. una colonia o cabecera nueva)
// pero sugiere catálogo oficial cuando coincide.

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Lock, MapPin } from "lucide-react";
import { territoriosPorNivel, etiquetaTerritorio } from "@/lib/candidatos/territorios";
import type { NivelEstrategia } from "@/data/estrategia-templates";
import { cn } from "@/lib/utils";

interface Props {
  nivel: NivelEstrategia;
  value: string;
  onChange: (v: string) => void;
}

export function TerritorioInput({ nivel, value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const opciones = useMemo(() => territoriosPorNivel(nivel), [nivel]);
  const esEstatal = nivel === "gobernador";

  // Sugerencias filtradas por lo que está escribiendo el usuario
  const sugerencias = useMemo(() => {
    const q = value.trim().toLowerCase();
    if (!q) return opciones.slice(0, 8);
    return opciones
      .filter((t) => t.toLowerCase().includes(q))
      .slice(0, 8);
  }, [opciones, value]);

  const coincide = opciones.some((o) => o.toLowerCase() === value.trim().toLowerCase());

  // Para gobernatura forzamos "Estatal"
  if (esEstatal) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-md border border-input bg-muted/40">
        <Lock className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-sm">Estatal · Michoacán</span>
        <Badge variant="outline" className="text-[9px] ml-auto">Fijo para Gobernatura</Badge>
      </div>
    );
  }

  const totalCatalogo = opciones.length;

  return (
    <div className="relative">
      <div className="relative">
        <MapPin className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <Input
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder={
            nivel === "diputados"
              ? "Ej. Distrito 10 - Morelia Noroeste"
              : "Ej. Morelia, Uruapan, Zamora…"
          }
          className="pl-8"
          autoComplete="off"
        />
      </div>
      <div className="flex items-center justify-between mt-1">
        <p className="text-[10px] text-muted-foreground font-mono uppercase">
          {etiquetaTerritorio(nivel)} · {totalCatalogo} en catálogo IEM/INEGI
        </p>
        {value.trim() && (
          <span
            className={cn(
              "text-[10px] font-mono",
              coincide ? "text-emerald-400" : "text-amber-400",
            )}
          >
            {coincide ? "✓ catálogo oficial" : "⚠ texto libre"}
          </span>
        )}
      </div>

      {open && sugerencias.length > 0 && (
        <div className="absolute z-50 mt-1 w-full max-h-60 overflow-y-auto bg-popover border border-border rounded-md shadow-lg">
          {sugerencias.map((t) => (
            <button
              key={t}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onChange(t);
                setOpen(false);
              }}
              className="w-full text-left px-3 py-1.5 text-sm hover:bg-accent transition-colors"
            >
              {t}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

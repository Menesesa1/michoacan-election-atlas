// Editor manual de métricas por plataforma (seguidores, engagement rate, fecha de medición).
// Pensado para empezar a capturar a mano antes de conectar Firecrawl / scraping automatizado.

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Facebook, Twitter, Instagram, Youtube, Music2, Save, TrendingUp, Users, Calendar } from "lucide-react";
import {
  PLATAFORMA_LABEL,
  type MetricasRedes,
  type MetricaRed,
  type PlataformaRed,
} from "@/lib/candidatos/types";

interface Props {
  metricas: MetricasRedes;
  onChange: (next: MetricasRedes) => Promise<void> | void;
  saving?: boolean;
}

const PLATAFORMAS: PlataformaRed[] = ["facebook", "twitter", "instagram", "tiktok", "youtube"];

const ICONOS: Record<PlataformaRed, typeof Facebook> = {
  facebook: Facebook,
  twitter: Twitter,
  instagram: Instagram,
  tiktok: Music2,
  youtube: Youtube,
};

const COLORES: Record<PlataformaRed, string> = {
  facebook: "border-blue-500/40 text-blue-400",
  twitter: "border-sky-500/40 text-sky-400",
  instagram: "border-pink-500/40 text-pink-400",
  tiktok: "border-fuchsia-500/40 text-fuchsia-400",
  youtube: "border-red-500/40 text-red-400",
};

const formatNumero = (n: number | undefined) => {
  if (n === undefined || isNaN(n)) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString("es-MX");
};

const formatFecha = (iso: string | undefined) => {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return iso;
  }
};

export function MetricasRedesEditor({ metricas, onChange, saving }: Props) {
  const [borrador, setBorrador] = useState<MetricasRedes>(metricas ?? {});
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setBorrador(metricas ?? {});
    setDirty(false);
  }, [metricas]);

  const actualizar = (plataforma: PlataformaRed, parche: Partial<MetricaRed>) => {
    setBorrador((prev) => {
      const actual = prev[plataforma] ?? {};
      const nuevo: MetricaRed = { ...actual, ...parche };
      // Si todos los campos quedaron vacíos, quita la plataforma
      const vacio = !nuevo.seguidores && !nuevo.engagement_rate && !nuevo.notas;
      if (vacio) {
        const { [plataforma]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [plataforma]: nuevo };
    });
    setDirty(true);
  };

  const marcarHoy = (plataforma: PlataformaRed) => {
    actualizar(plataforma, { ultima_actualizacion: new Date().toISOString() });
  };

  const guardar = async () => {
    await onChange(borrador);
    setDirty(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs text-muted-foreground max-w-xl">
          Captura métricas medidas <strong className="text-foreground">manualmente hoy</strong> por plataforma.
          Marca la fecha para que los análisis sepan qué tan fresco es el dato.
          Más adelante esto se podrá precargar con scraping automatizado.
        </p>
        <Button size="sm" onClick={guardar} disabled={!dirty || saving}>
          <Save className="w-4 h-4 mr-1.5" /> Guardar métricas
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {PLATAFORMAS.map((p) => {
          const Icon = ICONOS[p];
          const m = borrador[p] ?? {};
          const tieneDatos = Boolean(m.seguidores || m.engagement_rate || m.notas);
          return (
            <Card
              key={p}
              className={`p-3 bg-card/60 border ${tieneDatos ? COLORES[p] : "border-border"}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <Icon className={`w-4 h-4 ${tieneDatos ? "" : "text-muted-foreground"}`} />
                  <span className="font-semibold text-sm">{PLATAFORMA_LABEL[p]}</span>
                </div>
                {tieneDatos && (
                  <Badge variant="outline" className="text-[9px] font-mono">
                    {formatNumero(m.seguidores)} · {m.engagement_rate ? `${m.engagement_rate}%` : "—"}
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-[10px] flex items-center gap-1 text-muted-foreground">
                    <Users className="w-3 h-3" /> Seguidores
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    value={m.seguidores ?? ""}
                    onChange={(e) =>
                      actualizar(p, {
                        seguidores: e.target.value === "" ? undefined : parseInt(e.target.value, 10),
                      })
                    }
                    placeholder="0"
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-[10px] flex items-center gap-1 text-muted-foreground">
                    <TrendingUp className="w-3 h-3" /> Engagement (%)
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    step={0.1}
                    value={m.engagement_rate ?? ""}
                    onChange={(e) =>
                      actualizar(p, {
                        engagement_rate: e.target.value === "" ? undefined : parseFloat(e.target.value),
                      })
                    }
                    placeholder="0.0"
                    className="h-8 text-sm"
                  />
                </div>
              </div>

              <div className="mt-2">
                <Label className="text-[10px] text-muted-foreground">Notas (opcional)</Label>
                <Textarea
                  rows={1}
                  value={m.notas ?? ""}
                  onChange={(e) => actualizar(p, { notas: e.target.value || undefined })}
                  placeholder="Ej. Pico tras debate, página verificada…"
                  className="text-xs min-h-[32px]"
                />
              </div>

              <div className="mt-2 flex items-center justify-between text-[10px]">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Calendar className="w-2.5 h-2.5" />
                  {m.ultima_actualizacion ? `Medido el ${formatFecha(m.ultima_actualizacion)}` : "Sin fecha"}
                </span>
                {tieneDatos && (
                  <button
                    type="button"
                    onClick={() => marcarHoy(p)}
                    className="text-primary hover:underline"
                  >
                    Marcar hoy
                  </button>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {dirty && (
        <div className="flex justify-end">
          <Button onClick={guardar} disabled={saving}>
            <Save className="w-4 h-4 mr-1.5" /> Guardar métricas
          </Button>
        </div>
      )}
    </div>
  );
}

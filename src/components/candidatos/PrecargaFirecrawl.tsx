// Diálogo que llama la edge function `firecrawl-precarga-candidato`,
// muestra propuestas de trayectoria + métricas con sus fuentes,
// y permite al usuario seleccionar cuáles fusionar a los datos verificados.

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Sparkles, Link as LinkIcon, AlertTriangle, CheckCircle2, Loader2, Globe } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type {
  Candidato, TrayectoriaHito, MetricasRedes, PlataformaRed,
  TrayectoriaTipo,
} from "@/lib/candidatos/types";
import { TRAYECTORIA_TIPO_LABEL, PLATAFORMA_LABEL } from "@/lib/candidatos/types";

interface PropuestaTrayectoria {
  anio: number;
  cargo: string;
  partido?: string;
  tipo: TrayectoriaTipo;
  descripcion?: string;
  fuentes: string[];
  confianza: "alta" | "media" | "baja";
}

interface PropuestaMetrica {
  plataforma: PlataformaRed;
  seguidores?: number;
  engagement_rate?: number;
  fuente_url: string;
  nota_extraccion?: string;
  confianza: "alta" | "media" | "baja";
}

interface ResultadoPrecarga {
  trayectoria_propuesta: PropuestaTrayectoria[];
  metricas_propuesta: PropuestaMetrica[];
  fuentes_consultadas: { url: string; titulo?: string; tipo: string }[];
  notas: string[];
  errores: string[];
}

interface Props {
  candidato: Candidato;
  open: boolean;
  onClose: () => void;
  onAplicado: (parche: { trayectoria?: TrayectoriaHito[]; metricas_redes?: MetricasRedes }) => Promise<void>;
}

const CONFIANZA_COLOR = {
  alta: "border-emerald-500/40 text-emerald-300",
  media: "border-amber-500/40 text-amber-300",
  baja: "border-rose-500/40 text-rose-300",
};

export function PrecargaFirecrawl({ candidato, open, onClose, onAplicado }: Props) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<ResultadoPrecarga | null>(null);
  const [trayMarcadas, setTrayMarcadas] = useState<Set<number>>(new Set());
  const [metMarcadas, setMetMarcadas] = useState<Set<number>>(new Set());
  const [aplicando, setAplicando] = useState(false);

  const ejecutar = async () => {
    setLoading(true);
    setResultado(null);
    setTrayMarcadas(new Set());
    setMetMarcadas(new Set());
    try {
      const { data, error } = await supabase.functions.invoke("firecrawl-precarga-candidato", {
        body: {
          nombre: candidato.nombre,
          partido: candidato.partido,
          territorio: candidato.territorio,
          cargo_buscado: candidato.cargo_buscado ?? undefined,
          nivel: candidato.nivel,
          redes: candidato.redes ?? {},
        },
      });
      if (error) throw error;
      const payload = data as ResultadoPrecarga & { error?: string };
      if (payload?.error) throw new Error(payload.error);
      setResultado(payload);
      // Pre-selecciona propuestas de confianza alta
      const trayHigh = new Set<number>();
      payload.trayectoria_propuesta?.forEach((p, i) => { if (p.confianza === "alta") trayHigh.add(i); });
      setTrayMarcadas(trayHigh);
      const metHigh = new Set<number>();
      payload.metricas_propuesta?.forEach((p, i) => { if (p.confianza !== "baja" && p.seguidores) metHigh.add(i); });
      setMetMarcadas(metHigh);

      const total = (payload.trayectoria_propuesta?.length ?? 0) + (payload.metricas_propuesta?.length ?? 0);
      if (total === 0) {
        toast({ title: "Sin propuestas", description: "Firecrawl no encontró información extraíble. Revisa las notas." });
      } else {
        toast({ title: `${total} propuestas listas para validar`, description: "Marca las que quieras conservar y aplica." });
      }
    } catch (err) {
      toast({
        title: "Error en pre-carga",
        description: err instanceof Error ? err.message : "Reintenta",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleTray = (i: number) => {
    setTrayMarcadas((prev) => {
      const n = new Set(prev);
      if (n.has(i)) n.delete(i); else n.add(i);
      return n;
    });
  };

  const toggleMet = (i: number) => {
    setMetMarcadas((prev) => {
      const n = new Set(prev);
      if (n.has(i)) n.delete(i); else n.add(i);
      return n;
    });
  };

  const aplicar = async () => {
    if (!resultado) return;
    setAplicando(true);
    try {
      const parche: { trayectoria?: TrayectoriaHito[]; metricas_redes?: MetricasRedes } = {};

      // Trayectoria: fusiona seleccionadas con las existentes (evita duplicar año+cargo)
      if (trayMarcadas.size > 0) {
        const existentes = candidato.trayectoria ?? [];
        const nuevos: TrayectoriaHito[] = [];
        Array.from(trayMarcadas).forEach((i) => {
          const p = resultado.trayectoria_propuesta[i];
          if (!p) return;
          const dup = existentes.some(
            (h) => h.anio === p.anio && h.cargo.trim().toLowerCase() === p.cargo.trim().toLowerCase(),
          );
          if (dup) return;
          nuevos.push({
            id: crypto.randomUUID(),
            anio: p.anio,
            cargo: `[Borrador IA] ${p.cargo}`,
            partido: p.partido,
            tipo: p.tipo,
            descripcion: p.descripcion ?? `Confianza: ${p.confianza}. Verificar antes de usar en estrategia.`,
            fuentes: p.fuentes,
          });
        });
        parche.trayectoria = [...existentes, ...nuevos];
      }

      // Métricas: sobrescribe por plataforma seleccionada
      if (metMarcadas.size > 0) {
        const existentes = candidato.metricas_redes ?? {};
        const nuevas: MetricasRedes = { ...existentes };
        Array.from(metMarcadas).forEach((i) => {
          const p = resultado.metricas_propuesta[i];
          if (!p) return;
          nuevas[p.plataforma] = {
            seguidores: p.seguidores,
            engagement_rate: p.engagement_rate,
            ultima_actualizacion: new Date().toISOString(),
            notas: `[Borrador IA · ${p.confianza}] Fuente: ${p.fuente_url}${p.nota_extraccion ? ` · ${p.nota_extraccion}` : ""}`,
          };
        });
        parche.metricas_redes = nuevas;
      }

      if (!parche.trayectoria && !parche.metricas_redes) {
        toast({ title: "Nada seleccionado", description: "Marca al menos una propuesta." });
        return;
      }

      await onAplicado(parche);
      toast({
        title: "Borradores aplicados",
        description: `Revisa los hitos y métricas marcados como "Borrador IA" y verifícalos.`,
      });
      onClose();
    } catch (err) {
      toast({
        title: "Error aplicando",
        description: err instanceof Error ? err.message : "Reintenta",
        variant: "destructive",
      });
    } finally {
      setAplicando(false);
    }
  };

  const totalSeleccionado = trayMarcadas.size + metMarcadas.size;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            Precarga con Firecrawl: {candidato.nombre}
          </DialogTitle>
          <DialogDescription className="text-xs">
            Busca trayectoria en Wikipedia / IEM / sitios oficiales y métricas en redes públicas.
            <strong className="text-foreground"> Tú validas y guardas.</strong> Los hitos quedarán marcados como
            "Borrador IA" para que los revises antes de usarlos en estrategia.
          </DialogDescription>
        </DialogHeader>

        {!resultado && !loading && (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 py-8 text-center">
            <Globe className="w-10 h-10 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground max-w-md">
              Firecrawl buscará en Wikipedia, IEM y sitios oficiales por trayectoria política,
              y scrapéará las páginas de redes capturadas en el perfil para extraer métricas.
            </p>
            <Button onClick={ejecutar}>
              <Sparkles className="w-4 h-4 mr-1.5" />
              Iniciar pre-carga
            </Button>
            <p className="text-[10px] text-muted-foreground">
              ⚠ Consume créditos de Firecrawl + Lovable AI. Tarda ~30-60 s.
            </p>
          </div>
        )}

        {loading && (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Buscando, scrapeando y normalizando…</p>
            <p className="text-[10px] text-muted-foreground">Esto puede tardar hasta 1 minuto</p>
          </div>
        )}

        {resultado && (
          <ScrollArea className="flex-1 pr-3">
            <div className="space-y-4 pb-2">
              {/* Notas y errores */}
              {(resultado.notas.length > 0 || resultado.errores.length > 0) && (
                <Card className="p-3 bg-card/40 border-border/40 space-y-1.5 text-xs">
                  {resultado.notas.map((n, i) => (
                    <div key={`n-${i}`} className="text-muted-foreground">• {n}</div>
                  ))}
                  {resultado.errores.map((e, i) => (
                    <div key={`e-${i}`} className="text-amber-300 flex gap-1.5">
                      <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" /> {e}
                    </div>
                  ))}
                </Card>
              )}

              {/* Trayectoria propuesta */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Trayectoria propuesta ({resultado.trayectoria_propuesta.length})</h3>
                  {resultado.trayectoria_propuesta.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setTrayMarcadas(trayMarcadas.size === resultado.trayectoria_propuesta.length ? new Set() : new Set(resultado.trayectoria_propuesta.map((_, i) => i)))}
                      className="text-[10px] text-primary hover:underline"
                    >
                      {trayMarcadas.size === resultado.trayectoria_propuesta.length ? "Deseleccionar todo" : "Seleccionar todo"}
                    </button>
                  )}
                </div>
                {resultado.trayectoria_propuesta.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">Sin hitos extraídos.</p>
                ) : (
                  <div className="space-y-2">
                    {resultado.trayectoria_propuesta.map((p, i) => (
                      <Card key={i} className={`p-3 bg-card/60 cursor-pointer transition-colors ${trayMarcadas.has(i) ? "border-primary/60 bg-primary/5" : ""}`} onClick={() => toggleTray(i)}>
                        <div className="flex items-start gap-2">
                          <Checkbox checked={trayMarcadas.has(i)} onCheckedChange={() => toggleTray(i)} className="mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <Badge variant="outline" className="font-mono text-[10px]">{p.anio}</Badge>
                              <Badge variant="outline" className="text-[10px]">{TRAYECTORIA_TIPO_LABEL[p.tipo]}</Badge>
                              {p.partido && <Badge variant="secondary" className="text-[10px]">{p.partido}</Badge>}
                              <Badge variant="outline" className={`text-[10px] ${CONFIANZA_COLOR[p.confianza]}`}>
                                confianza {p.confianza}
                              </Badge>
                            </div>
                            <div className="font-semibold text-sm mt-1">{p.cargo}</div>
                            {p.descripcion && <p className="text-xs text-muted-foreground mt-0.5">{p.descripcion}</p>}
                            {p.fuentes.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {p.fuentes.map((f, j) => (
                                  <a key={j} href={f} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline truncate max-w-[220px]">
                                    <LinkIcon className="w-2.5 h-2.5 shrink-0" />
                                    <span className="truncate">{f.replace(/^https?:\/\//, "")}</span>
                                  </a>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              {/* Métricas propuesta */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Métricas de redes ({resultado.metricas_propuesta.length})</h3>
                  {resultado.metricas_propuesta.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setMetMarcadas(metMarcadas.size === resultado.metricas_propuesta.length ? new Set() : new Set(resultado.metricas_propuesta.map((_, i) => i)))}
                      className="text-[10px] text-primary hover:underline"
                    >
                      {metMarcadas.size === resultado.metricas_propuesta.length ? "Deseleccionar todo" : "Seleccionar todo"}
                    </button>
                  )}
                </div>
                {resultado.metricas_propuesta.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">Sin métricas extraídas (revisa que las URLs de redes estén capturadas en el perfil).</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {resultado.metricas_propuesta.map((p, i) => (
                      <Card key={i} className={`p-3 bg-card/60 cursor-pointer transition-colors ${metMarcadas.has(i) ? "border-primary/60 bg-primary/5" : ""}`} onClick={() => toggleMet(i)}>
                        <div className="flex items-start gap-2">
                          <Checkbox checked={metMarcadas.has(i)} onCheckedChange={() => toggleMet(i)} className="mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <Badge variant="secondary" className="text-[10px]">{PLATAFORMA_LABEL[p.plataforma]}</Badge>
                              <Badge variant="outline" className={`text-[10px] ${CONFIANZA_COLOR[p.confianza]}`}>
                                {p.confianza}
                              </Badge>
                            </div>
                            <div className="font-semibold text-base mt-1">
                              {p.seguidores ? p.seguidores.toLocaleString("es-MX") : "—"} <span className="text-[10px] font-normal text-muted-foreground">seguidores</span>
                            </div>
                            {p.engagement_rate !== undefined && p.engagement_rate !== null && (
                              <div className="text-xs text-muted-foreground">Engagement: {p.engagement_rate}%</div>
                            )}
                            {p.nota_extraccion && <p className="text-[10px] text-muted-foreground italic mt-0.5">{p.nota_extraccion}</p>}
                            <a href={p.fuente_url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline mt-1 truncate max-w-full">
                              <LinkIcon className="w-2.5 h-2.5 shrink-0" />
                              <span className="truncate">{p.fuente_url.replace(/^https?:\/\//, "")}</span>
                            </a>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              {/* Fuentes consultadas */}
              {resultado.fuentes_consultadas.length > 0 && (
                <details className="text-xs">
                  <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                    Fuentes consultadas ({resultado.fuentes_consultadas.length})
                  </summary>
                  <ul className="mt-1.5 space-y-0.5 pl-3">
                    {resultado.fuentes_consultadas.map((f, i) => (
                      <li key={i}>
                        <a href={f.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate inline-flex items-center gap-1">
                          <Badge variant="outline" className="text-[9px]">{f.tipo}</Badge>
                          <span className="truncate">{f.titulo ?? f.url.replace(/^https?:\/\//, "")}</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          </ScrollArea>
        )}

        <DialogFooter className="border-t border-border/40 pt-3">
          <Button variant="ghost" onClick={onClose}>Cerrar</Button>
          {resultado && (
            <Button onClick={aplicar} disabled={totalSeleccionado === 0 || aplicando}>
              {aplicando ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-1.5" />}
              Aplicar {totalSeleccionado > 0 ? `(${totalSeleccionado})` : ""}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

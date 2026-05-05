import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Brain, ChevronDown, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Mencion {
  id: string;
  titulo: string;
  fragmento: string | null;
  url: string | null;
  fuente: string | null;
  entidad_nombre: string;
  sentimiento: number;
  emociones: Record<string, number> | null;
  sarcasmo: boolean | null;
  detectada_en: string;
  publicada_en: string | null;
}

// Las 5 emociones políticas primarias (Ekman adaptado)
const EMOCIONES_PRIMARIAS = ["miedo", "alegria", "ira", "asco", "sorpresa"] as const;

// Mapeo desde claves del backend (que usa enojo/esperanza/etc.) a las 5 primarias políticas
const MAP_BACKEND: Record<string, string> = {
  enojo: "ira",
  ira: "ira",
  miedo: "miedo",
  esperanza: "alegria",
  alegria: "alegria",
  orgullo: "alegria",
  desconfianza: "asco",
  asco: "asco",
  indignacion: "ira",
  sorpresa: "sorpresa",
};

function normalizarEmociones(raw: Record<string, number> | null): Record<string, number> {
  const out: Record<string, number> = Object.fromEntries(EMOCIONES_PRIMARIAS.map((e) => [e, 0]));
  if (!raw) return out;
  for (const [k, v] of Object.entries(raw)) {
    const target = MAP_BACKEND[k.toLowerCase()];
    if (target) out[target] = Math.max(out[target], Number(v) || 0);
  }
  return out;
}

function confianzaSarcasmo(m: Mencion): number {
  // Heurística de transparencia: el sarcasmo se infiere combinando flag + magnitud
  // de emociones contradictorias (alegría vs ira/asco) y signo del sentimiento.
  if (!m.emociones) return 0;
  const e = normalizarEmociones(m.emociones);
  const positivo = e.alegria;
  const negativo = Math.max(e.ira, e.asco, e.miedo);
  const contradiccion = Math.min(positivo, negativo);
  const baseFlag = m.sarcasmo ? 0.55 : 0.0;
  return Math.min(0.99, baseFlag + contradiccion * 0.6);
}

export default function PsicointValidator() {
  const [data, setData] = useState<Mencion[]>([]);
  const [loading, setLoading] = useState(true);

  const cargar = async () => {
    setLoading(true);
    const { data: rows } = await supabase
      .from("social_menciones")
      .select("id, titulo, fragmento, url, fuente, entidad_nombre, sentimiento, emociones, sarcasmo, detectada_en, publicada_en")
      .order("detectada_en", { ascending: false })
      .limit(40);
    setData((rows ?? []) as Mencion[]);
    setLoading(false);
  };

  useEffect(() => { cargar(); }, []);

  return (
    <Card className="bg-card/50 backdrop-blur border-border/50">
      <div className="flex items-start justify-between p-4 border-b border-border/50">
        <div>
          <h2 className="text-base font-bold flex items-center gap-2">
            <Brain className="w-4 h-4 text-purple-400" />
            01 · Validador PSICOINT / NLP
          </h2>
          <p className="text-[11px] text-muted-foreground font-mono mt-1">
            tabla → <span className="text-primary">social_menciones</span> · clasificador en{" "}
            <span className="text-primary">monitor-social</span> (google/gemini-2.5-flash)
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={cargar} disabled={loading}>
          <RefreshCw className={`w-3 h-3 mr-1 ${loading ? "animate-spin" : ""}`} />
          Refrescar
        </Button>
      </div>

      <div className="p-2 overflow-auto">
        {loading ? (
          <p className="p-4 text-xs text-muted-foreground">Cargando menciones reales…</p>
        ) : data.length === 0 ? (
          <p className="p-4 text-xs text-muted-foreground">
            No hay menciones clasificadas todavía. Ejecuta <code>monitor-social</code> en /inteligencia.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="text-[10px] uppercase font-mono">
                <TableHead className="w-8"></TableHead>
                <TableHead>Comentario · Entidad</TableHead>
                {EMOCIONES_PRIMARIAS.map((e) => (
                  <TableHead key={e} className="text-right w-[64px]">{e}</TableHead>
                ))}
                <TableHead className="text-center w-[100px]">Sarcasmo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((m) => {
                const e = normalizarEmociones(m.emociones);
                const conf = confianzaSarcasmo(m);
                return (
                  <Collapsible key={m.id} asChild>
                    <>
                      <TableRow className="text-xs align-top">
                        <TableCell className="p-2">
                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6">
                              <ChevronDown className="w-3 h-3" />
                            </Button>
                          </CollapsibleTrigger>
                        </TableCell>
                        <TableCell className="max-w-[280px]">
                          <div className="font-medium line-clamp-2">{m.titulo}</div>
                          <div className="text-[10px] text-muted-foreground font-mono">
                            {m.entidad_nombre} · {m.fuente ?? "—"} · sent {m.sentimiento.toFixed(2)}
                          </div>
                        </TableCell>
                        {EMOCIONES_PRIMARIAS.map((key) => {
                          const v = e[key] ?? 0;
                          const pct = (v * 100).toFixed(0);
                          return (
                            <TableCell key={key} className="text-right font-mono text-[11px]">
                              <span className={v > 0.4 ? "text-primary font-semibold" : "text-muted-foreground"}>
                                {pct}%
                              </span>
                            </TableCell>
                          );
                        })}
                        <TableCell className="text-center">
                          <Badge variant={m.sarcasmo ? "default" : "outline"} className="font-mono text-[10px]">
                            {m.sarcasmo ? "TRUE" : "FALSE"} · {(conf * 100).toFixed(0)}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                      <CollapsibleContent asChild>
                        <TableRow className="bg-muted/20">
                          <TableCell colSpan={8} className="p-3 text-[11px] font-mono whitespace-pre-wrap text-muted-foreground">
                            <div className="text-primary mb-1">// payload JSON desde social_menciones.id={m.id}</div>
                            {JSON.stringify(
                              {
                                id: m.id,
                                publicada_en: m.publicada_en,
                                url: m.url,
                                fragmento: m.fragmento,
                                emociones_raw: m.emociones,
                                emociones_normalizadas: e,
                                sarcasmo: m.sarcasmo,
                                sarcasmo_confidence: conf,
                                sentimiento: m.sentimiento,
                              },
                              null,
                              2,
                            )}
                          </TableCell>
                        </TableRow>
                      </CollapsibleContent>
                    </>
                  </Collapsible>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </Card>
  );
}

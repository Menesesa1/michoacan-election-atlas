import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Copy, Check, MessageCircle, Twitter, Sparkles, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface RapidResponseInput {
  tipo: "alerta" | "mencion";
  titulo: string;
  descripcion?: string | null;
  fragmento?: string | null;
  fuente?: string | null;
  url?: string | null;
  distrito_o_entidad?: string | null;
  prioridad?: string | null;
  sentimiento?: number | null;
  candidato_propio?: string | null;
}

interface ResponseOut {
  analisis: string;
  tweets: { variante: string; texto: string }[];
  whatsapp: { variante: string; texto: string }[];
  evitar: string[];
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  input: RapidResponseInput | null;
}

export function RapidResponseDialog({ open, onOpenChange, input }: Props) {
  const [loading, setLoading] = useState(false);
  const [tono, setTono] = useState<"empatico" | "firme" | "propositivo">("empatico");
  const [data, setData] = useState<ResponseOut | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const generar = async () => {
    if (!input) return;
    setLoading(true);
    setData(null);
    try {
      const { data: out, error } = await supabase.functions.invoke("rapid-response", {
        body: { ...input, tono },
      });
      if (error) throw error;
      if (!out?.success) throw new Error(out?.error ?? "Falló la generación");
      setData(out);
      toast.success("Borradores listos", { description: "3 variantes por canal" });
    } catch (err) {
      toast.error("No se pudieron generar borradores", {
        description: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setLoading(false);
    }
  };

  const copy = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      toast.error("No se pudo copiar al portapapeles");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            Rapid Response
          </DialogTitle>
          <DialogDescription className="line-clamp-2 text-xs">
            {input?.titulo ?? "—"}
          </DialogDescription>
        </DialogHeader>

        {/* Selector de tono + acción */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-mono uppercase text-muted-foreground tracking-widest">Tono</span>
          {(["empatico", "firme", "propositivo"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTono(t)}
              className={`px-2.5 py-1 text-xs rounded-md border transition ${
                tono === t
                  ? "bg-primary/15 border-primary/50 text-primary"
                  : "bg-muted/30 border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {t === "empatico" ? "Empático" : t === "firme" ? "Firme" : "Propositivo"}
            </button>
          ))}
          <div className="flex-1" />
          <Button onClick={generar} disabled={loading || !input} size="sm" className="gap-2">
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            {loading ? "Generando…" : data ? "Regenerar" : "Generar borradores"}
          </Button>
        </div>

        {!data && !loading && (
          <div className="text-xs text-muted-foreground bg-muted/20 border border-border rounded-md p-3">
            La IA usa el discurso ciudadano más reciente como contexto y devuelve 3 variantes por canal (A: directo · B: con dato · C: emocional).
          </div>
        )}

        {data && (
          <div className="space-y-4">
            {/* Análisis */}
            <div className="rounded-md border border-primary/30 bg-primary/5 p-3">
              <div className="text-[10px] font-mono uppercase text-primary tracking-widest mb-1">Ángulo táctico</div>
              <p className="text-sm text-foreground">{data.analisis}</p>
            </div>

            {/* Tweets */}
            <section>
              <h3 className="flex items-center gap-2 text-sm font-bold mb-2">
                <Twitter className="w-4 h-4 text-sky-400" /> Tweet · 3 variantes
              </h3>
              <div className="space-y-2">
                {data.tweets.map((tw, i) => {
                  const k = `tw-${i}`;
                  return (
                    <article key={k} className="rounded-md border border-border bg-card p-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <Badge variant="outline" className="text-[9px]">Variante {tw.variante}</Badge>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-muted-foreground">{tw.texto.length}/280</span>
                          <Button size="sm" variant="ghost" className="h-6 px-2 gap-1 text-[10px]" onClick={() => copy(k, tw.texto)}>
                            {copied === k ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            {copied === k ? "Copiado" : "Copiar"}
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{tw.texto}</p>
                    </article>
                  );
                })}
              </div>
            </section>

            {/* WhatsApp */}
            <section>
              <h3 className="flex items-center gap-2 text-sm font-bold mb-2">
                <MessageCircle className="w-4 h-4 text-emerald-400" /> WhatsApp · 3 variantes
              </h3>
              <div className="space-y-2">
                {data.whatsapp.map((wa, i) => {
                  const k = `wa-${i}`;
                  return (
                    <article key={k} className="rounded-md border border-emerald-500/30 bg-emerald-500/5 p-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <Badge variant="outline" className="text-[9px]">Variante {wa.variante}</Badge>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-muted-foreground">{wa.texto.length} car.</span>
                          <Button size="sm" variant="ghost" className="h-6 px-2 gap-1 text-[10px]" onClick={() => copy(k, wa.texto)}>
                            {copied === k ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            {copied === k ? "Copiado" : "Copiar"}
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{wa.texto}</p>
                    </article>
                  );
                })}
              </div>
            </section>

            {/* Evitar */}
            {data.evitar?.length > 0 && (
              <section>
                <h3 className="flex items-center gap-2 text-sm font-bold mb-2 text-destructive">
                  <AlertCircle className="w-4 h-4" /> Qué NO decir
                </h3>
                <ul className="space-y-1">
                  {data.evitar.map((e, i) => (
                    <li key={i} className="text-xs text-muted-foreground bg-destructive/5 border-l-2 border-destructive/40 pl-2 py-1">
                      {e}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

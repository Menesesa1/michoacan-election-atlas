// Botón de precarga: llama a la edge `precargar-genero-diputados` (Perplexity),
// recibe los 72 ganadores con género y los aplica como overrides
// (clave `dip:<distrito>:<anio>`) usando `setOverrideGenero`.

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, CheckCircle2, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { setOverrideGenero } from "@/lib/paridad/historico-genero";

interface Item {
  anio: number;
  distrito: number;
  nombre: string;
  genero: "M" | "H" | "ambiguo";
}

export default function PrecargaGeneroDiputados({
  onDone,
}: {
  onDone?: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<{
    aplicados: number;
    items: Item[];
  } | null>(null);

  const ejecutar = async () => {
    setLoading(true);
    setResultado(null);
    try {
      const { data, error } = await supabase.functions.invoke(
        "precargar-genero-diputados",
        { body: {} },
      );
      if (error) throw error;
      const items: Item[] = data?.ganadores ?? [];
      let aplicados = 0;
      for (const it of items) {
        if (it.genero === "M" || it.genero === "H") {
          setOverrideGenero(`dip:${it.distrito}:${it.anio}`, it.genero);
          aplicados++;
        }
      }
      setResultado({ aplicados, items });
      toast.success(`Precarga completa: ${aplicados} géneros aplicados`);
      onDone?.();
    } catch (e) {
      toast.error(`Falló precarga: ${(e as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          Precarga automática · Diputaciones locales (Perplexity)
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Consulta los 72 ganadores (24 distritos × 2018, 2021, 2024), infiere género del
          nombre y aplica los overrides al motor de paridad. Se sobreescriben capturas previas.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button onClick={ejecutar} disabled={loading} size="sm">
          <Sparkles className={`w-3 h-3 mr-1 ${loading ? "animate-pulse" : ""}`} />
          {loading ? "Consultando Perplexity…" : "Precargar 72 diputaciones"}
        </Button>

        {resultado && (
          <div className="text-xs space-y-2">
            <div className="flex items-center gap-2 text-emerald-400">
              <CheckCircle2 className="w-3 h-3" />
              {resultado.aplicados} de {resultado.items.length} géneros aplicados
            </div>
            {resultado.items.length < 72 && (
              <div className="flex items-center gap-2 text-amber-400">
                <AlertTriangle className="w-3 h-3" />
                {72 - resultado.items.length} combinaciones sin dato confiable —
                captura manualmente en la pestaña Diputados locales.
              </div>
            )}
            <div className="max-h-40 overflow-y-auto border border-border/40 rounded p-2 font-mono text-[10px] space-y-0.5">
              {resultado.items.slice(0, 30).map((it, i) => (
                <div key={i} className="flex justify-between gap-2">
                  <span>D{it.distrito} · {it.anio}</span>
                  <span className="truncate flex-1">{it.nombre}</span>
                  <span className={it.genero === "M" ? "text-pink-400" : "text-blue-400"}>
                    {it.genero === "M" ? "♀" : it.genero === "H" ? "♂" : "?"}
                  </span>
                </div>
              ))}
              {resultado.items.length > 30 && (
                <div className="text-muted-foreground text-center pt-1">
                  + {resultado.items.length - 30} más…
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

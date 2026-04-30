import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Database, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { MUNICIPIOS_MICHOACAN_113 } from "@/data/locales/municipios-catalogo";

const ANIOS = [2015, 2018, 2021];
const TOTAL_REGISTROS = MUNICIPIOS_MICHOACAN_113.length * ANIOS.length; // 339

export function IngestaHistoricoIEM() {
  const [cargando, setCargando] = useState(false);
  const [progreso, setProgreso] = useState<{ exitosos: number; cargados: number } | null>(null);

  const cargarCobertura = async () => {
    const { count } = await supabase
      .from("historico_municipios")
      .select("*", { count: "exact", head: true });
    setProgreso({ exitosos: 0, cargados: count ?? 0 });
  };

  useEffect(() => {
    void cargarCobertura();
  }, []);

  const esperarRun = async (runId: string, timeoutMs = 240_000): Promise<{ exitosos: number; fallidos: number }> => {
    const inicio = Date.now();
    while (Date.now() - inicio < timeoutMs) {
      await new Promise((r) => setTimeout(r, 4000));
      const { data } = await supabase
        .from("historico_municipios_runs")
        .select("finalizado_en, total_exitosos, total_fallidos")
        .eq("id", runId)
        .maybeSingle();
      if (data?.finalizado_en) {
        return { exitosos: data.total_exitosos ?? 0, fallidos: data.total_fallidos ?? 0 };
      }
      await cargarCobertura();
    }
    throw new Error("Timeout esperando finalización del lote");
  };

  const ejecutar = async (loteSize = 10, soloFaltantes = true) => {
    setCargando(true);
    try {
      const municipios = MUNICIPIOS_MICHOACAN_113.map((m) => ({
        clave: m.clave,
        nombre: m.nombre,
      }));

      let exitososTotal = 0;
      let fallidosTotal = 0;

      for (let i = 0; i < municipios.length; i += loteSize) {
        const lote = municipios.slice(i, i + loteSize);
        const numLote = Math.floor(i / loteSize) + 1;
        const totalLotes = Math.ceil(municipios.length / loteSize);
        toast.info(`Lote ${numLote}/${totalLotes} · ${lote[0].nombre}…`);

        const { data, error } = await supabase.functions.invoke("ingest-historico-iem", {
          body: { municipios: lote, anios: ANIOS, solo_faltantes: soloFaltantes },
        });

        if (error || !data?.run_id) {
          toast.error("Error iniciando lote", { description: error?.message ?? "sin run_id" });
          fallidosTotal += lote.length * ANIOS.length;
          continue;
        }

        try {
          const res = await esperarRun(data.run_id);
          exitososTotal += res.exitosos;
          fallidosTotal += res.fallidos;
        } catch (e) {
          toast.warning(`Lote ${numLote} sigue procesando`, {
            description: "Continuando con el siguiente. Vuelve a ejecutar para completar.",
          });
        }
        await cargarCobertura();
      }

      toast.success("Ingesta histórica completada", {
        description: `${exitososTotal} registros exitosos · ${fallidosTotal} fallidos`,
      });
    } catch (e) {
      toast.error("Falló la ingesta", {
        description: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setCargando(false);
      void cargarCobertura();
    }
  };

  const cobertura = progreso?.cargados ?? 0;
  const pct = Math.round((cobertura / TOTAL_REGISTROS) * 100);

  return (
    <div className="rounded-lg border border-amber-500/30 bg-gradient-to-br from-amber-500/5 via-card/40 to-card/40 p-4 backdrop-blur-sm">
      <div className="flex items-center gap-2 mb-3">
        <Database className="w-4 h-4 text-amber-400" />
        <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400">
          Histórico IEM · 113 municipios × 3 ciclos
        </span>
      </div>
      <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
        Carga cómputos municipales (2015, 2018, 2021) desde fuentes oficiales (IEM Michoacán y
        Wikipedia) usando IA con dominio restringido. El briefing dejará de mostrar “s/d” en
        brecha vs rival y resultados de referencia.
      </p>

      <div className="mb-3">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-muted-foreground">
            Cobertura actual: <strong className="text-foreground">{cobertura}</strong> / {TOTAL_REGISTROS} registros
          </span>
          <span className="font-mono text-amber-400">{pct}%</span>
        </div>
        <Progress value={pct} className="h-1.5" />
      </div>

      <div className="flex flex-col md:flex-row gap-2">
        <Button
          onClick={() => ejecutar(10, true)}
          disabled={cargando}
          variant="default"
          size="sm"
        >
          {cargando ? (
            <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
          ) : (
            <Download className="w-3.5 h-3.5 mr-1.5" />
          )}
          {cargando ? "Cargando lote a lote…" : "Ingerir municipios faltantes"}
        </Button>
        <Button
          onClick={() => ejecutar(10, false)}
          disabled={cargando}
          variant="outline"
          size="sm"
        >
          Re-ingerir TODO (sobrescribe)
        </Button>
      </div>
      <p className="text-[10px] text-muted-foreground mt-2 leading-relaxed">
        El proceso tarda varios minutos (≈339 consultas). Puedes cerrar la pestaña: las inserciones
        ya hechas se conservan. Los datos faltantes se completan al volver a ejecutar.
      </p>
    </div>
  );
}

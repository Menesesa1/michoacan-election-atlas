import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, FileText, GitCompare, Briefcase, Users } from "lucide-react";
import { toast } from "sonner";
import { generarReporteMensual, generarReporteConsolidado } from "@/lib/exports/reporte-mensual";

interface Cand {
  id: string;
  nombre: string;
  partido: string;
  cargo_buscado: string | null;
  es_funcionario_publico: boolean;
  cargo_publico_actual: string | null;
}

function inicioMesPrevio(): { desde: Date; hasta: Date } {
  const hoy = new Date();
  const desde = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
  const hasta = new Date(hoy.getFullYear(), hoy.getMonth(), 0, 23, 59, 59);
  return { desde, hasta };
}

export default function Reportes() {
  const [candidatos, setCandidatos] = useState<Cand[]>([]);
  const [loading, setLoading] = useState(true);
  const [generando, setGenerando] = useState(false);
  const [generandoBatch, setGenerandoBatch] = useState(false);

  const [candidatoId, setCandidatoId] = useState<string>("");
  const [comparativoId, setComparativoId] = useState<string>("");
  const [splitRol, setSplitRol] = useState(true);

  const def = useMemo(inicioMesPrevio, []);
  const [desde, setDesde] = useState(def.desde.toISOString().slice(0, 10));
  const [hasta, setHasta] = useState(def.hasta.toISOString().slice(0, 10));

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("candidatos")
        .select(
          "id, nombre, partido, cargo_buscado, es_funcionario_publico, cargo_publico_actual",
        )
        .order("nombre");
      if (error) toast.error("No se pudieron cargar candidatos");
      setCandidatos((data ?? []) as Cand[]);
      setLoading(false);
    })();
  }, []);

  const candidatoSel = candidatos.find((c) => c.id === candidatoId);

  const generar = async () => {
    if (!candidatoId) {
      toast.error("Selecciona un candidato");
      return;
    }
    setGenerando(true);
    try {
      await generarReporteMensual({
        candidatoId,
        comparativoId: comparativoId || null,
        desde: new Date(desde),
        hasta: new Date(hasta + "T23:59:59"),
        splitRol: splitRol && (candidatoSel?.es_funcionario_publico ?? false),
      });
      toast.success("Reporte generado");
    } catch (e: any) {
      toast.error(e?.message ?? "Error al generar reporte");
    } finally {
      setGenerando(false);
    }
  };

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold">Reportes mensuales</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Genera reportes ejecutivos de monitoreo mediático estilo briefing semanal,
          ajustados a un periodo de un mes. Incluye separación opcional de rol
          candidato vs funcionario y comparativo con un segundo contendiente.
        </p>
      </div>

      <Card className="p-6 space-y-5">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5" /> Candidato principal
            </Label>
            <Select value={candidatoId} onValueChange={setCandidatoId} disabled={loading}>
              <SelectTrigger>
                <SelectValue placeholder={loading ? "Cargando..." : "Selecciona"} />
              </SelectTrigger>
              <SelectContent>
                {candidatos.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nombre} · {c.partido}
                    {c.es_funcionario_publico ? " · Funcionario" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <GitCompare className="h-3.5 w-3.5" /> Comparativo (opcional)
            </Label>
            <Select
              value={comparativoId || "__none__"}
              onValueChange={(v) => setComparativoId(v === "__none__" ? "" : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sin comparación" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">— Sin comparación —</SelectItem>
                {candidatos
                  .filter((c) => c.id !== candidatoId)
                  .map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nombre} · {c.partido}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Desde</Label>
            <Input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Hasta</Label>
            <Input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
          </div>
        </div>

        {candidatoSel?.es_funcionario_publico && (
          <div className="flex items-start gap-3 p-3 rounded-md border border-primary/30 bg-primary/5">
            <Briefcase className="h-4 w-4 text-primary mt-0.5" />
            <div className="flex-1">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="split" className="font-semibold">
                  Separar rol candidato / funcionario
                </Label>
                <Switch id="split" checked={splitRol} onCheckedChange={setSplitRol} />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {candidatoSel.nombre} ocupa actualmente:{" "}
                <span className="font-medium">
                  {candidatoSel.cargo_publico_actual ?? "cargo público"}
                </span>
                . La IA clasificará cada mención como actividad de campaña o gestión
                institucional, generando dos secciones separadas en el PDF.
              </p>
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <Button onClick={generar} disabled={generando || !candidatoId}>
            {generando ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generando…
              </>
            ) : (
              <>
                <FileText className="h-4 w-4 mr-2" /> Generar PDF
              </>
            )}
          </Button>
        </div>
      </Card>

      <Card className="p-5 bg-muted/30">
        <h2 className="font-semibold text-sm mb-2">Cómo se construye</h2>
        <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
          <li>Toma todas las menciones del candidato registradas en el periodo.</li>
          <li>
            Calcula KPIs: volumen, sentimiento, distribución diaria/semanal, día pico,
            top medios y temas dominantes.
          </li>
          <li>
            Si el candidato es funcionario público y activas el split, llama a la IA
            para etiquetar cada mención como rol candidato o rol funcionario.
          </li>
          <li>
            Si seleccionas un comparativo, agrega una sección con tabla cruzada de
            volumen, sentimiento y diferencial semanal.
          </li>
        </ul>
      </Card>
    </div>
  );
}

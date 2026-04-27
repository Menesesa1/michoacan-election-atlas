import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileDown, Sparkles } from "lucide-react";
import { toast } from "sonner";
import type { Candidato } from "@/lib/candidatos/types";
import { generarDossierComercial } from "@/lib/pdf-dossier-comercial";

const NIVEL_LABEL: Record<string, string> = {
  gobernador: "Gubernatura",
  diputados_federales: "Dip. Federal",
  diputados: "Dip. Local",
  ayuntamientos: "Ayuntamiento",
};

interface Props {
  candidatos: Candidato[];
}

export function DossierComercialSelector({ candidatos }: Props) {
  const [seleccionado, setSeleccionado] = useState<string>("");
  const [generando, setGenerando] = useState(false);

  const ordenados = useMemo(
    () => [...candidatos].sort((a, b) => a.nombre.localeCompare(b.nombre)),
    [candidatos],
  );

  const cand = candidatos.find((c) => c.id === seleccionado);

  const generar = async () => {
    if (!cand) {
      toast.error("Selecciona un candidato/distrito primero");
      return;
    }
    setGenerando(true);
    try {
      generarDossierComercial({ candidato: cand });
      toast.success("Dossier comercial generado", {
        description: `Personalizado para ${cand.nombre} · ${cand.territorio}`,
      });
    } catch (e) {
      toast.error("No se pudo generar el dossier", {
        description: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setGenerando(false);
    }
  };

  return (
    <div className="rounded-lg border border-amber-500/30 bg-gradient-to-br from-amber-500/5 via-card/40 to-card/40 p-4 backdrop-blur-sm">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-amber-400" />
        <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400">
          Dossier comercial · Personalizado por contienda
        </span>
      </div>
      <div className="flex flex-col md:flex-row gap-2 items-stretch md:items-end">
        <div className="flex-1">
          <label className="text-xs text-muted-foreground mb-1 block">
            Candidato / distrito
          </label>
          <Select value={seleccionado} onValueChange={setSeleccionado}>
            <SelectTrigger className="bg-background/60">
              <SelectValue placeholder="Selecciona candidato o distrito…" />
            </SelectTrigger>
            <SelectContent>
              {ordenados.length === 0 ? (
                <div className="px-3 py-2 text-xs text-muted-foreground">
                  Aún no hay candidatos registrados.
                </div>
              ) : (
                ordenados.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    <span className="font-medium">{c.nombre}</span>
                    <span className="text-muted-foreground ml-2 text-xs">
                      · {NIVEL_LABEL[c.nivel] ?? c.nivel} · {c.territorio} · {c.partido}
                    </span>
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
        <Button
          onClick={generar}
          disabled={!seleccionado || generando}
          className="bg-amber-500/90 hover:bg-amber-500 text-black font-semibold"
        >
          <FileDown className="w-4 h-4 mr-1.5" />
          {generando ? "Generando…" : "Descargar dossier"}
        </Button>
      </div>
      {cand && (
        <p className="text-[11px] text-muted-foreground mt-2">
          Genera 6 páginas con métricas locales calculadas para{" "}
          <span className="text-amber-400">{cand.territorio}</span>: brecha vs adversario, secciones de riesgo,
          costo semanal de inacción y reloj de campaña 2027.
        </p>
      )}
    </div>
  );
}

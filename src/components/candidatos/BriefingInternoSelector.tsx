import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText, ClipboardList } from "lucide-react";
import { toast } from "sonner";
import type { Candidato } from "@/lib/candidatos/types";
import { generarBriefingInterno } from "@/lib/pdf-briefing-interno";

const NIVEL_LABEL: Record<string, string> = {
  gobernador: "Gubernatura",
  diputados_federales: "Dip. Federal",
  diputados: "Dip. Local",
  ayuntamientos: "Ayuntamiento",
};

interface Props {
  candidatos: Candidato[];
}

export function BriefingInternoSelector({ candidatos }: Props) {
  const [seleccionado, setSeleccionado] = useState<string>("");
  const [generando, setGenerando] = useState(false);

  const ordenados = useMemo(
    () => [...candidatos].sort((a, b) => a.nombre.localeCompare(b.nombre)),
    [candidatos],
  );
  const cand = candidatos.find((c) => c.id === seleccionado);

  const generar = async () => {
    if (!cand) {
      toast.error("Selecciona un candidato primero");
      return;
    }
    setGenerando(true);
    try {
      await generarBriefingInterno({ candidato: cand });
      toast.success("Briefing interno generado", {
        description: `Ficha técnica de ${cand.nombre} lista para la reunión.`,
      });
    } catch (e) {
      toast.error("No se pudo generar el briefing", {
        description: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setGenerando(false);
    }
  };

  return (
    <div className="rounded-lg border border-primary/30 bg-gradient-to-br from-primary/5 via-card/40 to-card/40 p-4 backdrop-blur-sm">
      <div className="flex items-center gap-2 mb-3">
        <ClipboardList className="w-4 h-4 text-primary" />
        <span className="text-[10px] font-mono uppercase tracking-widest text-primary">
          Briefing interno · Ficha técnica para la reunión
        </span>
      </div>
      <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
        Dossier de 4-6 páginas con OSINT digital, mapa territorial + secciones, histórico
        electoral + demografía y talking points. Pensado para leer 5 minutos antes de entrar a la
        mesa con el candidato y el war room.
      </p>
      <div className="flex flex-col md:flex-row gap-2 items-stretch md:items-end">
        <div className="flex-1">
          <label className="text-xs text-muted-foreground mb-1 block">
            Candidato a briefear
          </label>
          <Select value={seleccionado} onValueChange={setSeleccionado}>
            <SelectTrigger className="bg-background/60">
              <SelectValue placeholder="Selecciona candidato…" />
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
          variant="default"
        >
          <FileText className="w-4 h-4 mr-1.5" />
          {generando ? "Generando…" : "Descargar briefing"}
        </Button>
      </div>
    </div>
  );
}

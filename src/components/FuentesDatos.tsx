import { ExternalLink, CheckCircle2 } from "lucide-react";
import { FUENTES_DATOS } from "@/data/electoral-data";

export function FuentesDatos() {
  return (
    <div className="glass-panel p-4 animate-slide-up">
      <h3 className="text-xs font-semibold text-foreground mb-1">Fuentes de Datos Oficiales</h3>
      <p className="text-[10px] text-muted-foreground mb-4 font-mono">INE · IEM · Datos Abiertos</p>

      <div className="space-y-2">
        {FUENTES_DATOS.map((fuente) => (
          <a
            key={fuente.nombre}
            href={fuente.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-3 rounded-md bg-secondary/30 hover:bg-secondary/60 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              <div>
                <p className="text-xs font-medium text-foreground">{fuente.nombre}</p>
                <p className="text-[10px] text-muted-foreground font-mono truncate max-w-[250px]">{fuente.url}</p>
              </div>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
          </a>
        ))}
      </div>

      <div className="mt-4 p-3 rounded-md bg-primary/5 border border-primary/20">
        <p className="text-[11px] text-primary font-medium mb-1">📊 Sobre los datos</p>
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          Los datos mostrados actualmente son representativos y están basados en la estructura real de los cómputos del INE. 
          Para alimentar con datos oficiales, descarga los CSV desde las fuentes listadas arriba e impórtalos al sistema.
        </p>
      </div>
    </div>
  );
}

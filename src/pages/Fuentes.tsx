import { ImportadorCSV } from "@/components/ImportadorCSV";
import { FuentesDatos } from "@/components/FuentesDatos";
import { MetodologiaMaestra } from "@/components/MetodologiaMaestra";

export default function Fuentes() {
  return (
    <div className="space-y-5">
      <div>
        <div className="text-primary text-[10px] font-mono uppercase tracking-widest">Conectividad y transparencia</div>
        <h1 className="text-2xl font-bold text-foreground">Fuentes y metodología</h1>
        <p className="text-sm text-muted-foreground mt-1 max-w-3xl">
          Importación de datasets, fuentes oficiales conectadas y declaración metodológica completa del Sistema de Mando.
          Esta página cierra el proyecto: aquí se sustenta todo lo que ves en el resto del tablero.
        </p>
      </div>

      <ImportadorCSV />
      <FuentesDatos />

      {/* Metodología maestra al final del proyecto */}
      <MetodologiaMaestra />
    </div>
  );
}

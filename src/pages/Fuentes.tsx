import { ImportadorCSV } from "@/components/ImportadorCSV";
import { FuentesDatos } from "@/components/FuentesDatos";

export default function Fuentes() {
  return (
    <div className="space-y-5">
      <div>
        <div className="text-primary text-[10px] font-mono uppercase tracking-widest">Conectividad</div>
        <h1 className="text-2xl font-bold text-foreground">Fuentes y datos</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Importe datasets vía CSV o conecte fuentes remotas (Google Sheets / JSON) en el módulo de Crisis.
        </p>
      </div>
      <ImportadorCSV />
      <FuentesDatos />
    </div>
  );
}

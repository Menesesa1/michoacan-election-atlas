import { useState } from "react";
import { KPICards } from "@/components/KPICards";
import { ResultadosPorPartido } from "@/components/ResultadosPorPartido";
import { CompetitividadChart } from "@/components/CompetitividadChart";
import { TablaDistritos } from "@/components/TablaDistritos";
import { EleccionSelector } from "@/components/EleccionSelector";
import { NivelSelector } from "@/components/NivelSelector";
import { IntencionVotoChart } from "@/components/IntencionVotoChart";
import { SentimientoMoreliaChart } from "@/components/SentimientoMoreliaChart";
import { useElectoralData } from "@/context/DataContext";

export default function MandoCentral() {
  const [eleccion, setEleccion] = useState("fed2024");
  const { isUsingMock, importedKeys } = useElectoralData();

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="text-primary text-[10px] font-mono uppercase tracking-widest">
            Vista Ejecutiva
          </div>
          <h1 className="text-2xl font-bold text-foreground">Mando Central</h1>
          <p className="text-sm text-muted-foreground">
            Inteligencia electoral, intención de voto y sentimiento social en tiempo real.
          </p>
        </div>
        <span className={`text-[10px] font-mono ${isUsingMock ? "text-muted-foreground animate-pulse-glow" : "text-primary"}`}>
          ● {isUsingMock ? "DATOS REPRESENTATIVOS" : `${importedKeys.length} DATASET(S) IMPORTADOS`}
        </span>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <NivelSelector />
        <EleccionSelector value={eleccion} onChange={setEleccion} />
      </div>

      <KPICards eleccion={eleccion} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <IntencionVotoChart />
        <SentimientoMoreliaChart />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ResultadosPorPartido eleccion={eleccion} />
        <CompetitividadChart eleccion={eleccion} />
      </div>

      <TablaDistritos eleccion={eleccion} />
    </div>
  );
}

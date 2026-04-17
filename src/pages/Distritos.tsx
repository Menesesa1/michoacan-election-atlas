import { useState } from "react";
import { KPICards } from "@/components/KPICards";
import { MapaInteractivo } from "@/components/MapaInteractivo";
import { MapaDistritos } from "@/components/MapaDistritos";
import { TablaDistritos } from "@/components/TablaDistritos";
import { EleccionSelector } from "@/components/EleccionSelector";
import { NivelSelector } from "@/components/NivelSelector";

export default function Distritos() {
  const [eleccion, setEleccion] = useState("fed2024");

  return (
    <div className="space-y-5">
      <div>
        <div className="text-primary text-[10px] font-mono uppercase tracking-widest">Cartografía electoral</div>
        <h1 className="text-2xl font-bold text-foreground">Distritos · Lealtad y Riesgo</h1>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <NivelSelector />
        <EleccionSelector value={eleccion} onChange={setEleccion} />
      </div>

      <KPICards eleccion={eleccion} />
      <MapaInteractivo eleccion={eleccion} />
      <MapaDistritos eleccion={eleccion} />
      <TablaDistritos eleccion={eleccion} />
    </div>
  );
}

import { useState } from "react";
import { Header } from "@/components/Header";
import { KPICards } from "@/components/KPICards";
import { ResultadosPorPartido } from "@/components/ResultadosPorPartido";
import { TablaDistritos } from "@/components/TablaDistritos";
import { TendenciasHistoricas } from "@/components/TendenciasHistoricas";
import { CompetitividadChart } from "@/components/CompetitividadChart";
import { SimuladorEscenarios } from "@/components/SimuladorEscenarios";
import { FuentesDatos } from "@/components/FuentesDatos";
import { MapaDistritos } from "@/components/MapaDistritos";
import { MapaInteractivo } from "@/components/MapaInteractivo";
import { EleccionSelector } from "@/components/EleccionSelector";
import { ImportadorCSV } from "@/components/ImportadorCSV";
import { NivelSelector } from "@/components/NivelSelector";
import { DemografiaPanel } from "@/components/DemografiaPanel";
import { useElectoralData } from "@/context/DataContext";

const Index = () => {
  const [activeTab, setActiveTab] = useState("resumen");
  const [eleccion, setEleccion] = useState("fed2024");
  const { isUsingMock, importedKeys, nivel } = useElectoralData();

  return (
    <div className="min-h-screen bg-background">
      <Header activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="container py-4 px-4 space-y-4">
        {activeTab !== "fuentes" && activeTab !== "tendencias" && activeTab !== "demografia" && (
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <NivelSelector />
              <EleccionSelector value={eleccion} onChange={setEleccion} />
            </div>
            <span className={`text-[10px] font-mono ${isUsingMock ? "text-muted-foreground animate-pulse-glow" : "text-primary"}`}>
              ● {isUsingMock ? "DATOS REPRESENTATIVOS" : `${importedKeys.length} DATASET(S) IMPORTADOS`}
            </span>
          </div>
        )}

        {activeTab === "resumen" && (
          <>
            <KPICards eleccion={eleccion} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <ResultadosPorPartido eleccion={eleccion} />
              <CompetitividadChart eleccion={eleccion} />
            </div>
            <TablaDistritos eleccion={eleccion} />
          </>
        )}

        {activeTab === "distritos" && (
          <>
            <KPICards eleccion={eleccion} />
            <MapaInteractivo eleccion={eleccion} />
            <MapaDistritos eleccion={eleccion} />
            <TablaDistritos eleccion={eleccion} />
          </>
        )}

        {activeTab === "demografia" && (
          <>
            <NivelSelector />
            <DemografiaPanel />
          </>
        )}

        {activeTab === "tendencias" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <TendenciasHistoricas />
            <SimuladorEscenarios />
          </div>
        )}

        {activeTab === "fuentes" && (
          <div className="space-y-4">
            <ImportadorCSV />
            <FuentesDatos />
          </div>
        )}

        <footer className="text-center py-4 text-[10px] text-muted-foreground font-mono">
          Analista Electoral Michoacán · Datos basados en estructura INE/IEM · Cómputos Distritales 2018-2024
        </footer>
      </main>
    </div>
  );
};

export default Index;

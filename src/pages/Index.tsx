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

const Index = () => {
  const [activeTab, setActiveTab] = useState("resumen");
  const [eleccion, setEleccion] = useState("fed2024");

  return (
    <div className="min-h-screen bg-background">
      <Header activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="container py-4 px-4 space-y-4">
        {activeTab !== "fuentes" && activeTab !== "tendencias" && (
          <div className="flex items-center justify-between">
            <EleccionSelector value={eleccion} onChange={setEleccion} />
            <span className="text-[10px] text-muted-foreground font-mono animate-pulse-glow">● DATOS REPRESENTATIVOS</span>
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
            <MapaDistritos eleccion={eleccion} />
            <TablaDistritos eleccion={eleccion} />
          </>
        )}

        {activeTab === "tendencias" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <TendenciasHistoricas />
            <SimuladorEscenarios />
          </div>
        )}

        {activeTab === "fuentes" && <FuentesDatos />}

        <footer className="text-center py-4 text-[10px] text-muted-foreground font-mono">
          Analista Electoral Michoacán · Datos basados en estructura INE · Cómputos Distritales 2018-2024
        </footer>
      </main>
    </div>
  );
};

export default Index;

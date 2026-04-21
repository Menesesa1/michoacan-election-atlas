import { TendenciasHistoricas } from "@/components/TendenciasHistoricas";
import { SimuladorEscenarios } from "@/components/SimuladorEscenarios";
import { ProyeccionEstatal2027 } from "@/components/ProyeccionEstatal2027";
import { ProyeccionDistrital2027 } from "@/components/ProyeccionDistrital2027";
import { NivelSelector } from "@/components/NivelSelector";

export default function Tendencias() {
  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="text-primary text-[10px] font-mono uppercase tracking-widest">Análisis temporal</div>
          <h1 className="text-2xl font-bold text-foreground">Tendencias y proyección 2027</h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-3xl">
            Lectura honesta del histórico real (2018–2025) más proyecciones al ciclo 2027 con metodología auditable.
            No es pronóstico: es escenario base sobre el que el estratega construye supuestos.
          </p>
        </div>
        <NivelSelector />
      </div>

      {/* Proyección estatal con sliders */}
      <ProyeccionEstatal2027 />

      {/* Proyección distrital */}
      <ProyeccionDistrital2027 />

      {/* Histórico + simulador (ya existían) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TendenciasHistoricas />
        <SimuladorEscenarios />
      </div>
    </div>
  );
}

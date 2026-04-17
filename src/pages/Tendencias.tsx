import { TendenciasHistoricas } from "@/components/TendenciasHistoricas";
import { SimuladorEscenarios } from "@/components/SimuladorEscenarios";

export default function Tendencias() {
  return (
    <div className="space-y-5">
      <div>
        <div className="text-primary text-[10px] font-mono uppercase tracking-widest">Análisis temporal</div>
        <h1 className="text-2xl font-bold text-foreground">Tendencias y simulación</h1>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TendenciasHistoricas />
        <SimuladorEscenarios />
      </div>
    </div>
  );
}

import { TendenciasHistoricas } from "@/components/TendenciasHistoricas";
import { SimuladorEscenarios } from "@/components/SimuladorEscenarios";
import { ProyeccionEstatal2027 } from "@/components/ProyeccionEstatal2027";
import { ProyeccionDistrital2027 } from "@/components/ProyeccionDistrital2027";
import { NivelSelector } from "@/components/NivelSelector";
import { Link } from "react-router-dom";
import { BookOpen } from "lucide-react";

export default function Tendencias() {
  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="text-primary text-[10px] font-mono uppercase tracking-widest">Análisis temporal</div>
          <h1 className="text-2xl font-bold text-foreground">Tendencias y proyección 2027</h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-3xl">
            Lectura honesta del histórico real (2018–2025) más proyecciones al ciclo 2027. No es pronóstico:
            es escenario base sobre el que el estratega construye supuestos.{" "}
            <Link to="/fuentes" className="text-primary hover:underline inline-flex items-center gap-1">
              <BookOpen className="w-3 h-3" /> Metodología completa en Fuentes
            </Link>
          </p>
        </div>
        <NivelSelector />
      </div>

      <ProyeccionEstatal2027 />
      <ProyeccionDistrital2027 />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TendenciasHistoricas />
        <SimuladorEscenarios />
      </div>
    </div>
  );
}

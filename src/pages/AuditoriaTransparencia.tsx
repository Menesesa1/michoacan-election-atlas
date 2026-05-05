import PsicointValidator from "@/components/auditoria/PsicointValidator";
import CibTrazabilidad from "@/components/auditoria/CibTrazabilidad";
import GeoIntPadron from "@/components/auditoria/GeoIntPadron";
import MetaAndromedaMonitor from "@/components/auditoria/MetaAndromedaMonitor";
import { ShieldCheck } from "lucide-react";

export default function AuditoriaTransparencia() {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-primary/30 bg-gradient-to-r from-primary/10 via-background to-background p-4">
        <div className="text-primary text-[10px] font-mono uppercase tracking-widest flex items-center gap-1">
          <ShieldCheck className="w-3 h-3" /> Centro de comando · Auditoría
        </div>
        <h1 className="text-2xl font-bold">Transparencia técnica del modelo</h1>
        <p className="text-xs text-muted-foreground mt-1 max-w-3xl">
          Cuatro módulos que exponen la "caja negra": clasificación NLP con porcentajes, grafos CIB con
          metadata cruda, GEOINT calculado en vivo sobre el padrón oficial DERFE 2026, y la matriz P.D.A.
          que alimenta a Meta Andrómeda. Cero métricas de vanidad — todo es trazable contra base de datos.
        </p>
      </div>

      <PsicointValidator />
      <CibTrazabilidad />
      <GeoIntPadron />
      <MetaAndromedaMonitor />
    </div>
  );
}

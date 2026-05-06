// Tab Contexto — fusiona Socioeconómico + Demografía como capas de soporte.
import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { PieChart, Users } from "lucide-react";
import Socioeconomico from "@/pages/Socioeconomico";
import Demografia from "@/pages/Demografia";
import { ListaNominalBadge } from "@/components/ListaNominalBadge";
import SeccionesPorMunicipio from "@/components/datos/SeccionesPorMunicipio";

export default function ContextoPanel() {
  const [capa, setCapa] = useState<"socioeconomico" | "demografia">("demografia");
  return (
    <div className="space-y-4">
      <Card className="p-3 flex items-center justify-between flex-wrap gap-3">
        <Tabs value={capa} onValueChange={(v) => setCapa(v as any)}>
          <TabsList>
            <TabsTrigger value="demografia" className="gap-1.5 text-xs">
              <Users className="w-3.5 h-3.5" /> Demografía
            </TabsTrigger>
            <TabsTrigger value="socioeconomico" className="gap-1.5 text-xs">
              <PieChart className="w-3.5 h-3.5" /> Socioeconómico
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <ListaNominalBadge />
      </Card>
      <SeccionesPorMunicipio />
      {capa === "demografia" ? <Demografia /> : <Socioeconomico />}
    </div>
  );
}

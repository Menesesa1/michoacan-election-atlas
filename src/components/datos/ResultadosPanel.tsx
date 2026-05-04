// Tab Resultados — fusiona Gobernador, Diputados Locales, Ayuntamientos y
// el corte por Distritos (federales/locales) en una sola pantalla con
// selector de elección. El corte distrital deja de ser tab independiente.

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Landmark, Vote, Building, Map as MapIcon } from "lucide-react";
import Gobernador from "@/pages/Gobernador";
import DiputadosLocales from "@/pages/DiputadosLocales";
import Ayuntamientos from "@/pages/Ayuntamientos";
import Distritos from "@/pages/Distritos";
import { ListaNominalBadge } from "@/components/ListaNominalBadge";

type EleccionTipo = "gobernador" | "diputados-locales" | "ayuntamientos" | "distritos";

const ELECCIONES = [
  { id: "gobernador", label: "Gobernatura", icon: Landmark, Component: Gobernador },
  { id: "diputados-locales", label: "Dip. Locales", icon: Vote, Component: DiputadosLocales },
  { id: "ayuntamientos", label: "Ayuntamientos", icon: Building, Component: Ayuntamientos },
  { id: "distritos", label: "Cartografía distrital", icon: MapIcon, Component: Distritos },
] as const;

export default function ResultadosPanel() {
  const [tipo, setTipo] = useState<EleccionTipo>("gobernador");
  const Active = ELECCIONES.find((e) => e.id === tipo)!.Component;

  return (
    <div className="space-y-4">
      <Card className="p-3 flex items-center justify-between flex-wrap gap-3">
        <Tabs value={tipo} onValueChange={(v) => setTipo(v as EleccionTipo)}>
          <TabsList>
            {ELECCIONES.map((e) => (
              <TabsTrigger key={e.id} value={e.id} className="gap-1.5 text-xs">
                <e.icon className="w-3.5 h-3.5" />
                {e.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <ListaNominalBadge />
      </Card>
      <Active />
    </div>
  );
}

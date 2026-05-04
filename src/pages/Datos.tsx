import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Landmark,
  Vote,
  Building,
  PieChart,
  Users,
  Map as MapIcon,
  GitCompareArrows,
} from "lucide-react";
import Gobernador from "@/pages/Gobernador";
import DiputadosLocales from "@/pages/DiputadosLocales";
import Ayuntamientos from "@/pages/Ayuntamientos";
import Socioeconomico from "@/pages/Socioeconomico";
import Demografia from "@/pages/Demografia";
import Distritos from "@/pages/Distritos";
import CrucesPanel from "@/components/datos/CrucesPanel";

const TABS = [
  { id: "gobernador", label: "Gobernador", icon: Landmark, Component: Gobernador },
  { id: "diputados-locales", label: "Diputados Locales", icon: Vote, Component: DiputadosLocales },
  { id: "ayuntamientos", label: "Ayuntamientos", icon: Building, Component: Ayuntamientos },
  { id: "distritos", label: "Distritos federales", icon: MapIcon, Component: Distritos },
  { id: "socioeconomico", label: "Socioeconómico", icon: PieChart, Component: Socioeconomico },
  { id: "demografia", label: "Demografía", icon: Users, Component: Demografia },
  { id: "cruces", label: "Cruces", icon: GitCompareArrows, Component: CrucesPanel },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function Datos() {
  const { tab } = useParams<{ tab?: string }>();
  const navigate = useNavigate();
  const initial = (TABS.find((t) => t.id === tab)?.id ?? "gobernador") as TabId;
  const [active, setActive] = useState<TabId>(initial);

  useEffect(() => {
    if (tab && TABS.some((t) => t.id === tab)) setActive(tab as TabId);
    else if (!tab) setActive("gobernador");
  }, [tab]);

  const onChange = (v: string) => {
    setActive(v as TabId);
    navigate(`/datos/${v}`, { replace: true });
  };

  const Active = TABS.find((t) => t.id === active)!.Component;

  return (
    <div className="space-y-5">
      <div>
        <div className="text-primary text-[10px] font-mono uppercase tracking-widest">
          Estadística referencial
        </div>
        <h1 className="text-2xl font-bold text-foreground">Datos</h1>
        <p className="text-sm text-muted-foreground mt-1 max-w-3xl">
          Resultados electorales por tipo de elección, contexto socioeconómico, padrón demográfico
          y cruces analíticos. Toda la estadística de soporte en un solo lugar.
        </p>
      </div>

      <Tabs value={active} onValueChange={onChange}>
        <TabsList className="flex-wrap h-auto justify-start">
          {TABS.map((t) => (
            <TabsTrigger key={t.id} value={t.id} className="gap-1.5">
              <t.icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div>
        <Active />
      </div>
    </div>
  );
}

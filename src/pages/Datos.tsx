import { useEffect, useState } from "react";
import { ExportButton } from "@/components/exports/ExportButton";
import { useNavigate, useParams } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, Layers, GitCompareArrows } from "lucide-react";
import ResultadosPanel from "@/components/datos/ResultadosPanel";
import ContextoPanel from "@/components/datos/ContextoPanel";
import CrucesPanel from "@/components/datos/CrucesPanel";

const TABS = [
  { id: "resultados", label: "Resultados", icon: BarChart3, Component: ResultadosPanel },
  { id: "contexto", label: "Contexto", icon: Layers, Component: ContextoPanel },
  { id: "cruces", label: "Cruces", icon: GitCompareArrows, Component: CrucesPanel },
] as const;

type TabId = (typeof TABS)[number]["id"];

// Aliases para compatibilidad con URLs antiguas y redirects.
const ALIAS: Record<string, TabId> = {
  gobernador: "resultados",
  "diputados-locales": "resultados",
  ayuntamientos: "resultados",
  distritos: "resultados",
  socioeconomico: "contexto",
  demografia: "contexto",
};

export default function Datos() {
  const { tab } = useParams<{ tab?: string }>();
  const navigate = useNavigate();

  const resolveInitial = (): TabId => {
    if (!tab) return "resultados";
    if (TABS.some((t) => t.id === tab)) return tab as TabId;
    return ALIAS[tab] ?? "resultados";
  };

  const [active, setActive] = useState<TabId>(resolveInitial());

  useEffect(() => {
    const next = resolveInitial();
    setActive(next);
    if (tab && tab !== next && ALIAS[tab]) {
      navigate(`/datos/${next}`, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const onChange = (v: string) => {
    setActive(v as TabId);
    navigate(`/datos/${v}`, { replace: true });
  };

  const Active = TABS.find((t) => t.id === active)!.Component;

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="text-primary text-[10px] font-mono uppercase tracking-widest">
            Estadística referencial
          </div>
          <h1 className="text-2xl font-bold text-foreground">Datos</h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-3xl">
            Resultados electorales por tipo de elección, contexto socioeconómico/demográfico
            y cruces analíticos. La unidad atómica es la sección; la lista nominal estatal
            es única (INE-DERFE) sin importar el corte distrital.
          </p>
        </div>
        <ExportButton
          label="Exportar"
          options={[
            { label: "Informe ejecutivo (PDF)", icon: "pdf", handler: () => import("@/lib/briefing-pdf").then(m => m.descargarBriefingPDF()) },
            { label: "Datos completos (Excel)", icon: "xlsx", handler: () => import("@/lib/exports/informe-general-xlsx").then(m => m.descargarInformeGeneralXLSX()) },
          ]}
        />
      </div>

      <Tabs value={active} onValueChange={onChange}>
        <TabsList className="flex-wrap h-auto justify-start">
          {TABS.map((t) => (
            <TabsTrigger key={t.id} value={t.id} className="gap-1.5">
              <t.icon className="w-3.5 h-3.5" />
              <span>{t.label}</span>
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

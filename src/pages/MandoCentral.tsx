import { useState } from "react";
import { KPICards } from "@/components/KPICards";
import { ResultadosPorPartido } from "@/components/ResultadosPorPartido";
import { CompetitividadChart } from "@/components/CompetitividadChart";
import { TablaDistritos } from "@/components/TablaDistritos";
import { EleccionSelector } from "@/components/EleccionSelector";
import { NivelSelector } from "@/components/NivelSelector";
import { IntencionVotoChart } from "@/components/IntencionVotoChart";
import { SentimientoMoreliaChart } from "@/components/SentimientoMoreliaChart";
import { ContiendasActivas } from "@/components/mando/ContiendasActivas";
import { CandidatosDestacados } from "@/components/mando/CandidatosDestacados";
import { EstrategiasRecientes } from "@/components/mando/EstrategiasRecientes";
import { TendenciaResumen } from "@/components/mando/TendenciaResumen";
import { InteresModulos } from "@/components/mando/InteresModulos";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useElectoralData } from "@/context/DataContext";
import { LayoutGrid, BarChart3, FileDown, Loader2 } from "lucide-react";
import { descargarBriefingPDF } from "@/lib/briefing-pdf";
import { toast } from "sonner";

export default function MandoCentral() {
  const [eleccion, setEleccion] = useState("fed2024");
  const [pdfLoading, setPdfLoading] = useState(false);
  const { isUsingMock, importedKeys } = useElectoralData();

  const handleBriefing = async () => {
    setPdfLoading(true);
    toast.info("Generando briefing…", { description: "Compilando KPIs, alertas y discurso ciudadano" });
    try {
      await descargarBriefingPDF();
      toast.success("Briefing descargado");
    } catch (err) {
      toast.error("Error al generar PDF", { description: err instanceof Error ? err.message : String(err) });
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="text-primary text-[10px] font-mono uppercase tracking-widest">
            Vista Ejecutiva
          </div>
          <h1 className="text-2xl font-bold text-foreground">Mando Central</h1>
          <p className="text-sm text-muted-foreground">
            Estado de los escenarios: contiendas, candidatos, estrategia y tendencias en un solo vistazo.
          </p>
        </div>
        <span className={`text-[10px] font-mono ${isUsingMock ? "text-muted-foreground animate-pulse-glow" : "text-primary"}`}>
          ● {isUsingMock ? "DATOS REPRESENTATIVOS" : `${importedKeys.length} DATASET(S) IMPORTADOS`}
        </span>
        <Button onClick={handleBriefing} disabled={pdfLoading} size="sm" className="gap-2">
          {pdfLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileDown className="w-3.5 h-3.5" />}
          {pdfLoading ? "Generando…" : "Briefing PDF"}
        </Button>
      </div>

      <Tabs defaultValue="resumen" className="space-y-4">
        <TabsList>
          <TabsTrigger value="resumen" className="gap-1.5">
            <LayoutGrid className="w-3.5 h-3.5" /> Resumen ejecutivo
          </TabsTrigger>
          <TabsTrigger value="detalle" className="gap-1.5">
            <BarChart3 className="w-3.5 h-3.5" /> Detalle electoral
          </TabsTrigger>
        </TabsList>

        {/* RESUMEN EJECUTIVO */}
        <TabsContent value="resumen" className="space-y-5">
          <div className="flex items-center gap-2 flex-wrap">
            <NivelSelector />
            <EleccionSelector value={eleccion} onChange={setEleccion} />
          </div>

          <KPICards eleccion={eleccion} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ContiendasActivas />
            <CandidatosDestacados />
            <EstrategiasRecientes />
            <TendenciaResumen />
            <InteresModulos />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <IntencionVotoChart />
            <SentimientoMoreliaChart />
          </div>
        </TabsContent>

        {/* DETALLE ELECTORAL */}
        <TabsContent value="detalle" className="space-y-5">
          <div className="flex items-center gap-2 flex-wrap">
            <NivelSelector />
            <EleccionSelector value={eleccion} onChange={setEleccion} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ResultadosPorPartido eleccion={eleccion} />
            <CompetitividadChart eleccion={eleccion} />
          </div>

          <TablaDistritos eleccion={eleccion} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

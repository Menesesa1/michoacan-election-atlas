import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Loader2,
  FileText,
  GitCompare,
  Briefcase,
  Users,
  Calendar,
  FileSpreadsheet,
  BookOpen,
  IdCard,
  Building2,
  Cloud,
} from "lucide-react";
import { toast } from "sonner";
import {
  generarReporteMensual,
  generarReporteConsolidado,
} from "@/lib/exports/reporte-mensual";
import { DossierComercialSelector } from "@/components/candidatos/DossierComercialSelector";
import { BriefingInternoSelector } from "@/components/candidatos/BriefingInternoSelector";
import {
  descargarInformeCandidatoPDF,
  descargarInformeCandidatoXLSX,
} from "@/lib/exports/informe-candidato";
import { descargarLibroDeCampana } from "@/lib/exports/libro-campana";
import { descargarBriefingPDF } from "@/lib/briefing-pdf";
import { descargarInformeGeneralXLSX } from "@/lib/exports/informe-general-xlsx";
import type { Candidato } from "@/lib/candidatos/types";
import { setDriveContext } from "@/lib/gdrive";

function inicioMesPrevio(): { desde: Date; hasta: Date } {
  const hoy = new Date();
  const desde = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
  const hasta = new Date(hoy.getFullYear(), hoy.getMonth(), 0, 23, 59, 59);
  return { desde, hasta };
}

export default function Reportes() {
  const [candidatos, setCandidatos] = useState<Candidato[]>([]);
  const [loading, setLoading] = useState(true);
  const [generando, setGenerando] = useState(false);
  const [generandoBatch, setGenerandoBatch] = useState(false);
  const [generandoIndiv, setGenerandoIndiv] = useState<string | null>(null);
  const [generandoEstado, setGenerandoEstado] = useState<string | null>(null);

  const [candidatoId, setCandidatoId] = useState<string>("");
  const [comparativoId, setComparativoId] = useState<string>("");
  const [splitRol, setSplitRol] = useState(true);
  const [candidatoIndivId, setCandidatoIndivId] = useState<string>("");

  const def = useMemo(inicioMesPrevio, []);
  const [desde, setDesde] = useState(def.desde.toISOString().slice(0, 10));
  const [hasta, setHasta] = useState(def.hasta.toISOString().slice(0, 10));

  // Google Drive auto-save
  const [driveEnabled, setDriveEnabled] = useState(false);
  const [driveEleccion, setDriveEleccion] = useState("Gubernatura 2027");
  const periodoAuto = useMemo(() => {
    const d = new Date(desde);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  }, [desde]);
  const [drivePeriodo, setDrivePeriodo] = useState(periodoAuto);
  useEffect(() => setDrivePeriodo(periodoAuto), [periodoAuto]);
  useEffect(() => {
    setDriveContext({
      enabled: driveEnabled,
      eleccion: driveEleccion || null,
      periodo: drivePeriodo || null,
    });
  }, [driveEnabled, driveEleccion, drivePeriodo]);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("candidatos")
        .select("*")
        .order("nombre");
      if (error) toast.error("No se pudieron cargar candidatos");
      setCandidatos((data ?? []) as unknown as Candidato[]);
      setLoading(false);
    })();
  }, []);

  const candidatoSel = candidatos.find((c: any) => c.id === candidatoId) as any;

  const generar = async () => {
    if (!candidatoId) {
      toast.error("Selecciona un candidato");
      return;
    }
    setGenerando(true);
    try {
      await generarReporteMensual({
        candidatoId,
        comparativoId: comparativoId || null,
        desde: new Date(desde),
        hasta: new Date(hasta + "T23:59:59"),
        splitRol: splitRol && (candidatoSel?.es_funcionario_publico ?? false),
      });
      toast.success("Reporte generado");
    } catch (e: any) {
      toast.error(e?.message ?? "Error al generar reporte");
    } finally {
      setGenerando(false);
    }
  };

  const aspirantesGubernatura = useMemo(
    () =>
      candidatos.filter((c: any) =>
        (c.cargo_buscado ?? "").toLowerCase().includes("gobernatura"),
      ),
    [candidatos],
  );

  const generarConsolidado = async () => {
    if (!aspirantesGubernatura.length) {
      toast.error("No hay aspirantes a la gubernatura registrados");
      return;
    }
    setGenerandoBatch(true);
    try {
      await generarReporteConsolidado({
        candidatoIds: aspirantesGubernatura.map((c: any) => c.id),
        desde: new Date(desde),
        hasta: new Date(hasta + "T23:59:59"),
      });
      toast.success(
        `Reporte consolidado generado (${aspirantesGubernatura.length} aspirantes)`,
      );
    } catch (e: any) {
      toast.error(e?.message ?? "Error al generar consolidado");
    } finally {
      setGenerandoBatch(false);
    }
  };

  const ejecutarIndividual = async (
    key: string,
    fn: () => Promise<unknown> | unknown,
    label: string,
  ) => {
    setGenerandoIndiv(key);
    try {
      await fn();
      toast.success(`${label} generado`);
    } catch (e: any) {
      toast.error(e?.message ?? `Error: ${label}`);
    } finally {
      setGenerandoIndiv(null);
    }
  };

  const ejecutarEstado = async (
    key: string,
    fn: () => Promise<unknown> | unknown,
    label: string,
  ) => {
    setGenerandoEstado(key);
    try {
      await fn();
      toast.success(`${label} generado`);
    } catch (e: any) {
      toast.error(e?.message ?? `Error: ${label}`);
    } finally {
      setGenerandoEstado(null);
    }
  };

  return (
    <div className="space-y-6 p-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold">Centro de reportes</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Hub único para generar todos los entregables: mensuales por candidato,
          consolidados por contienda, fichas comerciales, briefings internos,
          informes de campaña e informes ejecutivos del estado.
        </p>
      </div>

      <Tabs defaultValue="mensual" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="mensual" className="gap-1.5">
            <Calendar className="h-3.5 w-3.5" /> Mensual
          </TabsTrigger>
          <TabsTrigger value="consolidado" className="gap-1.5">
            <Users className="h-3.5 w-3.5" /> Consolidado
          </TabsTrigger>
          <TabsTrigger value="candidato" className="gap-1.5">
            <IdCard className="h-3.5 w-3.5" /> Por candidato
          </TabsTrigger>
          <TabsTrigger value="estado" className="gap-1.5">
            <Building2 className="h-3.5 w-3.5" /> Estado
          </TabsTrigger>
        </TabsList>

        {/* ─────────── MENSUAL ─────────── */}
        <TabsContent value="mensual" className="space-y-4">
          <Card className="p-6 space-y-5">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5" /> Candidato principal
                </Label>
                <Select
                  value={candidatoId}
                  onValueChange={setCandidatoId}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={loading ? "Cargando..." : "Selecciona"}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {candidatos.map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nombre} · {c.partido}
                        {c.es_funcionario_publico ? " · Funcionario" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <GitCompare className="h-3.5 w-3.5" /> Comparativo (opcional)
                </Label>
                <Select
                  value={comparativoId || "__none__"}
                  onValueChange={(v) =>
                    setComparativoId(v === "__none__" ? "" : v)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sin comparación" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">— Sin comparación —</SelectItem>
                    {candidatos
                      .filter((c: any) => c.id !== candidatoId)
                      .map((c: any) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.nombre} · {c.partido}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Desde</Label>
                <Input
                  type="date"
                  value={desde}
                  onChange={(e) => setDesde(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Hasta</Label>
                <Input
                  type="date"
                  value={hasta}
                  onChange={(e) => setHasta(e.target.value)}
                />
              </div>
            </div>

            {candidatoSel?.es_funcionario_publico && (
              <div className="flex items-start gap-3 p-3 rounded-md border border-primary/30 bg-primary/5">
                <Briefcase className="h-4 w-4 text-primary mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <Label htmlFor="split" className="font-semibold">
                      Separar rol candidato / funcionario
                    </Label>
                    <Switch
                      id="split"
                      checked={splitRol}
                      onCheckedChange={setSplitRol}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {candidatoSel.nombre} ocupa actualmente:{" "}
                    <span className="font-medium">
                      {candidatoSel.cargo_publico_actual ?? "cargo público"}
                    </span>
                    . La IA clasificará cada mención como actividad de campaña o
                    gestión institucional, generando dos secciones separadas en
                    el PDF.
                  </p>
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <Button onClick={generar} disabled={generando || !candidatoId}>
                {generando ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generando…
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" /> Generar PDF mensual
                  </>
                )}
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* ─────────── CONSOLIDADO ─────────── */}
        <TabsContent value="consolidado" className="space-y-4">
          <Card className="p-6 space-y-4 border-primary/30">
            <div className="flex items-start gap-3">
              <Users className="h-5 w-5 text-primary mt-0.5" />
              <div className="flex-1">
                <h2 className="font-semibold">
                  Reporte consolidado · Gubernatura
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Un único PDF con ranking, share of voice, comparativo semanal
                  y ficha individual de los{" "}
                  <strong>{aspirantesGubernatura.length}</strong> aspirantes
                  registrados, en el periodo seleccionado en la tab Mensual.
                </p>
                {aspirantesGubernatura.length > 0 && (
                  <p className="text-[11px] text-muted-foreground mt-2">
                    Incluye:{" "}
                    {aspirantesGubernatura
                      .map((c: any) => c.nombre.split(" ").slice(0, 2).join(" "))
                      .join(" · ")}
                  </p>
                )}
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Desde</Label>
                <Input
                  type="date"
                  value={desde}
                  onChange={(e) => setDesde(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Hasta</Label>
                <Input
                  type="date"
                  value={hasta}
                  onChange={(e) => setHasta(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                variant="secondary"
                onClick={generarConsolidado}
                disabled={
                  generandoBatch || aspirantesGubernatura.length === 0
                }
              >
                {generandoBatch ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generando
                    consolidado…
                  </>
                ) : (
                  <>
                    <Users className="h-4 w-4 mr-2" /> Generar consolidado (
                    {aspirantesGubernatura.length})
                  </>
                )}
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* ─────────── POR CANDIDATO ─────────── */}
        <TabsContent value="candidato" className="space-y-4">
          <Card className="p-6 space-y-4">
            <div>
              <h2 className="font-semibold flex items-center gap-2">
                <IdCard className="h-4 w-4" /> Dossier comercial
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Ficha de prospección con métricas oficiales para presentar a un
                aspirante.
              </p>
              <div className="mt-3">
                <DossierComercialSelector candidatos={candidatos} />
              </div>
            </div>
          </Card>

          <Card className="p-6 space-y-4">
            <div>
              <h2 className="font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4" /> Briefing interno
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Análisis táctico interno (perfil, OSINT y discurso) para war
                room.
              </p>
              <div className="mt-3">
                <BriefingInternoSelector candidatos={candidatos} />
              </div>
            </div>
          </Card>

          <Card className="p-6 space-y-4">
            <h2 className="font-semibold flex items-center gap-2">
              <BookOpen className="h-4 w-4" /> Informe de campaña y libro de
              campaña
            </h2>
            <div className="space-y-2">
              <Label>Candidato</Label>
              <Select
                value={candidatoIndivId}
                onValueChange={setCandidatoIndivId}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={loading ? "Cargando..." : "Selecciona"}
                  />
                </SelectTrigger>
                <SelectContent>
                  {candidatos.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nombre} · {c.partido}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={!candidatoIndivId || generandoIndiv === "info-pdf"}
                onClick={() =>
                  ejecutarIndividual(
                    "info-pdf",
                    () => descargarInformeCandidatoPDF(candidatoIndivId),
                    "Informe candidato PDF",
                  )
                }
              >
                {generandoIndiv === "info-pdf" ? (
                  <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                ) : (
                  <FileText className="h-3 w-3 mr-1.5" />
                )}
                Informe candidato (PDF)
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!candidatoIndivId || generandoIndiv === "info-xlsx"}
                onClick={() =>
                  ejecutarIndividual(
                    "info-xlsx",
                    () => descargarInformeCandidatoXLSX(candidatoIndivId),
                    "Informe candidato Excel",
                  )
                }
              >
                {generandoIndiv === "info-xlsx" ? (
                  <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                ) : (
                  <FileSpreadsheet className="h-3 w-3 mr-1.5" />
                )}
                Informe candidato (Excel)
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!candidatoIndivId || generandoIndiv === "libro"}
                onClick={() =>
                  ejecutarIndividual(
                    "libro",
                    () => descargarLibroDeCampana(candidatoIndivId),
                    "Libro de campaña",
                  )
                }
              >
                {generandoIndiv === "libro" ? (
                  <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                ) : (
                  <BookOpen className="h-3 w-3 mr-1.5" />
                )}
                Libro de campaña
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* ─────────── ESTADO ─────────── */}
        <TabsContent value="estado" className="space-y-4">
          <Card className="p-6 space-y-4">
            <h2 className="font-semibold flex items-center gap-2">
              <Building2 className="h-4 w-4" /> Reportes ejecutivos del estado
            </h2>
            <p className="text-xs text-muted-foreground">
              Consolidados de todo Michoacán: KPIs electorales, contiendas
              activas, alertas y datos completos por sección.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={generandoEstado === "brief"}
                onClick={() =>
                  ejecutarEstado(
                    "brief",
                    () => descargarBriefingPDF(),
                    "Briefing ejecutivo PDF",
                  )
                }
              >
                {generandoEstado === "brief" ? (
                  <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                ) : (
                  <FileText className="h-3 w-3 mr-1.5" />
                )}
                Briefing ejecutivo (PDF)
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={generandoEstado === "xlsx"}
                onClick={() =>
                  ejecutarEstado(
                    "xlsx",
                    () => descargarInformeGeneralXLSX(),
                    "Informe general Excel",
                  )
                }
              >
                {generandoEstado === "xlsx" ? (
                  <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                ) : (
                  <FileSpreadsheet className="h-3 w-3 mr-1.5" />
                )}
                Informe general (Excel)
              </Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="p-5 bg-muted/30">
        <h2 className="font-semibold text-sm mb-2">Cómo se construye</h2>
        <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
          <li>
            <strong>Mensual:</strong> menciones del candidato en el periodo,
            KPIs, sentimiento, top medios, temas y comparativo opcional.
          </li>
          <li>
            <strong>Split rol:</strong> si es funcionario público, la IA
            clasifica cada mención como campaña o gestión institucional.
          </li>
          <li>
            <strong>Consolidado:</strong> un solo PDF con todos los aspirantes a
            la gubernatura, ranking, share of voice y fichas individuales.
          </li>
          <li>
            <strong>Por candidato:</strong> dossier comercial, briefing interno,
            informe de campaña (PDF/Excel) y libro de campaña.
          </li>
          <li>
            <strong>Estado:</strong> briefing ejecutivo y dataset completo de
            Michoacán a nivel sección.
          </li>
        </ul>
        <p className="text-[11px] text-muted-foreground mt-3">
          Los accesos rápidos siguen disponibles en Candidatos, Datos, Mando
          Central e Inteligencia para no romper flujos existentes.
        </p>
      </Card>
    </div>
  );
}

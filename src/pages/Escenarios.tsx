import { useState, useMemo, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useElectoralData } from "@/context/DataContext";
import { useAuth } from "@/context/AuthContext";
import { NIVEL_LABEL, type NivelEscenario } from "@/data/escenarios-base";
import {
  type Posicion,
  type NivelEstrategia,
} from "@/data/estrategia-templates";
import { buildSnapshot, getTerritorios, type SnapshotPayload } from "@/lib/estrategia-context";
import { loadCatalogo } from "@/lib/secciones-catalogo";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { WizardAlcance } from "@/components/estrategia/WizardAlcance";
import { SnapshotDatos } from "@/components/estrategia/SnapshotDatos";
import { ResultadoTabs, type EstrategiaOutput } from "@/components/estrategia/ResultadoTabs";
import { ExportarPDF } from "@/components/estrategia/ExportarPDF";
import { EstrategiasGuardadas } from "@/components/estrategia/EstrategiasGuardadas";
import { Sparkles, Loader2, ChevronRight, Save, RotateCcw } from "lucide-react";

type Step = 1 | 2 | 3;

const STEP_LABEL: Record<Step, string> = {
  1: "Alcance",
  2: "Snapshot de datos",
  3: "Estrategia 360",
};

export default function Escenarios() {
  const { toast } = useToast();
  const { distritos, distritosLocales } = useElectoralData();
  const { user } = useAuth();

  const [step, setStep] = useState<Step>(1);
  const [nivel, setNivel] = useState<NivelEscenario>("gobernador");
  const [territorio, setTerritorio] = useState<string>("estatal");
  const [posicion, setPosicion] = useState<Posicion>("oficialismo");
  const [coalicion, setCoalicion] = useState<string[]>(["MORENA", "PT", "PVEM"]);
  const [horizonte, setHorizonte] = useState<string>("2027");
  const [supuestos, setSupuestos] = useState<NonNullable<SnapshotPayload["supuestos_usuario"]>>({});

  const [output, setOutput] = useState<EstrategiaOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const territorios = useMemo(
    () => getTerritorios(nivel as NivelEstrategia, distritosLocales),
    [nivel, distritosLocales],
  );

  // Cargar catálogo INE de secciones (composición urbano/rural en snapshot)
  useEffect(() => {
    void loadCatalogo().catch((e) => console.warn("loadCatalogo failed:", e));
  }, []);

  // Reset territorio cuando cambia nivel
  useEffect(() => {
    if (territorios.length > 0 && !territorios.find((t) => t.value === territorio)) {
      setTerritorio(territorios[0].value);
    }
  }, [territorios, territorio]);

  const territorioLabel = territorios.find((t) => t.value === territorio)?.label ?? territorio;

  const snapshot = useMemo<SnapshotPayload>(
    () => buildSnapshot({
      nivel: nivel as NivelEstrategia,
      nivelLabel: NIVEL_LABEL[nivel],
      territorio,
      territorioLabel,
      posicion,
      coalicion,
      horizonte,
      distritosFederales: distritos,
      distritosLocales,
      supuestos,
    }),
    [nivel, territorio, territorioLabel, posicion, coalicion, horizonte, distritos, distritosLocales, supuestos],
  );

  const generar = async () => {
    setLoading(true);
    setOutput(null);
    try {
      const { data, error } = await supabase.functions.invoke("generar-estrategia-360", {
        body: snapshot,
      });
      if (error) throw error;
      if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);
      setOutput(data as EstrategiaOutput);
      setStep(3);
      toast({
        title: "Estrategia 360 generada",
        description: "Brief ejecutivo listo. Revisa los 9 ejes en pestañas.",
      });
    } catch (err) {
      console.error(err);
      toast({
        title: "Error generando estrategia",
        description: err instanceof Error ? err.message : "Intenta de nuevo en un momento",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const guardar = async () => {
    if (!output || !user) return;
    setSaving(true);
    try {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData?.user) {
        toast({
          title: "Sesión requerida",
          description: "Inicia sesión con cuenta verificada para guardar versiones.",
          variant: "destructive",
        });
        return;
      }
      const { error } = await supabase.from("estrategias_guardadas").insert([{
        user_id: authData.user.id,
        nivel: snapshot.nivel,
        territorio: snapshot.territorio,
        titulo: `${snapshot.nivelLabel} · ${snapshot.territorio}`,
        snapshot_json: snapshot as never,
        output_json: output as never,
      }]);
      if (error) throw error;
      toast({ title: "Versión guardada", description: "La estrategia se guardó en tu repositorio." });
    } catch (err) {
      console.error(err);
      toast({
        title: "No se pudo guardar",
        description: err instanceof Error ? err.message : "Reintenta en un momento",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const cargarVersion = (snap: SnapshotPayload, out: EstrategiaOutput) => {
    // Restaurar parámetros del wizard desde el snapshot guardado
    setNivel(snap.nivel as NivelEscenario);
    setPosicion(snap.posicion);
    setCoalicion(snap.coalicion);
    setHorizonte(snap.horizonte);
    if (snap.supuestos_usuario) setSupuestos(snap.supuestos_usuario);
    setOutput(out);
    setStep(3);
    toast({
      title: "Versión cargada",
      description: `${snap.nivelLabel} · ${snap.territorio}`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <div className="text-primary text-[10px] font-mono uppercase tracking-widest">
            Estrategia 360 · Generador IA
          </div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            Brief ejecutivo de campaña
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Wizard de 3 pasos que combina datos electorales reales de Michoacán con IA
            (Gemini 2.5 Pro) para producir FODA, escenarios, segmentos, territorio,
            calendario, presupuesto, estructura, riesgos y KPIs.
          </p>
        </div>
        {output && (
          <div className="flex gap-2">
            <ExportarPDF snapshot={snapshot} data={output} />
            <Button onClick={guardar} variant="outline" size="sm" disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Save className="w-4 h-4 mr-1.5" />}
              Guardar versión
            </Button>
          </div>
        )}
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-1 overflow-x-auto">
        {([1, 2, 3] as Step[]).map((s, i) => {
          const active = step === s;
          const done = step > s;
          return (
            <div key={s} className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => (output || s < step ? setStep(s) : null)}
                disabled={!output && s > step}
                className={`flex items-center gap-2 px-3 py-2 rounded-md border text-xs font-mono uppercase tracking-wide transition-colors ${
                  active ? "bg-primary text-primary-foreground border-primary" :
                  done ? "bg-primary/10 text-primary border-primary/40 hover:bg-primary/20" :
                  "bg-card/40 text-muted-foreground border-border opacity-60 cursor-not-allowed"
                }`}
              >
                <span className="font-bold">{s}.</span>
                <span>{STEP_LABEL[s]}</span>
              </button>
              {i < 2 && <ChevronRight className="w-3 h-3 text-muted-foreground" />}
            </div>
          );
        })}
      </div>

      {/* Panel de estrategias guardadas */}
      <EstrategiasGuardadas onLoad={cargarVersion} />


      {step === 1 && (
        <div className="space-y-4">
          <WizardAlcance
            nivel={nivel}
            setNivel={setNivel}
            territorio={territorio}
            setTerritorio={setTerritorio}
            territorios={territorios}
            posicion={posicion}
            setPosicion={setPosicion}
            coalicion={coalicion}
            toggleCoalicion={(p) =>
              setCoalicion((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]))
            }
            horizonte={horizonte}
            setHorizonte={setHorizonte}
          />
          <div className="flex justify-end">
            <Button onClick={() => setStep(2)} disabled={!territorio}>
              Continuar a snapshot <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* PASO 2 */}
      {step === 2 && (
        <div className="space-y-4">
          <SnapshotDatos snapshot={snapshot} supuestos={supuestos} setSupuestos={setSupuestos} />
          <div className="flex justify-between">
            <Button variant="ghost" onClick={() => setStep(1)}>← Volver a alcance</Button>
            <Button onClick={generar} disabled={loading}>
              {loading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generando con IA…</>
              ) : (
                <><Sparkles className="w-4 h-4 mr-2" /> Generar estrategia 360</>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* PASO 3 */}
      {step === 3 && (
        <div className="space-y-4">
          {loading && (
            <div className="space-y-3">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          )}
          {output && <ResultadoTabs data={output} />}
          {!loading && !output && (
            <div className="text-center text-sm text-muted-foreground py-12">
              Aún no has generado una estrategia. Vuelve al paso 2 para lanzarla.
            </div>
          )}
          <div className="flex justify-between">
            <Button variant="ghost" onClick={() => setStep(2)}>← Editar snapshot</Button>
            {output && (
              <Button variant="outline" onClick={generar} disabled={loading}>
                <RotateCcw className="w-4 h-4 mr-1.5" /> Regenerar
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

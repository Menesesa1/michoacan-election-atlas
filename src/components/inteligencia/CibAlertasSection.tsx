import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShieldAlert, Activity, Users, Copy, Zap, RefreshCw, ExternalLink } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

interface CibAlerta {
  id: string;
  tipo_patron: string;
  severidad: string;
  entidad_nombre: string;
  candidato_id: string | null;
  titulo: string;
  descripcion: string;
  evidencia: any;
  ventana_inicio: string;
  ventana_fin: string;
  detectada_en: string;
}

const ICONO: Record<string, any> = {
  spike_anomalo: Activity,
  copy_paste: Copy,
  dominacion_fuente: Users,
  rafaga_temporal: Zap,
};

const SEVERIDAD_COLOR: Record<string, string> = {
  critica: "bg-destructive text-destructive-foreground",
  alta: "bg-orange-500/20 text-orange-300 border-orange-500/40",
  media: "bg-yellow-500/20 text-yellow-300 border-yellow-500/40",
  baja: "bg-muted text-muted-foreground",
};

export default function CibAlertasSection() {
  const [alertas, setAlertas] = useState<CibAlerta[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  const cargar = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("cib_alertas")
      .select("*")
      .order("detectada_en", { ascending: false })
      .limit(50);
    setAlertas((data ?? []) as CibAlerta[]);
    setLoading(false);
  };

  useEffect(() => {
    cargar();
  }, []);

  const ejecutarAhora = async () => {
    setRunning(true);
    const { data, error } = await supabase.functions.invoke("detectar-cib", { body: { trigger: "manual" } });
    setRunning(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Análisis CIB", description: `${data?.alertas_generadas ?? 0} patrones detectados sobre ${data?.menciones_analizadas ?? 0} menciones.` });
    cargar();
  };

  const generarRespuesta = async (a: CibAlerta) => {
    const { data, error } = await supabase.functions.invoke("generar-narrativa-accionable", {
      body: {
        entidad_nombre: a.entidad_nombre,
        candidato_id: a.candidato_id,
        contexto: `${a.titulo}. ${a.descripcion}`,
        emocion_dominante: "indignacion",
        tema_caliente: a.tipo_patron,
        territorio: "Michoacán",
        cib_alerta_id: a.id,
      },
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Mensajes generados", description: `${data?.mensajes?.length ?? 0} mensajes en sección Narrativas` });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-orange-400" />
            Alertas CIB · Comportamiento Coordinado Inauténtico
          </h2>
          <p className="text-xs text-muted-foreground">
            Detección automática de bots, copy-paste, dominación de fuente y ráfagas temporales.
          </p>
        </div>
        <Button onClick={ejecutarAhora} disabled={running} size="sm" variant="outline">
          <RefreshCw className={`w-3.5 h-3.5 mr-2 ${running ? "animate-spin" : ""}`} />
          {running ? "Analizando…" : "Analizar ahora"}
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Cargando…</p>
      ) : alertas.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          Sin alertas CIB en las últimas 48h.
        </Card>
      ) : (
        <div className="grid gap-3">
          {alertas.map((a) => {
            const Icon = ICONO[a.tipo_patron] ?? ShieldAlert;
            return (
              <Card key={a.id} className="p-4 space-y-2 bg-card/50 backdrop-blur border-border/50">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    <Icon className="w-4 h-4 mt-0.5 text-primary" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-sm">{a.titulo}</h3>
                        <Badge variant="outline" className={SEVERIDAD_COLOR[a.severidad]}>{a.severidad}</Badge>
                        <Badge variant="outline" className="text-[10px]">{a.tipo_patron.replace("_", " ")}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{a.descripcion}</p>
                      {a.evidencia?.urls?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {(a.evidencia.urls as string[]).slice(0, 3).map((u, i) => (
                            <a key={i} href={u} target="_blank" rel="noreferrer" className="text-[10px] text-primary hover:underline inline-flex items-center gap-1">
                              evidencia {i + 1} <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => generarRespuesta(a)}>
                    Generar respuesta
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

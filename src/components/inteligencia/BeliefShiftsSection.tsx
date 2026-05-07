import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Brain, RefreshCw, TrendingUp, TrendingDown, Sparkles, EyeOff, Activity } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

interface BeliefShift {
  id: string;
  entidad_nombre: string;
  candidato_id: string | null;
  tipo_shift: string;
  severidad: string;
  titulo: string;
  descripcion: string;
  delta: number | null;
  valor_anterior: number | null;
  valor_actual: number | null;
  temas_nuevos: any;
  temas_abandonados: any;
  ventana_anterior: string | null;
  ventana_actual: string | null;
  evidencia: any;
  detectado_en: string;
}

const ICONO: Record<string, any> = {
  deriva_sentimiento: Activity,
  polarizacion: TrendingUp,
  tema_emergente: Sparkles,
  tema_abandonado: EyeOff,
};

const ETIQUETA: Record<string, string> = {
  deriva_sentimiento: "Deriva sentimiento",
  polarizacion: "Polarización",
  tema_emergente: "Tema emergente",
  tema_abandonado: "Tema abandonado",
};

const SEV_COLOR: Record<string, string> = {
  critica: "bg-destructive text-destructive-foreground",
  alta: "bg-orange-500/20 text-orange-300 border-orange-500/40",
  media: "bg-yellow-500/20 text-yellow-300 border-yellow-500/40",
  baja: "bg-muted text-muted-foreground",
};

export default function BeliefShiftsSection() {
  const [shifts, setShifts] = useState<BeliefShift[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [filtro, setFiltro] = useState<string>("todos");

  const cargar = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("belief_shifts")
      .select("*")
      .order("detectado_en", { ascending: false })
      .limit(100);
    setShifts((data ?? []) as BeliefShift[]);
    setLoading(false);
  };

  useEffect(() => { cargar(); }, []);

  const ejecutar = async () => {
    setRunning(true);
    const { data, error } = await supabase.functions.invoke("detectar-belief-shifts", { body: { trigger: "manual" } });
    setRunning(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({
      title: "Detector de creencias",
      description: `${data?.shifts_detectados ?? 0} cambios detectados sobre ${data?.entidades_analizadas ?? 0} entidades.`,
    });
    cargar();
  };

  const filtrados = shifts.filter((s) => filtro === "todos" || s.tipo_shift === filtro);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Brain className="w-5 h-5 text-fuchsia-400" />
            Cambios de creencias · Belief shift detector
          </h2>
          <p className="text-xs text-muted-foreground max-w-2xl">
            Detecta deriva de sentimiento, polarización creciente, temas emergentes y temas abandonados
            comparando últimas 48h vs los 7 días previos sobre <span className="font-mono">social_resumen</span>.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            className="bg-background border border-border/60 rounded text-[11px] px-2 py-1.5"
          >
            <option value="todos">Todos los tipos</option>
            <option value="deriva_sentimiento">Deriva de sentimiento</option>
            <option value="polarizacion">Polarización</option>
            <option value="tema_emergente">Tema emergente</option>
            <option value="tema_abandonado">Tema abandonado</option>
          </select>
          <Button onClick={ejecutar} disabled={running} size="sm" variant="outline">
            <RefreshCw className={`w-3.5 h-3.5 mr-2 ${running ? "animate-spin" : ""}`} />
            {running ? "Analizando…" : "Detectar ahora"}
          </Button>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Cargando…</p>
      ) : filtrados.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          Sin cambios de creencias detectados. Ejecuta el detector para analizar la conversación reciente.
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {filtrados.map((s) => {
            const Icon = ICONO[s.tipo_shift] ?? Activity;
            const isNeg = (s.delta ?? 0) < 0;
            return (
              <Card key={s.id} className="p-4 space-y-2 bg-card/50 backdrop-blur border-border/50">
                <div className="flex items-start gap-3">
                  <Icon className={`w-4 h-4 mt-0.5 ${isNeg ? "text-red-400" : "text-fuchsia-400"}`} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-sm">{s.titulo}</h3>
                      <Badge variant="outline" className={SEV_COLOR[s.severidad]}>{s.severidad}</Badge>
                      <Badge variant="outline" className="text-[10px]">{ETIQUETA[s.tipo_shift] ?? s.tipo_shift}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{s.descripcion}</p>

                    {(s.tipo_shift === "deriva_sentimiento" || s.tipo_shift === "polarizacion") && s.valor_anterior != null && s.valor_actual != null && (
                      <div className="mt-2 flex items-center gap-2 text-[11px] font-mono">
                        <span className="text-muted-foreground">{s.valor_anterior.toFixed(2)}</span>
                        {isNeg ? <TrendingDown className="w-3 h-3 text-red-400" /> : <TrendingUp className="w-3 h-3 text-emerald-400" />}
                        <span className="font-bold">{s.valor_actual.toFixed(2)}</span>
                        <span className={`ml-1 ${isNeg ? "text-red-400" : "text-emerald-400"}`}>
                          ({(s.delta ?? 0) >= 0 ? "+" : ""}{(s.delta ?? 0).toFixed(2)})
                        </span>
                      </div>
                    )}

                    {Array.isArray(s.temas_nuevos) && s.temas_nuevos.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {s.temas_nuevos.slice(0, 6).map((t: any, i: number) => (
                          <Badge key={i} variant="outline" className="text-[10px] bg-fuchsia-500/10 text-fuchsia-300 border-fuchsia-500/30">
                            +{t.tema} ({t.count})
                          </Badge>
                        ))}
                      </div>
                    )}
                    {Array.isArray(s.temas_abandonados) && s.temas_abandonados.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {s.temas_abandonados.slice(0, 6).map((t: any, i: number) => (
                          <Badge key={i} variant="outline" className="text-[10px] bg-muted/40 text-muted-foreground line-through">
                            {t.tema} ({t.count})
                          </Badge>
                        ))}
                      </div>
                    )}

                    <div className="mt-2 text-[10px] font-mono text-muted-foreground">
                      {new Date(s.detectado_en).toLocaleString("es-MX")} · {s.entidad_nombre}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

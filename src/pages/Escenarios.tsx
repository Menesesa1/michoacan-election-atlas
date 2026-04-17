import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ESCENARIOS_BASE, NIVEL_LABEL, type NivelEscenario, type TipoEscenario } from "@/data/escenarios-base";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Target,
  Radio,
  Calendar,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Estrategia {
  titulo: string;
  detalle: string;
  area: "territorio" | "comunicacion" | "alianzas" | "defensa" | "datos" | "movilizacion";
  prioridad: "alta" | "media" | "baja";
}

interface EscenarioEnriquecido {
  tipo: TipoEscenario;
  narrativa: string;
  señales_tempranas: string[];
  estrategias: Estrategia[];
  riesgos_clave: string[];
  ventana_accion: string;
}

const TIPO_STYLE: Record<TipoEscenario, { color: string; bg: string; label: string; icon: typeof TrendingUp }> = {
  optimista: { color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/30", label: "Optimista", icon: TrendingUp },
  moderado: { color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/30", label: "Moderado", icon: Target },
  pesimista: { color: "text-rose-400", bg: "bg-rose-500/10 border-rose-500/30", label: "Pesimista", icon: AlertTriangle },
};

const AREA_LABEL: Record<Estrategia["area"], string> = {
  territorio: "Territorio",
  comunicacion: "Comunicación",
  alianzas: "Alianzas",
  defensa: "Defensa",
  datos: "Datos / Inteligencia",
  movilizacion: "Movilización",
};

const PRIORIDAD_BADGE: Record<Estrategia["prioridad"], string> = {
  alta: "bg-rose-500/20 text-rose-300 border-rose-500/40",
  media: "bg-amber-500/20 text-amber-300 border-amber-500/40",
  baja: "bg-sky-500/20 text-sky-300 border-sky-500/40",
};

export default function Escenarios() {
  const { toast } = useToast();
  const [nivel, setNivel] = useState<NivelEscenario>("gobernador");
  const [enriquecidos, setEnriquecidos] = useState<Record<NivelEscenario, EscenarioEnriquecido[] | null>>({
    gobernador: null,
    diputados: null,
    ayuntamientos: null,
  });
  const [loading, setLoading] = useState(false);

  const escenariosBase = ESCENARIOS_BASE[nivel];
  const enriquecidosActuales = enriquecidos[nivel];

  const generar = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generar-escenarios", {
        body: {
          nivel,
          nivelLabel: NIVEL_LABEL[nivel],
          escenarios: escenariosBase,
          contexto: "Michoacán de Ocampo, ciclo electoral local 2027.",
        },
      });

      if (error) throw error;
      if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);

      setEnriquecidos((prev) => ({
        ...prev,
        [nivel]: (data as { escenarios: EscenarioEnriquecido[] }).escenarios,
      }));

      toast({
        title: "Escenarios generados",
        description: "La IA enriqueció los 3 escenarios con estrategias accionables.",
      });
    } catch (err) {
      console.error(err);
      toast({
        title: "Error generando escenarios",
        description: err instanceof Error ? err.message : "Intenta de nuevo en un momento",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getEnriquecido = (tipo: TipoEscenario) =>
    enriquecidosActuales?.find((e) => e.tipo === tipo);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <div className="text-primary text-[10px] font-mono uppercase tracking-widest">
            Inteligencia prospectiva
          </div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            Escenarios &amp; Estrategias
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Tres escenarios prospectivos (optimista, moderado, pesimista) con estrategias
            accionables generadas por IA sobre datos de Michoacán.
          </p>
        </div>
        <Button onClick={generar} disabled={loading} className="shrink-0">
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generando con IA…
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              {enriquecidosActuales ? "Regenerar análisis" : "Generar análisis IA"}
            </>
          )}
        </Button>
      </div>

      {/* Selector de nivel */}
      <Tabs value={nivel} onValueChange={(v) => setNivel(v as NivelEscenario)}>
        <TabsList className="grid grid-cols-3 w-full md:w-auto">
          <TabsTrigger value="gobernador">Gobernador</TabsTrigger>
          <TabsTrigger value="diputados">Diputados Locales</TabsTrigger>
          <TabsTrigger value="ayuntamientos">Ayuntamientos</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="text-xs text-muted-foreground font-mono uppercase tracking-wide">
        {NIVEL_LABEL[nivel]}
      </div>

      {/* Escenarios */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {escenariosBase.map((esc) => {
          const style = TIPO_STYLE[esc.tipo];
          const Icon = style.icon;
          const ai = getEnriquecido(esc.tipo);

          return (
            <div
              key={esc.tipo}
              className={`rounded-lg border ${style.bg} p-5 space-y-4 flex flex-col`}
            >
              {/* Header escenario */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className={`flex items-center gap-2 ${style.color} text-xs font-mono uppercase tracking-widest`}>
                    <Icon className="w-3.5 h-3.5" />
                    {style.label}
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mt-1 leading-tight">
                    {esc.titulo}
                  </h3>
                </div>
                <div className="text-right">
                  <div className={`text-2xl font-bold ${style.color}`}>{esc.probabilidad}%</div>
                  <div className="text-[9px] text-muted-foreground font-mono uppercase">prob.</div>
                </div>
              </div>

              {/* Métricas */}
              <div className="grid grid-cols-2 gap-2">
                {esc.metricas.map((m) => (
                  <div key={m.label} className="rounded-md bg-background/40 border border-border/50 p-2">
                    <div className="text-[9px] text-muted-foreground font-mono uppercase tracking-wide">
                      {m.label}
                    </div>
                    <div className="text-sm font-bold text-foreground mt-0.5">{m.valor}</div>
                    {m.delta && (
                      <div className={`text-[10px] ${style.color} font-mono`}>{m.delta}</div>
                    )}
                  </div>
                ))}
              </div>

              {/* Supuestos base */}
              <div>
                <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-1.5">
                  Supuestos base
                </div>
                <ul className="space-y-1">
                  {esc.supuestos.map((s, i) => (
                    <li key={i} className="text-xs text-foreground/80 flex gap-1.5">
                      <ChevronRight className="w-3 h-3 mt-0.5 shrink-0 text-muted-foreground" />
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Sección IA */}
              <div className="border-t border-border/50 pt-4 space-y-3 flex-1">
                {loading && !ai ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                    <Skeleton className="h-4 w-4/6" />
                  </div>
                ) : ai ? (
                  <>
                    <div>
                      <div className="text-[10px] font-semibold text-primary uppercase tracking-widest mb-1.5 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> Narrativa IA
                      </div>
                      <p className="text-xs text-foreground/90 leading-relaxed">{ai.narrativa}</p>
                    </div>

                    <div>
                      <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-1.5 flex items-center gap-1">
                        <Radio className="w-3 h-3" /> Señales tempranas
                      </div>
                      <ul className="space-y-1">
                        {ai.señales_tempranas.map((s, i) => (
                          <li key={i} className="text-[11px] text-foreground/80 flex gap-1.5">
                            <span className="text-primary">●</span>
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-1.5 flex items-center gap-1">
                        <Target className="w-3 h-3" /> Estrategias sugeridas
                      </div>
                      <div className="space-y-2">
                        {ai.estrategias.map((s, i) => (
                          <div
                            key={i}
                            className="rounded-md bg-background/60 border border-border/50 p-2.5 space-y-1"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="text-xs font-semibold text-foreground leading-tight">
                                {s.titulo}
                              </div>
                              <Badge
                                variant="outline"
                                className={`text-[9px] uppercase ${PRIORIDAD_BADGE[s.prioridad]} shrink-0`}
                              >
                                {s.prioridad}
                              </Badge>
                            </div>
                            <p className="text-[11px] text-foreground/75 leading-snug">{s.detalle}</p>
                            <div className="text-[9px] text-muted-foreground font-mono uppercase tracking-wide">
                              {AREA_LABEL[s.area]}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-1.5 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Riesgos clave
                      </div>
                      <ul className="space-y-1">
                        {ai.riesgos_clave.map((r, i) => (
                          <li key={i} className="text-[11px] text-foreground/80 flex gap-1.5">
                            <span className="text-rose-400">▲</span>
                            <span>{r}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="rounded-md bg-primary/10 border border-primary/30 p-2 flex items-start gap-2">
                      <Calendar className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                      <div>
                        <div className="text-[9px] text-primary font-mono uppercase tracking-wide">
                          Ventana de acción
                        </div>
                        <div className="text-[11px] text-foreground">{ai.ventana_accion}</div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-[11px] text-muted-foreground italic flex items-center gap-2 py-4">
                    <Sparkles className="w-3.5 h-3.5" />
                    Pulsa <span className="font-semibold text-foreground">"Generar análisis IA"</span> para
                    obtener narrativa, señales, estrategias y riesgos.
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Disclaimer producto */}
      <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-2">
        <div className="flex items-center gap-2 text-primary text-[10px] font-mono uppercase tracking-widest">
          <Sparkles className="w-3 h-3" />
          Producto exclusivo · Uso restringido
        </div>
        <p className="text-xs text-foreground/90 leading-relaxed">
          Producto desarrollado por <span className="font-semibold text-foreground">Job Meneses, CEO de EME</span>,
          en específico para las campañas de <span className="font-semibold text-foreground">Alfonso Martínez</span> y
          aliados estratégicos para <span className="font-semibold text-foreground">diputaciones locales y ayuntamientos</span>.
          Uso exclusivo del equipo de campaña; su aplicación está centrada en el
          <span className="font-semibold text-foreground"> War Room (WR) de cada escenario</span>.
        </p>
      </div>

      {/* Footer disclaimer técnico */}
      <div className="text-[10px] text-muted-foreground font-mono border-t border-border/50 pt-3">
        Probabilidades base son estimaciones del equipo, no proyecciones formales.
        Las estrategias son sugerencias generadas por IA sobre datos disponibles —
        valida siempre con inteligencia territorial y operación local.
      </div>
    </div>
  );
}

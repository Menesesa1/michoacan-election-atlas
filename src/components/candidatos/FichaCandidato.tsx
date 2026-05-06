import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Sparkles, AlertTriangle, RotateCcw, Search, MessageSquare, User, Users2, History, Radar, ExternalLink, TrendingUp, FileText, Megaphone } from "lucide-react";
import { MetaAdsTab } from "./MetaAdsTab";
import { generarBriefingInterno } from "@/lib/pdf-briefing-interno";
import { toast as sonnerToast } from "sonner";
import type {
  Candidato, TipoAnalisis, AnalisisPerfil, AnalisisOSINT, AnalisisDiscurso,
  OsintItem, OsintItemMencion, OsintControversia, OsintFuente,
  WarRoomMiembro, TrayectoriaHito,
} from "@/lib/candidatos/types";
import { PartidoBadges } from "./PartidoBadges";
import { WarRoomEditor } from "./WarRoomEditor";
import { TrayectoriaEditor } from "./TrayectoriaEditor";
import { PrecargaFirecrawl } from "./PrecargaFirecrawl";
import { EvaluacionDigitalTab } from "./EvaluacionDigitalTab";
import { TrendsCandidatoTab } from "./TrendsCandidatoTab";
import { generarTodosLosAnalisis } from "@/lib/candidatos/auto-analisis";

interface Props {
  candidato: Candidato | null;
  open: boolean;
  onClose: () => void;
}

interface AnalisisState {
  perfil?: AnalisisPerfil;
  osint?: AnalisisOSINT;
  discurso?: AnalisisDiscurso;
}

export function FichaCandidato({ candidato, open, onClose }: Props) {
  const { toast } = useToast();
  const [analisis, setAnalisis] = useState<AnalisisState>({});
  const [loadingTipo, setLoadingTipo] = useState<TipoAnalisis | null>(null);
  const [tab, setTab] = useState<TabKey>("perfil");
  const [generandoBriefing, setGenerandoBriefing] = useState(false);

  const descargarBriefing = async () => {
    if (!candidato) return;
    setGenerandoBriefing(true);
    try {
      await generarBriefingInterno({ candidato });
      sonnerToast.success("Briefing interno generado", {
        description: `Ficha técnica de ${candidato.nombre} lista para la reunión.`,
      });
    } catch (e) {
      sonnerToast.error("No se pudo generar el briefing", {
        description: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setGenerandoBriefing(false);
    }
  };

  useEffect(() => {
    if (!candidato || !open) return;
    setAnalisis({});
    void cargarTodos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candidato?.id, open]);

  const cargarTodos = async () => {
    if (!candidato) return;
    const { data } = await supabase
      .from("candidato_analisis")
      .select("*")
      .eq("candidato_id", candidato.id)
      .order("created_at", { ascending: false });
    if (!data) return;
    const next: AnalisisState = {};
    for (const row of data) {
      // Compatibilidad: si hay análisis legacy con tipo "osint_profundo", lo
      // mostramos en la pestaña OSINT unificada. Gana el más reciente.
      const tipo = (row.tipo === "osint_profundo" ? "osint" : row.tipo) as TipoAnalisis;
      if (tipo !== "perfil" && tipo !== "osint" && tipo !== "discurso") continue;
      if (!(tipo in next)) {
        (next as Record<TipoAnalisis, unknown>)[tipo] = row.output_json;
      }
    }
    setAnalisis(next);
  };

  const generar = async (tipo: TipoAnalisis) => {
    if (!candidato) return;
    setLoadingTipo(tipo);
    try {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData?.user) throw new Error("No autenticado");

      // OSINT ahora es UNIFICADO: Perplexity (evidencia web + citas) +
      // Lovable AI (síntesis estructurada con war room/trayectoria/métricas).
      const fnName = tipo === "osint" ? "osint-unificado-candidato" : "analizar-candidato";
      const body = tipo === "osint"
        ? {
            candidato: {
              nombre: candidato.nombre,
              partido: candidato.partido,
              nivel: candidato.nivel,
              territorio: candidato.territorio,
              cargo_buscado: candidato.cargo_buscado ?? undefined,
              bio_breve: candidato.bio_breve ?? undefined,
              redes: candidato.redes,
              notas: candidato.notas ?? undefined,
              war_room: candidato.war_room ?? undefined,
              trayectoria: candidato.trayectoria ?? undefined,
              metricas_redes: candidato.metricas_redes ?? undefined,
            },
          }
        : {
            tipo,
            candidato: {
              nombre: candidato.nombre,
              partido: candidato.partido,
              nivel: candidato.nivel,
              territorio: candidato.territorio,
              cargo_buscado: candidato.cargo_buscado ?? undefined,
              bio_breve: candidato.bio_breve ?? undefined,
              redes: candidato.redes,
              notas: candidato.notas ?? undefined,
              war_room: candidato.war_room ?? undefined,
              trayectoria: candidato.trayectoria ?? undefined,
              metricas_redes: candidato.metricas_redes ?? undefined,
            },
          };

      const { data, error } = await supabase.functions.invoke(fnName, { body });
      if (error) throw error;
      const payload = data as { output?: unknown; model?: string; error?: string };
      if (payload.error) throw new Error(payload.error);
      if (!payload.output) throw new Error("Sin salida");

      await supabase.from("candidato_analisis").insert([{
        candidato_id: candidato.id,
        user_id: authData.user.id,
        tipo,
        output_json: payload.output as never,
        model: payload.model ?? "google/gemini-2.5-flash",
      }]);

      setAnalisis((prev) => ({ ...prev, [tipo]: payload.output as never }));
      toast({
        title: tipo === "osint" ? "Dossier OSINT generado" : `Análisis de ${tipo} generado`,
        description: tipo === "osint" ? "Evidencia web + razonamiento IA con citas verificables." : undefined,
      });
    } catch (err) {
      toast({
        title: "Error generando análisis",
        description: err instanceof Error ? err.message : "Reintenta",
        variant: "destructive",
      });
    } finally {
      setLoadingTipo(null);
    }
  };

  if (!candidato) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-2">
            <span>{candidato.nombre}</span>
            <PartidoBadges partido={candidato.partido} />
            <Badge variant="secondary" className="text-[10px]">{candidato.territorio}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-start gap-2 p-2 rounded-md bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200">
          <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <span>Análisis basado en información pública conocida por el modelo IA — verifica fuentes antes de tomar decisiones.</span>
        </div>

        <div className="flex justify-end">
          <Button
            size="sm"
            variant="outline"
            onClick={descargarBriefing}
            disabled={generandoBriefing}
            className="border-primary/40 text-primary hover:bg-primary/10"
          >
            <FileText className="w-3.5 h-3.5 mr-1.5" />
            {generandoBriefing ? "Generando…" : "Briefing PDF para reunión"}
          </Button>
        </div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)}>
          <TabsList className="grid grid-cols-4 md:grid-cols-8 w-full h-auto">
            <TabsTrigger value="perfil"><User className="w-3.5 h-3.5 mr-1.5" />Perfil</TabsTrigger>
            <TabsTrigger value="osint"><Search className="w-3.5 h-3.5 mr-1.5" />OSINT</TabsTrigger>
            <TabsTrigger value="discurso"><MessageSquare className="w-3.5 h-3.5 mr-1.5" />Discurso</TabsTrigger>
            <TabsTrigger value="trends"><TrendingUp className="w-3.5 h-3.5 mr-1.5" />Trends</TabsTrigger>
            <TabsTrigger value="meta_ads"><Megaphone className="w-3.5 h-3.5 mr-1.5" />Meta Ads</TabsTrigger>
            <TabsTrigger value="trayectoria"><History className="w-3.5 h-3.5 mr-1.5" />Trayectoria</TabsTrigger>
            <TabsTrigger value="eval_digital"><Radar className="w-3.5 h-3.5 mr-1.5" />Eval. digital</TabsTrigger>
            <TabsTrigger value="war_room"><Users2 className="w-3.5 h-3.5 mr-1.5" />War Room</TabsTrigger>
          </TabsList>

          {(["perfil", "osint", "discurso"] as const).map((t) => (
            <TabsContent key={t} value={t}>
              <SeccionAnalisis
                tipo={t}
                data={analisis[t]}
                loading={loadingTipo === t}
                onGenerar={() => generar(t)}
              />
            </TabsContent>
          ))}

          <TabsContent value="trends">
            <TrendsCandidatoTab candidato={candidato} />
          </TabsContent>

          <TabsContent value="trayectoria">
            <TrayectoriaTab candidato={candidato} />
          </TabsContent>

          <TabsContent value="eval_digital">
            <EvaluacionDigitalTab candidato={candidato} onMetricasActualizadas={() => { /* refresh-on-close handled por parent */ }} />
          </TabsContent>

          <TabsContent value="war_room">
            <WarRoomTab candidato={candidato} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

type TabKey = TipoAnalisis | "war_room" | "trayectoria" | "eval_digital" | "trends";

function TrayectoriaTab({ candidato }: { candidato: Candidato }) {
  const { toast } = useToast();
  const [hitos, setHitos] = useState<TrayectoriaHito[]>(candidato.trayectoria ?? []);
  const [saving, setSaving] = useState(false);
  const [precargaOpen, setPrecargaOpen] = useState(false);

  useEffect(() => {
    setHitos(candidato.trayectoria ?? []);
  }, [candidato.id, candidato.trayectoria]);

  const guardar = async (next: TrayectoriaHito[]) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("candidatos")
        .update({ trayectoria: next as never })
        .eq("id", candidato.id);
      if (error) throw error;
      setHitos(next);
      toast({ title: "Trayectoria actualizada", description: "Los próximos análisis IA usarán este historial como base verificada." });
    } catch (err) {
      toast({
        title: "Error guardando trayectoria",
        description: err instanceof Error ? err.message : "Reintenta",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const aplicarPrecarga = async (parche: { trayectoria?: TrayectoriaHito[] }) => {
    if (parche.trayectoria) await guardar(parche.trayectoria);
  };

  return (
    <div className="space-y-3 pt-3">
      <div className="flex justify-end">
        <Button size="sm" variant="outline" onClick={() => setPrecargaOpen(true)} disabled={saving}>
          <Sparkles className="w-3.5 h-3.5 mr-1.5 text-primary" />
          Precargar con Firecrawl
        </Button>
      </div>
      <TrayectoriaEditor hitos={hitos} onChange={guardar} saving={saving} />
      <PrecargaFirecrawl
        candidato={{ ...candidato, trayectoria: hitos }}
        open={precargaOpen}
        onClose={() => setPrecargaOpen(false)}
        onAplicado={aplicarPrecarga}
      />
    </div>
  );
}

function WarRoomTab({
  candidato,
}: {
  candidato: Candidato;
}) {
  const { toast } = useToast();
  const [miembros, setMiembros] = useState<WarRoomMiembro[]>(candidato.war_room ?? []);
  const [saving, setSaving] = useState(false);
  const [regenerando, setRegenerando] = useState(false);

  useEffect(() => {
    setMiembros(candidato.war_room ?? []);
  }, [candidato.id, candidato.war_room]);

  const guardar = async (next: WarRoomMiembro[]) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("candidatos")
        .update({ war_room: next as never })
        .eq("id", candidato.id);
      if (error) throw error;
      setMiembros(next);
      toast({ title: "War Room actualizado", description: "Los próximos análisis IA usarán esta información como contexto." });
    } catch (err) {
      toast({
        title: "Error guardando War Room",
        description: err instanceof Error ? err.message : "Reintenta",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const regenerarAnalisis = async () => {
    setRegenerando(true);
    try {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData?.user) throw new Error("No autenticado");
      await supabase.from("candidato_analisis").delete().eq("candidato_id", candidato.id);
      toast({ title: "Regenerando análisis IA…", description: "Perfil, OSINT y discurso con el War Room actualizado." });
      const candForIA = {
        ...candidato,
        war_room: miembros,
        redes: (candidato.redes ?? {}) as Record<string, string | undefined>,
      };
      const resultados = await generarTodosLosAnalisis(candForIA, authData.user.id);
      const errores = resultados.filter((r) => r.estado === "error");
      if (errores.length === 0) {
        toast({ title: "Análisis regenerados ✓", description: "Ahora reflejan el War Room que capturaste." });
      } else {
        toast({
          title: `Regeneración parcial (${resultados.length - errores.length}/${resultados.length})`,
          description: `Falló: ${errores.map((e) => e.tipo).join(", ")}`,
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Error regenerando",
        description: err instanceof Error ? err.message : "Reintenta",
        variant: "destructive",
      });
    } finally {
      setRegenerando(false);
    }
  };

  return (
    <div className="space-y-3 pt-3">
      <WarRoomEditor miembros={miembros} onChange={guardar} saving={saving} />
      {miembros.length > 0 && (
        <div className="flex justify-end pt-2 border-t border-border/40">
          <Button size="sm" variant="outline" onClick={regenerarAnalisis} disabled={regenerando}>
            <RotateCcw className={`w-3.5 h-3.5 mr-1.5 ${regenerando ? "animate-spin" : ""}`} />
            {regenerando ? "Regenerando…" : "Regenerar análisis IA con este War Room"}
          </Button>
        </div>
      )}
    </div>
  );
}

function SeccionAnalisis({ tipo, data, loading, onGenerar }: {
  tipo: "perfil" | "osint" | "discurso";
  data: AnalisisPerfil | AnalisisOSINT | AnalisisDiscurso | undefined;
  loading: boolean;
  onGenerar: () => void;
}) {
  if (loading) {
    return (
      <div className="space-y-2 py-4">
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }
  if (!data) {
    return (
      <div className="text-center py-10 space-y-3">
        <p className="text-sm text-muted-foreground">Aún no hay análisis de {tipo}.</p>
        <Button onClick={onGenerar}>
          <Sparkles className="w-4 h-4 mr-1.5" /> Generar con IA
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3 pt-3">
      <div className="flex justify-end">
        <Button size="sm" variant="outline" onClick={onGenerar}>
          <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Regenerar
        </Button>
      </div>
      {tipo === "perfil" && <PerfilView data={data as AnalisisPerfil} />}
      {tipo === "osint" && <OsintView data={data as AnalisisOSINT} />}
      {tipo === "discurso" && <DiscursoView data={data as AnalisisDiscurso} />}
    </div>
  );
}

function ListaCard({ titulo, items, color }: { titulo: string; items: string[]; color: string }) {
  return (
    <Card className={`p-3 bg-card/60 border ${color}`}>
      <div className="text-xs font-mono uppercase tracking-widest mb-2">{titulo}</div>
      <ul className="space-y-1 text-sm">
        {items?.map((it, i) => (
          <li key={i} className="flex gap-2"><span className="text-muted-foreground">•</span><span>{it}</span></li>
        ))}
      </ul>
    </Card>
  );
}

function PerfilView({ data }: { data: AnalisisPerfil }) {
  return (
    <div className="space-y-3">
      <Card className="p-4 bg-primary/5 border-primary/30">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Score competitividad</span>
          <span className="text-3xl font-bold text-primary">{data.score_competitividad}/100</span>
        </div>
        <p className="text-sm text-muted-foreground mt-2"><strong className="text-foreground">Votante natural:</strong> {data.perfil_votante_natural}</p>
      </Card>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <ListaCard titulo="Fortalezas" items={data.fortalezas} color="border-emerald-500/40" />
        <ListaCard titulo="Debilidades" items={data.debilidades} color="border-rose-500/40" />
        <ListaCard titulo="Oportunidades" items={data.oportunidades} color="border-sky-500/40" />
        <ListaCard titulo="Amenazas" items={data.amenazas} color="border-amber-500/40" />
      </div>
    </div>
  );
}

function OsintView({ data }: { data: AnalisisOSINT }) {
  // Compatibilidad: análisis legacy pueden no traer citas/cargos/etc.
  const citas: OsintFuente[] = Array.isArray(data.citas) ? data.citas : [];
  const cargos: OsintItem[] = data.cargos_publicos_detectados ?? [];
  const menciones: OsintItemMencion[] = data.menciones_prensa ?? [];
  const red: OsintItem[] = data.red_de_relaciones ?? [];
  const territorial: OsintItem[] = data.actividad_territorial ?? [];
  const controversias: OsintControversia[] = (data.controversias ?? []).map((c) => ({
    ...c,
    fuentes: "fuentes" in c && Array.isArray((c as OsintControversia).fuentes) ? (c as OsintControversia).fuentes : [],
  }));
  // Fallback legacy: si no hay menciones_prensa nuevas pero sí menciones_recientes viejas
  const mencionesLegacy = (!menciones.length && data.menciones_recientes?.length)
    ? data.menciones_recientes.map((m) => ({ ...m, fuentes: [] as number[] }))
    : menciones;
  const aliadosLegacy = (!red.length && data.aliados_clave?.length)
    ? data.aliados_clave.map((a) => ({ resumen: a, fuentes: [] as number[] }))
    : red;

  return (
    <div className="space-y-3">
      {data.resumen_ejecutivo && (
        <Card className="p-4 bg-primary/5 border-primary/30">
          <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-1.5">
            Resumen ejecutivo
          </div>
          <p className="text-sm leading-relaxed">{data.resumen_ejecutivo}</p>
        </Card>
      )}

      {data.presencia_digital && (
        <Card className="p-3 bg-card/60 border-sky-500/40">
          <div className="flex items-center justify-between mb-1.5">
            <div className="text-xs font-mono uppercase tracking-widest">Presencia digital</div>
            <Badge variant="outline" className="text-[10px] uppercase">{data.presencia_digital.nivel}</Badge>
          </div>
          {data.presencia_digital.plataformas_fuertes?.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-1.5">
              {data.presencia_digital.plataformas_fuertes.map((p, i) => (
                <Badge key={i} variant="secondary" className="text-[10px]">{p}</Badge>
              ))}
            </div>
          )}
          <p className="text-xs text-muted-foreground">{data.presencia_digital.observaciones}</p>
        </Card>
      )}

      <OsintItemsCard titulo="Cargos y candidaturas detectados" items={cargos} citas={citas} color="border-emerald-500/40" />

      <Card className="p-3 bg-card/60 border-rose-500/40">
        <div className="text-xs font-mono uppercase tracking-widest mb-2">Controversias y riesgos</div>
        {controversias.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin controversias detectadas en fuentes verificables.</p>
        ) : (
          <ul className="space-y-2.5 text-sm">
            {controversias.map((c, i) => (
              <li key={i} className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className={`text-[10px] ${c.gravedad === "alta" ? "border-rose-500/60 text-rose-300" : c.gravedad === "media" ? "border-amber-500/60 text-amber-300" : "border-muted-foreground/40"}`}>
                    {c.gravedad}
                  </Badge>
                  <strong>{c.tema}</strong>
                </div>
                <p className="text-muted-foreground">{c.descripcion}</p>
                <FuentesInline indices={c.fuentes} citas={citas} />
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="p-3 bg-card/60">
        <div className="text-xs font-mono uppercase tracking-widest mb-2">Menciones en prensa</div>
        {mencionesLegacy.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin menciones recientes en medios monitoreados.</p>
        ) : (
          <ul className="space-y-1.5 text-sm">
            {mencionesLegacy.map((m, i) => (
              <li key={i} className="space-y-0.5">
                <div className="flex gap-2 items-start">
                  <Badge variant="outline" className={`text-[10px] shrink-0 ${m.tono === "positivo" ? "text-emerald-400" : m.tono === "negativo" ? "text-rose-400" : ""}`}>{m.tono}</Badge>
                  <span><strong>{m.fuente}:</strong> {m.titular}</span>
                </div>
                <FuentesInline indices={m.fuentes} citas={citas} />
              </li>
            ))}
          </ul>
        )}
      </Card>

      <OsintItemsCard titulo="Red de relaciones" items={aliadosLegacy} citas={citas} color="border-violet-500/40" />
      <OsintItemsCard titulo="Actividad territorial" items={territorial} citas={citas} color="border-amber-500/40" />

      {data.temas_recurrentes?.length > 0 && (
        <ListaCard titulo="Temas recurrentes" items={data.temas_recurrentes} color="border-violet-500/40" />
      )}

      {data.war_room_resumen && (
        <Card className="p-3 bg-card/60 border-amber-500/40">
          <div className="text-xs font-mono uppercase tracking-widest mb-2 flex items-center gap-1.5">
            <Users2 className="w-3.5 h-3.5" /> Análisis del War Room
          </div>
          <p className="text-sm mb-2"><strong>Coherencia con narrativa:</strong> <span className="text-muted-foreground">{data.war_room_resumen.coherencia_con_narrativa}</span></p>
          {data.war_room_resumen.alertas_reputacionales.length > 0 && (
            <div className="space-y-1.5 mb-2">
              <div className="text-[10px] font-mono uppercase text-rose-300">Alertas reputacionales</div>
              <ul className="space-y-1 text-sm">
                {data.war_room_resumen.alertas_reputacionales.map((a, i) => (
                  <li key={i} className="flex gap-2">
                    <Badge variant="outline" className="text-[10px] border-rose-500/40 text-rose-300">{a.gravedad}</Badge>
                    <span><strong>{a.miembro}:</strong> <span className="text-muted-foreground">{a.alerta}</span></span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {data.war_room_resumen.observaciones && (
            <p className="text-xs text-muted-foreground italic border-t border-border/40 pt-2">{data.war_room_resumen.observaciones}</p>
          )}
        </Card>
      )}

      {data.vacios_informacion && data.vacios_informacion.length > 0 && (
        <Card className="p-3 bg-card/60 border-muted">
          <div className="text-xs font-mono uppercase tracking-widest mb-2 text-muted-foreground">Vacíos de información</div>
          <ul className="space-y-1 text-sm">
            {data.vacios_informacion.map((v, i) => (
              <li key={i} className="flex gap-2"><span className="text-muted-foreground">·</span><span>{v}</span></li>
            ))}
          </ul>
        </Card>
      )}

      {data.recomendaciones_busqueda_adicional && data.recomendaciones_busqueda_adicional.length > 0 && (
        <Card className="p-3 bg-card/60 border-primary/30">
          <div className="text-xs font-mono uppercase tracking-widest mb-2 text-primary">Líneas de búsqueda adicional</div>
          <ul className="space-y-1 text-sm">
            {data.recomendaciones_busqueda_adicional.map((r, i) => (
              <li key={i} className="flex gap-2"><span className="text-primary">→</span><span>{r}</span></li>
            ))}
          </ul>
        </Card>
      )}

      {citas.length > 0 && (
        <Card className="p-3 bg-card/40 border-border/60">
          <div className="text-xs font-mono uppercase tracking-widest mb-2 flex items-center gap-1.5">
            <ExternalLink className="w-3.5 h-3.5" /> Fuentes ({citas.length})
          </div>
          <ol className="space-y-1.5 text-xs">
            {citas.map((f, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-muted-foreground font-mono shrink-0">[{i}]</span>
                <a href={f.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all">
                  {f.titulo || f.medio || f.url}
                </a>
                {f.fecha && <span className="text-muted-foreground shrink-0">· {f.fecha}</span>}
              </li>
            ))}
          </ol>
        </Card>
      )}
    </div>
  );
}

function DiscursoView({ data }: { data: AnalisisDiscurso }) {
  return (
    <div className="space-y-3">
      <Card className="p-3 bg-card/60">
        <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Tono general</div>
        <p className="text-sm mt-1">{data.tono}</p>
      </Card>
      <ListaCard titulo="Ejes narrativos" items={data.ejes_narrativos} color="border-primary/40" />
      <ListaCard titulo="Frames dominantes" items={data.frames_dominantes} color="border-violet-500/40" />
      <ListaCard titulo="Vulnerabilidades argumentales" items={data.vulnerabilidades_argumentales} color="border-rose-500/40" />
      <Card className="p-3 bg-card/60 border-emerald-500/40">
        <div className="text-xs font-mono uppercase tracking-widest mb-2">Contraargumentos sugeridos</div>
        <ul className="space-y-2 text-sm">
          {data.contraargumentos_sugeridos.map((c, i) => (
            <li key={i}>
              <strong className="text-foreground">vs &quot;{c.vs_eje}&quot;:</strong>
              <p className="text-muted-foreground mt-0.5">{c.respuesta}</p>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

// (SeccionOsintProfundo eliminada — ahora OSINT es unificado, ver OsintView abajo)

function OsintItemsCard({
  titulo, items, citas, color,
}: {
  titulo: string;
  items: OsintItem[] | undefined;
  citas: OsintFuente[];
  color: string;
}) {
  return (
    <Card className={`p-3 bg-card/60 border ${color}`}>
      <div className="text-xs font-mono uppercase tracking-widest mb-2">{titulo}</div>
      {(!items || items.length === 0) ? (
        <p className="text-sm text-muted-foreground">Sin hallazgos en fuentes verificables.</p>
      ) : (
        <ul className="space-y-2 text-sm">
          {items.map((it, i) => (
            <li key={i} className="space-y-1">
              <div className="flex gap-2"><span className="text-muted-foreground">•</span><span>{it.resumen}</span></div>
              <FuentesInline indices={it.fuentes} citas={citas} />
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function FuentesInline({ indices, citas }: { indices: number[] | undefined; citas: OsintFuente[] }) {
  if (!indices || indices.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1 pl-4">
      {indices.map((idx) => {
        const cita = citas[idx];
        if (!cita) return null;
        return (
          <a
            key={idx}
            href={cita.url}
            target="_blank"
            rel="noopener noreferrer"
            title={cita.titulo || cita.url}
            className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
          >
            [{idx}]
          </a>
        );
      })}
    </div>
  );
}

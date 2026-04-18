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
import { Sparkles, AlertTriangle, RotateCcw, Search, MessageSquare, User, Users2 } from "lucide-react";
import type {
  Candidato, TipoAnalisis, AnalisisPerfil, AnalisisOSINT, AnalisisDiscurso,
  WarRoomMiembro,
} from "@/lib/candidatos/types";
import { PartidoBadges } from "./PartidoBadges";
import { WarRoomEditor } from "./WarRoomEditor";
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
      if (!next[row.tipo as TipoAnalisis]) {
        // @ts-expect-error - dynamic key, output_json es JSON validado por la edge function
        next[row.tipo as TipoAnalisis] = row.output_json;
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

      const { data, error } = await supabase.functions.invoke("analizar-candidato", {
        body: {
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
          },
        },
      });
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

      setAnalisis((prev) => ({ ...prev, [tipo]: payload.output }));
      toast({ title: `Análisis de ${tipo} generado` });
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

        <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)}>
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="perfil"><User className="w-3.5 h-3.5 mr-1.5" />Perfil</TabsTrigger>
            <TabsTrigger value="osint"><Search className="w-3.5 h-3.5 mr-1.5" />OSINT</TabsTrigger>
            <TabsTrigger value="war_room"><Users2 className="w-3.5 h-3.5 mr-1.5" />War Room</TabsTrigger>
            <TabsTrigger value="discurso"><MessageSquare className="w-3.5 h-3.5 mr-1.5" />Discurso</TabsTrigger>
          </TabsList>

          {(["perfil", "osint", "discurso"] as TipoAnalisis[]).map((t) => (
            <TabsContent key={t} value={t}>
              <SeccionAnalisis
                tipo={t}
                data={analisis[t]}
                loading={loadingTipo === t}
                onGenerar={() => generar(t)}
              />
            </TabsContent>
          ))}

          <TabsContent value="war_room">
            <WarRoomTab candidato={candidato} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

type TabKey = TipoAnalisis | "war_room";

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
  tipo: TipoAnalisis;
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
  return (
    <div className="space-y-3">
      <Card className="p-3 bg-card/60">
        <div className="text-xs font-mono uppercase tracking-widest mb-1">Presencia digital · {data.presencia_digital.nivel}</div>
        <div className="flex flex-wrap gap-1 mb-2">
          {data.presencia_digital.plataformas_fuertes.map((p) => (<Badge key={p} variant="secondary" className="text-[10px]">{p}</Badge>))}
        </div>
        <p className="text-sm text-muted-foreground">{data.presencia_digital.observaciones}</p>
      </Card>
      <ListaCard titulo="Aliados clave" items={data.aliados_clave} color="border-sky-500/40" />
      <ListaCard titulo="Temas recurrentes" items={data.temas_recurrentes} color="border-violet-500/40" />
      <Card className="p-3 bg-card/60 border-rose-500/40">
        <div className="text-xs font-mono uppercase tracking-widest mb-2">Controversias</div>
        {data.controversias.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin controversias públicas conocidas.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {data.controversias.map((c, i) => (
              <li key={i}>
                <Badge variant="outline" className="text-[10px] mr-2">{c.gravedad}</Badge>
                <strong>{c.tema}:</strong> <span className="text-muted-foreground">{c.descripcion}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
      <Card className="p-3 bg-card/60">
        <div className="text-xs font-mono uppercase tracking-widest mb-2">Menciones recientes</div>
        <ul className="space-y-1.5 text-sm">
          {data.menciones_recientes.map((m, i) => (
            <li key={i} className="flex gap-2">
              <Badge variant="outline" className={`text-[10px] ${m.tono === "positivo" ? "text-emerald-400" : m.tono === "negativo" ? "text-rose-400" : ""}`}>{m.tono}</Badge>
              <span><strong>{m.fuente}:</strong> {m.titular}</span>
            </li>
          ))}
        </ul>
      </Card>
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

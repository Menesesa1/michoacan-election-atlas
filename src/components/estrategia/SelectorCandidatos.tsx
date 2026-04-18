import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Crown, Swords } from "lucide-react";
import type { NivelEstrategia } from "@/data/estrategia-templates";
import type { Candidato, AnalisisPerfil, AnalisisDiscurso, CandidatoSnapshot } from "@/lib/candidatos/types";
import { siglasPartido } from "@/lib/candidatos/coaliciones";

interface Props {
  nivel: NivelEstrategia;
  territorioLabel: string;
  propioId: string;
  setPropioId: (id: string) => void;
  adversariosIds: string[];
  toggleAdversario: (id: string) => void;
  onSnapshotChange: (snap: { propio?: CandidatoSnapshot; adversarios: CandidatoSnapshot[] } | undefined) => void;
}

export function SelectorCandidatos({
  nivel, territorioLabel, propioId, setPropioId, adversariosIds, toggleAdversario, onSnapshotChange,
}: Props) {
  const [candidatos, setCandidatos] = useState<Candidato[]>([]);
  const [analisis, setAnalisis] = useState<Record<string, { perfil?: AnalisisPerfil; discurso?: AnalisisDiscurso }>>({});

  useEffect(() => {
    void cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nivel]);

  const cargar = async () => {
    const { data: cs } = await supabase
      .from("candidatos")
      .select("*")
      .eq("nivel", nivel);
    const list = (cs ?? []) as unknown as Candidato[];
    setCandidatos(list);

    if (list.length === 0) return;
    const ids = list.map((c) => c.id);
    const { data: an } = await supabase
      .from("candidato_analisis")
      .select("*")
      .in("candidato_id", ids)
      .order("created_at", { ascending: false });
    const map: Record<string, { perfil?: AnalisisPerfil; discurso?: AnalisisDiscurso }> = {};
    (an ?? []).forEach((row) => {
      if (!map[row.candidato_id]) map[row.candidato_id] = {};
      if (row.tipo === "perfil" && !map[row.candidato_id].perfil) {
        map[row.candidato_id].perfil = row.output_json as unknown as AnalisisPerfil;
      }
      if (row.tipo === "discurso" && !map[row.candidato_id].discurso) {
        map[row.candidato_id].discurso = row.output_json as unknown as AnalisisDiscurso;
      }
    });
    setAnalisis(map);
  };

  const filtrados = useMemo(() => {
    const t = territorioLabel.toLowerCase();
    return candidatos.filter((c) => !t || c.territorio.toLowerCase().includes(t.split(" ")[0]) || t.includes(c.territorio.toLowerCase()));
  }, [candidatos, territorioLabel]);

  const buildSnap = (c: Candidato): CandidatoSnapshot => {
    const a = analisis[c.id];
    const wr = (c.war_room ?? []).slice(0, 8).map((m) => ({
      nombre: m.nombre,
      rol: m.rol,
      tipo: m.tipo,
      visible: m.visible,
      trayectoria_breve: m.trayectoria_breve || undefined,
      inconsistencias: m.inconsistencias?.length ? m.inconsistencias : undefined,
    }));
    return {
      id: c.id,
      nombre: c.nombre,
      partido: c.partido,
      cargo_buscado: c.cargo_buscado ?? undefined,
      fortalezas_top: a?.perfil?.fortalezas?.slice(0, 3),
      debilidades_top: a?.perfil?.debilidades?.slice(0, 3),
      ejes_narrativos: a?.discurso?.ejes_narrativos?.slice(0, 3),
      vulnerabilidades_argumentales: a?.discurso?.vulnerabilidades_argumentales?.slice(0, 3),
      score_competitividad: a?.perfil?.score_competitividad,
      war_room: wr.length > 0 ? wr : undefined,
    };
  };

  // Emite snapshot al padre cuando cambian selecciones o data
  useEffect(() => {
    const propio = candidatos.find((c) => c.id === propioId);
    const adversarios = adversariosIds.map((id) => candidatos.find((c) => c.id === id)).filter(Boolean) as Candidato[];
    if (!propio && adversarios.length === 0) {
      onSnapshotChange(undefined);
      return;
    }
    onSnapshotChange({
      propio: propio ? buildSnap(propio) : undefined,
      adversarios: adversarios.map(buildSnap),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propioId, adversariosIds, candidatos, analisis]);

  if (candidatos.length === 0) {
    return (
      <Card className="p-3 bg-card/40 border-dashed border-border">
        <p className="text-xs text-muted-foreground">
          <Users className="w-3 h-3 inline mr-1" />
          No tienes candidatos registrados en este nivel. Agrégalos en /candidatos para anclar la estrategia a personas concretas.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-3 pt-2 border-t border-border/60">
      <Label className="text-xs uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
        <Users className="w-3 h-3" /> Candidatos en escena (opcional)
      </Label>

      <div className="space-y-2">
        <Label className="text-[11px] flex items-center gap-1.5 text-emerald-400"><Crown className="w-3 h-3" /> Candidato propio</Label>
        <Select value={propioId || "none"} onValueChange={(v) => setPropioId(v === "none" ? "" : v)}>
          <SelectTrigger><SelectValue placeholder="Sin candidato propio" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">— Ninguno —</SelectItem>
            {filtrados.filter((c) => !adversariosIds.includes(c.id)).map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.nombre} ({siglasPartido(c.partido)}) · {c.territorio}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-[11px] flex items-center gap-1.5 text-rose-400"><Swords className="w-3 h-3" /> Adversarios</Label>
        <div className="flex flex-wrap gap-1.5">
          {filtrados.filter((c) => c.id !== propioId).map((c) => {
            const active = adversariosIds.includes(c.id);
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => toggleAdversario(c.id)}
                className={`px-2.5 py-1 rounded-md text-xs border transition-colors ${
                  active ? "bg-rose-500/20 text-rose-300 border-rose-500/60" : "bg-card/40 text-muted-foreground border-border hover:border-rose-500/40"
                }`}
              >
                {c.nombre} <span className="opacity-60">· {siglasPartido(c.partido)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {(propioId || adversariosIds.length > 0) && (
        <div className="flex flex-wrap gap-1 pt-1">
          {propioId && analisis[propioId]?.perfil && (
            <Badge variant="outline" className="text-[10px] border-emerald-500/40 text-emerald-400">Propio con análisis IA ✓</Badge>
          )}
          {adversariosIds.filter((id) => analisis[id]?.perfil).length > 0 && (
            <Badge variant="outline" className="text-[10px] border-rose-500/40 text-rose-400">
              {adversariosIds.filter((id) => analisis[id]?.perfil).length}/{adversariosIds.length} adversarios con análisis IA
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}

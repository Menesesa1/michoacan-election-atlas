import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, X } from "lucide-react";
import type { Candidato, AnalisisPerfil, AnalisisDiscurso, TipoAnalisis } from "@/lib/candidatos/types";

interface Props {
  candidatos: [Candidato, Candidato];
  onClose: () => void;
}

export function ComparadorCandidatos({ candidatos, onClose }: Props) {
  const [perfiles, setPerfiles] = useState<Record<string, AnalisisPerfil | undefined>>({});
  const [discursos, setDiscursos] = useState<Record<string, AnalisisDiscurso | undefined>>({});

  useEffect(() => {
    void cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candidatos[0].id, candidatos[1].id]);

  const cargar = async () => {
    const ids = candidatos.map((c) => c.id);
    const { data } = await supabase
      .from("candidato_analisis")
      .select("*")
      .in("candidato_id", ids)
      .order("created_at", { ascending: false });
    if (!data) return;
    const p: Record<string, AnalisisPerfil> = {};
    const d: Record<string, AnalisisDiscurso> = {};
    for (const row of data) {
      const t = row.tipo as TipoAnalisis;
      if (t === "perfil" && !p[row.candidato_id]) p[row.candidato_id] = row.output_json as unknown as AnalisisPerfil;
      if (t === "discurso" && !d[row.candidato_id]) d[row.candidato_id] = row.output_json as unknown as AnalisisDiscurso;
    }
    setPerfiles(p);
    setDiscursos(d);
  };

  return (
    <Card className="p-4 bg-card/60 border-primary/30">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-widest text-primary">Comparador</div>
          <h3 className="text-base font-bold">Análisis lado a lado</h3>
        </div>
        <Button size="sm" variant="ghost" onClick={onClose}><X className="w-4 h-4" /></Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {candidatos.map((c) => {
          const perfil = perfiles[c.id];
          const discurso = discursos[c.id];
          return (
            <div key={c.id} className="space-y-3">
              <div className="border-b border-border pb-2">
                <h4 className="font-bold">{c.nombre}</h4>
                <div className="flex gap-1.5 mt-1">
                  <Badge variant="outline" className="text-[10px]">{c.partido}</Badge>
                  <Badge variant="secondary" className="text-[10px]">{c.territorio}</Badge>
                </div>
              </div>

              {!perfil && !discurso ? (
                <div className="text-xs text-muted-foreground py-6 text-center">
                  <Sparkles className="w-4 h-4 mx-auto mb-1 opacity-50" />
                  Genera el análisis de Perfil y Discurso en la ficha individual para comparar.
                </div>
              ) : (
                <>
                  {perfil && (
                    <>
                      <div className="text-2xl font-bold text-primary">{perfil.score_competitividad}<span className="text-xs text-muted-foreground">/100</span></div>
                      <div>
                        <div className="text-[10px] font-mono uppercase text-emerald-400 mb-1">Fortalezas</div>
                        <ul className="text-xs space-y-0.5">{perfil.fortalezas.slice(0, 4).map((f, i) => (<li key={i}>• {f}</li>))}</ul>
                      </div>
                      <div>
                        <div className="text-[10px] font-mono uppercase text-rose-400 mb-1">Debilidades</div>
                        <ul className="text-xs space-y-0.5">{perfil.debilidades.slice(0, 4).map((f, i) => (<li key={i}>• {f}</li>))}</ul>
                      </div>
                    </>
                  )}
                  {discurso && (
                    <>
                      <div>
                        <div className="text-[10px] font-mono uppercase text-primary mb-1">Ejes narrativos</div>
                        <div className="flex flex-wrap gap-1">{discurso.ejes_narrativos.slice(0, 4).map((e, i) => (<Badge key={i} variant="outline" className="text-[10px]">{e}</Badge>))}</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-mono uppercase text-amber-400 mb-1">Vulnerabilidades</div>
                        <ul className="text-xs space-y-0.5">{discurso.vulnerabilidades_argumentales.slice(0, 3).map((v, i) => (<li key={i}>• {v}</li>))}</ul>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

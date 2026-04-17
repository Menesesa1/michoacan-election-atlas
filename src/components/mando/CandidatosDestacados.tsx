import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { UserStar, ChevronRight, Star } from "lucide-react";
import type { Candidato } from "@/lib/candidatos/types";
import { FASE_LABEL_CORTO } from "@/lib/candidatos/fase";

interface RowConScore extends Candidato {
  score?: number;
}

const NIVEL_LABEL: Record<string, string> = {
  gobernador: "Gobernatura",
  diputados: "Diputado",
  ayuntamientos: "Ayuntamiento",
};

export function CandidatosDestacados() {
  const [rows, setRows] = useState<RowConScore[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      const { data: cands } = await supabase
        .from("candidatos")
        .select("*")
        .order("es_propio", { ascending: false });
      const lista = (cands ?? []) as unknown as Candidato[];

      // Trae scores de competitividad del último análisis "perfil"
      const ids = lista.map((c) => c.id);
      const scores = new Map<string, number>();
      if (ids.length > 0) {
        const { data: anal } = await supabase
          .from("candidato_analisis")
          .select("candidato_id, output_json, created_at")
          .eq("tipo", "perfil")
          .in("candidato_id", ids)
          .order("created_at", { ascending: false });
        for (const a of anal ?? []) {
          if (scores.has(a.candidato_id)) continue;
          const out = a.output_json as { score_competitividad?: number };
          if (typeof out?.score_competitividad === "number") {
            scores.set(a.candidato_id, out.score_competitividad);
          }
        }
      }

      const conScore: RowConScore[] = lista.map((c) => ({ ...c, score: scores.get(c.id) }));
      // ordena: propios primero, luego score desc
      conScore.sort((a, b) => {
        if (a.es_propio !== b.es_propio) return a.es_propio ? -1 : 1;
        return (b.score ?? -1) - (a.score ?? -1);
      });
      setRows(conScore.slice(0, 5));
      setLoading(false);
    })();
  }, []);

  return (
    <Card className="p-4 bg-card/60 backdrop-blur border-border">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <UserStar className="w-4 h-4 text-primary" />
          <h3 className="text-xs font-semibold uppercase tracking-widest">Candidatos destacados</h3>
        </div>
        <Link to="/candidatos" className="text-[10px] text-muted-foreground hover:text-primary font-mono flex items-center gap-1">
          Ver todos <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      {loading ? (
        <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
      ) : rows.length === 0 ? (
        <p className="text-xs text-muted-foreground py-6 text-center">
          Aún no hay candidatos. <Link to="/candidatos" className="text-primary hover:underline">Registra el primero</Link>.
        </p>
      ) : (
        <div className="space-y-2">
          {rows.map((c) => (
            <Link
              key={c.id}
              to="/candidatos"
              className="flex items-center justify-between gap-2 p-2 rounded-md bg-secondary/40 hover:bg-secondary/70 transition-colors"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  {c.es_propio && <Star className="w-3 h-3 text-primary fill-primary flex-shrink-0" />}
                  <span className="text-xs font-semibold truncate">{c.nombre}</span>
                </div>
                <div className="text-[10px] text-muted-foreground font-mono uppercase truncate mt-0.5">
                  {c.partido} · {NIVEL_LABEL[c.nivel]} · {c.territorio} · {FASE_LABEL_CORTO[c.fase ?? "precampana"]}
                </div>
              </div>
              {typeof c.score === "number" ? (
                <Badge
                  variant="outline"
                  className={`font-mono text-[10px] flex-shrink-0 ${
                    c.score >= 70 ? "border-emerald-500/40 text-emerald-400"
                      : c.score >= 50 ? "border-amber-500/40 text-amber-400"
                      : "border-destructive/40 text-destructive"
                  }`}
                >
                  {c.score}
                </Badge>
              ) : (
                <Badge variant="outline" className="font-mono text-[10px] flex-shrink-0 text-muted-foreground">
                  s/d
                </Badge>
              )}
            </Link>
          ))}
        </div>
      )}
    </Card>
  );
}

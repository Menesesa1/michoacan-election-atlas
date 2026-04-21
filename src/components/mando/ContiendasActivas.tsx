import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Swords, ChevronRight, Star } from "lucide-react";
import type { Candidato } from "@/lib/candidatos/types";
import { contiendaKey, contiendaLabel, FASE_LABEL_CORTO, type FaseCandidatura, type ContiendaKey } from "@/lib/candidatos/fase";

const NIVEL_LABEL: Record<string, string> = {
  gobernador: "Gobernatura",
  diputados_federales: "Diputado Federal",
  diputados: "Diputado Local",
  ayuntamientos: "Ayuntamiento",
};

export function ContiendasActivas() {
  const [candidatos, setCandidatos] = useState<Candidato[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      const { data } = await supabase.from("candidatos").select("*");
      setCandidatos((data ?? []) as unknown as Candidato[]);
      setLoading(false);
    })();
  }, []);

  const grupos = useMemo(() => {
    const map = new Map<string, { key: ContiendaKey; cands: Candidato[]; tienePropio: boolean }>();
    for (const c of candidatos) {
      const key: ContiendaKey = {
        nivel: c.nivel,
        territorio: c.territorio,
        partido: c.partido,
        fase: (c.fase ?? "precampana") as FaseCandidatura,
      };
      const k = contiendaKey(key);
      const g = map.get(k);
      if (g) {
        g.cands.push(c);
        if (c.es_propio) g.tienePropio = true;
      } else {
        map.set(k, { key, cands: [c], tienePropio: !!c.es_propio });
      }
    }
    return Array.from(map.values())
      .filter((g) => g.cands.length >= 2 || g.tienePropio)
      .sort((a, b) => {
        // propios primero, luego más aspirantes
        if (a.tienePropio !== b.tienePropio) return a.tienePropio ? -1 : 1;
        return b.cands.length - a.cands.length;
      })
      .slice(0, 5);
  }, [candidatos]);

  return (
    <Card className="p-4 bg-card/60 backdrop-blur border-border">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Swords className="w-4 h-4 text-primary" />
          <h3 className="text-xs font-semibold uppercase tracking-widest">Contiendas activas</h3>
        </div>
        <Link to="/candidatos" className="text-[10px] text-muted-foreground hover:text-primary font-mono flex items-center gap-1">
          Ver todos <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      {loading ? (
        <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
      ) : grupos.length === 0 ? (
        <p className="text-xs text-muted-foreground py-6 text-center">
          No hay contiendas con múltiples aspirantes aún.{" "}
          <Link to="/candidatos" className="text-primary hover:underline">Registra candidatos</Link>.
        </p>
      ) : (
        <div className="space-y-2">
          {grupos.map((g) => (
            <Link
              key={contiendaKey(g.key)}
              to="/candidatos"
              className="flex items-center justify-between gap-2 p-2 rounded-md bg-secondary/40 hover:bg-secondary/70 transition-colors"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {g.tienePropio && <Star className="w-3 h-3 text-primary fill-primary flex-shrink-0" />}
                  <span className="text-xs font-semibold truncate">{contiendaLabel(g.key)}</span>
                </div>
                <div className="text-[10px] text-muted-foreground font-mono uppercase mt-0.5">
                  {NIVEL_LABEL[g.key.nivel]} · {FASE_LABEL_CORTO[g.key.fase]}
                </div>
              </div>
              <Badge variant="outline" className="font-mono text-[10px] flex-shrink-0">
                {g.cands.length} {g.cands.length === 1 ? "aspirante" : "aspirantes"}
              </Badge>
            </Link>
          ))}
        </div>
      )}
    </Card>
  );
}

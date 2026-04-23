import { useMemo } from "react";
import { Trophy, TrendingUp, AlertCircle, Users2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { calcularScorePotencia, nivelPotencia } from "@/lib/candidatos/score-potencia";
import type { Candidato } from "@/lib/candidatos/types";
import { cn } from "@/lib/utils";

interface Props {
  candidatos: Candidato[];
  onAbrir?: (c: Candidato) => void;
}

interface GrupoRanking {
  partido: string;
  cargo: string;
  territorio: string;
  aspirantes: { candidato: Candidato; score: ReturnType<typeof calcularScorePotencia> }[];
}

const labelNivel = (n: string) =>
  n === "gobernador"
    ? "Gubernatura"
    : n === "diputados_federales"
      ? "Diputado federal"
      : n === "diputados"
        ? "Diputado local"
        : "Ayuntamiento";

export function RankingAspirantes({ candidatos, onAbrir }: Props) {
  const grupos: GrupoRanking[] = useMemo(() => {
    const aspirantes = candidatos.filter((c) => (c.fase ?? "precampana") === "aspirante");
    const map = new Map<string, GrupoRanking>();
    for (const c of aspirantes) {
      const key = `${c.partido}::${c.nivel}::${c.territorio}`;
      const score = calcularScorePotencia(c);
      const g = map.get(key);
      if (g) g.aspirantes.push({ candidato: c, score });
      else
        map.set(key, {
          partido: c.partido,
          cargo: labelNivel(c.nivel),
          territorio: c.territorio,
          aspirantes: [{ candidato: c, score }],
        });
    }
    // Ordena cada grupo por score descendente
    const arr = Array.from(map.values());
    for (const g of arr) g.aspirantes.sort((a, b) => b.score.total - a.score.total);
    // Ordena grupos: más aspirantes primero (contiendas más calientes)
    arr.sort((a, b) => b.aspirantes.length - a.aspirantes.length);
    return arr;
  }, [candidatos]);

  if (grupos.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-10 text-center space-y-3">
          <Users2 className="w-10 h-10 mx-auto text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">No hay aspirantes registrados aún</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
              Cambia la fase de tus candidatos a <strong>Aspirante</strong> para verlos aquí.
              Esta vista te ayuda a comparar la potencia de los perfiles que buscan la candidatura
              dentro de cada partido.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 flex items-start gap-2">
        <Trophy className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
        <div className="text-xs text-amber-200/90">
          <strong className="text-amber-400">Estás en fase de internas.</strong> El partido decide
          quién será candidato. El score de potencia mide trayectoria, war room, redes y
          completitud para que veas cuál perfil llega más fuerte a la negociación interna.
        </div>
      </div>

      {grupos.map((g) => (
        <Card key={`${g.partido}-${g.cargo}-${g.territorio}`}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="text-base flex items-center gap-2">
                <span className="text-primary">{g.partido}</span>
                <span className="text-muted-foreground">·</span>
                <span>{g.cargo}</span>
                <span className="text-muted-foreground">·</span>
                <span>{g.territorio}</span>
              </CardTitle>
              <Badge variant="outline" className="text-[10px] font-mono">
                {g.aspirantes.length} aspirante{g.aspirantes.length === 1 ? "" : "s"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {g.aspirantes.map(({ candidato, score }, idx) => {
              const nivel = nivelPotencia(score.total);
              const esLider = idx === 0 && g.aspirantes.length > 1;
              return (
                <button
                  key={candidato.id}
                  type="button"
                  onClick={() => onAbrir?.(candidato)}
                  className={cn(
                    "w-full text-left rounded-lg border p-3 transition-colors hover:border-primary/50",
                    esLider ? "border-primary/40 bg-primary/5" : "border-border bg-card/40",
                  )}
                >
                  <div className="flex items-start gap-3">
                    {/* Rank */}
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold text-sm shrink-0",
                        esLider
                          ? "border-primary bg-primary/15 text-primary"
                          : "border-border bg-card text-muted-foreground",
                      )}
                    >
                      {idx + 1}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-semibold truncate">{candidato.nombre}</h4>
                        {esLider && (
                          <Badge className="bg-primary/20 text-primary border-primary/40 text-[10px]">
                            <Trophy className="w-2.5 h-2.5 mr-1" /> Líder interno
                          </Badge>
                        )}
                        <Badge variant="outline" className={cn("text-[10px]", nivel.color)}>
                          {nivel.emoji} {nivel.label}
                        </Badge>
                      </div>

                      {candidato.bio_breve && (
                        <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
                          {candidato.bio_breve}
                        </p>
                      )}

                      {/* Score bar */}
                      <div className="mt-2 flex items-center gap-2">
                        <Progress value={score.total} className="h-1.5 flex-1" />
                        <span className="text-xs font-mono font-bold text-primary w-10 text-right">
                          {score.total}
                        </span>
                      </div>

                      {/* Desglose */}
                      <div className="flex items-center gap-3 mt-1.5 text-[10px] font-mono text-muted-foreground">
                        <span title="Trayectoria">📜 {score.desglose.trayectoria}/30</span>
                        <span title="War Room">🛡 {score.desglose.war_room}/25</span>
                        <span title="Redes">📱 {score.desglose.redes}/30</span>
                        <span title="Completitud">✓ {score.desglose.completitud}/15</span>
                      </div>

                      {/* Fortalezas / brechas */}
                      {(score.fortalezas.length > 0 || score.brechas.length > 0) && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {score.fortalezas.slice(0, 2).map((f) => (
                            <span
                              key={f}
                              className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 inline-flex items-center gap-1"
                            >
                              <TrendingUp className="w-2.5 h-2.5" /> {f}
                            </span>
                          ))}
                          {score.brechas.slice(0, 2).map((b) => (
                            <span
                              key={b}
                              className="text-[10px] px-1.5 py-0.5 rounded bg-destructive/10 text-destructive border border-destructive/30 inline-flex items-center gap-1"
                            >
                              <AlertCircle className="w-2.5 h-2.5" /> {b}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

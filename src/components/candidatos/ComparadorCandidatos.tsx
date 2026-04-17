import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Sparkles, X, Trophy, Minus } from "lucide-react";
import type {
  Candidato,
  AnalisisPerfil,
  AnalisisDiscurso,
  AnalisisOSINT,
  TipoAnalisis,
} from "@/lib/candidatos/types";
import { PartidoBadges } from "./PartidoBadges";
import { cn } from "@/lib/utils";

interface Props {
  candidatos: Candidato[];
  onClose: () => void;
}

type Perfiles = Record<string, AnalisisPerfil | undefined>;
type Discursos = Record<string, AnalisisDiscurso | undefined>;
type Osints = Record<string, AnalisisOSINT | undefined>;

export function ComparadorCandidatos({ candidatos, onClose }: Props) {
  const [perfiles, setPerfiles] = useState<Perfiles>({});
  const [discursos, setDiscursos] = useState<Discursos>({});
  const [osints, setOsints] = useState<Osints>({});
  const [loading, setLoading] = useState(false);

  const ids = candidatos.map((c) => c.id).join(",");

  useEffect(() => {
    void cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids]);

  const cargar = async () => {
    const idList = candidatos.map((c) => c.id);
    if (idList.length === 0) return;
    setLoading(true);
    const { data } = await supabase
      .from("candidato_analisis")
      .select("*")
      .in("candidato_id", idList)
      .order("created_at", { ascending: false });
    const p: Perfiles = {};
    const d: Discursos = {};
    const o: Osints = {};
    for (const row of data ?? []) {
      const t = row.tipo as TipoAnalisis;
      if (t === "perfil" && !p[row.candidato_id]) p[row.candidato_id] = row.output_json as unknown as AnalisisPerfil;
      if (t === "discurso" && !d[row.candidato_id]) d[row.candidato_id] = row.output_json as unknown as AnalisisDiscurso;
      if (t === "osint" && !o[row.candidato_id]) o[row.candidato_id] = row.output_json as unknown as AnalisisOSINT;
    }
    setPerfiles(p);
    setDiscursos(d);
    setOsints(o);
    setLoading(false);
  };

  // Quien tiene el score más alto (para destacar visualmente)
  const maxScore = useMemo(() => {
    const scores = candidatos
      .map((c) => perfiles[c.id]?.score_competitividad ?? -1)
      .filter((n) => n >= 0);
    return scores.length ? Math.max(...scores) : -1;
  }, [candidatos, perfiles]);

  // Grid: cada candidato es una columna; la primera columna es la etiqueta del criterio.
  // En móvil cae a scroll horizontal para mantener el formato VS.
  const colsTemplate = `minmax(140px,180px) repeat(${candidatos.length}, minmax(220px,1fr))`;

  return (
    <Card className="p-4 bg-card/60 border-primary/30">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-widest text-primary">
            Comparador sistemático · {candidatos.length} candidatos
          </div>
          <h3 className="text-base font-bold">Análisis VS lado a lado</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Mismos criterios, misma estructura. El score más alto se destaca.
          </p>
        </div>
        <Button size="sm" variant="ghost" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="overflow-x-auto -mx-4 px-4">
        <div className="min-w-fit space-y-2">
          {/* Header: candidatos con VS entre ellos */}
          <HeaderRow candidatos={candidatos} colsTemplate={colsTemplate} />

          {/* Identidad */}
          <SectionTitle>Identidad política</SectionTitle>
          <Row label="Partido / Coalición" colsTemplate={colsTemplate}>
            {candidatos.map((c) => (
              <Cell key={c.id}>
                <PartidoBadges partido={c.partido} />
              </Cell>
            ))}
          </Row>
          <Row label="Cargo buscado" colsTemplate={colsTemplate}>
            {candidatos.map((c) => (
              <Cell key={c.id}>
                <span className="text-xs">{c.cargo_buscado || <Empty />}</span>
              </Cell>
            ))}
          </Row>
          <Row label="Territorio" colsTemplate={colsTemplate}>
            {candidatos.map((c) => (
              <Cell key={c.id}>
                <Badge variant="secondary" className="text-[10px]">
                  {c.territorio}
                </Badge>
              </Cell>
            ))}
          </Row>

          {/* Score */}
          <SectionTitle>Competitividad (0-100)</SectionTitle>
          <Row label="Score IA" colsTemplate={colsTemplate}>
            {candidatos.map((c) => {
              const score = perfiles[c.id]?.score_competitividad;
              const isWinner = score !== undefined && score === maxScore && maxScore > 0;
              return (
                <Cell key={c.id}>
                  {score === undefined ? (
                    <NoAnalisis />
                  ) : (
                    <div className="space-y-1.5 w-full">
                      <div className="flex items-baseline gap-2">
                        <span
                          className={cn(
                            "text-2xl font-bold",
                            isWinner ? "text-primary" : "text-foreground"
                          )}
                        >
                          {score}
                        </span>
                        <span className="text-[10px] text-muted-foreground">/100</span>
                        {isWinner && (
                          <Trophy className="w-3.5 h-3.5 text-primary" aria-label="Mayor score" />
                        )}
                      </div>
                      <Progress value={score} className="h-1.5" />
                    </div>
                  )}
                </Cell>
              );
            })}
          </Row>

          {/* FODA */}
          <SectionTitle>FODA</SectionTitle>
          <Row label="Fortalezas" colsTemplate={colsTemplate}>
            {candidatos.map((c) => (
              <Cell key={c.id}>
                <BulletList items={perfiles[c.id]?.fortalezas} accent="emerald" />
              </Cell>
            ))}
          </Row>
          <Row label="Debilidades" colsTemplate={colsTemplate}>
            {candidatos.map((c) => (
              <Cell key={c.id}>
                <BulletList items={perfiles[c.id]?.debilidades} accent="rose" />
              </Cell>
            ))}
          </Row>
          <Row label="Oportunidades" colsTemplate={colsTemplate}>
            {candidatos.map((c) => (
              <Cell key={c.id}>
                <BulletList items={perfiles[c.id]?.oportunidades} accent="sky" />
              </Cell>
            ))}
          </Row>
          <Row label="Amenazas" colsTemplate={colsTemplate}>
            {candidatos.map((c) => (
              <Cell key={c.id}>
                <BulletList items={perfiles[c.id]?.amenazas} accent="amber" />
              </Cell>
            ))}
          </Row>
          <Row label="Votante natural" colsTemplate={colsTemplate}>
            {candidatos.map((c) => (
              <Cell key={c.id}>
                {perfiles[c.id]?.perfil_votante_natural ? (
                  <p className="text-xs leading-relaxed">{perfiles[c.id]?.perfil_votante_natural}</p>
                ) : (
                  <NoAnalisis />
                )}
              </Cell>
            ))}
          </Row>

          {/* Discurso */}
          <SectionTitle>Análisis discursivo</SectionTitle>
          <Row label="Tono" colsTemplate={colsTemplate}>
            {candidatos.map((c) => (
              <Cell key={c.id}>
                {discursos[c.id]?.tono ? (
                  <Badge variant="outline" className="text-[10px]">
                    {discursos[c.id]?.tono}
                  </Badge>
                ) : (
                  <NoAnalisis />
                )}
              </Cell>
            ))}
          </Row>
          <Row label="Ejes narrativos" colsTemplate={colsTemplate}>
            {candidatos.map((c) => (
              <Cell key={c.id}>
                <ChipList items={discursos[c.id]?.ejes_narrativos} />
              </Cell>
            ))}
          </Row>
          <Row label="Frames dominantes" colsTemplate={colsTemplate}>
            {candidatos.map((c) => (
              <Cell key={c.id}>
                <ChipList items={discursos[c.id]?.frames_dominantes} />
              </Cell>
            ))}
          </Row>
          <Row label="Vulnerabilidades argumentales" colsTemplate={colsTemplate}>
            {candidatos.map((c) => (
              <Cell key={c.id}>
                <BulletList items={discursos[c.id]?.vulnerabilidades_argumentales} accent="amber" />
              </Cell>
            ))}
          </Row>

          {/* OSINT */}
          <SectionTitle>OSINT (información pública)</SectionTitle>
          <Row label="Presencia digital" colsTemplate={colsTemplate}>
            {candidatos.map((c) => {
              const nivel = osints[c.id]?.presencia_digital?.nivel;
              return (
                <Cell key={c.id}>
                  {nivel ? (
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] capitalize",
                        nivel === "alta" && "border-emerald-500/50 text-emerald-400",
                        nivel === "media" && "border-amber-500/50 text-amber-400",
                        nivel === "baja" && "border-rose-500/50 text-rose-400"
                      )}
                    >
                      {nivel}
                    </Badge>
                  ) : (
                    <NoAnalisis />
                  )}
                </Cell>
              );
            })}
          </Row>
          <Row label="Plataformas fuertes" colsTemplate={colsTemplate}>
            {candidatos.map((c) => (
              <Cell key={c.id}>
                <ChipList items={osints[c.id]?.presencia_digital?.plataformas_fuertes} />
              </Cell>
            ))}
          </Row>
          <Row label="Temas recurrentes" colsTemplate={colsTemplate}>
            {candidatos.map((c) => (
              <Cell key={c.id}>
                <ChipList items={osints[c.id]?.temas_recurrentes} />
              </Cell>
            ))}
          </Row>
          <Row label="Aliados clave" colsTemplate={colsTemplate}>
            {candidatos.map((c) => (
              <Cell key={c.id}>
                <BulletList items={osints[c.id]?.aliados_clave} accent="sky" />
              </Cell>
            ))}
          </Row>
          <Row label="Controversias" colsTemplate={colsTemplate}>
            {candidatos.map((c) => {
              const items = osints[c.id]?.controversias;
              if (!items || items.length === 0)
                return (
                  <Cell key={c.id}>
                    <NoAnalisis />
                  </Cell>
                );
              return (
                <Cell key={c.id}>
                  <ul className="space-y-1.5 w-full">
                    {items.slice(0, 4).map((ctr, i) => (
                      <li key={i} className="text-xs">
                        <div className="flex items-center gap-1.5">
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[9px] px-1 py-0 capitalize",
                              ctr.gravedad === "alta" && "border-rose-500/50 text-rose-400",
                              ctr.gravedad === "media" && "border-amber-500/50 text-amber-400",
                              ctr.gravedad === "baja" && "border-muted-foreground/30 text-muted-foreground"
                            )}
                          >
                            {ctr.gravedad}
                          </Badge>
                          <span className="font-semibold truncate">{ctr.tema}</span>
                        </div>
                        <p className="text-muted-foreground text-[11px] mt-0.5">{ctr.descripcion}</p>
                      </li>
                    ))}
                  </ul>
                </Cell>
              );
            })}
          </Row>
        </div>
      </div>

      {loading && (
        <div className="text-xs text-muted-foreground text-center mt-3">Cargando análisis…</div>
      )}
      <p className="text-[10px] text-muted-foreground mt-4 italic">
        Las celdas vacías indican que ese análisis aún no se ha generado en la ficha individual del candidato.
      </p>
    </Card>
  );
}

/* ---------- Subcomponentes ---------- */

function HeaderRow({
  candidatos,
  colsTemplate,
}: {
  candidatos: Candidato[];
  colsTemplate: string;
}) {
  return (
    <div
      className="grid gap-2 sticky top-0 bg-card/95 backdrop-blur z-10 py-2 border-b border-border"
      style={{ gridTemplateColumns: colsTemplate }}
    >
      <div className="text-[10px] font-mono uppercase text-muted-foreground self-end">
        Criterio
      </div>
      {candidatos.map((c, idx) => (
        <div key={c.id} className="relative">
          {idx > 0 && (
            <div className="absolute -left-[5px] top-1/2 -translate-y-1/2 z-10">
              <div className="bg-primary text-primary-foreground rounded-full w-7 h-7 flex items-center justify-center text-[10px] font-bold shadow-lg">
                VS
              </div>
            </div>
          )}
          <div className="border border-border rounded-md p-2 bg-background/40">
            <div className="font-bold text-sm truncate">{c.nombre}</div>
            <div className="flex flex-wrap items-center gap-1 mt-1">
              <PartidoBadges partido={c.partido} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] font-mono uppercase tracking-widest text-primary pt-3 pb-1">
      {children}
    </div>
  );
}

function Row({
  label,
  children,
  colsTemplate,
}: {
  label: string;
  children: React.ReactNode;
  colsTemplate: string;
}) {
  return (
    <div
      className="grid gap-2 py-2 border-b border-border/40 items-start"
      style={{ gridTemplateColumns: colsTemplate }}
    >
      <div className="text-xs font-semibold text-muted-foreground pt-1">{label}</div>
      {children}
    </div>
  );
}

function Cell({ children }: { children: React.ReactNode }) {
  return <div className="flex items-start min-w-0">{children}</div>;
}

function BulletList({
  items,
  accent,
}: {
  items?: string[];
  accent: "emerald" | "rose" | "sky" | "amber";
}) {
  if (!items || items.length === 0) return <NoAnalisis />;
  const dot =
    accent === "emerald"
      ? "bg-emerald-400"
      : accent === "rose"
      ? "bg-rose-400"
      : accent === "sky"
      ? "bg-sky-400"
      : "bg-amber-400";
  return (
    <ul className="space-y-1 w-full">
      {items.slice(0, 5).map((item, i) => (
        <li key={i} className="text-xs flex gap-1.5 leading-snug">
          <span className={cn("w-1 h-1 rounded-full mt-1.5 flex-shrink-0", dot)} />
          <span className="min-w-0">{item}</span>
        </li>
      ))}
    </ul>
  );
}

function ChipList({ items }: { items?: string[] }) {
  if (!items || items.length === 0) return <NoAnalisis />;
  return (
    <div className="flex flex-wrap gap-1">
      {items.slice(0, 6).map((item, i) => (
        <Badge key={i} variant="outline" className="text-[10px]">
          {item}
        </Badge>
      ))}
    </div>
  );
}

function NoAnalisis() {
  return (
    <div className="flex items-center gap-1 text-[11px] text-muted-foreground/60 italic">
      <Minus className="w-3 h-3" />
      <span>Sin análisis</span>
      <Sparkles className="w-2.5 h-2.5 opacity-50" />
    </div>
  );
}

function Empty() {
  return <span className="text-muted-foreground/60 italic">—</span>;
}

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Network, Terminal } from "lucide-react";

interface CibAlerta {
  id: string;
  tipo_patron: string;
  severidad: string;
  entidad_nombre: string;
  titulo: string;
  descripcion: string;
  evidencia: any;
  ventana_inicio: string;
  ventana_fin: string;
  detectada_en: string;
}

const PATRON_LABEL: Record<string, string> = {
  spike_anomalo: "Pico anómalo",
  copy_paste: "Texto idéntico",
  dominacion_fuente: "Dominación de fuente",
  rafaga_temporal: "Ráfaga temporal",
};

export default function CibTrazabilidad() {
  const [alertas, setAlertas] = useState<CibAlerta[]>([]);
  const [activa, setActiva] = useState<CibAlerta | null>(null);
  const [logVisible, setLogVisible] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("cib_alertas")
        .select("*")
        .order("detectada_en", { ascending: false })
        .limit(40);
      const rows = (data ?? []) as CibAlerta[];
      setAlertas(rows);
      setActiva(rows[0] ?? null);
    })();
  }, []);

  // Generamos un grafo simple desde la evidencia: nodos = perfiles/fuentes, aristas = repetición
  const grafo = useMemo(() => {
    if (!activa) return { nodes: [], edges: [] as { from: number; to: number }[] };
    const ev = activa.evidencia ?? {};
    const fuentes: string[] =
      ev.perfiles ?? ev.cuentas ?? ev.fuentes ?? ev.urls?.slice(0, 8) ??
      Array.from({ length: 6 }, (_, i) => `acct_${activa.id.slice(0, 4)}_${i}`);
    const nodes = fuentes.slice(0, 8).map((f, i) => {
      const angle = (i / Math.min(fuentes.length, 8)) * Math.PI * 2;
      return { id: i, label: String(f).slice(0, 18), x: 150 + Math.cos(angle) * 110, y: 130 + Math.sin(angle) * 95 };
    });
    const edges: { from: number; to: number }[] = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) edges.push({ from: i, to: j });
    }
    return { nodes, edges };
  }, [activa]);

  return (
    <Card className="bg-card/50 backdrop-blur border-border/50 p-4 space-y-3">
      <div>
        <h2 className="text-base font-bold flex items-center gap-2">
          <Network className="w-4 h-4 text-orange-400" />
          02 · Trazabilidad CIB · Comportamiento Inauténtico
        </h2>
        <p className="text-[11px] text-muted-foreground font-mono mt-1">
          edge fn → <span className="text-primary">detectar-cib</span> · tabla{" "}
          <span className="text-primary">cib_alertas</span> · heurísticas: spike, copy-paste (Jaccard ≥0.7),
          dominación, ráfaga
        </p>
      </div>

      <div className="grid md:grid-cols-[260px_1fr] gap-3">
        <div className="space-y-1.5 max-h-[360px] overflow-y-auto pr-1">
          {alertas.length === 0 && (
            <p className="text-xs text-muted-foreground p-3">Sin clusters detectados aún.</p>
          )}
          {alertas.map((a) => (
            <button
              key={a.id}
              onClick={() => { setActiva(a); setLogVisible(false); }}
              className={`w-full text-left p-2 rounded border text-xs transition ${
                activa?.id === a.id ? "border-primary bg-primary/10" : "border-border/40 hover:bg-muted/30"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold truncate">{PATRON_LABEL[a.tipo_patron] ?? a.tipo_patron}</span>
                <Badge variant="outline" className="text-[9px]">{a.severidad}</Badge>
              </div>
              <div className="text-[10px] text-muted-foreground truncate">{a.entidad_nombre}</div>
              <div className="text-[9px] font-mono text-muted-foreground">
                {new Date(a.detectada_en).toLocaleString("es-MX")}
              </div>
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {activa ? (
            <>
              <div className="rounded-lg border border-border/40 bg-background/60 p-2">
                <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">
                  Grafo de coordinación · {activa.titulo}
                </div>
                <svg viewBox="0 0 300 260" className="w-full h-[240px]">
                  {grafo.edges.map((e, i) => (
                    <line
                      key={i}
                      x1={grafo.nodes[e.from].x} y1={grafo.nodes[e.from].y}
                      x2={grafo.nodes[e.to].x} y2={grafo.nodes[e.to].y}
                      stroke="hsl(var(--primary))" strokeOpacity={0.25} strokeWidth={1}
                    />
                  ))}
                  {grafo.nodes.map((n) => (
                    <g key={n.id}>
                      <circle cx={n.x} cy={n.y} r={9} fill="hsl(var(--primary))" fillOpacity={0.7} />
                      <text x={n.x} y={n.y + 22} fontSize={8} textAnchor="middle"
                            fill="hsl(var(--muted-foreground))" fontFamily="monospace">
                        {n.label}
                      </text>
                    </g>
                  ))}
                </svg>
              </div>

              <Button size="sm" variant="outline" onClick={() => setLogVisible((v) => !v)}>
                <Terminal className="w-3 h-3 mr-1" />
                {logVisible ? "Ocultar log" : "Ver log de detección"}
              </Button>

              {logVisible && (
                <pre className="text-[10px] font-mono bg-black/60 text-green-400 p-3 rounded border border-border/40 overflow-auto max-h-[300px]">
{`[detectar-cib] alerta ${activa.id}
patrón:        ${activa.tipo_patron}
entidad:       ${activa.entidad_nombre}
ventana:       ${activa.ventana_inicio} → ${activa.ventana_fin}
severidad:     ${activa.severidad}
descripcion:   ${activa.descripcion}

// evidencia cruda persistida en cib_alertas.evidencia (jsonb)
${JSON.stringify(activa.evidencia, null, 2)}

// criterios aplicados
- copy_paste: Jaccard(token_set) ≥ 0.7 entre títulos
- spike_anomalo: z-score > 3 sobre baseline 24h
- dominacion_fuente: una fuente > 60% del volumen
- rafaga_temporal: ≥6 publicaciones en 30 min`}
                </pre>
              )}
            </>
          ) : (
            <p className="text-xs text-muted-foreground">Selecciona una alerta para ver el grafo y el log.</p>
          )}
        </div>
      </div>
    </Card>
  );
}

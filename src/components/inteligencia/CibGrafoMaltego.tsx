import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Network, ZoomIn, ZoomOut, RotateCcw, Activity, Copy, Users, Zap, Globe, Hash, User } from "lucide-react";

interface CibAlerta {
  id: string;
  tipo_patron: string;
  severidad: string;
  entidad_nombre: string;
  candidato_id: string | null;
  titulo: string;
  descripcion: string;
  evidencia: any;
  detectada_en: string;
}

type NodeType = "entidad" | "fuente" | "url" | "hashtag" | "patron" | "fragmento";
interface GNode {
  id: string;
  label: string;
  type: NodeType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  meta?: any;
}
interface GEdge {
  source: string;
  target: string;
  kind: string;
  weight: number;
}

const TYPE_STYLE: Record<NodeType, { fill: string; stroke: string; icon: any; label: string }> = {
  entidad:    { fill: "#f97316", stroke: "#fdba74", icon: User,     label: "Entidad" },
  patron:     { fill: "#ef4444", stroke: "#fca5a5", icon: Activity, label: "Patrón CIB" },
  fuente:     { fill: "#3b82f6", stroke: "#93c5fd", icon: Users,    label: "Fuente / cuenta" },
  url:        { fill: "#10b981", stroke: "#6ee7b7", icon: Globe,    label: "URL" },
  hashtag:    { fill: "#a855f7", stroke: "#d8b4fe", icon: Hash,     label: "Hashtag" },
  fragmento:  { fill: "#eab308", stroke: "#fde68a", icon: Copy,     label: "Texto idéntico" },
};

const PATRON_ICON: Record<string, any> = {
  spike_anomalo: Activity,
  copy_paste: Copy,
  dominacion_fuente: Users,
  rafaga_temporal: Zap,
};

const SEV_COLOR: Record<string, string> = {
  critica: "#ef4444",
  alta:    "#f97316",
  media:   "#eab308",
  baja:    "#64748b",
};

// Construye el grafo desde las alertas
function construirGrafo(alertas: CibAlerta[]) {
  const nodes = new Map<string, GNode>();
  const edges: GEdge[] = [];

  const addNode = (id: string, label: string, type: NodeType, meta?: any) => {
    if (!nodes.has(id)) {
      nodes.set(id, {
        id, label, type, meta,
        x: 400 + (Math.random() - 0.5) * 600,
        y: 300 + (Math.random() - 0.5) * 400,
        vx: 0, vy: 0,
        size: type === "entidad" ? 22 : type === "patron" ? 16 : 9,
      });
    }
    return nodes.get(id)!;
  };

  for (const a of alertas) {
    const entId = `ent::${a.entidad_nombre}`;
    addNode(entId, a.entidad_nombre, "entidad");

    const patId = `pat::${a.id}`;
    addNode(patId, a.tipo_patron.replace("_", " "), "patron", { alerta: a });
    edges.push({ source: entId, target: patId, kind: "detecta", weight: 2 });

    const ev = a.evidencia ?? {};

    // Fuentes
    const fuentes: string[] = ev.fuentes ?? (ev.fuente_dominante ? [ev.fuente_dominante] : []);
    for (const f of fuentes.slice(0, 6)) {
      const fid = `src::${f}`;
      addNode(fid, String(f), "fuente");
      edges.push({ source: patId, target: fid, kind: "via", weight: 1 });
    }

    // URLs (muestra)
    const urls: string[] = ev.urls ?? ev.urls_muestra ?? [];
    for (const u of urls.slice(0, 5)) {
      const uid = `url::${u}`;
      try {
        const host = new URL(u).hostname.replace("www.", "");
        addNode(uid, host, "url", { url: u });
      } catch {
        addNode(uid, u.slice(0, 24), "url", { url: u });
      }
      edges.push({ source: patId, target: uid, kind: "evidencia", weight: 1 });
    }

    // Fragmento copy-paste
    if (ev.fragmento_base) {
      const fid = `frag::${a.id}`;
      addNode(fid, `"${String(ev.fragmento_base).slice(0, 28)}…"`, "fragmento");
      edges.push({ source: patId, target: fid, kind: "texto", weight: 2 });
    }

    // Tema → hashtag-like
    if (ev.tema) {
      const hid = `tag::${ev.tema}`;
      addNode(hid, `#${ev.tema}`, "hashtag");
      edges.push({ source: patId, target: hid, kind: "tema", weight: 1 });
    }
  }

  return { nodes: Array.from(nodes.values()), edges };
}

// Simulación de fuerzas (muy ligera, sin d3)
function simular(nodes: GNode[], edges: GEdge[], steps = 280) {
  const W = 800, H = 600;
  const k = 38;
  const repulsion = 2400;
  const damping = 0.82;

  for (let s = 0; s < steps; s++) {
    // Repulsión nodo-nodo
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        let d2 = dx * dx + dy * dy;
        if (d2 < 1) d2 = 1;
        const f = repulsion / d2;
        const d = Math.sqrt(d2);
        const fx = (dx / d) * f, fy = (dy / d) * f;
        a.vx += fx; a.vy += fy;
        b.vx -= fx; b.vy -= fy;
      }
    }
    // Atracción por aristas
    for (const e of edges) {
      const a = nodes.find(n => n.id === e.source)!;
      const b = nodes.find(n => n.id === e.target)!;
      if (!a || !b) continue;
      const dx = b.x - a.x, dy = b.y - a.y;
      const d = Math.sqrt(dx * dx + dy * dy) || 1;
      const f = (d - k * 2.4) * 0.04 * e.weight;
      const fx = (dx / d) * f, fy = (dy / d) * f;
      a.vx += fx; a.vy += fy;
      b.vx -= fx; b.vy -= fy;
    }
    // Gravedad al centro
    for (const n of nodes) {
      n.vx += (W / 2 - n.x) * 0.005;
      n.vy += (H / 2 - n.y) * 0.005;
      n.vx *= damping; n.vy *= damping;
      n.x += n.vx; n.y += n.vy;
    }
  }
  return nodes;
}

export default function CibGrafoMaltego() {
  const [alertas, setAlertas] = useState<CibAlerta[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroPatron, setFiltroPatron] = useState<string>("todos");
  const [filtroSev, setFiltroSev] = useState<string>("todos");
  const [activo, setActivo] = useState<GNode | null>(null);
  const [view, setView] = useState({ x: 0, y: 0, k: 1 });
  const dragRef = useRef<{ x: number; y: number; vx: number; vy: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("cib_alertas")
        .select("*")
        .order("detectada_en", { ascending: false })
        .limit(60);
      setAlertas((data ?? []) as CibAlerta[]);
      setLoading(false);
    })();
  }, []);

  const grafo = useMemo(() => {
    const filtradas = alertas.filter(a =>
      (filtroPatron === "todos" || a.tipo_patron === filtroPatron) &&
      (filtroSev === "todos" || a.severidad === filtroSev),
    );
    if (filtradas.length === 0) return { nodes: [], edges: [] };
    const g = construirGrafo(filtradas);
    simular(g.nodes, g.edges);
    return g;
  }, [alertas, filtroPatron, filtroSev]);

  const conteoPorTipo = useMemo(() => {
    const c: Record<string, number> = {};
    for (const n of grafo.nodes) c[n.type] = (c[n.type] ?? 0) + 1;
    return c;
  }, [grafo]);

  // Pan & zoom
  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = -e.deltaY * 0.001;
    setView(v => ({ ...v, k: Math.min(3, Math.max(0.4, v.k + delta)) }));
  };
  const onMouseDown = (e: React.MouseEvent) => {
    dragRef.current = { x: e.clientX, y: e.clientY, vx: view.x, vy: view.y };
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragRef.current) return;
    setView(v => ({
      ...v,
      x: dragRef.current!.vx + (e.clientX - dragRef.current!.x),
      y: dragRef.current!.vy + (e.clientY - dragRef.current!.y),
    }));
  };
  const onMouseUp = () => { dragRef.current = null; };

  const reset = () => setView({ x: 0, y: 0, k: 1 });

  return (
    <Card className="bg-card/50 backdrop-blur border-border/50 p-4 space-y-3">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-sm font-bold flex items-center gap-2">
            <Network className="w-4 h-4 text-orange-400" />
            Grafo de coordinación · vista Maltego
          </h3>
          <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
            entidades · patrones · fuentes · URLs · hashtags · fragmentos · {grafo.nodes.length} nodos · {grafo.edges.length} aristas
          </p>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <select
            value={filtroPatron}
            onChange={(e) => setFiltroPatron(e.target.value)}
            className="bg-background border border-border/60 rounded text-[11px] px-2 py-1"
          >
            <option value="todos">Todos los patrones</option>
            <option value="spike_anomalo">Pico anómalo</option>
            <option value="copy_paste">Copy-paste</option>
            <option value="dominacion_fuente">Dominación</option>
            <option value="rafaga_temporal">Ráfaga</option>
          </select>
          <select
            value={filtroSev}
            onChange={(e) => setFiltroSev(e.target.value)}
            className="bg-background border border-border/60 rounded text-[11px] px-2 py-1"
          >
            <option value="todos">Cualquier severidad</option>
            <option value="critica">Crítica</option>
            <option value="alta">Alta</option>
            <option value="media">Media</option>
            <option value="baja">Baja</option>
          </select>
          <Button size="sm" variant="ghost" onClick={() => setView(v => ({ ...v, k: Math.min(3, v.k + 0.2) }))}>
            <ZoomIn className="w-3.5 h-3.5" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setView(v => ({ ...v, k: Math.max(0.4, v.k - 0.2) }))}>
            <ZoomOut className="w-3.5 h-3.5" />
          </Button>
          <Button size="sm" variant="ghost" onClick={reset}>
            <RotateCcw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Leyenda */}
      <div className="flex items-center gap-3 flex-wrap text-[10px] font-mono">
        {(Object.keys(TYPE_STYLE) as NodeType[]).map(t => (
          <div key={t} className="flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: TYPE_STYLE[t].fill, boxShadow: `0 0 8px ${TYPE_STYLE[t].fill}` }} />
            <span className="text-muted-foreground uppercase tracking-wider">{TYPE_STYLE[t].label}</span>
            {conteoPorTipo[t] && <span className="text-foreground">{conteoPorTipo[t]}</span>}
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-[1fr_280px] gap-3">
        <div
          className="relative rounded-lg border border-border/40 overflow-hidden cursor-grab active:cursor-grabbing"
          style={{
            background:
              "radial-gradient(ellipse at center, hsl(220 30% 8%) 0%, hsl(220 40% 4%) 100%)",
            backgroundImage:
              "radial-gradient(ellipse at center, hsl(220 30% 8%) 0%, hsl(220 40% 4%) 100%), repeating-linear-gradient(0deg, transparent 0 23px, rgba(148,163,184,0.05) 23px 24px), repeating-linear-gradient(90deg, transparent 0 23px, rgba(148,163,184,0.05) 23px 24px)",
          }}
        >
          {loading ? (
            <div className="h-[520px] flex items-center justify-center text-xs text-muted-foreground">
              Cargando grafo…
            </div>
          ) : grafo.nodes.length === 0 ? (
            <div className="h-[520px] flex items-center justify-center text-xs text-muted-foreground">
              Sin alertas para los filtros seleccionados.
            </div>
          ) : (
            <svg
              ref={svgRef}
              viewBox="0 0 800 600"
              className="w-full h-[520px] select-none"
              onWheel={onWheel}
              onMouseDown={onMouseDown}
              onMouseMove={onMouseMove}
              onMouseUp={onMouseUp}
              onMouseLeave={onMouseUp}
            >
              <defs>
                <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="hsl(var(--muted-foreground))" opacity="0.5" />
                </marker>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="2.5" result="b" />
                  <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
              </defs>

              <g transform={`translate(${view.x},${view.y}) scale(${view.k})`}>
                {/* Edges */}
                {grafo.edges.map((e, i) => {
                  const a = grafo.nodes.find(n => n.id === e.source);
                  const b = grafo.nodes.find(n => n.id === e.target);
                  if (!a || !b) return null;
                  const isActive = activo && (activo.id === a.id || activo.id === b.id);
                  return (
                    <g key={i}>
                      <line
                        x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                        stroke={isActive ? "hsl(var(--primary))" : "rgba(148,163,184,0.35)"}
                        strokeWidth={isActive ? 1.6 : 0.8}
                        markerEnd="url(#arrow)"
                      />
                      {isActive && (
                        <text
                          x={(a.x + b.x) / 2} y={(a.y + b.y) / 2 - 4}
                          fontSize={8} fill="hsl(var(--primary))" fontFamily="monospace"
                          textAnchor="middle"
                        >
                          {e.kind}
                        </text>
                      )}
                    </g>
                  );
                })}

                {/* Nodes */}
                {grafo.nodes.map((n) => {
                  const style = TYPE_STYLE[n.type];
                  const isActive = activo?.id === n.id;
                  const sevStroke = n.type === "patron" && n.meta?.alerta
                    ? SEV_COLOR[n.meta.alerta.severidad] ?? style.stroke
                    : style.stroke;
                  return (
                    <g
                      key={n.id}
                      transform={`translate(${n.x},${n.y})`}
                      className="cursor-pointer"
                      onClick={(e) => { e.stopPropagation(); setActivo(n); }}
                    >
                      {n.type === "entidad" ? (
                        <polygon
                          points={Array.from({ length: 6 }, (_, i) => {
                            const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
                            const r = n.size + (isActive ? 4 : 0);
                            return `${Math.cos(a) * r},${Math.sin(a) * r}`;
                          }).join(" ")}
                          fill={style.fill}
                          stroke={sevStroke}
                          strokeWidth={isActive ? 2.5 : 1.5}
                          filter="url(#glow)"
                          opacity={0.95}
                        />
                      ) : n.type === "patron" ? (
                        <rect
                          x={-(n.size + (isActive ? 3 : 0))} y={-(n.size + (isActive ? 3 : 0))}
                          width={(n.size + (isActive ? 3 : 0)) * 2} height={(n.size + (isActive ? 3 : 0)) * 2}
                          rx={3}
                          fill={style.fill}
                          stroke={sevStroke}
                          strokeWidth={isActive ? 2.5 : 1.8}
                          filter="url(#glow)"
                          opacity={0.95}
                        />
                      ) : (
                        <circle
                          r={n.size + (isActive ? 3 : 0)}
                          fill={style.fill}
                          stroke={sevStroke}
                          strokeWidth={isActive ? 2 : 1}
                          opacity={0.9}
                        />
                      )}
                      <text
                        y={n.size + 12}
                        fontSize={n.type === "entidad" ? 10 : 8}
                        textAnchor="middle"
                        fontFamily="monospace"
                        fill={isActive ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))"}
                        style={{ paintOrder: "stroke", stroke: "hsl(220 40% 4%)", strokeWidth: 3 }}
                      >
                        {n.label.length > 22 ? n.label.slice(0, 22) + "…" : n.label}
                      </text>
                    </g>
                  );
                })}
              </g>

              {/* HUD */}
              <g>
                <rect x="8" y="8" width="160" height="22" rx="3" fill="rgba(0,0,0,0.5)" />
                <text x="16" y="23" fontSize="10" fontFamily="monospace" fill="hsl(var(--primary))">
                  zoom {view.k.toFixed(2)}x · drag para mover
                </text>
              </g>
            </svg>
          )}
        </div>

        {/* Inspector */}
        <div className="rounded-lg border border-border/40 bg-background/60 p-3 text-xs space-y-2 min-h-[200px]">
          <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            Inspector
          </div>
          {!activo ? (
            <p className="text-muted-foreground text-[11px]">
              Click en un nodo del grafo para ver detalles, evidencia y entidades relacionadas.
            </p>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span
                  className="inline-block w-3 h-3 rounded-full"
                  style={{ background: TYPE_STYLE[activo.type].fill, boxShadow: `0 0 10px ${TYPE_STYLE[activo.type].fill}` }}
                />
                <span className="font-semibold">{TYPE_STYLE[activo.type].label}</span>
              </div>
              <div className="font-mono text-[11px] break-all">{activo.label}</div>

              {activo.type === "patron" && activo.meta?.alerta && (() => {
                const a: CibAlerta = activo.meta.alerta;
                const Icon = PATRON_ICON[a.tipo_patron] ?? Activity;
                return (
                  <div className="space-y-1.5 pt-1 border-t border-border/40">
                    <div className="flex items-center gap-1.5">
                      <Icon className="w-3 h-3" />
                      <Badge variant="outline" className="text-[9px]">{a.severidad}</Badge>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(a.detectada_en).toLocaleString("es-MX")}
                      </span>
                    </div>
                    <div className="text-[11px]">{a.titulo}</div>
                    <div className="text-[10px] text-muted-foreground">{a.descripcion}</div>
                    <details className="text-[10px]">
                      <summary className="cursor-pointer text-primary">Evidencia cruda</summary>
                      <pre className="mt-1 p-2 bg-black/60 text-green-400 rounded overflow-auto max-h-[140px] text-[9px]">
{JSON.stringify(a.evidencia, null, 2)}
                      </pre>
                    </details>
                  </div>
                );
              })()}

              {activo.type === "url" && activo.meta?.url && (
                <a
                  href={activo.meta.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[10px] text-primary hover:underline break-all block"
                >
                  {activo.meta.url}
                </a>
              )}

              <div className="pt-1 border-t border-border/40">
                <div className="text-[10px] uppercase font-mono text-muted-foreground mb-1">Conexiones</div>
                <div className="space-y-0.5 max-h-[120px] overflow-auto">
                  {grafo.edges
                    .filter(e => e.source === activo.id || e.target === activo.id)
                    .slice(0, 12)
                    .map((e, i) => {
                      const otherId = e.source === activo.id ? e.target : e.source;
                      const other = grafo.nodes.find(n => n.id === otherId);
                      if (!other) return null;
                      return (
                        <button
                          key={i}
                          onClick={() => setActivo(other)}
                          className="w-full text-left text-[10px] flex items-center gap-1.5 hover:bg-muted/30 rounded px-1 py-0.5"
                        >
                          <span
                            className="inline-block w-2 h-2 rounded-full shrink-0"
                            style={{ background: TYPE_STYLE[other.type].fill }}
                          />
                          <span className="text-muted-foreground">{e.kind}</span>
                          <span className="truncate">{other.label}</span>
                        </button>
                      );
                    })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

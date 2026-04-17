import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  SEGMENTO_STYLE,
  RUBRO_LABEL,
  ZONA_TIPO_STYLE,
} from "@/data/estrategia-templates";
import {
  Sparkles, ShieldAlert, Users, Target, MapPin, Calendar, DollarSign, AlertTriangle, Activity, FileText, TrendingUp,
} from "lucide-react";

export interface EstrategiaOutput {
  resumen_ejecutivo: string;
  foda: { fortalezas: string[]; oportunidades: string[]; debilidades: string[]; amenazas: string[] };
  escenarios: { tipo: string; probabilidad_pct: number; margen_estimado: string; narrativa: string; condiciones_disparadoras: string[] }[];
  segmentacion: { segmento: string; pct_estimado: number; volumen_estimado: number; perfil: string; mensaje_clave: string; tactica: string }[];
  narrativa_central: { slogan: string; tesis: string; tres_pilares: string[] };
  plan_territorial: { zona: string; tipo: string; justificacion: string; accion_prioritaria: string; roi_estimado: string }[];
  calendario: { ventana: string; hitos: string[] }[];
  presupuesto: { rubro: string; pct: number; monto_sugerido_mxn: number; justificacion: string }[];
  estructura: { coordinaciones: string[]; brigadistas_estimados: number; casas_campaña: number; notas: string };
  riesgos: { riesgo: string; probabilidad: string; impacto: string; mitigacion: string }[];
  kpis: { nombre: string; meta: string; frecuencia: string; fuente: string }[];
}

const VENTANA_LABEL: Record<string, string> = {
  "90_dias": "90 días (ahora — hito 1)",
  "60_dias": "60 días (sprint medio)",
  "30_dias": "30 días (cierre / día D)",
};

export function ResultadoTabs({ data }: { data: EstrategiaOutput }) {
  return (
    <Tabs defaultValue="resumen" className="w-full">
      <TabsList className="grid grid-cols-3 md:grid-cols-9 w-full h-auto">
        <TabsTrigger value="resumen" className="text-[10px] md:text-xs"><FileText className="w-3 h-3 mr-1" />Resumen</TabsTrigger>
        <TabsTrigger value="foda" className="text-[10px] md:text-xs"><ShieldAlert className="w-3 h-3 mr-1" />FODA</TabsTrigger>
        <TabsTrigger value="escenarios" className="text-[10px] md:text-xs"><TrendingUp className="w-3 h-3 mr-1" />Escenarios</TabsTrigger>
        <TabsTrigger value="segmentos" className="text-[10px] md:text-xs"><Users className="w-3 h-3 mr-1" />Segmentos</TabsTrigger>
        <TabsTrigger value="territorio" className="text-[10px] md:text-xs"><MapPin className="w-3 h-3 mr-1" />Territorio</TabsTrigger>
        <TabsTrigger value="calendario" className="text-[10px] md:text-xs"><Calendar className="w-3 h-3 mr-1" />Calendario</TabsTrigger>
        <TabsTrigger value="presupuesto" className="text-[10px] md:text-xs"><DollarSign className="w-3 h-3 mr-1" />Presupuesto</TabsTrigger>
        <TabsTrigger value="riesgos" className="text-[10px] md:text-xs"><AlertTriangle className="w-3 h-3 mr-1" />Riesgos</TabsTrigger>
        <TabsTrigger value="kpis" className="text-[10px] md:text-xs"><Activity className="w-3 h-3 mr-1" />KPIs</TabsTrigger>
      </TabsList>

      {/* RESUMEN */}
      <TabsContent value="resumen" className="space-y-4 mt-4">
        <div className="rounded-lg border border-primary/40 bg-primary/5 p-5 space-y-3">
          <div className="text-[10px] font-mono uppercase tracking-widest text-primary flex items-center gap-1.5">
            <Sparkles className="w-3 h-3" /> Tesis estratégica
          </div>
          <p className="text-sm text-foreground leading-relaxed">{data.resumen_ejecutivo}</p>
        </div>
        <div className="rounded-lg border border-border/60 bg-card/40 p-5 space-y-3">
          <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Narrativa central</div>
          <div className="text-xl font-bold text-primary italic">"{data.narrativa_central.slogan}"</div>
          <p className="text-sm text-foreground/90">{data.narrativa_central.tesis}</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-2">
            {data.narrativa_central.tres_pilares.map((p, i) => (
              <div key={i} className="rounded-md border border-border/50 bg-background/40 p-3">
                <div className="text-[9px] font-mono uppercase text-primary">Pilar {i + 1}</div>
                <div className="text-xs text-foreground mt-1">{p}</div>
              </div>
            ))}
          </div>
        </div>
      </TabsContent>

      {/* FODA */}
      <TabsContent value="foda" className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
        {([
          ["fortalezas", "Fortalezas", "border-emerald-500/40 bg-emerald-500/5 text-emerald-400"],
          ["oportunidades", "Oportunidades", "border-sky-500/40 bg-sky-500/5 text-sky-400"],
          ["debilidades", "Debilidades", "border-amber-500/40 bg-amber-500/5 text-amber-400"],
          ["amenazas", "Amenazas", "border-rose-500/40 bg-rose-500/5 text-rose-400"],
        ] as const).map(([key, label, cls]) => (
          <div key={key} className={`rounded-lg border p-4 space-y-2 ${cls}`}>
            <div className="text-[10px] font-mono uppercase tracking-widest">{label}</div>
            <ul className="space-y-1.5">
              {data.foda[key].map((it, i) => (
                <li key={i} className="text-xs text-foreground/90 flex gap-1.5">
                  <span>●</span><span>{it}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </TabsContent>

      {/* ESCENARIOS */}
      <TabsContent value="escenarios" className="grid grid-cols-1 lg:grid-cols-3 gap-3 mt-4">
        {data.escenarios.map((esc) => {
          const color = esc.tipo === "optimista" ? "emerald" : esc.tipo === "moderado" ? "amber" : "rose";
          return (
            <div key={esc.tipo} className={`rounded-lg border p-4 space-y-3 border-${color}-500/40 bg-${color}-500/5`}>
              <div className="flex items-start justify-between">
                <div>
                  <div className={`text-[10px] font-mono uppercase tracking-widest text-${color}-400`}>{esc.tipo}</div>
                  <div className="text-sm font-bold text-foreground mt-0.5">{esc.margen_estimado}</div>
                </div>
                <div className={`text-2xl font-bold text-${color}-400`}>{esc.probabilidad_pct}%</div>
              </div>
              <p className="text-xs text-foreground/90 leading-relaxed">{esc.narrativa}</p>
              <div>
                <div className="text-[9px] font-mono uppercase text-muted-foreground mb-1">Disparadores</div>
                <ul className="space-y-1">
                  {esc.condiciones_disparadoras.map((c, i) => (
                    <li key={i} className="text-[11px] text-foreground/80 flex gap-1">
                      <span className={`text-${color}-400`}>▸</span><span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </TabsContent>

      {/* SEGMENTOS */}
      <TabsContent value="segmentos" className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
        {data.segmentacion.map((s) => {
          const style = SEGMENTO_STYLE[s.segmento] ?? SEGMENTO_STYLE.indeciso;
          return (
            <div key={s.segmento} className={`rounded-lg border p-4 space-y-2 ${style.color}`}>
              <div className="flex items-center justify-between">
                <div className="text-xs font-mono uppercase tracking-widest">{style.label}</div>
                <div className="text-right">
                  <div className="text-lg font-bold">{s.pct_estimado.toFixed(1)}%</div>
                  <div className="text-[9px] font-mono opacity-70">{s.volumen_estimado.toLocaleString()} pers.</div>
                </div>
              </div>
              <div>
                <div className="text-[9px] font-mono uppercase text-muted-foreground">Perfil</div>
                <div className="text-xs text-foreground/90">{s.perfil}</div>
              </div>
              <div>
                <div className="text-[9px] font-mono uppercase text-muted-foreground">Mensaje clave</div>
                <div className="text-xs text-foreground italic">"{s.mensaje_clave}"</div>
              </div>
              <div>
                <div className="text-[9px] font-mono uppercase text-muted-foreground">Táctica</div>
                <div className="text-xs text-foreground/90">{s.tactica}</div>
              </div>
            </div>
          );
        })}
      </TabsContent>

      {/* TERRITORIO */}
      <TabsContent value="territorio" className="space-y-2 mt-4">
        {data.plan_territorial.map((z, i) => {
          const style = ZONA_TIPO_STYLE[z.tipo] ?? ZONA_TIPO_STYLE.bisagra;
          return (
            <div key={i} className="rounded-lg border border-border/60 bg-card/40 p-3 flex flex-col md:flex-row md:items-start gap-3">
              <div className="md:w-48 shrink-0">
                <div className="text-sm font-bold text-foreground">{z.zona}</div>
                <Badge variant="outline" className={`text-[9px] mt-1 ${style.color}`}>{style.label}</Badge>
                <div className="text-[9px] font-mono uppercase text-muted-foreground mt-1">
                  ROI: <span className={z.roi_estimado === "alto" ? "text-emerald-400" : z.roi_estimado === "medio" ? "text-amber-400" : "text-muted-foreground"}>{z.roi_estimado}</span>
                </div>
              </div>
              <div className="flex-1 space-y-1.5">
                <div className="text-xs text-foreground/90">{z.justificacion}</div>
                <div className="text-xs text-primary font-semibold">→ {z.accion_prioritaria}</div>
              </div>
            </div>
          );
        })}
      </TabsContent>

      {/* CALENDARIO */}
      <TabsContent value="calendario" className="space-y-3 mt-4">
        {data.calendario.map((v) => (
          <div key={v.ventana} className="rounded-lg border border-border/60 bg-card/40 p-4">
            <div className="text-[10px] font-mono uppercase tracking-widest text-primary mb-2">
              {VENTANA_LABEL[v.ventana] ?? v.ventana}
            </div>
            <ul className="space-y-1.5">
              {v.hitos.map((h, i) => (
                <li key={i} className="text-xs text-foreground/90 flex gap-2">
                  <span className="text-primary font-mono">{String(i + 1).padStart(2, "0")}</span>
                  <span>{h}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </TabsContent>

      {/* PRESUPUESTO */}
      <TabsContent value="presupuesto" className="space-y-2 mt-4">
        {data.presupuesto.map((p, i) => (
          <div key={i} className="rounded-lg border border-border/60 bg-card/40 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-foreground">{RUBRO_LABEL[p.rubro] ?? p.rubro}</div>
              <div className="flex items-center gap-3">
                <div className="text-xs font-mono text-primary">{p.pct}%</div>
                <div className="text-xs font-mono text-foreground">${p.monto_sugerido_mxn.toLocaleString()}</div>
              </div>
            </div>
            <div className="h-1.5 bg-background/60 rounded-full overflow-hidden">
              <div className="h-full bg-primary" style={{ width: `${Math.min(p.pct, 100)}%` }} />
            </div>
            <div className="text-[11px] text-muted-foreground">{p.justificacion}</div>
          </div>
        ))}
      </TabsContent>

      {/* RIESGOS */}
      <TabsContent value="riesgos" className="space-y-2 mt-4">
        {data.riesgos.map((r, i) => (
          <div key={i} className="rounded-lg border border-border/60 bg-card/40 p-3 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="text-sm font-semibold text-foreground flex-1">{r.riesgo}</div>
              <div className="flex gap-1 shrink-0">
                <Badge variant="outline" className={`text-[9px] uppercase ${
                  r.probabilidad === "alta" ? "text-rose-400 border-rose-500/40" :
                  r.probabilidad === "media" ? "text-amber-400 border-amber-500/40" :
                  "text-sky-400 border-sky-500/40"
                }`}>P: {r.probabilidad}</Badge>
                <Badge variant="outline" className={`text-[9px] uppercase ${
                  r.impacto === "alto" ? "text-rose-400 border-rose-500/40" :
                  r.impacto === "medio" ? "text-amber-400 border-amber-500/40" :
                  "text-sky-400 border-sky-500/40"
                }`}>I: {r.impacto}</Badge>
              </div>
            </div>
            <div className="text-xs text-foreground/90">
              <span className="text-emerald-400 font-mono text-[10px] uppercase mr-1">Mitigación:</span>
              {r.mitigacion}
            </div>
          </div>
        ))}
      </TabsContent>

      {/* KPIs */}
      <TabsContent value="kpis" className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-4">
        {data.kpis.map((k, i) => (
          <div key={i} className="rounded-lg border border-border/60 bg-card/40 p-3 space-y-1">
            <div className="flex items-start justify-between">
              <div className="text-sm font-semibold text-foreground">{k.nombre}</div>
              <Badge variant="outline" className="text-[9px] uppercase">{k.frecuencia}</Badge>
            </div>
            <div className="text-xs text-primary font-mono">Meta: {k.meta}</div>
            <div className="text-[10px] text-muted-foreground">Fuente: {k.fuente}</div>
          </div>
        ))}
      </TabsContent>
    </Tabs>
  );
}

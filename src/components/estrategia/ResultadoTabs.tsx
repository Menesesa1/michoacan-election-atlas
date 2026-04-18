import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  SEGMENTO_STYLE,
  RUBRO_LABEL,
  ZONA_TIPO_STYLE,
} from "@/data/estrategia-templates";
import {
  Sparkles, ShieldAlert, Users, Target, MapPin, Calendar, DollarSign, AlertTriangle, Activity, FileText, TrendingUp, Trophy, Megaphone, Flame,
} from "lucide-react";

export interface MetaVictoriaOutput {
  votos_objetivo: number;
  participacion_supuesta_pct: number;
  umbral_pct: number;
  narrativa_camino: string;
  municipios_pivote: { nombre: string; peso_pct_total: number; secciones: number; accion_clave: string }[];
  secciones_clave: { municipio: string; num_secciones: number; votos_aporte_estimado: number; tipo_seccion: "urbana" | "mixta" | "rural"; justificacion: string }[];
}

export interface EstrategiaDigitalOutput {
  diagnostico_sentimiento: {
    tono_actual: "hostil" | "neutro" | "favorable" | "polarizado";
    temas_calientes: string[];
    adversarios_dominantes_en_red: string[];
    sintesis: string;
  };
  arquitectura_mensaje: {
    eje_emocional: string;
    eje_racional: string;
    frases_paraguas: string[];
    tabues: string[];
  };
  plataformas: {
    red: string;
    prioridad: "alta" | "media" | "baja";
    formato_dominante: string;
    frecuencia_semanal: string;
    kpi_principal: string;
    justificacion_audiencia: string;
  }[];
  voceros: { perfil: string; funcion: "ataque" | "empatia" | "propuesta" | "territorio" }[];
  calendario_contenido_semanal: Record<"lunes" | "martes" | "miercoles" | "jueves" | "viernes" | "sabado" | "domingo", string>;
  contraataque_y_crisis: { triggers: string[]; protocolo_24h: string; mensajes_pre_aprobados: string[] };
  aliados_influencia: { perfil: string; region: string; tipo: string }[];
}

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
  meta_victoria?: MetaVictoriaOutput;
  estrategia_digital_comunicacion?: EstrategiaDigitalOutput;
}

const VENTANA_LABEL: Record<string, string> = {
  "90_dias": "90 días (ahora — hito 1)",
  "60_dias": "60 días (sprint medio)",
  "30_dias": "30 días (cierre / día D)",
};

const TONO_STYLE: Record<string, string> = {
  hostil: "border-rose-500/40 bg-rose-500/10 text-rose-400",
  neutro: "border-slate-500/40 bg-slate-500/10 text-slate-300",
  favorable: "border-emerald-500/40 bg-emerald-500/10 text-emerald-400",
  polarizado: "border-amber-500/40 bg-amber-500/10 text-amber-400",
};

const PRIORIDAD_STYLE: Record<string, string> = {
  alta: "text-rose-400 border-rose-500/40 bg-rose-500/10",
  media: "text-amber-400 border-amber-500/40 bg-amber-500/10",
  baja: "text-sky-400 border-sky-500/40 bg-sky-500/10",
};

const FUNCION_STYLE: Record<string, string> = {
  ataque: "text-rose-400 border-rose-500/40",
  empatia: "text-pink-400 border-pink-500/40",
  propuesta: "text-sky-400 border-sky-500/40",
  territorio: "text-emerald-400 border-emerald-500/40",
};

const TIPO_SEC_STYLE: Record<string, string> = {
  urbana: "text-violet-300 border-violet-500/40 bg-violet-500/10",
  mixta: "text-amber-300 border-amber-500/40 bg-amber-500/10",
  rural: "text-emerald-300 border-emerald-500/40 bg-emerald-500/10",
};

const DIAS = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"] as const;

export function ResultadoTabs({ data }: { data: EstrategiaOutput }) {
  return (
    <Tabs defaultValue="resumen" className="w-full">
      <TabsList className="grid grid-cols-3 md:grid-cols-11 w-full h-auto">
        <TabsTrigger value="resumen" className="text-[10px] md:text-xs"><FileText className="w-3 h-3 mr-1" />Resumen</TabsTrigger>
        <TabsTrigger value="victoria" className="text-[10px] md:text-xs"><Trophy className="w-3 h-3 mr-1" />Victoria</TabsTrigger>
        <TabsTrigger value="comunicacion" className="text-[10px] md:text-xs"><Megaphone className="w-3 h-3 mr-1" />Com 360</TabsTrigger>
        <TabsTrigger value="foda" className="text-[10px] md:text-xs"><ShieldAlert className="w-3 h-3 mr-1" />FODA</TabsTrigger>
        <TabsTrigger value="escenarios" className="text-[10px] md:text-xs"><TrendingUp className="w-3 h-3 mr-1" />Escenarios</TabsTrigger>
        <TabsTrigger value="segmentos" className="text-[10px] md:text-xs"><Users className="w-3 h-3 mr-1" />Segmentos</TabsTrigger>
        <TabsTrigger value="territorio" className="text-[10px] md:text-xs"><MapPin className="w-3 h-3 mr-1" />Territorio</TabsTrigger>
        <TabsTrigger value="calendario" className="text-[10px] md:text-xs"><Calendar className="w-3 h-3 mr-1" />Calendario</TabsTrigger>
        <TabsTrigger value="presupuesto" className="text-[10px] md:text-xs"><DollarSign className="w-3 h-3 mr-1" />Presup.</TabsTrigger>
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

      {/* CAMINO A LA VICTORIA */}
      <TabsContent value="victoria" className="space-y-4 mt-4">
        {data.meta_victoria ? (
          <>
            <div className="rounded-lg border border-amber-500/40 bg-gradient-to-br from-amber-500/10 to-rose-500/5 p-5">
              <div className="text-[10px] font-mono uppercase tracking-widest text-amber-400 flex items-center gap-1.5 mb-3">
                <Target className="w-3 h-3" /> Meta de victoria
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-[9px] font-mono uppercase text-muted-foreground">Votos objetivo</div>
                  <div className="text-3xl font-bold text-amber-300 font-mono">
                    {data.meta_victoria.votos_objetivo.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-[9px] font-mono uppercase text-muted-foreground">Participación supuesta</div>
                  <div className="text-3xl font-bold text-foreground font-mono">
                    {data.meta_victoria.participacion_supuesta_pct.toFixed(1)}%
                  </div>
                </div>
                <div>
                  <div className="text-[9px] font-mono uppercase text-muted-foreground">Umbral victoria</div>
                  <div className="text-3xl font-bold text-foreground font-mono">
                    {data.meta_victoria.umbral_pct.toFixed(1)}%
                  </div>
                </div>
              </div>
              <p className="text-sm text-foreground/90 leading-relaxed mt-4 pt-4 border-t border-amber-500/20">
                {data.meta_victoria.narrativa_camino}
              </p>
            </div>

            <div className="rounded-lg border border-border/60 bg-card/40 p-4 space-y-3">
              <div className="text-[10px] font-mono uppercase tracking-widest text-primary">Municipios pivote</div>
              <div className="space-y-2">
                {data.meta_victoria.municipios_pivote.map((m, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="font-semibold text-foreground">{m.nombre}</div>
                      <div className="font-mono text-muted-foreground">
                        {m.secciones} sec · {m.peso_pct_total.toFixed(1)}%
                      </div>
                    </div>
                    <div className="h-1.5 bg-background/60 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-amber-500 to-rose-500" style={{ width: `${Math.min(m.peso_pct_total * 2.5, 100)}%` }} />
                    </div>
                    <div className="text-[11px] text-primary">→ {m.accion_clave}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-border/60 bg-card/40 p-4 space-y-2">
              <div className="text-[10px] font-mono uppercase tracking-widest text-primary">Secciones clave a movilizar</div>
              {data.meta_victoria.secciones_clave.map((s, i) => (
                <div key={i} className="rounded-md border border-border/40 bg-background/40 p-3 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-semibold text-foreground">{s.municipio}</div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={`text-[9px] uppercase ${TIPO_SEC_STYLE[s.tipo_seccion]}`}>{s.tipo_seccion}</Badge>
                      <span className="text-xs font-mono text-muted-foreground">{s.num_secciones} sec</span>
                      <span className="text-xs font-mono text-amber-300">+{s.votos_aporte_estimado.toLocaleString()} votos</span>
                    </div>
                  </div>
                  <div className="text-[11px] text-foreground/80">{s.justificacion}</div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-sm text-muted-foreground p-6 text-center">
            La IA no devolvió la sección de meta de victoria.
          </div>
        )}
      </TabsContent>

      {/* COMUNICACIÓN 360 */}
      <TabsContent value="comunicacion" className="space-y-4 mt-4">
        {data.estrategia_digital_comunicacion ? (
          <>
            <div className={`rounded-lg border p-4 space-y-2 ${TONO_STYLE[data.estrategia_digital_comunicacion.diagnostico_sentimiento.tono_actual]}`}>
              <div className="flex items-center justify-between">
                <div className="text-[10px] font-mono uppercase tracking-widest">Diagnóstico de sentimiento</div>
                <Badge variant="outline" className="text-[9px] uppercase">
                  Tono: {data.estrategia_digital_comunicacion.diagnostico_sentimiento.tono_actual}
                </Badge>
              </div>
              <p className="text-xs text-foreground/90">{data.estrategia_digital_comunicacion.diagnostico_sentimiento.sintesis}</p>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <div className="text-[9px] font-mono uppercase text-muted-foreground mb-1">Temas calientes</div>
                  <div className="flex flex-wrap gap-1">
                    {data.estrategia_digital_comunicacion.diagnostico_sentimiento.temas_calientes.map((t, i) => (
                      <Badge key={i} variant="outline" className="text-[10px]">{t}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-[9px] font-mono uppercase text-muted-foreground mb-1">Adversarios en red</div>
                  <div className="flex flex-wrap gap-1">
                    {data.estrategia_digital_comunicacion.diagnostico_sentimiento.adversarios_dominantes_en_red.map((a, i) => (
                      <Badge key={i} variant="outline" className="text-[10px] text-rose-400 border-rose-500/40">{a}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-primary/40 bg-primary/5 p-4 space-y-3">
              <div className="text-[10px] font-mono uppercase tracking-widest text-primary">Arquitectura de mensaje</div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-md bg-background/40 p-3">
                  <div className="text-[9px] font-mono uppercase text-pink-400">Eje emocional</div>
                  <div className="text-xs text-foreground mt-1">{data.estrategia_digital_comunicacion.arquitectura_mensaje.eje_emocional}</div>
                </div>
                <div className="rounded-md bg-background/40 p-3">
                  <div className="text-[9px] font-mono uppercase text-sky-400">Eje racional</div>
                  <div className="text-xs text-foreground mt-1">{data.estrategia_digital_comunicacion.arquitectura_mensaje.eje_racional}</div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {data.estrategia_digital_comunicacion.arquitectura_mensaje.frases_paraguas.map((f, i) => (
                  <div key={i} className="rounded-md border border-primary/30 bg-background/40 p-3">
                    <div className="text-[9px] font-mono uppercase text-primary">Frase {i + 1}</div>
                    <div className="text-sm text-foreground italic font-semibold mt-1">"{f}"</div>
                  </div>
                ))}
              </div>
              {data.estrategia_digital_comunicacion.arquitectura_mensaje.tabues.length > 0 && (
                <div className="pt-2 border-t border-primary/20">
                  <div className="text-[9px] font-mono uppercase text-rose-400 mb-1">Tabúes (NO mencionar)</div>
                  <div className="flex flex-wrap gap-1">
                    {data.estrategia_digital_comunicacion.arquitectura_mensaje.tabues.map((t, i) => (
                      <Badge key={i} variant="outline" className="text-[10px] text-rose-400 border-rose-500/40">{t}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {data.estrategia_digital_comunicacion.plataformas.map((p, i) => (
                <div key={i} className="rounded-lg border border-border/60 bg-card/40 p-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-bold text-foreground">{p.red}</div>
                    <Badge variant="outline" className={`text-[9px] uppercase ${PRIORIDAD_STYLE[p.prioridad]}`}>{p.prioridad}</Badge>
                  </div>
                  <div className="text-[11px] text-foreground/90"><span className="text-muted-foreground">Formato:</span> {p.formato_dominante}</div>
                  <div className="text-[11px] text-foreground/90"><span className="text-muted-foreground">Frecuencia:</span> {p.frecuencia_semanal}</div>
                  <div className="text-[11px] text-primary"><span className="text-muted-foreground">KPI:</span> {p.kpi_principal}</div>
                  <div className="text-[10px] text-muted-foreground italic">{p.justificacion_audiencia}</div>
                </div>
              ))}
            </div>

            <div className="rounded-lg border border-border/60 bg-card/40 p-4 space-y-2">
              <div className="text-[10px] font-mono uppercase tracking-widest text-primary">Calendario semanal de contenido</div>
              <div className="grid grid-cols-7 gap-1.5">
                {DIAS.map((d) => (
                  <div key={d} className="rounded-md border border-border/40 bg-background/40 p-2">
                    <div className="text-[9px] font-mono uppercase text-primary">{d.slice(0, 3)}</div>
                    <div className="text-[10px] text-foreground/90 mt-1 leading-tight">
                      {data.estrategia_digital_comunicacion!.calendario_contenido_semanal[d]}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="rounded-lg border border-border/60 bg-card/40 p-4 space-y-2">
                <div className="text-[10px] font-mono uppercase tracking-widest text-primary">Voceros</div>
                {data.estrategia_digital_comunicacion.voceros.map((v, i) => (
                  <div key={i} className="flex items-center justify-between gap-2 rounded-md border border-border/40 bg-background/40 p-2">
                    <div className="text-xs text-foreground">{v.perfil}</div>
                    <Badge variant="outline" className={`text-[9px] uppercase ${FUNCION_STYLE[v.funcion]}`}>{v.funcion}</Badge>
                  </div>
                ))}
              </div>
              <div className="rounded-lg border border-rose-500/40 bg-rose-500/5 p-4 space-y-2">
                <div className="text-[10px] font-mono uppercase tracking-widest text-rose-400 flex items-center gap-1.5">
                  <Flame className="w-3 h-3" /> Contraataque y crisis
                </div>
                <div>
                  <div className="text-[9px] font-mono uppercase text-muted-foreground">Triggers</div>
                  <ul className="text-[11px] text-foreground/90 space-y-0.5 mt-1">
                    {data.estrategia_digital_comunicacion.contraataque_y_crisis.triggers.map((t, i) => (
                      <li key={i}>▸ {t}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="text-[9px] font-mono uppercase text-muted-foreground">Protocolo 24h</div>
                  <p className="text-[11px] text-foreground/90 mt-0.5">{data.estrategia_digital_comunicacion.contraataque_y_crisis.protocolo_24h}</p>
                </div>
                <div>
                  <div className="text-[9px] font-mono uppercase text-muted-foreground">Mensajes pre-aprobados</div>
                  <ul className="text-[11px] text-foreground italic space-y-0.5 mt-1">
                    {data.estrategia_digital_comunicacion.contraataque_y_crisis.mensajes_pre_aprobados.map((m, i) => (
                      <li key={i}>"{m}"</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {data.estrategia_digital_comunicacion.aliados_influencia.length > 0 && (
              <div className="rounded-lg border border-border/60 bg-card/40 p-4 space-y-2">
                <div className="text-[10px] font-mono uppercase tracking-widest text-primary">Aliados de influencia</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {data.estrategia_digital_comunicacion.aliados_influencia.map((a, i) => (
                    <div key={i} className="rounded-md border border-border/40 bg-background/40 p-2">
                      <div className="text-xs font-semibold text-foreground">{a.perfil}</div>
                      <div className="text-[10px] text-muted-foreground">{a.region} · {a.tipo.replace(/_/g, " ")}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-sm text-muted-foreground p-6 text-center">
            La IA no devolvió la sección de comunicación 360.
          </div>
        )}
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

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Target,
  Users,
  MessageCircle,
  Megaphone,
  MapPin,
  Phone,
  Send,
  TrendingUp,
  CheckCircle2,
  Clock,
  Radio,
  UserCheck,
  Network,
  Zap,
  Calendar,
  BarChart3,
  Smartphone,
  ClipboardList,
} from "lucide-react";

/**
 * Operación 360 — módulo preparado (sin lógica conectada todavía)
 * Estructura visual lista para enchufarse a Estrategia 360,
 * KPIs territoriales reales, promotores de campo y WhatsApp.
 */
export default function Operacion() {
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="text-primary text-[10px] font-mono uppercase tracking-widest">
            Ejecución · 360°
          </div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Zap className="w-6 h-6 text-primary" />
            Operación 360
          </h1>
          <p className="text-sm text-muted-foreground max-w-3xl">
            Tablero unificado de promoción del voto, movilización en campo y campaña
            digital por WhatsApp. Conectado a la <span className="text-primary font-semibold">Estrategia 360</span>:
            cada KPI alimenta el camino a la victoria.
          </p>
        </div>
        <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-300 font-mono text-[10px] uppercase tracking-wider">
          ● Módulo en preparación
        </Badge>
      </div>

      {/* Resumen ejecutivo de operación */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiTile
          icon={<Target className="w-4 h-4" />}
          label="Avance vs meta"
          value="—"
          hint="votos comprometidos / objetivo"
          tone="primary"
        />
        <KpiTile
          icon={<Users className="w-4 h-4" />}
          label="Promotores activos"
          value="—"
          hint="estructura territorial viva"
          tone="emerald"
        />
        <KpiTile
          icon={<MessageCircle className="w-4 h-4" />}
          label="Cobertura WhatsApp"
          value="—"
          hint="contactos en cadena activa"
          tone="sky"
        />
        <KpiTile
          icon={<MapPin className="w-4 h-4" />}
          label="Secciones cubiertas"
          value="—"
          hint="de las mínimas a movilizar"
          tone="violet"
        />
      </div>

      <Tabs defaultValue="territorio" className="space-y-4">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="territorio" className="gap-1.5">
            <MapPin className="w-3.5 h-3.5" /> Territorio
          </TabsTrigger>
          <TabsTrigger value="promocion" className="gap-1.5">
            <Megaphone className="w-3.5 h-3.5" /> Promoción del voto
          </TabsTrigger>
          <TabsTrigger value="movilizacion" className="gap-1.5">
            <UserCheck className="w-3.5 h-3.5" /> Movilización en campo
          </TabsTrigger>
          <TabsTrigger value="whatsapp" className="gap-1.5">
            <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
          </TabsTrigger>
          <TabsTrigger value="integracion" className="gap-1.5">
            <Network className="w-3.5 h-3.5" /> Integración 360
          </TabsTrigger>
        </TabsList>

        {/* TERRITORIO */}
        <TabsContent value="territorio" className="space-y-4">
          <Card className="p-4 space-y-3">
            <SectionTitle
              icon={<Target className="w-4 h-4 text-primary" />}
              title="KPIs territoriales — Camino a la victoria"
              hint="Se sincronizará con meta_victoria de Estrategia 360"
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <KpiBlock label="Votos requeridos" value="—" sub="objetivo calculado" />
              <KpiBlock label="Votos comprometidos" value="—" sub="reportados por promotores" />
              <KpiBlock label="Brecha al cierre" value="—" sub="faltantes vs meta" />
            </div>
            <div>
              <div className="flex items-center justify-between text-[11px] mb-1.5">
                <span className="text-muted-foreground">Avance global hacia la meta</span>
                <span className="font-mono text-primary">0 / 0</span>
              </div>
              <Progress value={0} className="h-2" />
            </div>
          </Card>

          <Card className="p-4 space-y-3">
            <SectionTitle
              icon={<MapPin className="w-4 h-4 text-primary" />}
              title="Secciones electorales bajo operación"
              hint="Una fila por sección priorizada en el plan"
            />
            <div className="rounded-md border border-border/60 overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-muted/40 text-muted-foreground">
                  <tr>
                    <th className="text-left p-2">Sección</th>
                    <th className="text-left p-2">Municipio</th>
                    <th className="text-left p-2">Tipo</th>
                    <th className="text-right p-2">Lista nominal</th>
                    <th className="text-right p-2">Comprometidos</th>
                    <th className="text-right p-2">% avance</th>
                    <th className="text-left p-2">Promotor</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-muted-foreground italic">
                      Sin secciones cargadas. Se poblará al conectar con Estrategia 360 →
                      Camino a la victoria.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="p-4 space-y-3">
            <SectionTitle
              icon={<BarChart3 className="w-4 h-4 text-primary" />}
              title="Municipios pivote"
              hint="Aportación esperada al objetivo total"
            />
            <PlaceholderRow text="Top municipios pivote aparecerán aquí, ordenados por peso de votos." />
          </Card>
        </TabsContent>

        {/* PROMOCIÓN DEL VOTO */}
        <TabsContent value="promocion" className="space-y-4">
          <Card className="p-4 space-y-3">
            <SectionTitle
              icon={<Megaphone className="w-4 h-4 text-primary" />}
              title="Mensajes activos en cadena"
              hint="Arquitectura de mensaje desde Estrategia 360 → Comunicación"
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <MessageCard slot="Frase paraguas" />
              <MessageCard slot="Eje emocional" />
              <MessageCard slot="Eje racional" />
            </div>
          </Card>

          <Card className="p-4 space-y-3">
            <SectionTitle
              icon={<Calendar className="w-4 h-4 text-primary" />}
              title="Calendario semanal de contenido"
              hint="Sincronizado con plataformas y cadencia"
            />
            <div className="grid grid-cols-7 gap-1.5">
              {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => (
                <div
                  key={i}
                  className="aspect-square rounded-md border border-border/60 bg-muted/20 flex flex-col items-center justify-center text-[10px] text-muted-foreground"
                >
                  <span className="font-mono">{d}</span>
                  <span className="opacity-50">—</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-4 space-y-3">
            <SectionTitle
              icon={<Radio className="w-4 h-4 text-primary" />}
              title="Voceros y aliados de influencia"
              hint="Ataque · Empatía · Propuesta · Territorio"
            />
            <PlaceholderRow text="Aquí se listarán los voceros del War Room y aliados locales." />
          </Card>
        </TabsContent>

        {/* MOVILIZACIÓN EN CAMPO */}
        <TabsContent value="movilizacion" className="space-y-4">
          <Card className="p-4 space-y-3">
            <SectionTitle
              icon={<UserCheck className="w-4 h-4 text-primary" />}
              title="Estructura territorial"
              hint="Coordinadores → Promotores → Manzaneros"
            />
            <div className="grid grid-cols-3 gap-3">
              <StructureNode label="Coordinadores" value="—" icon={<Network className="w-4 h-4" />} />
              <StructureNode label="Promotores" value="—" icon={<Users className="w-4 h-4" />} />
              <StructureNode label="Manzaneros" value="—" icon={<MapPin className="w-4 h-4" />} />
            </div>
          </Card>

          <Card className="p-4 space-y-3">
            <SectionTitle
              icon={<ClipboardList className="w-4 h-4 text-primary" />}
              title="Tareas de campo del día"
              hint="Brigadeo, volanteo, casa por casa, eventos"
            />
            <ul className="space-y-1.5 text-xs">
              <TaskRow text="Brigadeo en secciones priorizadas" />
              <TaskRow text="Levantamiento casa por casa con compromiso" />
              <TaskRow text="Reporte fotográfico por promotor" />
              <TaskRow text="Eventos relámpago en zonas competidas" />
            </ul>
          </Card>

          <Card className="p-4 space-y-3">
            <SectionTitle
              icon={<TrendingUp className="w-4 h-4 text-primary" />}
              title="Reporte diario de avance"
              hint="Compromisos capturados vs meta del día"
            />
            <PlaceholderRow text="Gráfico de avance diario por sección y promotor." />
          </Card>
        </TabsContent>

        {/* WHATSAPP */}
        <TabsContent value="whatsapp" className="space-y-4">
          <Card className="p-4 space-y-3 border-emerald-500/30 bg-emerald-500/[0.02]">
            <SectionTitle
              icon={<MessageCircle className="w-4 h-4 text-emerald-400" />}
              title="Cadena WhatsApp"
              hint="Difusión jerárquica: coordinador → promotor → ciudadano"
            />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <KpiTile icon={<Phone className="w-4 h-4" />} label="Contactos" value="—" hint="en libreta operativa" tone="emerald" />
              <KpiTile icon={<Send className="w-4 h-4" />} label="Mensajes hoy" value="—" hint="enviados en cadena" tone="emerald" />
              <KpiTile icon={<CheckCircle2 className="w-4 h-4" />} label="Tasa de lectura" value="—" hint="confirmaciones" tone="emerald" />
              <KpiTile icon={<Clock className="w-4 h-4" />} label="Tiempo de propagación" value="—" hint="cima → base" tone="emerald" />
            </div>
          </Card>

          <Card className="p-4 space-y-3">
            <SectionTitle
              icon={<Smartphone className="w-4 h-4 text-primary" />}
              title="Plantillas de mensaje"
              hint="Pre-aprobadas, listas para difundir"
            />
            <div className="space-y-2">
              <TemplateRow tipo="Convocatoria" />
              <TemplateRow tipo="Llamado al voto" />
              <TemplateRow tipo="Respuesta a ataque" />
              <TemplateRow tipo="Día D — recordatorio" />
            </div>
          </Card>

          <Card className="p-4 space-y-3">
            <SectionTitle
              icon={<Network className="w-4 h-4 text-primary" />}
              title="Grupos y listas de difusión"
              hint="Segmentados por territorio y perfil"
            />
            <PlaceholderRow text="Aquí se listarán los grupos por municipio, sección y perfil objetivo." />
          </Card>
        </TabsContent>

        {/* INTEGRACIÓN 360 */}
        <TabsContent value="integracion" className="space-y-4">
          <Card className="p-4 space-y-3">
            <SectionTitle
              icon={<Network className="w-4 h-4 text-primary" />}
              title="Cómo se ensambla el 360°"
              hint="Cada bloque consume datos de otro módulo"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <IntegrationCard
                from="Estrategia 360 → Camino a la victoria"
                to="KPIs territoriales · Secciones cubiertas"
              />
              <IntegrationCard
                from="Estrategia 360 → Comunicación 360"
                to="Mensajes activos · Calendario · Voceros"
              />
              <IntegrationCard
                from="Candidatos → War Room"
                to="Voceros y narrativas en cadena"
              />
              <IntegrationCard
                from="Inteligencia → Listening"
                to="Plantillas de respuesta y manejo de crisis"
              />
              <IntegrationCard
                from="Demografía + Catálogo INE"
                to="Estructura territorial y metas por sección"
              />
              <IntegrationCard
                from="Operación 360 (este módulo)"
                to="Reporte diario que retroalimenta a Mando Central"
              />
            </div>
            <div className="pt-2 flex justify-end">
              <Button variant="outline" size="sm" disabled className="text-xs">
                Conectar con Estrategia 360 (próximamente)
              </Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ──────────── Subcomponentes ──────────── */

function SectionTitle({
  icon,
  title,
  hint,
}: {
  icon: React.ReactNode;
  title: string;
  hint?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-2 flex-wrap">
      <div className="flex items-center gap-2">
        {icon}
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      {hint && (
        <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">
          {hint}
        </span>
      )}
    </div>
  );
}

function KpiTile({
  icon,
  label,
  value,
  hint,
  tone = "primary",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
  tone?: "primary" | "emerald" | "sky" | "violet";
}) {
  const toneMap = {
    primary: "border-primary/30 bg-primary/5 text-primary",
    emerald: "border-emerald-500/30 bg-emerald-500/5 text-emerald-400",
    sky: "border-sky-500/30 bg-sky-500/5 text-sky-400",
    violet: "border-violet-500/30 bg-violet-500/5 text-violet-400",
  } as const;
  return (
    <Card className={`p-3 border ${toneMap[tone]}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] uppercase tracking-wider font-mono opacity-80">
          {label}
        </span>
        <span className="opacity-70">{icon}</span>
      </div>
      <div className="text-xl font-bold text-foreground">{value}</div>
      {hint && <div className="text-[10px] text-muted-foreground mt-0.5">{hint}</div>}
    </Card>
  );
}

function KpiBlock({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-md border border-border/60 bg-card/40 p-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">
        {label}
      </div>
      <div className="text-2xl font-bold text-foreground mt-1">{value}</div>
      {sub && <div className="text-[10px] text-muted-foreground mt-0.5">{sub}</div>}
    </div>
  );
}

function PlaceholderRow({ text }: { text: string }) {
  return (
    <div className="rounded-md border border-dashed border-border/60 bg-muted/10 p-6 text-center text-xs text-muted-foreground italic">
      {text}
    </div>
  );
}

function MessageCard({ slot }: { slot: string }) {
  return (
    <div className="rounded-md border border-border/60 bg-card/40 p-3 space-y-1.5">
      <div className="text-[10px] uppercase tracking-wider text-primary font-mono">{slot}</div>
      <div className="text-xs text-muted-foreground italic">
        Pendiente de sincronizar con Estrategia 360.
      </div>
    </div>
  );
}

function StructureNode({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-md border border-border/60 bg-card/40 p-3 text-center">
      <div className="flex justify-center text-primary mb-1">{icon}</div>
      <div className="text-xl font-bold text-foreground">{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono mt-0.5">
        {label}
      </div>
    </div>
  );
}

function TaskRow({ text }: { text: string }) {
  return (
    <li className="flex items-center gap-2 p-2 rounded-md border border-border/60 bg-muted/10">
      <CheckCircle2 className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
      <span className="text-foreground/90">{text}</span>
      <span className="ml-auto text-[10px] font-mono text-muted-foreground">—</span>
    </li>
  );
}

function TemplateRow({ tipo }: { tipo: string }) {
  return (
    <div className="flex items-center justify-between gap-2 p-2.5 rounded-md border border-border/60 bg-card/40">
      <div className="flex items-center gap-2">
        <Send className="w-3.5 h-3.5 text-emerald-400" />
        <span className="text-xs font-medium text-foreground">{tipo}</span>
      </div>
      <Badge variant="outline" className="text-[9px] font-mono">
        plantilla
      </Badge>
    </div>
  );
}

function IntegrationCard({ from, to }: { from: string; to: string }) {
  return (
    <div className="rounded-md border border-border/60 bg-card/40 p-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono mb-1">
        Origen
      </div>
      <div className="text-xs font-semibold text-foreground">{from}</div>
      <div className="my-2 border-t border-dashed border-border/60" />
      <div className="text-[10px] uppercase tracking-wider text-primary font-mono mb-1">
        Alimenta a
      </div>
      <div className="text-xs text-foreground/90">{to}</div>
    </div>
  );
}

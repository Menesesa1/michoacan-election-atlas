import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell,
} from "recharts";
import { TrendingUp, TrendingDown, Sparkles, EyeOff, Activity, Clock } from "lucide-react";

interface BeliefShift {
  id: string;
  entidad_nombre: string;
  candidato_id: string | null;
  tipo_shift: string;
  severidad: string;
  titulo: string;
  descripcion: string;
  delta: number | null;
  valor_anterior: number | null;
  valor_actual: number | null;
  temas_nuevos: any;
  temas_abandonados: any;
  ventana_anterior: string | null;
  ventana_actual: string | null;
  evidencia: any;
  detectado_en: string;
}

const ICONO: Record<string, any> = {
  deriva_sentimiento: Activity,
  polarizacion: TrendingUp,
  tema_emergente: Sparkles,
  tema_abandonado: EyeOff,
};

const ETIQUETA: Record<string, string> = {
  deriva_sentimiento: "Deriva de sentimiento",
  polarizacion: "Polarización",
  tema_emergente: "Tema emergente",
  tema_abandonado: "Tema abandonado",
};

const SEV_COLOR: Record<string, string> = {
  critica: "bg-destructive text-destructive-foreground",
  alta: "bg-orange-500/20 text-orange-300 border-orange-500/40",
  media: "bg-yellow-500/20 text-yellow-300 border-yellow-500/40",
  baja: "bg-muted text-muted-foreground",
};

function fmtFecha(s?: string | null) {
  if (!s) return "—";
  return new Date(s).toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" });
}

function ventanaTexto(s: BeliefShift) {
  const a = s.ventana_anterior ? new Date(s.ventana_anterior) : null;
  const b = s.ventana_actual ? new Date(s.ventana_actual) : null;
  if (!a || !b) return "—";
  const horas = Math.round((b.getTime() - a.getTime()) / 36e5);
  return `${horas} h entre baseline y ventana actual`;
}

interface Props {
  shift: BeliefShift | null;
  onClose: () => void;
}

export default function BeliefShiftDetail({ shift, onClose }: Props) {
  if (!shift) return null;
  const Icon = ICONO[shift.tipo_shift] ?? Activity;
  const isNeg = (shift.delta ?? 0) < 0;
  const ev = shift.evidencia ?? {};

  // Dataset comparativo de temas (baseline vs actual)
  const temasBase: Record<string, number> = ev.temas_baseline ?? {};
  const temasAct: Record<string, number> = ev.temas_actual ?? {};
  const todosTemas = Array.from(new Set([...Object.keys(temasBase), ...Object.keys(temasAct)]));
  const dataTemas = todosTemas
    .map((t) => ({
      tema: t,
      baseline: temasBase[t] ?? 0,
      actual: temasAct[t] ?? 0,
      delta: (temasAct[t] ?? 0) - (temasBase[t] ?? 0),
    }))
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .slice(0, 12);

  const totalAct = ev.total_actual ?? null;
  const totalBase = ev.total_baseline ?? null;

  // Métricas según tipo
  const metricas: { label: string; value: string; tone?: string }[] = [];
  if (shift.tipo_shift === "deriva_sentimiento") {
    metricas.push(
      { label: "Sentimiento baseline", value: (shift.valor_anterior ?? 0).toFixed(2) },
      { label: "Sentimiento actual", value: (shift.valor_actual ?? 0).toFixed(2), tone: isNeg ? "neg" : "pos" },
      { label: "Δ sentimiento", value: `${(shift.delta ?? 0) >= 0 ? "+" : ""}${(shift.delta ?? 0).toFixed(2)}`, tone: isNeg ? "neg" : "pos" },
    );
  } else if (shift.tipo_shift === "polarizacion") {
    metricas.push(
      { label: "% negativo baseline", value: `${(shift.valor_anterior ?? 0).toFixed(0)}%` },
      { label: "% negativo actual", value: `${(shift.valor_actual ?? 0).toFixed(0)}%`, tone: "neg" },
      { label: "Δ polarización", value: `+${(shift.delta ?? 0).toFixed(0)} pts`, tone: "neg" },
    );
  } else if (shift.tipo_shift === "tema_emergente") {
    metricas.push(
      { label: "Temas nuevos", value: String((shift.temas_nuevos as any[])?.length ?? 0), tone: "pos" },
      { label: "Pico tema top", value: String(shift.valor_actual ?? 0) },
    );
  } else if (shift.tipo_shift === "tema_abandonado") {
    metricas.push(
      { label: "Temas abandonados", value: String((shift.temas_abandonados as any[])?.length ?? 0), tone: "neg" },
      { label: "Pico previo", value: String(shift.valor_anterior ?? 0) },
    );
  }
  if (totalAct != null) metricas.push({ label: "Menciones (48h)", value: String(totalAct) });
  if (totalBase != null) metricas.push({ label: "Menciones (baseline)", value: String(totalBase) });

  return (
    <Sheet open={!!shift} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Icon className={`w-5 h-5 ${isNeg ? "text-red-400" : "text-fuchsia-400"}`} />
            <Badge variant="outline" className={SEV_COLOR[shift.severidad]}>{shift.severidad}</Badge>
            <Badge variant="outline" className="text-[10px]">{ETIQUETA[shift.tipo_shift] ?? shift.tipo_shift}</Badge>
          </div>
          <SheetTitle className="text-left">{shift.titulo}</SheetTitle>
          <SheetDescription className="text-left">{shift.descripcion}</SheetDescription>
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-muted-foreground">
            <Clock className="w-3 h-3" />
            {fmtFecha(shift.detectado_en)} · {shift.entidad_nombre}
          </div>
        </SheetHeader>

        <div className="mt-5 space-y-5">
          {/* Métricas */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {metricas.map((m, i) => (
              <Card key={i} className="p-3 bg-card/60 border-border/50">
                <div className="text-[10px] uppercase font-mono text-muted-foreground">{m.label}</div>
                <div className={`text-lg font-bold ${m.tone === "neg" ? "text-red-400" : m.tone === "pos" ? "text-emerald-400" : ""}`}>
                  {m.value}
                </div>
              </Card>
            ))}
          </div>

          {/* Ventanas de tiempo */}
          <Card className="p-4 bg-card/60 border-border/50 space-y-3">
            <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
              Ventanas de comparación
            </div>
            <div className="grid sm:grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <div className="text-[10px] uppercase text-muted-foreground">Baseline (7 días previos)</div>
                <div className="font-mono">{fmtFecha(shift.ventana_anterior)}</div>
                {totalBase != null && <div className="text-muted-foreground">{totalBase} menciones</div>}
              </div>
              <div className="space-y-1">
                <div className="text-[10px] uppercase text-muted-foreground">Ventana actual (últimas 48h)</div>
                <div className="font-mono">{fmtFecha(shift.ventana_actual)}</div>
                {totalAct != null && <div className="text-muted-foreground">{totalAct} menciones</div>}
              </div>
            </div>
            <div className="text-[11px] text-muted-foreground border-t border-border/40 pt-2">
              {ventanaTexto(shift)}
            </div>
          </Card>

          {/* Comparativo de temas */}
          {dataTemas.length > 0 && (
            <Card className="p-4 bg-card/60 border-border/50 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                  Desglose de temas · baseline vs actual
                </div>
                <div className="text-[10px] text-muted-foreground">top {dataTemas.length}</div>
              </div>

              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dataTemas} layout="vertical" margin={{ left: 10, right: 16 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                    <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                    <YAxis type="category" dataKey="tema" stroke="hsl(var(--muted-foreground))" fontSize={10} width={110} />
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        fontSize: 11,
                      }}
                    />
                    <Bar dataKey="baseline" fill="hsl(var(--muted-foreground))" opacity={0.5} name="Baseline" />
                    <Bar dataKey="actual" name="Actual">
                      {dataTemas.map((d, i) => (
                        <Cell key={i} fill={d.delta >= 0 ? "#a855f7" : "#ef4444"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-1 max-h-48 overflow-y-auto">
                {dataTemas.map((d) => (
                  <div key={d.tema} className="flex items-center justify-between text-[11px] font-mono py-1 border-b border-border/30 last:border-0">
                    <span className="truncate flex-1">{d.tema}</span>
                    <span className="text-muted-foreground w-12 text-right">{d.baseline}</span>
                    <span className="w-4 text-center">→</span>
                    <span className="w-12 text-right font-bold">{d.actual}</span>
                    <span className={`w-14 text-right ${d.delta > 0 ? "text-emerald-400" : d.delta < 0 ? "text-red-400" : "text-muted-foreground"}`}>
                      {d.delta > 0 ? "+" : ""}{d.delta}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Temas nuevos / abandonados explícitos */}
          {(Array.isArray(shift.temas_nuevos) && shift.temas_nuevos.length > 0) && (
            <Card className="p-4 bg-card/60 border-border/50 space-y-2">
              <div className="text-xs font-mono uppercase tracking-widest text-fuchsia-300 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3" /> Temas emergentes
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(shift.temas_nuevos as any[]).map((t: any, i: number) => (
                  <Badge key={i} variant="outline" className="bg-fuchsia-500/10 text-fuchsia-300 border-fuchsia-500/30">
                    +{t.tema} ({t.count})
                  </Badge>
                ))}
              </div>
            </Card>
          )}

          {(Array.isArray(shift.temas_abandonados) && shift.temas_abandonados.length > 0) && (
            <Card className="p-4 bg-card/60 border-border/50 space-y-2">
              <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                <EyeOff className="w-3 h-3" /> Temas abandonados
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(shift.temas_abandonados as any[]).map((t: any, i: number) => (
                  <Badge key={i} variant="outline" className="bg-muted/40 text-muted-foreground">
                    {t.tema} ({t.count} → 0)
                  </Badge>
                ))}
              </div>
            </Card>
          )}

          {/* JSON crudo */}
          <details className="text-[10px]">
            <summary className="cursor-pointer text-primary font-mono">Evidencia JSON cruda</summary>
            <pre className="mt-2 p-3 bg-black/60 text-green-400 rounded overflow-auto max-h-72 text-[10px]">
{JSON.stringify(ev, null, 2)}
            </pre>
          </details>
        </div>
      </SheetContent>
    </Sheet>
  );
}

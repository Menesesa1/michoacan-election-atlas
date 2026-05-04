// Situation Room — vista de un solo vistazo del escenario político actual.
// Combina líder de gobernatura, alertas críticas activas, sentimiento agregado
// y narrativas accionables. Es la primera cosa que ve el usuario al entrar.

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ShieldAlert, Crown, Activity, Megaphone, ChevronRight,
  TrendingUp, TrendingDown, Minus, MapPin,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useElectoralData } from "@/context/DataContext";
import { getResumenEstatal, PARTIDOS_CONFIG, type Partido } from "@/data/electoral-data";
import { useListaNominalOficial } from "@/hooks/use-lista-nominal-oficial";

const fmtPct = (n: number) => `${n.toFixed(1)}%`;

interface AlertaRow {
  id: string;
  titulo: string;
  prioridad: string;
  distrito: string;
  detectada_en: string;
}
interface CibRow { id: string; titulo: string; severidad: string; detectada_en: string }
interface SentRow { sentimiento_promedio: number | null; pct_negativo: number | null; pct_positivo: number | null; total_menciones: number; entidad_nombre: string }
interface NarrRow { id: string; mensaje: string; tono: string | null; urgencia: number; entidad_nombre: string }

export function SituationRoom() {
  const { distritos, elecciones } = useElectoralData();
  const { total: lnOficial } = useListaNominalOficial();
  const [alertas, setAlertas] = useState<AlertaRow[]>([]);
  const [cib, setCib] = useState<CibRow[]>([]);
  const [sent, setSent] = useState<SentRow[]>([]);
  const [narr, setNarr] = useState<NarrRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      const [a, c, s, n] = await Promise.all([
        supabase.from("alertas_crisis").select("id,titulo,prioridad,distrito,detectada_en")
          .order("detectada_en", { ascending: false }).limit(3),
        supabase.from("cib_alertas").select("id,titulo,severidad,detectada_en")
          .order("detectada_en", { ascending: false }).limit(2),
        supabase.from("social_resumen").select("sentimiento_promedio,pct_negativo,pct_positivo,total_menciones,entidad_nombre")
          .order("generado_en", { ascending: false }).limit(5),
        supabase.from("narrativas_sugeridas").select("id,mensaje,tono,urgencia,entidad_nombre")
          .eq("usado", false).order("urgencia", { ascending: false })
          .order("created_at", { ascending: false }).limit(3),
      ]);
      setAlertas((a.data ?? []) as AlertaRow[]);
      setCib((c.data ?? []) as CibRow[]);
      setSent((s.data ?? []) as SentRow[]);
      setNarr((n.data ?? []) as NarrRow[]);
      setLoading(false);
    })();
  }, []);

  // Líder de gobernatura: usar el cómputo más reciente disponible (federal o local).
  const ordenadas = [...elecciones].sort((a, b) => b.año - a.año);
  const ultimaKey = ordenadas[0]?.key ?? "fed2024";
  const previaKey = ordenadas[1]?.key;
  const resumenU = getResumenEstatal(ultimaKey, distritos);
  const resumenP = previaKey ? getResumenEstatal(previaKey, distritos) : null;

  const lider = (Object.entries(resumenU.totales) as [Partido, number][])
    .sort((a, b) => b[1] - a[1])[0];
  const liderPct = lider && resumenU.totalVotos > 0 ? (lider[1] / resumenU.totalVotos) * 100 : 0;
  const liderPctPrev = lider && resumenP && resumenP.totalVotos > 0
    ? ((resumenP.totales[lider[0]] ?? 0) / resumenP.totalVotos) * 100
    : 0;
  const swing = liderPct - liderPctPrev;
  const SwingIcon = swing > 0.5 ? TrendingUp : swing < -0.5 ? TrendingDown : Minus;

  // Sentimiento agregado del último ciclo
  const totalMenc = sent.reduce((s, r) => s + (r.total_menciones ?? 0), 0);
  const sentProm = totalMenc > 0
    ? sent.reduce((acc, r) => acc + (r.sentimiento_promedio ?? 0) * (r.total_menciones ?? 0), 0) / totalMenc
    : 0;
  const pctNegProm = totalMenc > 0
    ? sent.reduce((acc, r) => acc + (r.pct_negativo ?? 0) * (r.total_menciones ?? 0), 0) / totalMenc
    : 0;

  const totalAlertas = alertas.length + cib.length;
  const urgentes = [...alertas.filter((a) => a.prioridad === "urgente"),
                    ...cib.filter((c) => c.severidad === "alta" || c.severidad === "critica")].length;

  return (
    <Card className="p-4 bg-gradient-to-br from-card via-card to-card/40 border-primary/20">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary animate-pulse" />
          <h2 className="text-xs font-semibold uppercase tracking-widest text-primary">
            Situation Room · Escenario Político
          </h2>
        </div>
        <span className="text-[10px] font-mono text-muted-foreground">
          LN estatal {(lnOficial / 1e6).toFixed(2)}M · INE-DERFE
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Líder político */}
        <div className="border border-border rounded-lg p-3 bg-secondary/20">
          <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">
            <Crown className="w-3 h-3" /> Líder · {ordenadas[0]?.label ?? "—"}
          </div>
          {lider ? (
            <>
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-sm"
                  style={{ background: PARTIDOS_CONFIG[lider[0]]?.color }}
                />
                <span className="text-xl font-bold text-foreground">{lider[0]}</span>
              </div>
              <div className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1.5">
                <span className="font-mono font-semibold text-foreground">{fmtPct(liderPct)}</span>
                {previaKey && (
                  <Badge variant="outline" className={`text-[9px] px-1 py-0 h-4 border-0 ${
                    swing > 0.5 ? "text-emerald-400" : swing < -0.5 ? "text-destructive" : "text-muted-foreground"
                  }`}>
                    <SwingIcon className="w-2.5 h-2.5 mr-0.5" />
                    {swing > 0 ? "+" : ""}{swing.toFixed(1)} pts
                  </Badge>
                )}
              </div>
            </>
          ) : (
            <p className="text-xs text-muted-foreground">Sin datos.</p>
          )}
        </div>

        {/* Alertas críticas */}
        <div className="border border-border rounded-lg p-3 bg-secondary/20">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              <ShieldAlert className="w-3 h-3" /> Alertas
            </div>
            <Link to="/inteligencia#alertas" className="text-[9px] text-primary hover:underline">
              ver →
            </Link>
          </div>
          {loading ? (
            <Skeleton className="h-12" />
          ) : (
            <>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold text-foreground">{totalAlertas}</span>
                {urgentes > 0 && (
                  <Badge variant="destructive" className="text-[9px] py-0 h-4">
                    {urgentes} urgentes
                  </Badge>
                )}
              </div>
              <div className="text-[10px] text-muted-foreground mt-1 truncate">
                {alertas[0]?.titulo ?? cib[0]?.titulo ?? "Sin alertas activas"}
              </div>
            </>
          )}
        </div>

        {/* Sentimiento agregado */}
        <div className="border border-border rounded-lg p-3 bg-secondary/20">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              <Activity className="w-3 h-3" /> Sentimiento
            </div>
            <Link to="/inteligencia#sentimiento" className="text-[9px] text-primary hover:underline">
              ver →
            </Link>
          </div>
          {loading ? (
            <Skeleton className="h-12" />
          ) : totalMenc > 0 ? (
            <>
              <div className="text-xl font-bold text-foreground">
                {sentProm > 0.1 ? "🟢" : sentProm < -0.1 ? "🔴" : "🟡"} {sentProm.toFixed(2)}
              </div>
              <div className="text-[10px] text-muted-foreground mt-1">
                {totalMenc.toLocaleString("es-MX")} menciones · {pctNegProm.toFixed(0)}% negativas
              </div>
            </>
          ) : (
            <p className="text-xs text-muted-foreground">Sin monitoreo aún.</p>
          )}
        </div>

        {/* Narrativa accionable */}
        <div className="border border-border rounded-lg p-3 bg-secondary/20">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              <Megaphone className="w-3 h-3" /> Hoy comunicar
            </div>
            <Link to="/inteligencia#narrativas" className="text-[9px] text-primary hover:underline">
              ver →
            </Link>
          </div>
          {loading ? (
            <Skeleton className="h-12" />
          ) : narr.length > 0 ? (
            <>
              <p className="text-[11px] text-foreground line-clamp-2 leading-tight">
                "{narr[0].mensaje}"
              </p>
              <div className="text-[9px] text-muted-foreground mt-1 font-mono">
                {narr[0].entidad_nombre} · urgencia {narr[0].urgencia}/5
              </div>
            </>
          ) : (
            <p className="text-xs text-muted-foreground">Sin narrativas pendientes.</p>
          )}
        </div>
      </div>

      {/* Detalle de alertas críticas si las hay */}
      {!loading && (alertas.length > 0 || cib.length > 0) && (
        <div className="mt-3 pt-3 border-t border-border space-y-1.5">
          {alertas.slice(0, 3).map((a) => (
            <div key={a.id} className="flex items-start gap-2 text-[11px]">
              <Badge
                variant={a.prioridad === "urgente" ? "destructive" : "outline"}
                className="text-[9px] py-0 h-4 shrink-0"
              >
                {a.prioridad}
              </Badge>
              <span className="text-foreground flex-1 truncate">{a.titulo}</span>
              <span className="text-muted-foreground text-[10px] flex items-center gap-1 shrink-0">
                <MapPin className="w-2.5 h-2.5" /> {a.distrito}
              </span>
            </div>
          ))}
          {cib.slice(0, 2).map((c) => (
            <div key={c.id} className="flex items-start gap-2 text-[11px]">
              <Badge
                variant={c.severidad === "critica" || c.severidad === "alta" ? "destructive" : "outline"}
                className="text-[9px] py-0 h-4 shrink-0"
              >
                CIB · {c.severidad}
              </Badge>
              <span className="text-foreground flex-1 truncate">{c.titulo}</span>
            </div>
          ))}
          <Link
            to="/inteligencia"
            className="text-[10px] text-primary hover:underline font-mono flex items-center gap-1 pt-1"
          >
            Abrir Monitor de Inteligencia <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      )}
    </Card>
  );
}

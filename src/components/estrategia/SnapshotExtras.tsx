// Tarjetas extra del Snapshot 360: Universo de contendientes esperados,
// Inteligencia agregada (sentimiento, CIB, narrativas), Pulso Trends y
// validación de Lista Nominal estatal oficial.

import { Badge } from "@/components/ui/badge";
import { Users, Activity, Megaphone, ShieldAlert, TrendingUp, CheckCircle2, Clock } from "lucide-react";
import type { SnapshotPayload } from "@/lib/estrategia-context";

const fmt = (n: number) => new Intl.NumberFormat("es-MX").format(Math.round(n));

export function SnapshotExtras({ snapshot }: { snapshot: SnapshotPayload }) {
  const { contendientes_esperados, inteligencia, trends, lista_nominal_estatal_oficial } = snapshot;

  const cobertura =
    snapshot.demografia?.lista_nominal && lista_nominal_estatal_oficial
      ? (snapshot.demografia.lista_nominal / lista_nominal_estatal_oficial) * 100
      : null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Universo de contendientes esperados */}
      <div className="rounded-lg border border-border/60 bg-card/40 p-4 space-y-2 md:col-span-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-primary text-[10px] font-mono uppercase tracking-widest">
            <Users className="w-3 h-3" /> Universo de contendientes esperados (pre-lista oficial)
          </div>
          {lista_nominal_estatal_oficial && (
            <span className="text-[10px] font-mono text-muted-foreground">
              LN estatal oficial · {fmt(lista_nominal_estatal_oficial)}
              {cobertura !== null && ` · cobertura ${cobertura.toFixed(0)}%`}
            </span>
          )}
        </div>
        {contendientes_esperados && contendientes_esperados.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {contendientes_esperados.map((s) => (
              <div
                key={s.slot_id}
                className={`flex items-start gap-2 border rounded-md p-2 text-xs ${
                  s.estado === "registrado"
                    ? "border-emerald-500/40 bg-emerald-500/5"
                    : "border-border bg-secondary/20"
                }`}
              >
                {s.estado === "registrado" ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="text-foreground font-medium truncate">{s.etiqueta}</div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {s.partidos.map((p) => (
                      <Badge key={p} variant="outline" className="text-[9px] py-0 px-1 font-mono">{p}</Badge>
                    ))}
                    {s.tipo === "independiente" && (
                      <Badge variant="outline" className="text-[9px] py-0 px-1">independiente</Badge>
                    )}
                    <Badge
                      variant="outline"
                      className={`text-[9px] py-0 px-1 ${
                        s.estado === "registrado" ? "border-emerald-500/40 text-emerald-400" :
                        s.probabilidad === "alta" ? "border-primary/40 text-primary" :
                        s.probabilidad === "media" ? "border-amber-500/40 text-amber-400" :
                        "border-muted-foreground/40 text-muted-foreground"
                      }`}
                    >
                      {s.estado === "registrado" ? "registrado" : `prob. ${s.probabilidad}`}
                    </Badge>
                  </div>
                  {s.nota && (
                    <p className="text-[10px] text-muted-foreground mt-1 italic">{s.nota}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground italic">Catálogo de contendientes cargando…</p>
        )}
        <p className="text-[10px] text-muted-foreground/80 italic mt-2">
          La estrategia 360 cruza este universo con tu candidato propio. Cuando IEM/INE publique
          la lista oficial, los slots "pendiente" se enlazan automáticamente al registrarse en /candidatos.
        </p>
      </div>

      {/* Inteligencia agregada */}
      <div className="rounded-lg border border-border/60 bg-card/40 p-4 space-y-2">
        <div className="flex items-center gap-1.5 text-primary text-[10px] font-mono uppercase tracking-widest">
          <Activity className="w-3 h-3" /> Inteligencia · territorio
        </div>
        {inteligencia ? (
          <div className="space-y-1.5 text-xs">
            {inteligencia.total_menciones != null && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sentimiento</span>
                <span className="font-mono text-foreground">
                  {inteligencia.sentimiento_promedio != null && inteligencia.sentimiento_promedio > 0.1 ? "🟢" :
                   inteligencia.sentimiento_promedio != null && inteligencia.sentimiento_promedio < -0.1 ? "🔴" : "🟡"}{" "}
                  {(inteligencia.sentimiento_promedio ?? 0).toFixed(2)} ·{" "}
                  {inteligencia.total_menciones.toLocaleString("es-MX")} menciones
                </span>
              </div>
            )}
            {inteligencia.pct_negativo != null && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">% negativas</span>
                <span className="font-mono text-foreground">{inteligencia.pct_negativo.toFixed(0)}%</span>
              </div>
            )}
            {inteligencia.cib_alertas_activas != null && (
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3" /> CIB / Bots
                </span>
                <Badge
                  variant={inteligencia.cib_severidad_max === "critica" || inteligencia.cib_severidad_max === "alta" ? "destructive" : "outline"}
                  className="text-[9px] py-0 h-4"
                >
                  {inteligencia.cib_alertas_activas} · {inteligencia.cib_severidad_max ?? "baja"}
                </Badge>
              </div>
            )}
            {inteligencia.alertas_crisis_activas != null && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Alertas crisis</span>
                <span className="font-mono text-foreground">
                  {inteligencia.alertas_crisis_activas}
                  {inteligencia.alertas_urgentes ? ` · ${inteligencia.alertas_urgentes} urgentes` : ""}
                </span>
              </div>
            )}
            {inteligencia.top_temas && inteligencia.top_temas.length > 0 && (
              <div className="pt-1 border-t border-border/40">
                <div className="text-[10px] text-muted-foreground mb-1">Top temas conversación</div>
                <div className="flex flex-wrap gap-1">
                  {inteligencia.top_temas.slice(0, 5).map((t) => (
                    <Badge key={t.tema} variant="outline" className="text-[9px] py-0 px-1">
                      {t.tema} <span className="opacity-60 ml-1">{t.n}</span>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground italic">
            Aún no hay monitoreo activo para este territorio. Lanza el monitor en /inteligencia.
          </p>
        )}
      </div>

      {/* Narrativas pendientes */}
      <div className="rounded-lg border border-border/60 bg-card/40 p-4 space-y-2">
        <div className="flex items-center gap-1.5 text-primary text-[10px] font-mono uppercase tracking-widest">
          <Megaphone className="w-3 h-3" /> Narrativas accionables
        </div>
        {inteligencia?.narrativas_pendientes && inteligencia.narrativas_pendientes.length > 0 ? (
          <ul className="space-y-1.5">
            {inteligencia.narrativas_pendientes.slice(0, 3).map((n, i) => (
              <li key={i} className="text-xs">
                <p className="text-foreground line-clamp-2 leading-tight">"{n.mensaje}"</p>
                <div className="text-[10px] text-muted-foreground font-mono mt-0.5">
                  {n.tono ?? "neutral"} · urgencia {n.urgencia}/5
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-muted-foreground italic">Sin narrativas pendientes para incorporar.</p>
        )}
      </div>

      {/* Trends */}
      {trends && (
        <div className="rounded-lg border border-border/60 bg-card/40 p-4 space-y-2 md:col-span-2">
          <div className="flex items-center gap-1.5 text-primary text-[10px] font-mono uppercase tracking-widest">
            <TrendingUp className="w-3 h-3" /> Pulso Google Trends · {trends.termino}
          </div>
          <div className="flex flex-wrap gap-3 text-xs">
            {trends.promedio_interes != null && (
              <span className="text-foreground font-mono">
                Promedio <strong>{trends.promedio_interes.toFixed(0)}</strong>
              </span>
            )}
            {trends.pico_interes != null && (
              <span className="text-foreground font-mono">
                Pico <strong>{trends.pico_interes.toFixed(0)}</strong>
              </span>
            )}
            {trends.variacion_pct != null && (
              <span className={`font-mono ${trends.variacion_pct >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                Δ {trends.variacion_pct >= 0 ? "+" : ""}{trends.variacion_pct.toFixed(0)}%
              </span>
            )}
          </div>
          {trends.contexto_narrativo && (
            <p className="text-xs text-muted-foreground italic line-clamp-2">{trends.contexto_narrativo}</p>
          )}
          {trends.related_top && trends.related_top.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1">
              {trends.related_top.slice(0, 5).map((r) => (
                <Badge key={r.query} variant="outline" className="text-[9px] py-0 px-1">{r.query}</Badge>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

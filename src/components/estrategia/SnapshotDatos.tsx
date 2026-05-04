import type { SnapshotPayload } from "@/lib/estrategia-context";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { TrendingUp, Users, AlertTriangle, BarChart3, MapPin } from "lucide-react";
import { SnapshotExtras } from "./SnapshotExtras";

interface Props {
  snapshot: SnapshotPayload;
  supuestos: NonNullable<SnapshotPayload["supuestos_usuario"]>;
  setSupuestos: (s: NonNullable<SnapshotPayload["supuestos_usuario"]>) => void;
}

export function SnapshotDatos({ snapshot, supuestos, setSupuestos }: Props) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-lg border border-border/60 bg-card/40 p-4 space-y-2">
          <div className="flex items-center gap-1.5 text-primary text-[10px] font-mono uppercase tracking-widest">
            <TrendingUp className="w-3 h-3" /> Histórico electoral
          </div>
          {snapshot.historico.length === 0 ? (
            <div className="text-xs text-muted-foreground italic">Sin datos históricos para el territorio</div>
          ) : (
            <div className="space-y-1">
              {snapshot.historico.map((h) => (
                <div key={h.año} className="flex items-center justify-between text-xs border-b border-border/30 pb-1 last:border-0">
                  <div className="font-mono text-muted-foreground">{h.año}</div>
                  <div className="flex items-center gap-3">
                    <span className="text-foreground font-semibold">{h.ganador}</span>
                    <span className="text-emerald-400 font-mono text-[10px]">+{h.margen_pp.toFixed(1)} pp</span>
                    <span className="text-muted-foreground font-mono text-[10px]">{h.participacion_pct.toFixed(1)}% part.</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-lg border border-border/60 bg-card/40 p-4 space-y-2">
          <div className="flex items-center gap-1.5 text-primary text-[10px] font-mono uppercase tracking-widest">
            <Users className="w-3 h-3" /> Demografía
          </div>
          {snapshot.demografia ? (
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Lista nominal</span>
                <span className="text-foreground font-mono">{snapshot.demografia.lista_nominal.toLocaleString()}</span>
              </div>
            </div>
          ) : (
            <div className="text-xs text-muted-foreground italic">Sin datos demográficos disponibles</div>
          )}
        </div>

        <div className="rounded-lg border border-border/60 bg-card/40 p-4 space-y-2">
          <div className="flex items-center gap-1.5 text-primary text-[10px] font-mono uppercase tracking-widest">
            <BarChart3 className="w-3 h-3" /> Competitividad
          </div>
          {snapshot.competitividad ? (
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Margen último</span>
                <span className="text-foreground font-mono">{snapshot.competitividad.margen_ultimo_pct.toFixed(1)} pp</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Riesgo alternancia</span>
                <span className={`font-mono uppercase text-[10px] ${
                  snapshot.competitividad.riesgo_alternancia === "alto" ? "text-rose-400" :
                  snapshot.competitividad.riesgo_alternancia === "medio" ? "text-amber-400" : "text-emerald-400"
                }`}>
                  {snapshot.competitividad.riesgo_alternancia}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-xs text-muted-foreground italic">Calcular tras elegir territorio</div>
          )}
        </div>

        <div className="rounded-lg border border-border/60 bg-card/40 p-4 space-y-2">
          <div className="flex items-center gap-1.5 text-amber-400 text-[10px] font-mono uppercase tracking-widest">
            <AlertTriangle className="w-3 h-3" /> Alertas activas
          </div>
          {snapshot.alertas_activas?.length ? (
            <ul className="space-y-1">
              {snapshot.alertas_activas.map((a, i) => (
                <li key={i} className="text-xs text-foreground/80 flex gap-1.5">
                  <span className="text-amber-400">▲</span><span>{a}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-xs text-muted-foreground italic">Sin alertas registradas</div>
          )}
        </div>

        <div className="rounded-lg border border-border/60 bg-card/40 p-4 space-y-2 md:col-span-2">
          <div className="flex items-center gap-1.5 text-primary text-[10px] font-mono uppercase tracking-widest">
            <MapPin className="w-3 h-3" /> Composición territorial (catálogo INE)
          </div>
          {snapshot.composicion_territorial ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  {snapshot.composicion_territorial.secciones_total} secciones · perfil
                </span>
                <span className="text-foreground font-mono uppercase text-[10px] px-2 py-0.5 rounded bg-primary/15 text-primary">
                  {snapshot.composicion_territorial.perfil}
                </span>
              </div>
              <div className="flex h-2 w-full rounded-full overflow-hidden bg-secondary/40">
                <div
                  className="bg-primary"
                  style={{ width: `${snapshot.composicion_territorial.pct_urbano}%` }}
                  title={`Urbano ${snapshot.composicion_territorial.pct_urbano}%`}
                />
                <div
                  className="bg-accent"
                  style={{ width: `${snapshot.composicion_territorial.pct_mixto}%` }}
                  title={`Mixto ${snapshot.composicion_territorial.pct_mixto}%`}
                />
                <div
                  className="bg-muted-foreground/60"
                  style={{ width: `${snapshot.composicion_territorial.pct_rural}%` }}
                  title={`Rural ${snapshot.composicion_territorial.pct_rural}%`}
                />
              </div>
              <div className="flex justify-between text-[10px] font-mono">
                <span className="text-primary">Urbano {snapshot.composicion_territorial.pct_urbano}%</span>
                <span className="text-accent-foreground/80">Mixto {snapshot.composicion_territorial.pct_mixto}%</span>
                <span className="text-muted-foreground">Rural {snapshot.composicion_territorial.pct_rural}%</span>
              </div>
            </div>
          ) : (
            <div className="text-xs text-muted-foreground italic">
              Catálogo de secciones cargando o sin datos para este territorio…
            </div>
          )}
        </div>
      </div>

      <SnapshotExtras snapshot={snapshot} />

      <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-3">
        <div className="text-[10px] font-mono uppercase tracking-widest text-primary">
          Supuestos editables (alimentan el análisis IA)
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="space-y-1">
            <Label className="text-[10px] text-muted-foreground uppercase">Participación esperada %</Label>
            <Input
              type="number"
              value={supuestos.participacion_esperada_pct ?? ""}
              onChange={(e) => setSupuestos({ ...supuestos, participacion_esperada_pct: e.target.value ? Number(e.target.value) : undefined })}
              placeholder="55"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] text-muted-foreground uppercase">Voto duro estimado %</Label>
            <Input
              type="number"
              value={supuestos.voto_duro_pct ?? ""}
              onChange={(e) => setSupuestos({ ...supuestos, voto_duro_pct: e.target.value ? Number(e.target.value) : undefined })}
              placeholder="32"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] text-muted-foreground uppercase">Presupuesto total MXN</Label>
            <Input
              type="number"
              value={supuestos.presupuesto_total_mxn ?? ""}
              onChange={(e) => setSupuestos({ ...supuestos, presupuesto_total_mxn: e.target.value ? Number(e.target.value) : undefined })}
              placeholder="5000000"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

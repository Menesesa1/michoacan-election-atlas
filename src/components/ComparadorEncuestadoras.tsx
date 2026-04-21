import { useMemo } from "react";
import { ENCUESTADORAS, ENCUESTAS, comparadorMeta, type Encuesta } from "@/data/encuestadoras-mock";
import { calcularPromedioPonderado, detectarBandwagon, agruparPorTipo, nivelCredibilidad } from "@/lib/encuestadoras-analytics";
import { ShieldCheck, ShieldAlert, AlertTriangle, Info, TrendingUp } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

const SEV_BADGE = {
  alta:  { text: "text-red-300",     bg: "bg-red-500/15",     border: "border-red-500/60",  label: "Bandwagon · Alta" },
  media: { text: "text-orange-300",  bg: "bg-orange-500/10",  border: "border-orange-500/50", label: "Bandwagon · Media" },
  baja:  { text: "text-amber-300",   bg: "bg-amber-500/10",   border: "border-amber-500/40", label: "Bandwagon · Baja" },
} as const;

function fmtPct(v: number | null): string {
  return typeof v === "number" ? `${v.toFixed(1)}%` : "—";
}

function EncuestaCard({ enc }: { enc: Encuesta }) {
  const meta = ENCUESTADORAS[enc.encuestadoraId];
  if (!meta) return null;
  const cred = nivelCredibilidad(meta.credibilidad);
  const max = Math.max(...enc.resultados.map(r => r.pct ?? 0));
  const sinFichaTecnica = !enc.muestra && !enc.margenError && enc.metodologia === "no_reportada";

  return (
    <article className="executive-panel p-4 space-y-3">
      <header className="flex items-start justify-between gap-2 flex-wrap">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-bold text-foreground text-sm">{meta.nombre}</h4>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[9px] font-mono font-bold uppercase tracking-wider cursor-help ${cred.color} border-current/40`}>
                  {meta.tipo === "medio_local" ? <ShieldAlert className="w-2.5 h-2.5" /> : <ShieldCheck className="w-2.5 h-2.5" />}
                  {cred.label} · {meta.credibilidad}
                </span>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs text-xs">
                <p className="font-semibold mb-1">Credibilidad {meta.credibilidad}/100</p>
                <p className="text-muted-foreground">{meta.notaCredibilidad}</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="text-[10px] font-mono text-muted-foreground mt-0.5">
            {meta.casa} · {enc.periodo}
          </div>
        </div>
      </header>

      <div className="flex items-center gap-3 text-[10px] font-mono text-muted-foreground/90 flex-wrap">
        <span>n = {enc.muestra?.toLocaleString("es-MX") ?? <span className="text-orange-400">no reportada</span>}</span>
        <span>· {enc.metodologia.replace("_", " ")}</span>
        {enc.margenError !== null ? <span>· ±{enc.margenError}pp</span> : <span className="text-orange-400">· sin margen</span>}
        {enc.patrocinador === null && (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="text-orange-400 inline-flex items-center gap-0.5 cursor-help">
                <AlertTriangle className="w-2.5 h-2.5" /> sin patrocinador declarado
              </span>
            </TooltipTrigger>
            <TooltipContent className="text-xs max-w-xs">
              No declarar quién paga la encuesta es una bandera roja de transparencia metodológica.
            </TooltipContent>
          </Tooltip>
        )}
      </div>

      {sinFichaTecnica && (
        <div className="text-[10px] text-orange-400 bg-orange-500/5 border border-orange-500/30 rounded px-2 py-1 flex items-start gap-1.5">
          <Info className="w-3 h-3 mt-0.5 shrink-0" />
          <span>Sin ficha técnica completa. Considerar como referencia narrativa, no como medición demoscópica.</span>
        </div>
      )}

      <div className="space-y-1.5">
        {enc.resultados.map((r) => (
          <div key={r.candidato} className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full shrink-0" style={{ background: r.partidoColor }} />
            <span className="text-xs text-foreground/90 flex-1 truncate" title={r.candidato}>{r.candidato}</span>
            <div className="w-24 h-1.5 bg-muted/40 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: typeof r.pct === "number" ? `${(r.pct / max) * 100}%` : "0%", background: r.partidoColor }} />
            </div>
            <span className="text-[11px] font-mono font-bold text-foreground w-12 text-right">{fmtPct(r.pct)}</span>
          </div>
        ))}
      </div>
    </article>
  );
}

export function ComparadorEncuestadoras() {
  const promedios = useMemo(() => calcularPromedioPonderado(), []);
  const alertas = useMemo(() => detectarBandwagon(), []);
  const grupos = useMemo(() => agruparPorTipo(), []);
  const promedioMax = Math.max(...promedios.map(p => p.promedio), 1);

  return (
    <TooltipProvider delayDuration={200}>
      <section id="comparador" className="py-20 px-4 sm:px-6 lg:px-12 executive-gradient">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="space-y-3 text-center">
            <div className="inline-flex items-center gap-2 text-primary text-xs font-mono uppercase tracking-widest">
              <span className="h-px w-8 bg-primary" />
              Inteligencia Demoscópica
              <span className="h-px w-8 bg-primary" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">{comparadorMeta.titulo}</h2>
            <p className="text-muted-foreground max-w-3xl mx-auto text-sm">{comparadorMeta.subtitulo}</p>
          </div>

          {/* ───── Tendencia ponderada (encuestadoras serias) ───── */}
          <div className="executive-panel gold-border p-6 space-y-4">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <div className="flex items-center gap-2 text-primary text-[10px] font-mono uppercase tracking-widest">
                  <TrendingUp className="w-3 h-3" /> Promedio ponderado · solo encuestadoras nacionales
                </div>
                <h3 className="text-xl font-bold text-foreground mt-1">Tendencia consolidada</h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-2xl">
                  Cada encuesta pesa según credibilidad, recencia y tamaño de muestra. <strong className="text-foreground">No incluye encuestas de medios locales</strong> para evitar contaminación por bandwagon.
                </p>
              </div>
              <Badge variant="outline" className="font-mono text-[10px]">
                {grupos.nacionales.length} encuestas serias
              </Badge>
            </div>

            <div className="space-y-2">
              {promedios.map((p) => (
                <div key={p.candidato} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-4 sm:col-span-3 min-w-0">
                    <div className="font-semibold text-sm text-foreground truncate" title={p.candidato}>{p.candidato}</div>
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <span className="inline-block w-2 h-2 rounded-full" style={{ background: p.partidoColor }} />
                      {p.partido}
                    </div>
                  </div>
                  <div className="col-span-5 sm:col-span-7 relative h-5">
                    {/* Rango min-max */}
                    <div
                      className="absolute top-1/2 -translate-y-1/2 h-1 bg-muted/40 rounded-full"
                      style={{ left: `${(p.min / promedioMax) * 100}%`, width: `${((p.max - p.min) / promedioMax) * 100}%`, opacity: 0.5 }}
                      title={`Rango: ${p.min}% – ${p.max}%`}
                    />
                    {/* Barra promedio */}
                    <div
                      className="absolute top-1/2 -translate-y-1/2 h-3 rounded-full"
                      style={{ width: `${(p.promedio / promedioMax) * 100}%`, background: p.partidoColor }}
                    />
                  </div>
                  <div className="col-span-3 sm:col-span-2 text-right">
                    <div className="font-mono font-bold text-base text-foreground">{p.promedio.toFixed(1)}%</div>
                    <div className="text-[9px] font-mono text-muted-foreground">
                      [{p.min}–{p.max}] · σ {p.desviacion}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ───── Alertas de bandwagon ───── */}
          {alertas.length > 0 && (
            <div className="executive-panel p-5 space-y-3 border-l-4 border-red-500/60">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <h3 className="font-bold text-foreground">Patrón bandwagon detectado</h3>
                <Badge variant="outline" className="text-[9px] text-red-300 border-red-500/40">{alertas.length} {alertas.length === 1 ? "candidato" : "candidatos"}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Detección automática de candidatos cuyos números en medios locales convergen sospechosamente y se desvían del promedio de encuestadoras nacionales serias. Brecha ≥ 2pp + baja varianza entre medios = posible operación mediática.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {alertas.map((a) => {
                  const sev = SEV_BADGE[a.severidad];
                  const direccion = a.brecha > 0 ? "infla" : "desinfla";
                  return (
                    <div key={a.candidato} className={`p-3 rounded border-l-4 ${sev.border} ${sev.bg} space-y-1.5`}>
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-semibold text-sm text-foreground truncate" title={a.candidato}>{a.candidato}</div>
                        <Badge variant="outline" className={`text-[9px] ${sev.text} ${sev.border}`}>{sev.label}</Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-1 text-[10px] font-mono">
                        <div>
                          <div className="text-muted-foreground">Locales ({a.cantidadMedios})</div>
                          <div className="text-foreground font-bold">{a.promedioMediosLocales}%</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Nacionales</div>
                          <div className="text-foreground font-bold">{a.promedioNacionales}%</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Brecha</div>
                          <div className={`font-bold ${a.brecha > 0 ? "text-red-300" : "text-cyan-300"}`}>{a.brecha > 0 ? "+" : ""}{a.brecha}pp</div>
                        </div>
                      </div>
                      <p className="text-[10px] text-muted-foreground/90 leading-snug">
                        Los medios locales lo <strong className={a.brecha > 0 ? "text-red-300" : "text-cyan-300"}>{direccion}</strong> con varianza σ²={a.varianzaMediosLocales} (convergencia {a.varianzaMediosLocales <= 1.5 ? "alta · sospechosa" : a.varianzaMediosLocales <= 2.5 ? "moderada" : "natural"}).
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ───── Bloque 1: Encuestadoras nacionales serias ───── */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-emerald-500/30 pb-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <h3 className="text-lg font-bold text-foreground">Encuestadoras nacionales con metodología auditable</h3>
              <span className="text-[10px] font-mono text-muted-foreground ml-auto">{grupos.nacionales.length} fuentes</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {grupos.nacionales.map((enc) => <EncuestaCard key={enc.id} enc={enc} />)}
            </div>
          </div>

          {/* ───── Bloque 2: Medios locales (referencia) ───── */}
          {grupos.mediosLocales.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-orange-500/30 pb-2">
                <ShieldAlert className="w-5 h-5 text-orange-400" />
                <h3 className="text-lg font-bold text-foreground">Encuestas publicadas en medios locales</h3>
                <span className="text-[10px] font-mono text-muted-foreground ml-auto">{grupos.mediosLocales.length} fuentes · referencia narrativa</span>
              </div>
              <p className="text-xs text-muted-foreground -mt-2 max-w-3xl">
                Estas encuestas <strong className="text-orange-300">no se incluyen en el promedio ponderado</strong> porque carecen de ficha técnica completa o metodología auditable. Sirven para entender qué narrativa están construyendo los medios locales, no como medición real.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {grupos.mediosLocales.map((enc) => <EncuestaCard key={enc.id} enc={enc} />)}
              </div>
            </div>
          )}

          <p className="text-[10px] text-center text-muted-foreground/70 font-mono pt-4">
            Datos demostrativos calibrados con tendencias públicas · Reemplazables vía importador CSV / Firecrawl
          </p>
        </div>
      </section>
    </TooltipProvider>
  );
}

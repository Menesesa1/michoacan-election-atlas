// Mapa de calor territorial de sentimiento por municipio.
// Cruza social_menciones (con campo `municipio`) contra centroides de los 113 municipios
// y pinta cada uno según el sentimiento promedio (verde→amarillo→rojo) y volumen.
import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { supabase } from "@/integrations/supabase/client";
import { MUNICIPIO_CENTROIDES, MICHOACAN_CENTER, MICHOACAN_ZOOM } from "@/data/municipios-centroides";
import { Loader2, MapPin, RefreshCw, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface MunicipioStats {
  municipio: string;
  total: number;
  sentPromedio: number;
  positivas: number;
  negativas: number;
  neutras: number;
  ultimoTitulo: string;
}

function colorPorSentimiento(s: number): string {
  // verde (+1) → amarillo (0) → rojo (-1)
  if (s >= 0.4) return "hsl(140, 65%, 50%)"; // verde
  if (s >= 0.1) return "hsl(95, 60%, 55%)"; // verde-lima
  if (s > -0.1) return "hsl(48, 90%, 60%)"; // amarillo
  if (s > -0.4) return "hsl(20, 85%, 55%)"; // naranja
  return "hsl(0, 75%, 55%)"; // rojo
}

function radioPorVolumen(total: number): number {
  return Math.max(8, Math.min(28, 7 + Math.sqrt(total) * 3.5));
}

function etiquetaSent(s: number): string {
  if (s >= 0.2) return "Positivo";
  if (s <= -0.2) return "Negativo";
  return "Neutro";
}

export function MapaCalorSentimiento() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const [stats, setStats] = useState<MunicipioStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [batchId, setBatchId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function cargarDatos() {
    setLoading(true);
    setError(null);
    try {
      // Buscar el batch MÁS RECIENTE que efectivamente tenga menciones con municipio.
      // Las primeras corridas de listening no detectaban municipio, así que el último batch
      // puede estar vacío de geo-data; saltamos hasta encontrar uno útil.
      const { data: runs } = await supabase
        .from("social_runs")
        .select("batch_id")
        .is("error", null)
        .gt("total_menciones", 0)
        .order("ejecutada_en", { ascending: false })
        .limit(10);

      if (!runs || runs.length === 0) {
        setStats([]);
        setLoading(false);
        return;
      }

      let menciones: Array<{ municipio: string | null; sentimiento: number; titulo: string }> | null = null;
      let batchUsado: string | null = null;

      for (const r of runs) {
        const { data } = await supabase
          .from("social_menciones")
          .select("municipio, sentimiento, titulo")
          .eq("batch_id", r.batch_id)
          .not("municipio", "is", null)
          .limit(2000);
        if (data && data.length > 0) {
          menciones = data;
          batchUsado = r.batch_id;
          break;
        }
      }

      setBatchId(batchUsado ?? runs[0].batch_id);

      if (!menciones || menciones.length === 0) {
        setStats([]);
        setError("Las menciones existentes no tienen municipio detectado. Ejecuta un nuevo listening en /inteligencia/listening-estatal para que la IA clasifique el municipio de cada mención.");
        setLoading(false);
        return;
      }

      // Agregar por municipio
      const map = new Map<string, MunicipioStats>();
      for (const m of menciones) {
        if (!m.municipio) continue;
        const cur = map.get(m.municipio) ?? {
          municipio: m.municipio,
          total: 0,
          sentPromedio: 0,
          positivas: 0,
          negativas: 0,
          neutras: 0,
          ultimoTitulo: m.titulo,
        };
        cur.total += 1;
        cur.sentPromedio += Number(m.sentimiento);
        if (Number(m.sentimiento) > 0.2) cur.positivas += 1;
        else if (Number(m.sentimiento) < -0.2) cur.negativas += 1;
        else cur.neutras += 1;
        map.set(m.municipio, cur);
      }
      const arr = Array.from(map.values()).map((s) => ({
        ...s,
        sentPromedio: Number((s.sentPromedio / s.total).toFixed(2)),
      }));
      arr.sort((a, b) => b.total - a.total);
      setStats(arr);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    cargarDatos();
  }, []);

  // Inicializar mapa una vez
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;
    const map = L.map(mapRef.current, {
      center: MICHOACAN_CENTER,
      zoom: MICHOACAN_ZOOM,
      zoomControl: true,
      scrollWheelZoom: true,
    });
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution: "&copy; CARTO · IEM/INEGI",
      subdomains: "abcd",
      maxZoom: 18,
    }).addTo(map);
    mapInstanceRef.current = map;
    layerRef.current = L.layerGroup().addTo(map);
    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Pintar municipios cuando cambian los stats
  useEffect(() => {
    if (!mapInstanceRef.current || !layerRef.current) return;
    layerRef.current.clearLayers();

    stats.forEach((s) => {
      const coord = MUNICIPIO_CENTROIDES[s.municipio];
      if (!coord) return;
      const color = colorPorSentimiento(s.sentPromedio);
      const radius = radioPorVolumen(s.total);
      const circle = L.circleMarker(coord, {
        radius,
        fillColor: color,
        fillOpacity: 0.75,
        color: "hsl(210, 20%, 92%)",
        weight: 1.5,
      });
      const sentLabel = etiquetaSent(s.sentPromedio);
      circle.bindTooltip(
        `<b>${s.municipio}</b><br/>${s.total} menciones · ${sentLabel} (${s.sentPromedio.toFixed(2)})`,
        { direction: "top", className: "electoral-tooltip", sticky: true },
      );
      circle.bindPopup(
        `<div style="font-family:Inter,sans-serif;font-size:12px;min-width:220px;">
          <div style="font-weight:700;font-size:14px;margin-bottom:6px;color:#f4f4f4;">${s.municipio}</div>
          <div style="display:flex;gap:6px;margin-bottom:8px;flex-wrap:wrap;">
            <span style="background:${color};color:#0a0a0a;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:700;">${sentLabel}</span>
            <span style="background:#1f2937;color:#fff;padding:2px 8px;border-radius:4px;font-size:11px;">${s.total} menciones</span>
          </div>
          <div style="color:#bbb;font-size:11px;line-height:1.6;">
            Sentimiento: <b style="color:#c5a059;">${s.sentPromedio.toFixed(2)}</b><br/>
            <span style="color:hsl(140,65%,55%)">● ${s.positivas} positivas</span><br/>
            <span style="color:hsl(48,90%,60%)">● ${s.neutras} neutras</span><br/>
            <span style="color:hsl(0,75%,60%)">● ${s.negativas} negativas</span><br/>
            <div style="margin-top:6px;font-style:italic;color:#999;font-size:10px;">"${s.ultimoTitulo.slice(0, 90)}..."</div>
          </div>
        </div>`,
        { className: "electoral-popup" },
      );
      circle.on("mouseover", function () {
        this.setStyle({ fillOpacity: 1, weight: 3 });
      });
      circle.on("mouseout", function () {
        this.setStyle({ fillOpacity: 0.75, weight: 1.5 });
      });
      circle.addTo(layerRef.current!);
    });
  }, [stats]);

  const totales = useMemo(() => {
    const t = stats.reduce(
      (acc, s) => {
        acc.total += s.total;
        acc.pos += s.positivas;
        acc.neg += s.negativas;
        return acc;
      },
      { total: 0, pos: 0, neg: 0 },
    );
    return t;
  }, [stats]);

  const topCalientes = useMemo(
    () => [...stats].filter((s) => s.sentPromedio < 0).sort((a, b) => a.sentPromedio - b.sentPromedio).slice(0, 5),
    [stats],
  );
  const topApoyos = useMemo(
    () => [...stats].filter((s) => s.sentPromedio > 0).sort((a, b) => b.sentPromedio - a.sentPromedio).slice(0, 5),
    [stats],
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="glass-panel p-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              Mapa de Calor Territorial · Sentimiento por Municipio
            </h2>
            <p className="text-[11px] text-muted-foreground font-mono mt-1">
              Cruza menciones georreferenciadas con los 113 municipios de Michoacán · Verde = apoyo, Rojo = rechazo · Tamaño = volumen
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={cargarDatos} disabled={loading}>
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <RefreshCw className="w-3.5 h-3.5 mr-1.5" />}
            Actualizar
          </Button>
        </div>

        {/* KPIs rápidos */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
          <div className="rounded-md border border-border/50 px-3 py-2">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Municipios mapeados</div>
            <div className="text-lg font-bold">{stats.length}</div>
          </div>
          <div className="rounded-md border border-border/50 px-3 py-2">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Menciones georref.</div>
            <div className="text-lg font-bold">{totales.total}</div>
          </div>
          <div className="rounded-md border border-border/50 px-3 py-2">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-green-500" /> Positivas
            </div>
            <div className="text-lg font-bold text-green-500">{totales.pos}</div>
          </div>
          <div className="rounded-md border border-border/50 px-3 py-2">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide flex items-center gap-1">
              <TrendingDown className="w-3 h-3 text-red-500" /> Negativas
            </div>
            <div className="text-lg font-bold text-red-500">{totales.neg}</div>
          </div>
        </div>
      </div>

      {/* Mapa + leyenda */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 glass-panel p-3">
          {error && (
            <div className="text-xs text-destructive mb-2 px-2">Error: {error}</div>
          )}
          <div ref={mapRef} className="w-full rounded-lg overflow-hidden border border-border/50" style={{ height: 500 }} />
          {!loading && stats.length === 0 && (
            <div className="text-center py-8 text-xs text-muted-foreground">
              No hay menciones georreferenciadas todavía. Ejecuta el monitor de listening para generar datos con municipio detectado.
            </div>
          )}
          {/* Leyenda */}
          <div className="flex items-center justify-center gap-4 mt-3 flex-wrap text-[10px] text-muted-foreground font-mono">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full" style={{ background: "hsl(140, 65%, 50%)" }} /> Apoyo (+0.4)</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full" style={{ background: "hsl(95, 60%, 55%)" }} /> Favorable</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full" style={{ background: "hsl(48, 90%, 60%)" }} /> Neutro</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full" style={{ background: "hsl(20, 85%, 55%)" }} /> Tensión</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full" style={{ background: "hsl(0, 75%, 55%)" }} /> Rechazo (-0.4)</span>
          </div>
        </div>

        {/* Rankings */}
        <div className="space-y-3">
          <div className="glass-panel p-3">
            <h3 className="text-xs font-semibold flex items-center gap-1.5 mb-2">
              <TrendingDown className="w-3.5 h-3.5 text-red-500" />
              Donde arde
            </h3>
            {topCalientes.length === 0 && (
              <p className="text-[10px] text-muted-foreground">Sin municipios con sentimiento negativo.</p>
            )}
            <div className="space-y-1.5">
              {topCalientes.map((s) => (
                <div key={s.municipio} className="flex items-center justify-between text-[11px] border-b border-border/30 pb-1.5 last:border-0">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{s.municipio}</div>
                    <div className="text-[9px] text-muted-foreground">{s.total} menciones</div>
                  </div>
                  <Badge variant="destructive" className="text-[10px] h-5 ml-2">{s.sentPromedio.toFixed(2)}</Badge>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel p-3">
            <h3 className="text-xs font-semibold flex items-center gap-1.5 mb-2">
              <TrendingUp className="w-3.5 h-3.5 text-green-500" />
              Donde apoyan
            </h3>
            {topApoyos.length === 0 && (
              <p className="text-[10px] text-muted-foreground">Sin municipios con sentimiento positivo claro.</p>
            )}
            <div className="space-y-1.5">
              {topApoyos.map((s) => (
                <div key={s.municipio} className="flex items-center justify-between text-[11px] border-b border-border/30 pb-1.5 last:border-0">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{s.municipio}</div>
                    <div className="text-[9px] text-muted-foreground">{s.total} menciones</div>
                  </div>
                  <Badge className="text-[10px] h-5 ml-2 bg-green-600 hover:bg-green-600">+{s.sentPromedio.toFixed(2)}</Badge>
                </div>
              ))}
            </div>
          </div>

          {batchId && (
            <p className="text-[9px] text-muted-foreground font-mono px-1">
              <Minus className="w-2 h-2 inline" /> Batch: {batchId.slice(0, 8)}...
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

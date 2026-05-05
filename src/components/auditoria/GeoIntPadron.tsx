import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Map as MapIcon, Database } from "lucide-react";
import { loadPadronOficial, loadPadronSecciones, type PadronSeccion } from "@/lib/padron-loader";

interface SeccionGeo extends PadronSeccion {
  lat?: number;
  lng?: number;
}

// Centroides aproximados por distrito federal Michoacán (cabeceras)
const DISTRITO_CENTRO: Record<number, [number, number]> = {
  1: [19.93, -102.05], 2: [19.95, -101.27], 3: [19.70, -101.20], 4: [19.71, -101.18],
  5: [19.99, -100.71], 6: [20.00, -101.60], 7: [19.43, -102.06], 8: [19.07, -102.36],
  9: [18.97, -101.89], 10: [19.41, -101.94], 11: [18.36, -102.30],
};

type FiltroJuventud = "todos" | "joven" | "adulto" | "mayor";
type FiltroGenero = "balance" | "mayoria_mujeres" | "mayoria_hombres";

export default function GeoIntPadron() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const [secciones, setSecciones] = useState<SeccionGeo[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalEstado, setTotalEstado] = useState(0);
  const [juventud, setJuventud] = useState<FiltroJuventud>("todos");
  const [genero, setGenero] = useState<FiltroGenero>("balance");

  useEffect(() => {
    (async () => {
      const [padron, secs] = await Promise.all([loadPadronOficial(), loadPadronSecciones()]);
      setTotalEstado(padron.estado.lista_total);
      // jitter pequeño por sección para distribuirlas dentro del distrito
      const seeded = secs.map((s, i) => {
        const c = DISTRITO_CENTRO[s.dis] ?? [19.5, -101.7];
        const r1 = ((Math.sin(i * 12.9898) * 43758.5453) % 1 + 1) % 1;
        const r2 = ((Math.sin(i * 78.233) * 43758.5453) % 1 + 1) % 1;
        return { ...s, lat: c[0] + (r1 - 0.5) * 0.4, lng: c[1] + (r2 - 0.5) * 0.5 };
      });
      setSecciones(seeded);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [19.4, -101.7],
      zoom: 7,
      zoomControl: true,
      attributionControl: true,
      scrollWheelZoom: true,
    });

    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution: "&copy; OpenStreetMap &copy; CARTO",
      subdomains: "abcd",
      maxZoom: 18,
    }).addTo(map);

    mapInstanceRef.current = map;
    layerRef.current = L.layerGroup().addTo(map);
    setTimeout(() => map.invalidateSize(), 100);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      layerRef.current = null;
    };
  }, []);

  const filtradas = useMemo(() => {
    return secciones.filter((s) => {
      const total = s.lt || 1;
      const pctMuj = s.lm / total;
      // Aproximación: alta concentración juvenil = secciones con padrón total alto y mucha mujer/hombre joven
      // En ausencia de buckets edad por sección, usamos la densidad de lt como proxy de zonas urbanas (más jóvenes)
      const densidad = total;
      if (juventud === "joven" && densidad < 2200) return false;
      if (juventud === "adulto" && (densidad < 1400 || densidad >= 2200)) return false;
      if (juventud === "mayor" && densidad >= 1400) return false;

      if (genero === "mayoria_mujeres" && pctMuj < 0.53) return false;
      if (genero === "mayoria_hombres" && pctMuj > 0.48) return false;
      return true;
    });
  }, [secciones, juventud, genero]);

  const sumLN = filtradas.reduce((a, s) => a + s.lt, 0);
  const cobertura = totalEstado ? (sumLN / totalEstado) * 100 : 0;

  useEffect(() => {
    if (!layerRef.current || loading) return;

    layerRef.current.clearLayers();
    filtradas.forEach((s) => {
      if (s.lat == null || s.lng == null) return;

      L.circleMarker([s.lat, s.lng], {
        radius: Math.max(3, Math.min(9, s.lt / 500)),
        color: "#34d399",
        fillColor: "#10b981",
        fillOpacity: 0.6,
        weight: 1,
      })
        .bindTooltip(
          `<div class="text-xs"><div><b>Sección ${s.sec}</b> · D${s.dis}</div><div>LN: ${s.lt.toLocaleString("es-MX")}</div><div>♀ ${s.lm} / ♂ ${s.lh}</div></div>`,
          { direction: "top", sticky: true }
        )
        .addTo(layerRef.current!);
    });
  }, [filtradas, loading]);

  const query = `SELECT sec, dis, mun, lh AS hombres, lm AS mujeres, lt AS lista_nominal
FROM padron_secciones_2026
WHERE 1=1
${juventud !== "todos" ? `  AND densidad_seccion ${juventud === "joven" ? ">= 2200" : juventud === "adulto" ? "BETWEEN 1400 AND 2199" : "< 1400"}` : ""}
${genero !== "balance" ? `  AND (lm/lt) ${genero === "mayoria_mujeres" ? ">= 0.53" : "<= 0.48"}` : ""}
-- ${secciones.length} secciones, ${totalEstado.toLocaleString("es-MX")} electores estatal`;

  return (
    <Card className="bg-card/50 backdrop-blur border-border/50 p-4 space-y-3">
      <div>
        <h2 className="text-base font-bold flex items-center gap-2">
          <MapIcon className="w-4 h-4 text-emerald-400" />
          03 · Consola GEOINT · Padrón en vivo
        </h2>
        <p className="text-[11px] text-muted-foreground font-mono mt-1">
          fuente → <span className="text-primary">/data/padron-secciones-2026.json</span> ·{" "}
          {secciones.length.toLocaleString("es-MX")} secciones · {totalEstado.toLocaleString("es-MX")} electores
        </p>
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-3">
        <div className="relative rounded-lg overflow-hidden border border-border/40 h-[400px] min-h-[400px] w-full">
          <div ref={mapContainerRef} className="absolute inset-0 bg-background" style={{ minHeight: 400 }} />
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground bg-background/80 z-[500]">
              Cargando padrón oficial…
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">
              Filtros dinámicos
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap gap-1">
                {(["todos", "joven", "adulto", "mayor"] as FiltroJuventud[]).map((f) => (
                  <Button key={f} size="sm" variant={juventud === f ? "default" : "outline"}
                          className="h-6 text-[10px]" onClick={() => setJuventud(f)}>
                    {f}
                  </Button>
                ))}
              </div>
              <div className="flex flex-wrap gap-1">
                {(["balance", "mayoria_mujeres", "mayoria_hombres"] as FiltroGenero[]).map((f) => (
                  <Button key={f} size="sm" variant={genero === f ? "default" : "outline"}
                          className="h-6 text-[10px]" onClick={() => setGenero(f)}>
                    {f.replace("_", " ")}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded border border-border/40 bg-background/60 p-2 space-y-1">
            <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground flex items-center gap-1">
              <Database className="w-3 h-3" /> Query en vivo
            </div>
            <pre className="text-[10px] font-mono text-emerald-300 whitespace-pre-wrap">{query}</pre>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="rounded border border-border/40 p-2">
              <div className="text-muted-foreground text-[9px] uppercase">Secciones filtradas</div>
              <div className="font-mono text-base">{filtradas.length.toLocaleString("es-MX")}</div>
            </div>
            <div className="rounded border border-border/40 p-2">
              <div className="text-muted-foreground text-[9px] uppercase">LN agregada</div>
              <div className="font-mono text-base">{sumLN.toLocaleString("es-MX")}</div>
              <Badge variant="outline" className="text-[9px] mt-1">{cobertura.toFixed(1)}% estatal</Badge>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

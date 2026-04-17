import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { PARTIDOS_CONFIG, getCompetitividadDistrito, type Partido } from "@/data/electoral-data";
import { DISTRITO_LOCAL_CENTROIDS } from "@/data/distritos-locales";
import { useElectoralData } from "@/context/DataContext";

const MICHOACAN_CENTER: [number, number] = [19.25, -101.9];
const MICHOACAN_ZOOM = 7;

const DISTRITOS_GEOJSON_URL = "https://mexicoendatos.com/inegi/geometrias/distritos-federales/16?scale=100";

const DISTRITO_FED_CENTROIDS: Record<number, [number, number]> = {
  1: [18.0, -102.2],
  2: [20.1, -101.5],
  3: [19.4, -100.3],
  4: [20.0, -102.5],
  5: [19.98, -102.28],
  6: [19.7, -100.55],
  7: [19.75, -101.15],
  8: [19.65, -101.25],
  9: [19.42, -102.05],
  10: [19.52, -101.6],
  11: [19.08, -102.35],
};

interface MapaInteractivoProps {
  eleccion: string;
}

export function MapaInteractivo({ eleccion }: MapaInteractivoProps) {
  const { distritosActivos, nivel } = useElectoralData();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const [geoData, setGeoData] = useState<GeoJSON.FeatureCollection | null>(null);
  const [loading, setLoading] = useState(true);
  const [useFallback, setUseFallback] = useState(false);

  const centroids = nivel === "federal" ? DISTRITO_FED_CENTROIDS : DISTRITO_LOCAL_CENTROIDS;
  const prefix = nivel === "local" ? "L" : "D";
  const totalLabel = nivel === "federal" ? "11 distritos federales" : "24 distritos locales";

  useEffect(() => {
    if (nivel === "local") {
      setUseFallback(true);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    fetch(DISTRITOS_GEOJSON_URL, { signal: controller.signal })
      .then((res) => { if (!res.ok) throw new Error("API error"); return res.json(); })
      .then((data) => { setGeoData(data); setUseFallback(false); setLoading(false); })
      .catch(() => { setUseFallback(true); setLoading(false); });
    return () => controller.abort();
  }, [nivel]);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;
    const map = L.map(mapRef.current, {
      center: MICHOACAN_CENTER, zoom: MICHOACAN_ZOOM, zoomControl: true, attributionControl: true, scrollWheelZoom: true,
    });
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://carto.com/">CARTO</a> · INE/IEM', subdomains: "abcd", maxZoom: 18,
    }).addTo(map);
    mapInstanceRef.current = map;
    layerRef.current = L.layerGroup().addTo(map);
    return () => { map.remove(); mapInstanceRef.current = null; };
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current || !layerRef.current || loading) return;
    layerRef.current.clearLayers();

    if (geoData && !useFallback && nivel === "federal") {
      const geoLayer = L.geoJSON(geoData, {
        style: (feature) => {
          const distNum = parseInt(feature?.properties?.distrito || feature?.properties?.DISTRITO || feature?.properties?.district || "0");
          const distrito = distritosActivos.find((d) => d.id === distNum);
          const resultado = distrito?.resultados[eleccion];
          const ganador = resultado?.ganador as Partido | undefined;
          const color = ganador ? PARTIDOS_CONFIG[ganador]?.color : "#444";
          return { fillColor: color, fillOpacity: 0.5, color: "hsl(210, 20%, 92%)", weight: 1.5, opacity: 0.7 };
        },
        onEachFeature: (feature, layer) => {
          const distNum = parseInt(feature?.properties?.distrito || feature?.properties?.DISTRITO || feature?.properties?.district || "0");
          const distrito = distritosActivos.find((d) => d.id === distNum);
          if (!distrito) return;
          const r = distrito.resultados[eleccion];
          if (!r) return;
          const comp = getCompetitividadDistrito(distrito, eleccion);
          const { lealtad, riesgo } = computeLealtadRiesgo(comp, r);
          layer.bindPopup(popupHtml(distrito, r, comp, prefix, lealtad, riesgo), { className: "electoral-popup" });
          layer.bindTooltip(
            `<b>${prefix}${distrito.id} · ${distrito.cabecera}</b><br/>Lealtad: <b>${lealtad}%</b> · Riesgo: <b>${riesgo}</b>`,
            { sticky: true, className: "electoral-tooltip", direction: "top" }
          );
          layer.on("mouseover", function () { (this as L.Path).setStyle({ fillOpacity: 0.85, weight: 3 }); });
          layer.on("mouseout", function () { geoLayer.resetStyle(this as L.Path); });
        },
      });
      geoLayer.addTo(layerRef.current!);
    } else {
      distritosActivos.forEach((d) => {
        const coords = centroids[d.id];
        if (!coords) return;
        const r = d.resultados[eleccion];
        if (!r) return;
        const comp = getCompetitividadDistrito(d, eleccion);
          const color = PARTIDOS_CONFIG[r.ganador as Partido]?.color || "#444";
        const { lealtad, riesgo, riesgoColor } = computeLealtadRiesgo(comp, r);
        const circle = L.circleMarker(coords, {
          radius: Math.max(10, Math.sqrt(d.listaNominal2024 / 5000)),
          fillColor: color, fillOpacity: 0.7, color: riesgoColor, weight: 2.5,
        });
        circle.bindPopup(popupHtml(d, r, comp, prefix, lealtad, riesgo), { className: "electoral-popup" });
        circle.bindTooltip(
          `<b>${prefix}${d.id} · ${d.cabecera}</b><br/>Lealtad: <b>${lealtad}%</b> · Riesgo: <b>${riesgo}</b>`,
          { permanent: false, direction: "top", className: "electoral-tooltip", sticky: true }
        );
        circle.on("mouseover", function () { this.setStyle({ fillOpacity: 1, weight: 4 }); });
        circle.on("mouseout", function () { this.setStyle({ fillOpacity: 0.7, weight: 2.5 }); });
        circle.addTo(layerRef.current!);
      });
    }
  }, [eleccion, geoData, loading, useFallback, distritosActivos, nivel, centroids, prefix]);

  return (
    <div className="glass-panel p-4 animate-slide-up">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-xs font-semibold text-foreground">Mapa Electoral Interactivo</h3>
          <p className="text-[10px] text-muted-foreground font-mono">
            Michoacán · {totalLabel} · Cartografía {nivel === "federal" ? "INE" : "IEM"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {loading && <span className="text-[10px] text-primary animate-pulse-glow font-mono">Cargando cartografía...</span>}
          {!loading && useFallback && <span className="text-[10px] text-gold font-mono">● Vista de centroides</span>}
          {!loading && !useFallback && <span className="text-[10px] text-primary font-mono">● GeoJSON INE</span>}
        </div>
      </div>
      <div ref={mapRef} className="w-full rounded-lg overflow-hidden border border-border/50" style={{ height: 420 }} />
      <div className="flex flex-wrap gap-3 mt-3">
        {(["MORENA", "PAN", "PRI", "MC", "PVEM"] as Partido[]).map((p) => (
          <span key={p} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <span className="w-3 h-3 rounded" style={{ backgroundColor: PARTIDOS_CONFIG[p].color }} />
            {p}
          </span>
        ))}
      </div>
    </div>
  );
}

function computeLealtadRiesgo(comp: { margen: number }, r: { ganador: string; votos: Record<string, number>; totalVotos: number }) {
  const ganadorVotos = r.votos[r.ganador] || 0;
  const lealtad = Math.round((ganadorVotos / Math.max(1, r.totalVotos)) * 100);
  let riesgo: "Alto" | "Medio" | "Bajo" = "Bajo";
  if (comp.margen < 5) riesgo = "Alto";
  else if (comp.margen < 12) riesgo = "Medio";
  const riesgoColor = riesgo === "Alto" ? "hsl(0, 75%, 55%)" : riesgo === "Medio" ? "hsl(40, 80%, 55%)" : "hsl(140, 60%, 50%)";
  return { lealtad, riesgo, riesgoColor };
}

function popupHtml(d: { id: number; cabecera: string; listaNominal2024: number }, r: any, comp: any, prefix: string, lealtad: number, riesgo: string) {
  const riesgoColor = riesgo === "Alto" ? "hsl(0, 75%, 60%)" : riesgo === "Medio" ? "hsl(40, 80%, 60%)" : "hsl(140, 60%, 55%)";
  return `<div style="font-family:Inter,sans-serif;font-size:12px;min-width:200px;">
    <div style="font-weight:700;font-size:14px;margin-bottom:6px;color:#f4f4f4;">${prefix}${d.id} · ${d.cabecera}</div>
    <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;flex-wrap:wrap;">
      <span style="background:${PARTIDOS_CONFIG[r.ganador as Partido]?.color};color:white;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:700;">${r.ganador}</span>
      <span style="color:#aaa;font-size:11px;">${comp.nivel}</span>
      <span style="background:${riesgoColor};color:#0a0a0a;padding:2px 8px;border-radius:4px;font-size:10px;font-weight:700;">RIESGO ${riesgo.toUpperCase()}</span>
    </div>
    <div style="color:#bbb;font-size:11px;line-height:1.5;">
      Lealtad ganador: <b style="color:#c5a059;">${lealtad}%</b><br/>
      Participación: <b style="color:#eee;">${r.participacion}%</b><br/>
      Margen: <b style="color:#eee;">${comp.margen.toFixed(1)}%</b><br/>
      Lista Nominal: <b style="color:#eee;">${d.listaNominal2024.toLocaleString()}</b>
    </div>
  </div>`;
}

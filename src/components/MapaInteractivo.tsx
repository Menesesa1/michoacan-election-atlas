import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { PARTIDOS_CONFIG, getCompetitividadDistrito, type Partido } from "@/data/electoral-data";
import { useElectoralData } from "@/context/DataContext";

const MICHOACAN_CENTER: [number, number] = [19.25, -101.9];
const MICHOACAN_ZOOM = 7;

// API endpoint for Michoacán federal districts GeoJSON
const DISTRITOS_GEOJSON_URL = "https://mexicoendatos.com/inegi/geometrias/distritos-federales/16?scale=100";

// Fallback: approximate bounds for each district (centroids)
const DISTRITO_CENTROIDS: Record<number, [number, number]> = {
  1: [18.0, -102.2],   // Lázaro Cárdenas
  2: [20.1, -101.5],   // Puruándiro
  3: [19.4, -100.3],   // Zitácuaro
  4: [20.0, -102.5],   // Jiquilpan
  5: [19.98, -102.28], // Zamora
  6: [19.7, -100.55],  // Ciudad Hidalgo
  7: [19.75, -101.15], // Morelia NE
  8: [19.65, -101.25], // Morelia SO
  9: [19.42, -102.05], // Uruapan
  10: [19.52, -101.6], // Pátzcuaro
  11: [19.08, -102.35], // Apatzingán
};

interface MapaInteractivoProps {
  eleccion: string;
}

export function MapaInteractivo({ eleccion }: MapaInteractivoProps) {
  const { distritos } = useElectoralData();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const [geoData, setGeoData] = useState<GeoJSON.FeatureCollection | null>(null);
  const [loading, setLoading] = useState(true);
  const [useFallback, setUseFallback] = useState(false);

  // Fetch GeoJSON
  useEffect(() => {
    const controller = new AbortController();
    
    fetch(DISTRITOS_GEOJSON_URL, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error("API error");
        return res.json();
      })
      .then((data) => {
        setGeoData(data);
        setLoading(false);
      })
      .catch(() => {
        setUseFallback(true);
        setLoading(false);
      });

    return () => controller.abort();
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center: MICHOACAN_CENTER,
      zoom: MICHOACAN_ZOOM,
      zoomControl: true,
      attributionControl: true,
      scrollWheelZoom: true,
    });

    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://carto.com/">CARTO</a> · INE',
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

  // Render districts on map
  useEffect(() => {
    if (!mapInstanceRef.current || !layerRef.current || loading) return;
    layerRef.current.clearLayers();

    if (geoData && !useFallback) {
      // Real GeoJSON data
      const geoLayer = L.geoJSON(geoData, {
        style: (feature) => {
          const distNum = parseInt(feature?.properties?.distrito || feature?.properties?.DISTRITO || feature?.properties?.district || "0");
          const distrito = distritos.find((d) => d.id === distNum);
          const resultado = distrito?.resultados[eleccion];
          const ganador = resultado?.ganador as Partido | undefined;
          const color = ganador ? PARTIDOS_CONFIG[ganador]?.color : "#444";

          return {
            fillColor: color,
            fillOpacity: 0.5,
            color: "hsl(210, 20%, 92%)",
            weight: 1.5,
            opacity: 0.7,
          };
        },
        onEachFeature: (feature, layer) => {
          const distNum = parseInt(feature?.properties?.distrito || feature?.properties?.DISTRITO || feature?.properties?.district || "0");
          const distrito = distritos.find((d) => d.id === distNum);
          if (!distrito) return;

          const r = distrito.resultados[eleccion];
          if (!r) return;
          const comp = getCompetitividadDistrito(distrito, eleccion);

          layer.bindPopup(
            `<div style="font-family:Inter,sans-serif;font-size:12px;min-width:180px;">
              <div style="font-weight:700;font-size:14px;margin-bottom:4px;">D${distrito.id} · ${distrito.cabecera}</div>
              <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">
                <span style="background:${PARTIDOS_CONFIG[r.ganador as Partido]?.color};color:white;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:700;">${r.ganador}</span>
                <span style="color:#888;font-size:11px;">${comp.nivel}</span>
              </div>
              <div style="color:#aaa;font-size:11px;">
                Participación: <b style="color:#eee;">${r.participacion}%</b><br/>
                Margen: <b style="color:#eee;">${comp.margen.toFixed(1)}%</b><br/>
                Lista Nominal: <b style="color:#eee;">${distrito.listaNominal2024.toLocaleString()}</b>
              </div>
            </div>`,
            { className: "electoral-popup" }
          );

          layer.on("mouseover", function () {
            (this as L.Path).setStyle({ fillOpacity: 0.8, weight: 3 });
          });
          layer.on("mouseout", function () {
            geoLayer.resetStyle(this as L.Path);
          });
        },
      });

      geoLayer.addTo(layerRef.current!);
    } else {
      // Fallback: circle markers at centroids
      distritosFederales.forEach((d) => {
        const coords = DISTRITO_CENTROIDS[d.id];
        if (!coords) return;

        const r = d.resultados[eleccion];
        if (!r) return;
        const comp = getCompetitividadDistrito(d, eleccion);
        const color = PARTIDOS_CONFIG[r.ganador as Partido]?.color || "#444";

        const circle = L.circleMarker(coords, {
          radius: Math.max(12, Math.sqrt(d.listaNominal2024 / 5000)),
          fillColor: color,
          fillOpacity: 0.7,
          color: "#e0e0e0",
          weight: 2,
        });

        circle.bindPopup(
          `<div style="font-family:Inter,sans-serif;font-size:12px;min-width:180px;">
            <div style="font-weight:700;font-size:14px;margin-bottom:4px;">D${d.id} · ${d.cabecera}</div>
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">
              <span style="background:${color};color:white;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:700;">${r.ganador}</span>
              <span style="color:#888;font-size:11px;">${comp.nivel}</span>
            </div>
            <div style="color:#aaa;font-size:11px;">
              Participación: <b style="color:#eee;">${r.participacion}%</b><br/>
              Margen: <b style="color:#eee;">${comp.margen.toFixed(1)}%</b><br/>
              Lista Nominal: <b style="color:#eee;">${d.listaNominal2024.toLocaleString()}</b>
            </div>
          </div>`,
          { className: "electoral-popup" }
        );

        circle.bindTooltip(`D${d.id} · ${d.cabecera}`, {
          permanent: false,
          direction: "top",
          className: "electoral-tooltip",
        });

        circle.on("mouseover", function () {
          this.setStyle({ fillOpacity: 1, weight: 3 });
        });
        circle.on("mouseout", function () {
          this.setStyle({ fillOpacity: 0.7, weight: 2 });
        });

        circle.addTo(layerRef.current!);
      });
    }
  }, [eleccion, geoData, loading, useFallback]);

  return (
    <div className="glass-panel p-4 animate-slide-up">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-xs font-semibold text-foreground">Mapa Electoral Interactivo</h3>
          <p className="text-[10px] text-muted-foreground font-mono">
            Michoacán · 11 distritos federales · Cartografía INE
          </p>
        </div>
        <div className="flex items-center gap-2">
          {loading && (
            <span className="text-[10px] text-primary animate-pulse-glow font-mono">Cargando cartografía...</span>
          )}
          {!loading && useFallback && (
            <span className="text-[10px] text-gold font-mono">● Vista de centroides</span>
          )}
          {!loading && !useFallback && (
            <span className="text-[10px] text-primary font-mono">● GeoJSON INE</span>
          )}
        </div>
      </div>

      <div
        ref={mapRef}
        className="w-full rounded-lg overflow-hidden border border-border/50"
        style={{ height: 420 }}
      />

      {/* Legend */}
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

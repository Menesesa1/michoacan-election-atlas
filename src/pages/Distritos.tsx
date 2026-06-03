import { useEffect, useMemo, useState } from "react";
import { KPICards } from "@/components/KPICards";
import { MapaInteractivo } from "@/components/MapaInteractivo";
import { MapaDistritos } from "@/components/MapaDistritos";
import { TablaDistritos } from "@/components/TablaDistritos";
import { EleccionSelector } from "@/components/EleccionSelector";
import { NivelSelector } from "@/components/NivelSelector";
import { SeccionValidator } from "@/components/SeccionValidator";
import { ComposicionTerritorial } from "@/components/ComposicionTerritorial";
import { Card } from "@/components/ui/card";
import {
  loadCatalogo, seccionesPorDistritoFederal, getDistritosLocales, infoDistritoLocal,
  type DistritoLocal,
} from "@/lib/secciones-catalogo";

export default function Distritos() {
  const [eleccion, setEleccion] = useState("fed2024");
  const [ready, setReady] = useState(false);
  const [tipo, setTipo] = useState<"federal" | "local">("federal");
  const [seleccion, setSeleccion] = useState<number>(1);
  const [dlocales, setDlocales] = useState<DistritoLocal[]>([]);

  useEffect(() => {
    loadCatalogo().then(() => {
      setDlocales(getDistritosLocales());
      setReady(true);
    }).catch(() => setReady(true));
  }, []);

  const opciones = tipo === "federal"
    ? Array.from({ length: 11 }, (_, i) => i + 1)
    : dlocales.map((d) => d.distrito);

  const { secciones, titulo, subtitulo } = useMemo(() => {
    if (!ready) return { secciones: [] as number[], titulo: "", subtitulo: "" };
    if (tipo === "federal") {
      const secs = seccionesPorDistritoFederal(seleccion).map((s) => s.sec);
      return {
        secciones: secs,
        titulo: `Distrito Federal ${String(seleccion).padStart(2, "0")}`,
        subtitulo: `INE · Distritación federal vigente`,
      };
    }
    const info = infoDistritoLocal(seleccion);
    return {
      secciones: info?.secciones ?? [],
      titulo: `Distrito Local ${String(seleccion).padStart(2, "0")} · ${info?.cabecera ?? ""}`,
      subtitulo: `IEM · Municipios: ${info?.municipios.join(", ") ?? "—"}`,
    };
  }, [ready, tipo, seleccion]);

  return (
    <div className="space-y-5">
      <div>
        <div className="text-primary text-[10px] font-mono uppercase tracking-widest">Cartografía electoral</div>
        <h1 className="text-2xl font-bold text-foreground">Distritos · Lealtad y Riesgo</h1>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <NivelSelector />
        <EleccionSelector value={eleccion} onChange={setEleccion} />
      </div>

      <KPICards eleccion={eleccion} />
      <MapaInteractivo eleccion={eleccion} />
      <MapaDistritos eleccion={eleccion} />
      <TablaDistritos eleccion={eleccion} />
      <SeccionValidator />

      <Card className="p-4 space-y-3">
        <div>
          <div className="text-primary text-[10px] font-mono uppercase tracking-widest">
            Composición territorial por bloque
          </div>
          <h2 className="text-base font-semibold text-foreground">Explorar un distrito</h2>
          <p className="text-xs text-muted-foreground">
            Selecciona un distrito federal o local para ver sus secciones, su Lista Nominal
            oficial y la lista descriptiva de localidades y colonias que las componen.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex rounded border border-border p-0.5">
            <button
              onClick={() => { setTipo("federal"); setSeleccion(1); }}
              className={`px-3 py-1 text-xs rounded ${tipo === "federal" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
            >Federal</button>
            <button
              onClick={() => { setTipo("local"); setSeleccion(dlocales[0]?.distrito ?? 1); }}
              className={`px-3 py-1 text-xs rounded ${tipo === "local" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
            >Local</button>
          </div>
          <select
            value={seleccion}
            onChange={(e) => setSeleccion(Number(e.target.value))}
            className="bg-card border border-border rounded px-2 py-1 text-xs"
          >
            {opciones.map((n) => (
              <option key={n} value={n}>
                {tipo === "federal"
                  ? `Distrito Federal ${String(n).padStart(2, "0")}`
                  : `D${String(n).padStart(2, "0")} · ${infoDistritoLocal(n)?.cabecera ?? ""}`}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {ready && (
        <ComposicionTerritorial
          secciones={secciones}
          titulo={titulo}
          subtitulo={subtitulo}
        />
      )}
    </div>
  );
}

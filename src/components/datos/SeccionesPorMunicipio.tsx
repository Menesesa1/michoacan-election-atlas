import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Building2, MapPin, Sprout, Search } from "lucide-react";
import {
  loadMunicipiosSecciones,
  type MunicipioSecciones,
} from "@/lib/municipios-secciones-tipo";

const norm = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

export default function SeccionesPorMunicipio() {
  const [data, setData] = useState<MunicipioSecciones[]>([]);
  const [q, setQ] = useState("Quiroga");

  useEffect(() => {
    loadMunicipiosSecciones().then(setData).catch(() => setData([]));
  }, []);

  const filtrados = useMemo(() => {
    const nq = norm(q);
    if (!nq) return data.slice(0, 12);
    return data.filter((m) => norm(m.nombre).includes(nq)).slice(0, 12);
  }, [data, q]);

  return (
    <Card className="p-4 space-y-3 bg-card/50 backdrop-blur border-border/50">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h3 className="text-base font-bold flex items-center gap-2">
            <Building2 className="w-4 h-4 text-primary" />
            Secciones por municipio · desglose oficial INE
          </h3>
          <p className="text-[11px] text-muted-foreground font-mono">
            113 municipios · 2,825 secciones · tipo 2/3/4 = Urbana/Mixta/Rural
          </p>
        </div>
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar municipio…"
            className="pl-7 h-8 w-56 text-xs"
          />
        </div>
      </div>

      <div className="grid gap-2 md:grid-cols-2">
        {filtrados.map((m) => (
          <div
            key={m.inegi}
            className="rounded-lg border border-border/40 bg-background/50 p-3 space-y-2"
          >
            <div className="flex items-baseline justify-between">
              <h4 className="font-bold text-sm">{m.nombre}</h4>
              <span className="text-[10px] font-mono text-muted-foreground">
                INEGI {String(m.inegi).padStart(3, "0")} · {m.total} secciones
              </span>
            </div>

            <BloqueTipo
              icon={<Building2 className="w-3 h-3" />}
              label="Urbanas"
              color="text-emerald-400"
              secs={m.urbanas}
            />
            <BloqueTipo
              icon={<MapPin className="w-3 h-3" />}
              label="Mixtas"
              color="text-amber-400"
              secs={m.mixtas}
            />
            <BloqueTipo
              icon={<Sprout className="w-3 h-3" />}
              label="Rurales"
              color="text-orange-400"
              secs={m.rurales}
            />
          </div>
        ))}
        {filtrados.length === 0 && (
          <p className="text-xs text-muted-foreground col-span-full">
            Sin coincidencias.
          </p>
        )}
      </div>
    </Card>
  );
}

function BloqueTipo({
  icon,
  label,
  color,
  secs,
}: {
  icon: React.ReactNode;
  label: string;
  color: string;
  secs: number[];
}) {
  return (
    <div>
      <div className={`flex items-center gap-1.5 text-[11px] font-semibold ${color}`}>
        {icon}
        <span>
          {label}: {secs.length}
        </span>
      </div>
      {secs.length > 0 ? (
        <p className="text-[11px] font-mono text-foreground/90 leading-relaxed mt-0.5">
          {secs.join(", ")}
        </p>
      ) : (
        <Badge variant="outline" className="text-[9px] mt-0.5">
          sin secciones de este tipo
        </Badge>
      )}
    </div>
  );
}

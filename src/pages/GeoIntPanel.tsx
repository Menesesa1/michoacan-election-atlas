import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Building2 } from "lucide-react";

interface MencionGeo {
  id: string;
  entidad_nombre: string;
  titulo: string;
  url: string | null;
  municipio: string | null;
  seccion_inferida: number | null;
  colonia_inferida: string | null;
  sentimiento: number;
  detectada_en: string;
}

export default function GeoIntPanel() {
  const [data, setData] = useState<MencionGeo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: rows } = await supabase
        .from("social_menciones")
        .select("id, entidad_nombre, titulo, url, municipio, seccion_inferida, colonia_inferida, sentimiento, detectada_en")
        .or("seccion_inferida.not.is.null,colonia_inferida.not.is.null")
        .order("detectada_en", { ascending: false })
        .limit(200);
      setData((rows ?? []) as MencionGeo[]);
      setLoading(false);
    })();
  }, []);

  const porSeccion = useMemo(() => {
    const map = new Map<string, MencionGeo[]>();
    data.forEach((m) => {
      const key = m.seccion_inferida ? `Sección ${m.seccion_inferida}` : `Colonia ${m.colonia_inferida}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(m);
    });
    return [...map.entries()].sort((a, b) => b[1].length - a[1].length);
  }, [data]);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold flex items-center gap-2">
          <MapPin className="w-5 h-5 text-primary" />
          GEOINT · Conversación por Sección y Colonia
        </h2>
        <p className="text-xs text-muted-foreground">
          Menciones geo-localizadas a nivel sección INE o colonia/tenencia (cuando el texto lo cita explícitamente).
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Cargando…</p>
      ) : porSeccion.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          Aún no hay menciones con sección o colonia inferida. Esto requiere que las notas mencionen explícitamente la ubicación.
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {porSeccion.map(([clave, items]) => (
            <Card key={clave} className="p-4 bg-card/50 backdrop-blur border-border/50 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <Building2 className="w-3.5 h-3.5 text-primary" />
                  {clave}
                </h3>
                <Badge variant="outline">{items.length} menciones</Badge>
              </div>
              <div className="space-y-1.5 text-xs">
                {items.slice(0, 5).map((m) => (
                  <a
                    key={m.id}
                    href={m.url ?? "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="block text-muted-foreground hover:text-foreground line-clamp-2"
                  >
                    <span className={m.sentimiento < 0 ? "text-red-400" : m.sentimiento > 0 ? "text-emerald-400" : ""}>●</span>{" "}
                    {m.titulo}
                  </a>
                ))}
              </div>
              {items[0].municipio && (
                <p className="text-[10px] text-muted-foreground">Municipio: {items[0].municipio}</p>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

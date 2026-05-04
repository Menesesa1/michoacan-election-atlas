import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Brain } from "lucide-react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from "recharts";

interface Mencion {
  id: string;
  entidad_nombre: string;
  emociones: Record<string, number> | null;
  sarcasmo: boolean;
}

const EMOCIONES = ["enojo", "miedo", "esperanza", "indignacion", "desconfianza", "orgullo"];

export default function PsicoIntPanel() {
  const [data, setData] = useState<Mencion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: rows } = await supabase
        .from("social_menciones")
        .select("id, entidad_nombre, emociones, sarcasmo")
        .order("detectada_en", { ascending: false })
        .limit(500);
      setData((rows ?? []) as Mencion[]);
      setLoading(false);
    })();
  }, []);

  const porEntidad = useMemo(() => {
    const map = new Map<string, { sum: Record<string, number>; n: number; sarcasmo: number }>();
    data.forEach((m) => {
      if (!m.emociones || Object.keys(m.emociones).length === 0) return;
      if (!map.has(m.entidad_nombre)) {
        map.set(m.entidad_nombre, {
          sum: Object.fromEntries(EMOCIONES.map((e) => [e, 0])),
          n: 0,
          sarcasmo: 0,
        });
      }
      const slot = map.get(m.entidad_nombre)!;
      EMOCIONES.forEach((e) => (slot.sum[e] += Number(m.emociones![e] ?? 0)));
      slot.n += 1;
      if (m.sarcasmo) slot.sarcasmo += 1;
    });
    return [...map.entries()]
      .map(([entidad, { sum, n, sarcasmo }]) => ({
        entidad,
        n,
        sarcasmo_pct: (sarcasmo / n) * 100,
        radar: EMOCIONES.map((e) => ({ emocion: e, valor: Number(((sum[e] / n) * 100).toFixed(1)) })),
        dominante: EMOCIONES.reduce((a, b) => (sum[a] > sum[b] ? a : b)),
      }))
      .filter((x) => x.n >= 3)
      .sort((a, b) => b.n - a.n)
      .slice(0, 8);
  }, [data]);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Brain className="w-5 h-5 text-purple-400" />
          PSICOINT · Termómetro Emocional
        </h2>
        <p className="text-xs text-muted-foreground">
          No es solo positivo/negativo. Aquí ves qué emoción específica domina la conversación: enojo, miedo, esperanza, indignación, desconfianza u orgullo.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Cargando…</p>
      ) : porEntidad.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          Aún no hay menciones clasificadas con emociones. Ejecuta el monitor social para empezar a poblar.
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {porEntidad.map((e) => (
            <Card key={e.entidad} className="p-4 bg-card/50 backdrop-blur border-border/50">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-sm">{e.entidad}</h3>
                <div className="text-[10px] text-muted-foreground">{e.n} menciones</div>
              </div>
              <div className="text-xs mb-2">
                Emoción dominante: <span className="text-purple-300 font-semibold capitalize">{e.dominante}</span>
                {e.sarcasmo_pct > 10 && (
                  <span className="ml-2 text-yellow-400">⚠ Sarcasmo {e.sarcasmo_pct.toFixed(0)}%</span>
                )}
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <RadarChart data={e.radar}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis dataKey="emocion" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
                  <PolarRadiusAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 9 }} angle={90} domain={[0, 100]} />
                  <Radar dataKey="valor" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.4} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", fontSize: 12 }} />
                </RadarChart>
              </ResponsiveContainer>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

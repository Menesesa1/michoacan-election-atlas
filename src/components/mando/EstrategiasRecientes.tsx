import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, ChevronRight } from "lucide-react";

interface Row {
  id: string;
  titulo: string;
  nivel: string;
  territorio: string;
  created_at: string;
}

const NIVEL_LABEL: Record<string, string> = {
  gobernador: "Gobernatura",
  diputados: "Diputado",
  ayuntamientos: "Ayuntamiento",
};

function fechaCorta(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("es-MX", { day: "2-digit", month: "short" });
}

export function EstrategiasRecientes() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      const { data } = await supabase
        .from("estrategias_guardadas")
        .select("id, titulo, nivel, territorio, created_at")
        .order("created_at", { ascending: false })
        .limit(4);
      setRows((data ?? []) as Row[]);
      setLoading(false);
    })();
  }, []);

  return (
    <Card className="p-4 bg-card/60 backdrop-blur border-border">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <h3 className="text-xs font-semibold uppercase tracking-widest">Estrategias 360 recientes</h3>
        </div>
        <Link to="/escenarios" className="text-[10px] text-muted-foreground hover:text-primary font-mono flex items-center gap-1">
          Generar <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      {loading ? (
        <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
      ) : rows.length === 0 ? (
        <p className="text-xs text-muted-foreground py-6 text-center">
          Aún no has generado estrategias.{" "}
          <Link to="/escenarios" className="text-primary hover:underline">Genera la primera</Link>.
        </p>
      ) : (
        <div className="space-y-2">
          {rows.map((r) => (
            <Link
              key={r.id}
              to="/escenarios"
              className="flex items-center justify-between gap-2 p-2 rounded-md bg-secondary/40 hover:bg-secondary/70 transition-colors"
            >
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold truncate">{r.titulo}</div>
                <div className="text-[10px] text-muted-foreground font-mono uppercase truncate mt-0.5">
                  {NIVEL_LABEL[r.nivel] ?? r.nivel} · {r.territorio}
                </div>
              </div>
              <Badge variant="outline" className="font-mono text-[10px] flex-shrink-0">
                {fechaCorta(r.created_at)}
              </Badge>
            </Link>
          ))}
        </div>
      )}
    </Card>
  );
}

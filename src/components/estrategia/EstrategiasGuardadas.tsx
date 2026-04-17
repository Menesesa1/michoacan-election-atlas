import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FolderOpen, RefreshCw, Trash2, Upload, Calendar } from "lucide-react";
import type { SnapshotPayload } from "@/lib/estrategia-context";
import type { EstrategiaOutput } from "./ResultadoTabs";

interface EstrategiaRow {
  id: string;
  titulo: string;
  nivel: string;
  territorio: string;
  created_at: string;
  snapshot_json: SnapshotPayload;
  output_json: EstrategiaOutput;
}

interface Props {
  onLoad: (snapshot: SnapshotPayload, output: EstrategiaOutput) => void;
}

export function EstrategiasGuardadas({ onLoad }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [rows, setRows] = useState<EstrategiaRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchRows = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("estrategias_guardadas")
        .select("id, titulo, nivel, territorio, created_at, snapshot_json, output_json")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      setRows((data ?? []) as unknown as EstrategiaRow[]);
    } catch (err) {
      console.error(err);
      toast({
        title: "No se pudieron cargar las estrategias",
        description: err instanceof Error ? err.message : "Reintenta en un momento",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    void fetchRows();
  }, [fetchRows]);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const { error } = await supabase.from("estrategias_guardadas").delete().eq("id", id);
      if (error) throw error;
      setRows((prev) => prev.filter((r) => r.id !== id));
      toast({ title: "Versión eliminada" });
    } catch (err) {
      console.error(err);
      toast({
        title: "No se pudo eliminar",
        description: err instanceof Error ? err.message : "Reintenta en un momento",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  if (!user) {
    return (
      <div className="glass-panel p-4 text-xs text-muted-foreground">
        Inicia sesión para ver tus estrategias guardadas.
      </div>
    );
  }

  return (
    <div className="glass-panel p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FolderOpen className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">
            Mis estrategias guardadas
          </h3>
          <span className="text-[10px] font-mono text-muted-foreground">
            ({rows.length})
          </span>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => void fetchRows()}
          disabled={loading}
          className="h-7 text-xs"
        >
          <RefreshCw className={`w-3 h-3 mr-1 ${loading ? "animate-spin" : ""}`} />
          Refrescar
        </Button>
      </div>

      {loading && rows.length === 0 ? (
        <div className="space-y-2">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      ) : rows.length === 0 ? (
        <p className="text-xs text-muted-foreground py-4 text-center">
          Aún no has guardado estrategias. Genera una y pulsa "Guardar versión".
        </p>
      ) : (
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {rows.map((row) => (
            <div
              key={row.id}
              className="flex items-center justify-between gap-2 p-2.5 rounded-md bg-secondary/30 hover:bg-secondary/50 transition-colors border border-border/40"
            >
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-foreground truncate">
                  {row.titulo}
                </p>
                <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground font-mono">
                  <Calendar className="w-2.5 h-2.5" />
                  {new Date(row.created_at).toLocaleString("es-MX", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                  <span className="uppercase">· {row.nivel}</span>
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onLoad(row.snapshot_json, row.output_json)}
                  className="h-7 text-xs"
                  title="Cargar esta versión"
                >
                  <Upload className="w-3 h-3 mr-1" /> Cargar
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => void handleDelete(row.id)}
                  disabled={deletingId === row.id}
                  className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                  title="Eliminar"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Sparkles, ArrowRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";

interface ModuloMeta {
  key: "territorial" | "crm" | "dia_d";
  label: string;
  ruta: string;
  color: string;
}

const MODULOS: ModuloMeta[] = [
  { key: "territorial", label: "Operación territorial", ruta: "/operacion-territorial", color: "text-emerald-400" },
  { key: "crm", label: "CRM simpatizantes", ruta: "/crm-simpatizantes", color: "text-blue-400" },
  { key: "dia_d", label: "Día D · Casilla", ruta: "/dia-d", color: "text-amber-400" },
];

export function InteresModulos() {
  const { user } = useAuth();
  const [solicitados, setSolicitados] = useState<Set<string>>(new Set());
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (!user) {
      setCargando(false);
      return;
    }
    let cancelado = false;
    (async () => {
      const { data } = await supabase
        .from("solicitudes_acceso_anticipado")
        .select("modulo")
        .eq("user_id", user.id);
      if (cancelado) return;
      setSolicitados(new Set((data ?? []).map((r) => r.modulo as string)));
      setCargando(false);
    })();
    return () => {
      cancelado = true;
    };
  }, [user]);

  return (
    <Card className="p-4 bg-card/60 border-border/60">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-primary" />
        <div className="text-xs font-mono uppercase tracking-widest text-primary">Módulos próximamente</div>
      </div>
      <p className="text-xs text-muted-foreground mb-3">
        Estos módulos están en desarrollo. Solicita acceso anticipado para priorizar la cola.
      </p>
      <div className="space-y-1.5">
        {MODULOS.map((m) => {
          const solicitado = solicitados.has(m.key);
          return (
            <Link
              key={m.key}
              to={m.ruta}
              className="flex items-center justify-between text-sm py-1.5 px-2 rounded-md hover:bg-muted/50 transition-colors group"
            >
              <span className={`font-medium ${m.color}`}>{m.label}</span>
              <span className="flex items-center gap-2">
                {!cargando && (
                  <span
                    className={`text-[10px] font-mono uppercase ${
                      solicitado ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    {solicitado ? "● Solicitado" : "Pronto"}
                  </span>
                )}
                <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
              </span>
            </Link>
          );
        })}
      </div>
    </Card>
  );
}

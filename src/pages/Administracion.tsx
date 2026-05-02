import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, type AppRole } from "@/context/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ShieldCheck, UserPlus, Trash2, RefreshCw } from "lucide-react";

interface UserRoleRow {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

const ROLES: AppRole[] = ["admin", "analista", "cliente"];

export default function Administracion() {
  const { user, isAdmin } = useAuth();
  const [rows, setRows] = useState<UserRoleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [newUserId, setNewUserId] = useState("");
  const [newRole, setNewRole] = useState<AppRole>("analista");
  const [adding, setAdding] = useState(false);

  const cargar = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("user_roles")
      .select("id, user_id, role, created_at")
      .order("created_at", { ascending: false });
    if (error) {
      toast.error(`Error al cargar roles: ${error.message}`);
      setRows([]);
    } else {
      setRows((data ?? []) as UserRoleRow[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isAdmin) cargar();
  }, [isAdmin]);

  const asignar = async () => {
    const uid = newUserId.trim();
    if (!uid) {
      toast.error("Ingresa un user_id válido");
      return;
    }
    setAdding(true);
    const { error } = await supabase.from("user_roles").insert({
      user_id: uid,
      role: newRole,
    });
    setAdding(false);
    if (error) {
      toast.error(`No se pudo asignar: ${error.message}`);
      return;
    }
    toast.success(`Rol ${newRole} asignado`);
    setNewUserId("");
    cargar();
  };

  const quitar = async (id: string, role: AppRole, uid: string) => {
    if (uid === user?.id && role === "admin") {
      toast.error("No puedes quitarte tu propio rol admin");
      return;
    }
    const { error } = await supabase.from("user_roles").delete().eq("id", id);
    if (error) {
      toast.error(`Error: ${error.message}`);
      return;
    }
    toast.success("Rol removido");
    cargar();
  };

  if (!isAdmin) {
    return (
      <div className="p-6">
        <Card className="p-6 text-center">
          <ShieldCheck className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
          <h2 className="text-lg font-bold mb-1">Acceso restringido</h2>
          <p className="text-sm text-muted-foreground">
            Esta sección requiere rol de administrador.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      <header className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            Administración de accesos
          </h1>
          <p className="text-xs text-muted-foreground font-mono mt-1">
            Gestiona qué usuarios pueden ingresar y con qué rol
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={cargar} disabled={loading}>
          <RefreshCw className={`w-3 h-3 mr-1 ${loading ? "animate-spin" : ""}`} />
          Actualizar
        </Button>
      </header>

      <Card className="p-4 space-y-3">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-primary" />
          Asignar rol a usuario
        </h2>
        <p className="text-[11px] text-muted-foreground font-mono">
          Para crear cuentas nuevas, ingresa al panel de Cloud → Users y luego copia el User ID aquí.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-[1fr_180px_auto] gap-2">
          <Input
            placeholder="User ID (UUID del usuario)"
            value={newUserId}
            onChange={(e) => setNewUserId(e.target.value)}
            className="font-mono text-xs"
          />
          <Select value={newRole} onValueChange={(v) => setNewRole(v as AppRole)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROLES.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={asignar} disabled={adding || !newUserId.trim()}>
            Asignar
          </Button>
        </div>
      </Card>

      <Card className="p-4">
        <h2 className="text-sm font-semibold mb-3">
          Roles vigentes ({rows.length})
        </h2>
        {loading ? (
          <p className="text-xs text-muted-foreground font-mono">Cargando…</p>
        ) : rows.length === 0 ? (
          <p className="text-xs text-muted-foreground font-mono">
            Aún no hay roles asignados.
          </p>
        ) : (
          <div className="space-y-2">
            {rows.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between gap-3 p-2 rounded bg-card/40 border border-border/40"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-[11px] text-muted-foreground truncate">
                    {r.user_id}
                    {r.user_id === user?.id && (
                      <span className="ml-2 text-primary">(tú)</span>
                    )}
                  </div>
                  <div className="text-[10px] text-muted-foreground/70 font-mono">
                    desde {new Date(r.created_at).toLocaleDateString("es-MX")}
                  </div>
                </div>
                <Badge
                  variant={r.role === "admin" ? "default" : "secondary"}
                  className="font-mono text-[10px]"
                >
                  {r.role}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => quitar(r.id, r.role, r.user_id)}
                  className="text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-4 bg-primary/5 border-primary/20">
        <h3 className="text-sm font-semibold mb-2">Modelo de roles</h3>
        <ul className="text-xs space-y-1 text-muted-foreground">
          <li><span className="text-primary font-mono">admin</span> · acceso total + gestión de usuarios</li>
          <li><span className="text-primary font-mono">analista</span> · acceso completo a módulos analíticos (sin gestión)</li>
          <li><span className="text-primary font-mono">cliente</span> · acceso de solo consulta a sus territorios</li>
        </ul>
        <p className="text-[10px] text-muted-foreground/70 mt-2 font-mono">
          El registro abierto está deshabilitado. Solo administradores pueden crear nuevas cuentas desde el panel de Cloud.
        </p>
      </Card>
    </div>
  );
}

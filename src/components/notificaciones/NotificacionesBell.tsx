import { useEffect, useState, useCallback } from "react";
import { Bell, Check, CheckCheck, Trash2, Settings } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface Notif {
  id: string;
  tipo: string;
  severidad: string;
  titulo: string;
  descripcion: string | null;
  link: string | null;
  leida: boolean;
  created_at: string;
}

const sevColor: Record<string, string> = {
  critica: "bg-red-600",
  urgente: "bg-red-500",
  preventiva: "bg-amber-500",
  info: "bg-sky-500",
};

export function NotificacionesBell() {
  const [items, setItems] = useState<Notif[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const unread = items.filter((i) => !i.leida).length;

  const fetchItems = useCallback(async () => {
    const { data } = await supabase
      .from("notificaciones")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(30);
    setItems((data as Notif[]) || []);
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return;
      setUserId(data.user.id);
      fetchItems();
    });
  }, [fetchItems]);

  useEffect(() => {
    if (!userId) return;
    const ch = supabase
      .channel("notif-" + userId)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notificaciones",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const n = payload.new as Notif;
          setItems((prev) => [n, ...prev].slice(0, 30));
          toast(n.titulo, { description: n.descripcion ?? undefined });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [userId]);

  const marcarLeida = async (id: string) => {
    await supabase
      .from("notificaciones")
      .update({ leida: true, leida_en: new Date().toISOString() })
      .eq("id", id);
    setItems((p) => p.map((n) => (n.id === id ? { ...n, leida: true } : n)));
  };

  const marcarTodas = async () => {
    await supabase
      .from("notificaciones")
      .update({ leida: true, leida_en: new Date().toISOString() })
      .eq("leida", false);
    setItems((p) => p.map((n) => ({ ...n, leida: true })));
  };

  const borrar = async (id: string) => {
    await supabase.from("notificaciones").delete().eq("id", id);
    setItems((p) => p.filter((n) => n.id !== id));
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <Badge className="absolute -top-1 -right-1 h-4 min-w-4 px-1 text-[9px] bg-primary">
              {unread > 9 ? "9+" : unread}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96 p-0">
        <div className="flex items-center justify-between px-3 py-2 border-b">
          <span className="text-sm font-semibold">Notificaciones</span>
          <div className="flex gap-1">
            {unread > 0 && (
              <Button size="sm" variant="ghost" onClick={marcarTodas} className="h-7 text-xs">
                <CheckCheck className="h-3 w-3 mr-1" /> Todas
              </Button>
            )}
            <Button asChild size="sm" variant="ghost" className="h-7 w-7 p-0">
              <Link to="/notificaciones/preferencias">
                <Settings className="h-3 w-3" />
              </Link>
            </Button>
          </div>
        </div>
        <ScrollArea className="h-96">
          {items.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Sin notificaciones
            </div>
          ) : (
            items.map((n) => (
              <div
                key={n.id}
                className={`px-3 py-2 border-b border-border/40 hover:bg-muted/40 ${
                  !n.leida ? "bg-muted/20" : ""
                }`}
              >
                <div className="flex items-start gap-2">
                  <span
                    className={`mt-1 h-2 w-2 rounded-full shrink-0 ${
                      sevColor[n.severidad] || "bg-muted-foreground"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    {n.link ? (
                      <Link
                        to={n.link}
                        onClick={() => marcarLeida(n.id)}
                        className="text-xs font-medium hover:underline block truncate"
                      >
                        {n.titulo}
                      </Link>
                    ) : (
                      <div className="text-xs font-medium truncate">{n.titulo}</div>
                    )}
                    {n.descripcion && (
                      <div className="text-[11px] text-muted-foreground line-clamp-2">
                        {n.descripcion}
                      </div>
                    )}
                    <div className="text-[10px] text-muted-foreground/70 mt-0.5">
                      {formatDistanceToNow(new Date(n.created_at), {
                        addSuffix: true,
                        locale: es,
                      })}
                    </div>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    {!n.leida && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-5 w-5"
                        onClick={() => marcarLeida(n.id)}
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                    )}
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-5 w-5"
                      onClick={() => borrar(n.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

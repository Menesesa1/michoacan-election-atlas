import { NavLink, Outlet, useLocation, Navigate } from "react-router-dom";
import { ShieldAlert, Activity, Users, Swords, MapPin, Bot, Brain, Megaphone, Map } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { to: "/inteligencia/alertas", label: "Alertas", icon: ShieldAlert },
  { to: "/inteligencia/cib", label: "CIB / Bots", icon: Bot },
  { to: "/inteligencia/emociones", label: "Emociones", icon: Brain },
  { to: "/inteligencia/geoint", label: "GEOINT", icon: Map },
  { to: "/inteligencia/narrativas", label: "Narrativas", icon: Megaphone },
  { to: "/inteligencia/listening-estatal", label: "Sentimiento", icon: Activity },
  { to: "/inteligencia/listening-candidatos", label: "Candidatos", icon: Users },
  { to: "/inteligencia/comparador", label: "Propio vs Rival", icon: Swords },
  { to: "/inteligencia/mapa-calor", label: "Mapa Calor", icon: MapPin },
];

export default function Inteligencia() {
  const { pathname } = useLocation();
  if (pathname === "/inteligencia") return <Navigate to="/inteligencia/alertas" replace />;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1 border-b border-border/50">
        {tabs.map((t) => {
          const active = pathname.startsWith(t.to);
          return (
            <NavLink
              key={t.to}
              to={t.to}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 text-xs font-semibold transition-all border-b-2 -mb-px",
                active
                  ? "text-primary border-primary"
                  : "text-muted-foreground border-transparent hover:text-foreground hover:border-border",
              )}
            >
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
            </NavLink>
          );
        })}
      </div>
      <Outlet />
    </div>
  );
}

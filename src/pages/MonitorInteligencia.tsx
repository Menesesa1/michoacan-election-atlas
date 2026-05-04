import { useEffect, useState } from "react";
import {
  ShieldAlert,
  Bot,
  Brain,
  Map as MapIcon,
  Megaphone,
  Activity,
  Users,
  Swords,
  MapPin,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AlertasOperacion } from "@/components/AlertasOperacion";
import CibAlertasSection from "@/components/inteligencia/CibAlertasSection";
import PsicoIntSection from "@/components/inteligencia/PsicoIntSection";
import GeoIntSection from "@/components/inteligencia/GeoIntSection";
import NarrativasSection from "@/components/inteligencia/NarrativasSection";
import { ListeningPanel } from "@/components/ListeningPanel";
import { MapaCalorSentimiento } from "@/components/MapaCalorSentimiento";

const sections = [
  { id: "alertas", label: "Alertas", icon: ShieldAlert, Component: AlertasOperacion },
  { id: "cib", label: "CIB / Bots", icon: Bot, Component: CibAlertasSection },
  { id: "emociones", label: "Emociones", icon: Brain, Component: PsicoIntSection },
  { id: "geoint", label: "GEOINT", icon: MapIcon, Component: GeoIntSection },
  { id: "narrativas", label: "Narrativas", icon: Megaphone, Component: NarrativasSection },
  {
    id: "sentimiento",
    label: "Sentimiento estatal",
    icon: Activity,
    Component: () => <ListeningPanel scope="estatal" />,
  },
  {
    id: "candidatos",
    label: "Candidatos",
    icon: Users,
    Component: () => <ListeningPanel scope="candidatos" />,
  },
  { id: "mapa-calor", label: "Mapa de calor", icon: MapPin, Component: MapaCalorSentimiento },
] as const;

export default function MonitorInteligencia() {
  const [active, setActive] = useState<string>(sections[0].id);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: "-30% 0px -60% 0px", threshold: [0, 0.25, 0.5, 1] },
    );
    sections.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  // Soporte para deep-links viejos (/inteligencia/cib, etc.)
  useEffect(() => {
    const path = window.location.pathname.split("/").pop();
    if (path && path !== "inteligencia") {
      const map: Record<string, string> = {
        alertas: "alertas",
        cib: "cib",
        emociones: "emociones",
        geoint: "geoint",
        narrativas: "narrativas",
        "listening-estatal": "sentimiento",
        "listening-candidatos": "candidatos",
        comparador: "comparador",
        "mapa-calor": "mapa-calor",
      };
      const target = map[path];
      if (target) {
        setTimeout(() => {
          document.getElementById(target)?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 200);
      }
    }
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <div className="text-primary text-[10px] font-mono uppercase tracking-widest">
          Centro de operaciones
        </div>
        <h1 className="text-2xl font-bold text-foreground">Monitor de Inteligencia</h1>
        <p className="text-sm text-muted-foreground mt-1 max-w-3xl">
          Vista unificada: alertas, comportamiento coordinado, emociones, geo-conversación, narrativas
          accionables, sentimiento y comparativos. Todo en un solo flujo de scroll.
        </p>
      </div>

      <div className="grid lg:grid-cols-[200px_1fr] gap-6">
        {/* Side nav sticky */}
        <nav className="hidden lg:block">
          <div className="sticky top-20 space-y-1">
            <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground px-3 pb-2">
              Secciones
            </div>
            {sections.map((s) => {
              const isActive = active === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() =>
                    document.getElementById(s.id)?.scrollIntoView({ behavior: "smooth", block: "start" })
                  }
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-md transition-all border-l-2",
                    isActive
                      ? "text-primary border-primary bg-primary/10"
                      : "text-muted-foreground border-transparent hover:text-foreground hover:bg-muted/40",
                  )}
                >
                  <s.icon className="w-3.5 h-3.5" />
                  {s.label}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Mobile chips */}
        <nav className="lg:hidden flex items-center gap-1 overflow-x-auto pb-2 -mx-1 px-1 sticky top-14 z-30 bg-background/80 backdrop-blur">
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() =>
                document.getElementById(s.id)?.scrollIntoView({ behavior: "smooth", block: "start" })
              }
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold rounded-full whitespace-nowrap border",
                active === s.id
                  ? "text-primary border-primary bg-primary/10"
                  : "text-muted-foreground border-border/60 hover:text-foreground",
              )}
            >
              <s.icon className="w-3 h-3" />
              {s.label}
            </button>
          ))}
        </nav>

        <div className="space-y-12">
          {sections.map((s) => (
            <section key={s.id} id={s.id} className="scroll-mt-20">
              <s.Component />
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

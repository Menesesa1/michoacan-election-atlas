import { useNavigate } from "react-router-dom";
import { ArrowRight, ShieldCheck, BarChart3, Map, AlertTriangle, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LandingNavbar } from "@/components/LandingNavbar";
import { PdfDownloadFab } from "@/components/PdfDownloadFab";

import { IntencionVotoChart } from "@/components/IntencionVotoChart";
import { SentimientoMoreliaChart } from "@/components/SentimientoMoreliaChart";
import { EmeLogo } from "@/components/EmeLogo";

export default function Landing() {
  const navigate = useNavigate();

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <LandingNavbar />
      <PdfDownloadFab />

      {/* HERO */}
      <section
        id="inicio"
        className="relative min-h-screen flex items-center pt-16 overflow-hidden executive-gradient"
      >
        {/* Decorative background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 -left-32 w-96 h-96 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute bottom-1/4 -right-32 w-96 h-96 rounded-full bg-primary/15 blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-20 grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: copy */}
          <div className="space-y-7">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/40 bg-primary/10 text-primary text-[11px] font-mono uppercase tracking-widest">
              <EmeLogo size={20} />
              EME Gabinete · Michoacán 2025-2027
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-[1.02] tracking-tight">
              Sistema de
              <br />
              <span className="text-gradient-gold">Mando Estratégico</span>
              <br />
              <span className="text-foreground">Michoacán 360</span>
            </h1>

            <p className="text-lg text-muted-foreground max-w-xl leading-relaxed">
              Inteligencia política, electoral y demográfica en una sola plataforma.
              Monitor unificado de alertas, sentimiento, comportamiento coordinado y narrativas
              accionables para decisiones estratégicas del Gabinete.
            </p>

            <div className="flex items-center gap-2 text-primary text-sm font-mono uppercase tracking-widest">
              <span className="h-px w-10 bg-primary" />
              Movemos realidades
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button
                size="lg"
                onClick={() => scrollTo("metodologia")}
                className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold gap-2 glow-primary"
              >
                Ver metodología
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate("/login")}
                className="border-primary/40 hover:bg-primary/10 hover:border-primary text-foreground gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                Acceder al Mando Central
              </Button>
            </div>
          </div>

          {/* Right: KPI tiles */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: Map, label: "Distritos", val: "11+24", sub: "Federales / Locales" },
              { icon: BarChart3, label: "Encuestadoras", val: "3", sub: "Mitofsky · EFC · MAC" },
              { icon: Users, label: "Padrón", val: "3.7M", sub: "Lista nominal" },
              { icon: AlertTriangle, label: "Alertas", val: "Live", sub: "Feed operación" },
            ].map((k) => (
              <div
                key={k.label}
                className="executive-panel p-5 gold-border hover:border-primary/60 transition-all hover:-translate-y-1"
              >
                <k.icon className="w-5 h-5 text-primary mb-3" />
                <div className="text-3xl font-bold text-foreground">{k.val}</div>
                <div className="text-xs font-mono uppercase tracking-wider text-primary mt-1">
                  {k.label}
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5">{k.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ESCENARIOS */}
      <section id="escenarios" className="py-20 px-4 sm:px-6 lg:px-12">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="space-y-3 text-center">
            <div className="inline-flex items-center gap-2 text-primary text-xs font-mono uppercase tracking-widest">
              <span className="h-px w-8 bg-primary" />
              Escenarios Electorales
              <span className="h-px w-8 bg-primary" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold">Intención de voto en Morelia</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Evolución semanal de la intención de voto presidencial municipal.
            </p>
          </div>
          <div className="executive-panel p-4 sm:p-6 gold-border">
            <IntencionVotoChart />
          </div>
        </div>
      </section>

      {/* TENDENCIAS / SENTIMIENTO */}
      <section id="tendencias" className="py-20 px-4 sm:px-6 lg:px-12 bg-card/30">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="space-y-3 text-center">
            <div className="inline-flex items-center gap-2 text-primary text-xs font-mono uppercase tracking-widest">
              <span className="h-px w-8 bg-primary" />
              Tendencias Sociales
              <span className="h-px w-8 bg-primary" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold">Sentimiento social en Morelia</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Distribución positivo / neutro / negativo a lo largo del tiempo.
            </p>
          </div>
          <div className="executive-panel p-4 sm:p-6 gold-border">
            <SentimientoMoreliaChart />
          </div>
        </div>
      </section>

      {/* DEMOGRAFIA teaser */}
      <section id="demografia" className="py-20 px-4 sm:px-6 lg:px-12">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-10 items-center">
          <div className="space-y-5">
            <div className="text-primary text-xs font-mono uppercase tracking-widest">
              Inteligencia Demográfica
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold">
              Pirámides poblacionales y heatmaps por distrito
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Análisis del padrón electoral del INE por edad y sexo, con comparativos
              entre distritos federales y locales. Detecta desequilibrios de género,
              concentración juvenil y oportunidades de movilización.
            </p>
            <Button
              variant="outline"
              onClick={() => navigate("/login")}
              className="border-primary/40 hover:bg-primary/10 hover:border-primary"
            >
              Entrar al panel demográfico
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 12 }).map((_, i) => {
              const intensity = Math.abs(Math.sin(i * 1.3)) * 0.8 + 0.2;
              return (
                <div
                  key={i}
                  className="aspect-square rounded gold-border"
                  style={{
                    background: `hsl(40 49% 56% / ${intensity})`,
                  }}
                />
              );
            })}
          </div>
        </div>
      </section>

      {/* METODOLOGÍA */}
      <section id="metodologia" className="py-20 px-4 sm:px-6 lg:px-12">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="space-y-3 text-center">
            <div className="inline-flex items-center gap-2 text-primary text-xs font-mono uppercase tracking-widest">
              <span className="h-px w-8 bg-primary" />
              Metodología
              <span className="h-px w-8 bg-primary" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold">Cómo se construye el sistema</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              {
                t: "Fuentes oficiales",
                d: "Resultados INE / IEM 2018-2024, padrón electoral, lista nominal, cartografía SIGE.",
              },
              {
                t: "Social listening + PSICOINT",
                d: "Monitor de medios, redes y conversación local con clasificación emocional (no solo positivo/negativo) y detección de sarcasmo.",
              },
              {
                t: "Inteligencia operativa",
                d: "Alertas de crisis, detección CIB de bots, GEOINT por sección y narrativas accionables generadas con IA.",
              },
            ].map((b) => (
              <div key={b.t} className="executive-panel p-6 gold-border space-y-2">
                <div className="text-primary text-xs font-mono uppercase tracking-widest">
                  {b.t}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{b.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-primary/20 py-10 px-4 sm:px-6 lg:px-12">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <EmeLogo size={32} />
            <div className="text-xs font-mono text-muted-foreground">
              © {new Date().getFullYear()} EME Gabinete Estratégico · Michoacán 360
            </div>
          </div>
          <button
            onClick={() => navigate("/login")}
            className="text-xs font-mono text-primary hover:text-primary/80 uppercase tracking-widest"
          >
            Acceso restringido →
          </button>
        </div>
      </footer>
    </div>
  );
}

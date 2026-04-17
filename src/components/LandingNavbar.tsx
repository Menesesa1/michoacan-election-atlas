import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, X, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmeLogo } from "@/components/EmeLogo";

const sections = [
  { id: "inicio", label: "Inicio" },
  { id: "escenarios", label: "Escenarios" },
  { id: "demografia", label: "Demografía" },
  { id: "tendencias", label: "Tendencias" },
  { id: "comparador", label: "Comparador" },
  { id: "metodologia", label: "Metodología" },
];

export function LandingNavbar() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const goTo = (id: string) => {
    setOpen(false);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all ${
        scrolled
          ? "bg-background/85 backdrop-blur-md border-b border-primary/20 shadow-lg"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 h-16 flex items-center justify-between">
        <button
          onClick={() => goTo("inicio")}
          className="flex items-center gap-2 group"
          aria-label="Inicio"
        >
          <EmeLogo size={36} />
          <div className="hidden sm:block leading-tight text-left">
            <div className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
              EME Gabinete
            </div>
            <div className="text-[9px] font-mono uppercase tracking-widest text-primary">
              Michoacán 360
            </div>
          </div>
        </button>

        <nav className="hidden lg:flex items-center gap-1">
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => goTo(s.id)}
              className="px-3 py-2 text-sm text-muted-foreground hover:text-primary transition-colors font-medium"
            >
              {s.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => navigate("/login")}
            size="sm"
            className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold gap-1.5 hidden sm:inline-flex"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Acceder al Mando
          </Button>
          <button
            onClick={() => setOpen((v) => !v)}
            className="lg:hidden p-2 text-foreground hover:text-primary"
            aria-label="Menú"
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="lg:hidden bg-background/95 backdrop-blur-md border-t border-primary/20">
          <nav className="px-4 py-3 flex flex-col gap-1">
            {sections.map((s) => (
              <button
                key={s.id}
                onClick={() => goTo(s.id)}
                className="text-left px-3 py-2 text-sm text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-md transition-colors"
              >
                {s.label}
              </button>
            ))}
            <Button
              onClick={() => navigate("/login")}
              size="sm"
              className="mt-2 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold gap-1.5 sm:hidden"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Acceder al Mando
            </Button>
          </nav>
        </div>
      )}
    </header>
  );
}

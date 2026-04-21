import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { EmeLogo } from "@/components/EmeLogo";

export function AppLayout() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />

        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center justify-between border-b border-border/60 bg-card/50 backdrop-blur-md sticky top-0 z-40 px-3">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="text-foreground hover:text-primary" />
              <div className="hidden md:flex items-center gap-2">
                <EmeLogo size={28} />
                <div className="leading-tight">
                  <div className="text-xs font-bold text-foreground">
                    Sistema de Mando <span className="text-gradient-gold">Michoacán 360</span>
                  </div>
                  <div className="text-[9px] text-muted-foreground font-mono uppercase tracking-wider">
                    EME Gabinete Estratégico
                  </div>
                </div>
              </div>
            </div>
            <div className="text-[10px] text-primary font-mono uppercase tracking-widest hidden sm:block">
              ● En operación
            </div>
          </header>

          <main className="flex-1 p-4 lg:p-6 overflow-x-hidden">
            <Outlet />
          </main>

          <footer className="border-t border-border/30 bg-card/30 px-4 py-3 space-y-2">
            <p className="text-[10px] text-foreground/80 leading-relaxed text-center max-w-4xl mx-auto">
              Producto electoral verificado y desarrollado por{" "}
              <span className="font-semibold text-primary">Job Meneses, Estratega Sr. y Arquitecto del Poder</span>,
              como herramienta estratégica para diputaciones locales y ayuntamientos.
              Uso exclusivo del equipo de campaña; centrado en el
              <span className="font-semibold"> War Room (WR) de cada escenario</span>.
            </p>
            <div className="text-center text-[10px] text-muted-foreground/70 font-mono">
              EME · Michoacán 360 · Datos INE/IEM · Cómputos 2018-2024 · Movemos realidades
            </div>
          </footer>
        </div>
      </div>
    </SidebarProvider>
  );
}

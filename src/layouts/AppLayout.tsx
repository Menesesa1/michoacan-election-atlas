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

          <footer className="text-center py-3 text-[10px] text-muted-foreground/70 font-mono border-t border-border/30">
            EME · Michoacán 360 · Datos INE/IEM · Cómputos 2018-2024 · Movemos realidades
          </footer>
        </div>
      </div>
    </SidebarProvider>
  );
}

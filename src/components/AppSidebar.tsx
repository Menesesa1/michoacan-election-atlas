import {
  LayoutDashboard,
  Map,
  Users,
  TrendingUp,
  ShieldAlert,
  Database,
  PieChart,
  BarChart3,
  ExternalLink,
  Briefcase,
  Search,
  Building2,
  FolderOpen,
  LogOut,
  Vote,
  Building,
  Landmark,
  ChevronDown,
  Sparkles,
  Zap,
  Network,
  MessageCircle,
  ShieldCheck,
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useState } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { EmeLogo } from "@/components/EmeLogo";
import { useAuth } from "@/context/AuthContext";

const locales = [
  { title: "Mando Central", url: "/mando", icon: LayoutDashboard, end: true },
  { title: "Gobernador", url: "/gobernador", icon: Landmark },
  { title: "Diputados Locales", url: "/diputados-locales", icon: Vote },
  { title: "Ayuntamientos", url: "/ayuntamientos", icon: Building },
  { title: "Socioeconómico", url: "/socioeconomico", icon: PieChart },
  { title: "Demografía", url: "/demografia", icon: Users },
  { title: "Tendencias", url: "/tendencias", icon: TrendingUp },
  { title: "Estrategia 360", url: "/escenarios", icon: Sparkles },
  { title: "Operación 360", url: "/operacion", icon: Zap },
  { title: "Candidatos", url: "/candidatos", icon: Users },
  { title: "Inteligencia", url: "/inteligencia", icon: ShieldAlert },
  { title: "Fuentes", url: "/fuentes", icon: Database },
];

const operacionCampania = [
  { title: "Operación territorial", url: "/operacion-territorial", icon: Network },
  { title: "CRM simpatizantes", url: "/crm-simpatizantes", icon: MessageCircle },
  { title: "Día D · Casilla", url: "/dia-d", icon: ShieldCheck },
];

const federal = [
  { title: "Distritos federales", url: "/distritos", icon: Map },
];

const tools = [
  { title: "Meta Business Suite", url: "https://business.facebook.com/latest/home", icon: Briefcase },
  { title: "Google Trends Michoacán", url: "https://trends.google.com/trends/explore?geo=MX-MIC", icon: Search },
  { title: "IEM Michoacán", url: "https://iem.org.mx/", icon: Building2 },
  { title: "Repositorio Drive", url: "https://drive.google.com/", icon: FolderOpen },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { user, logout } = useAuth();

  const isFederalActive = federal.some((f) => location.pathname.startsWith(f.url));
  const [federalOpen, setFederalOpen] = useState(isFederalActive);

  const isActive = (url: string, end?: boolean) =>
    end ? location.pathname === url : location.pathname.startsWith(url);

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border p-3">
        <div className="flex items-center gap-2 overflow-hidden">
          <EmeLogo size={36} />
          {!collapsed && (
            <div className="leading-tight overflow-hidden">
              <div className="text-sm font-bold text-sidebar-foreground truncate">EME Estratégico</div>
              <div className="text-[9px] text-primary font-mono uppercase tracking-wider truncate">
                Michoacán de Ocampo · Local
              </div>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Elecciones Locales */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-primary/80 font-semibold uppercase tracking-widest text-[10px]">
            <BarChart3 className="w-3 h-3 mr-1.5 inline" />
            {!collapsed && "Elecciones Locales"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {locales.map((item) => {
                const active = isActive(item.url, item.end);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={active}>
                      <NavLink
                        to={item.url}
                        end={item.end}
                        className={`${active ? "bg-sidebar-accent text-primary font-semibold border-l-2 border-primary" : "hover:bg-sidebar-accent/60"}`}
                      >
                        <item.icon className="w-4 h-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Operación de campaña — Próximamente */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-primary/80 font-semibold uppercase tracking-widest text-[10px]">
            <Sparkles className="w-3 h-3 mr-1.5 inline" />
            {!collapsed && "Operación de campaña"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {operacionCampania.map((item) => {
                const active = isActive(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={active}>
                      <NavLink
                        to={item.url}
                        className={`${active ? "bg-sidebar-accent text-primary font-semibold border-l-2 border-primary" : "hover:bg-sidebar-accent/60"}`}
                      >
                        <item.icon className="w-4 h-4" />
                        {!collapsed && (
                          <>
                            <span className="truncate">{item.title}</span>
                            <span className="ml-auto text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary/15 text-primary border border-primary/30">
                              Pronto
                            </span>
                          </>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Federal (referencia) — colapsable */}
        <SidebarGroup>
          <button
            onClick={() => setFederalOpen((v) => !v)}
            className="w-full flex items-center justify-between px-2 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
            type="button"
          >
            <span className="flex items-center">
              <Map className="w-3 h-3 mr-1.5 inline opacity-70" />
              {!collapsed && "Federal (referencia)"}
            </span>
            {!collapsed && (
              <ChevronDown className={`w-3 h-3 transition-transform ${federalOpen ? "rotate-180" : ""}`} />
            )}
          </button>
          {(federalOpen || collapsed) && (
            <SidebarGroupContent>
              <SidebarMenu>
                {federal.map((item) => {
                  const active = isActive(item.url);
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild isActive={active}>
                        <NavLink
                          to={item.url}
                          className={`${active ? "bg-sidebar-accent text-primary font-semibold border-l-2 border-primary" : "hover:bg-sidebar-accent/60"} opacity-90`}
                        >
                          <item.icon className="w-4 h-4" />
                          {!collapsed && <span>{item.title}</span>}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          )}
        </SidebarGroup>

        {/* Herramientas externas */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-primary/80 font-semibold uppercase tracking-widest text-[10px]">
            <ExternalLink className="w-3 h-3 mr-1.5 inline" />
            {!collapsed && "Herramientas Inteligencia"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {tools.map((tool) => (
                <SidebarMenuItem key={tool.title}>
                  <SidebarMenuButton asChild>
                    <a
                      href={tool.url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="hover:bg-sidebar-accent/60"
                    >
                      <tool.icon className="w-4 h-4" />
                      {!collapsed && (
                        <>
                          <span className="truncate">{tool.title}</span>
                          <ExternalLink className="w-3 h-3 ml-auto opacity-50" />
                        </>
                      )}
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-3">
        {!collapsed && user && (
          <div className="text-[10px] font-mono text-muted-foreground mb-2 px-1 truncate">
            <span className="text-primary">●</span> {user.email}
          </div>
        )}
        <SidebarMenuButton onClick={logout} className="hover:bg-destructive/15 hover:text-destructive">
          <LogOut className="w-4 h-4" />
          {!collapsed && <span>Cerrar sesión</span>}
        </SidebarMenuButton>
      </SidebarFooter>
    </Sidebar>
  );
}

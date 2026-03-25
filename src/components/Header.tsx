import { BarChart3, Database, Map, TrendingUp } from "lucide-react";

interface HeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { id: "resumen", label: "Resumen", icon: BarChart3 },
  { id: "distritos", label: "Distritos", icon: Map },
  { id: "tendencias", label: "Tendencias", icon: TrendingUp },
  { id: "fuentes", label: "Fuentes", icon: Database },
];

export function Header({ activeTab, onTabChange }: HeaderProps) {
  return (
    <header className="border-b border-border/50 glass-panel sticky top-0 z-50">
      <div className="container flex items-center justify-between h-14 px-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-primary/20 flex items-center justify-center glow-primary">
            <BarChart3 className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-foreground">
              Analista Electoral <span className="text-gradient-primary">Michoacán</span>
            </h1>
            <p className="text-[10px] text-muted-foreground font-mono">INE · Cómputos 2018-2024</p>
          </div>
        </div>
        
        <nav className="flex items-center gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  isActive
                    ? "bg-primary/15 text-primary glow-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

import { useElectoralData } from "@/context/DataContext";

export function NivelSelector() {
  const { nivel, setNivel } = useElectoralData();

  return (
    <div className="flex items-center gap-0.5 p-0.5 bg-secondary/50 rounded-lg">
      <button
        onClick={() => setNivel("federal")}
        className={`px-3 py-1.5 rounded-md text-[11px] font-medium transition-all ${
          nivel === "federal"
            ? "bg-primary/15 text-primary glow-primary"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        Federal ({nivel === "federal" ? "11 dtos" : "11"})
      </button>
      <button
        onClick={() => setNivel("local")}
        className={`px-3 py-1.5 rounded-md text-[11px] font-medium transition-all ${
          nivel === "local"
            ? "bg-primary/15 text-primary glow-primary"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        Local ({nivel === "local" ? "24 dtos" : "24"})
      </button>
    </div>
  );
}

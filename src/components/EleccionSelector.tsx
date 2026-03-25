import { ELECCIONES } from "@/data/electoral-data";

interface EleccionSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export function EleccionSelector({ value, onChange }: EleccionSelectorProps) {
  return (
    <div className="flex items-center gap-1 p-1 bg-secondary/50 rounded-lg">
      {ELECCIONES.map((e) => (
        <button
          key={e.key}
          onClick={() => onChange(e.key)}
          className={`px-3 py-1.5 rounded-md text-[11px] font-medium transition-all ${
            value === e.key
              ? "bg-primary/15 text-primary glow-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {e.label}
        </button>
      ))}
    </div>
  );
}

import { useElectoralData } from "@/context/DataContext";

interface EleccionSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export function EleccionSelector({ value, onChange }: EleccionSelectorProps) {
  const { elecciones, nivel } = useElectoralData();

  const filtered = elecciones.filter((e) => e.tipo === nivel);

  // Auto-select first matching election if current doesn't match nivel
  const currentMatch = filtered.find((e) => e.key === value);
  if (!currentMatch && filtered.length > 0 && value) {
    // Will trigger on next render
    setTimeout(() => onChange(filtered[0].key), 0);
  }

  return (
    <div className="flex items-center gap-1 p-1 bg-secondary/50 rounded-lg flex-wrap">
      {filtered.map((e) => (
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

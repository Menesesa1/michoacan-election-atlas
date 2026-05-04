import { Users, Vote, TrendingUp, MapPin } from "lucide-react";
import { getResumenEstatal } from "@/data/electoral-data";
import { useElectoralData } from "@/context/DataContext";
import { useListaNominalOficial } from "@/hooks/use-lista-nominal-oficial";
import { ListaNominalBadge } from "@/components/ListaNominalBadge";

interface KPICardProps {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}

function KPICard({ icon: Icon, label, value, sub, accent }: KPICardProps) {
  return (
    <div className={`glass-panel p-4 animate-slide-up ${accent ? "glow-primary" : ""}`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${accent ? "text-primary" : "text-muted-foreground"}`} />
        <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">{label}</span>
      </div>
      <p className={`text-2xl font-bold font-mono ${accent ? "text-gradient-primary" : "text-foreground"}`}>{value}</p>
      {sub && <p className="text-[11px] text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}

export function KPICards({ eleccion }: { eleccion: string }) {
  const { distritosActivos, nivel } = useElectoralData();
  const { total: lnOficial } = useListaNominalOficial();
  const resumen = getResumenEstatal(eleccion, distritosActivos);
  // LN estatal SIEMPRE viene del padrón oficial INE (única fuente de verdad).
  // Ya sea federal (11) o local (24), debe sumar lo mismo.
  const totalLN = lnOficial || distritosActivos.reduce((s, d) => s + d.listaNominal2024, 0);
  const tipoLabel = nivel === "federal" ? "federales" : "locales";

  const dominante = (Object.entries(resumen.totales) as [string, number][])
    .sort((a, b) => b[1] - a[1])[0];

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICard
          icon={Users}
          label="Lista Nominal"
          value={(totalLN / 1e6).toFixed(2) + "M"}
          sub={`Estatal · INE-DERFE (${distritosActivos.length} ${tipoLabel})`}
          accent
        />
        <KPICard
          icon={Vote}
          label="Total Votos"
          value={(resumen.totalVotos / 1e6).toFixed(2) + "M"}
          sub={`Participación: ${resumen.participacion.toFixed(1)}%`}
        />
        <KPICard
          icon={TrendingUp}
          label="Partido Dominante"
          value={dominante?.[0] || "N/A"}
          sub={dominante ? `${((dominante[1] / resumen.totalVotos) * 100).toFixed(1)}% del voto total` : ""}
        />
        <KPICard
          icon={MapPin}
          label="Distritos"
          value={String(distritosActivos.length)}
          sub={`Distritos ${tipoLabel}`}
        />
      </div>
      <ListaNominalBadge />
    </div>
  );
}

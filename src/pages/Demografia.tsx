import { DemografiaPanel } from "@/components/DemografiaPanel";

export default function Demografia() {
  return (
    <div className="space-y-5">
      <div>
        <div className="text-primary text-[10px] font-mono uppercase tracking-widest">Padrón electoral</div>
        <h1 className="text-2xl font-bold text-foreground">Demografía estratégica</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Segmenta el padrón por tipo de elección y territorio (Gobernatura · Diputación
          Federal · Diputación Local · Ayuntamiento). Suma por secciones del catálogo INE.
        </p>
      </div>
      <DemografiaPanel />
    </div>
  );
}

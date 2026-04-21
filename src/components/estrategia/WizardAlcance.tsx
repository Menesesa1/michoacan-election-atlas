import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  NIVEL_LABEL,
  type NivelEscenario,
} from "@/data/escenarios-base";
import {
  POSICION_LABEL,
  PARTIDOS_DISPONIBLES,
  type Posicion,
} from "@/data/estrategia-templates";
import type { TerritorioOption } from "@/lib/estrategia-context";
import { Landmark, Vote, Building, MapPin, Users, Scale } from "lucide-react";

interface Props {
  nivel: NivelEscenario;
  setNivel: (n: NivelEscenario) => void;
  territorio: string;
  setTerritorio: (t: string) => void;
  territorios: TerritorioOption[];
  posicion: Posicion;
  setPosicion: (p: Posicion) => void;
  coalicion: string[];
  toggleCoalicion: (p: string) => void;
  horizonte: string;
  setHorizonte: (h: string) => void;
}

const NIVEL_ICON: Record<NivelEscenario, typeof Landmark> = {
  gobernador: Landmark,
  diputados_federales: Scale,
  diputados: Vote,
  ayuntamientos: Building,
};

export function WizardAlcance({
  nivel, setNivel, territorio, setTerritorio, territorios,
  posicion, setPosicion, coalicion, toggleCoalicion, horizonte, setHorizonte,
}: Props) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {(["gobernador", "diputados_federales", "diputados", "ayuntamientos"] as NivelEscenario[]).map((n) => {
          const Icon = NIVEL_ICON[n];
          const active = nivel === n;
          return (
            <button
              key={n}
              type="button"
              onClick={() => setNivel(n)}
              className={`text-left rounded-lg border p-4 transition-all ${
                active
                  ? "border-primary bg-primary/10 shadow-[0_0_0_1px_hsl(var(--primary)/0.6)]"
                  : "border-border bg-card/40 hover:border-primary/40"
              }`}
            >
              <div className="flex items-center gap-2">
                <Icon className={`w-4 h-4 ${active ? "text-primary" : "text-muted-foreground"}`} />
                <div className={`text-xs font-mono uppercase tracking-widest ${active ? "text-primary" : "text-muted-foreground"}`}>
                  Nivel
                </div>
              </div>
              <div className="text-sm font-semibold text-foreground mt-1">{NIVEL_LABEL[n]}</div>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
            <MapPin className="w-3 h-3" /> Territorio
          </Label>
          <Select value={territorio} onValueChange={setTerritorio}>
            <SelectTrigger><SelectValue placeholder="Elige territorio" /></SelectTrigger>
            <SelectContent className="max-h-72">
              {territorios.map((t) => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
            <Users className="w-3 h-3" /> Posición de partida
          </Label>
          <Select value={posicion} onValueChange={(v) => setPosicion(v as Posicion)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {(Object.keys(POSICION_LABEL) as Posicion[]).map((p) => (
                <SelectItem key={p} value={p}>{POSICION_LABEL[p]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs uppercase tracking-widest text-muted-foreground">
          Coalición tentativa
        </Label>
        <div className="flex flex-wrap gap-1.5">
          {PARTIDOS_DISPONIBLES.map((p) => {
            const active = coalicion.includes(p);
            return (
              <button
                key={p}
                type="button"
                onClick={() => toggleCoalicion(p)}
                className={`px-2.5 py-1 rounded-md text-xs font-mono border transition-colors ${
                  active
                    ? "bg-primary/20 text-primary border-primary"
                    : "bg-card/40 text-muted-foreground border-border hover:border-primary/40"
                }`}
              >
                {p}
              </button>
            );
          })}
        </div>
        {coalicion.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {coalicion.map((c) => (
              <Badge key={c} variant="outline" className="text-[10px]">{c}</Badge>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs uppercase tracking-widest text-muted-foreground">
          Horizonte
        </Label>
        <Input
          value={horizonte}
          onChange={(e) => setHorizonte(e.target.value)}
          className="max-w-xs"
        />
      </div>
    </div>
  );
}

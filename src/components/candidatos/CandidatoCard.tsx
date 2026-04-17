import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, FileSearch, Twitter, Facebook, Instagram, Globe } from "lucide-react";
import type { Candidato } from "@/lib/candidatos/types";
import { CandidatoForm } from "./CandidatoForm";

interface Props {
  candidato: Candidato;
  onOpen: () => void;
  onDelete: () => void;
  onChanged: () => void;
  selected?: boolean;
  onToggleSelect?: () => void;
}

const NIVEL_LABEL: Record<string, string> = {
  gobernador: "Gobernatura",
  diputados: "Diputado Local",
  ayuntamientos: "Ayuntamiento",
};

export function CandidatoCard({ candidato, onOpen, onDelete, onChanged, selected, onToggleSelect }: Props) {
  return (
    <Card className={`p-4 bg-card/60 backdrop-blur border-border hover:border-primary/40 transition-all ${selected ? "ring-2 ring-primary" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            {NIVEL_LABEL[candidato.nivel]} · {candidato.territorio}
          </div>
          <h3 className="text-base font-bold text-foreground truncate mt-0.5">{candidato.nombre}</h3>
          {candidato.cargo_buscado && (
            <p className="text-xs text-muted-foreground truncate">{candidato.cargo_buscado}</p>
          )}
          <div className="flex flex-wrap gap-1 mt-2">
            <Badge variant="outline" className="text-[10px] font-mono">{candidato.partido}</Badge>
            {candidato.tags?.slice(0, 3).map((t) => (
              <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>
            ))}
          </div>
          {candidato.bio_breve && (
            <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{candidato.bio_breve}</p>
          )}
          <div className="flex items-center gap-2 mt-2 text-muted-foreground">
            {candidato.redes?.twitter && <Twitter className="w-3 h-3" />}
            {candidato.redes?.facebook && <Facebook className="w-3 h-3" />}
            {candidato.redes?.instagram && <Instagram className="w-3 h-3" />}
            {candidato.redes?.web && <Globe className="w-3 h-3" />}
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-border/60">
        <div className="flex gap-1.5">
          <Button size="sm" variant="default" onClick={onOpen}>
            <FileSearch className="w-3.5 h-3.5 mr-1" /> Ficha
          </Button>
          <CandidatoForm candidato={candidato} onSaved={onChanged} />
        </div>
        <div className="flex gap-1.5">
          {onToggleSelect && (
            <Button size="sm" variant={selected ? "default" : "outline"} onClick={onToggleSelect}>
              {selected ? "Seleccionado" : "Comparar"}
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={onDelete} className="text-destructive hover:bg-destructive/10">
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

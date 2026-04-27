import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, FileSearch, Twitter, Facebook, Instagram, Globe, AtSign, Cloud, Linkedin, Sparkles, Loader2, CheckCircle2, AlertCircle, Pencil, Star, Swords, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Candidato, TipoAnalisis } from "@/lib/candidatos/types";
import { CandidatoForm } from "./CandidatoForm";
import { PartidoBadges } from "./PartidoBadges";
import { generarTodosLosAnalisis, TIPOS_ANALISIS } from "@/lib/candidatos/auto-analisis";
import { FASE_LABEL_CORTO } from "@/lib/candidatos/fase";
import { generarDossierCortesia } from "@/lib/pdf-cortesia-prospecto";
import { cn } from "@/lib/utils";

interface Props {
  candidato: Candidato;
  onOpen: () => void;
  onDelete: () => void;
  onChanged: () => void;
  selected?: boolean;
  onToggleSelect?: () => void;
  /** Tipos de análisis ya generados para este candidato */
  analisisHechos?: Set<TipoAnalisis>;
}

const NIVEL_LABEL: Record<string, string> = {
  gobernador: "Gobernatura",
  diputados: "Diputado Local",
  ayuntamientos: "Ayuntamiento",
};

const TIPO_LABEL: Record<TipoAnalisis, string> = {
  perfil: "Perfil",
  osint: "OSINT",
  discurso: "Discurso",
  osint_profundo: "OSINT+",
};

export function CandidatoCard({
  candidato,
  onOpen,
  onDelete,
  onChanged,
  selected,
  onToggleSelect,
  analisisHechos,
}: Props) {
  const { toast } = useToast();
  const [generando, setGenerando] = useState(false);

  const hechos = analisisHechos ?? new Set<TipoAnalisis>();
  const totalHechos = hechos.size;
  const completos = totalHechos === TIPOS_ANALISIS.length;
  const sinAnalisis = totalHechos === 0;
  const faltantes = TIPOS_ANALISIS.filter((t) => !hechos.has(t));

  const generarFaltantes = async () => {
    if (faltantes.length === 0) return;
    setGenerando(true);
    try {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData?.user) throw new Error("No autenticado");
      toast({
        title: `Generando ${faltantes.length} análisis…`,
        description: `${candidato.nombre} · ${faltantes.join(", ")}`,
      });
      // Sólo genera los faltantes
      const userId = authData.user.id;
      const { generarYGuardarAnalisis } = await import("@/lib/candidatos/auto-analisis");
      const errores: string[] = [];
      for (const tipo of faltantes) {
        const r = await generarYGuardarAnalisis(
          { ...candidato, redes: candidato.redes as Record<string, string | undefined> },
          tipo,
          userId,
        );
        if (!r.ok) errores.push(tipo);
      }
      if (errores.length === 0) {
        toast({ title: "Análisis completos ✓" });
      } else {
        toast({
          title: `Análisis parcial`,
          description: `Falló: ${errores.join(", ")}`,
          variant: "destructive",
        });
      }
      onChanged();
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "No se pudo generar",
        variant: "destructive",
      });
    } finally {
      setGenerando(false);
    }
  };

  const toggleEsPropio = async () => {
    const nuevo = !candidato.es_propio;
    const { error } = await supabase
      .from("candidatos")
      .update({ es_propio: nuevo })
      .eq("id", candidato.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({
      title: nuevo ? "Marcado como Mi candidato ⭐" : "Movido a Oposición",
      description: nuevo
        ? "Aparecerá destacado en Mando Central y se monitoreará en /inteligencia."
        : "Ya no se monitoreará como candidato propio.",
    });
    onChanged();
  };

  return (
    <Card className={cn(
      "p-4 bg-card/60 backdrop-blur border-border hover:border-primary/40 transition-all relative",
      selected && "ring-2 ring-primary",
      candidato.es_propio ? "border-primary/50" : "border-l-2 border-l-muted-foreground/30",
    )}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground flex items-center gap-1.5 flex-wrap">
            {candidato.es_propio ? (
              <Badge className="text-[9px] px-1.5 py-0 h-4 font-mono uppercase tracking-widest bg-primary/15 text-primary border border-primary/40 hover:bg-primary/25">
                <Star className="w-2.5 h-2.5 mr-1 fill-primary" /> Mío
              </Badge>
            ) : (
              <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 font-mono uppercase tracking-widest text-muted-foreground border-muted-foreground/30">
                <Swords className="w-2.5 h-2.5 mr-1" /> Oposición
              </Badge>
            )}
            <Badge
              variant="outline"
              className={cn(
                "text-[9px] px-1.5 py-0 h-4 font-mono",
                candidato.fase === "aspirante" && "border-violet-500/40 text-violet-400",
                candidato.fase === "precampana" && "border-amber-500/40 text-amber-400",
                candidato.fase === "campana" && "border-primary/40 text-primary",
                candidato.fase === "electo" && "border-emerald-500/40 text-emerald-400",
              )}
            >
              {FASE_LABEL_CORTO[candidato.fase ?? "precampana"]}
            </Badge>
          </div>
          <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mt-1 truncate">
            {NIVEL_LABEL[candidato.nivel]} · {candidato.territorio}
          </div>
          <h3 className="text-base font-bold text-foreground truncate mt-0.5">{candidato.nombre}</h3>
          {candidato.cargo_buscado && (
            <p className="text-xs text-muted-foreground truncate">{candidato.cargo_buscado}</p>
          )}
          <div className="flex flex-wrap items-center gap-1 mt-2">
            <PartidoBadges partido={candidato.partido} />
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
            {candidato.redes?.threads && <AtSign className="w-3 h-3" />}
            {candidato.redes?.bluesky && <Cloud className="w-3 h-3" />}
            {candidato.redes?.linkedin && <Linkedin className="w-3 h-3" />}
            {candidato.redes?.web && <Globe className="w-3 h-3" />}
          </div>
        </div>
      </div>

      {/* Estado de análisis: badges por tipo */}
      <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-border/60 flex-wrap">
        {completos ? (
          <Badge variant="outline" className="text-[10px] border-emerald-500/40 text-emerald-400">
            <CheckCircle2 className="w-3 h-3 mr-1" /> Análisis completos
          </Badge>
        ) : sinAnalisis ? (
          <Badge variant="outline" className="text-[10px] border-amber-500/40 text-amber-400">
            <AlertCircle className="w-3 h-3 mr-1" /> Sin análisis · no comparable
          </Badge>
        ) : (
          <>
            <span className="text-[10px] font-mono text-muted-foreground">
              {totalHechos}/{TIPOS_ANALISIS.length}
            </span>
            {TIPOS_ANALISIS.map((t) => (
              <Badge
                key={t}
                variant="outline"
                className={cn(
                  "text-[9px] px-1.5",
                  hechos.has(t)
                    ? "border-emerald-500/40 text-emerald-400"
                    : "border-muted-foreground/30 text-muted-foreground/60",
                )}
              >
                {TIPO_LABEL[t]}
              </Badge>
            ))}
          </>
        )}
        {!completos && (
          <Button
            size="sm"
            variant="ghost"
            className="ml-auto h-6 px-2 text-[10px]"
            onClick={generarFaltantes}
            disabled={generando}
          >
            {generando ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Sparkles className="w-3 h-3 mr-1" />}
            {sinAnalisis ? "Generar IA" : "Completar"}
          </Button>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 mt-3 flex-wrap">
        <div className="flex gap-1 flex-wrap">
          <Button size="sm" variant="default" onClick={onOpen} className="h-8 px-2.5">
            <FileSearch className="w-3.5 h-3.5 mr-1" /> Ficha
          </Button>
          <CandidatoForm
            candidato={candidato}
            onSaved={onChanged}
            trigger={
              <Button size="sm" variant="outline" className="h-8 px-2.5" title="Corregir datos del candidato">
                <Pencil className="w-3.5 h-3.5 mr-1" /> Corregir
              </Button>
            }
          />
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              try {
                generarDossierCortesia({ candidato });
                toast({
                  title: "Dossier generado ✓",
                  description: `PDF de cortesía para ${candidato.nombre} listo para entregar.`,
                });
              } catch (e) {
                toast({
                  title: "Error al generar PDF",
                  description: e instanceof Error ? e.message : "Intenta de nuevo",
                  variant: "destructive",
                });
              }
            }}
            className="h-8 px-2.5 border-amber-500/40 text-amber-500 hover:bg-amber-500/10 hover:text-amber-400"
            title="PDF ejecutivo de cortesía para entregar al prospecto"
          >
            <FileText className="w-3.5 h-3.5 mr-1" /> Dossier
          </Button>
          {onToggleSelect && (
            <Button
              size="sm"
              variant={selected ? "default" : "outline"}
              onClick={onToggleSelect}
              disabled={sinAnalisis}
              className="h-8 px-2.5"
              title={sinAnalisis ? "Genera análisis primero para poder comparar" : ""}
            >
              {selected ? "Seleccionado" : "Comparar"}
            </Button>
          )}
        </div>
        <div className="flex gap-0.5">
          <Button
            size="icon"
            variant="ghost"
            onClick={toggleEsPropio}
            title={candidato.es_propio ? "Mover a Oposición" : "Marcar como Mi candidato"}
            className={cn(
              "h-8 w-8",
              candidato.es_propio ? "text-primary hover:bg-primary/10" : "text-muted-foreground hover:text-primary"
            )}
          >
            <Star className={cn("w-4 h-4", candidato.es_propio && "fill-primary")} />
          </Button>
          <Button size="icon" variant="ghost" onClick={onDelete} className="h-8 w-8 text-destructive hover:bg-destructive/10" title="Eliminar candidato">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

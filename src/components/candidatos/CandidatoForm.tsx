import { useState, useEffect } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { PARTIDOS_DISPONIBLES, type NivelEstrategia } from "@/data/estrategia-templates";
import { PARTIDO_COLOR, type PartidoSigla } from "@/data/locales/partidos";
import {
  COALICIONES_SUGERIDAS,
  codificarPartido,
  decodificarPartido,
  type TipoCandidatura,
} from "@/lib/candidatos/coaliciones";
import type { Candidato } from "@/lib/candidatos/types";
import { generarTodosLosAnalisis, TIPOS_ANALISIS } from "@/lib/candidatos/auto-analisis";
import { Loader2, Plus, Pencil, X, Sparkles } from "lucide-react";

const schema = z.object({
  nombre: z.string().trim().min(2).max(120),
  nivel: z.enum(["gobernador", "diputados", "ayuntamientos"]),
  territorio: z.string().trim().min(1).max(120),
  cargo_buscado: z.string().trim().max(120).optional(),
  bio_breve: z.string().trim().max(800).optional(),
  twitter: z.string().trim().max(120).optional(),
  facebook: z.string().trim().max(120).optional(),
  instagram: z.string().trim().max(120).optional(),
  web: z.string().trim().max(200).optional(),
  notas: z.string().trim().max(1000).optional(),
});

interface Props {
  candidato?: Candidato;
  onSaved?: () => void;
  trigger?: React.ReactNode;
}

const TIPO_LABEL: Record<TipoCandidatura, string> = {
  partido: "Un solo partido",
  coalicion: "Coalición / Alianza",
  independiente: "Candidato independiente",
  candidatura_unica: "Candidatura única (consenso)",
};

export function CandidatoForm({ candidato, onSaved, trigger }: Props) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [analizando, setAnalizando] = useState<null | { hechos: number; total: number; tipo: string }>(null);
  // Sólo aplica auto-análisis cuando es candidato nuevo (no en edición).
  const [autoAnalizar, setAutoAnalizar] = useState(true);

  const [tipo, setTipo] = useState<TipoCandidatura>("partido");
  const [partidos, setPartidos] = useState<PartidoSigla[]>(["MORENA"]);

  const [form, setForm] = useState({
    nombre: "", nivel: "ayuntamientos" as NivelEstrategia, territorio: "",
    cargo_buscado: "", bio_breve: "", twitter: "", facebook: "", instagram: "", web: "", notas: "",
  });

  useEffect(() => {
    if (candidato && open) {
      const dec = decodificarPartido(candidato.partido);
      setTipo(dec.tipo);
      setPartidos(dec.partidos.length ? dec.partidos : ["MORENA"]);
      setForm({
        nombre: candidato.nombre,
        nivel: candidato.nivel,
        territorio: candidato.territorio,
        cargo_buscado: candidato.cargo_buscado ?? "",
        bio_breve: candidato.bio_breve ?? "",
        twitter: candidato.redes?.twitter ?? "",
        facebook: candidato.redes?.facebook ?? "",
        instagram: candidato.redes?.instagram ?? "",
        web: candidato.redes?.web ?? "",
        notas: candidato.notas ?? "",
      });
    }
  }, [candidato, open]);

  const togglePartido = (p: PartidoSigla) => {
    setPartidos((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));
  };

  const submit = async () => {
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast({ title: "Datos inválidos", description: parsed.error.issues[0]?.message, variant: "destructive" });
      return;
    }
    if (tipo === "partido" && partidos.length !== 1) {
      toast({ title: "Selecciona exactamente un partido", variant: "destructive" });
      return;
    }
    if (tipo === "coalicion" && partidos.length < 2) {
      toast({ title: "Una coalición requiere al menos 2 partidos", variant: "destructive" });
      return;
    }
    if (!user) {
      toast({ title: "Sesión requerida", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData?.user) throw new Error("No autenticado");

      const partidoCodificado = codificarPartido(tipo, partidos);

      const payload = {
        user_id: authData.user.id,
        nombre: parsed.data.nombre,
        partido: partidoCodificado,
        nivel: parsed.data.nivel,
        territorio: parsed.data.territorio,
        cargo_buscado: parsed.data.cargo_buscado || null,
        bio_breve: parsed.data.bio_breve || null,
        redes: {
          twitter: parsed.data.twitter || undefined,
          facebook: parsed.data.facebook || undefined,
          instagram: parsed.data.instagram || undefined,
          web: parsed.data.web || undefined,
        },
        notas: parsed.data.notas || null,
      };

      if (candidato) {
        const { error } = await supabase.from("candidatos").update(payload).eq("id", candidato.id);
        if (error) throw error;
        toast({ title: "Candidato actualizado" });
        setOpen(false);
        onSaved?.();
      } else {
        const { data: inserted, error } = await supabase
          .from("candidatos")
          .insert([payload])
          .select()
          .single();
        if (error) throw error;
        toast({ title: "Candidato registrado" });
        setOpen(false);
        onSaved?.();

        // Auto-análisis (los 3 tipos en serie). No bloquea el cierre del diálogo.
        if (autoAnalizar && inserted) {
          setAnalizando({ hechos: 0, total: TIPOS_ANALISIS.length, tipo: TIPOS_ANALISIS[0] });
          toast({
            title: "Generando análisis IA…",
            description: `Perfil, OSINT y discurso para ${inserted.nombre}. Tarda ~30-60s.`,
          });
          void generarTodosLosAnalisis(
            { ...inserted, redes: (inserted.redes ?? {}) as Record<string, string | undefined> },
            authData.user.id,
            (p) => {
              setAnalizando((prev) => prev && {
                hechos: prev.hechos + 1,
                total: prev.total,
                tipo: p.tipo,
              });
            },
          ).then((resultados) => {
            const errores = resultados.filter((r) => r.estado === "error");
            if (errores.length === 0) {
              toast({
                title: "Análisis listos ✓",
                description: `${inserted.nombre} ya tiene perfil, OSINT y discurso.`,
              });
            } else {
              toast({
                title: `Análisis parcial (${resultados.length - errores.length}/${resultados.length})`,
                description: `Falló: ${errores.map((e) => e.tipo).join(", ")}. Reintenta desde la tarjeta.`,
                variant: "destructive",
              });
            }
            setAnalizando(null);
            onSaved?.();
          });
        }
      }
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "No se pudo guardar",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm">
            {candidato ? <><Pencil className="w-4 h-4 mr-1.5" /> Editar</> : <><Plus className="w-4 h-4 mr-1.5" /> Nuevo candidato</>}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{candidato ? "Editar candidato" : "Registrar candidato"}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
          <div className="md:col-span-2">
            <Label>Nombre completo *</Label>
            <Input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Ej. Alfonso Martínez Alcázar" />
          </div>

          <div className="md:col-span-2">
            <Label>Tipo de candidatura *</Label>
            <Select
              value={tipo}
              onValueChange={(v) => {
                const t = v as TipoCandidatura;
                setTipo(t);
                if (t === "independiente" || t === "candidatura_unica") setPartidos([]);
                if (t === "partido" && partidos.length !== 1) setPartidos([partidos[0] ?? "MORENA"]);
              }}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(TIPO_LABEL) as TipoCandidatura[]).map((t) => (
                  <SelectItem key={t} value={t}>{TIPO_LABEL[t]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {tipo === "partido" && (
            <div className="md:col-span-2">
              <Label>Partido *</Label>
              <Select value={partidos[0] ?? ""} onValueChange={(v) => setPartidos([v as PartidoSigla])}>
                <SelectTrigger><SelectValue placeholder="Selecciona un partido" /></SelectTrigger>
                <SelectContent>
                  {PARTIDOS_DISPONIBLES.map((p) => (<SelectItem key={p} value={p}>{p}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          )}

          {tipo === "coalicion" && (
            <div className="md:col-span-2 space-y-2">
              <Label>Partidos en la coalición * <span className="text-xs text-muted-foreground">(mínimo 2)</span></Label>
              <div className="flex flex-wrap gap-1.5">
                {PARTIDOS_DISPONIBLES.map((p) => {
                  const active = partidos.includes(p);
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => togglePartido(p)}
                      className={`px-2.5 py-1 rounded-md text-xs border font-mono transition-colors ${
                        active ? "text-foreground" : "text-muted-foreground bg-card/40 border-border hover:border-primary/40"
                      }`}
                      style={active ? { backgroundColor: `${PARTIDO_COLOR[p]}30`, borderColor: PARTIDO_COLOR[p] } : undefined}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
              {partidos.length > 0 && (
                <div className="flex flex-wrap items-center gap-1 pt-1">
                  <span className="text-[10px] text-muted-foreground font-mono uppercase mr-1">Resultado:</span>
                  {partidos.map((p) => (
                    <Badge key={p} variant="outline" className="text-[10px] font-mono" style={{ borderColor: `${PARTIDO_COLOR[p]}80`, color: PARTIDO_COLOR[p] }}>
                      {p}
                    </Badge>
                  ))}
                </div>
              )}
              <div>
                <Label className="text-xs text-muted-foreground">Coaliciones sugeridas</Label>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {COALICIONES_SUGERIDAS.map((c) => (
                    <button
                      key={c.etiqueta}
                      type="button"
                      onClick={() => setPartidos(c.partidos)}
                      className="px-2 py-0.5 rounded text-[10px] border border-border hover:border-primary/40 text-muted-foreground hover:text-foreground"
                    >
                      {c.etiqueta}
                    </button>
                  ))}
                  {partidos.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setPartidos([])}
                      className="px-2 py-0.5 rounded text-[10px] border border-border hover:border-destructive/40 text-muted-foreground hover:text-destructive flex items-center gap-1"
                    >
                      <X className="w-3 h-3" /> Limpiar
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {(tipo === "independiente" || tipo === "candidatura_unica") && (
            <div className="md:col-span-2 text-xs text-muted-foreground bg-muted/30 border border-border rounded-md p-2.5">
              {tipo === "independiente"
                ? "Sin partido. La IA tratará al candidato como aspirante independiente, ajustando estrategia de financiamiento, recolección de firmas y construcción de marca personal."
                : "Candidatura de unidad/consenso (típica en planillas únicas locales o procesos sin contienda real). La IA enfocará la estrategia en legitimación, participación y blindaje reputacional."}
            </div>
          )}

          <div>
            <Label>Nivel *</Label>
            <Select value={form.nivel} onValueChange={(v) => setForm({ ...form, nivel: v as NivelEstrategia })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="gobernador">Gobernatura</SelectItem>
                <SelectItem value="diputados">Diputado Local</SelectItem>
                <SelectItem value="ayuntamientos">Ayuntamiento</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Territorio *</Label>
            <Input value={form.territorio} onChange={(e) => setForm({ ...form, territorio: e.target.value })} placeholder="Ej. Morelia / Distrito 10 / Estatal" />
          </div>
          <div className="md:col-span-2">
            <Label>Cargo buscado</Label>
            <Input value={form.cargo_buscado} onChange={(e) => setForm({ ...form, cargo_buscado: e.target.value })} placeholder="Ej. Presidente municipal de Morelia" />
          </div>
          <div className="md:col-span-2">
            <Label>Bio breve</Label>
            <Textarea rows={3} value={form.bio_breve} onChange={(e) => setForm({ ...form, bio_breve: e.target.value })} placeholder="Trayectoria política, cargos previos, base electoral..." />
          </div>
          <div><Label>Twitter / X</Label><Input value={form.twitter} onChange={(e) => setForm({ ...form, twitter: e.target.value })} placeholder="@usuario" /></div>
          <div><Label>Facebook</Label><Input value={form.facebook} onChange={(e) => setForm({ ...form, facebook: e.target.value })} /></div>
          <div><Label>Instagram</Label><Input value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })} /></div>
          <div><Label>Sitio web</Label><Input value={form.web} onChange={(e) => setForm({ ...form, web: e.target.value })} /></div>
          <div className="md:col-span-2">
            <Label>Notas internas</Label>
            <Textarea rows={2} value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} placeholder="Información adicional para enriquecer el análisis IA" />
          </div>
        </div>

        {!candidato && (
          <div className="flex items-start gap-2 p-2.5 rounded-md bg-primary/5 border border-primary/30">
            <input
              id="auto-analizar"
              type="checkbox"
              checked={autoAnalizar}
              onChange={(e) => setAutoAnalizar(e.target.checked)}
              className="mt-0.5 accent-primary"
            />
            <label htmlFor="auto-analizar" className="text-xs cursor-pointer flex-1">
              <span className="font-semibold flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-primary" />
                Generar análisis IA al guardar (recomendado)
              </span>
              <span className="text-muted-foreground">
                Crea automáticamente perfil FODA, OSINT y análisis discursivo. Necesario para que el candidato aparezca con score en el comparador. Tarda ~30-60s en background.
              </span>
            </label>
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={saving || analizando !== null}>
            {(saving || analizando !== null) && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
            {analizando ? `Analizando ${analizando.hechos}/${analizando.total}…` : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

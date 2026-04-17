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
import { PARTIDOS_DISPONIBLES, type NivelEstrategia } from "@/data/estrategia-templates";
import type { Candidato } from "@/lib/candidatos/types";
import { Loader2, Plus, Pencil } from "lucide-react";

const schema = z.object({
  nombre: z.string().trim().min(2).max(120),
  partido: z.string().min(1),
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

export function CandidatoForm({ candidato, onSaved, trigger }: Props) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    nombre: "", partido: "MORENA", nivel: "ayuntamientos" as NivelEstrategia, territorio: "",
    cargo_buscado: "", bio_breve: "", twitter: "", facebook: "", instagram: "", web: "", notas: "",
  });

  useEffect(() => {
    if (candidato && open) {
      setForm({
        nombre: candidato.nombre,
        partido: candidato.partido,
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

  const submit = async () => {
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast({ title: "Datos inválidos", description: parsed.error.issues[0]?.message, variant: "destructive" });
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

      const payload = {
        user_id: authData.user.id,
        nombre: parsed.data.nombre,
        partido: parsed.data.partido,
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
      } else {
        const { error } = await supabase.from("candidatos").insert([payload]);
        if (error) throw error;
        toast({ title: "Candidato registrado" });
      }
      setOpen(false);
      onSaved?.();
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
          <div>
            <Label>Partido *</Label>
            <Select value={form.partido} onValueChange={(v) => setForm({ ...form, partido: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PARTIDOS_DISPONIBLES.map((p) => (<SelectItem key={p} value={p}>{p}</SelectItem>))}
                <SelectItem value="INDEPENDIENTE">INDEPENDIENTE</SelectItem>
              </SelectContent>
            </Select>
          </div>
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
          <div>
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
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

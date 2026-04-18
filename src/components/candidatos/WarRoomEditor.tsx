// Editor del War Room (equipo de campaña conocido) por candidato.
// Captura miembros oficiales y operadores en la sombra, con trayectoria,
// inconsistencias y fuentes. La info se inyecta como contexto verificado a los análisis IA.

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Eye, EyeOff, Building2, User, AlertTriangle, Link as LinkIcon, X, Save } from "lucide-react";
import {
  WAR_ROOM_ROL_LABEL,
  type WarRoomMiembro,
  type WarRoomRol,
} from "@/lib/candidatos/types";

interface Props {
  miembros: WarRoomMiembro[];
  onChange: (next: WarRoomMiembro[]) => Promise<void> | void;
  saving?: boolean;
}

const NUEVO = (): WarRoomMiembro => ({
  id: crypto.randomUUID(),
  nombre: "",
  rol: "consultor_estrategia",
  tipo: "persona",
  visible: true,
  trayectoria_breve: "",
  inconsistencias: [],
  fuentes: [],
  notas_internas: "",
});

export function WarRoomEditor({ miembros, onChange, saving }: Props) {
  const [editando, setEditando] = useState<WarRoomMiembro | null>(null);
  const [borrador, setBorrador] = useState<WarRoomMiembro | null>(null);
  const [nuevaInconsistencia, setNuevaInconsistencia] = useState("");
  const [nuevaFuente, setNuevaFuente] = useState("");

  const abrirNuevo = () => {
    const m = NUEVO();
    setEditando(m);
    setBorrador(m);
  };

  const abrirEditar = (m: WarRoomMiembro) => {
    setEditando(m);
    setBorrador({ ...m, inconsistencias: [...m.inconsistencias], fuentes: [...m.fuentes] });
  };

  const cerrar = () => {
    setEditando(null);
    setBorrador(null);
    setNuevaInconsistencia("");
    setNuevaFuente("");
  };

  const guardar = async () => {
    if (!borrador) return;
    if (!borrador.nombre.trim()) return;
    const existe = miembros.find((m) => m.id === borrador.id);
    const next = existe
      ? miembros.map((m) => (m.id === borrador.id ? borrador : m))
      : [...miembros, borrador];
    await onChange(next);
    cerrar();
  };

  const eliminar = async (id: string) => {
    if (!confirm("¿Eliminar este miembro del War Room?")) return;
    await onChange(miembros.filter((m) => m.id !== id));
  };

  const agregarInconsistencia = () => {
    if (!borrador || !nuevaInconsistencia.trim()) return;
    setBorrador({ ...borrador, inconsistencias: [...borrador.inconsistencias, nuevaInconsistencia.trim()] });
    setNuevaInconsistencia("");
  };

  const quitarInconsistencia = (i: number) => {
    if (!borrador) return;
    setBorrador({ ...borrador, inconsistencias: borrador.inconsistencias.filter((_, idx) => idx !== i) });
  };

  const agregarFuente = () => {
    if (!borrador || !nuevaFuente.trim()) return;
    setBorrador({ ...borrador, fuentes: [...borrador.fuentes, nuevaFuente.trim()] });
    setNuevaFuente("");
  };

  const quitarFuente = (i: number) => {
    if (!borrador) return;
    setBorrador({ ...borrador, fuentes: borrador.fuentes.filter((_, idx) => idx !== i) });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs text-muted-foreground max-w-xl">
          Captura aquí el equipo conocido del candidato, incluidos operadores no oficiales (en la sombra).
          Esta información se usa como <strong className="text-foreground">contexto verificado por ti</strong> para los análisis IA — el modelo NO inventa miembros.
        </p>
        <Button size="sm" onClick={abrirNuevo} disabled={saving}>
          <Plus className="w-4 h-4 mr-1.5" /> Agregar miembro
        </Button>
      </div>

      {miembros.length === 0 ? (
        <Card className="p-6 bg-card/40 border-dashed border-border text-center text-sm text-muted-foreground">
          Aún no hay miembros del War Room registrados. Agrega jefe de campaña, voceros, consultoras y operadores en la sombra.
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {miembros.map((m) => (
            <Card key={m.id} className="p-3 bg-card/60 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {m.tipo === "consultora" ? (
                      <Building2 className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                    ) : (
                      <User className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                    )}
                    <span className="font-semibold text-sm">{m.nombre}</span>
                    {m.visible ? (
                      <Badge variant="outline" className="text-[9px] border-emerald-500/40 text-emerald-400">
                        <Eye className="w-2.5 h-2.5 mr-1" /> Oficial
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[9px] border-amber-500/50 text-amber-400">
                        <EyeOff className="w-2.5 h-2.5 mr-1" /> Operador oculto
                      </Badge>
                    )}
                  </div>
                  <div className="text-[10px] text-muted-foreground font-mono uppercase mt-0.5">
                    {WAR_ROOM_ROL_LABEL[m.rol]}
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => abrirEditar(m)} disabled={saving}>
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => eliminar(m.id)} disabled={saving}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              {m.trayectoria_breve && (
                <p className="text-xs text-muted-foreground">{m.trayectoria_breve}</p>
              )}

              {m.inconsistencias.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {m.inconsistencias.map((inc, i) => (
                    <Badge key={i} variant="outline" className="text-[10px] border-rose-500/40 text-rose-300 max-w-full">
                      <AlertTriangle className="w-2.5 h-2.5 mr-1 shrink-0" />
                      <span className="truncate">{inc}</span>
                    </Badge>
                  ))}
                </div>
              )}

              {m.fuentes.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {m.fuentes.map((f, i) => (
                    <a
                      key={i}
                      href={f}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline truncate max-w-[180px]"
                    >
                      <LinkIcon className="w-2.5 h-2.5 shrink-0" />
                      <span className="truncate">{f.replace(/^https?:\/\//, "")}</span>
                    </a>
                  ))}
                </div>
              )}

              {m.notas_internas && (
                <div className="text-[10px] text-amber-300/80 italic border-t border-border/40 pt-1.5">
                  📝 {m.notas_internas}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!editando} onOpenChange={(v) => !v && cerrar()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {miembros.find((m) => m.id === borrador?.id) ? "Editar miembro" : "Nuevo miembro del War Room"}
            </DialogTitle>
          </DialogHeader>
          {borrador && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 py-2">
              <div className="md:col-span-2">
                <Label>Nombre *</Label>
                <Input
                  value={borrador.nombre}
                  onChange={(e) => setBorrador({ ...borrador, nombre: e.target.value })}
                  placeholder="Ej. Humberto Moreno / Goberna / EME Comunicación"
                />
              </div>

              <div>
                <Label>Rol</Label>
                <Select
                  value={borrador.rol}
                  onValueChange={(v) => setBorrador({ ...borrador, rol: v as WarRoomRol })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(WAR_ROOM_ROL_LABEL) as WarRoomRol[]).map((r) => (
                      <SelectItem key={r} value={r}>{WAR_ROOM_ROL_LABEL[r]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Tipo</Label>
                <Select
                  value={borrador.tipo}
                  onValueChange={(v) => setBorrador({ ...borrador, tipo: v as "persona" | "consultora" })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="persona">Persona</SelectItem>
                    <SelectItem value="consultora">Consultora / Empresa</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-2 flex items-start gap-3 p-2.5 rounded-md bg-secondary/40 border border-border">
                <input
                  type="checkbox"
                  id="wr-visible"
                  checked={borrador.visible}
                  onChange={(e) => setBorrador({ ...borrador, visible: e.target.checked })}
                  className="mt-0.5 h-4 w-4 accent-primary cursor-pointer"
                />
                <div className="flex-1">
                  <Label htmlFor="wr-visible" className="cursor-pointer flex items-center gap-1.5">
                    {borrador.visible ? <Eye className="w-3.5 h-3.5 text-emerald-400" /> : <EyeOff className="w-3.5 h-3.5 text-amber-400" />}
                    Miembro oficial / público
                  </Label>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Desmarca si es un <strong>operador en la sombra</strong> (no aparece en organigrama oficial pero opera de facto).
                  </p>
                </div>
              </div>

              <div className="md:col-span-2">
                <Label>Trayectoria breve</Label>
                <Textarea
                  rows={2}
                  value={borrador.trayectoria_breve ?? ""}
                  onChange={(e) => setBorrador({ ...borrador, trayectoria_breve: e.target.value })}
                  placeholder="Cargos previos, campañas anteriores, vínculos políticos relevantes…"
                />
              </div>

              <div className="md:col-span-2">
                <Label className="flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" /> Inconsistencias / cuestionamientos públicos
                </Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    value={nuevaInconsistencia}
                    onChange={(e) => setNuevaInconsistencia(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); agregarInconsistencia(); } }}
                    placeholder="Ej. Cuestionado por contratos opacos en…"
                  />
                  <Button type="button" variant="outline" onClick={agregarInconsistencia}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {borrador.inconsistencias.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {borrador.inconsistencias.map((inc, i) => (
                      <Badge key={i} variant="outline" className="text-[10px] border-rose-500/40 text-rose-300 gap-1">
                        {inc}
                        <button type="button" onClick={() => quitarInconsistencia(i)} className="hover:text-rose-100">
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="md:col-span-2">
                <Label className="flex items-center gap-1.5">
                  <LinkIcon className="w-3.5 h-3.5 text-primary" /> Fuentes (URLs)
                </Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    value={nuevaFuente}
                    onChange={(e) => setNuevaFuente(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); agregarFuente(); } }}
                    placeholder="https://…"
                  />
                  <Button type="button" variant="outline" onClick={agregarFuente}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {borrador.fuentes.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {borrador.fuentes.map((f, i) => (
                      <Badge key={i} variant="outline" className="text-[10px] gap-1 max-w-[260px]">
                        <LinkIcon className="w-2.5 h-2.5 shrink-0" />
                        <span className="truncate">{f.replace(/^https?:\/\//, "")}</span>
                        <button type="button" onClick={() => quitarFuente(i)} className="hover:text-destructive shrink-0">
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="md:col-span-2">
                <Label>Notas internas (no se envían a la IA salvo que tú lo decidas)</Label>
                <Textarea
                  rows={2}
                  value={borrador.notas_internas ?? ""}
                  onChange={(e) => setBorrador({ ...borrador, notas_internas: e.target.value })}
                  placeholder="Ej. Borrador inicial — completar fuentes antes de usar en estrategia"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={cerrar}>Cancelar</Button>
            <Button onClick={guardar} disabled={!borrador?.nombre.trim() || saving}>
              <Save className="w-4 h-4 mr-1.5" /> Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

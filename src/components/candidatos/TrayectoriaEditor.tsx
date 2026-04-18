// Editor de trayectoria política del candidato.
// Captura hitos verificados (cargos electos, designados, cambios de partido, candidaturas)
// con año, partido, tipo y fuentes. Esta info se usa como contexto duro para los análisis IA.

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
import {
  Plus, Pencil, Trash2, Calendar, Link as LinkIcon, X, Save, ArrowRightLeft,
} from "lucide-react";
import {
  TRAYECTORIA_TIPO_LABEL,
  type TrayectoriaHito,
  type TrayectoriaTipo,
} from "@/lib/candidatos/types";

interface Props {
  hitos: TrayectoriaHito[];
  onChange: (next: TrayectoriaHito[]) => Promise<void> | void;
  saving?: boolean;
}

const NUEVO = (): TrayectoriaHito => ({
  id: crypto.randomUUID(),
  anio: new Date().getFullYear(),
  cargo: "",
  partido: "",
  tipo: "electo",
  descripcion: "",
  fuentes: [],
});

const TIPO_COLOR: Record<TrayectoriaTipo, string> = {
  electo: "border-emerald-500/40 text-emerald-300",
  designado: "border-sky-500/40 text-sky-300",
  candidatura: "border-amber-500/40 text-amber-300",
  cambio_partido: "border-rose-500/40 text-rose-300",
  dirigencia: "border-violet-500/40 text-violet-300",
  otro: "border-border text-muted-foreground",
};

export function TrayectoriaEditor({ hitos, onChange, saving }: Props) {
  const [editando, setEditando] = useState<TrayectoriaHito | null>(null);
  const [borrador, setBorrador] = useState<TrayectoriaHito | null>(null);
  const [nuevaFuente, setNuevaFuente] = useState("");

  const abrirNuevo = () => {
    const h = NUEVO();
    setEditando(h);
    setBorrador(h);
  };

  const abrirEditar = (h: TrayectoriaHito) => {
    setEditando(h);
    setBorrador({ ...h, fuentes: [...h.fuentes] });
  };

  const cerrar = () => {
    setEditando(null);
    setBorrador(null);
    setNuevaFuente("");
  };

  const guardar = async () => {
    if (!borrador) return;
    if (!borrador.cargo.trim()) return;
    const existe = hitos.find((h) => h.id === borrador.id);
    const next = existe
      ? hitos.map((h) => (h.id === borrador.id ? borrador : h))
      : [...hitos, borrador];
    await onChange(next);
    cerrar();
  };

  const eliminar = async (id: string) => {
    if (!confirm("¿Eliminar este hito de la trayectoria?")) return;
    await onChange(hitos.filter((h) => h.id !== id));
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

  // Orden cronológico inverso (más reciente primero)
  const ordenados = [...hitos].sort((a, b) => b.anio - a.anio);

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs text-muted-foreground max-w-xl">
          Historial político <strong className="text-foreground">verificado</strong>: cargos electos, designados,
          candidaturas, cambios de partido. Captura cada hito con año, partido y al menos una fuente.
          Esta es la base dura sobre la que los análisis IA razonan — evita que el modelo invente trayectorias.
        </p>
        <Button size="sm" onClick={abrirNuevo} disabled={saving}>
          <Plus className="w-4 h-4 mr-1.5" /> Agregar hito
        </Button>
      </div>

      {ordenados.length === 0 ? (
        <Card className="p-6 bg-card/40 border-dashed border-border text-center text-sm text-muted-foreground">
          Aún no hay hitos registrados. Agrega cargos previos, candidaturas y cambios de partido relevantes.
        </Card>
      ) : (
        <div className="relative pl-5 space-y-2">
          {/* línea de tiempo */}
          <div className="absolute left-2 top-2 bottom-2 w-px bg-border" />
          {ordenados.map((h) => (
            <Card key={h.id} className="p-3 bg-card/60 relative">
              <div className="absolute -left-3 top-4 w-2 h-2 rounded-full bg-primary" />
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Badge variant="outline" className="font-mono text-[10px]">
                      <Calendar className="w-2.5 h-2.5 mr-1" /> {h.anio}
                    </Badge>
                    <Badge variant="outline" className={`text-[10px] ${TIPO_COLOR[h.tipo]}`}>
                      {h.tipo === "cambio_partido" && <ArrowRightLeft className="w-2.5 h-2.5 mr-1" />}
                      {TRAYECTORIA_TIPO_LABEL[h.tipo]}
                    </Badge>
                    {h.partido && (
                      <Badge variant="secondary" className="text-[10px]">{h.partido}</Badge>
                    )}
                  </div>
                  <div className="font-semibold text-sm mt-1">{h.cargo}</div>
                  {h.descripcion && (
                    <p className="text-xs text-muted-foreground mt-1">{h.descripcion}</p>
                  )}
                  {h.fuentes.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {h.fuentes.map((f, i) => (
                        <a
                          key={i}
                          href={f}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline truncate max-w-[200px]"
                        >
                          <LinkIcon className="w-2.5 h-2.5 shrink-0" />
                          <span className="truncate">{f.replace(/^https?:\/\//, "")}</span>
                        </a>
                      ))}
                    </div>
                  )}
                  {h.fuentes.length === 0 && (
                    <p className="text-[10px] text-amber-300/80 italic mt-1">⚠ Sin fuentes — agregar antes de usar en estrategia.</p>
                  )}
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => abrirEditar(h)} disabled={saving}>
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => eliminar(h.id)} disabled={saving}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!editando} onOpenChange={(v) => !v && cerrar()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {hitos.find((h) => h.id === borrador?.id) ? "Editar hito" : "Nuevo hito de trayectoria"}
            </DialogTitle>
          </DialogHeader>
          {borrador && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 py-2">
              <div>
                <Label>Año *</Label>
                <Input
                  type="number"
                  min={1950}
                  max={new Date().getFullYear() + 5}
                  value={borrador.anio}
                  onChange={(e) => setBorrador({ ...borrador, anio: parseInt(e.target.value, 10) || 0 })}
                />
              </div>

              <div>
                <Label>Tipo</Label>
                <Select
                  value={borrador.tipo}
                  onValueChange={(v) => setBorrador({ ...borrador, tipo: v as TrayectoriaTipo })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(TRAYECTORIA_TIPO_LABEL) as TrayectoriaTipo[]).map((t) => (
                      <SelectItem key={t} value={t}>{TRAYECTORIA_TIPO_LABEL[t]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-2">
                <Label>Cargo / Hito *</Label>
                <Input
                  value={borrador.cargo}
                  onChange={(e) => setBorrador({ ...borrador, cargo: e.target.value })}
                  placeholder="Ej. Presidente Municipal de Morelia / Diputado local Distrito 16 / Salida del PRD"
                />
              </div>

              <div className="md:col-span-2">
                <Label>Partido (en ese momento)</Label>
                <Input
                  value={borrador.partido ?? ""}
                  onChange={(e) => setBorrador({ ...borrador, partido: e.target.value })}
                  placeholder="Ej. PAN / Independiente / MORENA"
                />
              </div>

              <div className="md:col-span-2">
                <Label>Descripción / contexto</Label>
                <Textarea
                  rows={2}
                  value={borrador.descripcion ?? ""}
                  onChange={(e) => setBorrador({ ...borrador, descripcion: e.target.value })}
                  placeholder="Ej. Primer alcalde independiente de la capital. Reelecto en 2021 por el PAN."
                />
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
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={cerrar}>Cancelar</Button>
            <Button onClick={guardar} disabled={!borrador?.cargo.trim() || saving}>
              <Save className="w-4 h-4 mr-1.5" /> Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

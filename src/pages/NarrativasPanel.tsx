import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Megaphone, Copy, Check, Trash2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

interface Narrativa {
  id: string;
  entidad_nombre: string;
  contexto: string;
  tipo: string;
  mensaje: string;
  tono: string | null;
  plataforma: string | null;
  urgencia: number;
  emocion_objetivo: string | null;
  usado: boolean;
  created_at: string;
}

const TIPO_COLOR: Record<string, string> = {
  defensivo: "bg-blue-500/20 text-blue-300 border-blue-500/40",
  contraste: "bg-orange-500/20 text-orange-300 border-orange-500/40",
  pivote: "bg-purple-500/20 text-purple-300 border-purple-500/40",
  oportunidad: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
  contranarrativa: "bg-rose-500/20 text-rose-300 border-rose-500/40",
};

export default function NarrativasPanel() {
  const [list, setList] = useState<Narrativa[]>([]);
  const [loading, setLoading] = useState(true);
  const [generando, setGenerando] = useState(false);
  const [entidad, setEntidad] = useState("");
  const [contexto, setContexto] = useState("");

  const cargar = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("narrativas_sugeridas")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(60);
    setList((data ?? []) as Narrativa[]);
    setLoading(false);
  };

  useEffect(() => {
    cargar();
  }, []);

  const generar = async () => {
    if (!entidad.trim() || !contexto.trim()) {
      toast({ title: "Faltan datos", description: "Indica entidad y contexto.", variant: "destructive" });
      return;
    }
    setGenerando(true);
    const { error } = await supabase.functions.invoke("generar-narrativa-accionable", {
      body: { entidad_nombre: entidad, contexto, territorio: "Michoacán" },
    });
    setGenerando(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    setEntidad("");
    setContexto("");
    cargar();
  };

  const copiar = (texto: string) => {
    navigator.clipboard.writeText(texto);
    toast({ title: "Copiado al portapapeles" });
  };

  const marcarUsado = async (id: string, usado: boolean) => {
    await supabase.from("narrativas_sugeridas").update({ usado: !usado }).eq("id", id);
    cargar();
  };

  const eliminar = async (id: string) => {
    await supabase.from("narrativas_sugeridas").delete().eq("id", id);
    cargar();
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Megaphone className="w-5 h-5 text-emerald-400" />
          Narrativas Accionables · Datos a Mensajes
        </h2>
        <p className="text-xs text-muted-foreground">
          Genera mensajes listos para publicar (defensivos, contraste, pivote, oportunidad o contranarrativa) a partir de un contexto.
        </p>
      </div>

      <Card className="p-4 bg-card/50 backdrop-blur border-border/50 space-y-3">
        <Input
          placeholder="Entidad (ej. Bedolla, MORENA, Uruapan)"
          value={entidad}
          onChange={(e) => setEntidad(e.target.value)}
        />
        <Textarea
          placeholder="Contexto: ¿qué pasó, qué tema, qué emoción domina? (ej. 'Indignación creciente por inseguridad en Tierra Caliente tras emboscada')"
          value={contexto}
          onChange={(e) => setContexto(e.target.value)}
          rows={3}
        />
        <Button onClick={generar} disabled={generando} className="w-full">
          {generando ? "Generando…" : "Generar mensajes"}
        </Button>
      </Card>

      {loading ? (
        <p className="text-sm text-muted-foreground">Cargando…</p>
      ) : list.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          Aún no hay narrativas guardadas. Genera la primera arriba o desde una alerta CIB.
        </Card>
      ) : (
        <div className="grid gap-3">
          {list.map((n) => (
            <Card key={n.id} className={`p-4 bg-card/50 backdrop-blur border-border/50 ${n.usado ? "opacity-60" : ""}`}>
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <Badge className={TIPO_COLOR[n.tipo]}>{n.tipo}</Badge>
                {n.tono && <Badge variant="outline" className="text-[10px]">{n.tono}</Badge>}
                {n.plataforma && <Badge variant="outline" className="text-[10px]">{n.plataforma}</Badge>}
                <Badge variant="outline" className="text-[10px]">urgencia {n.urgencia}/5</Badge>
                <span className="text-[10px] text-muted-foreground ml-auto">{n.entidad_nombre}</span>
              </div>
              <p className="text-sm leading-relaxed">{n.mensaje}</p>
              <div className="flex items-center gap-2 mt-3">
                <Button size="sm" variant="ghost" onClick={() => copiar(n.mensaje)}>
                  <Copy className="w-3 h-3 mr-1" /> Copiar
                </Button>
                <Button size="sm" variant="ghost" onClick={() => marcarUsado(n.id, n.usado)}>
                  <Check className="w-3 h-3 mr-1" /> {n.usado ? "Marcar pendiente" : "Marcar usado"}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => eliminar(n.id)} className="ml-auto text-destructive">
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

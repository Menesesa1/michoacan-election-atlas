import { useEffect, useState, type ComponentType } from "react";
import { Sparkles, Send, CheckCircle2, Loader2, Lock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type ModuloKey = "territorial" | "crm" | "dia_d" | "encuestas";

export interface Capacidad {
  icon: ComponentType<{ className?: string }>;
  titulo: string;
  detalle: string;
}

export interface ModuloProximamenteProps {
  moduloKey: ModuloKey;
  eyebrow: string;
  titulo: string;
  tagline: string;
  porQue: string;
  capacidades: Capacidad[];
  acentoClass?: string; // gradiente de hero
}

export function ModuloProximamente({
  moduloKey,
  eyebrow,
  titulo,
  tagline,
  porQue,
  capacidades,
  acentoClass = "from-primary/20 via-primary/5 to-transparent",
}: ModuloProximamenteProps) {
  const { user } = useAuth();
  const [yaSolicitado, setYaSolicitado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [cargandoEstado, setCargandoEstado] = useState(true);

  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState(user?.email ?? "");
  const [organizacion, setOrganizacion] = useState("");
  const [cargo, setCargo] = useState("");
  const [prioridad, setPrioridad] = useState(4);
  const [comentario, setComentario] = useState("");

  useEffect(() => {
    let cancelado = false;
    if (!user) {
      setCargandoEstado(false);
      return;
    }
    setEmail(user.email ?? "");
    (async () => {
      const { data } = await supabase
        .from("solicitudes_acceso_anticipado")
        .select("id")
        .eq("user_id", user.id)
        .eq("modulo", moduloKey)
        .limit(1)
        .maybeSingle();
      if (cancelado) return;
      setYaSolicitado(!!data);
      setCargandoEstado(false);
    })();
    return () => {
      cancelado = true;
    };
  }, [user, moduloKey]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Necesitas iniciar sesión para solicitar acceso");
      return;
    }
    if (!nombre.trim() || !email.trim()) {
      toast.error("Nombre y email son obligatorios");
      return;
    }
    setEnviando(true);
    const { error } = await supabase.from("solicitudes_acceso_anticipado").insert({
      user_id: user.id,
      modulo: moduloKey,
      nombre: nombre.trim(),
      email: email.trim(),
      organizacion: organizacion.trim() || null,
      cargo: cargo.trim() || null,
      prioridad_percibida: prioridad,
      comentario: comentario.trim() || null,
    });
    setEnviando(false);
    if (error) {
      toast.error("No se pudo registrar la solicitud", { description: error.message });
      return;
    }
    setYaSolicitado(true);
    toast.success("Solicitud registrada", {
      description: "Te contactaremos cuando este módulo esté listo.",
    });
  };

  return (
    <div className="space-y-5">
      {/* Hero */}
      <Card className={`relative overflow-hidden p-6 md:p-8 bg-gradient-to-br ${acentoClass} border-primary/20`}>
        <div className="absolute top-3 right-3 flex items-center gap-2">
          <Badge variant="outline" className="bg-primary/15 text-primary border-primary/40 font-mono text-[10px] uppercase tracking-widest">
            <Sparkles className="w-3 h-3 mr-1" /> Próximamente
          </Badge>
        </div>
        <div className="text-primary text-[10px] font-mono uppercase tracking-widest mb-1">{eyebrow}</div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">{titulo}</h1>
        <p className="text-sm md:text-base text-muted-foreground max-w-2xl">{tagline}</p>
      </Card>

      {/* Capacidades */}
      <div>
        <div className="text-xs font-mono uppercase tracking-widest text-primary mb-3">Qué incluirá</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {capacidades.map((cap) => (
            <Card key={cap.titulo} className="p-4 bg-card/60 border-border/60 hover:border-primary/40 transition-colors">
              <div className="flex items-start gap-3">
                <div className="rounded-md bg-primary/10 p-2 text-primary shrink-0">
                  <cap.icon className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground">{cap.titulo}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{cap.detalle}</div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Por qué */}
      <Card className="p-5 bg-muted/30 border-border/60">
        <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2">Por qué este módulo</div>
        <p className="text-sm text-foreground/90 leading-relaxed">{porQue}</p>
      </Card>

      {/* CTA */}
      <Card className="p-5 md:p-6 border-primary/30 bg-card">
        <div className="flex items-center gap-2 mb-4">
          <Lock className="w-4 h-4 text-primary" />
          <h2 className="text-base font-semibold">Solicitar acceso anticipado</h2>
        </div>

        {cargandoEstado ? (
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Verificando estado…
          </div>
        ) : yaSolicitado ? (
          <div className="flex items-start gap-3 rounded-md border border-primary/30 bg-primary/10 p-4">
            <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-semibold text-foreground">Ya solicitaste acceso a este módulo</div>
              <div className="text-xs text-muted-foreground mt-1">
                Te avisaremos en cuanto esté disponible. Si quieres actualizar tu prioridad o agregar contexto, contáctanos directamente.
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor={`${moduloKey}-nombre`} className="text-xs">Nombre *</Label>
              <Input
                id={`${moduloKey}-nombre`}
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Tu nombre completo"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`${moduloKey}-email`} className="text-xs">Email *</Label>
              <Input
                id={`${moduloKey}-email`}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`${moduloKey}-org`} className="text-xs">Organización / Partido</Label>
              <Input
                id={`${moduloKey}-org`}
                value={organizacion}
                onChange={(e) => setOrganizacion(e.target.value)}
                placeholder="Opcional"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`${moduloKey}-cargo`} className="text-xs">Cargo / Rol</Label>
              <Input
                id={`${moduloKey}-cargo`}
                value={cargo}
                onChange={(e) => setCargo(e.target.value)}
                placeholder="Opcional"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Qué tan prioritario es para ti</Label>
                <span className="text-xs font-mono text-primary">{prioridad}/5</span>
              </div>
              <Slider
                value={[prioridad]}
                onValueChange={(v) => setPrioridad(v[0])}
                min={1}
                max={5}
                step={1}
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor={`${moduloKey}-coment`} className="text-xs">Caso de uso o comentario</Label>
              <Textarea
                id={`${moduloKey}-coment`}
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
                rows={3}
                placeholder="¿Para qué campaña/elección lo necesitas? ¿Qué resolverías con esto?"
              />
            </div>
            <div className="md:col-span-2 flex justify-end">
              <Button type="submit" disabled={enviando} className="gap-2">
                {enviando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {enviando ? "Enviando…" : "Solicitar acceso anticipado"}
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}

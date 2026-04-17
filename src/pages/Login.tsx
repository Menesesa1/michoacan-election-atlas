import { useState, FormEvent } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { z } from "zod";
import { Lock, User, ShieldCheck, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { EmeLogo } from "@/components/EmeLogo";

const schema = z.object({
  username: z.string().trim().min(2, "Usuario requerido").max(60),
  password: z.string().min(4, "Contraseña requerida").max(120),
});

export default function Login() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname || "/mando";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated) {
    navigate(from, { replace: true });
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const parsed = schema.safeParse({ username, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message || "Datos inválidos");
      return;
    }
    setSubmitting(true);
    const res = login(parsed.data.username, parsed.data.password);
    setSubmitting(false);
    if (!res.ok) {
      setError(res.error || "Error al iniciar sesión");
      return;
    }
    navigate(from, { replace: true });
  };

  return (
    <div className="min-h-screen w-full grid lg:grid-cols-2 executive-gradient">
      {/* Branding */}
      <aside className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-[hsl(217,60%,10%)] to-[hsl(217,50%,16%)] border-r border-primary/20">
        <EmeLogo size={56} />
        <div className="space-y-6">
          <h1 className="text-5xl font-extrabold leading-[1.05] tracking-tight">
            Sistema de <span className="text-gradient-gold">Mando Estratégico</span>
            <br />
            <span className="text-foreground">Michoacán 360</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-md leading-relaxed">
            Inteligencia política, electoral y demográfica en una sola plataforma.
            Datos en tiempo real para decisiones estratégicas.
          </p>
          <div className="flex items-center gap-2 text-primary text-sm font-mono uppercase tracking-widest">
            <span className="h-px w-10 bg-primary" />
            Movemos realidades
          </div>
        </div>
        <div className="text-[10px] text-muted-foreground font-mono">
          © {new Date().getFullYear()} EME Gabinete Estratégico · Acceso restringido
        </div>
      </aside>

      {/* Form */}
      <main className="flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md space-y-8">
          <div className="lg:hidden flex justify-center">
            <EmeLogo size={64} showText />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-primary text-xs font-mono uppercase tracking-widest">
              <ShieldCheck className="w-3.5 h-3.5" />
              Acceso seguro
            </div>
            <h2 className="text-3xl font-bold text-foreground">Iniciar sesión</h2>
            <p className="text-sm text-muted-foreground">
              Ingrese sus credenciales para acceder al sistema de mando.
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-5 executive-panel p-6 gold-border">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Usuario
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="username"
                  type="text"
                  autoComplete="username"
                  placeholder="admin"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-9 bg-background/40 border-border focus-visible:ring-primary"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Contraseña
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 bg-background/40 border-border focus-visible:ring-primary"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 text-xs text-destructive bg-destructive/10 border border-destructive/30 rounded-md px-3 py-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <Button
              type="submit"
              disabled={submitting}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold tracking-wide glow-primary"
            >
              {submitting ? "Verificando…" : "Acceder al sistema"}
            </Button>

            <div className="text-[10px] text-muted-foreground font-mono text-center pt-2 border-t border-border/50">
              Demo: <span className="text-primary">admin</span> / <span className="text-primary">eme2025</span>
            </div>
          </form>

          <p className="text-[10px] text-center text-muted-foreground/70 font-mono">
            Acceso monitoreado · Uso exclusivo del Gabinete Estratégico
          </p>
        </div>
      </main>
    </div>
  );
}

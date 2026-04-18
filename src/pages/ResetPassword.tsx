import { useEffect, useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, ShieldCheck, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { EmeLogo } from "@/components/EmeLogo";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Supabase coloca el token en el hash; onAuthStateChange dispara PASSWORD_RECOVERY.
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setReady(true);
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError("Mínimo 6 caracteres");
      return;
    }
    if (password !== confirm) {
      setError("Las contraseñas no coinciden");
      return;
    }
    setSubmitting(true);
    const { error: updErr } = await supabase.auth.updateUser({ password });
    setSubmitting(false);
    if (updErr) {
      setError(updErr.message);
      return;
    }
    setDone(true);
    setTimeout(() => navigate("/mando", { replace: true }), 1500);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center executive-gradient p-6">
      <div className="w-full max-w-md space-y-8">
        <div className="flex justify-center">
          <EmeLogo size={56} showText />
        </div>
        <div className="space-y-2 text-center">
          <div className="inline-flex items-center gap-2 text-primary text-xs font-mono uppercase tracking-widest">
            <ShieldCheck className="w-3.5 h-3.5" />
            Restablecer contraseña
          </div>
          <h2 className="text-3xl font-bold text-foreground">Nueva contraseña</h2>
          <p className="text-sm text-muted-foreground">
            Define una nueva contraseña para tu cuenta.
          </p>
        </div>

        {!ready && !done && (
          <div className="executive-panel p-6 text-center text-sm text-muted-foreground">
            Validando enlace de recuperación…
          </div>
        )}

        {ready && !done && (
          <form onSubmit={onSubmit} className="space-y-5 executive-panel p-6 gold-border">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Nueva contraseña
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 bg-background/40 border-border focus-visible:ring-primary"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Confirmar contraseña
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="confirm"
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
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
              {submitting ? "Guardando…" : "Guardar contraseña"}
            </Button>
          </form>
        )}

        {done && (
          <div className="executive-panel p-6 flex items-start gap-3 text-sm">
            <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-foreground">Contraseña actualizada</div>
              <div className="text-xs text-muted-foreground mt-1">
                Redirigiendo al sistema de mando…
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

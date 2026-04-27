import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  loading: boolean;
  /**
   * Inicia sesión con email + password. Si la cuenta no existe, intenta crearla
   * (signup) y entrar inmediatamente — flujo demo con auto-confirm activo.
   */
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    // Subscribirse PRIMERO para no perder eventos durante la hidratación.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      if (!active) return;
      setSession(sess);
      setUser(sess?.user ?? null);
      setLoading(false);
    });
    // Luego hidratar la sesión existente.
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setUser(data.session?.user ?? null);
    }).catch(() => {
      if (!active) return;
      setSession(null);
      setUser(null);
    }).finally(() => {
      if (!active) return;
      setLoading(false);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    const emailNorm = email.trim().toLowerCase();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: emailNorm,
      password,
    });
    if (!signInError) return { ok: true };

    // Si el usuario no existe, intenta crearlo (auto-confirm activo en Cloud).
    const msg = signInError.message?.toLowerCase() ?? "";
    const looksMissing =
      msg.includes("invalid login") ||
      msg.includes("invalid credentials") ||
      msg.includes("user not found");
    if (!looksMissing) return { ok: false, error: signInError.message };

    const { error: signUpError } = await supabase.auth.signUp({
      email: emailNorm,
      password,
      options: { emailRedirectTo: window.location.origin },
    });
    if (signUpError) return { ok: false, error: signUpError.message };

    // Reintenta sign-in (si auto-confirm está activo, ya hay sesión inmediata).
    const { error: retryError } = await supabase.auth.signInWithPassword({
      email: emailNorm,
      password,
    });
    if (retryError) return { ok: false, error: retryError.message };
    return { ok: true };
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isAuthenticated: !!session,
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

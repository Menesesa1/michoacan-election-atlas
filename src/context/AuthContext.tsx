import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";

export type AppRole = "admin" | "analista" | "cliente";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  loading: boolean;
  roles: AppRole[];
  rolesLoading: boolean;
  hasRole: (role: AppRole) => boolean;
  isAdmin: boolean;
  /** Inicia sesión con email + password. El registro abierto está deshabilitado: solo admins crean cuentas. */
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);

  const loadRoles = useCallback(async (uid: string | null) => {
    if (!uid) {
      setRoles([]);
      return;
    }
    setRolesLoading(true);
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", uid);
      if (error) {
        console.warn("[auth] roles fetch error:", error.message);
        setRoles([]);
      } else {
        setRoles((data ?? []).map((r) => r.role as AppRole));
      }
    } finally {
      setRolesLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    // Subscribirse PRIMERO para no perder eventos durante la hidratación.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      if (!active) return;
      setSession(sess);
      setUser(sess?.user ?? null);
      setLoading(false);
      // Defer la carga de roles para evitar deadlocks dentro del callback.
      setTimeout(() => {
        if (!active) return;
        loadRoles(sess?.user?.id ?? null);
      }, 0);
    });
    // Luego hidratar la sesión existente.
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setUser(data.session?.user ?? null);
      loadRoles(data.session?.user?.id ?? null);
    }).catch(() => {
      if (!active) return;
      setSession(null);
      setUser(null);
      setRoles([]);
    }).finally(() => {
      if (!active) return;
      setLoading(false);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [loadRoles]);

  const login = async (email: string, password: string) => {
    const emailNorm = email.trim().toLowerCase();
    const { error } = await supabase.auth.signInWithPassword({
      email: emailNorm,
      password,
    });
    if (error) {
      return { ok: false, error: error.message };
    }
    return { ok: true };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setRoles([]);
  };

  const hasRole = useCallback((role: AppRole) => roles.includes(role), [roles]);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isAuthenticated: !!session,
        loading,
        roles,
        rolesLoading,
        hasRole,
        isAdmin: roles.includes("admin"),
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

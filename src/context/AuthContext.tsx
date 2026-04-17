import { createContext, useContext, useEffect, useState, ReactNode } from "react";

interface AuthUser {
  username: string;
  loggedAt: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => { ok: boolean; error?: string };
  logout: () => void;
}

const STORAGE_KEY = "eme_auth_user";

// Demo credentials — client-side only. Replace with real backend auth later.
const DEMO_USER = "admin";
const DEMO_PASS = "eme2025";

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setUser(JSON.parse(raw));
    } catch {
      // ignore
    }
  }, []);

  const login = (username: string, password: string) => {
    if (username.trim().toLowerCase() === DEMO_USER && password === DEMO_PASS) {
      const u: AuthUser = { username: username.trim(), loggedAt: new Date().toISOString() };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
      setUser(u);
      return { ok: true };
    }
    return { ok: false, error: "Credenciales inválidas. Verifique usuario y contraseña." };
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

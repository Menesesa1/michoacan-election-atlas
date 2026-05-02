import { Navigate } from "react-router-dom";
import { ReactNode } from "react";
import { useAuth, type AppRole } from "@/context/AuthContext";

interface RequireRoleProps {
  roles: AppRole[];
  children: ReactNode;
  /** Ruta a la que redirigir si no tiene el rol. Default: /mando */
  fallback?: string;
}

export function RequireRole({ roles, children, fallback = "/mando" }: RequireRoleProps) {
  const { isAuthenticated, loading, rolesLoading, hasRole } = useAuth();

  if (loading || rolesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-xs font-mono text-muted-foreground">
        Verificando permisos…
      </div>
    );
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  const permitido = roles.some((r) => hasRole(r));
  if (!permitido) {
    return <Navigate to={fallback} replace />;
  }
  return <>{children}</>;
}

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole, type AppRole } from "@/hooks/useUserRole";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: AppRole[];
  requiredPermissions?: string[];
  redirectTo?: string;
}

export function ProtectedRoute({ 
  children, 
  requiredRoles,
  requiredPermissions,
  redirectTo = "/auth" 
}: ProtectedRouteProps) {
  const { user, loading: authLoading } = useAuth();
  const { roles, loading: rolesLoading, hasAnyRole, hasAnyPermission } = useUserRole();
  const navigate = useNavigate();
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    if (authLoading || rolesLoading) return;

    // Not authenticated
    if (!user) {
      navigate("/auth");
      return;
    }

    // No access requirements - just need to be authenticated
    if ((!requiredRoles || requiredRoles.length === 0) && (!requiredPermissions || requiredPermissions.length === 0)) {
      setAuthorized(true);
      return;
    }

    // Check permissions first if provided
    if (requiredPermissions && requiredPermissions.length > 0) {
      if (hasAnyPermission(requiredPermissions)) {
        setAuthorized(true);
        return;
      }
    }

    // Check if user has required roles
    if (requiredRoles && requiredRoles.length > 0 && hasAnyRole(requiredRoles)) {
      setAuthorized(true);
    } else {
      // Redirect based on user's actual role
      if (roles.includes("enseignant") || roles.includes("eleve") || roles.includes("parent")) {
        navigate("/");
      } else {
        navigate(redirectTo);
      }
      setAuthorized(false);
    }
  }, [
    user,
    authLoading,
    rolesLoading,
    roles,
    requiredRoles,
    requiredPermissions,
    navigate,
    redirectTo,
    hasAnyRole,
    hasAnyPermission,
  ]);

  if (authLoading || rolesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-neutral mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user || authorized === false) {
    return null;
  }

  if (
    authorized === null &&
    ((requiredRoles && requiredRoles.length > 0) || (requiredPermissions && requiredPermissions.length > 0))
  ) {
    return null;
  }

  return <>{children}</>;
}

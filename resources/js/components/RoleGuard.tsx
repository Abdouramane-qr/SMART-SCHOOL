import { ReactNode } from "react";
import { useUserRole, type AppRole } from "@/hooks/useUserRole";

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles: AppRole[];
  fallback?: ReactNode;
}

/**
 * RoleGuard component - Conditionally renders children based on user roles
 * Use this for hiding/showing UI elements based on role
 */
export function RoleGuard({ children, allowedRoles, fallback = null }: RoleGuardProps) {
  const { roles, loading, hasAnyRole } = useUserRole();

  // While loading, don't render anything to prevent flash
  if (loading) {
    return null;
  }

  // If user has any of the allowed roles, render children
  if (allowedRoles.length === 0 || hasAnyRole(allowedRoles)) {
    return <>{children}</>;
  }

  // Otherwise render fallback
  return <>{fallback}</>;
}

/**
 * Hook to check roles in components
 */
export function useRoleCheck() {
  const { roles, loading, hasRole, hasAnyRole, isAdmin, isStaff } = useUserRole();

  const canAccessAdmin = () => hasRole("admin");
  const canAccessManagement = () => hasAnyRole(["admin", "comptable"]);
  const canAccessTeacher = () => hasAnyRole(["admin", "enseignant"]);
  const canAccessStudent = () => hasAnyRole(["admin", "eleve"]);
  const canAccessParent = () => hasAnyRole(["admin", "parent"]);

  return {
    roles,
    loading,
    hasRole,
    hasAnyRole,
    isAdmin,
    isStaff,
    canAccessAdmin,
    canAccessManagement,
    canAccessTeacher,
    canAccessStudent,
    canAccessParent,
  };
}


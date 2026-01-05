import { ReactNode } from "react";
import { useUserRole, type AppRole } from "@/hooks/useUserRole";

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles: AppRole[];
  allowedPermissions?: string[];
  fallback?: ReactNode;
}

/**
 * RoleGuard component - Conditionally renders children based on user roles
 * Use this for hiding/showing UI elements based on role
 */
export function RoleGuard({ children, allowedRoles, allowedPermissions, fallback = null }: RoleGuardProps) {
  const { loading, hasAnyRole, hasAnyPermission } = useUserRole();

  // While loading, don't render anything to prevent flash
  if (loading) {
    return null;
  }

  // If user has any of the allowed permissions, render children
  if (allowedPermissions && allowedPermissions.length > 0 && hasAnyPermission(allowedPermissions)) {
    return <>{children}</>;
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

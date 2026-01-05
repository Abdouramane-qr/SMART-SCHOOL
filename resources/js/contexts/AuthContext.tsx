import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { laravelAuthApi, type LaravelUser } from "@/services/laravelAuthApi";
import type { AppRole } from "@/hooks/useUserRole";

interface AuthContextType {
  user: LaravelUser | null;
  loading: boolean;
  roles: AppRole[];
  rolesLoading: boolean;
  hasRole: (role: AppRole) => boolean;
  hasAnyRole: (roles: AppRole[]) => boolean;
  isAdmin: () => boolean;
  isStaff: () => boolean;
  signOut: () => Promise<void>;
  refetchRoles: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<LaravelUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [rolesLoading, setRolesLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const normalizeRoles = (rawRoles: string[] | undefined) => {
      const mapped = (rawRoles || []).map((role) => {
        if (role === "super_admin" || role === "admin_ecole") {
          return "admin";
        }
        return role;
      });
      return mapped as AppRole[];
    };

    const loadUser = async () => {
      try {
        const currentUser = await laravelAuthApi.me();
        if (!mounted) return;
        setUser(currentUser);
        setRoles(normalizeRoles(currentUser?.roles));
      } catch (error) {
        if (!mounted) return;
        setUser(null);
        setRoles([]);
      } finally {
        if (mounted) {
          setLoading(false);
          setRolesLoading(false);
        }
      }
    };

    loadUser();

    return () => {
      mounted = false;
    };
  }, []);

  const fetchRoles = async () => {
    try {
      const currentUser = await laravelAuthApi.me();
      setUser(currentUser);
      const mapped = (currentUser?.roles || []).map((role) => {
        if (role === "super_admin" || role === "admin_ecole") {
          return "admin";
        }
        return role;
      });
      setRoles(mapped as AppRole[]);
    } catch (error) {
      if (import.meta.env.DEV) console.error("Error fetching roles:", error);
      setUser(null);
      setRoles([]);
    } finally {
      setRolesLoading(false);
    }
  };

  const hasRole = (role: AppRole) => roles.includes(role);
  
  const hasAnyRole = (requiredRoles: AppRole[]) => 
    requiredRoles.some(role => roles.includes(role));

  const isAdmin = () => hasRole("admin");
  const isStaff = () => hasAnyRole(["admin", "comptable", "enseignant"]);

  const signOut = async () => {
    await laravelAuthApi.logout();
    setUser(null);
    setRoles([]);
  };

  const refetchRoles = async () => {
    if (user) {
      setRolesLoading(true);
      await fetchRoles();
    }
  };

  const refreshSession = async () => {
    setRolesLoading(true);
    await fetchRoles();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        roles,
        rolesLoading,
        hasRole,
        hasAnyRole,
        isAdmin,
        isStaff,
        signOut,
        refetchRoles,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
}

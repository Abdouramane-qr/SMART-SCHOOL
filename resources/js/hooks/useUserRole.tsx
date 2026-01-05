import { useEffect, useState } from "react";
import { useAuth } from "./useAuth";
import { laravelAuthApi } from "@/services/laravelAuthApi";

export type AppRole = "admin" | "comptable" | "enseignant" | "eleve" | "parent";

export function useUserRole() {
  const { user } = useAuth();
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchRoles();
    } else {
      setRoles([]);
      setLoading(false);
    }
  }, [user]);

  const fetchRoles = async () => {
    try {
      const me = await laravelAuthApi.me();
      const mapped = (me?.roles || []).map((role) => {
        if (role === "super_admin" || role === "admin_ecole") {
          return "admin";
        }
        return role;
      });
      setRoles(mapped as AppRole[]);
    } catch (error) {
      if (import.meta.env.DEV) console.error("Error fetching roles:", error);
      setRoles([]);
    } finally {
      setLoading(false);
    }
  };

  const hasRole = (role: AppRole) => roles.includes(role);
  
  const hasAnyRole = (requiredRoles: AppRole[]) => 
    requiredRoles.some(role => roles.includes(role));

  const isAdmin = () => hasRole("admin");
  const isStaff = () => hasAnyRole(["admin", "comptable", "enseignant"]);

  return { roles, loading, hasRole, hasAnyRole, isAdmin, isStaff, refetch: fetchRoles };
}

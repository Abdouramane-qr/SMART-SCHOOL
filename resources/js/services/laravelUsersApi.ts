import { apiRequest, unwrapData } from "@/services/laravelApi";
import type { LaravelUser } from "@/services/laravelAuthApi";

export type LaravelRole = "admin" | "comptable" | "enseignant" | "eleve" | "parent" | "super_admin" | "admin_ecole";

export const laravelUsersApi = {
  getAll: async (): Promise<LaravelUser[]> => {
    const payload = await apiRequest<any>("/users");
    const { data } = unwrapData<LaravelUser[]>(payload);
    return data || [];
  },
  create: async (payload: {
    email: string;
    password: string;
    full_name: string;
    phone?: string | null;
    role?: string;
    roles?: string[];
  }): Promise<LaravelUser> => {
    const response = await apiRequest<any>("/users", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    const { data } = unwrapData<LaravelUser>(response);
    return data;
  },
  update: async (id: number, payload: Record<string, unknown>): Promise<LaravelUser> => {
    const response = await apiRequest<any>(`/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    const { data } = unwrapData<LaravelUser>(response);
    return data;
  },
  delete: async (id: number): Promise<void> => {
    await apiRequest(`/users/${id}`, { method: "DELETE" });
  },
};

export const laravelRolesApi = {
  getAll: async (): Promise<string[]> => {
    const payload = await apiRequest<any>("/roles");
    const { data } = unwrapData<string[]>(payload);
    return data || [];
  },
  assignRole: async (payload: { user_id: number; role: string }): Promise<void> => {
    await apiRequest("/user-roles", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  removeRole: async (payload: { user_id: number; role: string }): Promise<void> => {
    await apiRequest("/user-roles", {
      method: "DELETE",
      body: JSON.stringify(payload),
    });
  },
};

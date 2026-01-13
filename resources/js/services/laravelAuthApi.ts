import { apiRequest, unwrapData } from "@/services/laravelApi";

export interface LaravelUser {
  id: number;
  email: string;
  name?: string | null;
  full_name?: string | null;
  phone?: string | null;
  address?: string | null;
  avatar_url?: string | null;
  approved?: boolean;
  approved_at?: string | null;
  roles?: string[];
  permissions?: string[];
  active_school?: {
    id: number;
    name: string;
    code: string;
  } | null;
}

export interface LaravelRegistrationResult {
  user: LaravelUser;
  message?: string | null;
}

export const laravelAuthApi = {
  login: async (payload: { email: string; password: string }): Promise<LaravelUser> => {
    const response = await apiRequest<any>("/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    const { data } = unwrapData<LaravelUser>(response);
    return data;
  },
  register: async (payload: {
    email: string;
    password: string;
    full_name: string;
    phone?: string | null;
  }): Promise<LaravelRegistrationResult> => {
    const response = await apiRequest<any>("/register", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    const { data } = unwrapData<LaravelUser>(response);
    return { user: data, message: response?.message };
  },
  me: async (): Promise<LaravelUser | null> => {
    const response = await apiRequest<any>("/me");
    const { data } = unwrapData<LaravelUser | null>(response);
    return data;
  },
  logout: async (): Promise<void> => {
    await apiRequest("/logout", { method: "POST" });
  },
};

import { create } from "zustand";
import { authApi } from "./api";

interface AuthState {
  token: string | null;
  user: {
    name: string;
    email: string;
    phone?: string | null;
    role: string;
    tenant_id: string;
    tenant_name: string;
    plan: string;
  } | null;
  login: (email: string, password: string, lgpdConsent?: boolean) => Promise<void>;
  logout: () => void;
  hydrate: () => void;
}

export const useAuth = create<AuthState>((set) => ({
  token: null,
  user: null,

  hydrate: () => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("access_token");
    const user = localStorage.getItem("auth_user");
    if (token && user) set({ token, user: JSON.parse(user) });
  },

  login: async (email, password, lgpdConsent = false) => {
    const { data } = await authApi.login(email, password, lgpdConsent);
    localStorage.setItem("access_token", data.access_token);
    const user = {
      name: data.user_name,
      email: data.user_email,
      phone: data.user_phone,
      role: data.user_role,
      tenant_id: data.tenant_id,
      tenant_name: data.tenant_name,
      plan: data.tenant_plan,
    };
    localStorage.setItem("auth_user", JSON.stringify(user));
    set({ token: data.access_token, user });
  },

  logout: () => {
    authApi.logout().catch(() => {});
    localStorage.removeItem("access_token");
    localStorage.removeItem("auth_user");
    set({ token: null, user: null });
    window.location.href = "/login";
  },
}));

import { create } from "zustand";
import { get, post } from "../api/client";

export interface MeResponse {
  sub: string;
  name: string;
  unionId?: string;
  client: string;
}

interface AuthState {
  user: MeResponse | null;
  loading: boolean;
  checked: boolean;
  fetchMe: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: false,
  checked: false,
  fetchMe: async () => {
    set({ loading: true });
    try {
      const user = await get<MeResponse>("/auth/me");
      set({ user, checked: true });
    } catch {
      try {
        await post<void>("/auth/refresh");
        const user = await get<MeResponse>("/auth/me");
        set({ user, checked: true });
      } catch {
        set({ user: null, checked: true });
      }
    } finally {
      set({ loading: false });
    }
  },
  logout: async () => {
    try {
      await post<void>("/auth/logout");
    } finally {
      set({ user: null, checked: true });
    }
  },
}));

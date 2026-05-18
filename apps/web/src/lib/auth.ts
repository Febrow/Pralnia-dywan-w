import { create } from 'zustand';
import { api, setToken } from './api';

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
  primaryBranchId: string | null;
  primaryBranchType: string | null;
}

interface AuthState {
  user: AuthUser | null;
  loaded: boolean;
  loading: boolean;
  setUser: (u: AuthUser | null) => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
}

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  loaded: false,
  loading: false,
  setUser: (u) => set({ user: u, loaded: true }),
  login: async (email, password) => {
    set({ loading: true });
    try {
      const r = await api<{ token: string; user: AuthUser }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      setToken(r.token);
      set({ user: r.user, loaded: true });
    } finally {
      set({ loading: false });
    }
  },
  logout: () => {
    setToken(null);
    set({ user: null });
  },
  refresh: async () => {
    try {
      const r = await api<{ user: AuthUser }>('/me');
      set({ user: r.user, loaded: true });
    } catch {
      set({ user: null, loaded: true });
    }
  },
}));

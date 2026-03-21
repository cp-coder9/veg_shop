import { create } from 'zustand';
import api from '../lib/api.js';

interface User {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  role: 'customer' | 'admin' | 'driver' | 'packer';
  loyaltyPoints?: number;
  popiConsentGiven?: boolean;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
  initialize: () => Promise<void>;
  confirmPopiConsent: (version: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isLoading: true,

  setUser: (user) => set({ user }),

  setTokens: (accessToken, refreshToken) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    set({ accessToken, refreshToken });
  },

  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    set({ user: null, accessToken: null, refreshToken: null });
  },

  initialize: async () => {
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');

    if (accessToken && refreshToken) {
      set({ accessToken, refreshToken });

      try {
        // Fetch user profile to validate token
        const response = await api.get('/auth/me');
        set({ user: response.data, isLoading: false });
      } catch (error) {
        // Token invalid, clear auth
        get().logout();
        set({ isLoading: false });
      }
    } else {
      set({ isLoading: false });
    }
  },

  confirmPopiConsent: async (version: string) => {
    try {
      await api.post('/auth/accept-privacy', { version });
      const user = get().user;
      if (user) {
        set({ user: { ...user, popiConsentGiven: true } });
      }
    } catch (error) {
      console.error('Failed to confirm POPI consent:', error);
      throw error;
    }
  },
}));

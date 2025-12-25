import { useMutation } from '@tanstack/react-query';
import api from '../lib/api';
import { useAuthStore } from '../stores/authStore';

interface SendCodeRequest {
  contact: string;
  method: 'whatsapp' | 'email';
}

interface VerifyCodeRequest {
  contact: string;
  code: string;
}

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    role: 'customer' | 'admin';
  };
}

export function useSendCode() {
  return useMutation({
    mutationFn: async (data: SendCodeRequest) => {
      const response = await api.post('/auth/send-code', data);
      return response.data;
    },
  });
}

export function useVerifyCode() {
  const { setTokens, setUser } = useAuthStore();

  return useMutation({
    mutationFn: async (data: VerifyCodeRequest) => {
      const response = await api.post<AuthResponse>('/auth/verify-code', data);
      return response.data;
    },
    onSuccess: (data) => {
      setTokens(data.accessToken, data.refreshToken);
      setUser(data.user);
    },
  });
}

export function useLogout() {
  const { logout } = useAuthStore();

  return useMutation({
    mutationFn: async () => {
      const response = await api.post('/auth/logout');
      return response.data;
    },
    onSettled: () => {
      logout();
    },
  });
}

export function useDevLogin() {
  const { setTokens, setUser } = useAuthStore();

  return useMutation({
    mutationFn: async (data: { email: string }) => {
      const response = await api.post<AuthResponse>('/auth/dev-login', data);
      return response.data;
    },
    onSuccess: (data) => {
      setTokens(data.accessToken, data.refreshToken);
      setUser(data.user);
    },
  });
}

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

interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  phone?: string;
  address?: string;
  birthday: string;
}

interface LoginRequest {
  email: string;
  password: string;
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
    role: 'customer' | 'admin' | 'driver' | 'packer';
  };
}

// Helper to handle potentially nested 'data' property in backend responses
const unwrapResponse = (response: any): AuthResponse => {
  console.log('Auth API Response:', response);

  // If the response is wrapped in a "data" property (common in some backend frameworks)
  if (response && response.data && (response.data.accessToken || response.data.user)) {
    console.log('Unwrapped nested response data');
    return response.data;
  }

  // If response is the structure itself
  if (response && (response.accessToken || response.user)) {
    return response as AuthResponse;
  }

  // Fallback/Error case - log it clearly
  console.error('Unexpected auth response structure:', response);
  throw new Error('Invalid authentication response from server');
};

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
      return unwrapResponse(response.data);
    },
    onSuccess: (data) => {
      setTokens(data.accessToken, data.refreshToken);
      setUser(data.user);
    },
  });
}

export function useRegister() {
  const { setTokens, setUser } = useAuthStore();

  return useMutation({
    mutationFn: async (data: RegisterRequest) => {
      const response = await api.post<AuthResponse>('/auth/register', data);
      return unwrapResponse(response.data);
    },
    onSuccess: (data) => {
      setTokens(data.accessToken, data.refreshToken);
      setUser(data.user);
    },
  });
}

export function useLogin() {
  const { setTokens, setUser } = useAuthStore();

  return useMutation({
    mutationFn: async (data: LoginRequest) => {
      const response = await api.post<AuthResponse>('/auth/login', data);
      return unwrapResponse(response.data);
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
      return unwrapResponse(response.data);
    },
    onSuccess: (data) => {
      setTokens(data.accessToken, data.refreshToken);
      setUser(data.user);
    },
  });
}

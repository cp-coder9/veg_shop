import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import MockAdapter from 'axios-mock-adapter';
import { useSendCode, useVerifyCode, useLogout } from './useAuth';
import { useAuthStore } from '../stores/authStore';
import api from '../lib/api';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  };
};

describe('useAuth hooks', () => {
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(api);
    useAuthStore.getState().logout();
  });

  afterEach(() => {
    mock.restore();
  });

  describe('useSendCode', () => {
    it('returns mutation function', () => {
      const { result } = renderHook(() => useSendCode(), {
        wrapper: createWrapper(),
      });

      expect(result.current.mutate).toBeDefined();
      expect(typeof result.current.mutate).toBe('function');
    });
  });

  describe('useVerifyCode', () => {
    it('returns mutation function and updates auth store on success', async () => {
      const mockResponse = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        user: {
          id: '1',
          name: 'Test User',
          email: 'test@example.com',
          phone: null,
          address: null,
          role: 'customer' as const,
        },
      };

      mock.onPost('/auth/verify-code').reply(200, mockResponse);

      const { result } = renderHook(() => useVerifyCode(), {
        wrapper: createWrapper(),
      });

      expect(result.current.mutate).toBeDefined();
      
      await result.current.mutateAsync({
        contact: 'test@example.com',
        code: '123456',
      });
      
      const authState = useAuthStore.getState();
      expect(authState.accessToken).toBe('access-token');
      expect(authState.user?.name).toBe('Test User');
    });

    it('handles invalid verification code', async () => {
      mock.onPost('/auth/verify-code').reply(401, { error: 'Invalid code' });

      const { result } = renderHook(() => useVerifyCode(), {
        wrapper: createWrapper(),
      });

      await expect(
        result.current.mutateAsync({
          contact: 'test@example.com',
          code: 'wrong',
        })
      ).rejects.toThrow();
    });
  });

  describe('useLogout', () => {
    it('logs out and clears auth state', async () => {
      useAuthStore.getState().setTokens('token', 'refresh');
      mock.onPost('/auth/logout').reply(200, { success: true });

      const { result } = renderHook(() => useLogout(), {
        wrapper: createWrapper(),
      });

      await result.current.mutateAsync();
      
      const authState = useAuthStore.getState();
      expect(authState.accessToken).toBeNull();
      expect(authState.user).toBeNull();
    });
  });
});

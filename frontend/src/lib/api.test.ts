import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import MockAdapter from 'axios-mock-adapter';
import api from './api';
import { useAuthStore } from '../stores/authStore';

describe('API Client', () => {
  let mock: MockAdapter;

  beforeEach(() => {
    // Mock the api axios instance directly
    mock = new MockAdapter(api);
    useAuthStore.getState().logout();
    // Mock window.location for logout redirect
    delete (window as unknown as { location: unknown }).location;
    (window as unknown as { location: { href: string } }).location = { href: '' };
  });

  afterEach(() => {
    mock.reset();
  });

  describe('Authentication Flow', () => {
    it('attaches JWT token to request headers when token exists', async () => {
      const token = 'test-access-token';
      useAuthStore.getState().setTokens(token, 'refresh-token');

      mock.onGet('/test').reply((config) => {
        expect(config.headers?.Authorization).toBe(`Bearer ${token}`);
        return [200, { success: true }];
      });

      const response = await api.get('/test');
      expect(response.data).toEqual({ success: true });
    });

    it('does not attach Authorization header when no token exists', async () => {
      mock.onGet('/test').reply((config) => {
        expect(config.headers?.Authorization).toBeUndefined();
        return [200, { success: true }];
      });

      const response = await api.get('/test');
      expect(response.data).toEqual({ success: true });
    });
  });

  describe('Error Handling', () => {
    it('handles network errors', async () => {
      mock.onGet('/api/test').networkError();

      await expect(api.get('/test')).rejects.toThrow();
    });

    it('handles 500 server errors', async () => {
      mock.onGet('/api/test').reply(500, { error: 'Server error' });

      await expect(api.get('/test')).rejects.toThrow();
    });

    it('handles 404 not found errors', async () => {
      mock.onGet('/api/test').reply(404, { error: 'Not found' });

      await expect(api.get('/test')).rejects.toThrow();
    });
  });
});

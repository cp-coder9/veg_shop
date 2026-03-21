import { useQuery } from '@tanstack/react-query';
import api from '../lib/api.js';
import { Product } from '../types/index.js';

export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const response = await api.get<Product[]>('/products', {
        params: { isAvailable: true },
      });
      // Ensure we always return an array
      if (!Array.isArray(response.data)) {
        console.warn('API returned non-array response:', response.data);
        return [];
      }
      return response.data;
    },
    // Provide default value to prevent undefined issues
    placeholderData: [],
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ['products', id],
    queryFn: async () => {
      const response = await api.get<Product>(`/products/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useSearchProducts(query: string) {
  return useQuery({
    queryKey: ['products', 'search', query],
    queryFn: async () => {
      const response = await api.get<Product[]>('/products/search', {
        params: { q: query },
      });
      return response.data;
    },
    enabled: !!query && query.length > 2,
    placeholderData: [],
  });
}


import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { Product } from '../types';

interface CreateProductDto {
  name: string;
  price: number;
  category: Product['category'];
  unit: Product['unit'];
  description?: string;
  imageUrl?: string;
  isAvailable: boolean;
  isSeasonal: boolean;
  packingType: string;
  supplierId?: string | null;
}

export interface UpdateProductDto {
  name?: string;
  price?: number;
  category?: Product['category'];
  unit?: Product['unit'];
  description?: string;
  imageUrl?: string;
  isAvailable?: boolean;
  isSeasonal?: boolean;
  packingType?: string;
  supplierId?: string | null;
}

export function useAdminProducts(filters?: {
  category?: string;
  isAvailable?: boolean;
}) {
  return useQuery<Product[]>({
    queryKey: ['admin-products', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.category) params.append('category', filters.category);
      if (filters?.isAvailable !== undefined) params.append('isAvailable', String(filters.isAvailable));

      const response = await api.get(`/products?${params.toString()}`);
      return response.data;
    },
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateProductDto) => {
      const response = await api.post('/products', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateProductDto }) => {
      const response = await api.put(`/products/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/products/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useWhatsAppProductList() {
  return useQuery<string>({
    queryKey: ['whatsapp-product-list'],
    queryFn: async () => {
      const response = await api.get('/products/list/whatsapp');
      return response.data;
    },
    enabled: false,
  });
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';

export interface Category {
  id: string;
  key: string;
  label: string;
  description: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryDto {
  key: string;
  label: string;
  description?: string;
  sortOrder?: number;
}

export interface UpdateCategoryDto {
  label?: string;
  description?: string;
  isActive?: boolean;
  sortOrder?: number;
}

export function useCategories(includeInactive = false) {
  return useQuery<Category[]>({
    queryKey: ['categories', includeInactive],
    queryFn: async () => {
      const params = includeInactive ? '?includeInactive=true' : '';
      const response = await api.get(`/categories${params}`);
      return response.data;
    },
  });
}

export function useCategory(key: string) {
  return useQuery<Category & { _count: { products: number } }>({
    queryKey: ['category', key],
    queryFn: async () => {
      const response = await api.get(`/categories/${key}`);
      return response.data;
    },
    enabled: !!key,
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateCategoryDto) => {
      const response = await api.post('/categories', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ key, data }: { key: string; data: UpdateCategoryDto }) => {
      const response = await api.put(`/categories/${key}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['category'] });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (key: string) => {
      const response = await api.delete(`/categories/${key}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}

export function useSeedCategories() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await api.post('/categories/seed');
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}

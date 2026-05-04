import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../stores/authStore.js';
import api from '../lib/api.js';
import { Order, OrderItem } from '../types/index.js';

interface CreateOrderRequest {
  deliveryDate: string;
  deliveryMethod: 'delivery' | 'collection';
  deliveryAddress?: string;
  specialInstructions?: string;
  deliveryFees?: number;
  coolerBagOption?: boolean;
  groupDelivery?: boolean;
  deliveryInstruction?: 'door' | 'hand_to_me' | 'inside_fridge' | 'inside_freezer';
  items: OrderItem[];
}

export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateOrderRequest) => {
      const response = await api.post<Order>('/orders', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

export function useCustomerOrders() {
  return useQuery({
    queryKey: ['orders', 'customer'],
    queryFn: async () => {
      // Get current user from auth store

      const user = useAuthStore.getState().user;

      if (!user) {
        throw new Error('User not authenticated');
      }

      const response = await api.get<Order[]>(`/orders/customer/${user.id}`);
      return response.data;
    },
  });
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: ['orders', id],
    queryFn: async () => {
      const response = await api.get<Order>(`/orders/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useOrderWindowStatus() {
  return useQuery({
    queryKey: ['orders', 'window-status'],
    queryFn: async () => {
      const response = await api.get<{ isOpen: boolean; nextStatusChange: string; message: string }>('/orders/window-status');
      return response.data;
    },
    refetchInterval: 60000, // Refresh every minute
  });
}

export function useLastWeekOrder() {
  return useQuery({
    queryKey: ['orders', 'last-week'],
    queryFn: async () => {
      const response = await api.get<Order | null>('/orders/last-week');
      return response.data;
    },
  });
}

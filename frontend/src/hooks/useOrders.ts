import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { Order, OrderItem } from '../types';

interface CreateOrderRequest {
  deliveryDate: string;
  deliveryMethod: 'delivery' | 'collection';
  deliveryAddress?: string;
  specialInstructions?: string;
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
      const { useAuthStore } = await import('../stores/authStore');
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

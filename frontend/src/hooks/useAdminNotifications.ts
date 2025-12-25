import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';

interface Notification {
  id: string;
  customerId: string;
  type: 'order_confirmation' | 'payment_reminder' | 'product_list';
  method: 'whatsapp' | 'email';
  content: string;
  status: 'pending' | 'sent' | 'failed';
  sentAt: string | null;
  createdAt: string;
}

export function useNotifications() {
  return useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response = await api.get('/notifications');
      return response.data;
    },
  });
}

export function useSendProductList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (customerIds: string[]) => {
      const response = await api.post('/notifications/product-list', { customerIds });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useSendPaymentReminder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (customerId: string) => {
      const response = await api.post(`/notifications/payment-reminder/${customerId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useSendSeasonalPoll() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (customerIds: string[]) => {
      const response = await api.post('/notifications/seasonal-poll', { customerIds });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

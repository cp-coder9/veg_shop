import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { Order } from '../types';

interface BulkOrderItem {
  productId: string;
  productName: string;
  totalQuantity: number;
  bufferQuantity: number;
  finalQuantity: number;
  contributingOrders: string[];
}

interface BulkOrder {
  weekStartDate: string;
  items: BulkOrderItem[];
  generatedAt: string;
}

export interface CollationItem {
  productId: string;
  productName: string;
  totalQuantity: number;
  unit: string;
  orderCount: number;
  categoryId: string;
}

export function useAdminOrders(filters?: {
  deliveryDate?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  customerId?: string;
}) {
  return useQuery<Order[]>({
    queryKey: ['admin-orders', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.deliveryDate) params.append('deliveryDate', filters.deliveryDate);
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.customerId) params.append('customerId', filters.customerId);

      const response = await api.get(`/orders?${params.toString()}`);
      return response.data;
    },
  });
}

export function useOrder(id: string) {
  return useQuery<Order>({
    queryKey: ['order', id],
    queryFn: async () => {
      const response = await api.get(`/orders/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Order['status'] }) => {
      const response = await api.patch(`/orders/${id}/status`, { status });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['order'] });
    },
  });
}

export function useGenerateBulkOrder() {
  return useMutation({
    mutationFn: async (weekStartDate: string) => {
      const response = await api.post('/orders/bulk', { weekStartDate });
      return response.data as BulkOrder;
    },
  });
}
export function useOrderWeeklyCollation() {
  return useMutation({
    mutationFn: async (filters: { startDate: string; endDate: string }) => {
      const response = await api.get('/orders/collation', { params: filters });
      return response.data as CollationItem[];
    },
  });
}

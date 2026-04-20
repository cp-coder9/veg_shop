import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api.js';
import { Order } from '../types/index.js';

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
  supplierId: string;
  supplierName: string;
}

export function useAdminOrders(filters?: {
  deliveryDate?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  customerId?: string;
  packerId?: string;
  driverId?: string;
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
      if (filters?.packerId) params.append('packerId', filters.packerId);
      if (filters?.driverId) params.append('driverId', filters.driverId);

      const response = await api.get(`/orders?${params.toString()}`);
      return response.data;
    },
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
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
    mutationFn: async ({ id, status, packedItems, notes, signature, handoverConfirmed, packageDetails }: {
      id: string;
      status: Order['status'];
      packedItems?: Record<string, number>;
      notes?: string;
      signature?: string;
      handoverConfirmed?: boolean;
      packageDetails?: string;
    }) => {
      const response = await api.patch(`/orders/${id}/status`, { 
        status, 
        packedItems, 
        notes, 
        signature,
        handoverConfirmed,
        packageDetails
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['order'] });
    },
  });
}

export function useUpdateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: {
      id: string;
      packerId?: string | null;
      driverId?: string | null;
      area?: string | null;
      status?: Order['status'];
      items?: any[];
    }) => {
      const response = await api.patch(`/orders/${id}`, data);
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
      return response.data as {
        bulkOrder: BulkOrder;
        formatted: {
          whatsapp: string;
          email: string;
          emailText: string;
        };
      };
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

export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      customerId?: string;
      deliveryDate: string;
      deliveryMethod: 'delivery' | 'collection';
      deliveryAddress?: string;
      specialInstructions?: string;
      deliveryFees?: number;
      items: { productId: string; quantity: number }[];
      coolerBagOption?: boolean;
      groupDelivery?: boolean;
    }) => {
      const response = await api.post('/orders', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
    },
  });
}

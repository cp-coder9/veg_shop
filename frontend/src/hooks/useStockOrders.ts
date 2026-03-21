import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api.js';

// Types for Stock Orders
export interface StockOrderItem {
  id: string;
  stockOrderId: string;
  productId: string;
  productName: string;
  category: string;
  unit: string;
  orderedQuantity: number;
  receivedQuantity: number;
  pricePerUnit: number | string;
  isShort: boolean;
  shortQuantity: number;
  creditAmount: number | string;
  customerId: string | null;
  orderId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StockOrder {
  id: string;
  weekStartDate: string;
  supplierId: string | null;
  supplierName: string | null;
  status: 'pending' | 'partial' | 'received' | 'fulfilled';
  totalItems: number;
  totalOrdered: number | string;
  totalReceived: number | string;
  totalCredits: number | string;
  notes: string | null;
  createdById: string | null;
  createdAt: string;
  updatedAt: string;
  items: StockOrderItem[];
}

export interface WeeklyCollationHistory {
  id: string;
  stockOrderId: string | null;
  weekStartDate: string;
  weekEndDate: string;
  reportData: any;
  totalProducts: number;
  totalOrders: number;
  totalValue: number | string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStockOrderInput {
  weekStartDate: string;
  supplierId?: string | null;
  supplierName?: string | null;
  items: Array<{
    productId: string;
    productName: string;
    category: string;
    unit: string;
    orderedQuantity: number;
    pricePerUnit: number;
    customerId?: string;
    orderId?: string;
  }>;
  notes?: string;
}

// Hooks

export function useStockOrders(filters?: {
  weekStartDate?: string;
  status?: string;
}) {
  return useQuery<StockOrder[]>({
    queryKey: ['stock-orders', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.weekStartDate) params.append('weekStartDate', filters.weekStartDate);
      if (filters?.status) params.append('status', filters.status);

      const response = await api.get(`/stock-orders?${params.toString()}`);
      return response.data;
    },
    enabled: true,
  });
}

export function useStockOrder(id: string) {
  return useQuery<StockOrder>({
    queryKey: ['stock-order', id],
    queryFn: async () => {
      const response = await api.get(`/stock-orders/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useCollationHistory(filters?: {
  startDate?: string;
  endDate?: string;
  status?: string;
}) {
  return useQuery<WeeklyCollationHistory[]>({
    queryKey: ['collation-history', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);
      if (filters?.status) params.append('status', filters.status);

      const response = await api.get(`/stock-orders/history?${params.toString()}`);
      return response.data;
    },
    enabled: true,
  });
}

export function useCreateStockOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateStockOrderInput) => {
      const response = await api.post('/stock-orders', data);
      return response.data as StockOrder;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-orders'] });
      queryClient.invalidateQueries({ queryKey: ['collation-history'] });
    },
  });
}

export function useUpdateReceivedQuantities() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      stockOrderId,
      items
    }: {
      stockOrderId: string;
      items: Array<{ stockOrderItemId: string; receivedQuantity: number }>
    }) => {
      const response = await api.patch(`/stock-orders/${stockOrderId}/received`, { items });
      return response.data as StockOrder;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['stock-orders'] });
      queryClient.invalidateQueries({ queryKey: ['stock-order', variables.stockOrderId] });
    },
  });
}

export function useFulfillStockOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (stockOrderId: string) => {
      const response = await api.post(`/stock-orders/${stockOrderId}/fulfill`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-orders'] });
      queryClient.invalidateQueries({ queryKey: ['collation-history'] });
    },
  });
}

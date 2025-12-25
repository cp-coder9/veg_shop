import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';

export interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  deliveryPreference: 'delivery' | 'collection';
  role: string;
  createdAt: string;
  updatedAt: string;
}

interface OrderHistoryItem {
  id: string;
  deliveryDate: string;
  deliveryMethod: string;
  status: string;
  total: number;
  items: Array<{
    id: string;
    productId: string;
    quantity: number;
    priceAtOrder: number;
  }>;
  createdAt: string;
}

interface PaymentHistoryItem {
  id: string;
  amount: number;
  method: string;
  paymentDate: string;
  notes: string | null;
  createdAt: string;
}

interface InvoiceItem {
  id: string;
  orderId: string;
  subtotal: number;
  creditApplied: number;
  total: number;
  status: string;
  dueDate: string;
  createdAt: string;
}

export interface CustomerProfile extends Customer {
  orderHistory: OrderHistoryItem[];
  creditBalance: number;
  paymentHistory: PaymentHistoryItem[];
  invoices: InvoiceItem[];
}

export interface UpdateCustomerRequest {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  deliveryPreference?: 'delivery' | 'collection';
}

export function useAdminCustomers() {
  return useQuery({
    queryKey: ['admin', 'customers'],
    queryFn: async () => {
      const response = await api.get<Customer[]>('/customers');
      return response.data;
    },
  });
}

export function useAdminCustomer(customerId: string, includeProfile: boolean = false) {
  return useQuery({
    queryKey: ['admin', 'customers', customerId, includeProfile],
    queryFn: async () => {
      const response = await api.get<Customer | CustomerProfile>(
        `/customers/${customerId}${includeProfile ? '?includeProfile=true' : ''}`
      );
      return response.data;
    },
    enabled: !!customerId,
  });
}

export function useUpdateAdminCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ customerId, data }: { customerId: string; data: UpdateCustomerRequest }) => {
      const response = await api.put<Customer>(`/customers/${customerId}`, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'customers'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'customers', variables.customerId] });
    },
  });
}

export function useCreateAdminCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateCustomerRequest) => {
      const response = await api.post<Customer>('/customers', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'customers'] });
    },
  });
}

export interface CreateCustomerRequest {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  deliveryPreference?: 'delivery' | 'collection';
}

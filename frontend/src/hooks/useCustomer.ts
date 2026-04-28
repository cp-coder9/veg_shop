import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api.js';
import { useAuthStore } from '../stores/authStore.js';

export interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  countryCode: string | null;
  address: string | null;
  streetName: string | null;
  area: string | null;
  province: string | null;
  postalCode: string | null;
  deliveryPreference: 'delivery' | 'collection';
  creditBalance: number;
}

interface UpdateCustomerRequest {
  name?: string;
  email?: string;
  phone?: string;
  countryCode?: string;
  address?: string;
  streetName?: string;
  area?: string;
  province?: string;
  postalCode?: string;
  deliveryPreference?: 'delivery' | 'collection';
}

// Payment interface
export interface Payment {
  id: string;
  invoiceId: string;
  customerId: string;
  amount: number;
  method: 'cash' | 'yoco' | 'eft';
  paymentDate: Date | string;
  notes: string | null;
  invoice?: {
    id: string;
    orderId: string;
    status: 'paid' | 'partial' | 'unpaid';
    subtotal: number;
    creditApplied: number;
    total: number;
  };
  customer?: {
    id: string;
    name: string;
    email: string | null;
  };
}

export function useCustomerProfile() {
  return useQuery({
    queryKey: ['customer', 'profile'],
    queryFn: async () => {
      const response = await api.get<Customer>('/customers/me');
      return response.data;
    },
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((state) => state.setUser);

  return useMutation({
    mutationFn: async (data: UpdateCustomerRequest) => {
      const response = await api.put<Customer>('/customers/me', data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['customer', 'profile'] });
      // Update auth store with new user data
      setUser({
        id: data.id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        address: data.address,
        role: 'customer',
      });
    },
  });
}

export function useCustomerInvoices() {
  return useQuery({
    queryKey: ['invoices', 'customer'],
    queryFn: async () => {
      const response = await api.get('/invoices/customer/me');
      return response.data;
    },
  });
}

/**
 * Hook to get customer's payment history
 * Returns all payments made by the authenticated customer
 */
export function useCustomerPayments() {
  return useQuery({
    queryKey: ['payments', 'customer'],
    queryFn: async () => {
      const response = await api.get<Payment[]>('/payments/customer/me');
      return response.data;
    },
  });
}

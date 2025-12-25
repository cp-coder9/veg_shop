import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { useAuthStore } from '../stores/authStore';

interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  deliveryPreference: 'delivery' | 'collection';
  creditBalance: number;
}

interface UpdateCustomerRequest {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  deliveryPreference?: 'delivery' | 'collection';
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

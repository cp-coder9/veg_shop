import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';

interface Payment {
  id: string;
  invoiceId: string;
  customerId: string;
  amount: number;
  method: 'cash' | 'yoco' | 'eft';
  paymentDate: string;
  notes: string | null;
}

interface RecordPaymentDto {
  invoiceId: string;
  customerId: string;
  amount: number;
  method: 'cash' | 'yoco' | 'eft';
  paymentDate: string;
  notes?: string;
}

export function useCustomerPayments(customerId: string) {
  return useQuery<Payment[]>({
    queryKey: ['customer-payments', customerId],
    queryFn: async () => {
      const response = await api.get(`/payments/customer/${customerId}`);
      return response.data;
    },
    enabled: !!customerId,
  });
}

export function useRecordPayment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: RecordPaymentDto) => {
      const response = await api.post('/payments', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-payments'] });
      queryClient.invalidateQueries({ queryKey: ['admin-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice'] });
    },
  });
}

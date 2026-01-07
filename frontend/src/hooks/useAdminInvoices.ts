import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { Invoice } from '../types';

export function useAdminInvoices(filters?: {
  customerId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}) {
  return useQuery<Invoice[]>({
    queryKey: ['admin-invoices', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.customerId) params.append('customerId', filters.customerId);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);

      const response = await api.get(`/invoices?${params.toString()}`);
      return response.data;
    },
  });
}

interface InvoiceWithOrder extends Invoice {
  order: {
    id: string;
    customerId: string;
    deliveryDate: string;
    status: string;
    items: Array<{
      id: string;
      productId: string;
      quantity: number;
      priceAtOrder: number;
    }>;
  };
}

export function useInvoice(id: string) {
  return useQuery<InvoiceWithOrder>({
    queryKey: ['invoice', id],
    queryFn: async () => {
      const response = await api.get(`/invoices/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useGenerateInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderId: string) => {
      const response = await api.post(`/invoices/generate/${orderId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
    },
  });
}

export function useDownloadInvoicePDF() {
  return useMutation({
    mutationFn: async (invoiceId: string) => {
      const response = await api.get(`/invoices/${invoiceId}/pdf`, {
        responseType: 'blob',
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice-${invoiceId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    },
  });
}

export function useSendPaymentLink() {
  return useMutation({
    mutationFn: async (data: { invoiceId: string; method: 'whatsapp' | 'email' }) => {
      const response = await api.post('/payments/send-link', data);
      return response.data;
    },
  });
}

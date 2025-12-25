import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import {
  SalesReport,
  PaymentStatusReport,
  ProductPopularityReport,
  CustomerActivityReport,
} from '../types';

export function useSalesReport(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ['reports', 'sales', startDate, endDate],
    queryFn: async () => {
      const response = await api.get<SalesReport>('/reports/sales', {
        params: { startDate, endDate },
      });
      return response.data;
    },
    enabled: !!startDate && !!endDate,
  });
}

export function usePaymentStatusReport() {
  return useQuery({
    queryKey: ['reports', 'payments'],
    queryFn: async () => {
      const response = await api.get<PaymentStatusReport>('/reports/payments');
      return response.data;
    },
  });
}

export function useProductPopularityReport(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ['reports', 'products', startDate, endDate],
    queryFn: async () => {
      const response = await api.get<ProductPopularityReport>('/reports/products', {
        params: { startDate, endDate },
      });
      return response.data;
    },
    enabled: !!startDate && !!endDate,
  });
}

export function useCustomerActivityReport(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ['reports', 'customers', startDate, endDate],
    queryFn: async () => {
      const response = await api.get<CustomerActivityReport>('/reports/customers', {
        params: { startDate, endDate },
      });
      return response.data;
    },
    enabled: !!startDate && !!endDate,
  });
}

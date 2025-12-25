import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';

interface SalesReport {
  startDate: string;
  endDate: string;
  totalRevenue: number;
  totalOrders: number;
  productsSold: {
    productId: string;
    productName: string;
    quantitySold: number;
    revenue: number;
  }[];
}

interface PaymentStatusReport {
  totalOutstanding: number;
  customers: {
    customerId: string;
    customerName: string;
    outstandingBalance: number;
    lastPaymentDate: string | null;
  }[];
}

interface ProductPopularityReport {
  startDate: string;
  endDate: string;
  products: {
    productId: string;
    productName: string;
    orderCount: number;
    totalQuantity: number;
    revenue: number;
  }[];
}

interface CustomerActivityReport {
  startDate: string;
  endDate: string;
  customers: {
    customerId: string;
    customerName: string;
    orderCount: number;
    totalSpent: number;
    averageOrderValue: number;
    lastOrderDate: string | null;
  }[];
}

export function useSalesReport(startDate?: string, endDate?: string) {
  return useQuery<SalesReport>({
    queryKey: ['sales-report', startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const response = await api.get(`/reports/sales?${params.toString()}`);
      return response.data;
    },
    enabled: !!startDate && !!endDate,
  });
}

export function usePaymentStatusReport() {
  return useQuery<PaymentStatusReport>({
    queryKey: ['payment-status-report'],
    queryFn: async () => {
      const response = await api.get('/reports/payments');
      return response.data;
    },
  });
}

export function useProductPopularityReport(startDate?: string, endDate?: string) {
  return useQuery<ProductPopularityReport>({
    queryKey: ['product-popularity-report', startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const response = await api.get(`/reports/products?${params.toString()}`);
      return response.data;
    },
    enabled: !!startDate && !!endDate,
  });
}

export function useCustomerActivityReport(startDate?: string, endDate?: string) {
  return useQuery<CustomerActivityReport>({
    queryKey: ['customer-activity-report', startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const response = await api.get(`/reports/customers?${params.toString()}`);
      return response.data;
    },
    enabled: !!startDate && !!endDate,
  });
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';

interface Credit {
  id: string;
  customerId: string;
  amount: number;
  reason: string;
  type: 'overpayment' | 'short_delivery' | 'refund';
  createdAt: string;
}

interface ShortDeliveryDto {
  orderId: string;
  customerId: string;
  items: {
    productId: string;
    quantityShort: number;
  }[];
}

export function useCustomerCredits(customerId: string) {
  return useQuery<{ balance: number; credits: Credit[] }>({
    queryKey: ['customer-credits', customerId],
    queryFn: async () => {
      const response = await api.get(`/credits/customer/${customerId}`);
      return response.data;
    },
    enabled: !!customerId,
  });
}

export function useRecordShortDelivery() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: ShortDeliveryDto) => {
      const response = await api.post('/credits/short-delivery', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-credits'] });
    },
  });
}

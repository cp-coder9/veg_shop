import { useMutation, useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { Order } from '../types';

export function useGeneratePackingListPDF() {
  return useMutation({
    mutationFn: async ({ date, sortBy }: { date: string; sortBy: 'route' | 'name' }) => {
      const response = await api.post('/packing-lists/pdf', { date, sortBy }, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `packing-lists-${date}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    },
  });
}

export function usePackingList(date: string) {
  return useQuery<Record<string, Order[]>>({
    queryKey: ['packing-list', date],
    queryFn: async () => {
      if (!date) return {};
      const response = await api.get(`/orders/delivery/${date}/packing-list`);
      return response.data;
    },
    enabled: !!date,
  });
}

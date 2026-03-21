import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api.js';

export interface PollItem {
    id: string;
    customerId: string;
    productId: string;
    quantity: number;
    price: number | string;
    status: 'pending' | 'invoiced';
    invoiceId: string | null;
    createdAt: string;
    updatedAt: string;
    product: {
        id: string;
        name: string;
        unit: string;
    };
}

export function usePollItems(customerId: string) {
    return useQuery<PollItem[]>({
        queryKey: ['poll-items', customerId],
        queryFn: async () => {
            const res = await api.get(`/poll-items/customer/${customerId}`);
            return res.data;
        },
        enabled: !!customerId,
    });
}

export function useCreatePollItem() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: { customerId: string; productId: string; quantity: number; price: number }) =>
            api.post('/poll-items', data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['poll-items', variables.customerId] });
        },
    });
}

export function useDeletePollItem(customerId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => api.delete(`/poll-items/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['poll-items', customerId] });
        },
    });
}

export function useGeneratePollItemsInvoice(customerId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: () => api.post(`/poll-items/customer/${customerId}/invoice`, {}),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['poll-items', customerId] });
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
        },
    });
}

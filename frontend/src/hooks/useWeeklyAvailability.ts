import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api.js';

export interface WeeklyAvailabilityItem {
    id: string;
    productId: string;
    weekStart: string;
    isAvailable: boolean;
    confirmedBy: string | null;
    confirmedAt: string | null;
    product: {
        id: string;
        name: string;
        price: number;
        category: string;
        unit: string;
        isSeasonal: boolean;
        isAvailable: boolean;
        imageUrl: string | null;
        deliveryDay: string | null;
        supplierId: string | null;
        supplier: { id: string; name: string } | null;
    };
}

interface WeekAvailabilityResponse {
    availability: WeeklyAvailabilityItem[];
    isConfirmed: boolean;
}

export function useWeeklyAvailability(weekStart: string) {
    return useQuery<WeekAvailabilityResponse>({
        queryKey: ['weekly-availability', weekStart],
        queryFn: async () => {
            const response = await api.get(`/availability/${weekStart}`);
            return response.data;
        },
        enabled: !!weekStart,
    });
}

export function useToggleAvailability() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            weekStart,
            productId,
            isAvailable,
        }: {
            weekStart: string;
            productId: string;
            isAvailable: boolean;
        }) => {
            const response = await api.patch(`/availability/${weekStart}/${productId}`, { isAvailable });
            return response.data;
        },
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['weekly-availability', variables.weekStart] });
        },
    });
}

export function useBulkUpdateAvailability() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            weekStart,
            updates,
        }: {
            weekStart: string;
            updates: Array<{ productId: string; isAvailable: boolean }>;
        }) => {
            const response = await api.put(`/availability/${weekStart}`, { updates });
            return response.data;
        },
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['weekly-availability', variables.weekStart] });
        },
    });
}

export function useConfirmAvailability() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (weekStart: string) => {
            const response = await api.post(`/availability/${weekStart}/confirm`);
            return response.data;
        },
        onSuccess: (_data, weekStart) => {
            queryClient.invalidateQueries({ queryKey: ['weekly-availability', weekStart] });
        },
    });
}

export function useCopyPreviousWeek() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (weekStart: string) => {
            const response = await api.post(`/availability/${weekStart}/copy-previous`);
            return response.data;
        },
        onSuccess: (_data, weekStart) => {
            queryClient.invalidateQueries({ queryKey: ['weekly-availability', weekStart] });
        },
    });
}

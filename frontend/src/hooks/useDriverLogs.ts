import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';

export interface DriverLog {
    id: string;
    driverId: string;
    date: string;
    startKm: number;
    endKm: number | null;
    vehicleReg: string | null;
    notes: string | null;
}

export interface CreateLogEntry {
    startKm: number;
    vehicleReg?: string;
    notes?: string;
}

export interface UpdateLogEntry {
    endKm: number;
    notes?: string;
}

export function useTodayLog() {
    return useQuery<DriverLog | null>({
        queryKey: ['driver-log-today'],
        queryFn: async () => {
            const { data } = await api.get('/driver/logs/today');
            return data;
        }
    });
}

export function useCreateLog() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: CreateLogEntry) => {
            const response = await api.post('/driver/logs', data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['driver-log-today'] });
        }
    });
}

export function useUpdateLog() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: UpdateLogEntry }) => {
            const response = await api.patch(`/driver/logs/${id}`, data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['driver-log-today'] });
        }
    });
}

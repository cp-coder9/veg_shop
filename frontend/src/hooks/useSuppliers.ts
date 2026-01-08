import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';

export interface Supplier {
    id: string;
    name: string;
    contactInfo: string | null;
    isAvailable: boolean;
}

export function useSuppliers() {
    return useQuery<Supplier[]>({
        queryKey: ['admin', 'suppliers'],
        queryFn: async () => {
            const response = await api.get('/admin/suppliers');
            return response.data;
        },
    });
}

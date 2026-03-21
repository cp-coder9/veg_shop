import { useQuery } from '@tanstack/react-query';
import api from '../lib/api.js';
import { User } from '../types/index.js'; // Assuming User type is compatible or similar to Customer

export function useAdminUsers(role: string) {
    return useQuery<User[]>({
        queryKey: ['admin', 'users', role],
        queryFn: async () => {
            const response = await api.get<User[]>(`/admin/users?role=${role}`);
            return response.data;
        },
        enabled: !!role,
    });
}

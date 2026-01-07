import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { User } from '../types'; // Assuming User type is compatible or similar to Customer

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

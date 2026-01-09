import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';

export interface AuditLog {
    id: string;
    userId: string | null;
    action: string;
    resource: string;
    resourceId: string | null;
    details: string | null;
    ipAddress: string | null;
    userAgent: string | null;
    createdAt: string;
    user?: {
        name: string;
    };
}

export interface AuditFilters {
    userId?: string;
    action?: string;
    resource?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
}

export function useAdminAudit(filters: AuditFilters = {}) {
    return useQuery<{ logs: AuditLog[]; total: number }>({
        queryKey: ['admin-audit', filters],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (filters.userId) params.append('userId', filters.userId);
            if (filters.action) params.append('action', filters.action);
            if (filters.resource) params.append('resource', filters.resource);
            if (filters.startDate) params.append('startDate', filters.startDate);
            if (filters.endDate) params.append('endDate', filters.endDate);
            if (filters.limit) params.append('limit', filters.limit.toString());
            if (filters.offset) params.append('offset', filters.offset.toString());

            const { data } = await api.get(`/audit-logs?${params.toString()}`);
            return data;
        },
    });
}

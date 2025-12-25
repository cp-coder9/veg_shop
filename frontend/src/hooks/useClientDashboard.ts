import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';

export interface DashboardStats {
    creditBalance: number;
    outstandingAmount: number;
    outstandingInvoices: number;
    totalOrders: number;
    totalSpent: number;
}

export interface RecentOrder {
    id: string;
    status: string;
    deliveryDate: string;
    createdAt: string;
    itemCount: number;
    total: number;
}

export interface NextDelivery {
    orderId: string;
    date: string;
    method: string;
}

export interface OutstandingInvoice {
    id: string;
    total: number;
    dueDate: string;
    status: string;
}

export interface DashboardData {
    customer: {
        id: string;
        name: string;
        email: string | null;
        phone: string | null;
    };
    stats: DashboardStats;
    recentOrders: RecentOrder[];
    nextDelivery: NextDelivery | null;
    outstandingInvoices: OutstandingInvoice[];
}

export interface Payment {
    id: string;
    amount: number;
    method: string;
    paymentDate: string;
    notes: string | null;
    invoice: {
        id: string;
        total: number;
        status: string;
        orderId: string;
    } | null;
}

export function useClientDashboard() {
    return useQuery<DashboardData>({
        queryKey: ['client-dashboard'],
        queryFn: async () => {
            const { data } = await api.get('/customers/me/dashboard');
            return data;
        },
    });
}

export function useClientPayments() {
    return useQuery<Payment[]>({
        queryKey: ['client-payments'],
        queryFn: async () => {
            const { data } = await api.get('/customers/me/payments');
            return data;
        },
    });
}

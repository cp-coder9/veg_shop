import { useQuery } from '@tanstack/react-query';
import {
    Package,
    Users,
    DollarSign,
    ShoppingCart,
    TrendingUp,
    Clock,
    CreditCard,
    Banknote,
    Building
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '../../components/ui/index.js';
import api from '../../lib/api.js';

interface DashboardStats {
    totalOrders: number;
    pendingOrders: number;
    totalRevenue: number;
    unpaidInvoices: number;
    activeCustomers: number;
}

interface PaymentStats {
    today: { total: number; count: number; yoco: number; cash: number; eft: number };
    week: { total: number; count: number; yoco: number; cash: number; eft: number };
    month: { total: number; count: number; yoco: number; cash: number; eft: number };
}

interface RecentPayment {
    id: string;
    amount: number;
    method: string;
    paymentDate: string;
    customer: {
        id: string;
        name: string;
        email?: string;
    };
    invoiceId: string;
    invoiceStatus: string;
}

const AdminDashboard = () => {
    const { data: stats, isLoading } = useQuery<DashboardStats>({
        queryKey: ['admin-stats'],
        queryFn: async () => {
            const response = await api.get('/reports/dashboard');
            return response.data;
        },
        retry: false, // Don't retry on 404 errors
    });

    const { data: recentOrders } = useQuery<unknown[]>({
        queryKey: ['recent-orders'],
        queryFn: async () => {
            const response = await api.get('/orders?limit=5&status=pending');
            return response.data;
        },
        retry: false,
    });

    const { data: paymentStats, isLoading: paymentLoading } = useQuery<PaymentStats>({
        queryKey: ['payment-stats'],
        queryFn: async () => {
            const response = await api.get('/payments/stats');
            return response.data;
        },
        retry: false,
    });

    const { data: recentPayments } = useQuery<RecentPayment[]>({
        queryKey: ['recent-payments'],
        queryFn: async () => {
            const response = await api.get('/payments/recent?limit=10');
            return response.data;
        },
        retry: false,
    });

    const statCards = [
        {
            title: 'Total Orders',
            value: stats?.totalOrders ?? 0,
            icon: ShoppingCart,
            color: 'bg-sage-green/10 text-sage-green'
        },
        {
            title: 'Pending Orders',
            value: stats?.pendingOrders ?? 0,
            icon: Clock,
            color: 'bg-warning/10 text-warning'
        },
        {
            title: 'Total Revenue',
            value: `R${(stats?.totalRevenue ?? 0).toFixed(2)}`,
            icon: DollarSign,
            color: 'bg-info/10 text-info'
        },
        {
            title: 'Unpaid Invoices',
            value: stats?.unpaidInvoices ?? 0,
            icon: Banknote,
            color: 'bg-terracotta/10 text-terracotta'
        },
        {
            title: 'Active Customers',
            value: stats?.activeCustomers ?? 0,
            icon: Users,
            color: 'bg-primary/10 text-primary'
        }
    ];

    // Calculate payment method percentages for today
    const todayStats = paymentStats?.today || { total: 0, count: 0, yoco: 0, cash: 0, eft: 0 };
    const yocoPercent = todayStats.total > 0 ? Math.round((todayStats.yoco / todayStats.total) * 100) : 0;
    const cashPercent = todayStats.total > 0 ? Math.round((todayStats.cash / todayStats.total) * 100) : 0;
    const eftPercent = todayStats.total > 0 ? Math.round((todayStats.eft / todayStats.total) * 100) : 0;

    const getMethodIcon = (method: string) => {
        switch (method) {
            case 'yoco': return <CreditCard size={16} className="text-purple-600" />;
            case 'cash': return <Banknote size={16} className="text-green-600" />;
            case 'eft': return <Building size={16} className="text-blue-600" />;
            default: return <DollarSign size={16} className="text-gray-600" />;
        }
    };

    const getMethodLabel = (method: string) => {
        switch (method) {
            case 'yoco': return 'Yoco';
            case 'cash': return 'Cash';
            case 'eft': return 'EFT';
            default: return method;
        }
    };

    if (isLoading || paymentLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-terracotta"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="mb-6">
                <h1 className="font-display text-display-md text-primary-dark">Admin Dashboard</h1>
                <p className="font-body text-body-md text-warm-gray mt-1">Welcome back! Here's what's happening with your store.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {statCards.map((stat, index) => (
                    <Card key={index} className="hover:shadow-md transition-shadow">
                        <CardContent className="flex items-center gap-4">
                            <div className={`p-3 rounded-lg ${stat.color}`}>
                                <stat.icon size={24} />
                            </div>
                            <div>
                                <p className="font-accent text-caption text-warm-gray uppercase tracking-wide">
                                    {stat.title}
                                </p>
                                <p className="font-display text-body-lg text-primary-dark">
                                    {stat.value}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Payment Methods Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Payment Stats Card */}
                <Card>
                    <CardHeader
                        title="Payment Methods"
                        subtitle="Today's payment breakdown"
                    />
                    <CardContent>
                        {paymentLoading ? (
                            <div className="animate-pulse space-y-4">
                                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                            </div>
                        ) : todayStats.total === 0 ? (
                            <div className="text-center py-8">
                                <DollarSign className="mx-auto h-12 w-12 text-light-gray mb-4" />
                                <p className="font-body text-body-md text-warm-gray">No payments today</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {/* Yoco */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <CreditCard size={18} className="text-purple-600" />
                                            <span className="font-body text-body-md text-primary-dark">Yoco</span>
                                        </div>
                                        <span className="font-body text-body-md font-medium text-primary-dark">
                                             R{todayStats.yoco.toFixed(2)}
                                         </span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className="bg-purple-600 h-2 rounded-full"
                                            style={{ width: `${yocoPercent}%` }}
                                        ></div>
                                    </div>
                                    <p className="text-caption text-warm-gray mt-1">{yocoPercent}% of total</p>
                                </div>

                                {/* Cash */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <Banknote size={18} className="text-green-600" />
                                            <span className="font-body text-body-md text-primary-dark">Cash</span>
                                        </div>
                                        <span className="font-body text-body-md font-medium text-primary-dark">
                                             R{todayStats.cash.toFixed(2)}
                                         </span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className="bg-green-600 h-2 rounded-full"
                                            style={{ width: `${cashPercent}%` }}
                                        ></div>
                                    </div>
                                    <p className="text-caption text-warm-gray mt-1">{cashPercent}% of total</p>
                                </div>

                                {/* EFT */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <Building size={18} className="text-blue-600" />
                                            <span className="font-body text-body-md text-primary-dark">EFT</span>
                                        </div>
                                        <span className="font-body text-body-md font-medium text-primary-dark">
                                             R{todayStats.eft.toFixed(2)}
                                         </span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className="bg-blue-600 h-2 rounded-full"
                                            style={{ width: `${eftPercent}%` }}
                                        ></div>
                                    </div>
                                    <p className="text-caption text-warm-gray mt-1">{eftPercent}% of total</p>
                                </div>

                                <div className="pt-4 border-t border-gray-200">
                                    <div className="flex items-center justify-between">
                                        <span className="font-body text-body-md text-warm-gray">Total Today</span>
                                        <span className="font-display text-body-lg font-semibold text-primary-dark">
                                            R{(todayStats.total / 100).toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Recent Payments Activity */}
                <Card>
                    <CardHeader
                        title="Recent Payments"
                        subtitle="Latest payment activity"
                    />
                    <CardContent>
                        {!recentPayments || recentPayments.length === 0 ? (
                            <div className="text-center py-8">
                                <DollarSign className="mx-auto h-12 w-12 text-light-gray mb-4" />
                                <p className="font-body text-body-md text-warm-gray">No recent payments</p>
                            </div>
                        ) : (
                            <div className="space-y-3 max-h-64 overflow-y-auto">
                                {recentPayments.slice(0, 8).map((payment: RecentPayment) => (
                                    <div
                                        key={payment.id}
                                        className="flex items-center justify-between p-3 bg-cream/30 rounded-lg"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${payment.method === 'yoco' ? 'bg-purple-100' :
                                                payment.method === 'cash' ? 'bg-green-100' : 'bg-blue-100'
                                                }`}>
                                                {getMethodIcon(payment.method)}
                                            </div>
                                            <div>
                                                <p className="font-body text-body-sm font-medium text-primary-dark">
                                                    {payment.customer?.name || 'Unknown'}
                                                </p>
                                                <p className="font-accent text-caption text-warm-gray">
                                                    {getMethodLabel(payment.method)} • {new Date(payment.paymentDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-body text-body-md font-medium text-primary-dark">
                                                 R{payment.amount.toFixed(2)}
                                             </p>
                                            <span className={`text-caption ${payment.invoiceStatus === 'paid' ? 'text-green-600' : 'text-yellow-600'
                                                }`}>
                                                {payment.invoiceStatus}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Weekly/Monthly Payment Stats */}
            {!paymentLoading && paymentStats && (
                <Card>
                    <CardHeader
                        title="Payment Overview"
                        subtitle="Payment statistics for different periods"
                    />
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Today's Stats */}
                            <div className="p-4 bg-cream/50 rounded-lg">
                                <h4 className="font-accent text-caption text-warm-gray uppercase mb-3">Today</h4>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-warm-gray">Total</span>
                                        <span className="font-medium text-primary-dark">R{paymentStats.today.total.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-purple-600">
                                        <span>💳 Yoco</span>
                                         <span>R{paymentStats.today.yoco.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-green-600">
                                        <span>💵 Cash</span>
                                         <span>R{paymentStats.today.cash.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-blue-600">
                                        <span>🏦 EFT</span>
                                         <span>R{paymentStats.today.eft.toFixed(2)}</span>
                                    </div>
                                    <div className="pt-2 border-t border-gray-200 text-caption text-warm-gray">
                                        {paymentStats.today.count} transactions
                                    </div>
                                </div>
                            </div>

                            {/* Weekly Stats */}
                            <div className="p-4 bg-cream/50 rounded-lg">
                                <h4 className="font-accent text-caption text-warm-gray uppercase mb-3">This Week</h4>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-warm-gray">Total</span>
                                        <span className="font-medium text-primary-dark">R{paymentStats.week.total.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-purple-600">
                                        <span>💳 Yoco</span>
                                         <span>R{paymentStats.week.yoco.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-green-600">
                                        <span>💵 Cash</span>
                                         <span>R{paymentStats.week.cash.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-blue-600">
                                        <span>🏦 EFT</span>
                                         <span>R{paymentStats.week.eft.toFixed(2)}</span>
                                    </div>
                                    <div className="pt-2 border-t border-gray-200 text-caption text-warm-gray">
                                        {paymentStats.week.count} transactions
                                    </div>
                                </div>
                            </div>

                            {/* Monthly Stats */}
                            <div className="p-4 bg-cream/50 rounded-lg">
                                <h4 className="font-accent text-caption text-warm-gray uppercase mb-3">This Month</h4>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-warm-gray">Total</span>
                                        <span className="font-medium text-primary-dark">R{paymentStats.month.total.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-purple-600">
                                        <span>💳 Yoco</span>
                                         <span>R{paymentStats.month.yoco.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-green-600">
                                        <span>💵 Cash</span>
                                         <span>R{paymentStats.month.cash.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-blue-600">
                                        <span>🏦 EFT</span>
                                         <span>R{paymentStats.month.eft.toFixed(2)}</span>
                                    </div>
                                    <div className="pt-2 border-t border-gray-200 text-caption text-warm-gray">
                                        {paymentStats.month.count} transactions
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Recent Orders */}
            <Card>
                <CardHeader
                    title="Recent Orders"
                    subtitle="Latest pending orders requiring attention"
                />
                <CardContent>
                    {recentOrders?.length === 0 ? (
                        <div className="text-center py-8">
                            <ShoppingCart className="mx-auto h-12 w-12 text-light-gray mb-4" />
                            <p className="font-body text-body-md text-warm-gray">No pending orders</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {(recentOrders ?? []).slice(0, 5).map((order: unknown) => {
                                const o = order as { id?: string; customerName?: string; total?: number; status?: string; createdAt?: string };
                                return (
                                    <div
                                        key={o.id}
                                        className="flex items-center justify-between p-4 bg-cream/30 rounded-lg hover:bg-cream/50 transition-colors"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="p-2 bg-sage-green/10 rounded-lg">
                                                <ShoppingCart size={20} className="text-sage-green" />
                                            </div>
                                            <div>
                                                <p className="font-body text-body-md font-medium text-primary-dark">
                                                    Order #{o.id?.slice(-6) ?? 'N/A'}
                                                </p>
                                                <p className="font-body text-body-sm text-warm-gray">
                                                    {o.customerName ?? 'Unknown Customer'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-body text-body-md font-medium text-primary-dark">
                                                 R{((o.total ?? 0)).toFixed(2)}
                                             </p>
                                            <p className="font-accent text-caption text-warning uppercase">
                                                {o.status ?? 'pending'}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <a
                    href="/admin/orders"
                    className="flex items-center gap-4 p-6 bg-terracotta text-white rounded-lg hover:bg-terracotta/90 transition-colors"
                >
                    <ShoppingCart size={28} />
                    <div>
                        <p className="font-body text-body-lg font-medium">Manage Orders</p>
                        <p className="font-accent text-caption opacity-80">View and process orders</p>
                    </div>
                </a>
                <a
                    href="/admin/products"
                    className="flex items-center gap-4 p-6 bg-sage-green text-white rounded-lg hover:bg-sage-green/90 transition-colors"
                >
                    <Package size={28} />
                    <div>
                        <p className="font-body text-body-lg font-medium">Manage Products</p>
                        <p className="font-accent text-caption opacity-80">Update your catalog</p>
                    </div>
                </a>
                <a
                    href="/admin/reports"
                    className="flex items-center gap-4 p-6 bg-info text-white rounded-lg hover:bg-info/90 transition-colors"
                >
                    <TrendingUp size={28} />
                    <div>
                        <p className="font-body text-body-lg font-medium">View Reports</p>
                        <p className="font-accent text-caption opacity-80">Sales analytics</p>
                    </div>
                </a>
            </div>
        </div>
    );
};

export default AdminDashboard;
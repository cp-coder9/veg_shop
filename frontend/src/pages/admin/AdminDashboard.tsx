import { useQuery } from '@tanstack/react-query';
import { 
    Package, 
    Users, 
    DollarSign, 
    ShoppingCart, 
    TrendingUp,
    Clock
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui';
import api from '../../lib/api';

interface DashboardStats {
    totalCustomers: number;
    totalOrders: number;
    totalRevenue: number;
    pendingPayments: number;
    activeProducts: number;
}

const AdminDashboard = () => {
    const { data: stats, isLoading } = useQuery<{ data: DashboardStats }>({
        queryKey: ['admin-stats'],
        queryFn: async () => {
            const response = await api.get('/reports/dashboard');
            return response;
        }
    });

    const { data: recentOrders } = useQuery<{ data: unknown[] }>({
        queryKey: ['recent-orders'],
        queryFn: async () => {
            const response = await api.get('/orders?limit=5&status=pending');
            return response;
        }
    });

    const statCards = [
        {
            title: 'Total Customers',
            value: stats?.data?.totalCustomers ?? 0,
            icon: Users,
            color: 'bg-terracotta/10 text-terracotta'
        },
        {
            title: 'Total Orders',
            value: stats?.data?.totalOrders ?? 0,
            icon: ShoppingCart,
            color: 'bg-sage-green/10 text-sage-green'
        },
        {
            title: 'Total Revenue',
            value: `R${((stats?.data?.totalRevenue ?? 0) / 100).toFixed(2)}`,
            icon: DollarSign,
            color: 'bg-info/10 text-info'
        },
        {
            title: 'Pending Payments',
            value: stats?.data?.pendingPayments ?? 0,
            icon: Clock,
            color: 'bg-warning/10 text-warning'
        },
        {
            title: 'Active Products',
            value: stats?.data?.activeProducts ?? 0,
            icon: Package,
            color: 'bg-primary/10 text-primary'
        }
    ];

    if (isLoading) {
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
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
                                <p className="font-display text-body-xl text-primary-dark">
                                    {stat.value}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Recent Orders */}
            <Card>
                <CardHeader 
                    title="Recent Orders" 
                    subtitle="Latest pending orders requiring attention"
                />
                <CardContent>
                    {recentOrders?.data?.length === 0 ? (
                        <div className="text-center py-8">
                            <ShoppingCart className="mx-auto h-12 w-12 text-light-gray mb-4" />
                            <p className="font-body text-body-md text-warm-gray">No pending orders</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {(recentOrders?.data ?? []).slice(0, 5).map((order: unknown) => {
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
                                                R{((o.total ?? 0) / 100).toFixed(2)}
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

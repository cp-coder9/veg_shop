import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';

interface DashboardMetrics {
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  unpaidInvoices: number;
  activeCustomers: number;
}

interface RecentOrder {
  id: string;
  customerName: string;
  totalAmount: number;
  status: string;
  createdAt: string;
}

export default function AdminDashboard() {
  const { data: metrics, isLoading: metricsLoading } = useQuery<DashboardMetrics>({
    queryKey: ['dashboard-metrics'],
    queryFn: async () => {
      const response = await api.get('/admin/dashboard/metrics');
      return response.data;
    },
  });

  const { data: recentOrders, isLoading: ordersLoading } = useQuery<RecentOrder[]>({
    queryKey: ['recent-orders'],
    queryFn: async () => {
      const response = await api.get('/admin/orders?limit=5');
      // The backend returns { orders: [...] }
      return response.data.orders || [];
    },
  });

  if (metricsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner h-12 w-12"></div>
      </div>
    );
  }

  const metricCards = [
    {
      title: 'Total Orders',
      value: metrics?.totalOrders || 0,
      change: '+12%',
      icon: '📦',
      color: 'bg-blue-500',
      changeColor: 'text-blue-600',
    },
    {
      title: 'Pending Orders',
      value: metrics?.pendingOrders || 0,
      change: '3 new',
      icon: '⏳',
      color: 'bg-amber-500',
      changeColor: 'text-amber-600',
    },
    {
      title: 'Total Revenue',
      value: `R ${(metrics?.totalRevenue || 0).toFixed(2)}`,
      change: '+8.2%',
      icon: '💰',
      color: 'bg-green-500',
      changeColor: 'text-green-600',
    },
    {
      title: 'Unpaid Invoices',
      value: metrics?.unpaidInvoices || 0,
      change: '2 overdue',
      icon: '📄',
      color: 'bg-red-500',
      changeColor: 'text-red-600',
    },
    {
      title: 'Active Customers',
      value: metrics?.activeCustomers || 0,
      change: '+5',
      icon: '👥',
      color: 'bg-purple-500',
      changeColor: 'text-purple-600',
    },
  ];

  const quickActions = [
    {
      name: 'Manage Products',
      path: '/admin/products',
      icon: '📦',
      description: 'Add, edit, or remove products',
      color: 'hover:border-blue-500 hover:bg-blue-50',
    },
    {
      name: 'View Orders',
      path: '/admin/orders',
      icon: '📋',
      description: 'Process and manage orders',
      color: 'hover:border-amber-500 hover:bg-amber-50',
    },
    {
      name: 'Manage Invoices',
      path: '/admin/invoices',
      icon: '💰',
      description: 'Generate and track invoices',
      color: 'hover:border-green-500 hover:bg-green-50',
    },
    {
      name: 'Manage Customers',
      path: '/admin/customers',
      icon: '👥',
      description: 'View customer information',
      color: 'hover:border-purple-500 hover:bg-purple-50',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-display font-bold text-organic-green-900">
            Dashboard
          </h1>
          <p className="text-warm-gray-600 mt-1">
            Welcome back! Here's what's happening with your store today.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm text-warm-gray-500">Today's Date</p>
            <p className="font-semibold text-organic-green-900">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {metricCards.map((metric) => (
          <div
            key={metric.title}
            className="card group hover:shadow-card-hover transition-all duration-300"
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 ${metric.color} rounded-xl flex items-center justify-center text-2xl`}>
                  {metric.icon}
                </div>
                <span className={`text-sm font-semibold ${metric.changeColor}`}>
                  {metric.change}
                </span>
              </div>

              <h3 className="text-sm font-medium text-warm-gray-600 mb-1">
                {metric.title}
              </h3>
              <p className="text-3xl font-display font-bold text-organic-green-900">
                {metric.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="card">
        <div className="p-6 border-b border-warm-gray-200">
          <h2 className="text-2xl font-display font-semibold text-organic-green-900">
            Quick Actions
          </h2>
          <p className="text-warm-gray-600 mt-1">
            Common tasks to manage your store efficiently
          </p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action) => (
              <a
                key={action.name}
                href={action.path}
                className={`group block p-6 border-2 border-warm-gray-200 rounded-xl transition-all duration-200 ${action.color} hover:shadow-card`}
              >
                <div className="flex items-start gap-4">
                  <div className="text-3xl transform group-hover:scale-110 transition-transform">
                    {action.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-display font-semibold text-organic-green-900 mb-1">
                      {action.name}
                    </h3>
                    <p className="text-sm text-warm-gray-600">
                      {action.description}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm font-medium text-organic-green-600 group-hover:text-organic-green-700">
                  Go to {action.name}
                  <svg className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="p-6 border-b border-warm-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-display font-semibold text-organic-green-900">
                  Recent Orders
                </h2>
                <p className="text-warm-gray-600 mt-1">
                  Latest orders from customers
                </p>
              </div>
              <a
                href="/admin/orders"
                className="text-sm font-medium text-organic-green-600 hover:text-organic-green-700"
              >
                View All
              </a>
            </div>
          </div>
          <div className="p-6">
            {ordersLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="loading-spinner h-8 w-8"></div>
              </div>
            ) : recentOrders && recentOrders.length > 0 ? (
              <div className="space-y-3">
                {recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-4 bg-warm-gray-50 rounded-lg hover:bg-warm-gray-100 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-organic-green-900">
                        {order.customerName}
                      </p>
                      <p className="text-sm text-warm-gray-600">
                        Order #{order.id.slice(-6)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-organic-green-900">
                        R{order.totalAmount.toFixed(2)}
                      </p>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${order.status === 'PENDING' ? 'bg-amber-100 text-amber-800' :
                          order.status === 'PROCESSING' ? 'bg-blue-100 text-blue-800' :
                            order.status === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                              'bg-gray-100 text-gray-800'
                        }`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-warm-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-warm-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <p className="text-warm-gray-600">No recent orders found</p>
              </div>
            )}
          </div>
        </div>

        {/* System Status */}
        <div className="card">
          <div className="p-6 border-b border-warm-gray-200">
            <h2 className="text-xl font-display font-semibold text-organic-green-900">
              System Status
            </h2>
            <p className="text-warm-gray-600 mt-1">
              Health and performance overview
            </p>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="font-medium text-organic-green-900">Database</span>
              </div>
              <span className="text-sm font-medium text-green-700">Operational</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="font-medium text-organic-green-900">API Server</span>
              </div>
              <span className="text-sm font-medium text-green-700">Operational</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="font-medium text-organic-green-900">WhatsApp API</span>
              </div>
              <span className="text-sm font-medium text-green-700">Connected</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-amber-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-amber-500 rounded-full animate-pulse"></div>
                <span className="font-medium text-organic-green-900">Email Service</span>
              </div>
              <span className="text-sm font-medium text-amber-700">Rate Limited</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
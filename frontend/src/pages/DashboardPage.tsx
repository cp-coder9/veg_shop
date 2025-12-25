import { Link } from 'react-router-dom';
import { useClientDashboard } from '../hooks/useClientDashboard';

export default function DashboardPage() {
    const { data: dashboard, isLoading, isError } = useClientDashboard();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-center">
                    <div className="loading-spinner h-12 w-12 mx-auto"></div>
                    <p className="mt-4 text-warm-gray-600 dark:text-warm-gray-400">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    if (isError || !dashboard) {
        return (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg">
                Failed to load dashboard. Please try again later.
            </div>
        );
    }

    const { stats, recentOrders, nextDelivery, outstandingInvoices } = dashboard;

    return (
        <div className="max-w-6xl mx-auto">
            <h1 className="text-3xl font-display font-bold text-organic-green-900 dark:text-organic-green-400 mb-8">
                Welcome back, {dashboard.customer.name}!
            </h1>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Credit Balance */}
                <div className="card p-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-organic-green-100 dark:bg-organic-green-900/50 rounded-lg flex items-center justify-center">
                            <svg className="w-6 h-6 text-organic-green-600 dark:text-organic-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm text-warm-gray-500 dark:text-warm-gray-400">Credit Balance</p>
                            <p className="text-2xl font-bold text-organic-green-600 dark:text-organic-green-400">
                                R {stats.creditBalance.toFixed(2)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Outstanding Amount */}
                <div className="card p-6">
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${stats.outstandingAmount > 0
                                ? 'bg-amber-100 dark:bg-amber-900/50'
                                : 'bg-warm-gray-100 dark:bg-warm-gray-700'
                            }`}>
                            <svg className={`w-6 h-6 ${stats.outstandingAmount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-warm-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm text-warm-gray-500 dark:text-warm-gray-400">Outstanding</p>
                            <p className={`text-2xl font-bold ${stats.outstandingAmount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-warm-gray-900 dark:text-warm-gray-100'}`}>
                                R {stats.outstandingAmount.toFixed(2)}
                            </p>
                            {stats.outstandingInvoices > 0 && (
                                <p className="text-xs text-warm-gray-500 dark:text-warm-gray-400">{stats.outstandingInvoices} invoice(s)</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Total Orders */}
                <div className="card p-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center">
                            <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm text-warm-gray-500 dark:text-warm-gray-400">Total Orders</p>
                            <p className="text-2xl font-bold text-warm-gray-900 dark:text-warm-gray-100">{stats.totalOrders}</p>
                        </div>
                    </div>
                </div>

                {/* Total Spent */}
                <div className="card p-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/50 rounded-lg flex items-center justify-center">
                            <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm text-warm-gray-500 dark:text-warm-gray-400">Total Spent</p>
                            <p className="text-2xl font-bold text-warm-gray-900 dark:text-warm-gray-100">R {stats.totalSpent.toFixed(2)}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Next Delivery */}
                <div className="lg:col-span-1">
                    <h2 className="text-xl font-semibold text-warm-gray-900 dark:text-warm-gray-100 mb-4">Next Delivery</h2>
                    <div className="card p-6">
                        {nextDelivery ? (
                            <div className="text-center">
                                <div className="w-16 h-16 bg-organic-green-100 dark:bg-organic-green-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-organic-green-600 dark:text-organic-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <p className="text-2xl font-bold text-organic-green-900 dark:text-organic-green-400 mb-1">
                                    {new Date(nextDelivery.date).toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'short' })}
                                </p>
                                <p className="text-sm text-warm-gray-500 dark:text-warm-gray-400 capitalize">{nextDelivery.method}</p>
                                <Link to={`/orders`} className="text-sm text-organic-green-600 dark:text-organic-green-400 hover:underline mt-2 inline-block">
                                    View Order →
                                </Link>
                            </div>
                        ) : (
                            <div className="text-center py-4">
                                <p className="text-warm-gray-500 dark:text-warm-gray-400">No upcoming deliveries</p>
                                <Link to="/products" className="btn-primary mt-4 inline-block">
                                    Shop Now
                                </Link>
                            </div>
                        )}
                    </div>
                </div>

                {/* Recent Orders */}
                <div className="lg:col-span-2">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold text-warm-gray-900 dark:text-warm-gray-100">Recent Orders</h2>
                        <Link to="/orders" className="text-sm text-organic-green-600 dark:text-organic-green-400 hover:underline">
                            View All →
                        </Link>
                    </div>
                    <div className="card divide-y divide-warm-gray-200 dark:divide-warm-gray-700">
                        {recentOrders.length === 0 ? (
                            <div className="p-6 text-center text-warm-gray-500 dark:text-warm-gray-400">
                                No orders yet. <Link to="/products" className="text-organic-green-600 dark:text-organic-green-400 hover:underline">Start shopping</Link>
                            </div>
                        ) : (
                            recentOrders.map(order => (
                                <div key={order.id} className="p-4 flex items-center justify-between hover:bg-warm-gray-50 dark:hover:bg-warm-gray-700/50 transition">
                                    <div>
                                        <p className="font-medium text-warm-gray-900 dark:text-warm-gray-100">Order #{order.id.slice(0, 8)}</p>
                                        <p className="text-sm text-warm-gray-500 dark:text-warm-gray-400">
                                            {order.itemCount} item(s) • {new Date(order.deliveryDate).toLocaleDateString('en-ZA')}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-warm-gray-900 dark:text-warm-gray-100">R {order.total.toFixed(2)}</p>
                                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${order.status === 'delivered' ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300' :
                                                order.status === 'pending' ? 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300' :
                                                    'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300'
                                            }`}>
                                            {order.status}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Outstanding Invoices */}
            {outstandingInvoices.length > 0 && (
                <div className="mt-8">
                    <h2 className="text-xl font-semibold text-warm-gray-900 dark:text-warm-gray-100 mb-4">Outstanding Invoices</h2>
                    <div className="card divide-y divide-warm-gray-200 dark:divide-warm-gray-700">
                        {outstandingInvoices.map(invoice => (
                            <div key={invoice.id} className="p-4 flex items-center justify-between">
                                <div>
                                    <p className="font-medium text-warm-gray-900 dark:text-warm-gray-100">Invoice #{invoice.id.slice(0, 8)}</p>
                                    <p className="text-sm text-warm-gray-500 dark:text-warm-gray-400">
                                        Due: {new Date(invoice.dueDate).toLocaleDateString('en-ZA')}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-amber-600 dark:text-amber-400">R {invoice.total.toFixed(2)}</p>
                                    <span className="text-xs text-warm-gray-500 dark:text-warm-gray-400 capitalize">{invoice.status}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Quick Actions */}
            <div className="mt-8 flex flex-wrap gap-4">
                <Link to="/products" className="btn-primary">
                    Browse Products
                </Link>
                <Link to="/payments" className="btn-secondary dark:bg-warm-gray-700 dark:text-warm-gray-200 dark:hover:bg-warm-gray-600">
                    Payment History
                </Link>
                <Link to="/profile" className="btn-secondary dark:bg-warm-gray-700 dark:text-warm-gray-200 dark:hover:bg-warm-gray-600">
                    Edit Profile
                </Link>
            </div>
        </div>
    );
}

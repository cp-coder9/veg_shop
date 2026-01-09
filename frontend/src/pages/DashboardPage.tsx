import { Link, useNavigate } from 'react-router-dom';
import { useClientDashboard } from '../hooks/useClientDashboard';
import { useCartStore } from '../stores/cartStore';
import api from '../lib/api';
import { toast } from 'react-hot-toast';

export default function DashboardPage() {
    const navigate = useNavigate();
    const { data: dashboard, isLoading, isError } = useClientDashboard();
    const setCartItems = useCartStore(state => state.setItems);

    const handleQuickReorder = async (orderId: string) => {
        try {
            const { data: order } = await api.get(`/orders/${orderId}`);
            const items = order.items.map((item: any) => ({
                productId: item.productId,
                quantity: item.quantity
            }));
            setCartItems(items);
            toast.success('Items added to cart!');
            navigate('/cart');
        } catch (error) {
            toast.error('Failed to reorder items');
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-center">
                    <div className="loading-spinner h-12 w-12 mx-auto animate-spin rounded-full border-4 border-organic-green-100 border-t-organic-green-600"></div>
                    <p className="mt-4 text-warm-gray-600 dark:text-warm-gray-400 font-medium">Loading your harvest...</p>
                </div>
            </div>
        );
    }

    if (isError || !dashboard) {
        return (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg border border-red-100 dark:border-red-900/30">
                Failed to load dashboard. Please try again later.
            </div>
        );
    }

    const { stats, recentOrders, nextDelivery, outstandingInvoices } = dashboard;

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
            <header>
                <h1 className="text-3xl font-display font-bold text-organic-green-900 dark:text-organic-green-400">
                    {stats.totalOrders === 0 ? `Welcome to Totey, ${dashboard.customer.name}!` : `Welcome back, ${dashboard.customer.name}!`}
                </h1>
            </header>

            {/* Hero Section - Order Status */}
            <section className="bg-gradient-to-r from-organic-green-600 to-organic-green-500 rounded-2xl p-6 md:p-8 text-white shadow-lg relative overflow-hidden">
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-300 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-200"></span>
                            </span>
                            <span className="font-bold text-green-50 uppercase tracking-wider text-xs">Ordering is Open</span>
                        </div>
                        <h2 className="text-3xl font-display font-bold">
                            Fresh Harvest Available!
                        </h2>
                        <p className="text-green-50 text-lg max-w-xl opacity-90">
                            The deadline for orders is <span className="font-bold underline italic">Friday at 12:00 PM</span> for next week's delivery. Don't miss out on this week's fresh picks.
                        </p>
                    </div>
                    <div className="flex-shrink-0">
                        <Link
                            to="/products"
                            className="inline-flex items-center gap-2 bg-white text-organic-green-600 hover:bg-green-50 px-8 py-4 rounded-xl font-bold text-lg shadow-xl shadow-green-900/20 transition-all hover:scale-105 active:scale-95"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            Order Now
                        </Link>
                    </div>
                </div>
                {/* Decorative Patterns */}
                <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-60 h-60 bg-white/5 rounded-full blur-2xl"></div>
            </section>

            {/* Stats Cards Grid */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* Loyalty Points */}
                <div className="card p-4 hover:shadow-md transition-shadow cursor-default">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/50 rounded-xl flex items-center justify-center">
                            <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.54 1.118l-3.976-2.888a1 1 0 00-1.175 0l-3.976 2.888c-.784.57-1.838-.196-1.539-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.382-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-xs text-warm-gray-500 dark:text-warm-gray-400 font-bold uppercase tracking-wider">Points</p>
                            <p className="text-xl font-bold text-amber-600 dark:text-amber-500">{stats.loyaltyPoints}</p>
                        </div>
                    </div>
                </div>

                {/* Credit Balance */}
                <div className="card p-4 hover:shadow-md transition-shadow cursor-default">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-organic-green-100 dark:bg-organic-green-900/50 rounded-xl flex items-center justify-center">
                            <svg className="w-5 h-5 text-organic-green-600 dark:text-organic-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-xs text-warm-gray-500 dark:text-warm-gray-400 font-bold uppercase tracking-wider">Credit</p>
                            <p className="text-xl font-bold text-organic-green-600 dark:text-organic-green-400">R {stats.creditBalance.toFixed(2)}</p>
                        </div>
                    </div>
                </div>

                {/* Outstanding */}
                <div className="card p-4 hover:shadow-md transition-shadow cursor-default">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stats.outstandingAmount > 0
                            ? 'bg-rose-100 dark:bg-rose-900/50'
                            : 'bg-warm-gray-100 dark:bg-warm-gray-700'}`}>
                            <svg className={`w-5 h-5 ${stats.outstandingAmount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-warm-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-xs text-warm-gray-500 dark:text-warm-gray-400 font-bold uppercase tracking-wider">Unpaid</p>
                            <p className={`text-xl font-bold ${stats.outstandingAmount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-warm-gray-900 dark:text-warm-gray-100'}`}>R {stats.outstandingAmount.toFixed(2)}</p>
                        </div>
                    </div>
                </div>

                {/* Total Orders */}
                <div className="card p-4 hover:shadow-md transition-shadow cursor-default">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-xl flex items-center justify-center">
                            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-xs text-warm-gray-500 dark:text-warm-gray-400 font-bold uppercase tracking-wider">Orders</p>
                            <p className="text-xl font-bold text-warm-gray-900 dark:text-warm-gray-100">{stats.totalOrders}</p>
                        </div>
                    </div>
                </div>

                {/* Total Spent */}
                <div className="card p-4 hover:shadow-md transition-shadow cursor-default">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/50 rounded-xl flex items-center justify-center">
                            <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-xs text-warm-gray-500 dark:text-warm-gray-400 font-bold uppercase tracking-wider">Spent</p>
                            <p className="text-xl font-bold text-warm-gray-900 dark:text-warm-gray-100">R {stats.totalSpent.toFixed(2)}</p>
                        </div>
                    </div>
                </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Next Delivery Preview */}
                <section className="lg:col-span-1 space-y-4">
                    <h2 className="text-xl font-semibold text-warm-gray-900 dark:text-warm-gray-100">Next Delivery</h2>
                    <div className="card p-6 border-t-4 border-t-organic-green-600">
                        {nextDelivery ? (
                            <div className="text-center space-y-4">
                                <div className="w-16 h-16 bg-organic-green-50 dark:bg-organic-green-900/30 rounded-full flex items-center justify-center mx-auto shadow-inner">
                                    <svg className="w-8 h-8 text-organic-green-600 dark:text-organic-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-organic-green-900 dark:text-organic-green-400 mb-1">
                                        {new Date(nextDelivery.date).toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'short' })}
                                    </p>
                                    <p className="text-sm font-medium text-warm-gray-500 dark:text-warm-gray-400 uppercase tracking-widest">{nextDelivery.method}</p>
                                </div>
                                <Link to="/orders" className="btn-secondary w-full text-sm py-2">
                                    View Order Detail
                                </Link>
                            </div>
                        ) : (
                            <div className="text-center py-6 space-y-4">
                                <p className="text-warm-gray-500 dark:text-warm-gray-400 italic">No deliveries scheduled yet</p>
                                <Link to="/products" className="btn-primary w-full">
                                    Browse Shop
                                </Link>
                            </div>
                        )}
                    </div>
                </section>

                {/* Recent Orders Preview */}
                <section className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-warm-gray-900 dark:text-warm-gray-100">Recent Activity</h2>
                        <Link to="/orders" className="text-sm font-bold text-organic-green-600 dark:text-organic-green-400 hover:text-organic-green-700 transition-colors">
                            Full Order History →
                        </Link>
                    </div>
                    <div className="card overflow-hidden">
                        {recentOrders.length === 0 ? (
                            <div className="p-12 text-center text-warm-gray-500 dark:text-warm-gray-400">
                                <p>You haven't placed any orders yet.</p>
                                <Link to="/products" className="text-organic-green-600 hover:underline font-bold mt-2 inline-block">Start your first shop</Link>
                            </div>
                        ) : (
                            <div className="divide-y divide-warm-gray-100 dark:divide-warm-gray-800">
                                {recentOrders.map(order => (
                                    <div key={order.id} className="p-4 flex items-center justify-between hover:bg-warm-gray-50 dark:hover:bg-warm-gray-800/50 transition-colors">
                                        <div className="space-y-1">
                                            <p className="font-bold text-warm-gray-900 dark:text-warm-gray-100">Order #{order.id.slice(0, 8)}</p>
                                            <p className="text-xs text-warm-gray-500 dark:text-warm-gray-400">
                                                {order.itemCount} items • {new Date(order.deliveryDate).toLocaleDateString('en-ZA')}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <div className="text-right">
                                                <p className="font-bold text-warm-gray-900 dark:text-warm-gray-100">R {order.total.toFixed(2)}</p>
                                                <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tighter ${order.status === 'delivered' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                        order.status === 'pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                                                            'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                                    }`}>
                                                    {order.status}
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => handleQuickReorder(order.id)}
                                                className="p-2 text-organic-green-600 hover:bg-organic-green-100 rounded-full transition-all hover:rotate-12 active:scale-90"
                                                title="Quick Reorder (Add to Cart)"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </section>
            </div>

            {/* Outstanding Invoices Alert */}
            {outstandingInvoices.length > 0 && (
                <section className="space-y-4 animate-in slide-in-from-bottom duration-700">
                    <h2 className="text-xl font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        Attention Needed: Outstanding Invoices
                    </h2>
                    <div className="card divide-y divide-warm-gray-100 dark:divide-warm-gray-800 overflow-hidden border-rose-100 dark:border-rose-900/30">
                        {outstandingInvoices.map(invoice => (
                            <div key={invoice.id} className="p-4 flex items-center justify-between bg-rose-50/30 dark:bg-rose-900/10">
                                <div>
                                    <p className="font-bold text-warm-gray-900 dark:text-warm-gray-100 underline decoration-rose-300">Invoice #{invoice.id.slice(0, 8)}</p>
                                    <p className="text-xs text-warm-gray-500 dark:text-warm-gray-400">
                                        Due Date: {new Date(invoice.dueDate).toLocaleDateString('en-ZA')}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-rose-600 dark:text-rose-400 text-lg">R {invoice.total.toFixed(2)}</p>
                                    <span className="text-[10px] font-bold text-warm-gray-500 uppercase tracking-widest">{invoice.status}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Quick Navigation Footer */}
            <footer className="pt-8 border-t border-warm-gray-100 dark:border-warm-gray-800 flex flex-wrap gap-4">
                <Link to="/products" className="btn-primary px-6">
                    Start New Shop
                </Link>
                <Link to="/payments" className="btn-secondary dark:bg-warm-gray-700 dark:text-warm-gray-200 hover:shadow-inner transition-all">
                    View Payment History
                </Link>
                <Link to="/profile" className="btn-secondary dark:bg-warm-gray-700 dark:text-warm-gray-200 hover:shadow-inner transition-all">
                    Account Settings
                </Link>
            </footer>
        </div>
    );
}

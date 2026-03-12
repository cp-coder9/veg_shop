import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useClientDashboard } from '../hooks/useClientDashboard';
import { useProducts } from '../hooks/useProducts';
import { useCartStore } from '../stores/cartStore';
import api from '../lib/api';
import { toast } from 'react-hot-toast';
import { formatPrice } from '../lib/utils';
import { Button, Input, Card, Badge } from '../components/ui';

export default function DashboardPage() {
    const navigate = useNavigate();
    const { data: dashboard, isLoading, isError } = useClientDashboard();
    const { data: productsData, isLoading: productsLoading } = useProducts();
    const { addItem, getItemQuantity, updateQuantity } = useCartStore();
    const setCartItems = useCartStore((state: any) => state.setItems);
    const [searchTerm, setSearchTerm] = useState('');

    interface OrderItem {
        productId: string;
        quantity: number;
    }

    const handleQuickReorder = async (orderId: string) => {
        try {
            const { data: order } = await api.get(`/orders/${orderId}`);
            const items = order.items.map((item: OrderItem) => ({
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
                    <div className="loading-spinner h-12 w-12 mx-auto animate-spin rounded-full border-4 border-light-gray border-t-terracotta"></div>
                    <p className="mt-4 font-body text-body-md text-warm-gray">Loading your harvest...</p>
                </div>
            </div>
        );
    }

    if (isError || !dashboard) {
        return (
            <div className="bg-red-50 text-error px-4 py-3 rounded-lg border border-error/20 font-body">
                Failed to load dashboard. Please try again later.
            </div>
        );
    }

    const { stats, recentOrders, nextDelivery, outstandingInvoices } = dashboard;

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
            <header>
                <h1 className="font-display text-display-md text-primary-dark">
                    {stats.totalOrders === 0 ? `Welcome to Totey, ${dashboard.customer.name}!` : `Welcome back, ${dashboard.customer.name}!`}
                </h1>
            </header>

            {/* Hero Section - Order Status */}
            <section className="bg-gradient-to-r from-sage-green to-sage-green/80 rounded-2xl p-6 md:p-8 text-white shadow-lg relative overflow-hidden">
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-300 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-200"></span>
                            </span>
                            <span className="font-accent text-caption font-bold text-green-50 uppercase tracking-wider">Ordering is Open</span>
                        </div>
                        <h2 className="font-display text-display-sm">
                            Fresh Harvest Available!
                        </h2>
                        <p className="font-body text-body-lg text-green-50 max-w-xl opacity-90">
                            The deadline for orders is <span className="font-bold underline italic">Friday at 12:00 PM</span> for next week's delivery. Don't miss out on this week's fresh picks.
                        </p>
                    </div>
                    <div className="flex-shrink-0">
                        <Link to="/products">
                            <Button
                                size="lg"
                                className="bg-white text-sage-green hover:bg-cream shadow-xl shadow-green-900/20 transition-all hover:scale-105 active:scale-95"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                                Order Now
                            </Button>
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
                <Card hoverable>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-muted-gold/20 rounded-xl flex items-center justify-center">
                            <svg className="w-5 h-5 text-muted-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.54 1.118l-3.976-2.888a1 1 0 00-1.175 0l-3.976 2.888c-.784.57-1.838-.196-1.539-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.382-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                            </svg>
                        </div>
                        <div>
                            <p className="font-accent text-caption text-warm-gray font-bold uppercase tracking-wider">Points</p>
                            <p className="font-display text-body-lg font-bold text-muted-gold">{stats.loyaltyPoints}</p>
                        </div>
                    </div>
                </Card>

                {/* Credit Balance */}
                <Card hoverable>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-sage-green/20 rounded-xl flex items-center justify-center">
                            <svg className="w-5 h-5 text-sage-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <p className="font-accent text-caption text-warm-gray font-bold uppercase tracking-wider">Credit</p>
                            <p className="font-display text-body-lg font-bold text-sage-green">R {stats.creditBalance.toFixed(2)}</p>
                        </div>
                    </div>
                </Card>

                {/* Outstanding */}
                <Card hoverable>
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stats.outstandingAmount > 0 ? 'bg-error/20' : 'bg-light-gray'}`}>
                            <svg className={`w-5 h-5 ${stats.outstandingAmount > 0 ? 'text-error' : 'text-warm-gray'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <div>
                            <p className="font-accent text-caption text-warm-gray font-bold uppercase tracking-wider">Unpaid</p>
                            <p className={`font-display text-body-lg font-bold ${stats.outstandingAmount > 0 ? 'text-error' : 'text-primary-dark'}`}>R {stats.outstandingAmount.toFixed(2)}</p>
                        </div>
                    </div>
                </Card>

                {/* Total Orders */}
                <Card hoverable>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-info/20 rounded-xl flex items-center justify-center">
                            <svg className="w-5 h-5 text-info" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                            </svg>
                        </div>
                        <div>
                            <p className="font-accent text-caption text-warm-gray font-bold uppercase tracking-wider">Orders</p>
                            <p className="font-display text-body-lg font-bold text-primary-dark">{stats.totalOrders}</p>
                        </div>
                    </div>
                </Card>

                {/* Total Spent */}
                <Card hoverable>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-terracotta/20 rounded-xl flex items-center justify-center">
                            <svg className="w-5 h-5 text-terracotta" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                        <div>
                            <p className="font-accent text-caption text-warm-gray font-bold uppercase tracking-wider">Spent</p>
                            <p className="font-display text-body-lg font-bold text-primary-dark">R {stats.totalSpent.toFixed(2)}</p>
                        </div>
                    </div>
                </Card>
            </section>

            {/* Quick Order - Simple Product List */}
            <section className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="font-display text-display-sm text-primary-dark">Quick Order</h2>
                    <Link to="/products" className="font-body text-body-sm font-bold text-terracotta hover:text-terracotta/80 transition-colors">
                        View Full Catalog →
                    </Link>
                </div>

                {/* Search Input */}
                <Input
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                    leftIcon={
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    }
                />

                {/* Product List */}
                <Card padding="none" className="overflow-hidden max-h-96 overflow-y-auto">
                    {productsLoading ? (
                        <div className="p-8 text-center font-body text-body-md text-warm-gray">Loading products...</div>
                    ) : (
                        <div className="divide-y divide-light-gray">
                            {(productsData || [])
                                ?.filter((p: { id: string; name: string; isAvailable: boolean }) => p.isAvailable)
                                ?.filter((p: { id: string; name: string; isAvailable: boolean }) => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
                                ?.slice(0, 50)
                                ?.map((product: { id: string; name: string; price: number | string; unit: string; isAvailable: boolean; deliveryDay?: string | null }) => {
                                    const qty = getItemQuantity(product.id);
                                    return (
                                        <div key={product.id} className="flex items-center justify-between p-3 hover:bg-cream/50 transition-colors">
                                            <div className="flex-1 min-w-0 mr-4">
                                                <p className="font-body text-body-md font-medium text-primary-dark truncate">{product.name}</p>
                                                <p className="font-body text-body-sm text-terracotta font-bold">
                                                    R{formatPrice(product.price)} <span className="text-warm-gray font-normal">/ {product.unit}</span>
                                                </p>
                                                {product.deliveryDay && (
                                                    <p className="font-accent text-caption text-sage-green font-bold flex items-center gap-1 mt-1">
                                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                        </svg>
                                                        Delivers {product.deliveryDay}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {qty > 0 ? (
                                                    <>
                                                        <button
                                                            onClick={() => updateQuantity(product.id, qty - 1)}
                                                            className="w-8 h-8 flex items-center justify-center rounded-full bg-light-gray text-primary-dark hover:bg-warm-gray/30 transition-colors"
                                                        >
                                                            −
                                                        </button>
                                                        <span className="w-8 text-center font-bold text-terracotta">{qty}</span>
                                                        <button
                                                            onClick={() => addItem(product.id, 1)}
                                                            className="w-8 h-8 flex items-center justify-center rounded-full bg-terracotta text-white hover:bg-terracotta/80 transition-colors"
                                                        >
                                                            +
                                                        </button>
                                                    </>
                                                ) : (
                                                    <Button
                                                        size="sm"
                                                        onClick={() => addItem(product.id, 1)}
                                                        className="bg-terracotta hover:bg-terracotta/80"
                                                    >
                                                        Add
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    )}
                </Card>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Next Delivery Preview */}
                <section className="lg:col-span-1 space-y-4">
                    <h2 className="font-display text-display-sm text-primary-dark">Next Delivery</h2>
                    <Card className="border-t-4 border-t-sage-green">
                        {nextDelivery ? (
                            <div className="text-center space-y-4">
                                <div className="w-16 h-16 bg-sage-green/20 rounded-full flex items-center justify-center mx-auto shadow-inner">
                                    <svg className="w-8 h-8 text-sage-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="font-display text-body-lg font-bold text-primary-dark mb-1">
                                        {new Date(nextDelivery.date).toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'short' })}
                                    </p>
                                    <p className="font-accent text-caption text-warm-gray uppercase tracking-widest">{nextDelivery.method}</p>
                                </div>
                                <Link to="/orders">
                                    <Button variant="secondary" className="w-full text-body-sm">View Order Detail</Button>
                                </Link>
                            </div>
                        ) : (
                            <div className="text-center py-6 space-y-4">
                                <p className="font-body text-body-md text-warm-gray italic">No deliveries scheduled yet</p>
                                <Link to="/products">
                                    <Button className="w-full">Browse Shop</Button>
                                </Link>
                            </div>
                        )}
                    </Card>
                </section>

                {/* Recent Orders Preview */}
                <section className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="font-display text-display-sm text-primary-dark">Recent Activity</h2>
                        <Link to="/orders" className="font-body text-body-sm font-bold text-terracotta hover:text-terracotta/80 transition-colors">
                            Full Order History →
                        </Link>
                    </div>
                    <Card padding="none" className="overflow-hidden">
                        {recentOrders.length === 0 ? (
                            <div className="p-12 text-center font-body text-body-md text-warm-gray">
                                <p>You haven't placed any orders yet.</p>
                                <Link to="/products" className="text-terracotta hover:underline font-bold mt-2 inline-block">Start your first shop</Link>
                            </div>
                        ) : (
                            <div className="divide-y divide-light-gray">
                                {recentOrders.map(order => (
                                    <div key={order.id} className="p-4 flex items-center justify-between hover:bg-cream/50 transition-colors">
                                        <div className="space-y-1">
                                            <p className="font-body text-body-md font-bold text-primary-dark">Order #{order.id.slice(0, 8)}</p>
                                            <p className="font-accent text-caption text-warm-gray">
                                                {order.itemCount} items • {new Date(order.deliveryDate).toLocaleDateString('en-ZA')}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <div className="text-right">
                                                <p className="font-body text-body-md font-bold text-primary-dark">R {order.total.toFixed(2)}</p>
                                                <Badge variant={order.status === 'delivered' ? 'success' : order.status === 'pending' ? 'warning' : 'info'}>
                                                    {order.status}
                                                </Badge>
                                            </div>
                                            <button
                                                onClick={() => handleQuickReorder(order.id)}
                                                className="p-2 text-terracotta hover:bg-terracotta/10 rounded-full transition-all hover:rotate-12 active:scale-90"
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
                    </Card>
                </section>
            </div>

            {/* Outstanding Invoices Alert */}
            {outstandingInvoices.length > 0 && (
                <section className="space-y-4 animate-in slide-in-from-bottom duration-700">
                    <h2 className="font-display text-display-sm text-error flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        Attention Needed: Outstanding Invoices
                    </h2>
                    <Card padding="none" className="divide-y divide-light-gray overflow-hidden border-error/20">
                        {outstandingInvoices.map(invoice => (
                            <div key={invoice.id} className="p-4 flex items-center justify-between bg-error/5">
                                <div>
                                    <p className="font-body text-body-md font-bold text-primary-dark underline decoration-error/50">Invoice #{invoice.id.slice(0, 8)}</p>
                                    <p className="font-accent text-caption text-warm-gray">
                                        Due Date: {new Date(invoice.dueDate).toLocaleDateString('en-ZA')}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="font-display text-body-lg font-bold text-error">R {invoice.total.toFixed(2)}</p>
                                    <span className="font-accent text-caption font-bold text-warm-gray uppercase tracking-widest">{invoice.status}</span>
                                </div>
                            </div>
                        ))}
                    </Card>
                </section>
            )}

            {/* Quick Navigation Footer */}
            <footer className="pt-8 border-t border-light-gray flex flex-wrap gap-4">
                <Link to="/products">
                    <Button>Start New Shop</Button>
                </Link>
                <Link to="/payments">
                    <Button variant="secondary">View Payment History</Button>
                </Link>
                <Link to="/profile">
                    <Button variant="ghost">Account Settings</Button>
                </Link>
            </footer>
        </div>
    );
}

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api.js';
import { toast } from 'react-hot-toast';

interface DriverOrderItem {
    id: string;
    quantity: number;
    product: {
        id: string;
        name: string;
        price: number;
        unit?: string;
    };
}

interface DriverOrder {
    id: string;
    customerId: string;
    deliveryDate: string;
    status: string;
    deliveryAddress: string;
    specialInstructions?: string;
    deliveryProof?: string;
    driverNotes?: string;
    coolerBagOption: boolean;
    coolerBagStatus: 'none' | 'taken' | 'returned';
    items?: DriverOrderItem[];
    customer: {
        name: string;
        address: string;
        phone: string;
        deliveryPreference: string;
    };
}

export default function DriverDashboard() {
    const queryClient = useQueryClient();
    const [selectedOrder, setSelectedOrder] = useState<DriverOrder | null>(null);
    const [activeTab, setActiveTab] = useState<'orders' | 'summary'>('orders');

    // Fetch Orders
    const { data: orders, isLoading } = useQuery<DriverOrder[]>({
        queryKey: ['driver-orders'],
        queryFn: async () => {
            const response = await api.get('/driver/orders');
            return response.data;
        },
        refetchInterval: 30000, // Refresh every 30s
    });

    const summaryItems = orders?.reduce((acc, order) => {
        if (order.status === 'delivered' || order.status === 'cancelled') return acc;
        order.items?.forEach(item => {
            const existing = acc.find(i => i.productId === item.product.id);
            if (existing) {
                existing.totalQuantity += item.quantity;
            } else {
                acc.push({
                    productId: item.product.id,
                    productName: item.product.name,
                    totalQuantity: item.quantity,
                    unit: item.product.unit || 'unit',
                });
            }
        });
        return acc;
    }, [] as { productId: string; productName: string; totalQuantity: number; unit: string }[]).sort((a, b) => a.productName.localeCompare(b.productName));

    // Update Status Mutation
    const updateStatus = useMutation({
        mutationFn: async (data: {
            id: string;
            status: string;
            deliveryProof: string;
            deliveryNotes?: string;
            coolerBagStatus?: 'none' | 'taken' | 'returned';
        }) => {
            await api.patch(`/driver/orders/${data.id}/status`, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['driver-orders'] });
            setSelectedOrder(null);
            toast.success('Delivery updated!');
        },
        onError: () => {
            toast.error('Failed to update delivery');
        },
    });

    const handleDelivery = (proof: string) => {
        if (!selectedOrder) return;
        updateStatus.mutate({
            id: selectedOrder.id,
            status: 'delivered',
            deliveryProof: proof,
            deliveryNotes: selectedOrder.driverNotes || '', // Mapping UI driverNotes to backend deliveryNotes
            coolerBagStatus: selectedOrder.coolerBagStatus || 'none',
        });
    };

    if (isLoading) {
        return <div className="p-8 text-center">Loading deliveries...</div>;
    }

    // If detailed view is open
    if (selectedOrder) {
        return (
            <div className="space-y-6">
                <button
                    onClick={() => setSelectedOrder(null)}
                    className="flex items-center text-warm-gray mb-4"
                >
                    ← Back to List
                </button>

                <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-sage-green">
                    <h2 className="text-2xl font-bold mb-2">{selectedOrder.customer.name}</h2>
                    <p className="text-lg text-warm-gray mb-4">{selectedOrder.customer.address || selectedOrder.deliveryAddress || 'No Address'}</p>

                    <div className="flex gap-3 mb-6">
                        <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedOrder.customer.address || selectedOrder.deliveryAddress)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex-1 bg-sage-green/20 text-sage-green py-3 px-4 rounded-lg text-center font-bold flex items-center justify-center gap-2 hover:bg-sage-green/30"
                        >
                            🗺️ Open Map
                        </a>
                        <a
                            href={`tel:${selectedOrder.customer.phone}`}
                            className="flex-1 bg-warning/20 text-warning py-3 px-4 rounded-lg text-center font-bold flex items-center justify-center gap-2 hover:bg-warning/30"
                        >
                            📞 Call
                        </a>
                    </div>

                    {selectedOrder.specialInstructions && (
                        <div className="bg-warning/10 p-4 rounded-lg mb-4 border border-warning/30">
                            <p className="text-warning font-medium">⚠️ Note: {selectedOrder.specialInstructions}</p>
                        </div>
                    )}

                    {selectedOrder.coolerBagOption && (
                        <div className="bg-sage-green/20 p-4 rounded-lg mb-6 border border-sage-green/30">
                            <p className="text-sage-green font-bold mb-1">👜 Cooler Bag Requested</p>
                            <p className="text-xs text-sage-green">Please collect the returnable cooler bag if provided.</p>

                            <div className="mt-3 flex gap-2">
                                {(['taken', 'returned', 'none'] as const).map(status => (
                                    <button
                                        key={status}
                                        onClick={() => setSelectedOrder(prev => prev ? { ...prev, coolerBagStatus: status } : null)}
                                        className={`px-3 py-2 rounded-lg text-xs font-bold transition-colors ${selectedOrder.coolerBagStatus === status
                                            ? 'bg-soft-black text-white'
                                            : 'bg-white border border-sage-green/30 text-sage-green'
                                            }`}
                                    >
                                        {status.toUpperCase()}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Order Items Section */}
                    {selectedOrder.items && selectedOrder.items.length > 0 && (
                        <div className="bg-white p-4 rounded-lg mb-6 border border-light-gray">
                            <h3 className="font-semibold text-primary-dark mb-3">📦 Order Items</h3>
                            <div className="space-y-2">
                                {selectedOrder.items.map((item) => (
                                    <div key={item.id} className="flex justify-between items-center py-2 border-b border-light-gray/50 last:border-0">
                                        <div>
                                            <p className="font-medium text-primary-dark">{item.product?.name}</p>
                                            <p className="text-xs text-warm-gray">{item.quantity} {item.product?.unit || 'unit'}</p>
                                        </div>
                                        <span className="font-bold text-sage-green">
                                            R{Number(item.product?.price || 0).toFixed(2)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-3 pt-3 border-t border-light-gray flex justify-between items-center">
                                <span className="font-bold text-primary-dark">Total Items:</span>
                                <span className="font-bold text-sage-green">{selectedOrder.items.length}</span>
                            </div>
                        </div>
                    )}

                    <div className="space-y-4">
                        <h3 className="font-semibold text-primary-dark text-lg">Complete Delivery</h3>
                        <div className="grid grid-cols-1 gap-4">
                            <button
                                onClick={() => handleDelivery('handed_to_client')}
                                disabled={updateStatus.isPending}
                                className="w-full bg-sage-green text-white py-5 px-6 rounded-xl text-xl font-bold shadow-lg hover:bg-sage-green/90 active:bg-soft-black disabled:opacity-50 transition-all transform active:scale-95 flex items-center justify-center gap-3"
                            >
                                <span className="text-2xl">🤝</span> Handed to Client
                            </button>
                            <button
                                onClick={() => handleDelivery('left_at_door')}
                                disabled={updateStatus.isPending}
                                className="w-full bg-warning text-white py-5 px-6 rounded-xl text-xl font-bold shadow-lg hover:bg-warning/90 active:bg-soft-black disabled:opacity-50 transition-all transform active:scale-95 flex items-center justify-center gap-3"
                            >
                                <span className="text-2xl">🚪</span> Left at Door
                            </button>
                        </div>

                        <textarea
                            placeholder="Delivery notes (gate codes, where left, etc)..."
                            className="w-full p-4 border rounded-xl mt-4 text-base shadow-sm focus:ring-2 focus:ring-sage-green focus:border-transparent"
                            rows={3}
                            value={selectedOrder.driverNotes || ''}
                            onChange={(e) => setSelectedOrder(prev => prev ? { ...prev, driverNotes: e.target.value } : null)}
                        />
                    </div>
                </div>
            </div>
        );
    }

    // Main List View
    return (
        <div className="space-y-4">
            {/* Sticky Header */}
            <div className="sticky top-0 bg-sage-green/10 -mx-4 px-4 py-3 -mt-4 shadow-sm z-10 border-b border-sage-green/20">
                <div className="flex justify-between items-center mb-3">
                    <div>
                        <h1 className="text-xl font-bold text-primary-dark">Today's Deliveries</h1>
                        <p className="text-base text-sage-green">{orders?.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length || 0} stops remaining</p>
                    </div>
                </div>

                <div className="flex gap-2 bg-white/50 p-1 rounded-lg border border-sage-green/20">
                    <button
                        onClick={() => setActiveTab('orders')}
                        className={`flex-1 py-1.5 rounded-md font-bold text-sm transition-all ${activeTab === 'orders' ? 'bg-sage-green text-white shadow-md' : 'text-sage-green hover:bg-sage-green/10'}`}
                    >
                        🚚 Delivery List
                    </button>
                    <button
                        onClick={() => setActiveTab('summary')}
                        className={`flex-1 py-1.5 rounded-md font-bold text-sm transition-all ${activeTab === 'summary' ? 'bg-sage-green text-white shadow-md' : 'text-sage-green hover:bg-sage-green/10'}`}
                    >
                        📋 Vehicle Summary
                    </button>
                </div>
            </div>

            {activeTab === 'orders' ? (
                <>
                    {orders?.length === 0 && (
                        <div className="bg-white p-8 rounded-lg shadow text-center text-warm-gray text-lg">
                            🎉 No deliveries remaining for today!
                        </div>
                    )}

                    {orders?.map(order => (
                        <div
                            key={order.id}
                            onClick={() => setSelectedOrder(order)}
                            className="bg-white p-5 rounded-xl shadow active:scale-[0.98] transition-transform cursor-pointer border-l-4 border-light-gray hover:border-sage-green"
                        >
                            <div className="flex justify-between items-start mb-3">
                                <h3 className="font-bold text-lg text-primary-dark">{order.customer.name}</h3>
                                <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${order.status === 'pending' ? 'bg-warning/20 text-warning' :
                                    order.status === 'out_for_delivery' ? 'bg-sage-green/20 text-sage-green' : 'bg-light-gray text-warm-gray'
                                    }`}>
                                    {order.status.replace('_', ' ').toUpperCase()}
                                </span>
                            </div>
                            <p className="text-warm-gray text-base leading-snug">{order.customer.address || order.deliveryAddress}</p>
                            <div className="flex items-center gap-2 mt-2">
                                {order.items && order.items.length > 0 && (
                                    <span className="text-xs bg-sage-green/20 text-sage-green px-2 py-0.5 rounded-full font-medium">
                                        📦 {order.items.length} items
                                    </span>
                                )}
                                {order.specialInstructions && (
                                    <p className="text-warning text-sm font-medium">⚠️ {order.specialInstructions}</p>
                                )}
                            </div>
                        </div>
                    ))}
                </>
            ) : (
                <div className="space-y-3">
                    <div className="bg-warning/10 border border-warning/30 p-4 rounded-xl mb-4">
                        <p className="text-sm font-bold text-warning flex items-center gap-2">
                            <span>📦</span> Manifest Summary
                        </p>
                        <p className="text-xs text-warning/80 mt-1">Total items to carry across all {orders?.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length} remaining orders.</p>
                    </div>

                    <div className="bg-white rounded-xl shadow-card overflow-hidden border border-light-gray">
                        <table className="min-w-full divide-y divide-light-gray">
                            <thead className="bg-cream/50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-primary-dark uppercase">Product</th>
                                    <th className="px-4 py-3 text-right text-xs font-bold text-primary-dark uppercase">Total Qty</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-light-gray">
                                {summaryItems?.map((item) => (
                                    <tr key={item.productId} className="hover:bg-cream/20 transition-colors">
                                        <td className="px-4 py-3 text-sm font-medium text-primary-dark">{item.productName}</td>
                                        <td className="px-4 py-3 text-sm text-right font-bold text-sage-green">
                                            {item.totalQuantity} <span className="text-xs text-warm-gray font-normal">{item.unit}</span>
                                        </td>
                                    </tr>
                                ))}
                                {summaryItems?.length === 0 && (
                                    <tr>
                                        <td colSpan={2} className="px-4 py-12 text-center text-warm-gray italic">No items found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

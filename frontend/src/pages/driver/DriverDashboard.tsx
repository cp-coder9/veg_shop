import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import { toast } from 'react-hot-toast';

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

    // Fetch Orders
    const { data: orders, isLoading } = useQuery<DriverOrder[]>({
        queryKey: ['driver-orders'],
        queryFn: async () => {
            const response = await api.get('/driver/orders');
            return response.data;
        },
        refetchInterval: 30000, // Refresh every 30s
    });

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
                    className="flex items-center text-gray-600 mb-4"
                >
                    ← Back to List
                </button>

                <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
                    <h2 className="text-2xl font-bold mb-2">{selectedOrder.customer.name}</h2>
                    <p className="text-lg text-gray-700 mb-4">{selectedOrder.customer.address || selectedOrder.deliveryAddress || 'No Address'}</p>

                    <div className="flex gap-3 mb-6">
                        <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedOrder.customer.address || selectedOrder.deliveryAddress)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex-1 bg-blue-100 text-blue-700 py-3 px-4 rounded-lg text-center font-bold flex items-center justify-center gap-2 hover:bg-blue-200"
                        >
                            🗺️ Open Map
                        </a>
                        <a
                            href={`tel:${selectedOrder.customer.phone}`}
                            className="flex-1 bg-green-100 text-green-700 py-3 px-4 rounded-lg text-center font-bold flex items-center justify-center gap-2 hover:bg-green-200"
                        >
                            📞 Call
                        </a>
                    </div>

                    {selectedOrder.specialInstructions && (
                        <div className="bg-yellow-50 p-4 rounded-lg mb-4 border border-yellow-200">
                            <p className="text-yellow-800 font-medium">⚠️ Note: {selectedOrder.specialInstructions}</p>
                        </div>
                    )}

                    {selectedOrder.coolerBagOption && (
                        <div className="bg-green-50 p-4 rounded-lg mb-6 border border-green-200">
                            <p className="text-green-800 font-bold mb-1">👜 Cooler Bag Requested</p>
                            <p className="text-xs text-green-700">Please collect the returnable cooler bag if provided.</p>

                            <div className="mt-3 flex gap-2">
                                {(['taken', 'returned', 'none'] as const).map(status => (
                                    <button
                                        key={status}
                                        onClick={() => setSelectedOrder(prev => prev ? { ...prev, coolerBagStatus: status } : null)}
                                        className={`px-3 py-2 rounded-lg text-xs font-bold transition-colors ${selectedOrder.coolerBagStatus === status
                                                ? 'bg-green-600 text-white'
                                                : 'bg-white border border-green-200 text-green-700'
                                            }`}
                                    >
                                        {status.toUpperCase()}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="space-y-4">
                        <h3 className="font-semibold text-gray-900 text-lg">Complete Delivery</h3>
                        <div className="grid grid-cols-1 gap-4">
                            <button
                                onClick={() => handleDelivery('handed_to_client')}
                                disabled={updateStatus.isPending}
                                className="w-full bg-green-600 text-white py-5 px-6 rounded-xl text-xl font-bold shadow-lg hover:bg-green-700 active:bg-green-800 disabled:opacity-50 transition-all transform active:scale-95 flex items-center justify-center gap-3"
                            >
                                <span className="text-2xl">🤝</span> Handed to Client
                            </button>
                            <button
                                onClick={() => handleDelivery('left_at_door')}
                                disabled={updateStatus.isPending}
                                className="w-full bg-orange-500 text-white py-5 px-6 rounded-xl text-xl font-bold shadow-lg hover:bg-orange-600 active:bg-orange-700 disabled:opacity-50 transition-all transform active:scale-95 flex items-center justify-center gap-3"
                            >
                                <span className="text-2xl">🚪</span> Left at Door
                            </button>
                        </div>

                        <textarea
                            placeholder="Delivery notes (gate codes, where left, etc)..."
                            className="w-full p-4 border rounded-xl mt-4 text-base shadow-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
            <div className="sticky top-0 bg-white -mx-4 px-4 py-3 -mt-4 shadow-sm z-10 border-b">
                <h1 className="text-xl font-bold text-gray-900">Today's Deliveries</h1>
                <p className="text-base text-gray-600">{orders?.length || 0} stops remaining</p>
            </div>

            {orders?.length === 0 && (
                <div className="bg-white p-8 rounded-lg shadow text-center text-gray-500 text-lg">
                    🎉 No deliveries remaining for today!
                </div>
            )}

            {orders?.map(order => (
                <div
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    className="bg-white p-5 rounded-xl shadow active:scale-[0.98] transition-transform cursor-pointer border-l-4 border-gray-300 hover:border-green-500"
                >
                    <div className="flex justify-between items-start mb-3">
                        <h3 className="font-bold text-lg text-gray-900">{order.customer.name}</h3>
                        <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            order.status === 'out_for_delivery' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'
                            }`}>
                            {order.status.replace('_', ' ').toUpperCase()}
                        </span>
                    </div>
                    <p className="text-gray-700 text-base leading-snug">{order.customer.address || order.deliveryAddress}</p>
                    {order.specialInstructions && (
                        <p className="text-amber-600 text-sm mt-2 font-medium">⚠️ {order.specialInstructions}</p>
                    )}
                </div>
            ))}
        </div>
    );
}

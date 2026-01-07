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
        mutationFn: async (data: { id: string; status: string; deliveryProof: string; driverNotes?: string }) => {
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
            driverNotes: selectedOrder.driverNotes || '', // Maintain typed notes
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
                        <div className="bg-yellow-50 p-4 rounded-lg mb-6 border border-yellow-200">
                            <p className="text-yellow-800 font-medium">⚠️ Note: {selectedOrder.specialInstructions}</p>
                        </div>
                    )}

                    <div className="space-y-4">
                        <h3 className="font-semibold text-gray-900">Complete Delivery</h3>
                        <div className="grid grid-cols-1 gap-3">
                            <button
                                onClick={() => handleDelivery('handed_to_client')}
                                disabled={updateStatus.isPending}
                                className="w-full bg-green-600 text-white py-4 rounded-xl text-lg font-bold shadow-md hover:bg-green-700 disabled:opacity-50"
                            >
                                🤝 Handed to Client
                            </button>
                            <button
                                onClick={() => handleDelivery('left_at_door')}
                                disabled={updateStatus.isPending}
                                className="w-full bg-orange-500 text-white py-4 rounded-xl text-lg font-bold shadow-md hover:bg-orange-600 disabled:opacity-50"
                            >
                                🚪 Left at Door
                            </button>
                        </div>

                        <textarea
                            placeholder="Driver notes (optional)..."
                            className="w-full p-3 border rounded-lg mt-4"
                            rows={3}
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
            <h1 className="text-xl font-bold text-gray-800 mb-4">Today's Deliveries ({orders?.length || 0})</h1>

            {orders?.length === 0 && (
                <div className="bg-white p-8 rounded-lg shadow text-center text-gray-500">
                    No deliveries found for today.
                </div>
            )}

            {orders?.map(order => (
                <div
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    className="bg-white p-4 rounded-lg shadow active:scale-98 transition-transform cursor-pointer border-l-4 border-gray-300 hover:border-green-500"
                >
                    <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-lg">{order.customer.name}</h3>
                        <span className={`px-2 py-1 rounded text-xs font-bold ${order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                order.status === 'out_for_delivery' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100'
                            }`}>
                            {order.status.replace('_', ' ').toUpperCase()}
                        </span>
                    </div>
                    <p className="text-gray-600 text-sm line-clamp-2">{order.customer.address || order.deliveryAddress}</p>
                </div>
            ))}
        </div>
    );
}

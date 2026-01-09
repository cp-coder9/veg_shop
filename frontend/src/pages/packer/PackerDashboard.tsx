import { useState } from 'react';
import { useAdminOrders, useUpdateOrderStatus, useOrder } from '../../hooks/useAdminOrders';
import { toast } from 'react-hot-toast';

export default function PackerDashboard() {
    const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
    const [filter, setFilter] = useState<'pending' | 'packed'>('pending');

    const { data: orders, isLoading } = useAdminOrders({
        status: filter === 'pending' ? 'confirmed' : 'packed', // 'pending' tab shows 'confirmed' orders ready to pack
    });

    const { data: selectedOrder } = useOrder(selectedOrderId || '');
    const updateStatus = useUpdateOrderStatus();

    // Local state for tracking packed items in the current session
    const [packedItems, setPackedItems] = useState<Set<string>>(new Set());

    const toggleItemPacked = (itemId: string) => {
        const newPacked = new Set(packedItems);
        if (newPacked.has(itemId)) {
            newPacked.delete(itemId);
        } else {
            newPacked.add(itemId);
        }
        setPackedItems(newPacked);
    };

    const handleCompletePacking = async () => {
        if (!selectedOrder) return;

        // Optional: Validations that all items are checked
        if (packedItems.size !== selectedOrder.items.length) {
            if (!confirm('Not all items are checked. Mark as packed anyway?')) {
                return;
            }
        }

        try {
            await updateStatus.mutateAsync({
                id: selectedOrder.id,
                status: 'packed',
            });
            toast.success('Order marked as PACKED! 📦');
            setSelectedOrderId(null);
            setPackedItems(new Set());
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center p-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
        );
    }

    // Define tab view for orders list
    const OrderList = () => (
        <div className="space-y-4">
            <div className="flex gap-2 mb-4 bg-gray-100 p-1 rounded-lg">
                <button
                    onClick={() => setFilter('pending')}
                    className={`flex-1 py-2 rounded-md font-medium text-sm transition-all ${filter === 'pending' ? 'bg-white shadow text-green-700' : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    To Pack
                </button>
                <button
                    onClick={() => setFilter('packed')}
                    className={`flex-1 py-2 rounded-md font-medium text-sm transition-all ${filter === 'packed' ? 'bg-white shadow text-green-700' : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    Packed History
                </button>
            </div>

            {orders?.length === 0 && (
                <div className="text-center py-12 text-gray-500 bg-white rounded-lg shadow">
                    {filter === 'pending' ? '🎉 No orders waiting to be packed!' : 'No packed orders found.'}
                </div>
            )}

            {orders?.map((order) => (
                <div
                    key={order.id}
                    onClick={() => setSelectedOrderId(order.id)}
                    className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 active:scale-[0.98] transition-all cursor-pointer hover:border-green-300"
                >
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <h3 className="font-bold text-gray-900">{order.customer.name}</h3>
                            <p className="text-xs text-gray-500">#{order.id.slice(-6)}</p>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className={`px-2 py-1 rounded text-xs font-bold ${order.deliveryMethod === 'delivery' ? 'bg-blue-50 text-blue-700' : 'bg-orange-50 text-orange-700'
                                }`}>
                                {order.deliveryMethod === 'delivery' ? '🚚 Delivery' : '🏪 Collect'}
                            </span>
                        </div>
                    </div>

                    <div className="flex justify-between items-end mt-3">
                        <span className="text-sm text-gray-600">
                            {order.items.length} items
                        </span>
                        <div className="flex gap-1">
                            {/* Fridge/Freezer Badges */}
                            {order.items.some(i => i.product?.packingType === 'fridge') && (
                                <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-1.5 py-0.5 rounded">❄️ Fridge</span>
                            )}
                            {order.items.some(i => i.product?.packingType === 'freezer') && (
                                <span className="bg-indigo-100 text-indigo-800 text-[10px] font-bold px-1.5 py-0.5 rounded">🧊 Freezer</span>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );

    // Detail View (Checklist)
    if (selectedOrderId && selectedOrder) {
        return (
            <div className="fixed inset-0 bg-white z-50 flex flex-col">
                <div className="p-4 border-b flex items-center gap-3 bg-white shadow-sm">
                    <button
                        onClick={() => setSelectedOrderId(null)}
                        className="p-2 -ml-2 hover:bg-gray-100 rounded-full"
                    >
                        <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <div>
                        <h2 className="font-bold text-lg">{selectedOrder.customer.name}</h2>
                        <p className="text-xs text-gray-500">
                            {new Date(selectedOrder.deliveryDate).toLocaleDateString()} • {selectedOrder.deliveryMethod}
                        </p>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {selectedOrder.specialInstructions && (
                        <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg text-sm text-yellow-800 font-medium">
                            ⚠️ Note: {selectedOrder.specialInstructions}
                        </div>
                    )}

                    <div className="space-y-2">
                        {selectedOrder.items.map((item) => {
                            const isPacked = packedItems.has(item.id);
                            const isFridge = item.product?.packingType === 'fridge';
                            const isFreezer = item.product?.packingType === 'freezer';

                            return (
                                <div
                                    key={item.id}
                                    onClick={() => toggleItemPacked(item.id)}
                                    className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-center gap-4 ${isPacked
                                            ? 'bg-green-50 border-green-500 opacity-70'
                                            : 'bg-white border-gray-100 shadow-sm hover:border-green-200'
                                        }`}
                                >
                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${isPacked ? 'bg-green-500 border-green-500' : 'border-gray-300'
                                        }`}>
                                        {isPacked && <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                    </div>

                                    <div className="flex-1">
                                        <p className={`font-bold text-lg ${isPacked ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                                            {item.product?.name}
                                        </p>
                                        <div className="flex gap-2 mt-1">
                                            <span className="text-sm font-medium text-gray-600">
                                                Qty: {item.quantity} {item.product?.unit}
                                            </span>
                                            {isFridge && <span className="text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-bold">❄️ Fridge</span>}
                                            {isFreezer && <span className="text-xs bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded font-bold">🧊 Freezer</span>}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="p-4 border-t bg-white safe-area-bottom">
                    {selectedOrder.status === 'confirmed' || selectedOrder.status === 'pending' ? (
                        <button
                            onClick={handleCompletePacking}
                            className="w-full bg-green-600 text-white font-bold py-4 rounded-xl text-lg shadow-lg active:scale-[0.98] transition-transform"
                        >
                            Full Order Packed ({packedItems.size}/{selectedOrder.items.length})
                        </button>
                    ) : (
                        <div className="text-center font-bold text-gray-500 py-2">
                            Order Status: {selectedOrder.status.toUpperCase()}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-md mx-auto min-h-screen bg-gray-50">
            <div className="bg-white p-4 sticky top-0 z-10 shadow-sm border-b mb-4">
                <h1 className="text-xl font-bold text-green-900">Packer Dashboard</h1>
                <p className="text-sm text-gray-500">Let's get packing! 📦</p>
            </div>

            <div className="px-4 pb-20">
                <OrderList />
            </div>
        </div>
    );
}

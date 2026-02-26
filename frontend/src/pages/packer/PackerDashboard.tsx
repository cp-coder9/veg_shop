import { useState } from 'react';
import { useAdminOrders, useUpdateOrderStatus, useOrder } from '../../hooks/useAdminOrders';
import { toast } from 'react-hot-toast';
import { Order } from '../../types';

export default function PackerDashboard() {
    const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
    const [filter, setFilter] = useState<'pending' | 'packed'>('pending');

    const { data: orders, isLoading } = useAdminOrders({
        status: filter === 'pending' ? 'confirmed' : 'packed', // 'pending' tab shows 'confirmed' orders ready to pack
    });

    const { data: selectedOrder } = useOrder(selectedOrderId || '');
    const updateStatus = useUpdateOrderStatus();

    // Local state for tracking packed quantities: { itemId: quantity }
    const [packedQuantities, setPackedQuantities] = useState<{ [key: string]: number }>({});
    const [packerNotes, setPackerNotes] = useState('');
    const [packerSignature, setPackerSignature] = useState('');

    const toggleItemPacked = (item: Order['items'][number]) => {
        const itemId = item.id;
        setPackedQuantities(prev => {
            const next = { ...prev };
            if (itemId in next) {
                delete next[itemId];
            } else {
                next[itemId] = item.quantity;
            }
            return next;
        });
    };

    const updatePackedQty = (itemId: string, qty: number) => {
        setPackedQuantities(prev => ({
            ...prev,
            [itemId]: qty
        }));
    };

    const handleCompletePacking = async () => {
        if (!selectedOrder) return;

        // Check if anything is non-standard
        const isShortPacked = selectedOrder.items.some(item =>
            packedQuantities[item.id] !== undefined && packedQuantities[item.id] < item.quantity
        );

        if (isShortPacked && !confirm('Some items are short-packed. This will adjust the invoice and notify the customer. Proceed?')) {
            return;
        }

        try {
            await updateStatus.mutateAsync({
                id: selectedOrder.id,
                status: 'packed',
                packedItems: packedQuantities,
                notes: packerNotes,
                signature: packerSignature
            });
            toast.success('Order marked as PACKED! 📦');
            setSelectedOrderId(null);
            setPackedQuantities({});
            setPackerNotes('');
            setPackerSignature('');
        } catch (error) {
            toast.error('Failed to update status');
        }
    };
    // ... (rest of the file logic remains similar but UI needs update for Qty)

    if (isLoading) {
        return (
            <div className="flex justify-center p-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sage-green"></div>
            </div>
        );
    }

    // Define tab view for orders list
    const OrderList = () => (
        <div className="space-y-4">
            <div className="flex gap-2 mb-4 bg-sage-green/10 p-1 rounded-lg border border-sage-green/20">
                <button
                    onClick={() => setFilter('pending')}
                    className={`flex-1 py-2 rounded-md font-medium text-sm transition-all ${filter === 'pending' ? 'bg-white shadow text-sage-green' : 'text-sage-green/70 hover:text-sage-green'
                        }`}
                >
                    To Pack
                </button>
                <button
                    onClick={() => setFilter('packed')}
                    className={`flex-1 py-2 rounded-md font-medium text-sm transition-all ${filter === 'packed' ? 'bg-white shadow text-sage-green' : 'text-sage-green/70 hover:text-sage-green'
                        }`}
                >
                    Packed History
                </button>
            </div>

            {orders?.length === 0 && (
                <div className="text-center py-12 text-warm-gray-500 bg-white rounded-lg shadow-card">
                    {filter === 'pending' ? '🎉 No orders waiting to be packed!' : 'No packed orders found.'}
                </div>
            )}

            {orders?.map((order) => (
                <div
                    key={order.id}
                    onClick={() => setSelectedOrderId(order.id)}
                    className="bg-white p-4 rounded-xl shadow-card border border-light-gray active:scale-[0.98] transition-all cursor-pointer hover:border-sage-green"
                >
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <h3 className="font-bold text-primary-dark">{order.customer.name}</h3>
                            <p className="text-xs text-warm-gray">#{order.id.slice(-6)}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                            <span className={`px-2 py-1 rounded text-xs font-bold ${order.deliveryMethod === 'delivery' ? 'bg-sage-green/20 text-sage-green' : 'bg-warning/20 text-warning'
                                }`}>
                                {order.deliveryMethod === 'delivery' ? '🚚 Delivery' : '🏪 Collect'}
                            </span>
                            {order.coolerBagOption && (
                                <span className="bg-sage-green/20 text-sage-green text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                    👜 Cooler Bag
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-between items-end mt-3">
                        <span className="text-sm text-warm-gray">
                            {order.items.length} items
                        </span>
                        <div className="flex gap-1">
                            {/* Fridge/Freezer Badges */}
                            {order.items.some(i => i.product?.packingType === 'fridge') && (
                                <span className="bg-sage-green/20 text-sage-green text-[10px] font-bold px-1.5 py-0.5 rounded">❄️ Fridge</span>
                            )}
                            {order.items.some(i => i.product?.packingType === 'freezer') && (
                                <span className="bg-warning/20 text-warning text-[10px] font-bold px-1.5 py-0.5 rounded">🧊 Freezer</span>
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
                <div className="p-4 border-b flex items-center gap-3 bg-sage-green/10 shadow-sm">
                    <button
                        onClick={() => setSelectedOrderId(null)}
                        className="p-2 -ml-2 hover:bg-sage-green/20 rounded-full"
                    >
                        <svg className="w-6 h-6 text-warm-gray" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <div>
                        <h2 className="font-bold text-lg text-primary-dark">{selectedOrder.customer.name}</h2>
                        <p className="text-xs text-sage-green">
                            {new Date(selectedOrder.deliveryDate).toLocaleDateString()} • {selectedOrder.deliveryMethod}
                        </p>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {selectedOrder.specialInstructions && (
                        <div className="bg-warning/10 border border-warning/30 p-3 rounded-lg text-sm text-warning font-medium">
                            ⚠️ Customer Note: {selectedOrder.specialInstructions}
                        </div>
                    )}

                    {selectedOrder.coolerBagOption && (
                        <div className="bg-sage-green/10 border border-sage-green/30 p-3 rounded-lg text-sm text-sage-green font-medium flex items-center gap-2">
                            <span>👜</span> <strong>Pack in Cooler Bag:</strong> Customer requested a returnable cooler bag.
                        </div>
                    )}

                    <div className="space-y-3">
                        {selectedOrder.items.map((item) => {
                            const currentQty = packedQuantities[item.id] ?? 0;
                            const isPacked = item.id in packedQuantities;
                            const isFridge = item.product?.packingType === 'fridge';
                            const isFreezer = item.product?.packingType === 'freezer';

                            return (
                                <div
                                    key={item.id}
                                    className={`p-4 rounded-xl border-2 transition-all flex flex-col gap-3 ${isPacked
                                        ? 'bg-sage-green/10 border-sage-green shadow-sm'
                                        : 'bg-white border-light-gray shadow-sm'
                                        }`}
                                >
                                    <div className="flex items-center gap-4 cursor-pointer" onClick={() => toggleItemPacked(item)}>
                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${isPacked ? 'bg-sage-green border-sage-green' : 'border-warm-gray'
                                            }`}>
                                            {isPacked && <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                        </div>

                                        <div className="flex-1">
                                            <p className={`font-bold text-lg ${isPacked ? 'text-primary-dark' : 'text-primary-dark'}`}>
                                                {item.product?.name}
                                            </p>
                                            <div className="flex gap-2 mt-1">
                                                <span className="text-sm font-medium text-warm-gray">
                                                    Target: {item.quantity} {item.product?.unit}
                                                </span>
                                                {isFridge && <span className="text-xs bg-sage-green/20 text-sage-green px-1.5 py-0.5 rounded font-bold">❄️ Fridge</span>}
                                                {isFreezer && <span className="text-xs bg-warning/20 text-warning px-1.5 py-0.5 rounded font-bold">🧊 Freezer</span>}
                                            </div>
                                        </div>
                                    </div>

                                    {isPacked && (
                                        <div className="flex items-center justify-between pt-3 border-t border-sage-green/20">
                                            <span className="text-sm font-bold text-sage-green">Packed Quantity:</span>
                                            <div className="flex items-center gap-4">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); updatePackedQty(item.id, Math.max(0, currentQty - 1)); }}
                                                    className="w-10 h-10 flex items-center justify-center bg-white border border-sage-green/30 rounded-lg shadow-sm active:scale-90"
                                                >
                                                    -
                                                </button>
                                                <span className="font-bold text-lg w-12 text-center">{currentQty}</span>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); updatePackedQty(item.id, currentQty + 1); }}
                                                    className="w-10 h-10 flex items-center justify-center bg-white border border-sage-green/30 rounded-lg shadow-sm active:scale-90"
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <div className="mt-6">
                        <label className="block text-sm font-bold text-warm-gray mb-2">Internal Packer Notes</label>
                        <textarea
                            value={packerNotes}
                            onChange={(e) => setPackerNotes(e.target.value)}
                            placeholder="e.g. Swapped regular carrots for organic..."
                            className="w-full p-3 border-2 border-light-gray rounded-xl focus:border-sage-green outline-none h-24"
                        />
                    </div>

                    <div className="mt-6 pb-6">
                        <label className="block text-sm font-bold text-warm-gray mb-2">Packer Signature</label>
                        <input
                            type="text"
                            value={packerSignature}
                            onChange={(e) => setPackerSignature(e.target.value)}
                            placeholder="Type full name as signature"
                            className="w-full p-3 border-2 border-light-gray rounded-xl focus:border-sage-green outline-none"
                            required
                        />
                        <p className="text-xs text-warm-gray mt-1">Please type your name to authorize this pack.</p>
                    </div>
                </div>

                <div className="p-4 border-t bg-white safe-area-bottom">
                    {selectedOrder.status === 'confirmed' || selectedOrder.status === 'pending' ? (
                        <button
                            onClick={handleCompletePacking}
                            className="w-full bg-sage-green text-white font-bold py-4 rounded-xl text-lg shadow-lg active:scale-[0.98] transition-transform"
                        >
                            Finalize Order ({Object.keys(packedQuantities).length}/{selectedOrder.items.length})
                        </button>
                    ) : (
                        <div className="text-center font-bold text-warm-gray py-2">
                            Order Status: {selectedOrder.status.toUpperCase()}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-md mx-auto min-h-screen bg-cream">
            <div className="bg-white p-4 sticky top-0 z-10 shadow-sm border-b mb-4">
                <h1 className="text-xl font-bold text-primary-dark">Packer Dashboard</h1>
                <p className="text-sm text-warm-gray">Let's get packing! 📦</p>
            </div>

            <div className="px-4 pb-20">
                <OrderList />
            </div>
        </div>
    );
}

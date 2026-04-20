import { useState } from 'react';
import { useAdminOrders, useUpdateOrderStatus, useOrder } from '../../hooks/useAdminOrders.js';
import { toast } from 'react-hot-toast';
import { Order } from '../../types/index.js';

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
    const [packingStep, setPackingStep] = useState<'prep' | 'finalize'>('prep');
    const [packageUnits, setPackageUnits] = useState({
        bags: 1,
        coolers_cold: 0,
        coolers_frozen: 0,
        eggs: 0
    });

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


    const handleCompletePacking = async () => {
        if (!selectedOrder) return;

        // Strict fully collected rule
        if (Object.keys(packedQuantities).length < selectedOrder.items.length) {
            toast.error('Cannot finalize: All items must be packed. Shortages must be handled via Admin.');
            return;
        }

        try {
            await updateStatus.mutateAsync({
                id: selectedOrder.id,
                status: 'packed',
                packedItems: packedQuantities,
                notes: packerNotes,
                signature: packerSignature,
                packageDetails: JSON.stringify(packageUnits),
                handoverConfirmed: true // Packer confirms they are done
            });
            toast.success('Order marked as PACKED! 📦');
            setSelectedOrderId(null);
            setPackedQuantities({});
            setPackerNotes('');
            setPackerSignature('');
            setPackingStep('prep');
            setPackageUnits({
                bags: 1,
                coolers_cold: 0,
                coolers_frozen: 0,
                eggs: 0
            });
        } catch (error) {
            toast.error('Failed to update status');
        }
    };
    // ... (rest of the file logic remains similar but UI needs update for Qty)

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-cream">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sage-green mx-auto"></div>
                    <p className="mt-4 text-warm-gray font-body font-medium">Loading orders...</p>
                </div>
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
                            {order.items.some(i => i.product?.packingType === 'cold') && (
                                <span className="bg-sage-green/20 text-sage-green text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1">❄️ Cold</span>
                            )}
                            {order.items.some(i => i.product?.packingType === 'frozen') && (
                                <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1">🧊 Frozen</span>
                            )}
                            {order.items.some(i => i.product?.packingType === 'loose') && (
                                <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1">🧺 Loose</span>
                            )}
                            {order.items.some(i => i.product?.packingType === 'ambient') && (
                                <span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1">📦 Ambient</span>
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
                <div className="p-4 pt-safe border-b flex items-center gap-3 bg-sage-green/10 shadow-sm">
                    <button
                        onClick={() => {
                            setSelectedOrderId(null);
                            setPackingStep('prep');
                        }}
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

                <div className="flex bg-white shadow-sm sticky top-0 z-10 border-b">
                    <button 
                        className={`flex-1 py-3 text-sm font-bold border-b-4 transition-colors ${packingStep === 'prep' ? 'border-sage-green text-sage-green' : 'border-transparent text-warm-gray hover:text-sage-green'}`}
                        onClick={() => setPackingStep('prep')}
                    >
                        Step 1: Prep Coolers
                    </button>
                    <button 
                        className={`flex-1 py-3 text-sm font-bold border-b-4 transition-colors ${packingStep === 'finalize' ? 'border-sage-green text-sage-green' : 'border-transparent text-warm-gray hover:text-sage-green'}`}
                        onClick={() => setPackingStep('finalize')}
                    >
                        Step 2: Collect & Finalize
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {selectedOrder.specialInstructions && (
                        <div className="bg-warning/10 border border-warning/30 p-3 rounded-lg text-sm text-warning font-medium">
                            ⚠️ Customer Note: {selectedOrder.specialInstructions}
                        </div>
                    )}

                    {selectedOrder.coolerBagOption && packingStep === 'prep' && (
                        <div className="bg-sage-green/10 border border-sage-green/30 p-3 rounded-lg text-sm text-sage-green font-medium flex items-center gap-2">
                            <span>👜</span> <strong>Pack in Cooler Bag:</strong> Customer requested a returnable cooler bag.
                        </div>
                    )}

                    {packingStep === 'prep' && (
                        <div className="space-y-6">
                            {['cold', 'frozen'].map((pt) => {
                                const items = selectedOrder.items.filter(i => (i.product?.packingType || 'ambient') === pt);
                                if (items.length === 0) return null;

                                const labels = {
                                    cold: { label: 'Cold (Cooler Box)', emoji: '❄️', color: 'text-sage-green bg-sage-green/10' },
                                    frozen: { label: 'Frozen (Cooler Box)', emoji: '🧊', color: 'text-blue-600 bg-blue-50' }
                                };
                                const config = labels[pt as keyof typeof labels];

                                return (
                                    <div key={pt} className="space-y-3">
                                        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg font-bold text-sm uppercase tracking-wider ${config.color}`}>
                                            <span>{config.emoji}</span>
                                            <span>{config.label}</span>
                                            <span className="ml-auto bg-white/50 px-2 py-0.5 rounded text-xs">
                                                {items.filter(i => i.id in packedQuantities).length}/{items.length}
                                            </span>
                                        </div>

                                        <div className="space-y-3">
                                            {items.map((item) => {
                                                const isPacked = item.id in packedQuantities;
                                                return (
                                                    <div
                                                        key={item.id}
                                                        className={`p-4 rounded-xl border-2 transition-all flex flex-col gap-3 ${isPacked ? 'bg-sage-green/10 border-sage-green shadow-sm' : 'bg-white border-light-gray shadow-sm'}`}
                                                    >
                                                        <div className="flex items-center gap-4 cursor-pointer" onClick={() => toggleItemPacked(item)}>
                                                            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${isPacked ? 'bg-sage-green border-sage-green' : 'border-warm-gray'}`}>
                                                                {isPacked && <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                                            </div>

                                                            <div className="flex-1 flex items-center justify-between gap-4">
                                                                <div className="flex-1">
                                                                    <p className={`font-bold text-lg leading-tight ${isPacked ? 'text-primary-dark' : 'text-primary-dark'}`}>
                                                                        {item.product?.name || 'Deleted Product'}
                                                                        {item.product?.packQuantity && (
                                                                            <span className="ml-2 text-sm text-sage-green font-medium">({item.product.packQuantity} per pack)</span>
                                                                        )}
                                                                    </p>
                                                                </div>
                                                                <div className="flex flex-col items-end">
                                                                    <span className={`font-black text-3xl tracking-tighter ${isPacked ? 'text-sage-green' : 'text-primary-dark'}`}>{item.quantity}</span>
                                                                    <span className="text-[10px] font-bold uppercase tracking-widest text-warm-gray -mt-1">{item.product?.unit}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {packingStep === 'finalize' && (
                        <div className="space-y-6">
                            {['loose', 'ambient'].map((pt) => {
                                const items = selectedOrder.items.filter(i => (i.product?.packingType || 'ambient') === pt);
                                if (items.length === 0) return null;

                                const labels = {
                                    loose: { label: 'Loose Items', emoji: '🧺', color: 'text-amber-600 bg-amber-50' },
                                    ambient: { label: 'Ambient (Box or Bag)', emoji: '📦', color: 'text-gray-600 bg-gray-50' }
                                };
                                const config = labels[pt as keyof typeof labels];

                                return (
                                    <div key={pt} className="space-y-3">
                                        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg font-bold text-sm uppercase tracking-wider ${config.color}`}>
                                            <span>{config.emoji}</span>
                                            <span>{config.label}</span>
                                            <span className="ml-auto bg-white/50 px-2 py-0.5 rounded text-xs">
                                                {items.filter(i => i.id in packedQuantities).length}/{items.length}
                                            </span>
                                        </div>

                                        <div className="space-y-3">
                                            {items.map((item) => {
                                                const isPacked = item.id in packedQuantities;
                                                return (
                                                    <div
                                                        key={item.id}
                                                        className={`p-4 rounded-xl border-2 transition-all flex flex-col gap-3 ${isPacked ? 'bg-sage-green/10 border-sage-green shadow-sm' : 'bg-white border-light-gray shadow-sm'}`}
                                                    >
                                                        <div className="flex items-center gap-4 cursor-pointer" onClick={() => toggleItemPacked(item)}>
                                                            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${isPacked ? 'bg-sage-green border-sage-green' : 'border-warm-gray'}`}>
                                                                {isPacked && <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                                            </div>

                                                            <div className="flex-1 flex items-center justify-between gap-4">
                                                                <div className="flex-1">
                                                                    <p className={`font-bold text-lg leading-tight text-primary-dark`}>
                                                                        {item.product?.name || 'Deleted Product'}
                                                                        {item.product?.packQuantity && <span className="ml-2 text-sm text-sage-green font-medium">({item.product.packQuantity} per pack)</span>}
                                                                    </p>
                                                                </div>
                                                                <div className="flex flex-col items-end">
                                                                    <span className={`font-black text-3xl tracking-tighter ${isPacked ? 'text-sage-green' : 'text-primary-dark'}`}>{item.quantity}</span>
                                                                    <span className="text-[10px] font-bold uppercase tracking-widest text-warm-gray -mt-1">{item.product?.unit}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                            
                            <div className="mt-8 border-t border-light-gray pt-6">
                                <h3 className="font-bold text-primary-dark mb-4 flex items-center gap-2">
                                    <span>📦</span> Package Units
                                </h3>
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { key: 'bags', label: 'Ambient Bags', emoji: '🛍️' },
                                        { key: 'coolers_cold', label: 'Cooler Box (Cold)', emoji: '❄️' },
                                        { key: 'coolers_frozen', label: 'Cooler Box (Frozen)', emoji: '🧊' },
                                        { key: 'eggs', label: 'Egg Cartons', emoji: '🥚' },
                                    ].map((unit) => (
                                        <div key={unit.key} className="bg-white p-3 border-2 border-light-gray rounded-xl">
                                            <div className="flex flex-col gap-2">
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-warm-gray flex items-center gap-1">
                                                    {unit.emoji} {unit.label}
                                                </span>
                                                <div className="flex items-center justify-between bg-light-gray/30 rounded-lg p-1">
                                                    <button 
                                                        onClick={() => setPackageUnits(prev => ({ ...prev, [unit.key]: Math.max(0, prev[unit.key as keyof typeof prev] - 1) }))}
                                                        className="w-8 h-8 rounded-md bg-white shadow-sm flex items-center justify-center text-primary-dark font-bold active:bg-light-gray"
                                                    >
                                                        -
                                                    </button>
                                                    <span className="font-black text-lg text-primary-dark">{packageUnits[unit.key as keyof typeof packageUnits]}</span>
                                                    <button 
                                                        onClick={() => setPackageUnits(prev => ({ ...prev, [unit.key]: prev[unit.key as keyof typeof prev] + 1 }))}
                                                        className="w-8 h-8 rounded-md bg-white shadow-sm flex items-center justify-center text-primary-dark font-bold active:bg-light-gray"
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="mt-8 border-t border-light-gray pt-6">
                                <label className="block text-sm font-bold text-warm-gray mb-2">Internal Packer Notes</label>
                                <textarea
                                    value={packerNotes}
                                    onChange={(e) => setPackerNotes(e.target.value)}
                                    placeholder="e.g. Added extra ice pack..."
                                    className="w-full p-3 border-2 border-light-gray rounded-xl focus:border-sage-green outline-none h-24 text-sm"
                                />
                            </div>

                            <div className="mt-4 pb-6">
                                <label className="block text-sm font-bold text-warm-gray mb-2">Packer Signature</label>
                                <input
                                    type="text"
                                    value={packerSignature}
                                    onChange={(e) => setPackerSignature(e.target.value)}
                                    placeholder="Type full name as signature"
                                    className="w-full p-3 border-2 border-light-gray rounded-xl focus:border-sage-green outline-none text-base"
                                    required
                                />
                                <p className="text-xs text-warm-gray mt-1">Please type your name to authorize this pack.</p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-4 border-t bg-white safe-area-bottom">
                    {selectedOrder.status === 'confirmed' ? (
                        <button
                            onClick={handleCompletePacking}
                            disabled={Object.keys(packedQuantities).length < selectedOrder.items.length || !packerSignature}
                            className={`w-full font-bold py-4 rounded-xl text-lg shadow-lg active:scale-[0.98] transition-transform ${Object.keys(packedQuantities).length < selectedOrder.items.length ? 'bg-warm-gray text-white opacity-50' : 'bg-sage-green text-white'}`}
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
            <div className="bg-white p-4 pt-safe sticky top-0 z-10 shadow-sm border-b mb-4">
                <h1 className="text-xl font-bold text-primary-dark">Packer Dashboard</h1>
                <p className="text-sm text-warm-gray">Let's get packing! 📦</p>
            </div>

            <div className="px-4 pb-20">
                <OrderList />
            </div>
        </div>
    );
}

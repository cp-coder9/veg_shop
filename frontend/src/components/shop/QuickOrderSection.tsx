import { useLastWeekOrder } from '../../hooks/useOrders.js';
import { useCartStore } from '../../stores/cartStore.js';
import { ShoppingCart, Plus, History } from 'lucide-react';
// import { formatPrice } from '../../lib/utils.js'; // Not used in this component

export function QuickOrderSection() {
    const { data: lastOrder, isLoading } = useLastWeekOrder();
    const { addItem } = useCartStore();

    if (isLoading || !lastOrder || !lastOrder.items || lastOrder.items.length === 0) {
        return null;
    }

    const handleAddAll = () => {
        lastOrder.items.forEach((item: any) => {
            addItem(item.productId, item.quantity);
        });
    };

    return (
        <div className="mb-16 bg-gradient-to-r from-[var(--pigment-green)]/5 to-transparent border-l-4 border-[var(--pigment-green)] p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-start gap-4">
                    <div className="bg-[var(--pigment-green)] text-white p-3 rounded-sm">
                        <History size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black uppercase tracking-tighter text-[var(--pigment-green)]">
                            Welcome Back
                        </h3>
                        <p className="font-mono text-[10px] opacity-60 uppercase tracking-widest mt-1">
                            You ordered {lastOrder.items.length} items recently. Would you like to repeat your last order?
                        </p>
                    </div>
                </div>

                <button
                    onClick={handleAddAll}
                    className="flex items-center gap-3 bg-[var(--pigment-green)] text-[var(--canvas)] px-8 py-4 font-bold uppercase tracking-widest text-xs hover:bg-[var(--pigment-oxide)] transition-all transform hover:scale-[1.02]"
                >
                    <ShoppingCart size={18} />
                    <span>Add Everything to Cart</span>
                </button>
            </div>

            <div className="mt-8 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {lastOrder.items.slice(0, 6).map((item: any) => (
                    <div key={item.id} className="bg-white/40 p-3 flex flex-col gap-2 group">
                        <span className="font-bold text-[11px] uppercase truncate text-[var(--pigment-green)]">
                            {item.product?.name || 'Product'}
                        </span>
                        <div className="flex justify-between items-center">
                            <span className="font-mono text-[10px] opacity-40">Qty: {item.quantity}</span>
                            <button
                                onClick={() => addItem(item.productId, item.quantity)}
                                className="bg-[var(--pigment-green)]/10 text-[var(--pigment-green)] p-1 hover:bg-[var(--pigment-green)] hover:text-white transition-all"
                            >
                                <Plus size={14} />
                            </button>
                        </div>
                    </div>
                ))}
                {lastOrder.items.length > 6 && (
                    <div className="flex items-center justify-center font-mono text-[10px] opacity-40 uppercase">
                        +{lastOrder.items.length - 6} more
                    </div>
                )}
            </div>
        </div>
    );
}

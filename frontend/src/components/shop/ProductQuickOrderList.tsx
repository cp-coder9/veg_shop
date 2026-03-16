import { Product, CATEGORY_LABELS } from '../../types';
import { useCartStore } from '../../stores/cartStore';
import { formatPrice } from '../../lib/utils';
import { Plus, Minus, Calendar } from 'lucide-react';

interface ProductQuickOrderListProps {
  products: Product[];
  category: string;
  onProductClick: (product: Product) => void;
}

export function ProductQuickOrderList({
  products,
  category,
  onProductClick,
}: ProductQuickOrderListProps) {
  const { addItem, getItemQuantity, updateQuantity } = useCartStore();

  const handleAddClick = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    addItem(product.id, 1);
  };

  const handleRowClick = (product: Product) => {
    onProductClick(product);
  };

  if (!products || products.length === 0) {
    return null;
  }

  return (
    <section className="mb-16">
      <h2 className="font-mono text-[10px] uppercase font-bold tracking-[0.3em] text-[var(--pigment-ochre)] mb-4 pb-2 border-b border-[var(--pigment-ochre)]/10">
        {CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS] || category}
      </h2>

      <div className="grid grid-cols-1 gap-px bg-[var(--pigment-ochre)]/10 rounded-sm">
        {products.map((product) => {
          const qty = getItemQuantity(product.id);

          return (
            <div
              key={product.id}
              onClick={() => handleRowClick(product)}
              className="group bg-white/40 hover:bg-white/80 transition-all duration-300 cursor-pointer p-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-center"
            >
              {/* Product Info */}
              <div className="md:col-span-6 flex flex-col gap-1">
                <div className="flex items-center gap-3">
                  <span className="text-xl font-black uppercase tracking-tighter text-[var(--pigment-green)] group-hover:text-[var(--pigment-oxide)] transition-colors">
                    {product.name}
                  </span>
                  {product.isSeasonal && (
                    <span className="text-[10px] font-mono font-bold text-[var(--pigment-ochre)] uppercase tracking-wider bg-[var(--pigment-ochre)]/10 px-2 py-0.5">
                      Seasonal
                    </span>
                  )}
                </div>
                {product.deliveryDay && (
                  <div className="flex items-center gap-1.5 text-[11px] font-mono opacity-60 uppercase">
                    <Calendar size={12} />
                    <span>Next harvest: {product.deliveryDay}</span>
                  </div>
                )}
              </div>

              {/* Pricing */}
              <div className="md:col-span-3 font-mono flex flex-col items-start md:items-end">
                <span className="text-lg font-black text-[var(--pigment-oxide)]">
                  R{formatPrice(product.price)}
                </span>
                <span className="text-[10px] opacity-40 uppercase tracking-tighter">PER {product.unit}</span>
              </div>

              {/* Add/Quantity Action */}
              <div className="md:col-span-3 flex justify-end" onClick={(e) => e.stopPropagation()}>
                {qty > 0 ? (
                  <div className="flex items-center gap-4 bg-white border border-[var(--pigment-green)]/10 p-1">
                    <button
                      onClick={() => updateQuantity(product.id, qty - 1)}
                      className="p-2 text-[var(--ink)] hover:text-[var(--pigment-oxide)] hover:bg-[var(--canvas)] transition-all"
                      aria-label="Decrease"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-6 text-center font-bold font-mono text-sm">
                      {qty}
                    </span>
                    <button
                      onClick={() => addItem(product.id, 1)}
                      className="p-2 text-[var(--ink)] hover:text-[var(--pigment-green)] hover:bg-[var(--canvas)] transition-all"
                      aria-label="Increase"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={(e) => handleAddClick(e, product)}
                    className="flex justify-between items-center gap-4 px-6 py-3 border border-[var(--pigment-green)]/20 hover:border-[var(--pigment-green)] hover:bg-[var(--pigment-green)] hover:text-[var(--canvas)] transition-all duration-300 font-bold uppercase tracking-widest text-xs"
                  >
                    <span>Add</span>
                    <Plus size={14} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default ProductQuickOrderList;


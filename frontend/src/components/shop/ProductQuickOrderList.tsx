import { Product, CATEGORY_LABELS } from '../../types';
import { useCartStore } from '../../stores/cartStore';
import { formatPrice } from '../../lib/utils';

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
  const { addItem, getItemQuantity } = useCartStore();

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
    <section className="space-y-3">
      <h2 className="font-display text-body-lg text-primary-dark font-semibold sticky top-0 bg-white py-2 z-10 border-b border-light-gray">
        {CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS] || category}
      </h2>
      <div className="bg-white rounded-lg border border-light-gray overflow-hidden">
        {/* Header Row */}
        <div className="hidden md:grid md:grid-cols-12 gap-4 px-4 py-2 bg-cream text-body-sm font-medium text-warm-gray border-b border-light-gray">
          <div className="col-span-6">Product</div>
          <div className="col-span-3 text-right">Price</div>
          <div className="col-span-3 text-right">Action</div>
        </div>

        {/* Product Rows */}
        {products.map((product) => {
          const qty = getItemQuantity(product.id);
          
          return (
            <div
              key={product.id}
              onClick={() => handleRowClick(product)}
              className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-4 py-3 border-b border-light-gray last:border-b-0 hover:bg-cream/30 cursor-pointer transition-colors items-center"
            >
              {/* Product Name */}
              <div className="col-span-6 flex items-center gap-2 flex-wrap">
                <span className="font-body text-body-md text-primary-dark">
                  {product.name}
                </span>
                {product.isSeasonal && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-caption font-medium bg-amber-100 text-amber-800">
                    Seasonal
                  </span>
                )}
                {product.deliveryDay && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-caption font-medium bg-sage-green/20 text-sage-green">
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {product.deliveryDay}
                  </span>
                )}
              </div>

              {/* Price */}
              <div className="col-span-3 text-right">
                <span className="font-body text-body-md text-terracotta font-semibold">
                  R{formatPrice(product.price)}
                </span>
                <span className="text-body-sm text-warm-gray"> / {product.unit}</span>
              </div>

              {/* Action Buttons */}
              <div className="col-span-3 flex items-center justify-end gap-2">
                {qty > 0 ? (
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => useCartStore.getState().updateQuantity(product.id, qty - 1)}
                      className="w-7 h-7 flex items-center justify-center rounded-full bg-light-gray text-primary-dark hover:bg-warm-gray/40 transition-colors text-sm font-bold"
                      aria-label="Decrease quantity"
                    >
                      −
                    </button>
                    <span className="w-6 text-center font-bold text-terracotta text-body-sm">
                      {qty}
                    </span>
                    <button
                      onClick={() => addItem(product.id, 1)}
                      className="w-7 h-7 flex items-center justify-center rounded-full bg-terracotta text-white hover:bg-terracotta/80 transition-colors text-sm font-bold"
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={(e) => handleAddClick(e, product)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-terracotta text-white rounded-md hover:bg-terracotta/80 transition-colors text-body-sm font-medium"
                    aria-label={`Add ${product.name} to cart`}
                  >
                    <span>Add</span>
                    <span className="text-base leading-none">→</span>
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

import { useState } from 'react';
import { Product, CATEGORY_LABELS } from '../../types/index.js';
import { Modal } from '../ui/Modal.js';
import { Button } from '../ui/Button.js';
import { useCartStore } from '../../stores/cartStore.js';
import { formatPrice } from '../../lib/utils.js';

interface ProductDetailModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ProductDetailModal({
  product,
  isOpen,
  onClose,
}: ProductDetailModalProps) {
  const { addItem, getItemQuantity, updateQuantity } = useCartStore();
  const [addedFeedback, setAddedFeedback] = useState(false);

  if (!product) return null;

  const qty = getItemQuantity(product.id);

  const handleAddToCart = () => {
    addItem(product.id, 1);
    setAddedFeedback(true);
    setTimeout(() => setAddedFeedback(false), 1500);
  };

  const handleQuantityChange = (newQty: number) => {
    if (newQty <= 0) {
      useCartStore.getState().removeItem(product.id);
    } else {
      updateQuantity(product.id, newQty);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={product.name}
      size="md"
    >
      <div className="space-y-6">
        {/* Product Image */}
        <div className="aspect-video bg-cream rounded-lg overflow-hidden flex items-center justify-center">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-center p-8">
              <svg
                className="w-24 h-24 mx-auto text-warm-gray"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <p className="mt-2 text-warm-gray text-body-sm">No image available</p>
            </div>
          )}
        </div>

        {/* Category Badge */}
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-caption font-medium bg-cream text-primary-dark">
            {CATEGORY_LABELS[product.category as keyof typeof CATEGORY_LABELS] || product.category}
          </span>
          {product.isSeasonal && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-caption font-medium bg-amber-100 text-amber-800">
              Seasonal
            </span>
          )}
          {!product.isAvailable && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-caption font-medium bg-red-100 text-red-800">
              Currently Unavailable
            </span>
          )}
        </div>

        {/* Price */}
        <div className="border-t border-b border-light-gray py-4">
          <p className="text-center">
            <span className="font-display text-display-md text-terracotta font-bold">
              R{formatPrice(product.price)}
            </span>
            <span className="text-body-md text-warm-gray ml-1">per {product.unit}</span>
          </p>
        </div>

        {/* Description */}
        <div>
          <h3 className="font-display text-body-md text-primary-dark font-semibold mb-2">
            Description
          </h3>
          <p className="font-body text-body-md text-warm-gray leading-relaxed">
            {product.description || 'No description available for this product.'}
          </p>
        </div>

        {/* Delivery & Supplier Info */}
        {(product.deliveryDay || product.supplierId) && (
          <div className="bg-cream/50 p-4 rounded-lg space-y-3">
            <h3 className="font-display text-caption font-bold text-primary-dark uppercase tracking-wider">
              Harvest Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {product.deliveryDay && (
                <div>
                  <p className="text-[10px] font-mono text-warm-gray uppercase tracking-widest">Delivery Day</p>
                  <p className="text-body-sm font-semibold text-primary-dark">{product.deliveryDay}</p>
                </div>
              )}
              {(product.supplierId || product.supplier) && (
                <div>
                  <p className="text-[10px] font-mono text-warm-gray uppercase tracking-widest">Provenance</p>
                  <p className="text-body-sm font-semibold text-primary-dark">
                    {product.supplier?.name || 'Local Farm Partner'}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Add to Cart Section */}
        <div className="border-t border-light-gray pt-4">
          {product.isAvailable ? (
            <div className="flex items-center justify-between">
              {qty > 0 ? (
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleQuantityChange(qty - 1)}
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-light-gray text-primary-dark hover:bg-warm-gray/40 transition-colors text-lg font-bold"
                    aria-label="Decrease quantity"
                  >
                    −
                  </button>
                  <span className="w-12 text-center font-bold text-terracotta text-body-lg">
                    {qty}
                  </span>
                  <button
                    onClick={() => handleQuantityChange(qty + 1)}
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-terracotta text-white hover:bg-terracotta/80 transition-colors text-lg font-bold"
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>
              ) : (
                <Button
                  onClick={handleAddToCart}
                  className="flex-1 bg-terracotta hover:bg-terracotta/80"
                  disabled={addedFeedback}
                >
                  {addedFeedback ? '✓ Added!' : `Add to Cart - R${formatPrice(product.price)}`}
                </Button>
              )}
            </div>
          ) : (
            <p className="text-center text-error font-body text-body-md">
              This product is currently unavailable
            </p>
          )}
        </div>
      </div>
    </Modal>
  );
}

export default ProductDetailModal;

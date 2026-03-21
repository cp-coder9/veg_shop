import { useState } from 'react';
import { Product } from '../types/index.js';
import { useCartStore } from '../stores/cartStore.js';
import { formatPrice } from '../lib/utils.js';
import { ProductDetailModal } from './shop/ProductDetailModal.js';
import { Info } from 'lucide-react';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addItem, getItemQuantity, updateQuantity } = useCartStore();
  const quantity = getItemQuantity(product.id);
  const [showInfo, setShowInfo] = useState(false); // New state for modal

  const handleAddToCart = () => {
    addItem(product.id, 1);
  };

  const handleRemoveFromCart = () => {
    if (quantity > 1) {
      updateQuantity(product.id, quantity - 1);
    } else {
      updateQuantity(product.id, 0);
    }
  };

  const handleCloseModal = () => {
    setShowInfo(false);
  };

  return (
    <>
      <div className="card card-hover group">
        <div className="relative aspect-square overflow-hidden">
          {/* ... Image Logic ... */}
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-organic-green-100 to-organic-green-200 flex items-center justify-center">
              <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4">
                <svg className="w-16 h-16 text-organic-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {product.isSeasonal && (
              <span className="badge-warning text-xs font-semibold">
                🌱 Seasonal
              </span>
            )}
            {!product.isAvailable && (
              <span className="badge-error text-xs font-semibold">
                ⚠️ Out of Stock
              </span>
            )}
          </div>

          {/* Quick actions - Eye Icon Added */}
          <div className="absolute top-3 right-3 flex flex-col gap-2">
            {quantity > 0 && (
              <div className="bg-organic-green-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm shadow-lg">
                {quantity}
              </div>
            )}
            <button
              onClick={() => setShowInfo(true)}
              className="bg-white text-gray-600 hover:text-organic-green-600 rounded-full w-8 h-8 flex items-center justify-center shadow-lg transition-colors"
              title="View Details"
            >
              <Info size={18} />
            </button>
          </div>
        </div>

        <div className="p-5">
          {/* ... Content ... */}
          <h3 className="font-display font-semibold text-lg text-organic-green-900 mb-1 cursor-pointer" onClick={() => setShowInfo(true)}>
            {product.name}
          </h3>

          <p className="text-organic-green-700 font-bold text-xl mb-3">
            R{formatPrice(product.price)}
            <span className="text-sm font-normal text-warm-gray-500"> / {product.unit}</span>
          </p>

          {product.description && (
            <p className="text-sm text-warm-gray-600 mb-4 line-clamp-2" title={product.description}>
              {product.description}
            </p>
          )}

          {/* Quantity selector */}
          {quantity > 0 ? (
            <div className="flex items-center gap-2">
              <button
                onClick={handleRemoveFromCart}
                className="flex-1 bg-warm-gray-200 hover:bg-warm-gray-300 text-warm-gray-800 font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
                Remove
              </button>
              <div className="px-4 py-2 bg-organic-green-50 text-organic-green-700 font-semibold rounded-lg">
                {quantity}
              </div>
              <button
                onClick={handleAddToCart}
                className="flex-1 bg-organic-green-600 hover:bg-organic-green-700 text-white font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add More
              </button>
            </div>
          ) : (
            <button
              onClick={handleAddToCart}
              className="w-full bg-organic-green-600 hover:bg-organic-green-700 text-white font-semibold py-3 rounded-lg transition-all duration-200 transform hover:scale-[1.02] flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Add to Cart
            </button>
          )}
        </div>
      </div>

      {/* Info Modal */}
      <ProductDetailModal
        product={product}
        isOpen={showInfo}
        onClose={handleCloseModal}
      />
    </>
  );
}
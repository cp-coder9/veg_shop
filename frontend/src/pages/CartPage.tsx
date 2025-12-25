import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCartStore } from '../stores/cartStore';
import { useProducts } from '../hooks/useProducts';
import { useCreateOrder } from '../hooks/useOrders';
import { useAuthStore } from '../stores/authStore';
import CartItem from '../components/CartItem';
import { Product } from '../types';
import { toNumber } from '../lib/utils';

export default function CartPage() {
  const { items, clearCart } = useCartStore();
  const { data: products } = useProducts();
  const createOrder = useCreateOrder();
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();

  const [deliveryMethod, setDeliveryMethod] = useState<'delivery' | 'collection'>('delivery');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState(user?.address || '');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [showCheckout, setShowCheckout] = useState(false);

  const cartProducts = useMemo(() => {
    if (!products) return [];
    return items
      .map((item) => {
        const product = products.find((p) => p.id === item.productId);
        return product ? { product, quantity: item.quantity } : null;
      })
      .filter((item): item is { product: Product; quantity: number } => item !== null);
  }, [items, products]);

  const total = useMemo(() => {
    return cartProducts.reduce(
      (sum, item) => sum + toNumber(item.product.price) * item.quantity,
      0
    );
  }, [cartProducts]);

  const getNextDeliveryDates = () => {
    const dates: string[] = [];
    const today = new Date();
    const daysOfWeek = [1, 3, 5]; // Monday, Wednesday, Friday

    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      if (daysOfWeek.includes(date.getDay())) {
        dates.push(date.toISOString().split('T')[0]);
      }
    }

    return dates;
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const orderData = {
        deliveryDate,
        deliveryMethod,
        deliveryAddress: deliveryMethod === 'delivery' ? deliveryAddress : undefined,
        specialInstructions: specialInstructions || undefined,
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
      };

      const order = await createOrder.mutateAsync(orderData);

      clearCart();
      navigate(`/orders?success=true&orderId=${order.id}`);
    } catch (error) {
      console.error('Failed to create order:', error);
    }
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <svg
          className="w-24 h-24 text-gray-400 mx-auto mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
        <p className="text-gray-600 mb-6">Add some products to get started</p>
        <Link
          to="/products"
          className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition"
        >
          Browse Products
        </Link>
      </div>
    );
  }

  if (showCheckout) {
    return (
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => setShowCheckout(false)}
          className="text-gray-600 hover:text-gray-900 mb-4 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Cart
        </button>

        <h1 className="text-3xl font-bold text-gray-900 mb-6">Checkout</h1>

        <form onSubmit={handleSubmitOrder} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Delivery Method
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="delivery"
                  checked={deliveryMethod === 'delivery'}
                  onChange={(e) => setDeliveryMethod(e.target.value as 'delivery')}
                  className="mr-2"
                />
                <span>Delivery</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="collection"
                  checked={deliveryMethod === 'collection'}
                  onChange={(e) => setDeliveryMethod(e.target.value as 'collection')}
                  className="mr-2"
                />
                <span>Collection</span>
              </label>
            </div>
          </div>

          <div>
            <label htmlFor="deliveryDate" className="block text-sm font-medium text-gray-700 mb-2">
              {deliveryMethod === 'delivery' ? 'Delivery' : 'Collection'} Date
            </label>
            <select
              id="deliveryDate"
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            >
              <option value="">Select a date</option>
              {getNextDeliveryDates().map((date) => (
                <option key={date} value={date}>
                  {new Date(date).toLocaleDateString('en-ZA', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </option>
              ))}
            </select>
          </div>

          {deliveryMethod === 'delivery' && (
            <div>
              <label htmlFor="deliveryAddress" className="block text-sm font-medium text-gray-700 mb-2">
                Delivery Address
              </label>
              <textarea
                id="deliveryAddress"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
            </div>
          )}

          <div>
            <label htmlFor="specialInstructions" className="block text-sm font-medium text-gray-700 mb-2">
              Special Instructions (Optional)
            </label>
            <textarea
              id="specialInstructions"
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              rows={3}
              placeholder="Any special requests or notes..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between text-lg font-bold">
              <span>Total:</span>
              <span>R{total.toFixed(2)}</span>
            </div>
          </div>

          {createOrder.isError && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
              Failed to place order. Please try again.
            </div>
          )}

          <button
            type="submit"
            disabled={createOrder.isPending}
            className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
          >
            {createOrder.isPending ? 'Placing Order...' : 'Place Order'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Shopping Cart</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {cartProducts.map((item) => (
            <CartItem
              key={item.product.id}
              product={item.product}
              quantity={item.quantity}
            />
          ))}
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-lg shadow sticky top-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h2>
            
            <div className="space-y-2 mb-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Items ({items.length}):</span>
                <span className="font-semibold">R{total.toFixed(2)}</span>
              </div>
            </div>

            <div className="border-t pt-4 mb-6">
              <div className="flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span>R{total.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={() => setShowCheckout(true)}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition"
            >
              Proceed to Checkout
            </button>

            <Link
              to="/products"
              className="block text-center text-green-600 hover:text-green-700 mt-4"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

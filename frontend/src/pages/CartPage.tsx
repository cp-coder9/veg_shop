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

  // Delivery State
  const [deliveryLocation, setDeliveryLocation] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState(user?.address || '');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [showCheckout, setShowCheckout] = useState(false);

  // Auto-select delivery option based on address
  useEffect(() => {
    if (user?.address && !deliveryLocation) {
      const address = user.address.toLowerCase();
      if (address.includes('paarl')) setDeliveryLocation('delivery_paarl');
      else if (address.includes('val de vie')) setDeliveryLocation('delivery_valdevie');
      else if (address.includes('pearl valley')) setDeliveryLocation('delivery_pearlvalley');
      else if (address.includes('wellington')) setDeliveryLocation('delivery_wellington');
    }
  }, [user?.address, deliveryLocation]);

  // Delivery Options & Fees
  const deliveryOptions = [
    { id: 'collection_uitgezocht', label: 'Collection: Uitgezocht Estate (>1pm)', fee: 0, type: 'collection' },
    { id: 'collection_greenschool', label: 'Collection: Green School', fee: 0, type: 'collection' },
    { id: 'delivery_paarl', label: 'Delivery: Paarl (R35)', fee: 35, type: 'delivery' },
    { id: 'delivery_valdevie', label: 'Delivery: Val de Vie (R35)', fee: 35, type: 'delivery' },
    { id: 'delivery_wellington', label: 'Delivery: Wellington (R50)', fee: 50, type: 'delivery' },
    { id: 'delivery_pearlvalley', label: 'Delivery: Pearl Valley (R50)', fee: 50, type: 'delivery' },
  ];

  const selectedDeliveryOption = deliveryOptions.find(opt => opt.id === deliveryLocation);
  const deliveryFee = selectedDeliveryOption ? selectedDeliveryOption.fee : 0;
  const isDelivery = selectedDeliveryOption?.type === 'delivery';

  const cartProducts = useMemo(() => {
    if (!products) return [];
    return items
      .map((item) => {
        const product = products.find((p) => p.id === item.productId);
        return product ? { product, quantity: item.quantity } : null;
      })
      .filter((item): item is { product: Product; quantity: number } => item !== null);
  }, [items, products]);

  const productTotal = useMemo(() => {
    return cartProducts.reduce(
      (sum, item) => sum + toNumber(item.product.price) * item.quantity,
      0
    );
  }, [cartProducts]);

  const grandTotal = productTotal + deliveryFee;

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

    if (!deliveryLocation) {
      alert('Please select a delivery or collection option.');
      return;
    }

    try {
      const orderData = {
        deliveryDate,
        deliveryMethod: (isDelivery ? 'delivery' : 'collection') as 'delivery' | 'collection',
        deliveryFees: deliveryFee,
        deliveryAddress: isDelivery ? deliveryAddress : selectedDeliveryOption?.label,
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
      <div className="max-w-3xl mx-auto">
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

        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Weekly Delivery Schedule</h3>
              <div className="mt-2 text-sm text-blue-700">
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Monday:</strong> Bakery, Broths, Eggs, Nuts & Fruit (So Natural)</li>
                  <li><strong>Wednesday:</strong> Fresh Veg, Fruit, Gluten-Free Bakes</li>
                  <li><strong>Friday:</strong> Mysthill Raw Dairy, Meat</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmitOrder} className="space-y-6 bg-white p-6 rounded-lg shadow-sm">
          {/* Delivery Location */}
          <div>
            <label htmlFor="deliveryLocation" className="block text-sm font-medium text-gray-700 mb-2">
              Delivery / Collection Point *
            </label>
            <select
              id="deliveryLocation"
              value={deliveryLocation}
              onChange={(e) => setDeliveryLocation(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            >
              <option value="">Select option...</option>
              {deliveryOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Date Selection */}
          <div>
            <label htmlFor="deliveryDate" className="block text-sm font-medium text-gray-700 mb-2">
              Preferred Date *
            </label>
            <select
              id="deliveryDate"
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            >
              <option value="">Select a date...</option>
              {getNextDeliveryDates().map((date) => (
                <option key={date} value={date}>
                  {new Date(date).toLocaleDateString('en-ZA', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </option>
              ))}
            </select>
          </div>

          {/* Address Input (Only if Delivery) */}
          {isDelivery && (
            <div>
              <label htmlFor="deliveryAddress" className="block text-sm font-medium text-gray-700 mb-2">
                Street Address *
              </label>
              <textarea
                id="deliveryAddress"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required={isDelivery}
              />
            </div>
          )}

          {/* Special Instructions */}
          <div>
            <label htmlFor="specialInstructions" className="block text-sm font-medium text-gray-700 mb-2">
              Special Instructions (Optional)
            </label>
            <textarea
              id="specialInstructions"
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              rows={2}
              placeholder="Gate code, specific packaging requests, etc."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          {/* Order Totals */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal:</span>
              <span>R{productTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Delivery Fee:</span>
              <span>R{deliveryFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xl font-bold border-t pt-2 mt-2">
              <span>Total:</span>
              <span>R{grandTotal.toFixed(2)}</span>
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
            {createOrder.isPending ? 'Placing Order...' : `Place Order (R${grandTotal.toFixed(2)})`}
          </button>
        </form>
      </div>
    );
  }

  // Cart View
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Review Your Order</h1>
      <p className="text-gray-600 mb-8">Please check your items before finalizing delivery details.</p>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
        <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
          <h2 className="font-semibold text-gray-700">Your Checklist ({items.reduce((acc, i) => acc + i.quantity, 0)} items)</h2>
          <Link to="/products" className="text-sm text-green-600 hover:text-green-700 font-medium">+ Add More Items</Link>
        </div>

        <div className="divide-y divide-gray-100">
          {cartProducts.map((item) => (
            <div key={item.product.id} className="p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors group">
              {/* Checkbox visual cue */}
              <div className="flex-shrink-0 text-green-500 opacity-20 group-hover:opacity-100 transition-opacity">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>

              <div className="flex-grow">
                <h3 className="font-medium text-gray-900">{item.product.name}</h3>
                <p className="text-sm text-gray-500">{item.product.category} &bull; R{toNumber(item.product.price).toFixed(2)} / {item.product.unit}</p>
              </div>

              {/* Quantity Controls (reusing CartItem logic visually here or importing CartItem) */}
              {/* For now, we reuse CartItem but wrapper makes it look like a list */}
              <div className="flex-shrink-0">
                <CartItem
                  product={item.product}
                  quantity={item.quantity}
                  compact={true} // Assuming CartItem accepts compact props or we rely on parent styling
                />
              </div>

              <div className="flex-shrink-0 w-24 text-right font-medium text-gray-900">
                R{(toNumber(item.product.price) * item.quantity).toFixed(2)}
              </div>
            </div>
          ))}
        </div>

        <div className="p-6 bg-gray-50 border-t border-gray-200">
          <div className="flex justify-between items-center text-xl font-bold text-gray-900">
            <span>Total Estimated</span>
            <span>R{productTotal.toFixed(2)}</span>
          </div>
          <p className="text-right text-sm text-gray-500 mt-1">Excludes delivery fees</p>
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <Link
          to="/products"
          className="px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition"
        >
          Back to Shop
        </Link>
        <button
          onClick={() => setShowCheckout(true)}
          className="px-8 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 shadow-lg hover:shadow-xl transition transform hover:-translate-y-0.5"
        >
          Proceed to Checkout &rarr;
        </button>
      </div>
    </div>
  );
}

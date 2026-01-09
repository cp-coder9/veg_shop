import { useState, useEffect } from 'react';
import { useCartStore } from '../stores/cartStore';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useCustomerOrders } from '../hooks/useOrders';
import { toNumber } from '../lib/utils';

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  packed: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

export default function OrdersPage() {
  const { data: orders, isLoading, isError } = useCustomerOrders();
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const [showSuccess, setShowSuccess] = useState(false);
  const { setItems } = useCartStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 5000);
    }
  }, [searchParams]);

  const handleReorder = (items: { product?: { id: string }, productId?: string, quantity: number }[]) => {
    // Map order items to cart items, filtering out items without product data
    const cartItems = items
      .filter(item => item.product?.id || item.productId)
      .map(item => ({
        productId: item.product?.id || item.productId!,
        quantity: item.quantity
      }));

    // Replace current cart with these items
    setItems(cartItems);

    // Navigate to cart
    navigate('/cart');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading orders...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg">
        Failed to load orders. Please try again later.
      </div>
    );
  }

  const selectedOrderData = orders?.find((o) => o.id === selectedOrder);

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">My Orders</h1>

      {showSuccess && (
        <div className="bg-green-50 text-green-600 px-4 py-3 rounded-lg mb-6">
          Order placed successfully! We'll send you a confirmation shortly.
        </div>
      )}

      {orders && orders.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          {/* ... existing empty state ... */}
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No orders yet</h2>
          <p className="text-gray-600">Your order history will appear here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders?.map((order) => {
            const total = order.items.reduce(
              (sum, item) => sum + toNumber(item.priceAtOrder) * item.quantity,
              0
            );

            return (
              <div
                key={order.id}
                className="bg-white rounded-lg shadow p-6 hover:shadow-md transition cursor-pointer"
                onClick={() => setSelectedOrder(selectedOrder === order.id ? null : order.id)}
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-gray-600">
                      Order #{order.id.slice(0, 8)}
                    </p>
                    <p className="text-lg font-semibold text-gray-900">
                      {new Date(order.deliveryDate).toLocaleDateString('en-ZA', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${STATUS_COLORS[order.status]
                        }`}
                    >
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                    <p className="text-lg font-bold text-gray-900 mt-2">
                      R{total.toFixed(2)}
                    </p>
                  </div>
                </div>

                {selectedOrder === order.id && (
                  <div className="border-t pt-4 mt-4 cursor-auto" onClick={(e) => e.stopPropagation()}>
                    <h3 className="font-semibold text-gray-900 mb-3">Order Details</h3>

                    <div className="space-y-2 mb-4">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex justify-between text-sm">
                          <span className="text-gray-600">
                            {item.product?.name || 'Unknown Product'} x {item.quantity}
                          </span>
                          <span className="font-semibold">
                            R{(toNumber(item.priceAtOrder) * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="border-t pt-3 space-y-2 text-sm mb-4">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Delivery Method:</span>
                        <span className="font-semibold">
                          {order.deliveryMethod === 'delivery' ? 'Delivery' : 'Collection'}
                        </span>
                      </div>
                      {order.deliveryAddress && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Address:</span>
                          <span className="font-semibold text-right max-w-xs">
                            {order.deliveryAddress}
                          </span>
                        </div>
                      )}
                      {order.specialInstructions && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Instructions:</span>
                          <span className="font-semibold text-right max-w-xs">
                            {order.specialInstructions}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-3">
                      {/* Pay Now Section */}
                      {['pending', 'confirmed'].includes(order.status) && (
                        <div className="flex-1 bg-blue-50 p-4 rounded-lg border border-blue-200">
                          <h4 className="font-bold text-blue-800 mb-2">Banking Details (EFT)</h4>
                          <p className="text-sm text-blue-700 mb-1"><strong>Bank:</strong> FNB</p>
                          <p className="text-sm text-blue-700 mb-1"><strong>Account Name:</strong> Totey</p>
                          <p className="text-sm text-blue-700 mb-1"><strong>Account Number:</strong> 62123456789</p>
                          <p className="text-sm text-blue-700 mb-1"><strong>Branch Code:</strong> 250655</p>
                          <p className="text-sm text-blue-700 mb-0"><strong>Reference:</strong> {order.id.slice(0, 8)}</p>
                        </div>
                      )}

                      {/* Reorder Button section */}
                      <div className="flex-1 flex items-end justify-end">
                        <button
                          onClick={() => handleReorder(order.items)}
                          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-bold shadow-lg transition-transform transform hover:scale-105"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Reorder Items
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

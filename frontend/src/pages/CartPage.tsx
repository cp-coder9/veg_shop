import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCartStore } from '../stores/cartStore';
import { useAuthStore } from '../stores/authStore';
import { useProducts } from '../hooks/useProducts';
import { useCreateOrder } from '../hooks/useOrders';
import { formatPrice } from '../lib/utils';
import { toast } from 'react-hot-toast';
import { Button, Input, Select, Card, CardHeader } from '../components/ui';

// Delivery options
const deliveryOptions = [
  { value: 'collection_uitgezocht', label: 'Collection - Uitgezocht (Free)', price: 0 },
  { value: 'delivery_paarl', label: 'Delivery - Paarl (R50)', price: 50 },
  { value: 'delivery_surrounding', label: 'Delivery - Surrounding Areas (R80)', price: 80 },
];

export default function CartPage() {
  const navigate = useNavigate();
  const { items, clearCart, updateQuantity, removeItem } = useCartStore();
  const { user } = useAuthStore();
  const { data: products, isLoading: productsLoading } = useProducts();
  const createOrder = useCreateOrder();

  const [isCheckout, setIsCheckout] = useState(false);
  const [deliveryMethod, setDeliveryMethod] = useState('collection_uitgezocht');
  const [deliveryAddress, setDeliveryAddress] = useState(user?.address || '');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [coolerBag, setCoolerBag] = useState(false);

  // Calculate cart totals
  const cartItems = items.map((item) => {
    const product = products?.find((p) => p.id === item.productId);
    const price = product ? Number(product.price) : 0;
    return {
      ...item,
      product,
      subtotal: price * item.quantity,
    };
  });

  const subtotal = cartItems.reduce((sum, item) => sum + item.subtotal, 0);
  const selectedDelivery = deliveryOptions.find((opt) => opt.value === deliveryMethod);
  const deliveryFee = selectedDelivery?.price || 0;
  const coolerBagFee = coolerBag ? 35 : 0;
  const total = subtotal + deliveryFee + coolerBagFee;

  // Check if delivery option requires address
  const requiresAddress = deliveryMethod.startsWith('delivery_');

  const handleCheckout = async () => {
    if (items.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    if (requiresAddress && !deliveryAddress.trim()) {
      toast.error('Please enter a delivery address');
      return;
    }

    try {
      const orderData = {
        deliveryDate: getNextDeliveryDate(),
        deliveryMethod: deliveryMethod.startsWith('delivery_') ? 'delivery' as const : 'collection' as const,
        deliveryAddress: requiresAddress ? deliveryAddress : undefined,
        specialInstructions: specialInstructions || undefined,
        deliveryFees: deliveryFee,
        coolerBagOption: coolerBag,
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
      };

      await createOrder.mutateAsync(orderData);
      toast.success('Order placed successfully!');
      clearCart();
      navigate('/orders');
    } catch (error) {
      toast.error('Failed to place order. Please try again.');
    }
  };

  // Get next delivery date (next Tuesday)
  const getNextDeliveryDate = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysUntilTuesday = dayOfWeek <= 2 ? 2 - dayOfWeek : 9 - dayOfWeek;
    const nextTuesday = new Date(today);
    nextTuesday.setDate(today.getDate() + daysUntilTuesday);
    return nextTuesday.toISOString().split('T')[0];
  };

  // Empty cart state
  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="text-center py-12">
          <svg className="w-20 h-20 mx-auto text-warm-gray mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <h2 className="font-display text-display-sm text-primary-dark mb-2">Your Cart is Empty</h2>
          <p className="font-body text-body-md text-warm-gray mb-6">
            Start shopping to add items to your cart
          </p>
          <Link to="/products">
            <Button>Browse Products</Button>
          </Link>
        </Card>
      </div>
    );
  }

  // Loading state
  if (productsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="loading-spinner h-12 w-12 animate-spin rounded-full border-4 border-light-gray border-t-terracotta"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="font-display text-display-md text-primary-dark">
          {isCheckout ? 'Checkout' : 'Review Your Order'}
        </h1>
        {!isCheckout && (
          <Button variant="ghost" onClick={() => clearCart()}>
            Clear Cart
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {!isCheckout ? (
            <Card>
              <CardHeader title="Your Checklist" subtitle={`${items.length} items in your cart`} />
              <div className="divide-y divide-light-gray">
                {cartItems.map((item) => (
                  <div key={item.productId} className="py-4 flex items-center gap-4">
                    {/* Product Image Placeholder */}
                    <div className="w-16 h-16 bg-cream rounded-lg flex-shrink-0 flex items-center justify-center">
                      {item.product?.imageUrl ? (
                        <img
                          src={item.product.imageUrl}
                          alt={item.product.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <svg className="w-8 h-8 text-warm-gray" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-display text-body-lg text-primary-dark">{item.product?.name}</h3>
                      <p className="font-body text-body-sm text-warm-gray">
                        R{item.product ? formatPrice(item.product.price) : '0.00'} / {item.product?.unit}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-light-gray text-primary-dark hover:bg-warm-gray/30 transition-colors"
                      >
                        −
                      </button>
                      <span className="w-8 text-center font-bold text-terracotta">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-terracotta text-white hover:bg-terracotta/80 transition-colors"
                      >
                        +
                      </button>
                    </div>

                    <div className="text-right">
                      <p className="font-body text-body-md font-bold text-primary-dark">
                        R{formatPrice(item.subtotal)}
                      </p>
                      <button
                        onClick={() => removeItem(item.productId)}
                        className="font-body text-body-sm text-error hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ) : (
            /* Checkout Form */
            <Card>
              <CardHeader title="Delivery Details" />
              <div className="space-y-4">
                <Select
                  label="Delivery / Collection Point"
                  value={deliveryMethod}
                  onChange={(e) => setDeliveryMethod(e.target.value)}
                  options={deliveryOptions.map((opt) => ({
                    value: opt.value,
                    label: opt.label,
                  }))}
                />

                {requiresAddress && (
                  <Input
                    label="Street Address"
                    placeholder="Enter your delivery address"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                  />
                )}

                <div>
                  <label className="block font-accent text-caption font-medium text-primary-dark mb-2 uppercase tracking-wider">
                    Special Instructions
                  </label>
                  <textarea
                    className="w-full px-4 py-3.5 font-body text-body-md text-primary-dark bg-white border border-light-gray rounded-md focus:border-primary-dark focus:ring-2 focus:ring-primary-dark/10 focus:outline-none"
                    rows={3}
                    placeholder="Any special delivery instructions?"
                    value={specialInstructions}
                    onChange={(e) => setSpecialInstructions(e.target.value)}
                  />
                </div>

                <div className="flex items-center gap-3 p-4 bg-cream rounded-lg">
                  <input
                    type="checkbox"
                    id="coolerBag"
                    checked={coolerBag}
                    onChange={(e) => setCoolerBag(e.target.checked)}
                    className="w-5 h-5 rounded border-light-gray text-terracotta focus:ring-terracotta"
                  />
                  <label htmlFor="coolerBag" className="flex-1">
                    <span className="font-body text-body-md text-primary-dark">Add Cooler Bag (R35)</span>
                    <span className="block font-body text-body-sm text-warm-gray">Keep your produce fresh on delivery</span>
                  </label>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader title="Order Summary" />
            <div className="space-y-3">
              <div className="flex justify-between font-body text-body-md">
                <span className="text-warm-gray">Subtotal</span>
                <span className="text-primary-dark">R{formatPrice(subtotal)}</span>
              </div>
              {deliveryFee > 0 && (
                <div className="flex justify-between font-body text-body-md">
                  <span className="text-warm-gray">Delivery</span>
                  <span className="text-primary-dark">R{formatPrice(deliveryFee)}</span>
                </div>
              )}
              {coolerBag && (
                <div className="flex justify-between font-body text-body-md">
                  <span className="text-warm-gray">Cooler Bag</span>
                  <span className="text-primary-dark">R{formatPrice(coolerBagFee)}</span>
                </div>
              )}
              <div className="border-t border-light-gray pt-3">
                <div className="flex justify-between font-display text-body-lg">
                  <span className="text-primary-dark">Total</span>
                  <span className="text-terracotta font-bold">R{formatPrice(total)}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {isCheckout ? (
                <>
                  <Button
                    className="w-full"
                    onClick={handleCheckout}
                    isLoading={createOrder.isPending}
                  >
                    Place Order
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full"
                    onClick={() => setIsCheckout(false)}
                  >
                    Back to Cart
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    className="w-full"
                    onClick={() => setIsCheckout(true)}
                  >
                    Proceed to Checkout
                  </Button>
                  <Link to="/products" className="block">
                    <Button variant="secondary" className="w-full">
                      Continue Shopping
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

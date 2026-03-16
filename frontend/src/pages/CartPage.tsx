import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCartStore } from '../stores/cartStore';
import { useAuthStore } from '../stores/authStore';
import { useProducts } from '../hooks/useProducts';
import { useCreateOrder } from '../hooks/useOrders';
import { formatPrice } from '../lib/utils';
import { toast } from 'react-hot-toast';
import { ShoppingCart, Trash2, Plus, Minus, CreditCard, Truck, Package, ChevronRight, Info } from 'lucide-react';

const deliveryOptions = [
  { value: 'collection_uitgezocht', label: 'Collection - Uitgezocht', price: 0, desc: 'Pick up from our central hub' },
  { value: 'delivery_paarl', label: 'Delivery - Paarl', price: 50, desc: 'Paarl central areas' },
  { value: 'delivery_surrounding', label: 'Surrounding Areas', price: 80, desc: 'Wellington, Franschhoek, etc.' },
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

  const requiresAddress = deliveryMethod.startsWith('delivery_');

  const handleCheckout = async () => {
    if (items.length === 0) {
      toast.error('Field is empty');
      return;
    }

    if (requiresAddress && !deliveryAddress.trim()) {
      toast.error('Location required');
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
      toast.success('Registration successful');
      clearCart();
      navigate('/orders');
    } catch (error) {
      toast.error('Connection failed');
    }
  };

  const getNextDeliveryDate = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysUntilTuesday = dayOfWeek <= 2 ? 2 - dayOfWeek : 9 - dayOfWeek;
    const nextTuesday = new Date(today);
    nextTuesday.setDate(today.getDate() + daysUntilTuesday);
    return nextTuesday.toISOString().split('T')[0];
  };

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-8 py-40 text-center">
        <div className="mb-12 opacity-10 flex justify-center">
          <ShoppingCart size={120} strokeWidth={1} />
        </div>
        <h2 className="text-4xl font-black uppercase tracking-tighter text-[var(--pigment-green)] mb-6">Empty Vessel</h2>
        <p className="font-mono text-xs uppercase tracking-[0.3em] opacity-40 mb-12">
          Your harvest tote is currently awaiting produce.
        </p>
        <Link
          to="/products"
          className="inline-block bg-[var(--pigment-green)] text-[var(--canvas)] px-12 py-5 font-bold uppercase tracking-widest hover:scale-105 transition-all shadow-xl"
        >
          Begin Selection
        </Link>
      </div>
    );
  }

  if (productsLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-8">
        <div className="w-16 h-16 border-4 border-[var(--pigment-green)]/10 border-t-[var(--pigment-green)] rounded-full animate-spin" />
        <p className="font-mono text-xs uppercase tracking-[0.3em] opacity-40">Compiling selection...</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto px-8 py-20 pb-40">
      <div className="mb-20">
        <p className="font-mono text-[10px] uppercase font-bold tracking-[0.4em] text-[var(--pigment-ochre)] mb-4">
          Harvest Summary
        </p>
        <h1 className="text-6xl font-[900] uppercase tracking-tighter text-[var(--pigment-green)] mb-6">
          {isCheckout ? 'Finalize' : 'Your Tote'}
        </h1>
        <div className="flex items-center gap-6">
          <p className="font-mono text-xs opacity-60 uppercase tracking-widest leading-relaxed">
            {items.length} units pending. Next harvest: {getNextDeliveryDate()}.
          </p>
          {!isCheckout && (
            <button onClick={clearCart} className="text-[10px] uppercase font-bold text-[var(--pigment-oxide)] hover:underline tracking-widest">
              Clear All
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
        {/* Left Column */}
        <div className="lg:col-span-12 xl:col-span-8 space-y-12">
          {!isCheckout ? (
            <div className="space-y-1 border-t border-[var(--pigment-ochre)]/10">
              {cartItems.map((item) => (
                <div key={item.productId} className="group py-8 grid grid-cols-1 md:grid-cols-12 gap-6 items-center border-b border-[var(--pigment-ochre)]/10 hover:bg-white/30 transition-all duration-300">
                  <div className="md:col-span-6 flex gap-6 items-center">
                    <div className="w-20 h-20 bg-[var(--pigment-ochre)]/5 flex-shrink-0 flex items-center justify-center grayscale contrast-125">
                      {item.product?.imageUrl ? (
                        <img src={item.product.imageUrl} alt={item.product.name} className="w-full h-full object-cover" />
                      ) : (
                        <Package size={24} className="opacity-20" />
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xl font-black uppercase tracking-tighter text-[var(--pigment-green)]">{item.product?.name}</span>
                      <span className="font-mono text-[10px] opacity-40 uppercase tracking-widest">
                        R{formatPrice(item.product?.price || 0)} / {item.product?.unit}
                      </span>
                    </div>
                  </div>

                  <div className="md:col-span-3 flex items-center justify-start md:justify-center gap-6">
                    <div className="flex items-center gap-4 bg-white/50 border border-[var(--pigment-green)]/10 p-1">
                      <button onClick={() => updateQuantity(item.productId, item.quantity - 1)} className="p-2 hover:bg-[var(--canvas)] transition-all"><Minus size={14} /></button>
                      <span className="w-6 text-center font-bold font-mono text-sm">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.productId, item.quantity + 1)} className="p-2 hover:bg-[var(--canvas)] transition-all"><Plus size={14} /></button>
                    </div>
                  </div>

                  <div className="md:col-span-3 flex items-center justify-between md:justify-end gap-6">
                    <span className="font-mono text-lg font-black text-[var(--pigment-oxide)]">R{formatPrice(item.subtotal)}</span>
                    <button onClick={() => removeItem(item.productId)} className="opacity-20 hover:opacity-100 hover:text-[var(--pigment-oxide)] transition-all">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-12 animate-[fadeIn_0.5s_ease-out]">
              <div className="space-y-6">
                <div className="flex items-center gap-3 opacity-40 font-mono text-[10px] uppercase tracking-[0.2em]">
                  <Truck size={14} />
                  <span>Logistics</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-1">
                  {deliveryOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setDeliveryMethod(opt.value)}
                      className={`p-6 border text-left transition-all ${deliveryMethod === opt.value
                          ? 'bg-[var(--pigment-green)] text-[var(--canvas)] border-[var(--pigment-green)]'
                          : 'bg-white/40 border-[var(--pigment-ochre)]/10 hover:border-[var(--pigment-ochre)]/30'
                        }`}
                    >
                      <div className="font-black uppercase tracking-tighter mb-1">{opt.label}</div>
                      <div className="text-[10px] font-mono opacity-60 uppercase tracking-widest mb-4">{opt.desc}</div>
                      <div className="font-mono font-bold text-sm">R{opt.price}</div>
                    </button>
                  ))}
                </div>
              </div>

              {requiresAddress && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 opacity-40 font-mono text-[10px] uppercase tracking-[0.2em]">
                    <CreditCard size={14} />
                    <span>Coordinates</span>
                  </div>
                  <input
                    type="text"
                    placeholder="ENTER STREET ADDRESS..."
                    className="w-full bg-white/40 border-b-2 border-[var(--pigment-green)]/10 focus:border-[var(--pigment-green)] py-6 px-6 outline-none font-mono text-xs uppercase tracking-widest transition-all placeholder:opacity-30"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                  />
                </div>
              )}

              <div className="space-y-4">
                <div className="flex items-center gap-3 opacity-40 font-mono text-[10px] uppercase tracking-[0.2em]">
                  <Info size={14} />
                  <span>Annotations</span>
                </div>
                <textarea
                  placeholder="SPECIAL INSTRUCTIONS (OPTIONAL)..."
                  rows={3}
                  className="w-full bg-white/40 border-b-2 border-[var(--pigment-green)]/10 focus:border-[var(--pigment-green)] py-6 px-6 outline-none font-mono text-xs uppercase tracking-widest transition-all placeholder:opacity-30 resize-none"
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                />
              </div>

              <button
                onClick={() => setCoolerBag(!coolerBag)}
                className={`w-full flex items-center justify-between p-6 border transition-all ${coolerBag ? 'bg-[var(--pigment-ochre)]/10 border-[var(--pigment-ochre)]' : 'bg-white/40 border-[var(--pigment-ochre)]/10 opacity-60'
                  }`}
              >
                <div className="flex items-center gap-6">
                  <div className={`w-6 h-6 border flex items-center justify-center transition-all ${coolerBag ? 'bg-[var(--pigment-ochre)] border-[var(--pigment-ochre)] text-white' : 'border-[var(--ink)]/20'}`}>
                    {coolerBag && <Plus size={14} />}
                  </div>
                  <div className="text-left">
                    <div className="font-black uppercase tracking-tighter mb-0.5">Cooler Bag Supplement</div>
                    <div className="text-[10px] font-mono opacity-60 uppercase tracking-widest">Keep your produce fresh during transit</div>
                  </div>
                </div>
                <div className="font-mono font-bold">R35</div>
              </button>
            </div>
          )}
        </div>

        {/* Summary Sidebar */}
        <div className="lg:col-span-12 xl:col-span-4">
          <div className="bg-white/50 border border-[var(--pigment-ochre)]/20 p-8 lg:p-12 sticky top-32 backdrop-blur-md">
            <h2 className="text-2xl font-black uppercase tracking-tighter text-[var(--pigment-green)] mb-12">Accounting</h2>

            <div className="space-y-6 pb-12 border-b border-[var(--pigment-ochre)]/10">
              <div className="flex justify-between font-mono text-xs uppercase tracking-widest">
                <span className="opacity-40">Produce</span>
                <span>R{formatPrice(subtotal)}</span>
              </div>
              {deliveryFee > 0 && (
                <div className="flex justify-between font-mono text-xs uppercase tracking-widest">
                  <span className="opacity-40">Transit</span>
                  <span>R{formatPrice(deliveryFee)}</span>
                </div>
              )}
              {coolerBag && (
                <div className="flex justify-between font-mono text-xs uppercase tracking-widest">
                  <span className="opacity-40">Protection</span>
                  <span>R{formatPrice(coolerBagFee)}</span>
                </div>
              )}
            </div>

            <div className="py-12 mb-8">
              <div className="flex justify-between items-baseline">
                <span className="text-xs font-mono uppercase tracking-[0.3em] opacity-40">Total Weight</span>
                <span className="text-4xl font-black text-[var(--pigment-oxide)]">R{formatPrice(total)}</span>
              </div>
            </div>

            <div className="space-y-4">
              {isCheckout ? (
                <>
                  <button
                    onClick={handleCheckout}
                    disabled={createOrder.isPending}
                    className="w-full bg-[var(--pigment-green)] text-[var(--canvas)] py-5 font-bold uppercase tracking-[3px] hover:bg-[var(--pigment-oxide)] transition-all disabled:opacity-50 shadow-xl"
                  >
                    {createOrder.isPending ? 'Processing...' : 'Confirm Order'}
                  </button>
                  <button
                    onClick={() => setIsCheckout(false)}
                    className="w-full py-4 text-[10px] font-bold uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity"
                  >
                    Modify Selection
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setIsCheckout(true)}
                    className="w-full bg-[var(--pigment-green)] text-[var(--canvas)] py-5 font-bold uppercase tracking-[3px] hover:bg-[var(--pigment-oxide)] transition-all flex justify-between items-center px-8 shadow-xl"
                  >
                    <span>Checkout</span>
                    <ChevronRight size={18} />
                  </button>
                  <Link
                    to="/products"
                    className="block w-full text-center py-4 border border-[var(--pigment-green)]/10 text-[10px] font-bold uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity"
                  >
                    Continue Selection
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


import { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCartStore } from '../stores/cartStore.js';
import { useAuthStore } from '../stores/authStore.js';
import { useProducts } from '../hooks/useProducts.js';
import { useCreateOrder, useOrderWindowStatus } from '../hooks/useOrders.js';
import { formatPrice } from '../lib/utils.js';
import { toast } from 'react-hot-toast';
import { ShoppingCart, Trash2, Plus, Minus, CreditCard, Truck, Package, ChevronRight, Info, Calendar, X } from 'lucide-react';

// Order cutoff time configuration (in hours, 24h format)
// Orders placed before this time on cutoff day will be delivered next available day
const ORDER_CUTOFF_HOUR = 12; // 12:00 PM (noon)
const CUTOFF_DAY = 1; // Monday (0 = Sunday, 1 = Monday, etc.)

// Delivery days: Tuesday (2) and Saturday (6)
const DELIVERY_DAYS = [2, 6];

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
  const { data: windowStatus } = useOrderWindowStatus();
  const createOrder = useCreateOrder();

  const [isCheckout, setIsCheckout] = useState(false);
  const [deliveryMethod, setDeliveryMethod] = useState('collection_uitgezocht');
  const [deliveryAddress, setDeliveryAddress] = useState(user?.address || '');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [deliveryInstruction, setDeliveryInstruction] = useState<'door' | 'hand_to_me' | 'inside_fridge' | 'inside_freezer' | undefined>(undefined);
  const [coolerBag, setCoolerBag] = useState(false);
  const [groupDelivery, setGroupDelivery] = useState(false);
  const [agreedToTnC, setAgreedToTnC] = useState(false);
  const [showTnCModal, setShowTnCModal] = useState(false);

  const cartItems = items.map((item) => {
    const product = products?.find((p: any) => p.id === item.productId);
    const price = product ? Number(product.price) : 0;
    return {
      ...item,
      product,
      subtotal: price * item.quantity,
    };
  });

  const groupedByDay = useMemo(() => {
    return cartItems.reduce((acc, item) => {
      const day = item.product?.deliveryDay || 'Unscheduled';
      if (!acc[day]) acc[day] = [];
      acc[day].push(item);
      return acc;
    }, {} as Record<string, typeof cartItems>);
  }, [cartItems]);

  const isEligibleForGrouping = useMemo(() => {
    // Eligible if no perishable items in Wednesday delivery, or overall
    // For now, let's say it's ineligible if any item is perishable
    const hasPerishables = cartItems.some(item => item.product?.isPerishable);
    return !hasPerishables;
  }, [cartItems]);

  const subtotal = cartItems.reduce((sum, item) => sum + item.subtotal, 0);
  const selectedDelivery = deliveryOptions.find((opt) => opt.value === deliveryMethod);
  const deliveryFee = selectedDelivery?.price || 0;
  const coolerBagFee = coolerBag ? 35 : 0;
  const total = subtotal + deliveryFee + coolerBagFee;

  const requiresAddress = deliveryMethod.startsWith('delivery_');

  const handleCheckout = async () => {
    if (windowStatus?.isOpen === false) {
      toast.error('The order window is currently closed.');
      return;
    }

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
        deliveryDate: selectedDeliveryDate || getNextDeliveryDate,
        deliveryMethod: deliveryMethod.startsWith('delivery_') ? 'delivery' as const : 'collection' as const,
        deliveryAddress: requiresAddress ? deliveryAddress : undefined,
        specialInstructions: specialInstructions || undefined,
        deliveryInstruction: deliveryInstruction,
        deliveryFees: deliveryFee,
        coolerBagOption: coolerBag,
        groupDelivery: groupDelivery && isEligibleForGrouping,
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

  const getNextDeliveryDate = useMemo(() => {
    const now = new Date();
    const currentHour = now.getHours();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Find the next available delivery date
    let nextDelivery: Date | null = null;
    let daysToCheck = 0;
    const maxDaysToCheck = 14; // Check up to 2 weeks ahead

    while (daysToCheck < maxDaysToCheck) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() + daysToCheck);
      const checkDayOfWeek = checkDate.getDay();

      // Check if this is a delivery day
      if (DELIVERY_DAYS.includes(checkDayOfWeek)) {
        // For the cutoff day (Monday), check if we passed the cutoff time
        if (checkDayOfWeek === CUTOFF_DAY && daysToCheck === 0 && currentHour >= ORDER_CUTOFF_HOUR) {
          // Skip this Monday, check the next delivery day
          daysToCheck++;
          continue;
        }

        // If it's today and past cutoff, skip to next delivery day
        if (daysToCheck === 0 && currentHour >= ORDER_CUTOFF_HOUR && checkDayOfWeek !== CUTOFF_DAY) {
          // Today is past cutoff, but this is a valid delivery day
          // This case handles same-day delivery which we probably don't allow
        }

        nextDelivery = checkDate;
        break;
      }
      daysToCheck++;
    }

    return nextDelivery ? nextDelivery.toISOString().split('T')[0] : '';
  }, []);

  // Generate available delivery date options for the next 2 weeks
  const availableDeliveryDates = useMemo(() => {
    const options: { value: string; label: string; isNext: boolean }[] = [];
    const now = new Date();
    const currentHour = now.getHours();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const nextDeliveryDate = getNextDeliveryDate;

    let foundNext = false;
    const maxDaysToCheck = 14;

    for (let i = 0; i < maxDaysToCheck; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() + i);
      const checkDayOfWeek = checkDate.getDay();

      // Skip if past cutoff on cutoff day
      if (i === 0 && checkDayOfWeek === CUTOFF_DAY && currentHour >= ORDER_CUTOFF_HOUR) {
        continue;
      }

      if (DELIVERY_DAYS.includes(checkDayOfWeek)) {
        const dateStr = checkDate.toISOString().split('T')[0];
        const dayName = checkDate.toLocaleDateString('en-ZA', { weekday: 'long' });
        const dateFormatted = checkDate.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' });

        options.push({
          value: dateStr,
          label: `${dayName} ${dateFormatted}`,
          isNext: dateStr === nextDeliveryDate,
        });

        if (!foundNext && dateStr === nextDeliveryDate) {
          foundNext = true;
        }
      }
    }

    return options;
  }, [getNextDeliveryDate]);

  // Default selected delivery date
  const [selectedDeliveryDate, setSelectedDeliveryDate] = useState('');

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
            {items.length} units pending. Next harvest: {getNextDeliveryDate}.
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
            <div className="space-y-16">
              {Object.entries(groupedByDay).map(([day, dayItems]) => (
                <div key={day} className="space-y-4">
                  <div className="flex items-center gap-3 py-4 border-b border-[var(--pigment-ochre)]/20">
                    <Calendar size={18} className="text-[var(--pigment-ochre)]" />
                    <h3 className="text-xl font-black uppercase tracking-tighter text-[var(--pigment-green)]">
                      {day} Delivery
                    </h3>
                    <span className="ml-auto font-mono text-[10px] opacity-40 uppercase tracking-widest">
                      {dayItems.length} Items
                    </span>
                  </div>

                  <div className="space-y-1">
                    {dayItems.map((item) => (
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
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[10px] opacity-40 uppercase tracking-widest">
                                R{formatPrice(item.product?.price || 0)} / {item.product?.unit}
                              </span>
                              {item.product?.isPerishable && (
                                <span className="text-[8px] font-mono bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-sm uppercase font-bold tracking-tighter">Perishable</span>
                              )}
                            </div>
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

                  <div className="flex justify-end pt-4">
                    <p className="font-mono text-xs uppercase tracking-widest opacity-60">
                      {day} Subtotal: <span className="font-black text-[var(--ink)]">R{formatPrice(dayItems.reduce((s, i) => s + i.subtotal, 0))}</span>
                    </p>
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

              {/* Delivery Date Selection */}
              {deliveryMethod !== 'collection_uitgezocht' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 opacity-40 font-mono text-[10px] uppercase tracking-[0.2em]">
                    <Calendar size={14} />
                    <span>Harvest Day</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {availableDeliveryDates.map((dateOption) => (
                      <button
                        key={dateOption.value}
                        onClick={() => setSelectedDeliveryDate(dateOption.value)}
                        className={`p-4 border text-left transition-all ${selectedDeliveryDate === dateOption.value
                          ? 'bg-[var(--pigment-green)] text-[var(--canvas)] border-[var(--pigment-green)]'
                          : 'bg-white/40 border-[var(--pigment-ochre)]/10 hover:border-[var(--pigment-ochre)]/30'
                          }`}
                      >
                        <div className="font-bold font-mono text-sm uppercase tracking-wider">{dateOption.label}</div>
                        {dateOption.isNext && (
                          <div className="text-[10px] font-mono opacity-60 uppercase tracking-widest mt-1">Next Available</div>
                        )}
                      </button>
                    ))}
                  </div>
                  {availableDeliveryDates.length === 0 && (
                    <p className="text-xs font-mono text-[var(--pigment-ochre)] opacity-60">No delivery dates available</p>
                  )}
                </div>
              )}

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
                  <Truck size={14} />
                  <span>Delivery Instructions</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {[
                    { id: 'door', label: 'Deliver to door' },
                    { id: 'hand_to_me', label: 'Hand to me' },
                    { id: 'inside_fridge', label: 'Place inside (fridge)' },
                    { id: 'inside_freezer', label: 'Place inside (freezer)' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setDeliveryInstruction(opt.id as any)}
                      className={`p-4 border text-left transition-all ${deliveryInstruction === opt.id
                        ? 'bg-[var(--pigment-green)] text-[var(--canvas)] border-[var(--pigment-green)]'
                        : 'bg-white/40 border-[var(--pigment-ochre)]/10 hover:border-[var(--pigment-ochre)]/30'
                        }`}
                    >
                      <div className="font-bold font-mono text-xs uppercase tracking-wider">{opt.label}</div>
                    </button>
                  ))}
                </div>
              </div>

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

              <div className="space-y-2">
                <button
                  onClick={() => isEligibleForGrouping && setGroupDelivery(!groupDelivery)}
                  disabled={!isEligibleForGrouping}
                  className={`w-full flex items-center justify-between p-6 border transition-all ${groupDelivery && isEligibleForGrouping ? 'bg-[var(--pigment-green)]/10 border-[var(--pigment-green)]' : 'bg-white/40 border-[var(--pigment-green)]/10 opacity-60'
                    } ${!isEligibleForGrouping ? 'cursor-not-allowed grayscale' : ''}`}
                >
                  <div className="flex items-center gap-6">
                    <div className={`w-6 h-6 border flex items-center justify-center transition-all ${groupDelivery && isEligibleForGrouping ? 'bg-[var(--pigment-green)] border-[var(--pigment-green)] text-white' : 'border-[var(--ink)]/20'}`}>
                      {groupDelivery && isEligibleForGrouping && <Plus size={14} />}
                    </div>
                    <div className="text-left">
                      <div className="font-black uppercase tracking-tighter mb-0.5">Group Delivery</div>
                      <div className="text-[10px] font-mono opacity-60 uppercase tracking-widest">Group with other orders in your area to save</div>
                    </div>
                  </div>
                  <div className="font-mono font-bold uppercase text-[10px]">Optional</div>
                </button>
                {!isEligibleForGrouping && (
                  <p className="text-[9px] font-mono text-[var(--pigment-oxide)] opacity-60 uppercase tracking-widest px-6">
                    Ineligible for grouping: Your cart contains perishable items.
                  </p>
                )}
              </div>
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
                  <div className="mb-4 flex items-start gap-3">
                    <input 
                      type="checkbox" 
                      id="tnc" 
                      checked={agreedToTnC} 
                      onChange={(e) => setAgreedToTnC(e.target.checked)}
                      className="mt-0.5 accent-[var(--pigment-green)] w-4 h-4"
                    />
                    <label htmlFor="tnc" className="text-[10px] font-mono text-[var(--pigment-oxide)] uppercase tracking-wider">
                      I agree to the <button type="button" onClick={() => setShowTnCModal(true)} className="underline font-bold text-[var(--pigment-green)] hover:text-black transition-colors">Terms & Conditions</button>
                    </label>
                  </div>
                  <button
                    onClick={handleCheckout}
                    disabled={createOrder.isPending || windowStatus?.isOpen === false || !agreedToTnC}
                    className="w-full bg-[var(--pigment-green)] text-[var(--canvas)] py-5 font-bold uppercase tracking-[3px] hover:bg-[var(--pigment-oxide)] transition-all disabled:opacity-50 shadow-xl"
                  >
                    {createOrder.isPending ? 'Processing...' : windowStatus?.isOpen === false ? 'Window Closed' : 'Confirm Order'}
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
                    disabled={windowStatus?.isOpen === false}
                    className="w-full bg-[var(--pigment-green)] text-[var(--canvas)] py-5 font-bold uppercase tracking-[3px] hover:bg-[var(--pigment-oxide)] transition-all flex justify-between items-center px-8 shadow-xl disabled:opacity-50"
                  >
                    <span>{windowStatus?.isOpen === false ? 'Window Closed' : 'Checkout'}</span>
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

      {/* T&C Modal */}
      {showTnCModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#fcfaf7] w-full max-w-2xl max-h-[85vh] flex flex-col border border-[var(--pigment-ochre)]/20 shadow-2xl relative">
            <div className="p-8 border-b border-[var(--pigment-ochre)]/20 flex justify-between items-center bg-white sticky top-0">
              <h2 className="text-xl font-black uppercase tracking-tighter text-[var(--pigment-green)]">Terms & Conditions</h2>
              <button onClick={() => setShowTnCModal(false)} className="opacity-40 hover:opacity-100 transition-opacity">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-8 overflow-y-auto font-mono text-sm leading-relaxed text-[var(--pigment-oxide)]/80 space-y-6">
              <p className="font-bold underline">1. Introduction</p>
              <p>Welcome to Our Harvest Tote. These terms and conditions outline the rules and regulations for the use of our service.</p>
              
              <p className="font-bold underline">2. Orders and Deliveries</p>
              <p>Due to the fresh nature of our produce, items are subject to availability on the day of harvest. Substituted items or short deliveries will be credited.</p>
              
              <p className="font-bold underline">3. Returns & Replacements</p>
              <p>If you have any issues with your produce, please contact us within 24 hours of delivery. Cooler bags must be returned empty and clean on the next delivery, failing which a replacement fee may apply.</p>
              
              <p className="text-xs italic opacity-60 mt-8">(Note: Full legal terms to be provided)</p>
            </div>
            
            <div className="p-6 border-t border-[var(--pigment-ochre)]/10 bg-white/50 flex justify-end">
              <button 
                onClick={() => {
                  setAgreedToTnC(true);
                  setShowTnCModal(false);
                }}
                className="bg-[var(--pigment-green)] text-white px-8 py-3 text-xs font-bold uppercase tracking-[2px] hover:bg-[var(--pigment-oxide)] transition-colors"
              >
                I Agree
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


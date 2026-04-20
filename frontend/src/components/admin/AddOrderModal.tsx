import { useState, useMemo } from 'react';
import { useAdminUsers } from '../../hooks/useAdminUsers.js';
import { useProducts } from '../../hooks/useProducts.js';
import { useCreateOrder } from '../../hooks/useAdminOrders.js';
import { Button, Input } from '../ui/index.js';
import { Search, Plus, User, Package, Calendar, MapPin, Info, PlusCircle, MinusCircle, Check } from 'lucide-react';

interface AddOrderModalProps {
  onClose: () => void;
}

export default function AddOrderModal({ onClose }: AddOrderModalProps) {
  const [step, setStep] = useState(1);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [orderItems, setOrderItems] = useState<{ productId: string; quantity: number }[]>([]);
  const [deliveryDate, setDeliveryDate] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState<'delivery' | 'collection'>('delivery');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [coolerBagOption, setCoolerBagOption] = useState(false);

  const { data: customers } = useAdminUsers('customer');
  const { data: products } = useProducts();
  const createOrder = useCreateOrder();

  const filteredCustomers = useMemo(() => {
    if (!customers) return [];
    return customers.filter(c => 
      c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
      (c.phone && c.phone.includes(customerSearch)) ||
      (c.email && c.email.toLowerCase().includes(customerSearch.toLowerCase()))
    );
  }, [customers, customerSearch]);

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    return products.filter(p => 
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.category.toLowerCase().includes(productSearch.toLowerCase())
    );
  }, [products, productSearch]);

  const selectedCustomer = useMemo(() => 
    customers?.find(c => c.id === selectedCustomerId),
  [customers, selectedCustomerId]);

  const totalPrice = useMemo(() => {
    return orderItems.reduce((acc, item) => {
      const product = products?.find(p => p.id === item.productId);
      return acc + (Number(product?.price || 0) * item.quantity);
    }, 0);
  }, [orderItems, products]);

  const handleAddProduct = (productId: string) => {
    setOrderItems(prev => {
      const existing = prev.find(i => i.productId === productId);
      if (existing) {
        return prev.map(i => i.productId === productId ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { productId, quantity: 1 }];
    });
  };

  const handleUpdateQuantity = (productId: string, delta: number) => {
    setOrderItems(prev => prev.map(i => {
      if (i.productId === productId) {
        const newQty = Math.max(0, i.quantity + delta);
        return { ...i, quantity: newQty };
      }
      return i;
    }).filter(i => i.quantity > 0));
  };

  const handleSubmit = async () => {
    if (!selectedCustomerId || orderItems.length === 0 || !deliveryDate) {
      alert('Please complete all required fields');
      return;
    }

    try {
      await createOrder.mutateAsync({
        customerId: selectedCustomerId,
        deliveryDate,
        deliveryMethod,
        deliveryAddress: deliveryMethod === 'delivery' ? deliveryAddress : undefined,
        specialInstructions,
        items: orderItems,
        coolerBagOption
      });
      onClose();
    } catch (error) {
      console.error('Failed to create order:', error);
      alert('Failed to create order');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-cream/30">
          <div>
            <h2 className="text-2xl font-display font-bold text-primary-dark">Create Manual Order</h2>
            <p className="text-warm-gray text-sm font-body">Step {step} of 3</p>
          </div>
          <button onClick={onClose} className="text-warm-gray hover:text-black transition-colors">
            <Plus className="rotate-45" size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                  <User size={20} />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Select Customer</h3>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-light-gray" size={18} />
                <Input
                  className="pl-10"
                  placeholder="Search customer by name, email or phone..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2">
                {filteredCustomers.map(c => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setSelectedCustomerId(c.id);
                      setDeliveryAddress(c.address || '');
                      setStep(2);
                    }}
                    className={`flex items-center justify-between p-4 rounded-xl border transition-all text-left ${
                      selectedCustomerId === c.id 
                        ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' 
                        : 'border-gray-100 hover:border-blue-200 hover:bg-gray-50'
                    }`}
                  >
                    <div>
                      <p className="font-bold text-gray-900">{c.name}</p>
                      <p className="text-sm text-warm-gray">{c.phone || c.email}</p>
                    </div>
                    {selectedCustomerId === c.id && <Check className="text-blue-500" size={20} />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                    <Package size={20} />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Add Products</h3>
                </div>
                <div className="text-right">
                  <p className="text-xs text-warm-gray uppercase font-bold tracking-wider">Estimated Total</p>
                  <p className="text-xl font-display font-bold text-primary-dark">R {totalPrice.toFixed(2)}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Product Search */}
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-light-gray" size={18} />
                    <Input
                      className="pl-10"
                      placeholder="Search products..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                    {filteredProducts.map(p => (
                      <div key={p.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                        <div>
                          <p className="font-medium text-gray-900">{p.name}</p>
                          <p className="text-xs text-warm-gray">R {Number(p.price).toFixed(2)} / {p.unit}</p>
                        </div>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => handleAddProduct(p.id)}
                          className="text-blue-600 hover:bg-blue-50"
                        >
                          <PlusCircle size={20} />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Basket */}
                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 h-full">
                  <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    Order Items ({orderItems.length})
                  </h4>
                  {orderItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-warm-gray italic">
                      <Package size={32} className="mb-2 opacity-20" />
                      <p>No products added yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                      {orderItems.map(item => {
                        const product = products?.find(p => p.id === item.productId);
                        return (
                          <div key={item.productId} className="flex items-center justify-between bg-white p-3 rounded-xl shadow-sm border border-gray-100">
                            <div className="flex-1">
                              <p className="text-sm font-bold text-gray-900">{product?.name}</p>
                              <p className="text-xs text-warm-gray font-medium">R {(Number(product?.price || 0) * item.quantity).toFixed(2)}</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <button onClick={() => handleUpdateQuantity(item.productId, -1)} className="text-warm-gray hover:text-red-500">
                                <MinusCircle size={20} />
                              </button>
                              <span className="font-bold text-primary-dark w-4 text-center">{item.quantity}</span>
                              <button onClick={() => handleUpdateQuantity(item.productId, 1)} className="text-warm-gray hover:text-green-500">
                                <PlusCircle size={20} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Logistics */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                      <Calendar size={20} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">Delivery Details</h3>
                  </div>

                  <div className="space-y-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-warm-gray uppercase tracking-widest">Delivery Date</label>
                      <Input type="date" value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)} />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-warm-gray uppercase tracking-widest">Method</label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setDeliveryMethod('delivery')}
                          className={`flex-1 py-2 px-4 rounded-lg font-bold text-sm transition-all ${
                            deliveryMethod === 'delivery' ? 'bg-primary-dark text-white' : 'bg-gray-100 text-warm-gray'
                          }`}
                        >
                          Delivery
                        </button>
                        <button
                          onClick={() => setDeliveryMethod('collection')}
                          className={`flex-1 py-2 px-4 rounded-lg font-bold text-sm transition-all ${
                            deliveryMethod === 'collection' ? 'bg-primary-dark text-white' : 'bg-gray-100 text-warm-gray'
                          }`}
                        >
                          Collection
                        </button>
                      </div>
                    </div>

                    {deliveryMethod === 'delivery' && (
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-warm-gray uppercase tracking-widest">Delivery Address</label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-3 text-light-gray" size={16} />
                          <textarea
                            className="w-full pl-10 pr-4 py-2 border border-light-gray rounded-lg focus:ring-2 focus:ring-primary-dark outline-none min-h-[80px]"
                            value={deliveryAddress}
                            onChange={e => setDeliveryAddress(e.target.value)}
                            placeholder="Enter delivery address..."
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-2">
                      <input
                        type="checkbox"
                        id="coolerBag"
                        checked={coolerBagOption}
                        onChange={e => setCoolerBagOption(e.target.checked)}
                        className="w-4 h-4 text-primary-dark rounded border-gray-300 focus:ring-primary-dark"
                      />
                      <label htmlFor="coolerBag" className="text-sm font-medium text-gray-700">Add Cooler Bag Option</label>
                    </div>
                  </div>
                </div>

                {/* Final Summary */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                      <Info size={20} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">Order Summary</h3>
                  </div>

                  <div className="bg-primary-dark text-white p-6 rounded-3xl shadow-xl space-y-6 relative overflow-hidden">
                    {/* Decorative element */}
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                      <Package size={80} />
                    </div>

                    <div>
                      <p className="text-blue-200 text-xs uppercase font-bold tracking-widest mb-1">Customer</p>
                      <p className="text-lg font-bold">{selectedCustomer?.name}</p>
                      <p className="text-sm opacity-70">{selectedCustomer?.phone || selectedCustomer?.email}</p>
                    </div>

                    <div className="space-y-2 pt-4 border-t border-white/10">
                      <div className="flex justify-between text-sm">
                        <span className="opacity-70">Subtotal</span>
                        <span>R {totalPrice.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="opacity-70">Delivery</span>
                        <span>{deliveryMethod === 'collection' ? 'Free' : 'Calculated'}</span>
                      </div>
                      <div className="flex justify-between text-xl font-bold pt-2">
                        <span>Total</span>
                        <span>R {totalPrice.toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs uppercase font-bold tracking-widest text-blue-200">Internal Notes</label>
                      <textarea
                        className="w-full bg-white/10 border border-white/20 rounded-xl p-3 text-sm focus:bg-white/20 outline-none transition-all"
                        placeholder="Add special instructions or notes..."
                        value={specialInstructions}
                        onChange={e => setSpecialInstructions(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 flex justify-between items-center bg-gray-50">
          <Button
            variant="ghost"
            onClick={() => step > 1 ? setStep(step - 1) : onClose()}
          >
            {step === 1 ? 'Cancel' : 'Previous'}
          </Button>

          <Button
            variant="harvest"
            size="lg"
            disabled={
              (step === 1 && !selectedCustomerId) ||
              (step === 2 && orderItems.length === 0) ||
              createOrder.isPending
            }
            onClick={() => step < 3 ? setStep(step + 1) : handleSubmit()}
          >
            {createOrder.isPending ? 'Processing...' : step < 3 ? 'Next Step' : 'Confirm & Create Order'}
          </Button>
        </div>
      </div>
    </div>
  );
}

import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useCustomerOrders } from '../hooks/useOrders';
import { useCustomerInvoices } from '../hooks/useCustomer';
import { formatPrice } from '../lib/utils';
import { Package, ChevronDown, CreditCard, Truck, Calendar, CheckCircle2, Clock, XCircle, Info } from 'lucide-react';

const RefreshCw = (props: any) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" /><path d="M3 21v-5h5" /></svg>
);

const statusConfig: Record<string, { label: string, color: string, icon: any }> = {
  pending: { label: 'PENDING', color: 'var(--pigment-ochre)', icon: Clock },
  confirmed: { label: 'CONFIRMED', color: 'var(--pigment-green)', icon: CheckCircle2 },
  processing: { label: 'PROCESSING', color: 'var(--pigment-green)', icon: RefreshCw },
  delivered: { label: 'DELIVERED', color: 'var(--pigment-green)', icon: Package },
  cancelled: { label: 'CANCELLED', color: 'var(--pigment-oxide)', icon: XCircle },
};

export default function OrdersPage() {
  const { data: orders, isLoading, isError } = useCustomerOrders();
  const { data: invoices } = useCustomerInvoices();
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const invoiceMap = useMemo(() => {
    const map = new Map<string, any>();
    if (invoices) {
      invoices.forEach((inv: any) => {
        map.set(inv.orderId, inv);
      });
    }
    return map;
  }, [invoices]);

  const orderSuccess = searchParams.get('success');

  const toggleOrder = (orderId: string) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-8">
        <div className="w-16 h-16 border-4 border-[var(--pigment-green)]/10 border-t-[var(--pigment-green)] rounded-full animate-spin" />
        <p className="font-mono text-xs uppercase tracking-[0.3em] opacity-40">Retrieving ledger...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-4xl mx-auto py-20 px-8">
        <div className="bg-[var(--pigment-oxide)]/10 border border-[var(--pigment-oxide)]/20 p-12 text-center">
          <h2 className="text-2xl font-black uppercase tracking-tighter text-[var(--pigment-oxide)] mb-4">Ledger Inaccessible</h2>
          <p className="font-mono text-sm opacity-60 uppercase tracking-widest leading-relaxed">
            We couldn't reach the archives. <br /> Please attempt a reconnection shortly.
          </p>
        </div>
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-8 py-40 text-center">
        <div className="mb-12 opacity-10 flex justify-center">
          <Package size={120} strokeWidth={1} />
        </div>
        <h2 className="text-4xl font-black uppercase tracking-tighter text-[var(--pigment-green)] mb-6">Clean Slate</h2>
        <p className="font-mono text-xs uppercase tracking-[0.3em] opacity-40 mb-12">
          Your order history is currently empty of harvests.
        </p>
        <button
          onClick={() => navigate('/products')}
          className="bg-[var(--pigment-green)] text-[var(--canvas)] px-12 py-5 font-bold uppercase tracking-widest hover:scale-105 transition-all shadow-xl"
        >
          Select Produce
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto px-8 py-20 pb-40">
      {/* Header */}
      <div className="mb-20">
        <p className="font-mono text-[10px] uppercase font-bold tracking-[0.4em] text-[var(--pigment-ochre)] mb-4">
          Transaction Archives
        </p>
        <h1 className="text-6xl font-[900] uppercase tracking-tighter text-[var(--pigment-green)] mb-6">
          Order Ledger
        </h1>
        <p className="font-mono text-xs opacity-60 uppercase tracking-widest max-w-sm leading-relaxed">
          Track your harvests from field to door. <br /> Total cycles: {orders.length}
        </p>
      </div>

      {orderSuccess && (
        <div className="mb-12 bg-[var(--pigment-green)]/10 border border-[var(--pigment-green)]/20 p-8 flex items-center gap-6 animate-[fadeIn_0.5s_ease-out]">
          <CheckCircle2 className="text-[var(--pigment-green)]" size={32} />
          <div>
            <h3 className="font-black uppercase tracking-tighter text-[var(--pigment-green)]">Harvest Initialized</h3>
            <p className="font-mono text-[10px] uppercase tracking-widest opacity-60">Your selection has been registered in the fields.</p>
          </div>
        </div>
      )}

      <div className="space-y-4 border-t border-[var(--pigment-ochre)]/10">
        {orders.map((order) => {
          const isExpanded = expandedOrder === order.id;
          const orderTotal = order.items.reduce(
            (sum, item) => sum + Number(item.priceAtOrder) * item.quantity,
            0
          );
          const invoice = invoiceMap.get(order.id);
          const paymentStatus = invoice?.status || 'unpaid';
          const config = statusConfig[order.status] || { label: order.status.toUpperCase(), color: 'var(--ink)', icon: Info };
          const StatusIcon = config.icon;

          return (
            <div
              key={order.id}
              className={`border-b border-[var(--pigment-ochre)]/10 transition-all duration-500 ${isExpanded ? 'bg-white/40 mb-4' : 'hover:bg-white/20'}`}
            >
              {/* Order Row */}
              <div
                className="p-8 flex flex-wrap md:flex-nowrap items-center justify-between gap-8 cursor-pointer group"
                onClick={() => toggleOrder(order.id)}
              >
                <div className="flex gap-8 items-center min-w-[200px]">
                  <div className={`w-12 h-12 flex items-center justify-center border transition-all ${isExpanded ? 'bg-[var(--pigment-green)] border-[var(--pigment-green)] text-[var(--canvas)]' : 'border-[var(--pigment-ochre)]/20 text-[var(--pigment-ochre)] group-hover:border-[var(--pigment-green)]'}`}>
                    <Package size={20} />
                  </div>
                  <div>
                    <span className="font-mono text-[10px] opacity-40 uppercase block mb-1">Entry #{order.id.slice(0, 8)}</span>
                    <span className="text-xl font-black uppercase tracking-tighter text-[var(--pigment-green)]">
                      {new Date(order.deliveryDate).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', weekday: 'short' })}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-6 md:gap-12">
                  <div className="flex flex-col items-end">
                    <span className="font-mono text-[10px] opacity-40 uppercase mb-1">Cycle Status</span>
                    <div className="flex items-center gap-2" style={{ color: config.color }}>
                      <StatusIcon size={14} />
                      <span className="font-black text-[10px] tracking-widest uppercase">{config.label}</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end min-w-[100px]">
                    <span className="font-mono text-[10px] opacity-40 uppercase mb-1">Fiscal Value</span>
                    <span className="text-xl font-black italic text-[var(--pigment-oxide)]">R{formatPrice(orderTotal)}</span>
                  </div>

                  <ChevronDown size={20} className={`opacity-20 transition-transform duration-500 ${isExpanded ? 'rotate-180 opacity-100' : 'group-hover:opacity-100 group-hover:translate-y-1'}`} />
                </div>
              </div>

              {/* Order Detail Panel */}
              {isExpanded && (
                <div className="px-8 pb-12 pt-4 grid grid-cols-1 lg:grid-cols-12 gap-12 animate-[slideDown_0.4s_ease-out]">
                  {/* Items List */}
                  <div className="lg:col-span-12 xl:col-span-8 space-y-6">
                    <div className="flex items-center gap-3 opacity-40 font-mono text-[10px] uppercase tracking-[0.2em] mb-6">
                      <Package size={14} />
                      <span>Harvest Manifest ({order.items.length} units)</span>
                    </div>
                    <div className="space-y-1 border-t border-[var(--pigment-ochre)]/10">
                      {order.items.map((item) => (
                        <div key={item.id} className="py-4 flex items-center justify-between border-b border-[var(--pigment-ochre)]/5">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-[var(--pigment-ochre)]/5 opacity-40 border border-[var(--pigment-ochre)]/10 flex items-center justify-center">
                              <Package size={16} />
                            </div>
                            <div>
                              <h4 className="font-bold uppercase tracking-tighter text-[var(--pigment-green)] text-sm">{item.product?.name || 'GENERIC PRODUCE'}</h4>
                              <p className="font-mono text-[8px] opacity-40 uppercase tracking-widest leading-none">
                                {item.product?.unit || 'UNIT'} x {item.quantity}
                              </p>
                            </div>
                          </div>
                          <span className="font-mono text-xs font-bold">R{formatPrice(Number(item.priceAtOrder) * item.quantity)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Operational Data */}
                  <div className="lg:col-span-12 xl:col-span-4 space-y-8">
                    {/* Financials & Action */}
                    <div className="bg-white/50 border border-[var(--pigment-ochre)]/20 p-8 shadow-sm">
                      <div className="flex items-baseline justify-between mb-8">
                        <span className="font-mono text-[10px] uppercase tracking-[0.2em] opacity-40">Fiscal State</span>
                        <div className={`font-black text-[10px] tracking-widest uppercase ${paymentStatus === 'paid' ? 'text-[var(--pigment-green)]' : 'text-[var(--pigment-oxide)]'}`}>
                          {paymentStatus}
                        </div>
                      </div>

                      {invoice && (
                        <div className="space-y-4 mb-8 pb-8 border-b border-[var(--pigment-ochre)]/10">
                          <div className="flex justify-between font-mono text-[10px] uppercase tracking-widest">
                            <span className="opacity-40">Manifest Total</span>
                            <span>R{formatPrice(Number(invoice.total))}</span>
                          </div>
                          {invoice.creditApplied > 0 && (
                            <div className="flex justify-between font-mono text-[10px] uppercase tracking-widest text-[var(--pigment-green)]">
                              <span className="opacity-40">Soil Credits</span>
                              <span>-R{formatPrice(Number(invoice.creditApplied))}</span>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex justify-between items-baseline mb-8">
                        <span className="font-mono text-[10px] uppercase tracking-[0.2em] opacity-40">Settlement</span>
                        <span className="text-3xl font-black text-[var(--pigment-oxide)]">
                          R{invoice ? formatPrice(Number(invoice.total) - Number(invoice.creditApplied)) : formatPrice(orderTotal)}
                        </span>
                      </div>

                      {paymentStatus !== 'paid' && invoice && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/payment/${invoice.id}`);
                          }}
                          className="w-full bg-[var(--pigment-oxide)] text-[var(--canvas)] py-4 font-bold uppercase tracking-[2px] hover:scale-[1.02] transition-all shadow-lg flex items-center justify-between px-6"
                        >
                          <span>Settle Account</span>
                          <CreditCard size={18} />
                        </button>
                      )}
                    </div>

                    {/* Logistics */}
                    <div className="space-y-4 text-[var(--ink)] opacity-60">
                      <div className="flex gap-4 items-start">
                        <Truck size={14} className="mt-1" />
                        <div className="flex flex-col">
                          <span className="font-mono text-[9px] uppercase tracking-widest font-bold">Logistics Node</span>
                          <span className="font-bold uppercase text-[10px]">{order.deliveryMethod} — {order.deliveryAddress || 'COLLECTION POINT'}</span>
                        </div>
                      </div>
                      {order.specialInstructions && (
                        <div className="flex gap-4 items-start">
                          <Info size={14} className="mt-1" />
                          <div className="flex flex-col">
                            <span className="font-mono text-[9px] uppercase tracking-widest font-bold">Special Directives</span>
                            <span className="font-mono text-[10px] uppercase">{order.specialInstructions}</span>
                          </div>
                        </div>
                      )}
                      <div className="flex gap-4 items-start">
                        <Calendar size={14} className="mt-1" />
                        <div className="flex flex-col">
                          <span className="font-mono text-[9px] uppercase tracking-widest font-bold">Entry Timestamp</span>
                          <span className="font-mono text-[10px] uppercase">{new Date(order.createdAt).toLocaleString('en-ZA')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}


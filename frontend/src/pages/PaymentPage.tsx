import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useDownloadInvoicePDF } from '../hooks/useInvoicePDF.js';
import { formatPrice } from '../lib/utils.js';
import { CreditCard, Landmark, Banknote as CashIcon, ChevronLeft, Download, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import api from '../lib/api.js';

declare global {
  interface Window {
    YocoSDK: any;
  }
}

const paymentMethods = [
  { id: 'yoco', name: 'SECURE CARD PAYMENT (YOCO)', icon: CreditCard },
  { id: 'eft', name: 'EFT / BANK TRANSFER', icon: Landmark },
  { id: 'cash', name: 'CASH ON DELIVERY', icon: CashIcon },
];

interface InvoiceItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  total: number;
  subtotal: number;
  deliveryFee: number;
  creditApplied: number;
  status: string;
  dueDate: string;
  items: InvoiceItem[];
}

export default function PaymentPage() {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const downloadInvoicePDF = useDownloadInvoicePDF();

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const isCompletionPage = window.location.pathname.includes('/complete');
  const checkoutId = searchParams.get('checkoutId');
  const paymentStatus = searchParams.get('status');

  useEffect(() => {
    const fetchInvoice = async () => {
      if (!invoiceId) {
        setError('Invoice ID is required');
        setLoading(false);
        return;
      }

      try {
        const response = await api.get(`/invoices/${invoiceId}`);
        if (response.data) {
          setInvoice({
            ...response.data,
            items: response.data.items || [],
          });
        }
      } catch (err: any) {
        console.error('Error fetching invoice:', err);
        setError('Failed to load invoice. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [invoiceId]);

  useEffect(() => {
    if (isCompletionPage && checkoutId) {
      verifyPayment(checkoutId);
    }
  }, [isCompletionPage, checkoutId]);

  interface Payment {
    id: string;
    invoiceId: string;
    customerId: string;
    amount: number;
    method: 'cash' | 'yoco' | 'eft';
    status: string;
    paymentDate: string;
    createdAt: string;
    updatedAt: string;
  }

  const verifyPayment = async (_checkoutId: string) => {
    setIsProcessing(true);
    try {
      // Verify payment by checking if invoice has been paid
      const response = await api.get(`/payments/invoice/${invoiceId}`);
      const payments = response.data as Payment[] || [];
      
      // Check if there's at least one successful payment
      const hasSuccessfulPayment = payments.some(payment => 
        payment.status === 'completed' || payment.status === 'succeeded'
      );
      
      if (hasSuccessfulPayment) {
        navigate(`/orders?payment=success&invoiceId=${invoiceId}`);
      } else {
        navigate(`/orders?payment=failed&invoiceId=${invoiceId}`);
      }
    } catch (err: any) {
      console.error('Payment verification failed:', err);
      navigate(`/orders?payment=failed&invoiceId=${invoiceId}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePayment = async () => {
    if (!selectedMethod || !invoice) {
      return;
    }

    setIsProcessing(true);

    try {
      if (selectedMethod === 'yoco') {
        const response = await api.post('/payments/checkout', {
          invoiceId: invoice.id,
        });

        if (response.data.success && response.data.redirectUrl) {
          window.location.href = response.data.redirectUrl;
        } else {
          throw new Error(response.data.error?.message || 'Failed to create checkout');
        }
      } else if (selectedMethod === 'eft') {
        alert('Banking details will be sent to your email.');
        navigate('/orders?success=true');
      } else {
        alert('Your order will be delivered. Please have cash ready.');
        navigate('/orders?success=true');
      }
    } catch (err: any) {
      console.error('Payment error:', err);
      alert(err.message || 'Payment failed. Please try again.');
      setIsProcessing(false);
    }
  };

  const handleDownloadInvoice = () => {
    if (invoiceId) {
      downloadInvoicePDF.mutate({
        invoiceId,
        filename: `invoice-${invoice?.invoiceNumber || invoiceId}.pdf`,
      });
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-8">
        <div className="w-16 h-16 border-4 border-[var(--pigment-green)]/10 border-t-[var(--pigment-green)] rounded-full animate-spin" />
        <p className="font-mono text-xs uppercase tracking-[0.3em] opacity-40">Initializing secure channel...</p>
      </div>
    );
  }

  if (error && !invoice) {
    return (
      <div className="max-w-4xl mx-auto py-20 px-8">
        <div className="bg-[var(--pigment-oxide)]/10 border border-[var(--pigment-oxide)]/20 p-12 text-center text-[var(--pigment-oxide)]">
          <AlertCircle size={48} className="mx-auto mb-6" />
          <h2 className="text-2xl font-black uppercase tracking-tighter mb-4">Channel Fault</h2>
          <p className="font-mono text-sm opacity-60 uppercase tracking-widest mb-8">{error}</p>
          <button onClick={() => navigate(-1)} className="font-mono text-[10px] uppercase tracking-widest border border-[var(--pigment-oxide)]/20 px-8 py-4 hover:bg-[var(--pigment-oxide)] hover:text-[var(--canvas)] transition-all">
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!invoice) return null;

  if (isCompletionPage) {
    return (
      <div className="max-w-[800px] mx-auto px-8 py-40">
        <div className="bg-white/30 border border-[var(--pigment-ochre)]/10 p-16 text-center backdrop-blur-sm relative overflow-hidden">
          {isProcessing ? (
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 border-4 border-[var(--pigment-green)]/10 border-t-[var(--pigment-green)] rounded-full animate-spin mb-8" />
              <h2 className="text-4xl font-black uppercase tracking-tighter text-[var(--pigment-green)] mb-4">Verifying Transfer</h2>
              <p className="font-mono text-xs opacity-40 uppercase tracking-[0.3em]">Synching ledger data, please hold...</p>
            </div>
          ) : paymentStatus === 'completed' ? (
            <div className="animate-[fadeIn_0.5s_ease-out]">
              <div className="w-20 h-20 bg-[var(--pigment-green)]/10 text-[var(--pigment-green)] rounded-full flex items-center justify-center mx-auto mb-10 border border-[var(--pigment-green)]/20">
                <CheckCircle2 size={40} />
              </div>
              <h2 className="text-4xl font-black uppercase tracking-tighter text-[var(--pigment-green)] mb-6">Settlement Confirmed</h2>
              <p className="font-mono text-xs opacity-40 uppercase tracking-widest mb-12 max-w-sm mx-auto leading-relaxed">
                Your account has been reconciled. The harvest manifest is now in production.
              </p>
              <button
                onClick={() => navigate('/orders')}
                className="bg-[var(--pigment-green)] text-[var(--canvas)] px-12 py-5 font-bold uppercase tracking-widest hover:scale-105 transition-all shadow-xl"
              >
                Return to History
              </button>
            </div>
          ) : (
            <div className="animate-[fadeIn_0.5s_ease-out]">
              <div className="w-20 h-20 bg-[var(--pigment-oxide)]/10 text-[var(--pigment-oxide)] rounded-full flex items-center justify-center mx-auto mb-10 border border-[var(--pigment-oxide)]/20">
                <XCircle size={40} />
              </div>
              <h2 className="text-4xl font-black uppercase tracking-tighter text-[var(--pigment-oxide)] mb-6">Transfer Rejected</h2>
              <p className="font-mono text-xs opacity-40 uppercase tracking-widest mb-12 max-w-sm mx-auto leading-relaxed">
                The secure channel reported an encryption or balance fault. Please attempt a new handshake.
              </p>
              <button
                onClick={() => navigate(`/payment/${invoiceId}`)}
                className="bg-[var(--pigment-oxide)] text-[var(--canvas)] px-12 py-5 font-bold uppercase tracking-widest hover:scale-105 transition-all shadow-xl"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto px-8 py-20 pb-40">
      {/* Header */}
      <div className="mb-20 flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 font-mono text-[10px] uppercase font-bold tracking-[0.2em] opacity-40 hover:opacity-100 transition-opacity mb-8"
          >
            <ChevronLeft size={14} /> Back to dashboard
          </button>
          <p className="font-mono text-[10px] uppercase font-bold tracking-[0.4em] text-[var(--pigment-ochre)] mb-4">
            Fiscal Reconcilliation
          </p>
          <h1 className="text-6xl font-[900] uppercase tracking-tighter text-[var(--pigment-green)]">
            Account Settlement
          </h1>
        </div>
        <div className="text-right">
          <span className="font-mono text-[10px] opacity-40 uppercase block mb-1">Ledger Ref</span>
          <span className="text-xl font-black uppercase tracking-tighter italic">{invoice.invoiceNumber}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
        {/* Payment Methods */}
        <div className="lg:col-span-12 xl:col-span-7 space-y-12">
          <div className="space-y-6">
            <div className="flex items-center gap-3 opacity-40 font-mono text-[10px] uppercase tracking-[0.4em] px-2 mb-8">
              <Landmark size={14} />
              <span>Select Distribution Channel</span>
            </div>

            <div className="grid gap-4">
              {paymentMethods.map((method) => {
                const Icon = method.icon;
                return (
                  <button
                    key={method.id}
                    onClick={() => setSelectedMethod(method.id)}
                    className={`group p-8 border-2 text-left transition-all duration-500 relative flex items-center gap-6 overflow-hidden ${selectedMethod === method.id
                      ? 'border-[var(--pigment-green)] bg-[var(--pigment-green)]/5'
                      : 'border-[var(--pigment-ochre)]/10 bg-white/20 hover:border-[var(--pigment-green)]/30'
                      }`}
                  >
                    <div className={`w-12 h-12 flex items-center justify-center rounded-full transition-all ${selectedMethod === method.id ? 'bg-[var(--pigment-green)] text-[var(--canvas)]' : 'bg-[var(--canvas)] text-[var(--ink)] opacity-40 group-hover:opacity-100'}`}>
                      <Icon size={24} />
                    </div>
                    <div className="flex-1">
                      <span className={`font-black text-sm tracking-[0.2em] transition-colors ${selectedMethod === method.id ? 'text-[var(--pigment-green)]' : 'opacity-60'}`}>
                        {method.name}
                      </span>
                    </div>
                    {selectedMethod === method.id && (
                      <div className="absolute right-8 text-[var(--pigment-green)]">
                        <CheckCircle2 size={24} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dynamic Method Info */}
          {selectedMethod === 'eft' && (
            <div className="bg-[var(--pigment-green)] text-[var(--canvas)] p-10 animate-[fadeIn_0.3s_ease-out] shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 -mr-16 -mt-16 rounded-full" />
              <h3 className="font-black uppercase tracking-tighter text-xl mb-8 flex items-center gap-3">
                <Landmark size={20} /> Bank Access Record
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 opacity-80">
                <div className="space-y-1">
                  <span className="font-mono text-[8px] uppercase tracking-widest opacity-60">Instution</span>
                  <span className="font-bold text-sm tracking-widest block">FIRST NATIONAL BANK (FNB)</span>
                </div>
                <div className="space-y-1">
                  <span className="font-mono text-[8px] uppercase tracking-widest opacity-60">Ledger Index</span>
                  <span className="font-mono text-sm tracking-widest block underline underline-offset-4">1234567890</span>
                </div>
                <div className="space-y-1">
                  <span className="font-mono text-[8px] uppercase tracking-widest opacity-60">Branch Code</span>
                  <span className="font-mono text-sm tracking-widest block">250655</span>
                </div>
                <div className="space-y-1">
                  <span className="font-mono text-[8px] uppercase tracking-widest opacity-60">Sync Reference</span>
                  <span className="font-black text-sm tracking-[0.2em] block italic">{invoice.invoiceNumber}</span>
                </div>
              </div>
              <p className="mt-10 font-mono text-[8px] uppercase tracking-widest opacity-40 leading-relaxed italic">
                * Proof of harvest settlement is required for logistics release.
              </p>
            </div>
          )}

          {selectedMethod === 'cash' && (
            <div className="bg-[var(--pigment-ochre)] p-10 animate-[fadeIn_0.3s_ease-out] text-[var(--canvas)] shadow-xl">
              <h3 className="font-black uppercase tracking-tighter text-xl mb-6 flex items-center gap-3">
                <CashIcon size={20} /> Physical Exchange
              </h3>
              <p className="font-mono text-[10px] uppercase tracking-widest leading-relaxed opacity-90 max-w-sm">
                Settlement will be verified at the point of fulfillment. Please ensure the exact reserve is prepared.
              </p>
            </div>
          )}
        </div>

        {/* Invoice Summary Receipt */}
        <div className="lg:col-span-12 xl:col-span-5">
          <div className="bg-white p-10 border border-[var(--pigment-ochre)]/20 shadow-2xl relative">
            {/* Decorative Receipt Cut Effect */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-[var(--pigment-ochre)]/10" style={{ clipPath: 'polygon(0% 0%, 5% 100%, 10% 0%, 15% 100%, 20% 0%, 25% 100%, 30% 0%, 35% 100%, 40% 0%, 45% 100%, 50% 0%, 55% 100%, 60% 0%, 65% 100%, 70% 0%, 75% 100%, 80% 0%, 85% 100%, 90% 0%, 95% 100%, 100% 0%)' }} />

            <div className="flex justify-between items-start mb-12">
              <div className="space-y-1">
                <h3 className="font-black uppercase tracking-tighter text-2xl text-[var(--pigment-green)]">Manifest</h3>
                <p className="font-mono text-[10px] opacity-40 uppercase tracking-widest">Dated: {new Date(invoice.dueDate).toLocaleDateString('en-ZA')}</p>
              </div>
              <div className={`px-2 py-1 font-mono text-[10px] uppercase tracking-widest border ${invoice.status === 'paid' ? 'bg-[var(--pigment-green)] text-[var(--canvas)] border-[var(--pigment-green)]' : 'bg-white text-[var(--pigment-oxide)] border-[var(--pigment-oxide)]'}`}>
                {invoice.status}
              </div>
            </div>

            {/* Items List */}
            <div className="space-y-6 mb-12 border-b border-[var(--pigment-ochre)]/10 pb-12">
              {invoice.items.map((item) => (
                <div key={item.id} className="flex justify-between items-start font-mono text-xs">
                  <div className="flex flex-col">
                    <span className="font-bold uppercase text-[10px] text-[var(--ink)] opacity-90">{item.name}</span>
                    <span className="opacity-40 uppercase tracking-tighter">Qty: {item.quantity} units</span>
                  </div>
                  <span className="font-bold">R{formatPrice(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>

            {/* Price Breakdown */}
            <div className="space-y-4 mb-12">
              <div className="flex justify-between font-mono text-[10px] uppercase tracking-widest opacity-60">
                <span>Subtotal</span>
                <span>R{formatPrice(invoice.subtotal)}</span>
              </div>
              <div className="flex justify-between font-mono text-[10px] uppercase tracking-widest opacity-60">
                <span>Logistics release</span>
                <span>R{formatPrice(invoice.deliveryFee)}</span>
              </div>
              {invoice.creditApplied > 0 && (
                <div className="flex justify-between font-mono text-[10px] uppercase tracking-widest text-[var(--pigment-green)]">
                  <span>Soil Credits Applied</span>
                  <span>-R{formatPrice(invoice.creditApplied)}</span>
                </div>
              )}
            </div>

            <div className="flex justify-between items-baseline mb-12 pt-8 border-t-2 border-[var(--pigment-ochre)]/10 dashed">
              <span className="font-black uppercase text-xl text-[var(--pigment-green)]">Total due</span>
              <span className="text-4xl font-black text-[var(--pigment-oxide)] italic">R{formatPrice(invoice.total)}</span>
            </div>

            <div className="space-y-4">
              <button
                onClick={handlePayment}
                disabled={!selectedMethod || isProcessing}
                className={`w-full py-5 font-bold uppercase tracking-[0.2em] transition-all relative overflow-hidden ${!selectedMethod || isProcessing
                  ? 'bg-[var(--ink)] opacity-10 cursor-not-allowed text-[var(--canvas)]'
                  : 'bg-[var(--pigment-green)] text-[var(--canvas)] hover:scale-[1.02] shadow-xl group'
                  }`}
              >
                <span className="relative z-10 flex items-center justify-center gap-3">
                  {isProcessing ? 'SYNCHRONIZING...' : `COMMIT SETTLEMENT`}
                  {!isProcessing && <Landmark size={18} className="group-hover:rotate-12 transition-transform" />}
                </span>
              </button>

              <button
                onClick={handleDownloadInvoice}
                disabled={downloadInvoicePDF.isPending}
                className="w-full flex items-center justify-center gap-3 py-4 font-mono text-[10px] uppercase tracking-widest opacity-40 hover:opacity-100 transition-all border border-transparent hover:border-[var(--pigment-ochre)]/20"
              >
                <Download size={14} /> Download Ledger Copy
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


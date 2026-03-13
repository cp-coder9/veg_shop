import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useDownloadInvoicePDF } from '../hooks/useInvoicePDF';
import { formatPrice } from '../lib/utils';
import { Button, Card, CardHeader, Badge, BackIcon } from '../components/ui';
import api from '../lib/api';

// Add Yoco to window namespace
declare global {
  interface Window {
    YocoSDK: any;
  }
}

// Payment methods
const paymentMethods = [
  { id: 'yoco', name: 'Card Payment (Yoco)', icon: '💳' },
  { id: 'eft', name: 'EFT / Bank Transfer', icon: '🏦' },
  { id: 'cash', name: 'Cash on Delivery', icon: '💵' },
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

  // Check if this is a payment completion page
  const isCompletionPage = window.location.pathname.includes('/complete');
  const checkoutId = searchParams.get('checkoutId');
  const paymentStatus = searchParams.get('status');

  // Load invoice data
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
        // For demo purposes, use mock data if API fails
        setInvoice({
          id: invoiceId,
          invoiceNumber: `INV-${invoiceId.slice(0, 8).toUpperCase()}`,
          total: 450.00,
          subtotal: 400.00,
          deliveryFee: 50.00,
          creditApplied: 0,
          status: 'pending',
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          items: [
            { id: '1', name: 'Tomatoes', quantity: 2, price: 50.00 },
            { id: '2', name: 'Spinach', quantity: 1, price: 35.00 },
            { id: '3', name: 'Carrots', quantity: 3, price: 25.00 },
          ],
        });
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [invoiceId]);

  // Handle payment completion
  useEffect(() => {
    if (isCompletionPage && checkoutId) {
      verifyPayment(checkoutId);
    }
  }, [isCompletionPage, checkoutId]);

  const verifyPayment = async (_checkoutId: string) => {
    setIsProcessing(true);
    try {
      // In a real implementation, we'd verify the payment with the backend
      // For now, simulate success
      await new Promise(resolve => setTimeout(resolve, 1500));
      navigate(`/orders?payment=success&invoiceId=${invoiceId}`);
    } catch (err) {
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
        // Create a Yoco checkout session via the backend
        const response = await api.post('/payments/checkout', {
          invoiceId: invoice.id,
        });

        if (response.data.success && response.data.redirectUrl) {
          // Redirect to Yoco's hosted checkout page
          window.location.href = response.data.redirectUrl;
        } else {
          throw new Error(response.data.error?.message || 'Failed to create checkout');
        }
      } else if (selectedMethod === 'eft') {
        // Show banking details - in real app would record pending payment
        alert('Banking details will be sent to your email.');
        navigate('/orders?success=true');
      } else {
        // Cash on delivery - in real app would record pending payment
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
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-terracotta mx-auto"></div>
          <p className="mt-4 text-warm-gray">Loading invoice...</p>
        </div>
      </div>
    );
  }

  if (error && !invoice) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <div className="text-center py-8">
            <div className="text-red-500 text-4xl mb-4">⚠️</div>
            <h2 className="font-display text-xl text-primary-dark mb-2">Error</h2>
            <p className="text-warm-gray">{error}</p>
            <Button
              variant="secondary"
              className="mt-4"
              onClick={() => navigate(-1)}
            >
              Go Back
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (!invoice) {
    return null;
  }

  // Show payment completion status
  if (isCompletionPage) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <div className="text-center py-8">
            {isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-terracotta mx-auto"></div>
                <h2 className="font-display text-xl text-primary-dark mt-4">Verifying Payment...</h2>
                <p className="text-warm-gray">Please wait while we verify your payment.</p>
              </>
            ) : paymentStatus === 'completed' ? (
              <>
                <div className="text-green-500 text-4xl mb-4">✓</div>
                <h2 className="font-display text-xl text-primary-dark mb-2">Payment Successful!</h2>
                <p className="text-warm-gray">Your payment has been processed successfully.</p>
                <Button
                  className="mt-4"
                  onClick={() => navigate('/orders')}
                >
                  View Orders
                </Button>
              </>
            ) : (
              <>
                <div className="text-red-500 text-4xl mb-4">✗</div>
                <h2 className="font-display text-xl text-primary-dark mb-2">Payment Failed</h2>
                <p className="text-warm-gray">There was an issue processing your payment.</p>
                <Button
                  variant="secondary"
                  className="mt-4"
                  onClick={() => navigate(`/payment/${invoiceId}`)}
                >
                  Try Again
                </Button>
              </>
            )}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate(-1)} 
          className="p-2 hover:bg-cream rounded-full transition-colors"
        >
          <BackIcon className="w-5 h-5 text-primary-dark" />
        </button>
        <div className="text-center flex-1">
          <h1 className="font-display text-display-md text-primary-dark">Make Payment</h1>
          <p className="font-body text-body-md text-warm-gray mt-1">
            Complete your payment for invoice #{invoice.invoiceNumber}
          </p>
        </div>
      </div>

      {/* Invoice Summary */}
      <Card>
        <CardHeader
          title="Invoice Summary"
          subtitle={`Due: ${new Date(invoice.dueDate).toLocaleDateString('en-ZA')}`}
          action={
            <Badge variant={invoice.status === 'paid' ? 'success' : 'warning'}>
              {invoice.status === 'paid' ? 'Paid' : 'Pending'}
            </Badge>
          }
        />

        {/* Items */}
        <div className="space-y-2 mb-4">
          {invoice.items.map((item) => (
            <div key={item.id} className="flex justify-between font-body text-body-sm">
              <span className="text-warm-gray">
                {item.name} x {item.quantity}
              </span>
              <span className="text-primary-dark">R{formatPrice(item.price * item.quantity)}</span>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="border-t border-light-gray pt-4 space-y-2">
          <div className="flex justify-between font-body text-body-sm">
            <span className="text-warm-gray">Subtotal</span>
            <span className="text-primary-dark">R{formatPrice(invoice.subtotal)}</span>
          </div>
          <div className="flex justify-between font-body text-body-sm">
            <span className="text-warm-gray">Delivery</span>
            <span className="text-primary-dark">R{formatPrice(invoice.deliveryFee)}</span>
          </div>
          {invoice.creditApplied > 0 && (
            <div className="flex justify-between font-body text-body-sm">
              <span className="text-sage-green">Credit Applied</span>
              <span className="text-sage-green">-R{formatPrice(invoice.creditApplied)}</span>
            </div>
          )}
          <div className="flex justify-between font-display text-body-lg pt-2 border-t border-light-gray">
            <span className="text-primary-dark">Total</span>
            <span className="text-terracotta font-bold">R{formatPrice(invoice.total)}</span>
          </div>
        </div>

        {/* Download Invoice Button */}
        <div className="mt-4 pt-4 border-t border-light-gray">
          <Button
            variant="secondary"
            className="w-full"
            onClick={handleDownloadInvoice}
            disabled={downloadInvoicePDF.isPending}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download Invoice PDF
          </Button>
        </div>
      </Card>

      {/* Payment Methods */}
      <Card>
        <CardHeader
          title="Select Payment Method"
          subtitle="Choose how you'd like to pay"
        />

        <div className="space-y-3">
          {paymentMethods.map((method) => (
            <button
              key={method.id}
              onClick={() => setSelectedMethod(method.id)}
              className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                selectedMethod === method.id
                  ? 'border-terracotta bg-terracotta/5'
                  : 'border-light-gray hover:border-warm-gray'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{method.icon}</span>
                <div>
                  <p className="font-body text-body-md font-medium text-primary-dark">
                    {method.name}
                  </p>
                </div>
                {selectedMethod === method.id && (
                  <svg className="w-5 h-5 text-terracotta ml-auto" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* EFT Banking Details */}
        {selectedMethod === 'eft' && (
          <div className="mt-4 p-4 bg-cream rounded-lg">
            <p className="font-accent text-caption text-warm-gray uppercase tracking-wider mb-2">
              Banking Details
            </p>
            <div className="font-body text-body-sm text-primary-dark space-y-1">
              <p><span className="text-warm-gray">Bank:</span> FNB</p>
              <p><span className="text-warm-gray">Account Name:</span> Our Harvest Tote</p>
              <p><span className="text-warm-gray">Account Number:</span> 1234567890</p>
              <p><span className="text-warm-gray">Branch Code:</span> 250655</p>
              <p><span className="text-warm-gray">Reference:</span> {invoice.invoiceNumber}</p>
            </div>
          </div>
        )}
      </Card>

      {/* Pay Button */}
      <Button
        size="lg"
        className="w-full"
        onClick={handlePayment}
        disabled={!selectedMethod || isProcessing}
        isLoading={isProcessing}
      >
        {isProcessing ? 'Processing...' : `Pay R${formatPrice(invoice.total)}`}
      </Button>

      {/* Cancel */}
      <div className="text-center">
        <button
          onClick={() => navigate(-1)}
          className="font-body text-body-sm text-warm-gray hover:text-primary-dark transition-colors"
        >
          Cancel and return
        </button>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDownloadInvoicePDF } from '../hooks/useInvoicePDF';
import { formatPrice } from '../lib/utils';
import { Button, Input, Card, CardHeader, Badge } from '../components/ui';

// Payment methods
const paymentMethods = [
  { id: 'yoco', name: 'Card Payment (Yoco)', icon: '💳' },
  { id: 'eft', name: 'EFT / Bank Transfer', icon: '🏦' },
  { id: 'cash', name: 'Cash on Delivery', icon: '💵' },
];

export default function PaymentPage() {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const navigate = useNavigate();
  const downloadInvoicePDF = useDownloadInvoicePDF();

  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Mock invoice data - in real app, this would come from an API
  const invoice = {
    id: invoiceId || 'demo-invoice',
    invoiceNumber: `INV-${invoiceId?.slice(0, 8).toUpperCase() || 'DEMO'}`,
    total: 450.00,
    subtotal: 400.00,
    deliveryFee: 50.00,
    creditApplied: 0,
    status: 'pending',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    items: [
      { name: 'Tomatoes', quantity: 2, price: 50.00 },
      { name: 'Spinach', quantity: 1, price: 35.00 },
      { name: 'Carrots', quantity: 3, price: 25.00 },
    ],
  };

  const handlePayment = async () => {
    if (!selectedMethod) {
      return;
    }

    setIsProcessing(true);

    // Simulate payment processing
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // In real app, this would call the payment API
    if (selectedMethod === 'yoco') {
      // Redirect to Yoco payment gateway
      alert('Redirecting to Yoco payment gateway...');
    } else if (selectedMethod === 'eft') {
      // Show banking details
      alert('Banking details will be sent to your email.');
    } else {
      // Cash on delivery
      alert('Your order will be delivered. Please have cash ready.');
    }

    setIsProcessing(false);
    navigate('/orders');
  };

  const handleDownloadInvoice = () => {
    if (invoiceId) {
      downloadInvoicePDF.mutate({
        invoiceId,
        filename: `invoice-${invoice.invoiceNumber}.pdf`,
      });
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="font-display text-display-md text-primary-dark">Make Payment</h1>
        <p className="font-body text-body-md text-warm-gray mt-1">
          Complete your payment for invoice #{invoice.invoiceNumber}
        </p>
      </div>

      {/* Invoice Summary */}
      <Card>
        <CardHeader
          title="Invoice Summary"
          subtitle={`Due: ${new Date(invoice.dueDate).toLocaleDateString('en-ZA')}`}
          action={
            <Badge variant="warning">Pending</Badge>
          }
        />

        {/* Items */}
        <div className="space-y-2 mb-4">
          {invoice.items.map((item, index) => (
            <div key={index} className="flex justify-between font-body text-body-sm">
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

import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useCustomerOrders } from '../hooks/useOrders';
import { useCustomerInvoices } from '../hooks/useCustomer';
import { formatPrice } from '../lib/utils';
import { Card, Badge, Button } from '../components/ui';
import { PaymentStatusBadge, type PaymentStatus } from '../components/payments/PaymentStatusBadge';

// Status badge variant mapping
const statusVariants: Record<string, 'success' | 'warning' | 'info' | 'error'> = {
  pending: 'warning',
  confirmed: 'info',
  processing: 'info',
  delivered: 'success',
  cancelled: 'error',
};

// Status display names
const statusNames: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  processing: 'Processing',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export default function OrdersPage() {
  const { data: orders, isLoading, isError } = useCustomerOrders();
  const { data: invoices } = useCustomerInvoices();
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Create a map of orderId -> invoice for quick lookup
  const invoiceMap = useMemo(() => {
    const map = new Map<string, any>();
    if (invoices) {
      invoices.forEach((inv: any) => {
        map.set(inv.orderId, inv);
      });
    }
    return map;
  }, [invoices]);

  // Check for success message from order placement
  const orderSuccess = searchParams.get('success');

  const toggleOrder = (orderId: string) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="loading-spinner h-12 w-12 mx-auto animate-spin rounded-full border-4 border-light-gray border-t-terracotta"></div>
          <p className="mt-4 font-body text-body-md text-warm-gray">Loading orders...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-red-50 text-error px-4 py-3 rounded-lg border border-error/20 font-body">
        Failed to load orders. Please try again later.
      </div>
    );
  }

  // Empty state
  if (!orders || orders.length === 0) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="text-center py-12">
          <svg className="w-20 h-20 mx-auto text-warm-gray mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h2 className="font-display text-display-sm text-primary-dark mb-2">No Orders Yet</h2>
          <p className="font-body text-body-md text-warm-gray mb-6">
            You haven't placed any orders yet. Start shopping to see your orders here.
          </p>
          <a href="/products">
            <Button>Start Shopping</Button>
          </a>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-display-md text-primary-dark">Order History</h1>
        <p className="font-body text-body-md text-warm-gray mt-1">
          View and track your past orders
        </p>
      </div>

      {/* Success Message */}
      {orderSuccess && (
        <div className="bg-success/10 text-success px-4 py-3 rounded-lg border border-success/20 font-body">
          Your order has been placed successfully!
        </div>
      )}

      {/* Orders List */}
      <div className="space-y-4">
        {orders.map((order) => {
          const isExpanded = expandedOrder === order.id;
          const orderTotal = order.items.reduce(
            (sum, item) => sum + Number(item.priceAtOrder) * item.quantity,
            0
          );
          
          // Get invoice for this order
          const invoice = invoiceMap.get(order.id);
          const paymentStatus = invoice?.status || 'unpaid';

          return (
            <Card
              key={order.id}
              padding="none"
              className="overflow-hidden cursor-pointer"
              onClick={() => toggleOrder(order.id)}
            >
              {/* Order Header */}
              <div className="p-4 flex items-center justify-between hover:bg-cream/50 transition-colors">
                <div className="space-y-1">
                  <p className="font-display text-body-lg text-primary-dark">
                    Order #{order.id.slice(0, 8)}
                  </p>
                  <p className="font-accent text-caption text-warm-gray">
                    {new Date(order.deliveryDate).toLocaleDateString('en-ZA', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'short',
                    })}
                    {' • '}
                    {order.items.length} items
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-body text-body-md font-bold text-primary-dark">
                      R{formatPrice(orderTotal)}
                    </p>
                    <div className="flex items-center gap-2 justify-end">
                      <PaymentStatusBadge status={paymentStatus as PaymentStatus} size="sm" showIcon />
                      <Badge variant={statusVariants[order.status] || 'info'}>
                        {statusNames[order.status] || order.status}
                      </Badge>
                    </div>
                  </div>
                  <svg
                    className={`w-5 h-5 text-warm-gray transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {/* Expanded Order Details */}
              {isExpanded && (
                <div className="border-t border-light-gray p-4 bg-cream/30">
                  <h3 className="font-display text-body-lg text-primary-dark mb-4">Order Details</h3>

                  {/* Payment Info */}
                  {invoice && (
                    <div className="mb-4 p-3 bg-white rounded-lg border border-light-gray">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-accent text-caption text-warm-gray uppercase tracking-wider">Payment</span>
                        <PaymentStatusBadge status={paymentStatus as PaymentStatus} />
                      </div>
                      <div className="flex justify-between font-body text-body-sm mb-1">
                        <span className="text-warm-gray">Invoice Total</span>
                        <span className="text-primary-dark font-medium">R{formatPrice(Number(invoice.total))}</span>
                      </div>
                      {invoice.creditApplied > 0 && (
                        <div className="flex justify-between font-body text-body-sm mb-1">
                          <span className="text-warm-gray">Credit Applied</span>
                          <span className="text-sage-green">-R{formatPrice(Number(invoice.creditApplied))}</span>
                        </div>
                      )}
                      {paymentStatus !== 'paid' && (
                        <div className="mt-3 pt-3 border-t border-light-gray">
                          <div className="flex justify-between font-body text-body-sm mb-2">
                            <span className="text-warm-gray">Amount Due</span>
                            <span className="text-error font-bold">R{formatPrice(Number(invoice.total) - Number(invoice.creditApplied))}</span>
                          </div>
                          <Button 
                            size="sm" 
                            className="w-full"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/payment/${invoice.id}`);
                            }}
                          >
                            Pay Now
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Items */}
                  <div className="space-y-2 mb-4">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-cream rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5 text-warm-gray" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <div>
                            <p className="font-body text-body-md text-primary-dark">{item.product?.name || 'Unknown Product'}</p>
                            <p className="font-accent text-caption text-warm-gray">
                              {item.product?.unit || 'item'} x {item.quantity}
                            </p>
                          </div>
                        </div>
                        <p className="font-body text-body-md text-primary-dark">
                          R{formatPrice(Number(item.priceAtOrder) * item.quantity)}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Delivery Info */}
                  <div className="border-t border-light-gray pt-4 space-y-2">
                    <div className="flex justify-between font-body text-body-sm">
                      <span className="text-warm-gray">Delivery Method</span>
                      <span className="text-primary-dark capitalize">{order.deliveryMethod}</span>
                    </div>
                    {order.deliveryAddress && (
                      <div className="flex justify-between font-body text-body-sm">
                        <span className="text-warm-gray">Address</span>
                        <span className="text-primary-dark">{order.deliveryAddress}</span>
                      </div>
                    )}
                    {order.specialInstructions && (
                      <div className="flex justify-between font-body text-body-sm">
                        <span className="text-warm-gray">Instructions</span>
                        <span className="text-primary-dark">{order.specialInstructions}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-body text-body-sm">
                      <span className="text-warm-gray">Order Date</span>
                      <span className="text-primary-dark">
                        {new Date(order.createdAt).toLocaleDateString('en-ZA')}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

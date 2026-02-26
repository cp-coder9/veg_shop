import { useCustomerInvoices } from '../hooks/useCustomer';
import { formatPrice } from '../lib/utils';
import { Link } from 'react-router-dom';
import { Card, CardHeader, Badge, Button } from '../components/ui';

// Status badge variant mapping
const statusVariants: Record<string, 'success' | 'warning' | 'info' | 'error'> = {
  paid: 'success',
  pending: 'warning',
  overdue: 'error',
  partial: 'info',
};

export default function PaymentHistoryPage() {
  const { data: invoices, isLoading, isError } = useCustomerInvoices();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="loading-spinner h-12 w-12 mx-auto animate-spin rounded-full border-4 border-light-gray border-t-terracotta"></div>
          <p className="mt-4 font-body text-body-md text-warm-gray">Loading payment history...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-red-50 text-error px-4 py-3 rounded-lg border border-error/20 font-body">
        Failed to load payment history. Please try again later.
      </div>
    );
  }

  // Empty state
  if (!invoices || invoices.length === 0) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="text-center py-12">
          <svg className="w-20 h-20 mx-auto text-warm-gray mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <h2 className="font-display text-display-sm text-primary-dark mb-2">No Payment History</h2>
          <p className="font-body text-body-md text-warm-gray mb-6">
            Your payment history will appear here after your first order
          </p>
          <Link to="/products">
            <Button>Start Shopping</Button>
          </Link>
        </Card>
      </div>
    );
  }

  // Calculate totals
  const totalPaid = invoices
    .filter((inv: { status: string }) => inv.status === 'paid')
    .reduce((sum: number, inv: { total: number }) => sum + inv.total, 0);

  const totalPending = invoices
    .filter((inv: { status: string }) => inv.status === 'pending' || inv.status === 'partial')
    .reduce((sum: number, inv: { total: number }) => sum + inv.total, 0);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-display-md text-primary-dark">Payment History</h1>
        <p className="font-body text-body-md text-warm-gray mt-1">
          View your invoices and payment history
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-success/10 border-success/20">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-success/20 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="font-accent text-caption text-warm-gray uppercase tracking-wider">Total Paid</p>
              <p className="font-display text-body-lg font-bold text-success">R{formatPrice(totalPaid)}</p>
            </div>
          </div>
        </Card>

        <Card className="bg-warning/10 border-warning/20">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-warning/20 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="font-accent text-caption text-warm-gray uppercase tracking-wider">Outstanding</p>
              <p className="font-display text-body-lg font-bold text-warning">R{formatPrice(totalPending)}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Invoice List */}
      <Card padding="none">
        <CardHeader
          title="Invoices"
          subtitle={`${invoices.length} invoices total`}
        />
        <div className="divide-y divide-light-gray">
          {invoices.map((invoice: {
            id: string;
            createdAt: Date | string;
            dueDate: Date | string;
            total: number;
            creditApplied: number;
            status: string;
          }) => (
            <div key={invoice.id} className="p-4 flex items-center justify-between hover:bg-cream/50 transition-colors">
              <div className="space-y-1">
                <p className="font-body text-body-md font-bold text-primary-dark">
                  Invoice #{invoice.id.slice(0, 8)}
                </p>
                <p className="font-accent text-caption text-warm-gray">
                  {new Date(invoice.createdAt).toLocaleDateString('en-ZA')}
                  {' • '}
                  Due: {new Date(invoice.dueDate).toLocaleDateString('en-ZA')}
                </p>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="font-body text-body-md font-bold text-primary-dark">
                    R{formatPrice(invoice.total)}
                  </p>
                  {invoice.creditApplied > 0 && (
                    <p className="font-accent text-caption text-sage-green">
                      Credit: R{formatPrice(invoice.creditApplied)}
                    </p>
                  )}
                </div>
                <Badge variant={statusVariants[invoice.status] || 'info'}>
                  {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                </Badge>
                {invoice.status !== 'paid' && (
                  <Link to={`/payment/${invoice.id}`}>
                    <Button size="sm">Pay</Button>
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

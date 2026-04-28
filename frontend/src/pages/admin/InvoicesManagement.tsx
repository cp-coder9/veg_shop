import { useState } from 'react';
import {
  useAdminInvoices,
  useInvoice,
  useInvoicePayments,
  useDownloadInvoicePDF,
  useSendPaymentLink,
} from '../../hooks/useAdminInvoices.js';
import { toNumber } from '../../lib/utils.js';
import { toast } from 'react-hot-toast';
import { CreditCard, Banknote, Building } from 'lucide-react';

export default function InvoicesManagement() {
  const [statusFilter, setStatusFilter] = useState('');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [paymentLinkModal, setPaymentLinkModal] = useState<{ open: boolean; invoiceId: string | null }>({
    open: false,
    invoiceId: null,
  });

  const filters = {
    status: statusFilter || undefined,
    startDate: startDateFilter || undefined,
    endDate: endDateFilter || undefined,
  };

  const { data: invoices, isLoading } = useAdminInvoices(filters);
  const downloadPDF = useDownloadInvoicePDF();

  const handleDownloadPDF = async (invoiceId: string) => {
    await downloadPDF.mutateAsync(invoiceId);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Invoices Management</h1>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">All Statuses</option>
              <option value="unpaid">Unpaid</option>
              <option value="partial">Partial</option>
              <option value="paid">Paid</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={startDateFilter}
              onChange={(e) => setStartDateFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date
            </label>
            <input
              type="date"
              value={endDateFilter}
              onChange={(e) => setEndDateFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Invoices Table - Desktop */}
      <div className="hidden md:block bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Invoice ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Customer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Subtotal
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Credit Applied
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Payment
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Due Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {invoices?.map((invoice) => (
              <InvoiceRow
                key={invoice.id}
                invoice={invoice}
                onView={() => setSelectedInvoiceId(invoice.id)}
                onDownloadPDF={() => handleDownloadPDF(invoice.id)}
                onSendLink={() => setPaymentLinkModal({ open: true, invoiceId: invoice.id })}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Invoices List - Mobile Cards */}
      <div className="md:hidden space-y-4">
        {invoices?.map((invoice) => (
          <InvoiceCard
            key={invoice.id}
            invoice={invoice}
            onView={() => setSelectedInvoiceId(invoice.id)}
            onDownloadPDF={() => handleDownloadPDF(invoice.id)}
            onSendLink={() => setPaymentLinkModal({ open: true, invoiceId: invoice.id })}
          />
        ))}
      </div>

      {/* Invoice Detail Modal */}
      {selectedInvoiceId && (
        <InvoiceDetailModal
          invoiceId={selectedInvoiceId}
          onClose={() => setSelectedInvoiceId(null)}
        />
      )}

      {/* Payment Link Modal */}
      {paymentLinkModal.open && paymentLinkModal.invoiceId && (
        <PaymentLinkModal
          invoiceId={paymentLinkModal.invoiceId}
          onClose={() => setPaymentLinkModal({ open: false, invoiceId: null })}
        />
      )}
    </div>
  );
}

interface InvoiceRowProps {
  invoice: {
    id: string;
    customerId: string;
    customer?: { name: string };
    subtotal: number | string;
    creditApplied: number | string;
    total: number | string;
    status: string;
    dueDate: string;
    pdfUrl?: string | null;
  };
  onView: () => void;
  onDownloadPDF: () => void;
  onSendLink: () => void;
}

function InvoiceRow({ invoice, onView, onDownloadPDF, onSendLink }: InvoiceRowProps) {
  const { data: payments, isLoading } = useInvoicePayments(invoice.id);

  const getPaymentMethod = () => {
    if (isLoading || !payments || payments.length === 0) return null;
    const lastPayment = payments[0];
    return lastPayment.method;
  };

  const paymentMethod = getPaymentMethod();

  const getMethodIcon = () => {
    switch (paymentMethod) {
      case 'yoco': return <CreditCard size={16} className="text-purple-600" />;
      case 'cash': return <Banknote size={16} className="text-green-600" />;
      case 'eft': return <Building size={16} className="text-blue-600" />;
      default: return null;
    }
  };

  const getMethodLabel = () => {
    switch (paymentMethod) {
      case 'yoco': return 'Yoco';
      case 'cash': return 'Cash';
      case 'eft': return 'EFT';
      default: return '-';
    }
  };

  return (
    <tr>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
        {invoice.id.slice(0, 8)}...
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {invoice.customer?.name || invoice.customerId.slice(0, 8)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        R {toNumber(invoice.subtotal).toFixed(2)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
        {toNumber(invoice.creditApplied) > 0 ? `- R ${toNumber(invoice.creditApplied).toFixed(2)} ` : '-'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
        R {toNumber(invoice.total).toFixed(2)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span
          className={`px - 2 inline - flex text - xs leading - 5 font - semibold rounded - full ${invoice.status === 'paid'
            ? 'bg-green-100 text-green-800'
            : invoice.status === 'partial'
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-red-100 text-red-800'
            } `}
        >
          {invoice.status}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        {paymentMethod ? (
          <div className="flex items-center gap-1">
            {getMethodIcon()}
            <span className="text-sm text-gray-600">{getMethodLabel()}</span>
          </div>
        ) : (
          <span className="text-sm text-gray-400">-</span>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {new Date(invoice.dueDate).toLocaleDateString()}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
        <button
          onClick={onView}
          className="text-blue-600 hover:text-blue-900"
        >
          View
        </button>
        {invoice.pdfUrl && (
          <button
            onClick={onDownloadPDF}
            className="text-green-600 hover:text-green-900"
          >
            PDF
          </button>
        )}
        {invoice.status !== 'paid' && (
          <button
            onClick={onSendLink}
            className="text-indigo-600 hover:text-indigo-900"
          >
            Link
          </button>
        )}
      </td>
    </tr>
  );
}

function InvoiceCard({ invoice, onView, onDownloadPDF, onSendLink }: InvoiceRowProps) {
  const { data: payments, isLoading } = useInvoicePayments(invoice.id);

  const getPaymentMethod = () => {
    if (isLoading || !payments || payments.length === 0) return null;
    return payments[0].method;
  };

  const paymentMethod = getPaymentMethod();

  const getMethodBadge = () => {
    switch (paymentMethod) {
      case 'yoco': return <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded">💳 Yoco</span>;
      case 'cash': return <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">💵 Cash</span>;
      case 'eft': return <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">🏦 EFT</span>;
      default: return null;
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow space-y-3">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-sm font-bold text-gray-900">#{invoice.id.slice(0, 8)}...</h3>
          <p className="text-sm text-gray-600">{invoice.customer?.name || invoice.customerId.slice(0, 8)}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span
            className={`px - 2 py - 1 text - xs font - semibold rounded - full ${invoice.status === 'paid'
              ? 'bg-green-100 text-green-800'
              : invoice.status === 'partial'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-red-100 text-red-800'
              } `}
          >
            {invoice.status}
          </span>
          {getMethodBadge()}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <span className="text-gray-500">Total:</span>
          <span className="ml-1 font-semibold text-gray-900">R {toNumber(invoice.total).toFixed(2)}</span>
        </div>
        <div>
          <span className="text-gray-500">Due:</span>
          <span className="ml-1 text-gray-900">{new Date(invoice.dueDate).toLocaleDateString()}</span>
        </div>
      </div>

      <div className="pt-2 border-t border-gray-100 flex justify-end gap-3">
        <button
          onClick={onView}
          className="w-full sm:w-auto px-3 py-1 bg-blue-50 text-blue-600 rounded text-sm font-medium hover:bg-blue-100"
        >
          View Details
        </button>
        {invoice.pdfUrl && (
          <button
            onClick={onDownloadPDF}
            className="w-full sm:w-auto px-3 py-1 bg-green-50 text-green-600 rounded text-sm font-medium hover:bg-green-100"
          >
            PDF
          </button>
        )}
        {invoice.status !== 'paid' && (
          <button
            onClick={onSendLink}
            className="w-full sm:w-auto px-3 py-1 bg-indigo-50 text-indigo-600 rounded text-sm font-medium hover:bg-indigo-100"
          >
            Pay Link
          </button>
        )}
      </div>
    </div>
  );
}

function PaymentLinkModal({ invoiceId, onClose }: { invoiceId: string; onClose: () => void }) {
  const sendLimit = useSendPaymentLink();
  const [method, setMethod] = useState<'whatsapp' | 'email'>('whatsapp');

  const handleSend = async () => {
    try {
      await sendLimit.mutateAsync({ invoiceId, method });
      toast.success('Payment link sent!');
      onClose();
    } catch (error) {
      toast.error('Failed to send link');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Send Payment Link</h3>
        <p className="text-sm text-gray-600 mb-4">
          Choose how to send the payment link for this invoice.
        </p>

        <div className="space-y-3 mb-6">
          <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 target:border-green-500">
            <input
              type="radio"
              name="method"
              checked={method === 'whatsapp'}
              onChange={() => setMethod('whatsapp')}
              className="text-green-600 focus:ring-green-500"
            />
            <span className="text-gray-900 font-medium">WhatsApp</span>
          </label>

          <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 target:border-green-500">
            <input
              type="radio"
              name="method"
              checked={method === 'email'}
              onChange={() => setMethod('email')}
              className="text-green-600 focus:ring-green-500"
            />
            <span className="text-gray-900 font-medium">Email</span>
          </label>
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={sendLimit.isPending}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {sendLimit.isPending ? 'Sending...' : 'Send Link'}
          </button>
        </div>
      </div>
    </div>
  );
}

interface InvoiceDetailModalProps {
  invoiceId: string;
  onClose: () => void;
}

function InvoiceDetailModal({ invoiceId, onClose }: InvoiceDetailModalProps) {
  const { data: invoice, isLoading } = useInvoice(invoiceId);
  const { data: payments } = useInvoicePayments(invoiceId);
  const downloadPDF = useDownloadInvoicePDF();

  // Get the primary payment method
  const getPrimaryPaymentMethod = () => {
    if (!payments || payments.length === 0) return null;
    return payments[0].method;
  };

  const paymentMethod = getPrimaryPaymentMethod();

  const getMethodDetails = () => {
    switch (paymentMethod) {
      case 'yoco':
        return { icon: '💳', label: 'Yoco Card', color: 'bg-purple-50 border-purple-200' };
      case 'cash':
        return { icon: '💵', label: 'Cash', color: 'bg-green-50 border-green-200' };
      case 'eft':
        return { icon: '🏦', label: 'EFT Transfer', color: 'bg-blue-50 border-blue-200' };
      default:
        return { icon: '💰', label: 'No payment yet', color: 'bg-gray-50 border-gray-200' };
    }
  };

  const methodDetails = getMethodDetails();

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg p-6 w-full max-w-full mx-4 md:max-w-3xl">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      </div>
    );
  }

  if (!invoice) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-full mx-4 md:max-w-3xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Invoice Details</h2>

        <div className="space-y-4">
          {/* Invoice Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">Invoice Information</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-600">Invoice ID:</span>
                <span className="ml-2 text-gray-900">{invoice.id}</span>
              </div>
              <div>
                <span className="text-gray-600">Status:</span>
                <span className="ml-2 text-gray-900">{invoice.status}</span>
              </div>
              <div>
                <span className="text-gray-600">Created:</span>
                <span className="ml-2 text-gray-900">
                  {new Date(invoice.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Due Date:</span>
                <span className="ml-2 text-gray-900">
                  {new Date(invoice.dueDate).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          {paymentMethod && (
            <div className={`p-4 rounded-lg border ${methodDetails.color}`}>
              <h3 className="font-semibold text-gray-900 mb-2">Payment Method</h3>
              <div className="flex items-center gap-2">
                <span className="text-2xl">{methodDetails.icon}</span>
                <span className="font-medium text-gray-900">{methodDetails.label}</span>
                {paymentMethod === 'yoco' && invoice.status === 'paid' && (
                  <span className="ml-2 px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                    Verified
                  </span>
                )}
              </div>
              {payments && payments.length > 0 && (
                <div className="mt-2 text-sm text-gray-600">
                  {payments.length} payment(s) recorded
                </div>
              )}
            </div>
          )}

        {/* Order Items */}
        {invoice.order && (
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Order Items</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Product
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Quantity
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Price
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Subtotal
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {invoice.order.items.map((item: any) => {
                    const isDeducted = item.isDeducted;
                    const effectiveQuantity = isDeducted
                      ? Math.max(0, item.quantity - (item.deductedQuantity || 0))
                      : item.quantity;
                    const subtotal = toNumber(item.priceAtOrder) * effectiveQuantity;
                    const originalSubtotal = toNumber(item.priceAtOrder) * item.quantity;

                    return (
                      <tr key={item.id} className={isDeducted ? 'bg-red-50/30' : ''}>
                        <td className="px-4 py-2 text-sm">
                          {isDeducted ? (
                            <span className="line-through text-red-500">
                              {item.product?.name || 'Unknown Product'}
                            </span>
                          ) : (
                            <span className="text-gray-900">
                              {item.product?.name || 'Unknown Product'}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-500">
                          {isDeducted ? (
                            <div className="flex flex-col">
                              <span className="line-through text-red-500">{item.quantity}</span>
                              <span className="text-green-600 text-xs">
                                {effectiveQuantity} {item.product?.unit || ''}
                              </span>
                            </div>
                          ) : (
                            <span>{item.quantity} {item.product?.unit || ''}</span>
                          )}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-500">
                          R {toNumber(item.priceAtOrder).toFixed(2)}
                        </td>
                        <td className="px-4 py-2 text-sm">
                          {isDeducted ? (
                            <div className="flex flex-col">
                              <span className="line-through text-red-500">
                                R {originalSubtotal.toFixed(2)}
                              </span>
                              <span className="text-green-600 text-xs">
                                R {subtotal.toFixed(2)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-900">
                              R {subtotal.toFixed(2)}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2 text-sm">
                          {isDeducted && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                              Credited
                              {item.deductedReason && (
                                <span className="text-[10px] opacity-75">: {item.deductedReason}</span>
                              )}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {invoice.order.items.some((item: any) => item.isDeducted) && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Some items have been credited. The customer has received
                  credit for these items in their account.
                </p>
              </div>
            )}
          </div>
        )}

          {/* Credit Breakdown */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">Payment Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal:</span>
                <span className="text-gray-900">R {toNumber(invoice.subtotal).toFixed(2)}</span>
              </div>
              {toNumber(invoice.creditApplied) > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Credit Applied:</span>
                  <span>-R {toNumber(invoice.creditApplied).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold text-lg border-t pt-2">
                <span>Total:</span>
                <span>R {toNumber(invoice.total).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Payment History */}
          {payments && payments.length > 0 && (
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">Payment History</h3>
              <div className="space-y-2">
                {payments.map((payment) => (
                  <div key={payment.id} className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2">
                      {payment.method === 'yoco' && <CreditCard size={14} className="text-purple-600" />}
                      {payment.method === 'cash' && <Banknote size={14} className="text-green-600" />}
                      {payment.method === 'eft' && <Building size={14} className="text-blue-600" />}
                      <span className="text-gray-600 capitalize">{payment.method}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-900">R {(Number(payment.amount) / 100).toFixed(2)}</span>
                      <span className="ml-2 text-gray-500 text-xs">
                        {new Date(payment.paymentDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            Close
          </button>
          {invoice.pdfUrl && (
            <button
              onClick={() => downloadPDF.mutateAsync(invoice.id)}
              className="w-full sm:w-auto px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Download PDF
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
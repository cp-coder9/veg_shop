import { useState } from 'react';
import {
  useAdminInvoices,
  useInvoice,
  useDownloadInvoicePDF,
  useSendPaymentLink,
} from '../../hooks/useAdminInvoices';
import { toNumber } from '../../lib/utils';
import { toast } from 'react-hot-toast';

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
                Due Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {invoices?.map((invoice) => (
              <tr key={invoice.id}>
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
                  {toNumber(invoice.creditApplied) > 0 ? `-R ${toNumber(invoice.creditApplied).toFixed(2)}` : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                  R {toNumber(invoice.total).toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${invoice.status === 'paid'
                      ? 'bg-green-100 text-green-800'
                      : invoice.status === 'partial'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                      }`}
                  >
                    {invoice.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(invoice.dueDate).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <button
                    onClick={() => setSelectedInvoiceId(invoice.id)}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    View
                  </button>
                  {invoice.pdfUrl && (
                    <button
                      onClick={() => handleDownloadPDF(invoice.id)}
                      className="text-green-600 hover:text-green-900"
                    >
                      PDF
                    </button>
                  )}
                  {invoice.status !== 'paid' && (
                    <button
                      onClick={() => setPaymentLinkModal({ open: true, invoiceId: invoice.id })}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      Link
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Invoices List - Mobile Cards */}
      <div className="md:hidden space-y-4">
        {invoices?.map((invoice) => (
          <div key={invoice.id} className="bg-white p-4 rounded-lg shadow space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-sm font-bold text-gray-900">#{invoice.id.slice(0, 8)}...</h3>
                <p className="text-sm text-gray-600">{invoice.customer?.name || invoice.customerId.slice(0, 8)}</p>
              </div>
              <span
                className={`px-2 py-1 text-xs font-semibold rounded-full ${invoice.status === 'paid'
                  ? 'bg-green-100 text-green-800'
                  : invoice.status === 'partial'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
                  }`}
              >
                {invoice.status}
              </span>
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
                onClick={() => setSelectedInvoiceId(invoice.id)}
                className="w-full sm:w-auto px-3 py-1 bg-blue-50 text-blue-600 rounded text-sm font-medium hover:bg-blue-100"
              >
                View Details
              </button>
              {invoice.pdfUrl && (
                <button
                  onClick={() => handleDownloadPDF(invoice.id)}
                  className="w-full sm:w-auto px-3 py-1 bg-green-50 text-green-600 rounded text-sm font-medium hover:bg-green-100"
                >
                  PDF
                </button>
              )}
              {invoice.status !== 'paid' && (
                <button
                  onClick={() => setPaymentLinkModal({ open: true, invoiceId: invoice.id })}
                  className="w-full sm:w-auto px-3 py-1 bg-indigo-50 text-indigo-600 rounded text-sm font-medium hover:bg-indigo-100"
                >
                  Pay Link
                </button>
              )}
            </div>
          </div>
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
  const downloadPDF = useDownloadInvoicePDF();

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
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {invoice.order.items.map((item: { id: string; productId: string; quantity: number; priceAtOrder: number | string; product?: { name: string; unit?: string } }) => (
                      <tr key={item.id}>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {item.product?.name || 'Unknown Product'}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-500">
                          {item.quantity} {item.product?.unit || ''}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-500">
                          R {toNumber(item.priceAtOrder).toFixed(2)}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          R {(toNumber(item.priceAtOrder) * item.quantity).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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

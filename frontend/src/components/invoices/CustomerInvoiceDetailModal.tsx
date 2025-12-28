import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import { toNumber } from '../../lib/utils';
import { useDownloadInvoicePDF } from '../../hooks/useInvoicePDF';

interface InvoiceDetailModalProps {
  invoiceId: string;
  onClose: () => void;
}

interface InvoiceDetail {
  id: string;
  orderId: string;
  customerId: string;
  subtotal: number | string;
  creditApplied: number | string;
  total: number | string;
  status: 'unpaid' | 'partial' | 'paid';
  pdfUrl: string | null;
  createdAt: string;
  dueDate: string;
  order: {
    id: string;
    deliveryDate: string;
    deliveryMethod: 'delivery' | 'collection';
    items: {
      id: string;
      productId: string;
      quantity: number;
      priceAtOrder: number | string;
      product: {
        id: string;
        name: string;
        unit: string;
      };
    }[];
  };
  payments?: {
    id: string;
    amount: number | string;
    method: 'cash' | 'yoco' | 'eft';
    createdAt: string;
  }[];
}

export default function CustomerInvoiceDetailModal({
  invoiceId,
  onClose,
}: InvoiceDetailModalProps) {
  const { data: invoice, isLoading, isError } = useQuery({
    queryKey: ['invoice', invoiceId],
    queryFn: async () => {
      const response = await api.get<InvoiceDetail>(
        `/invoices/${invoiceId}?includePayments=true`
      );
      return response.data;
    },
  });

  const downloadPDF = useDownloadInvoicePDF();

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (isLoading) {
    return (
      <div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={handleBackdropClick}
      >
        <div className="bg-white rounded-lg p-8 w-full max-w-full mx-4 md:max-w-4xl">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading invoice details...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isError || !invoice) {
    return (
      <div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={handleBackdropClick}
      >
        <div className="bg-white rounded-lg p-8 w-full max-w-full mx-4 md:max-w-4xl">
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg">
            Failed to load invoice details. Please try again later.
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  const subtotal = toNumber(invoice.subtotal);
  const creditApplied = toNumber(invoice.creditApplied);
  const total = toNumber(invoice.total);
  const totalPaid = invoice.payments?.reduce(
    (sum, payment) => sum + toNumber(payment.amount),
    0
  ) || 0;
  const remainingBalance = total - totalPaid;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-full mx-4 md:max-w-4xl my-8 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Invoice #{invoice.id.slice(0, 8)}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Order #{invoice.orderId.slice(0, 8)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
            aria-label="Close modal"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          {/* Invoice Metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div>
              <p className="text-sm text-gray-600">Invoice Date</p>
              <p className="font-semibold text-gray-900">
                {new Date(invoice.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Due Date</p>
              <p className="font-semibold text-gray-900">
                {new Date(invoice.dueDate).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <span
                className={`inline-block px-3 py-1 text-sm font-semibold rounded-full ${invoice.status === 'paid'
                    ? 'bg-green-100 text-green-800'
                    : invoice.status === 'partial'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}
              >
                {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
              </span>
            </div>
          </div>

          {/* Delivery Information */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-900 mb-2">Delivery Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-600">Delivery Date</p>
                <p className="font-medium text-gray-900">
                  {new Date(invoice.order.deliveryDate).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Delivery Method</p>
                <p className="font-medium text-gray-900">
                  {invoice.order.deliveryMethod === 'delivery' ? 'Delivery' : 'Collection'}
                </p>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">Order Items</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {invoice.order.items.map((item) => {
                    const price = toNumber(item.priceAtOrder);
                    const itemTotal = price * item.quantity;
                    return (
                      <tr key={item.id}>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {item.product.name}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 text-right">
                          {item.quantity} {item.product.unit}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 text-right">
                          R{price.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">
                          R{itemTotal.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Payment Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Payment Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium text-gray-900">R{subtotal.toFixed(2)}</span>
              </div>
              {creditApplied > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Credit Applied</span>
                  <span className="font-medium text-green-600">
                    -R{creditApplied.toFixed(2)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-base font-semibold pt-2 border-t border-gray-200">
                <span className="text-gray-900">Total</span>
                <span className="text-gray-900">R{total.toFixed(2)}</span>
              </div>
              {invoice.payments && invoice.payments.length > 0 && (
                <>
                  <div className="flex justify-between text-sm pt-2">
                    <span className="text-gray-600">Total Paid</span>
                    <span className="font-medium text-green-600">
                      R{totalPaid.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-base font-semibold pt-2 border-t border-gray-200">
                    <span className="text-gray-900">Remaining Balance</span>
                    <span
                      className={
                        remainingBalance > 0 ? 'text-red-600' : 'text-green-600'
                      }
                    >
                      R{remainingBalance.toFixed(2)}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Payment History */}
          {invoice.payments && invoice.payments.length > 0 && (
            <div className="mt-6">
              <h3 className="font-semibold text-gray-900 mb-3">Payment History</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Method
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {invoice.payments.map((payment) => (
                      <tr key={payment.id}>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {new Date(payment.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {payment.method.toUpperCase()}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">
                          R{toNumber(payment.amount).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 flex flex-col-reverse sm:flex-row justify-between items-center gap-4 sm:gap-0">
          <button
            onClick={() => downloadPDF.mutate({ invoiceId: invoice.id })}
            disabled={downloadPDF.isPending}
            className="w-full sm:w-auto px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
          >
            {downloadPDF.isPending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Downloading...</span>
              </>
            ) : (
              <>
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <span>Download PDF</span>
              </>
            )}
          </button>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

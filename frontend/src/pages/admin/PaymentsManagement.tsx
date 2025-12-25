import { useState } from 'react';
import { useAdminInvoices } from '../../hooks/useAdminInvoices';
import { useCustomerPayments, useRecordPayment } from '../../hooks/useAdminPayments';
import { toNumber } from '../../lib/utils';

export default function PaymentsManagement() {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  
  const { data: unpaidInvoices } = useAdminInvoices({ status: 'unpaid' });
  const { data: partialInvoices } = useAdminInvoices({ status: 'partial' });

  const outstandingInvoices = [...(unpaidInvoices || []), ...(partialInvoices || [])];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Payments Management</h1>
        <button
          onClick={() => setShowPaymentModal(true)}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          Record Payment
        </button>
      </div>

      {/* Outstanding Invoices */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Outstanding Invoices
        </h2>
        
        {outstandingInvoices.length === 0 ? (
          <p className="text-gray-500">No outstanding invoices</p>
        ) : (
          <div className="overflow-x-auto">
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
                {outstandingInvoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {invoice.id.slice(0, 8)}...
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {invoice.customerId.slice(0, 8)}...
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      R {toNumber(invoice.total).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          invoice.status === 'partial'
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => {
                          setSelectedCustomerId(invoice.customerId);
                          setShowPaymentModal(true);
                        }}
                        className="text-green-600 hover:text-green-900"
                      >
                        Record Payment
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payment History by Customer */}
      {selectedCustomerId && (
        <PaymentHistorySection customerId={selectedCustomerId} />
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <PaymentModal
          preselectedCustomerId={selectedCustomerId}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedCustomerId('');
          }}
        />
      )}
    </div>
  );
}

interface PaymentHistorySectionProps {
  customerId: string;
}

function PaymentHistorySection({ customerId }: PaymentHistorySectionProps) {
  const { data: payments, isLoading } = useCustomerPayments(customerId);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        Payment History - Customer {customerId.slice(0, 8)}...
      </h2>
      
      {!payments || payments.length === 0 ? (
        <p className="text-gray-500">No payment history</p>
      ) : (
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Method
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Invoice
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Notes
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {payments.map((payment) => (
              <tr key={payment.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {new Date(payment.paymentDate).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                  R {toNumber(payment.amount).toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {payment.method.toUpperCase()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {payment.invoiceId.slice(0, 8)}...
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {payment.notes || '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

interface PaymentModalProps {
  preselectedCustomerId?: string;
  onClose: () => void;
}

function PaymentModal({ preselectedCustomerId, onClose }: PaymentModalProps) {
  const [formData, setFormData] = useState({
    invoiceId: '',
    customerId: preselectedCustomerId || '',
    amount: 0,
    method: 'cash' as 'cash' | 'yoco' | 'eft',
    paymentDate: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const { data: invoices } = useAdminInvoices({
    customerId: formData.customerId || undefined,
  });
  const recordPayment = useRecordPayment();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.invoiceId || !formData.customerId) {
      alert('Please select an invoice');
      return;
    }

    try {
      await recordPayment.mutateAsync(formData);
      
      // Check if overpayment
      const invoice = invoices?.find(inv => inv.id === formData.invoiceId);
      if (invoice && formData.amount > toNumber(invoice.total)) {
        const credit = formData.amount - toNumber(invoice.total);
        alert(`Payment recorded! Overpayment of R ${credit.toFixed(2)} added to customer credit balance.`);
      } else {
        alert('Payment recorded successfully!');
      }
      
      onClose();
    } catch (error) {
      alert('Failed to record payment');
    }
  };

  const selectedInvoice = invoices?.find(inv => inv.id === formData.invoiceId);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Record Payment</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Customer ID *
            </label>
            <input
              type="text"
              required
              value={formData.customerId}
              onChange={(e) => setFormData({ ...formData, customerId: e.target.value, invoiceId: '' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Enter customer ID"
            />
          </div>

          {formData.customerId && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Invoice *
              </label>
              <select
                required
                value={formData.invoiceId}
                onChange={(e) => setFormData({ ...formData, invoiceId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">Select an invoice</option>
                {invoices?.map((invoice) => (
                  <option key={invoice.id} value={invoice.id}>
                    {invoice.id.slice(0, 8)}... - R {toNumber(invoice.total).toFixed(2)} ({invoice.status})
                  </option>
                ))}
              </select>
            </div>
          )}

          {selectedInvoice && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-gray-700">
                Invoice Total: <span className="font-semibold">R {toNumber(selectedInvoice.total).toFixed(2)}</span>
              </p>
              <p className="text-sm text-gray-700">
                Status: <span className="font-semibold">{selectedInvoice.status}</span>
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount *
            </label>
            <input
              type="number"
              step="0.01"
              required
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            {selectedInvoice && formData.amount > toNumber(selectedInvoice.total) && (
              <p className="text-sm text-orange-600 mt-1">
                ⚠️ Overpayment of R {(formData.amount - toNumber(selectedInvoice.total)).toFixed(2)} will be added as credit
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Method *
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="cash"
                  checked={formData.method === 'cash'}
                  onChange={(e) => setFormData({ ...formData, method: e.target.value as 'cash' | 'yoco' | 'eft' })}
                  className="mr-2"
                />
                <span>Cash</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="yoco"
                  checked={formData.method === 'yoco'}
                  onChange={(e) => setFormData({ ...formData, method: e.target.value as 'cash' | 'yoco' | 'eft' })}
                  className="mr-2"
                />
                <span>Yoco</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="eft"
                  checked={formData.method === 'eft'}
                  onChange={(e) => setFormData({ ...formData, method: e.target.value as 'cash' | 'yoco' | 'eft' })}
                  className="mr-2"
                />
                <span>EFT</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Date *
            </label>
            <input
              type="date"
              required
              value={formData.paymentDate}
              onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={recordPayment.isPending}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {recordPayment.isPending ? 'Recording...' : 'Record Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

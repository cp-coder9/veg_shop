import { useState } from 'react';
import {
  useNotifications,
  useSendProductList,
  useSendPaymentReminder,
  useSendSeasonalPoll,
} from '../../hooks/useAdminNotifications';
import { useAdminInvoices } from '../../hooks/useAdminInvoices';

export default function NotificationsManagement() {
  const [showProductListModal, setShowProductListModal] = useState(false);
  const [showPaymentReminderModal, setShowPaymentReminderModal] = useState(false);
  const [showSeasonalPollModal, setShowSeasonalPollModal] = useState(false);

  const { data: notifications, isLoading } = useNotifications();
  const { data: unpaidInvoices } = useAdminInvoices({ status: 'unpaid' });

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Notifications Management</h1>

      {/* Action Buttons */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Send Notifications</h2>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => setShowProductListModal(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            📋 Send Product List
          </button>
          <button
            onClick={() => setShowPaymentReminderModal(true)}
            className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center gap-2"
          >
            💰 Send Payment Reminder
          </button>
          <button
            onClick={() => setShowSeasonalPollModal(true)}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
          >
            🌿 Send Seasonal Poll
          </button>
        </div>
      </div>

      {/* Notification History */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Notification History</h2>

        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        ) : !notifications || notifications.length === 0 ? (
          <p className="text-gray-500">No notifications sent yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Method
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {notifications.map((notification) => (
                  <tr key={notification.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(notification.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {notification.type.replace(/_/g, ' ')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {notification.method}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {notification.customerId.slice(0, 8)}...
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${notification.status === 'sent'
                          ? 'bg-green-100 text-green-800'
                          : notification.status === 'failed'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                          }`}
                      >
                        {notification.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => alert(notification.content)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View Content
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {showProductListModal && (
        <ProductListModal onClose={() => setShowProductListModal(false)} />
      )}
      {showPaymentReminderModal && (
        <PaymentReminderModal
          unpaidInvoices={unpaidInvoices || []}
          onClose={() => setShowPaymentReminderModal(false)}
        />
      )}
      {showSeasonalPollModal && (
        <SeasonalPollModal onClose={() => setShowSeasonalPollModal(false)} />
      )}
    </div>
  );
}

interface ModalProps {
  onClose: () => void;
}

function ProductListModal({ onClose }: ModalProps) {
  const [customerIds, setCustomerIds] = useState<string>('');
  const sendProductList = useSendProductList();

  const handleSend = async () => {
    const ids = customerIds.split(',').map(id => id.trim()).filter(id => id);

    try {
      await sendProductList.mutateAsync(ids);
      alert(`Product list sent to ${ids.length > 0 ? ids.length : 'all'} customer(s)`);
      onClose();
    } catch (error) {
      alert('Failed to send product list');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Send Product List</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Customer IDs (comma-separated)
            </label>
            <textarea
              value={customerIds}
              onChange={(e) => setCustomerIds(e.target.value)}
              rows={4}
              placeholder="customer-id-1, customer-id-2"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            <p className="text-sm text-gray-500 mt-1">Leave empty to send to all customers</p>
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={onClose} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">Cancel</button>
            <button
              onClick={handleSend}
              disabled={sendProductList.isPending}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {sendProductList.isPending ? 'Sending...' : 'Send Product List'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface UnpaidInvoice {
  id: string;
  customerId: string;
  total: number | string;
  dueDate: string;
}

interface PaymentReminderModalProps {
  unpaidInvoices: UnpaidInvoice[];
  onClose: () => void;
}

function PaymentReminderModal({ unpaidInvoices, onClose }: PaymentReminderModalProps) {
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const sendPaymentReminder = useSendPaymentReminder();

  const uniqueCustomers = Array.from(new Set(unpaidInvoices.map(inv => inv.customerId)));

  const handleSend = async () => {
    if (!selectedCustomerId) return alert('Please select a customer');
    try {
      await sendPaymentReminder.mutateAsync(selectedCustomerId);
      alert('Payment reminder sent successfully');
      onClose();
    } catch (error) {
      alert('Failed to send payment reminder');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Send Payment Reminder</h2>
        <div className="space-y-4">
          <select
            value={selectedCustomerId}
            onChange={(e) => setSelectedCustomerId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="">Select a customer</option>
            {uniqueCustomers.map(id => (
              <option key={id} value={id}>{id.slice(0, 8)}...</option>
            ))}
          </select>
          <div className="flex justify-end gap-3">
            <button onClick={onClose} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">Cancel</button>
            <button
              onClick={handleSend}
              disabled={!selectedCustomerId || sendPaymentReminder.isPending}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
            >
              {sendPaymentReminder.isPending ? 'Sending...' : 'Send Reminder'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SeasonalPollModal({ onClose }: ModalProps) {
  const [customerIds, setCustomerIds] = useState<string>('');
  const sendSeasonalPoll = useSendSeasonalPoll();

  const handleSend = async () => {
    const ids = customerIds.split(',').map(id => id.trim()).filter(id => id);
    try {
      await sendSeasonalPoll.mutateAsync(ids);
      alert(`Seasonal poll sent to ${ids.length > 0 ? ids.length : 'all'} customer(s)`);
      onClose();
    } catch (error) {
      alert('Failed to send seasonal poll');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Send Seasonal Items Poll</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Customer IDs (comma-separated)</label>
            <textarea
              value={customerIds}
              onChange={(e) => setCustomerIds(e.target.value)}
              rows={4}
              placeholder="customer-id-1, customer-id-2"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={onClose} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">Cancel</button>
            <button
              onClick={handleSend}
              disabled={sendSeasonalPoll.isPending}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              {sendSeasonalPoll.isPending ? 'Sending...' : 'Send Seasonal Poll'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

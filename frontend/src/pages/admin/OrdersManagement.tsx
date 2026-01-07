import { useState } from 'react';
import { Order } from '../../types';
import {
  useAdminOrders,
  useOrder,
  useUpdateOrderStatus,
  useGenerateBulkOrder,
  useGenerateBulkOrder,
} from '../../hooks/useAdminOrders';
import { useGenerateInvoice } from '../../hooks/useAdminInvoices';
import { useAdminUsers } from '../../hooks/useAdminUsers';

export default function OrdersManagement() {
  const [deliveryDateFilter, setDeliveryDateFilter] = useState('');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [showBulkOrderModal, setShowBulkOrderModal] = useState(false);

  const filters = {
    deliveryDate: deliveryDateFilter || undefined,
    startDate: startDateFilter || undefined,
    endDate: endDateFilter || undefined,
    status: statusFilter || undefined,
  };

  const { data: orders, isLoading } = useAdminOrders(filters);
  const { data: packers } = useAdminUsers('packer');
  const updateOrderStatus = useUpdateOrderStatus();
  const updateOrder = useMutation({
    mutationFn: async ({ id, packerId }: { id: string; packerId: string | null }) => {
      await api.patch(`/orders/${id}`, { packerId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
    }
  });

  const handleStatusChange = async (orderId: string, status: Order['status']) => {
    await updateOrderStatus.mutateAsync({ id: orderId, status });
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Orders Management</h1>
        <button
          onClick={() => setShowBulkOrderModal(true)}
          className="w-full sm:w-auto px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          Generate Bulk Order
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Specific Date
            </label>
            <input
              type="date"
              value={deliveryDateFilter}
              onChange={(e) => {
                setDeliveryDateFilter(e.target.value);
                setStartDateFilter('');
                setEndDateFilter('');
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={startDateFilter}
              onChange={(e) => {
                setStartDateFilter(e.target.value);
                setDeliveryDateFilter('');
              }}
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
              onChange={(e) => {
                setEndDateFilter(e.target.value);
                setDeliveryDateFilter('');
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
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
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="packed">Packed</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders Table - Desktop */}
      <div className="hidden md:block bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Delivery Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Method
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Packer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Items
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders?.map((order) => (
                <tr key={order.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {order.id.slice(0, 8)}...
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {order.customerName || order.customerId.slice(0, 8)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(order.deliveryDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {order.deliveryMethod}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={order.status}
                      onChange={(e) => handleStatusChange(order.id, e.target.value as Order['status'])}
                      className="text-sm border border-gray-300 rounded px-2 py-1"
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="packed">Packed</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={order.packerId || ''}
                      onChange={(e) => updateOrder.mutate({ id: order.id, packerId: e.target.value || null })}
                      className="text-sm border border-gray-300 rounded px-2 py-1 w-32"
                    >
                      <option value="">Unassigned</option>
                      {packers?.map((packer) => (
                        <option key={packer.id} value={packer.id}>
                          {packer.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {order.items.length} items
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => setSelectedOrderId(order.id)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Orders Cards - Mobile */}
      <div className="md:hidden space-y-4">
        {orders?.map((order) => (
          <div key={order.id} className="bg-white p-4 rounded-lg shadow space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-bold text-gray-900">#{order.id.slice(0, 8)}</p>
                <p className="text-sm text-gray-500">{order.customerName || 'Unknown Customer'}</p>
              </div>
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                {order.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-500">Date:</span>
                <span className="ml-1 text-gray-900">{new Date(order.deliveryDate).toLocaleDateString()}</span>
              </div>
              <div>
                <span className="text-gray-500">Method:</span>
                <span className="ml-1 text-gray-900 capitalize">{order.deliveryMethod}</span>
              </div>
              <div>
                <span className="text-gray-500">Items:</span>
                <span className="ml-1 text-gray-900">{order.items.length}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-gray-100 flex justify-between items-center gap-2">
              <select
                value={order.status}
                onChange={(e) => handleStatusChange(order.id, e.target.value as Order['status'])}
                className="text-sm border border-gray-300 rounded px-2 py-1 flex-1"
              >
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="packed">Packed</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>

              <button
                onClick={() => setSelectedOrderId(order.id)}
                className="px-3 py-1 bg-blue-50 text-blue-600 rounded text-sm font-medium hover:bg-blue-100"
              >
                View
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Order Detail Modal */}
      {selectedOrderId && (
        <OrderDetailModal
          orderId={selectedOrderId}
          onClose={() => setSelectedOrderId(null)}
        />
      )}

      {/* Bulk Order Modal */}
      {showBulkOrderModal && (
        <BulkOrderModal onClose={() => setShowBulkOrderModal(false)} />
      )}
    </div>
  );
}

interface OrderDetailModalProps {
  orderId: string;
  onClose: () => void;
}

function OrderDetailModal({ orderId, onClose }: OrderDetailModalProps) {
  const { data: order, isLoading } = useOrder(orderId);
  const generateInvoice = useGenerateInvoice();

  const handleGenerateInvoice = async () => {
    try {
      await generateInvoice.mutateAsync(orderId);
      alert('Invoice generated successfully!');
    } catch (error: unknown) {
      if ((error as { response?: { status: number } }).response?.status === 409) {
        alert('Invoice already exists for this order.');
      } else {
        alert('Failed to generate invoice.');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      </div>
    );
  }

  if (!order) return null;

  const total = order.items.reduce((sum, item) => sum + Number(item.priceAtOrder) * item.quantity, 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-4 md:p-6 w-full max-w-full mx-4 md:max-w-3xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Order Details</h2>

        <div className="space-y-4">
          {/* Customer Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">Customer Information</h3>
            <p className="text-sm text-gray-600">Customer ID: {order.customerId}</p>
            {order.deliveryAddress && (
              <p className="text-sm text-gray-600">Address: {order.deliveryAddress}</p>
            )}
            {order.specialInstructions && (
              <p className="text-sm text-gray-600">Instructions: {order.specialInstructions}</p>
            )}
          </div>

          {/* Order Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">Order Information</h3>
            <p className="text-sm text-gray-600">
              Delivery Date: {new Date(order.deliveryDate).toLocaleDateString()}
            </p>
            <p className="text-sm text-gray-600">
              Delivery Method: {order.deliveryMethod}
            </p>
            <p className="text-sm text-gray-600">Status: {order.status}</p>
          </div>

          {/* Items */}
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
                  {order.items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-2 text-sm text-gray-900">
                        {item.product.name}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-500">
                        {item.quantity} {item.product.unit}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-500">
                        R {Number(item.priceAtOrder).toFixed(2)}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900">
                        R {(Number(item.priceAtOrder) * item.quantity).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={3} className="px-4 py-2 text-right font-semibold">
                      Total:
                    </td>
                    <td className="px-4 py-2 font-semibold">R {total.toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row justify-end mt-6 gap-3">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-center"
          >
            Close
          </button>
          {order.status !== 'cancelled' && (
            <button
              onClick={handleGenerateInvoice}
              disabled={generateInvoice.isPending}
              className="w-full sm:w-auto px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-center"
            >
              {generateInvoice.isPending ? 'Generating...' : 'Generate Invoice'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

interface BulkOrderModalProps {
  onClose: () => void;
}

interface BulkOrderData {
  weekStartDate: string;
  items: Array<{
    productName: string;
    finalQuantity: number;
    totalQuantity: number;
    bufferQuantity: number;
  }>;
}

function BulkOrderModal({ onClose }: BulkOrderModalProps) {
  const [weekStartDate, setWeekStartDate] = useState('');
  const [bulkOrder, setBulkOrder] = useState<BulkOrderData | null>(null);
  const [format, setFormat] = useState<'whatsapp' | 'email'>('whatsapp');
  const generateBulkOrder = useGenerateBulkOrder();

  const handleGenerate = async () => {
    if (!weekStartDate) {
      alert('Please select a week start date');
      return;
    }
    const result = await generateBulkOrder.mutateAsync(weekStartDate);
    setBulkOrder(result);
  };

  const formatBulkOrder = () => {
    if (!bulkOrder) return '';

    if (format === 'whatsapp') {
      let text = `*Bulk Order for Week of ${new Date(bulkOrder.weekStartDate).toLocaleDateString()}*\n\n`;
      bulkOrder.items.forEach((item: { productName: string; finalQuantity: number; totalQuantity: number; bufferQuantity: number }) => {
        text += `${item.productName}: ${item.finalQuantity} (${item.totalQuantity} + ${item.bufferQuantity} buffer)\n`;
      });
      return text;
    } else {
      let text = `Bulk Order for Week of ${new Date(bulkOrder.weekStartDate).toLocaleDateString()}\n\n`;
      bulkOrder.items.forEach((item: { productName: string; finalQuantity: number; totalQuantity: number; bufferQuantity: number }) => {
        text += `${item.productName}: ${item.finalQuantity} (${item.totalQuantity} ordered + ${item.bufferQuantity} buffer)\n`;
      });
      return text;
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(formatBulkOrder());
    alert('Copied to clipboard!');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-4 md:p-6 w-full max-w-full mx-4 md:max-w-3xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Generate Bulk Order</h2>

        {!bulkOrder ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Week Start Date (Monday)
              </label>
              <input
                type="date"
                value={weekStartDate}
                onChange={(e) => setWeekStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
              <button
                onClick={onClose}
                className="w-full sm:w-auto px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerate}
                disabled={generateBulkOrder.isPending}
                className="w-full sm:w-auto px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {generateBulkOrder.isPending ? 'Generating...' : 'Generate'}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex gap-4 mb-4">
              <button
                onClick={() => setFormat('whatsapp')}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-lg ${format === 'whatsapp'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700'
                  }`}
              >
                WhatsApp
              </button>
              <button
                onClick={() => setFormat('email')}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-lg ${format === 'email'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700'
                  }`}
              >
                Email
              </button>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg whitespace-pre-wrap font-mono text-sm max-h-96 overflow-y-auto">
              {formatBulkOrder()}
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
              <button
                onClick={onClose}
                className="w-full sm:w-auto px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Close
              </button>
              <button
                onClick={handleCopy}
                className="w-full sm:w-auto px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Copy to Clipboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

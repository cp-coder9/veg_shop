import { useState } from 'react';
import { useAdminOrders } from '../../hooks/useAdminOrders';
import { useCustomerCredits, useRecordShortDelivery } from '../../hooks/useAdminCredits';
import { useProducts } from '../../hooks/useProducts';
import { toNumber } from '../../lib/utils';

export default function ShortDeliveryManagement() {
  const [showShortDeliveryModal, setShowShortDeliveryModal] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');

  const { data: deliveredOrders } = useAdminOrders({ status: 'delivered' });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Short Delivery Management</h1>
        <button
          onClick={() => setShowShortDeliveryModal(true)}
          className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
        >
          Record Short Delivery
        </button>
      </div>

      {/* Recent Delivered Orders */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Recent Delivered Orders
        </h2>
        
        {!deliveredOrders || deliveredOrders.length === 0 ? (
          <p className="text-gray-500">No delivered orders</p>
        ) : (
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
                    Items
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {deliveredOrders.slice(0, 10).map((order) => (
                  <tr key={order.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {order.id.slice(0, 8)}...
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.customerId.slice(0, 8)}...
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(order.deliveryDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.items.length} items
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => {
                          setSelectedCustomerId(order.customerId);
                          setShowShortDeliveryModal(true);
                        }}
                        className="text-orange-600 hover:text-orange-900"
                      >
                        Record Short Delivery
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Short Delivery History */}
      {selectedCustomerId && (
        <ShortDeliveryHistorySection customerId={selectedCustomerId} />
      )}

      {/* Short Delivery Modal */}
      {showShortDeliveryModal && (
        <ShortDeliveryModal
          preselectedCustomerId={selectedCustomerId}
          onClose={() => {
            setShowShortDeliveryModal(false);
            setSelectedCustomerId('');
          }}
        />
      )}
    </div>
  );
}

interface ShortDeliveryHistorySectionProps {
  customerId: string;
}

function ShortDeliveryHistorySection({ customerId }: ShortDeliveryHistorySectionProps) {
  const { data: creditData, isLoading } = useCustomerCredits(customerId);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  const shortDeliveryCredits = creditData?.credits.filter(c => c.type === 'short_delivery') || [];

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        Short Delivery History - Customer {customerId.slice(0, 8)}...
      </h2>
      
      <div className="mb-4 p-4 bg-green-50 rounded-lg">
        <p className="text-lg font-semibold text-gray-900">
          Current Credit Balance: R {(creditData?.balance || 0).toFixed(2)}
        </p>
      </div>

      {shortDeliveryCredits.length === 0 ? (
        <p className="text-gray-500">No short delivery history</p>
      ) : (
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Credit Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Reason
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {shortDeliveryCredits.map((credit) => (
              <tr key={credit.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {new Date(credit.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                  R {credit.amount.toFixed(2)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {credit.reason}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

interface ShortDeliveryModalProps {
  preselectedCustomerId?: string;
  onClose: () => void;
}

function ShortDeliveryModal({ preselectedCustomerId, onClose }: ShortDeliveryModalProps) {
  const [customerId, setCustomerId] = useState(preselectedCustomerId || '');
  const [orderId, setOrderId] = useState('');
  const [shortItems, setShortItems] = useState<{ productId: string; quantityShort: number }[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantityShort, setQuantityShort] = useState(0);

  const { data: orders } = useAdminOrders({ customerId: customerId || undefined });
  const { data: products } = useProducts();
  const recordShortDelivery = useRecordShortDelivery();

  const selectedOrder = orders?.find(o => o.id === orderId);

  const handleAddItem = () => {
    if (!selectedProductId || quantityShort <= 0) {
      alert('Please select a product and enter quantity');
      return;
    }

    setShortItems([...shortItems, { productId: selectedProductId, quantityShort }]);
    setSelectedProductId('');
    setQuantityShort(0);
  };

  const handleRemoveItem = (index: number) => {
    setShortItems(shortItems.filter((_, i) => i !== index));
  };

  const calculateTotalCredit = () => {
    return shortItems.reduce((total, item) => {
      const product = products?.find(p => p.id === item.productId);
      return total + toNumber(product?.price || 0) * item.quantityShort;
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!orderId || !customerId || shortItems.length === 0) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      await recordShortDelivery.mutateAsync({
        orderId,
        customerId,
        items: shortItems,
      });

      const totalCredit = calculateTotalCredit();
      alert(`Short delivery recorded! R ${totalCredit.toFixed(2)} added to customer credit balance.`);
      onClose();
    } catch (error) {
      alert('Failed to record short delivery');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Record Short Delivery</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Customer ID *
            </label>
            <input
              type="text"
              required
              value={customerId}
              onChange={(e) => {
                setCustomerId(e.target.value);
                setOrderId('');
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Enter customer ID"
            />
          </div>

          {customerId && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Order *
              </label>
              <select
                required
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">Select an order</option>
                {orders?.map((order) => (
                  <option key={order.id} value={order.id}>
                    {order.id.slice(0, 8)}... - {new Date(order.deliveryDate).toLocaleDateString()} ({order.status})
                  </option>
                ))}
              </select>
            </div>
          )}

          {selectedOrder && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">Order Items</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                {selectedOrder.items.map((item) => (
                  <li key={item.id}>
                    {item.product.name} - {item.quantity} {item.product.unit}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Add Short Items */}
          <div className="border-t pt-4">
            <h3 className="font-semibold text-gray-900 mb-3">Short Items</h3>
            
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div className="col-span-2">
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Select product</option>
                  {selectedOrder?.items.map((item) => (
                    <option key={item.productId} value={item.productId}>
                      {item.product.name} (R {toNumber(item.product.price).toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <input
                  type="number"
                  step="0.01"
                  value={quantityShort}
                  onChange={(e) => setQuantityShort(parseFloat(e.target.value))}
                  placeholder="Quantity"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <button
              type="button"
              onClick={handleAddItem}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
            >
              Add Item
            </button>

            {/* Short Items List */}
            {shortItems.length > 0 && (
              <div className="mt-4">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Product
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Quantity Short
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Credit
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {shortItems.map((item, index) => {
                      const product = products?.find(p => p.id === item.productId);
                      const credit = toNumber(product?.price || 0) * item.quantityShort;
                      return (
                        <tr key={index}>
                          <td className="px-4 py-2 text-sm text-gray-900">
                            {product?.name}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-500">
                            {item.quantityShort}
                          </td>
                          <td className="px-4 py-2 text-sm text-green-600 font-semibold">
                            R {credit.toFixed(2)}
                          </td>
                          <td className="px-4 py-2 text-sm">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(index)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={2} className="px-4 py-2 text-right font-semibold">
                        Total Credit:
                      </td>
                      <td className="px-4 py-2 font-semibold text-green-600">
                        R {calculateTotalCredit().toFixed(2)}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={recordShortDelivery.isPending || shortItems.length === 0}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
            >
              {recordShortDelivery.isPending ? 'Recording...' : 'Record Short Delivery'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useAdminOrders } from '../../hooks/useAdminOrders';
import { useGeneratePackingListPDF } from '../../hooks/useAdminPackingLists';

export default function PackingListsManagement() {
  const [selectedDate, setSelectedDate] = useState('');
  const [sortBy, setSortBy] = useState<'route' | 'name'>('name');

  const { data: orders, isLoading } = useAdminOrders({
    deliveryDate: selectedDate || undefined,
  });
  const generatePDF = useGeneratePackingListPDF();

  const handleGeneratePDF = async () => {
    if (!selectedDate) {
      alert('Please select a delivery date');
      return;
    }
    await generatePDF.mutateAsync({ date: selectedDate, sortBy });
  };

  const sortedOrders = orders ? [...orders].sort((a, b) => {
    if (sortBy === 'name') {
      return a.customerId.localeCompare(b.customerId);
    }
    return (a.deliveryAddress || '').localeCompare(b.deliveryAddress || '');
  }) : [];

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Packing Lists</h1>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Delivery Date *
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'route' | 'name')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="name">Customer Name</option>
              <option value="route">Route (Address)</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={handleGeneratePDF}
              disabled={!selectedDate || generatePDF.isPending}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {generatePDF.isPending ? 'Generating...' : 'Generate PDF'}
            </button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      ) : selectedDate && sortedOrders.length > 0 ? (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Packing Lists for {new Date(selectedDate).toLocaleDateString()} ({sortedOrders.length} orders)
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sortedOrders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow-md p-4 border-2 border-gray-200">
                <div className="mb-3 pb-3 border-b">
                  <h3 className="font-semibold text-gray-900">
                    Customer: {order.customerId.slice(0, 8)}...
                  </h3>
                  {order.deliveryAddress && (
                    <p className="text-sm text-gray-600">Address: {order.deliveryAddress}</p>
                  )}
                  <p className="text-sm text-gray-600">
                    Method: {order.deliveryMethod}
                  </p>
                  {order.specialInstructions && (
                    <p className="text-sm text-orange-600">
                      Note: {order.specialInstructions}
                    </p>
                  )}
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Items:</h4>
                  <ul className="space-y-1">
                    {order.items.map((item) => (
                      <li key={item.id} className="text-sm text-gray-700 flex justify-between">
                        <span>{item.product.name}</span>
                        <span className="font-medium">
                          {item.quantity} {item.product.unit}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : selectedDate ? (
        <div className="bg-white rounded-lg shadow-md p-6 text-center text-gray-500">
          No orders for this date
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-6 text-center text-gray-500">
          Select a delivery date to view packing lists
        </div>
      )}
    </div>
  );
}

import { useState } from 'react';
import { usePackingList, useGeneratePackingListPDF } from '../../hooks/useAdminPackingLists';

export default function PackingListsManagement() {
  const [selectedDate, setSelectedDate] = useState('');

  const { data: groupedOrders, isLoading } = usePackingList(selectedDate);
  const generatePDF = useGeneratePackingListPDF();

  const handleGeneratePDF = async () => {
    if (!selectedDate) {
      alert('Please select a delivery date');
      return;
    }
    await generatePDF.mutateAsync({ date: selectedDate, sortBy: 'route' });
  };

  const areas = groupedOrders ? Object.keys(groupedOrders).sort() : [];
  const totalOrders = groupedOrders ? Object.values(groupedOrders).reduce((sum, list) => sum + list.length, 0) : 0;

  return (
    <div>
      <div className="flex justify-between items-center mb-6 print:hidden">
        <h1 className="text-3xl font-bold text-gray-900">Packing Lists</h1>
        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Print All Lists
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6 print:hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          <div className="flex items-end">
            <button
              onClick={handleGeneratePDF}
              disabled={!selectedDate || generatePDF.isPending}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {generatePDF.isPending ? 'Generating PDF...' : 'Download PDF'}
            </button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64 print:hidden">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      ) : selectedDate && areas.length > 0 ? (
        <div className="space-y-8">
          <div className="print:hidden mb-4 p-4 bg-green-50 text-green-800 rounded-lg">
            Found {totalOrders} orders across {areas.length} delivery areas.
          </div>

          {areas.map((area) => (
            <div key={area} className="break-before-page">
              <div className="bg-gray-100 p-4 rounded-t-lg border-b-2 border-green-600 mb-4 print:bg-white print:border-green-800 print:mb-2">
                <h2 className="text-2xl font-bold text-gray-800 uppercase tracking-wider">
                  {area} Route
                </h2>
                <p className="text-gray-600 print:text-gray-900">
                  {groupedOrders![area].length} Orders &bull; {new Date(selectedDate).toLocaleDateString()}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-6 print:block print:gap-0">
                {groupedOrders![area].map((order) => (
                  <div key={order.id} className="bg-white rounded-lg shadow-md p-6 border border-gray-200 print:shadow-none print:border-gray-800 print:mb-6 print:break-inside-avoid">
                    <div className="flex justify-between items-start mb-4 border-b pb-2">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">
                          {order.customerName || order.customerId}
                        </h3>
                        <p className="text-gray-700 font-medium">
                          {order.deliveryAddress || 'No Address Provided'}
                        </p>
                        {order.specialInstructions && (
                          <p className="text-red-600 font-bold mt-1 text-sm bg-red-50 p-1 inline-block">
                            NOTE: {order.specialInstructions}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-bold text-gray-400">#{order.id.slice(-4)}</span>
                        <div className="text-sm text-gray-600">{order.deliveryMethod}</div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {['fridge', 'freezer', 'box'].map(type => {
                        const itemsOfType = order.items.filter((item: any) =>
                          type === 'box'
                            ? !['fridge', 'freezer'].includes(item.product.packingType)
                            : item.product.packingType === type
                        );

                        if (itemsOfType.length === 0) return null;

                        return (
                          <div key={type} className="space-y-2">
                            <h4 className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded w-fit ${type === 'fridge' ? 'bg-blue-600 text-white' :
                              type === 'freezer' ? 'bg-indigo-600 text-white' :
                                'bg-gray-600 text-white'
                              }`}>
                              {type === 'box' ? 'Dry / Standard' : type}
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-sm print:grid-cols-2">
                              {itemsOfType.map((item: any) => (
                                <div key={item.id} className="flex justify-between items-center border-b border-gray-100 py-1">
                                  <span className="text-gray-800 font-medium">{item.product.name}</span>
                                  <span className="font-bold text-lg">
                                    {item.quantity} {item.product.unit}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : selectedDate ? (
        <div className="bg-white rounded-lg shadow-md p-6 text-center text-gray-500">
          No orders found for this date.
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-6 text-center text-gray-500">
          Select a delivery date to view.
        </div>
      )}

      <style>{`
        @media print {
          .print\\:hidden { display: none !important; }
          .print\\:block { display: block !important; }
          .break-before-page { page-break-before: always; }
          .break-inside-avoid { page-break-inside: avoid; }
          body { background: white; }
          /* Ensure backgrounds print */
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      `}</style>
    </div>
  );
}

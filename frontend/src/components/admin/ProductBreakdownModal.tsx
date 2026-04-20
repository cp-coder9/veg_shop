import { useState, useMemo } from 'react';
import { Order } from '../../types/index.js';
import { Button, Input, Card, CardContent } from '../ui/index.js';
import { Search, ChevronDown, ChevronUp, Printer, X, CreditCard, Check } from 'lucide-react';
import { useRecordShortDelivery } from '../../hooks/useAdminCredits.js';

interface ProductBreakdownModalProps {
  onClose: () => void;
  orders: Order[];
  startDate: string;
  endDate: string;
}

interface ProductAggregated {
  productId: string;
  productName: string;
  unit: string;
  totalQuantity: number;
  customers: {
    customerId: string;
    customerName: string;
    quantity: number;
    orderId: string;
  }[];
}

const CREDIT_REASONS = [
  'Unassigned',
  'Not Received',
  'Not Packed',
  'Short Delivered',
  'Damaged',
  'Quality Issue'
];

export default function ProductBreakdownModal({ onClose, orders, startDate, endDate }: ProductBreakdownModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedProducts, setExpandedProducts] = useState<Record<string, boolean>>({});
  const [selectedReasons, setSelectedReasons] = useState<Record<string, string>>({});
  const [processingCredits, setProcessingCredits] = useState<Record<string, boolean>>({});
  const [successCredits, setSuccessCredits] = useState<Record<string, boolean>>({});

  const recordShortDelivery = useRecordShortDelivery();

  const aggregatedData = useMemo(() => {
    const products: Record<string, ProductAggregated> = {};

    orders.forEach(order => {
      order.items.forEach(item => {
        if (!item.product) return; // Skip items with missing product data
        const productId = item.productId;
        if (!products[productId]) {
          products[productId] = {
            productId,
            productName: item.product?.name || 'Unknown Product',
            unit: item.product?.unit || 'unit',
            totalQuantity: 0,
            customers: [],
          };
        }
        products[productId].totalQuantity += item.quantity;
        products[productId].customers.push({
          customerId: order.customerId,
          customerName: order.customerName || 'Unknown Customer',
          quantity: item.quantity,
          orderId: order.id,
        });
      });
    });

    // Sort customers by name for each product
    Object.values(products).forEach(p => {
      p.customers.sort((a, b) => a.customerName.localeCompare(b.customerName));
    });

    return Object.values(products).sort((a, b) => a.productName.localeCompare(b.productName));
  }, [orders]);

  const filteredData = aggregatedData.filter(p => {
    const matchesProduct = p.productName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCustomer = p.customers.some(c => 
      c.customerName.toLowerCase().includes(searchTerm.toLowerCase())
    );
    return matchesProduct || matchesCustomer;
  });

  const toggleExpand = (productId: string) => {
    setExpandedProducts((prev: Record<string, boolean>) => ({
      ...prev,
      [productId]: !prev[productId]
    }));
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCredit = async (customerId: string, orderId: string, productId: string, quantity: number) => {
    const reason = selectedReasons[`${orderId}-${productId}`] || 'Unassigned';
    const key = `${orderId}-${productId}`;

    setProcessingCredits(prev => ({ ...prev, [key]: true }));
    
    try {
      await recordShortDelivery.mutateAsync({
        orderId,
        customerId,
        items: [{ productId, quantityShort: quantity }],
        reason: `Reason: ${reason} (via Product Breakdown)`
      });
      
      setSuccessCredits(prev => ({ ...prev, [key]: true }));
      // Cleanup success message after 3 seconds
      setTimeout(() => {
        setSuccessCredits(prev => ({ ...prev, [key]: false }));
      }, 3000);
    } catch (error) {
      console.error('Failed to apply credit:', error);
      alert('Failed to apply credit. Please try again.');
    } finally {
      setProcessingCredits(prev => ({ ...prev, [key]: false }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col print:max-w-none print:max-h-none print:shadow-none">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-cream/20 print:hidden">
          <div>
            <h2 className="text-2xl font-display font-bold text-primary-dark">Product Order Breakdown</h2>
            <p className="text-sm text-warm-gray font-body mt-1">
              Showing allocations for {startDate || 'all dates'} {endDate ? `to ${endDate}` : ''}
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" size="sm" onClick={handlePrint} leftIcon={<Printer size={16} />}>
              Print Report
            </Button>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-warm-gray">
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Print Header */}
        <div className="hidden print:block p-8 border-b-2 border-gray-200 mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Product Allocation Report</h1>
          <p className="text-gray-600 mt-2">
            Period: {startDate || 'All Time'} {endDate ? `to ${endDate}` : ''}
          </p>
          <p className="text-sm text-gray-500 mt-1">Generated on {new Date().toLocaleString()}</p>
        </div>

        {/* Search Bar */}
        <div className="p-6 border-b border-gray-50 print:hidden">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-light-gray" size={20} />
            <Input
              placeholder="Search by product or customer name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 py-6 bg-gray-50/50 border-gray-200"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 print:p-0">
          {filteredData.length === 0 ? (
            <div className="text-center py-20 grayscale opacity-50">
              <div className="text-4xl mb-4">📦</div>
              <p className="text-warm-gray font-body">No products found matching your search.</p>
            </div>
          ) : (
            filteredData.map(product => (
              <Card key={product.productId} className="border-gray-100 shadow-sm hover:shadow-md transition-shadow group overflow-hidden print:shadow-none print:border-gray-300 print:mb-4">
                <div 
                  className="p-4 flex items-center justify-between cursor-pointer select-none bg-white group-hover:bg-gray-50/50 transition-colors print:cursor-auto print:bg-gray-50"
                  onClick={() => toggleExpand(product.productId)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center text-green-600 font-bold">
                      {product.productName.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-lg text-primary-dark">{product.productName}</h3>
                      <p className="text-sm text-warm-gray font-body">{product.customers.length} total customers</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-overline text-warm-gray uppercase tracking-widest">Total Qty</p>
                      <p className="font-display font-bold text-xl text-green-700">
                        {product.totalQuantity} <span className="text-xs font-body font-medium text-warm-gray">{product.unit}</span>
                      </p>
                    </div>
                    <div className="print:hidden">
                      {expandedProducts[product.productId] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>
                  </div>
                </div>

                {(expandedProducts[product.productId] || searchTerm.length > 0) && (
                  <CardContent className="p-0 border-t border-gray-50 bg-gray-50/30 print:block">
                    <table className="min-w-full divide-y divide-gray-100">
                      <thead className="bg-white/50">
                        <tr>
                          <th className="px-6 py-3 text-left text-[10px] font-bold text-warm-gray uppercase tracking-widest">Customer Name</th>
                          <th className="px-6 py-3 text-left text-[10px] font-bold text-warm-gray uppercase tracking-widest">Order ID</th>
                          <th className="px-6 py-3 text-right text-[10px] font-bold text-warm-gray uppercase tracking-widest">Quantity</th>
                          <th className="px-6 py-3 text-right text-[10px] font-bold text-warm-gray uppercase tracking-widest print:hidden">Credit Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {product.customers
                          .filter(c => c.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || searchTerm.length === 0)
                          .map((customer) => {
                            const key = `${customer.orderId}-${product.productId}`;
                            const isProcessing = processingCredits[key];
                            const isSuccess = successCredits[key];

                            return (
                              <tr key={key} className="hover:bg-white transition-colors bg-white/30 group/row">
                                <td className="px-6 py-3 text-sm font-body font-medium text-gray-700">
                                  {customer.customerName}
                                </td>
                                <td className="px-6 py-3 text-sm font-body text-warm-gray">
                                  #{customer.orderId.slice(0, 8)}
                                </td>
                                <td className="px-6 py-3 text-sm font-display font-bold text-right text-primary-dark">
                                  {customer.quantity} {product.unit}
                                </td>
                                <td className="px-6 py-3 text-right print:hidden">
                                  <div className="flex items-center justify-end gap-3">
                                    {isSuccess ? (
                                      <span className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full animate-bounce-short">
                                        <Check size={14} /> Credited
                                      </span>
                                    ) : (
                                      <>
                                        <select
                                          disabled={isProcessing}
                                          value={selectedReasons[key] || 'Unassigned'}
                                          onChange={(e) => setSelectedReasons(prev => ({ ...prev, [key]: e.target.value }))}
                                          className="text-[11px] bg-white border border-gray-200 rounded px-2 py-1 outline-none focus:border-primary-dark transition-colors"
                                        >
                                          {CREDIT_REASONS.map(r => (
                                            <option key={r} value={r}>{r}</option>
                                          ))}
                                        </select>
                                        <Button
                                          onClick={() => handleCredit(customer.customerId, customer.orderId, product.productId, customer.quantity)}
                                          isLoading={isProcessing}
                                          variant="ghost"
                                          size="sm"
                                          className="text-error hover:bg-error/10 h-8 px-2"
                                          leftIcon={<CreditCard size={14} />}
                                        >
                                          Credit
                                        </Button>
                                      </>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </CardContent>
                )}
              </Card>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-cream/10 text-center print:hidden">
          <p className="text-[10px] font-overline text-warm-gray tracking-widest uppercase">
            End of Product Breakdown Report • {filteredData.length} Products Displayed
          </p>
        </div>
      </div>
    </div>
  );
}

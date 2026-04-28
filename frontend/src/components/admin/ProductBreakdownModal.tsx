import { useState, useMemo } from 'react';
import { Order } from '../../types/index.js';
import { Button, Input, Card, CardContent } from '../ui/index.js';
import { Search, ChevronDown, ChevronUp, Printer, X, CreditCard, Check, MinusCircle } from 'lucide-react';
import { useRecordShortDelivery } from '../../hooks/useAdminCredits.js';
import { useDeductItem, useQuotations } from '../../hooks/useAdminOrders.js';

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
    itemId: string;
    isQuotation: boolean;
    isDeducted?: boolean;
    deductedQuantity?: number;
    deductedReason?: string;
    effectiveQuantity: number;
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

const DEDUCT_REASONS = [
  'Unassigned',
  'Out of Stock',
  'Quality Issue',
  'Price Change',
  'Customer Request',
  'Supplier Short'
];

export default function ProductBreakdownModal({ onClose, orders, startDate, endDate }: ProductBreakdownModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedProducts, setExpandedProducts] = useState<Record<string, boolean>>({});
  const [selectedReasons, setSelectedReasons] = useState<Record<string, string>>({});
  const [processingCredits, setProcessingCredits] = useState<Record<string, boolean>>({});
  const [successCredits, setSuccessCredits] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<'all' | 'quotations' | 'orders'>('all');

  const recordShortDelivery = useRecordShortDelivery();
  const deductItem = useDeductItem();

  // Fetch quotations
  const { data: quotations } = useQuotations({
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });

  // Combine orders and quotations
  const allOrders = useMemo(() => {
    const combined = [...orders];
    if (quotations) {
      // Add isQuotation flag to quotations
      quotations.forEach((q: any) => {
        if (!combined.find(o => o.id === q.id)) {
          combined.push({ ...q, isQuotation: true });
        }
      });
    }
    return combined;
  }, [orders, quotations]);

  const aggregatedData = useMemo(() => {
    const products: Record<string, ProductAggregated> = {};

    allOrders.forEach((order: any) => {
      const isQuotation = order.isQuotation || (order.invoice?.status === 'unpaid');

      order.items.forEach((item: any) => {
        if (!item.product) return;

        const productId = item.productId;
        const isDeducted = item.isDeducted || false;
        const deductedQuantity = item.deductedQuantity || 0;
        const effectiveQuantity = isDeducted
          ? Math.max(0, item.quantity - deductedQuantity)
          : item.quantity;

        // Skip fully deducted items
        if (effectiveQuantity <= 0) return;

        if (!products[productId]) {
          products[productId] = {
            productId,
            productName: item.product?.name || 'Unknown Product',
            unit: item.product?.unit || 'unit',
            totalQuantity: 0,
            customers: [],
          };
        }

        products[productId].totalQuantity += effectiveQuantity;
        products[productId].customers.push({
          customerId: order.customerId,
          customerName: order.customerName || order.customer?.name || 'Unknown Customer',
          quantity: item.quantity,
          orderId: order.id,
          itemId: item.id,
          isQuotation,
          isDeducted,
          deductedQuantity,
          deductedReason: item.deductedReason,
          effectiveQuantity,
        });
      });
    });

    // Sort customers by name for each product
    Object.values(products).forEach(p => {
      p.customers.sort((a, b) => a.customerName.localeCompare(b.customerName));
    });

    return Object.values(products).sort((a, b) => a.productName.localeCompare(b.productName));
  }, [allOrders]);

  const filteredData = useMemo(() => {
    let filtered = aggregatedData.filter(p => {
      const matchesProduct = p.productName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCustomer = p.customers.some(c =>
        c.customerName.toLowerCase().includes(searchTerm.toLowerCase())
      );
      return matchesProduct || matchesCustomer;
    });

    // Filter by tab
    if (activeTab === 'quotations') {
      filtered = filtered.map(p => ({
        ...p,
        customers: p.customers.filter(c => c.isQuotation)
      })).filter(p => p.customers.length > 0);
    } else if (activeTab === 'orders') {
      filtered = filtered.map(p => ({
        ...p,
        customers: p.customers.filter(c => !c.isQuotation)
      })).filter(p => p.customers.length > 0);
    }

    return filtered;
  }, [aggregatedData, searchTerm, activeTab]);

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

  const handleDeduct = async (orderId: string, itemId: string, quantity: number) => {
    const reason = selectedReasons[`${orderId}-${itemId}`] || 'Unassigned';
    const key = `${orderId}-${itemId}`;

    setProcessingCredits(prev => ({ ...prev, [key]: true }));

    try {
      await deductItem.mutateAsync({
        orderId,
        itemId,
        quantity,
        reason,
      });

      setSuccessCredits(prev => ({ ...prev, [key]: true }));
      setTimeout(() => {
        setSuccessCredits(prev => ({ ...prev, [key]: false }));
      }, 3000);
    } catch (error) {
      console.error('Failed to deduct item:', error);
      alert('Failed to deduct item. Please try again.');
    } finally {
      setProcessingCredits(prev => ({ ...prev, [key]: false }));
    }
  };

  // Calculate totals
  const { totalQuotations, totalOrders, totalItems } = useMemo(() => {
    let qCount = 0;
    let oCount = 0;
    let itemsCount = 0;

    aggregatedData.forEach(p => {
      p.customers.forEach(c => {
        itemsCount += c.effectiveQuantity;
        if (c.isQuotation) qCount++;
        else oCount++;
      });
    });

    return { totalQuotations: qCount, totalOrders: oCount, totalItems: itemsCount };
  }, [aggregatedData]);

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
            <div className="flex gap-4 mt-2 text-xs text-warm-gray">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                {totalQuotations} Quotations
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                {totalOrders} Orders
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                {totalItems} Total Items
              </span>
            </div>
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

        {/* Tabs & Search */}
        <div className="p-6 border-b border-gray-50 print:hidden space-y-4">
          {/* Tabs */}
          <div className="flex gap-2">
            {(['all', 'quotations', 'orders'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? 'bg-primary-dark text-white'
                    : 'bg-gray-100 text-warm-gray hover:bg-gray-200'
                }`}
              >
                {tab === 'all' && 'All Items'}
                {tab === 'quotations' && (
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    Quotations Only
                  </span>
                )}
                {tab === 'orders' && (
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    Orders Only
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Search */}
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
                      <p className="text-sm text-warm-gray font-body">{product.customers.length} customers</p>
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
                          <th className="px-6 py-3 text-left text-[10px] font-bold text-warm-gray uppercase tracking-widest">Customer</th>
                          <th className="px-6 py-3 text-left text-[10px] font-bold text-warm-gray uppercase tracking-widest">Order ID</th>
                          <th className="px-6 py-3 text-left text-[10px] font-bold text-warm-gray uppercase tracking-widest">Type</th>
                          <th className="px-6 py-3 text-right text-[10px] font-bold text-warm-gray uppercase tracking-widest">Quantity</th>
                          <th className="px-6 py-3 text-right text-[10px] font-bold text-warm-gray uppercase tracking-widest print:hidden">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {product.customers
                          .filter(c =>
                            c.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            searchTerm.length === 0
                          )
                          .map((customer) => {
                            const key = `${customer.orderId}-${customer.itemId}`;
                            const isProcessing = processingCredits[key];
                            const isSuccess = successCredits[key];

                            return (
                              <tr
                                key={key}
                                className={`hover:bg-white transition-colors bg-white/30 group/row ${
                                  customer.isDeducted ? 'opacity-60 bg-red-50/30' : ''
                                }`}
                              >
                                <td className="px-6 py-3 text-sm font-body font-medium text-gray-700">
                                  {customer.customerName}
                                </td>
                                <td className="px-6 py-3 text-sm font-body text-warm-gray">
                                  #{customer.orderId.slice(0, 8)}
                                </td>
                                <td className="px-6 py-3 text-sm">
                                  {customer.isQuotation ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-full">
                                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                      Quotation
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-[10px] font-bold rounded-full">
                                      <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                      Order
                                    </span>
                                  )}
                                </td>
                                <td className="px-6 py-3 text-sm font-display font-bold text-right text-primary-dark">
                                  {customer.isDeducted ? (
                                    <div className="flex flex-col items-end">
                                      <span className="line-through text-red-500">{customer.quantity}</span>
                                      <span className="text-xs text-green-600">
                                        {customer.effectiveQuantity} {product.unit}
                                      </span>
                                      {customer.deductedReason && (
                                        <span className="text-[10px] text-red-500">
                                          Deduction: {customer.deductedReason}
                                        </span>
                                      )}
                                    </div>
                                  ) : (
                                    <span>{customer.quantity} {product.unit}</span>
                                  )}
                                </td>
                                <td className="px-6 py-3 text-right print:hidden">
                                  <div className="flex items-center justify-end gap-3">
                                    {isSuccess ? (
                                      <span className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full animate-bounce-short">
                                        <Check size={14} /> Done
                                      </span>
                                    ) : customer.isQuotation ? (
                                      // Quotation: Show Deduct button
                                      <>
                                        <select
                                          disabled={isProcessing || customer.isDeducted}
                                          value={selectedReasons[key] || 'Unassigned'}
                                          onChange={(e) => setSelectedReasons(prev => ({ ...prev, [key]: e.target.value }))}
                                          className="text-[11px] bg-white border border-gray-200 rounded px-2 py-1 outline-none focus:border-primary-dark transition-colors"
                                        >
                                          {DEDUCT_REASONS.map(r => (
                                            <option key={r} value={r}>{r}</option>
                                          ))}
                                        </select>
                                        <Button
                                          onClick={() => handleDeduct(customer.orderId, customer.itemId, customer.quantity)}
                                          isLoading={isProcessing}
                                          variant="ghost"
                                          size="sm"
                                          className="text-blue-600 hover:bg-blue-50 h-8 px-2"
                                          leftIcon={<MinusCircle size={14} />}
                                          disabled={customer.isDeducted}
                                        >
                                          {customer.isDeducted ? 'Deducted' : 'Deduct'}
                                        </Button>
                                      </>
                                    ) : (
                                      // Order: Show Credit button
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

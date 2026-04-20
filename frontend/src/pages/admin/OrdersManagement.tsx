import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Order } from '../../types/index.js';
import {
  useAdminOrders,
  useOrder,
  useUpdateOrderStatus,
  useUpdateOrder,
  useGenerateBulkOrder,
  useOrderWeeklyCollation,
  CollationItem,
} from '../../hooks/useAdminOrders.js';
import { useGenerateInvoice } from '../../hooks/useAdminInvoices.js';
import { useAdminUsers } from '../../hooks/useAdminUsers.js';
import { useProducts } from '../../hooks/useProducts.js';
import { useStockOrders, useStockOrder, useCreateStockOrder, useUpdateReceivedQuantities, useFulfillStockOrder } from '../../hooks/useStockOrders.js';
import { LayoutDashboard, FileText, Package, Filter, Download, Plus } from 'lucide-react';
import AddOrderModal from '../../components/admin/AddOrderModal.js';
import { Button, Input, Card, CardContent, Badge } from '../../components/ui/index.js';
import ProductBreakdownModal from '../../components/admin/ProductBreakdownModal.js';


export default function OrdersManagement() {
  const navigate = useNavigate();
  const [deliveryDateFilter, setDeliveryDateFilter] = useState('');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [bulkPackerId, setBulkPackerId] = useState('');
  const [bulkDriverId, setBulkDriverId] = useState('');
  const [bulkArea, setBulkArea] = useState('');
  const [showBulkOrderModal, setShowBulkOrderModal] = useState(false);
  const [showCollationModal, setShowCollationModal] = useState(false);
  const [showStockOrderModal, setShowStockOrderModal] = useState(false);
  const [showStockOrderListModal, setShowStockOrderListModal] = useState(false);
  const [selectedStockOrderId, setSelectedStockOrderId] = useState<string | null>(null);
  const [showProductBreakdownModal, setShowProductBreakdownModal] = useState(false);
  const [showAddOrderModal, setShowAddOrderModal] = useState(false);
  const [currentCollationReport, setCurrentCollationReport] = useState<CollationItem[] | null>(null);
  const [currentCollationDates, setCurrentCollationDates] = useState<{ startDate: string; endDate: string } | null>(null);

  const { data: orders, isLoading } = useAdminOrders({
    deliveryDate: deliveryDateFilter || undefined,
    startDate: startDateFilter || undefined,
    endDate: endDateFilter || undefined,
    status: statusFilter || undefined,
  });

  const { data: packers } = useAdminUsers('packer');
  const { data: drivers } = useAdminUsers('driver');
  const updateStatus = useUpdateOrderStatus();
  const updateOrder = useUpdateOrder();

  const handleStatusChange = async (id: string, status: Order['status']) => {
    try {
      await updateStatus.mutateAsync({ id, status });
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked && orders) {
      setSelectedOrders(orders.map(o => o.id));
    } else {
      setSelectedOrders([]);
    }
  };

  const handleSelectOrder = (id: string) => {
    setSelectedOrders(prev => 
      prev.includes(id) ? prev.filter(orderId => orderId !== id) : [...prev, id]
    );
  };

  const applyBulkEdit = async () => {
    if (selectedOrders.length === 0) return;
    
    // We update them sequentially to avoid overwhelming the backend
    for (const id of selectedOrders) {
      const updates: any = { id };
      if (bulkPackerId) updates.packerId = bulkPackerId;
      if (bulkDriverId) updates.driverId = bulkDriverId;
      if (bulkArea) updates.area = bulkArea;
      
      if (Object.keys(updates).length > 1) {
        await updateOrder.mutateAsync(updates);
      }
    }
    setSelectedOrders([]);
    setBulkPackerId('');
    setBulkDriverId('');
    setBulkArea('');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h1 className="font-display text-display-md text-primary-dark">Orders Management</h1>
          <p className="font-body text-body-md text-warm-gray mt-1 flex items-center gap-2">
            <LayoutDashboard size={16} /> Manage customer orders, packing, and dispatch.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 w-full lg:w-auto">
          <Button
            onClick={() => setShowCollationModal(true)}
            variant="harvest"
            size="md"
            leftIcon={<FileText size={18} />}
          >
            Weekly Collation
          </Button>
          <Button
            onClick={() => setShowProductBreakdownModal(true)}
            variant="secondary"
            size="md"
            className="bg-blue-50 border-blue-100 text-blue-700 hover:bg-blue-100"
            leftIcon={<Filter size={18} />}
          >
            Product Breakdown
          </Button>
          <Button
            onClick={() => setShowStockOrderListModal(true)}
            variant="secondary"
            size="md"
            className="bg-purple-50 border-purple-100 text-purple-700 hover:bg-purple-100"
            leftIcon={<Package size={18} />}
          >
            Stock Orders
          </Button>
          <Button
            onClick={() => setShowBulkOrderModal(true)}
            variant="secondary"
            size="md"
            className="bg-green-50 border-green-100 text-green-700 hover:bg-green-100"
            leftIcon={<Download size={18} />}
          >
            Generate Bulk Order
          </Button>
          <Button
            onClick={() => setShowAddOrderModal(true)}
            variant="harvest"
            size="md"
            leftIcon={<Plus size={18} />}
          >
            Add Order
          </Button>
        </div>
      </div>

      {/* Filters Card */}
      <Card className="border-light-gray/50 shadow-sm overflow-visible">
        <CardContent className="p-0">
          <div className="p-4 bg-cream/30 border-b border-light-gray flex items-center gap-2">
            <Filter size={16} className="text-warm-gray" />
            <span className="font-body text-body-sm font-semibold text-primary-dark">Advanced Filtering</span>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2">
              <label className="block font-body text-caption font-bold text-warm-gray uppercase tracking-wider">
                Specific Delivery Date
              </label>
              <Input
                type="date"
                value={deliveryDateFilter}
                onChange={(e) => {
                  setDeliveryDateFilter(e.target.value);
                  setStartDateFilter('');
                  setEndDateFilter('');
                }}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <label className="block font-body text-caption font-bold text-warm-gray uppercase tracking-wider">
                Status Filter
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-white border border-light-gray rounded-md px-4 py-3 text-body-sm text-primary-dark focus:border-primary-dark focus:ring-1 focus:ring-primary-dark outline-none transition-all"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="packed">Packed</option>
                <option value="out_for_delivery">Out for Delivery</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="block font-body text-caption font-bold text-warm-gray uppercase tracking-wider">
                Date Range Start
              </label>
              <Input
                type="date"
                value={startDateFilter}
                onChange={(e) => {
                  setStartDateFilter(e.target.value);
                  setDeliveryDateFilter('');
                }}
              />
            </div>

            <div className="space-y-2">
              <label className="block font-body text-caption font-bold text-warm-gray uppercase tracking-wider">
                Date Range End
              </label>
              <Input
                type="date"
                value={endDateFilter}
                onChange={(e) => {
                  setEndDateFilter(e.target.value);
                  setDeliveryDateFilter('');
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table - Desktop */}
      <div className="hidden md:block bg-white rounded-xl shadow-premium border border-light-gray/50 overflow-hidden">
        
        {/* Bulk Actions Bar */}
        {selectedOrders.length > 0 && (
          <div className="bg-sage-green/10 border-b border-light-gray/50 px-6 py-3 flex items-center justify-between">
            <div className="text-sm font-bold text-sage-green">
              {selectedOrders.length} orders selected
            </div>
            <div className="flex items-center gap-3">
              <select
                value={bulkPackerId}
                onChange={(e) => setBulkPackerId(e.target.value)}
                className="text-sm border border-gray-300 rounded px-3 py-1.5"
              >
                <option value="">Set Packer...</option>
                {packers?.map((packer) => (
                  <option key={packer.id} value={packer.id}>{packer.name}</option>
                ))}
              </select>
              <select
                value={bulkDriverId}
                onChange={(e) => setBulkDriverId(e.target.value)}
                className="text-sm border border-gray-300 rounded px-3 py-1.5"
              >
                <option value="">Set Driver...</option>
                {drivers?.map((driver) => (
                  <option key={driver.id} value={driver.id}>{driver.name}</option>
                ))}
              </select>
              <Input
                type="text"
                placeholder="Set Area..."
                value={bulkArea}
                onChange={(e) => setBulkArea(e.target.value)}
                className="w-32 py-1.5 !h-8"
              />
              <Button onClick={applyBulkEdit} variant="harvest" size="sm">
                Apply to {selectedOrders.length} Orders
              </Button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-light-gray">
            <thead className="bg-cream/30">
              <tr>
                <th className="px-6 py-4 text-left">
                  <input 
                    type="checkbox" 
                    onChange={handleSelectAll} 
                    checked={orders && orders.length > 0 && selectedOrders.length === orders.length}
                    className="rounded border-gray-300 shadow-sm"
                  />
                </th>
                <th className="px-6 py-4 text-left text-overline font-bold text-warm-gray uppercase tracking-widest">Order ID</th>
                <th className="px-6 py-4 text-left text-overline font-bold text-warm-gray uppercase tracking-widest">Customer</th>
                <th className="px-6 py-4 text-left text-overline font-bold text-warm-gray uppercase tracking-widest">Delivery</th>
                <th className="px-6 py-4 text-left text-overline font-bold text-warm-gray uppercase tracking-widest">Area</th>
                <th className="px-6 py-4 text-left text-overline font-bold text-warm-gray uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-left text-overline font-bold text-warm-gray uppercase tracking-widest">Packer</th>
                <th className="px-6 py-4 text-left text-overline font-bold text-warm-gray uppercase tracking-widest">Driver</th>
                <th className="px-6 py-4 text-left text-overline font-bold text-warm-gray uppercase tracking-widest">Items</th>
                <th className="px-6 py-4 text-left text-overline font-bold text-warm-gray uppercase tracking-widest">Packing</th>
                <th className="px-6 py-4 text-left text-overline font-bold text-warm-gray uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-light-gray">
              {orders?.map((order) => (
                <tr key={order.id} className={selectedOrders.includes(order.id) ? 'bg-sage-green/5' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input 
                      type="checkbox" 
                      checked={selectedOrders.includes(order.id)}
                      onChange={() => handleSelectOrder(order.id)}
                      className="rounded border-gray-300 shadow-sm"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {order.id.slice(0, 8)}...
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {order.customerName || order.customerId.slice(0, 8)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(order.deliveryDate).toLocaleDateString()}
                    <br/><span className="text-xs opacity-60 uppercase">{order.deliveryMethod}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <input
                      type="text"
                      className="text-sm border border-gray-300 rounded px-2 py-1 w-24"
                      placeholder="Area"
                      value={order.area || ''}
                      onChange={(e) => updateOrder.mutate({ id: order.id, area: e.target.value || null })}
                    />
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
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={order.driverId || ''}
                      onChange={(e) => updateOrder.mutate({ id: order.id, driverId: e.target.value || null })}
                      className="text-sm border border-gray-300 rounded px-2 py-1 w-32"
                    >
                      <option value="">Unassigned</option>
                      {drivers?.map((driver) => (
                        <option key={driver.id} value={driver.id}>
                          {driver.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {order.items.length} items
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex flex-col gap-1">
                      {order.items.some((i: any) => i.product?.packingType === 'fridge') && (
                        <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-1.5 py-0.5 rounded w-fit uppercase">Fridge</span>
                      )}
                      {order.items.some((i: any) => i.product?.packingType === 'freezer') && (
                        <span className="bg-indigo-100 text-indigo-800 text-[10px] font-bold px-1.5 py-0.5 rounded w-fit uppercase">Freezer</span>
                      )}
                      {(!order.items.some((i: any) => i.product?.packingType === 'fridge' || i.product?.packingType === 'freezer')) && (
                        <span className="bg-gray-100 text-gray-800 text-[10px] font-bold px-1.5 py-0.5 rounded w-fit uppercase">Standard</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex flex-col gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedOrderId(order.id)}
                        className="text-primary-dark hover:text-black justify-start px-2"
                      >
                        View Details
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate('/admin/short-delivery', { state: { customerId: order.customerId, orderId: order.id } })}
                        className="text-orange-600 hover:text-orange-700 justify-start px-2"
                      >
                        Adjust Items
                      </Button>
                    </div>
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
          <Card key={order.id} className="border-light-gray/50 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-display font-bold text-primary-dark">#{order.id.slice(0, 8)}</p>
                <p className="font-body text-body-sm text-warm-gray mt-0.5">{order.customerName || 'Unknown Customer'}</p>
              </div>
              <Badge variant={
                order.status === 'delivered' ? 'success' :
                  order.status === 'cancelled' ? 'error' :
                    order.status === 'pending' ? 'warning' : 'info'
              }>
                {order.status.replace('_', ' ')}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-body-sm font-body">
              <div className="flex flex-col">
                <span className="text-overline text-warm-gray uppercase">Date</span>
                <span className="text-primary-dark font-medium">{new Date(order.deliveryDate).toLocaleDateString()}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-overline text-warm-gray uppercase">Method</span>
                <span className="text-primary-dark font-medium capitalize">{order.deliveryMethod}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-overline text-warm-gray uppercase">Items</span>
                <span className="text-primary-dark font-medium">{order.items.length} items</span>
              </div>
              <div className="flex flex-col">
                <span className="text-overline text-warm-gray uppercase">Packing</span>
                <div className="flex gap-1 mt-0.5">
                  {order.items.some((i: any) => i.product?.packingType === 'fridge') && <Badge size="sm" variant="info">❄️ Fridge</Badge>}
                  {order.items.some((i: any) => i.product?.packingType === 'freezer') && <Badge size="sm" variant="info">🧊 Freezer</Badge>}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-2 pt-3 border-t border-light-gray/50">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-warm-gray uppercase">Packer</span>
                <select
                  value={order.packerId || ''}
                  onChange={(e) => updateOrder.mutate({ id: order.id, packerId: e.target.value || null })}
                  className="text-xs border border-light-gray rounded px-2 py-1 bg-white"
                >
                  <option value="">None</option>
                  {packers?.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-warm-gray uppercase">Driver</span>
                <select
                  value={order.driverId || ''}
                  onChange={(e) => updateOrder.mutate({ id: order.id, driverId: e.target.value || null })}
                  className="text-xs border border-light-gray rounded px-2 py-1 bg-white"
                >
                  <option value="">None</option>
                  {drivers?.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
            </div>

            <div className="pt-2 flex justify-between items-center gap-2">
              <select
                value={order.status}
                onChange={(e) => handleStatusChange(order.id, e.target.value as Order['status'])}
                className="text-body-sm font-medium border border-light-gray rounded-md px-3 py-2 flex-1 bg-white"
              >
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="packed">Packed</option>
                <option value="out_for_delivery">Out for Delivery</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>

              <div className="flex flex-col gap-1">
                <Button
                  size="sm"
                  onClick={() => setSelectedOrderId(order.id)}
                  variant="ghost"
                >
                  View
                </Button>
                <Button
                  size="sm"
                  onClick={() => navigate('/admin/short-delivery', { state: { customerId: order.customerId, orderId: order.id } })}
                  variant="ghost"
                  className="text-orange-600"
                >
                  Adjust
                </Button>
              </div>
            </div>
          </Card>
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

      {/* Collation Modal */}
      {showCollationModal && (
        <CollationModal
          onClose={() => setShowCollationModal(false)}
          onCreateStockOrder={(report, dates) => {
            setCurrentCollationReport(report);
            setCurrentCollationDates(dates);
            setShowCollationModal(false);
            setShowStockOrderModal(true);
          }}
        />
      )}

      {/* Stock Order Creation Modal */}
      {showStockOrderModal && currentCollationReport && currentCollationDates && (
        <StockOrderCreateModal
          report={currentCollationReport}
          dates={currentCollationDates}
          onClose={() => {
            setShowStockOrderModal(false);
            setCurrentCollationReport(null);
            setCurrentCollationDates(null);
          }}
        />
      )}

      {/* Stock Order List Modal */}
      {showStockOrderListModal && (
        <StockOrderListModal
          onClose={() => setShowStockOrderListModal(false)}
          onViewStockOrder={(id) => {
            setSelectedStockOrderId(id);
            setShowStockOrderListModal(false);
          }}
        />
      )}

      {/* Stock Order Detail Modal */}
      {selectedStockOrderId && (
        <StockOrderDetailModal
          stockOrderId={selectedStockOrderId}
          onClose={() => setSelectedStockOrderId(null)}
        />
      )}

      {/* Product Breakdown Modal */}
      {showProductBreakdownModal && orders && (
        <ProductBreakdownModal
          onClose={() => setShowProductBreakdownModal(false)}
          orders={orders}
          startDate={startDateFilter || deliveryDateFilter}
          endDate={endDateFilter}
        />
      )}

      {/* Add Order Modal */}
      {showAddOrderModal && (
        <AddOrderModal onClose={() => setShowAddOrderModal(false)} />
      )}
    </div>
  );
}

// ... OrderDetailModal ...

interface CollationModalProps {
  onClose: () => void;
  onCreateStockOrder?: (report: CollationItem[], dates: { startDate: string; endDate: string }) => void;
}

function CollationModal({ onClose, onCreateStockOrder }: CollationModalProps) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [report, setReport] = useState<CollationItem[] | null>(null);
  const generateCollation = useOrderWeeklyCollation();

  const handleGenerate = async () => {
    if (!startDate || !endDate) {
      alert('Please select a date range');
      return;
    }
    const result = await generateCollation.mutateAsync({ startDate, endDate });
    setReport(result);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-lg p-4 md:p-6 w-full max-w-full mx-4 md:max-w-4xl max-h-[90vh] overflow-y-auto print:max-w-none print:max-h-none print:shadow-none">
        <div className="flex justify-between items-center mb-6 print:hidden">
          <h2 className="text-2xl font-bold text-gray-900">Weekly Collation Report</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Print Header */}
        <div className="hidden print:block mb-8">
          <h1 className="text-3xl font-bold">Weekly Procurement List</h1>
          <p className="text-gray-600">Period: {new Date(startDate).toLocaleDateString()} - {new Date(endDate).toLocaleDateString()}</p>
        </div>

        {!report ? (
          <div className="space-y-4 print:hidden">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={handleGenerate}
                disabled={generateCollation.isPending}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {generateCollation.isPending ? 'Generating...' : 'Generate Report'}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Group by Supplier */}
            {Array.from(new Set(report.map(i => i.supplierName))).sort().map(supplierName => {
              const supplierItems = report.filter(i => i.supplierName === supplierName);
              return (
                <div key={supplierName} className="space-y-2 break-inside-avoid shadow-sm rounded-lg border border-gray-100 p-4 bg-white">
                  <h3 className="text-xl font-bold text-blue-900 flex items-center gap-2 mb-4">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    {supplierName}
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 border rounded-lg overflow-hidden">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-r">Category</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-r">Product</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider border-r">Total Qty</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Orders</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {supplierItems.map((item, index) => (
                          <tr key={`${item.productId}-${index}`} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50 hover:bg-blue-50/30 transition-colors'}>
                            <td className="px-4 py-2 text-sm text-gray-500 border-r capitalize font-medium">{item.categoryId.replace('_', ' ')}</td>
                            <td className="px-4 py-2 text-sm font-bold text-gray-900 border-r">{item.productName}</td>
                            <td className="px-4 py-2 text-sm text-right text-gray-900 border-r">
                              <span className="font-bold text-base">{item.totalQuantity}</span> <span className="text-gray-500 text-xs font-normal ml-1">{item.unit}</span>
                            </td>
                            <td className="px-4 py-2 text-sm text-right text-gray-600 font-medium">{item.orderCount}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex justify-end pt-2">
                    <p className="text-xs text-gray-400 font-medium">Total: {supplierItems.length} products to procure from {supplierName}</p>
                  </div>
                </div>
              );
            })}
            <div className="flex justify-end gap-3 print:hidden">
              <button
                onClick={() => setReport(null)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Back
              </button>
              {onCreateStockOrder && (
                <button
                  onClick={() => onCreateStockOrder(report, { startDate, endDate })}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Create Stock Order
                </button>
              )}
              <button
                onClick={handlePrint}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Print Report
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface OrderDetailModalProps {
  orderId: string;
  onClose: () => void;
}

function OrderDetailModal({ orderId, onClose }: OrderDetailModalProps) {
  const { data: order, isLoading } = useOrder(orderId);
  const { data: products } = useProducts();
  const generateInvoice = useGenerateInvoice();
  const updateOrder = useUpdateOrder();

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

  const handleUpdateItems = async (items: any[]) => {
    try {
      await updateOrder.mutateAsync({ id: orderId, items });
    } catch (error) {
      console.error('Failed to update items:', error);
      alert('Failed to update items');
    }
  };

  const removeItem = (itemId: string) => {
    if (!order) return;
    const newItems = order.items
      .filter((i: any) => i.id !== itemId)
      .map((i: any) => ({
        productId: i.productId,
        quantity: i.quantity,
        priceAtOrder: i.priceAtOrder
      }));
    handleUpdateItems(newItems);
  };

  const addItem = (productId: string) => {
    const product = products?.find(p => p.id === productId);
    if (!product) return;

    const existing = (order?.items || []).find((i: any) => i.productId === productId);
    if (existing) {
      const newItems = order!.items.map((i: any) => {
        if (i.productId === productId) {
          return {
            productId: i.productId,
            quantity: i.quantity + 1,
            priceAtOrder: i.priceAtOrder
          };
        }
        return {
          productId: i.productId,
          quantity: i.quantity,
          priceAtOrder: i.priceAtOrder
        };
      });
      handleUpdateItems(newItems);
    } else {
      const newItems = [
        ...(order?.items || []).map((i: any) => ({
          productId: i.productId,
          quantity: i.quantity,
          priceAtOrder: i.priceAtOrder
        })),
        {
          productId: product.id,
          quantity: 1,
          priceAtOrder: Number(product.price)
        }
      ];
      handleUpdateItems(newItems);
    }
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity < 0 || !order) return;
    const newItems = order.items.map((i: any) => ({
      productId: i.productId,
      quantity: i.id === itemId ? quantity : i.quantity,
      priceAtOrder: i.priceAtOrder
    }));
    handleUpdateItems(newItems);
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

  const total = order.items.reduce((sum: number, item: any) => sum + (Number(item.priceAtOrder) * item.quantity), 0) + Number(order.deliveryFees || 0);

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
            <div className="mt-2 flex gap-2">
              {order.items.some((i: any) => i.product?.packingType === 'fridge') && (
                <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded-full uppercase">Requires Fridge</span>
              )}
              {order.items.some((i: any) => i.product?.packingType === 'freezer') && (
                <span className="bg-indigo-100 text-indigo-800 text-xs font-bold px-2 py-1 rounded-full uppercase">Requires Freezer</span>
              )}
            </div>
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
            {order.deliveryInstruction && (
              <p className="text-sm text-gray-600">
                Placement: <span className="font-bold underline">{order.deliveryInstruction.replace('_', ' ')}</span>
              </p>
            )}
            {order.coolerBagOption && (
              <p className="text-sm text-blue-600 font-bold">
                ✓ Includes Cooler Bag
              </p>
            )}
            {order.groupDelivery && (
              <p className="text-sm text-green-600 font-bold">
                ✓ Group Delivery Eligible
              </p>
            )}
          </div>

          {/* Items */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Order Items</h3>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Product
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Qty
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Price
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Subtotal
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {order.items.map((item: any) => (
                    <tr key={item.id}>
                      <td className="px-4 py-2 text-sm text-gray-900">
                        {item.product?.name || 'Deleted Product'}
                        <div className="flex gap-1 mt-1">
                          {item.product?.packingType === 'fridge' && <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase">Fridge</span>}
                          {item.product?.packingType === 'freezer' && <span className="bg-indigo-100 text-indigo-800 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase">Freezer</span>}
                        </div>
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-500">
                        <div className="flex items-center gap-2">
                          <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="p-1 hover:bg-gray-100 rounded">-</button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="p-1 hover:bg-gray-100 rounded">+</button>
                          <span className="text-xs">{item.product?.unit}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-500">
                        R {Number(item.priceAtOrder).toFixed(2)}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900 font-medium">
                        R {(Number(item.priceAtOrder) * item.quantity).toFixed(2)}
                      </td>
                      <td className="px-4 py-2 text-right">
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-red-500 hover:text-red-700 text-xs font-bold"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-green-50/30">
                    <td colSpan={5} className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-green-700 whitespace-nowrap">Add Item:</span>
                        <select
                          className="flex-1 text-sm border-2 border-green-100 rounded-lg p-1.5 focus:border-green-300 outline-none"
                          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                            if (e.target.value) {
                              addItem(e.target.value);
                              e.target.value = '';
                            }
                          }}
                        >
                          <option value="">Select a product to add...</option>
                          {products?.filter(p => !(order?.items || []).some((oi: any) => oi.productId === p.id)).map(p => (
                            <option key={p.id} value={p.id}>{p.name} - R{Number(p.price).toFixed(2)}</option>
                          ))}
                        </select>
                      </div>
                    </td>
                  </tr>
                  {!order.invoice && order.status !== 'cancelled' && (
                    <tr>
                      <td colSpan={4} className="px-4 py-2 text-right">
                        <a
                          href={`/api/invoices/order/${order.id}/proforma`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center px-4 py-2 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 text-sm font-medium"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          Download Proforma
                        </a>
                      </td>
                    </tr>
                  )}
                  {Number(order.deliveryFees) > 0 && (
                    <tr>
                      <td colSpan={3} className="px-4 py-2 text-right text-sm text-gray-500">
                        Delivery Fee:
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-500">
                        R {Number(order.deliveryFees).toFixed(2)}
                      </td>
                    </tr>
                  )}
                  <tr>
                    <td colSpan={3} className="px-4 py-2 text-right font-semibold">
                      Total:
                    </td>
                    <td className="px-4 py-2 font-semibold">R {total.toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Mobile List View */}
            <div className="md:hidden space-y-3">
              {order.items.map((item: any) => (
                <div key={item.id} className="bg-white border rounded-lg p-3 shadow-sm flex justify-between items-center">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-gray-900 text-lg">{item.quantity} {item.product?.unit}</span>
                      {item.product?.packingType === 'fridge' && <span className="bg-blue-100 text-blue-800 text-xs font-bold px-1.5 py-0.5 rounded">❄️ Fridge</span>}
                      {item.product?.packingType === 'freezer' && <span className="bg-indigo-100 text-indigo-800 text-xs font-bold px-1.5 py-0.5 rounded">🧊 Freezer</span>}
                    </div>
                    <p className="text-gray-800 font-medium leading-tight">{item.product?.name || 'Deleted Product'}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-gray-400 text-xs text-nowrap">
                      R {Number(item.priceAtOrder).toFixed(0)}/{item.product?.unit}
                    </div>
                  </div>
                </div>
              ))}
              <div className="border-t pt-3 flex justify-between items-center font-bold text-lg">
                <span>Total</span>
                <span>R {total.toFixed(2)}</span>
              </div>
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
            <div className="flex gap-3 w-full sm:w-auto">
              {!order.invoice && (
                <a
                  href={`/api/invoices/order/${order.id}/proforma`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-center flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Proforma
                </a>
              )}
              <button
                onClick={handleGenerateInvoice}
                disabled={generateInvoice.isPending}
                className="flex-1 sm:flex-none px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-center"
              >
                {generateInvoice.isPending ? 'Generating...' : 'Generate Invoice'}
              </button>
            </div>
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
  bulkOrder: {
    weekStartDate: string;
    items: Array<{
      productName: string;
      finalQuantity: number;
      totalQuantity: number;
      bufferQuantity: number;
    }>;
  };
  formatted: {
    whatsapp: string;
    email: string;
    emailText: string;
  };
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
    return format === 'whatsapp' ? bulkOrder.formatted.whatsapp : bulkOrder.formatted.emailText;
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

// ============ Stock Order Modal Components ============

interface StockOrderListModalProps {
  onClose: () => void;
  onViewStockOrder: (id: string) => void;
}

function StockOrderListModal({ onClose, onViewStockOrder }: StockOrderListModalProps) {
  const { data: stockOrders, isLoading } = useStockOrders();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'partial': return 'bg-orange-100 text-orange-800';
      case 'received': return 'bg-blue-100 text-blue-800';
      case 'fulfilled': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-4 md:p-6 w-full max-w-full mx-4 md:max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Stock Orders</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {!stockOrders || stockOrders.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No stock orders found.
          </div>
        ) : (
          <div className="space-y-4">
            {stockOrders.map((order) => (
              <div
                key={order.id}
                className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                onClick={() => onViewStockOrder(order.id)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-gray-900">
                      Week of {new Date(order.weekStartDate).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-500">
                      {order.supplierName || 'No supplier'} • {order.items.length} items
                    </p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

interface StockOrderCreateModalProps {
  report: CollationItem[];
  dates: { startDate: string; endDate: string };
  onClose: () => void;
}

function StockOrderCreateModal({ report, dates, onClose }: StockOrderCreateModalProps) {
  const [supplierName, setSupplierName] = useState('');
  const [notes, setNotes] = useState('');
  const createStockOrder = useCreateStockOrder();

  const handleCreate = async () => {
    try {
      const items = report.map(item => ({
        productId: item.productId,
        productName: item.productName,
        category: item.categoryId,
        unit: item.unit,
        orderedQuantity: item.totalQuantity,
        pricePerUnit: 0,
      }));

      await createStockOrder.mutateAsync({
        weekStartDate: dates.startDate,
        supplierName: supplierName || undefined,
        items,
        notes: notes || undefined,
      });

      alert('Stock order created successfully!');
      onClose();
    } catch (error) {
      console.error('Failed to create stock order:', error);
      alert('Failed to create stock order');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-4 md:p-6 w-full max-w-full mx-4 md:max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Create Stock Order</h2>
        <p className="text-gray-600 mb-4">
          Week: {new Date(dates.startDate).toLocaleDateString()} - {new Date(dates.endDate).toLocaleDateString()}
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Supplier Name (optional)</label>
            <input
              type="text"
              value={supplierName}
              onChange={(e) => setSupplierName(e.target.value)}
              placeholder="e.g., Fresh Farm Suppliers"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional notes..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">Items Summary</h3>
            <p className="text-sm text-gray-600">{report.length} products to order</p>
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4">
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={createStockOrder.isPending}
              className="w-full sm:w-auto px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              {createStockOrder.isPending ? 'Creating...' : 'Create Stock Order'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface StockOrderDetailModalProps {
  stockOrderId: string;
  onClose: () => void;
}

function StockOrderDetailModal({ stockOrderId, onClose }: StockOrderDetailModalProps) {
  const { data: stockOrder, isLoading, refetch } = useStockOrder(stockOrderId);
  const { data: products } = useProducts();
  const updateReceived = useUpdateReceivedQuantities();
  const fulfillOrder = useFulfillStockOrder();
  const [receivedQuantities, setReceivedQuantities] = useState<Record<string, number>>({});
  const [showFulfillConfirm, setShowFulfillConfirm] = useState(false);

  if (stockOrder && Object.keys(receivedQuantities).length === 0) {
    const initial: Record<string, number> = {};
    stockOrder.items.forEach(item => {
      initial[item.id] = item.receivedQuantity || item.orderedQuantity;
    });
    setReceivedQuantities(initial);
  }

  const handleUpdateReceived = async () => {
    try {
      const items = Object.entries(receivedQuantities).map(([itemId, qty]) => ({
        stockOrderItemId: itemId,
        receivedQuantity: qty,
      }));

      await updateReceived.mutateAsync({ stockOrderId, items });
      refetch();
      alert('Quantities updated successfully!');
    } catch (error) {
      console.error('Failed to update quantities:', error);
      alert('Failed to update quantities');
    }
  };

  const handleFulfill = async () => {
    try {
      await fulfillOrder.mutateAsync(stockOrderId);
      refetch();
      setShowFulfillConfirm(false);
      alert('Stock order fulfilled! Credits applied.');
    } catch (error) {
      console.error('Failed to fulfill order:', error);
      alert('Failed to fulfill order');
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  if (!stockOrder) return null;

  const shortDeliveries = stockOrder.items.filter(item => item.isShort);
  const totalCredits = shortDeliveries.reduce((sum, item) => sum + Number(item.creditAmount), 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-4 md:p-6 w-full max-w-full mx-4 md:max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Stock Order Details</h2>
            <p className="text-gray-500">
              Week of {new Date(stockOrder.weekStartDate).toLocaleDateString()}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-500">Items</p>
            <p className="text-xl font-bold text-gray-900">{stockOrder.totalItems}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-500">Ordered</p>
            <p className="text-xl font-bold text-gray-900">R{Number(stockOrder.totalOrdered).toFixed(2)}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-500">Received</p>
            <p className="text-xl font-bold text-gray-900">R{Number(stockOrder.totalReceived).toFixed(2)}</p>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg">
            <p className="text-sm text-orange-700">Credits</p>
            <p className="text-xl font-bold text-orange-900">R{Number(stockOrder.totalCredits).toFixed(2)}</p>
          </div>
        </div>

        <div className="overflow-x-auto mb-6">
          <table className="min-w-full divide-y divide-gray-200 border">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Supplier</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Ordered</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Received</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Short</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {stockOrder.items.map((item) => {
                const product = products?.find(p => p.id === item.productId);
                const supplierName = product?.supplier?.name || '-';
                return (
                  <tr key={item.id} className={item.isShort ? 'bg-orange-50' : ''}>
                    <td className="px-4 py-2 text-sm text-gray-900">{item.productName}</td>
                    <td className="px-4 py-2 text-sm text-gray-500">{supplierName}</td>
                    <td className="px-4 py-2 text-sm text-right text-gray-900">{item.orderedQuantity}</td>
                    <td className="px-4 py-2 text-sm">
                      <input
                        type="number"
                        min={0}
                        max={item.orderedQuantity}
                        value={receivedQuantities[item.id] ?? item.orderedQuantity}
                        onChange={(e) => setReceivedQuantities({
                          ...receivedQuantities,
                          [item.id]: parseInt(e.target.value) || 0
                        })}
                        className="w-20 px-2 py-1 text-right border border-gray-300 rounded"
                      />
                    </td>
                    <td className={`px-4 py-2 text-sm text-right ${item.isShort ? 'text-orange-600 font-semibold' : 'text-gray-500'}`}>
                      {item.isShort ? item.shortQuantity : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col-reverse sm:flex-row justify-between gap-3">
          <button onClick={onClose} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
            Close
          </button>
          <div className="flex gap-2">
            <button onClick={handleUpdateReceived} disabled={updateReceived.isPending} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {updateReceived.isPending ? 'Saving...' : 'Save'}
            </button>
            {stockOrder.status !== 'fulfilled' && (
              <button onClick={() => setShowFulfillConfirm(true)} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                Fulfill
              </button>
            )}
          </div>
        </div>

        {showFulfillConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4">
            <div className="bg-white rounded-lg p-6 max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirm Fulfillment</h3>
              <p className="text-gray-600 mb-4">Apply credits of R{totalCredits.toFixed(2)} to affected customers?</p>
              <div className="flex gap-3 justify-end">
                <button onClick={() => setShowFulfillConfirm(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg">Cancel</button>
                <button onClick={handleFulfill} disabled={fulfillOrder.isPending} className="px-4 py-2 bg-green-600 text-white rounded-lg disabled:opacity-50">
                  {fulfillOrder.isPending ? 'Processing...' : 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

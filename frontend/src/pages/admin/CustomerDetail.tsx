import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAdminCustomer, useUpdateAdminCustomer, CustomerProfile } from '../../hooks/useAdminCustomers';

type TabType = 'info' | 'orders' | 'invoices' | 'payments' | 'credits';

export default function CustomerDetail() {
  const { customerId } = useParams<{ customerId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('info');
  
  const { data: customer, isLoading } = useAdminCustomer(customerId!, true);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Customer not found</p>
        <button
          onClick={() => navigate('/admin/customers')}
          className="mt-4 text-green-600 hover:text-green-700"
        >
          Back to Customers
        </button>
      </div>
    );
  }

  const customerProfile = customer as CustomerProfile;

  const tabs = [
    { id: 'info' as TabType, label: 'Info', icon: '👤' },
    { id: 'orders' as TabType, label: 'Orders', icon: '📦', count: customerProfile.orderHistory?.length },
    { id: 'invoices' as TabType, label: 'Invoices', icon: '💰', count: customerProfile.invoices?.length },
    { id: 'payments' as TabType, label: 'Payments', icon: '💳', count: customerProfile.paymentHistory?.length },
    { id: 'credits' as TabType, label: 'Credits', icon: '🎁' },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/admin/customers')}
          className="text-green-600 hover:text-green-700 mb-4 flex items-center"
        >
          ← Back to Customers
        </button>
        
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{customerProfile.name}</h1>
            <p className="text-gray-600 mt-1">
              {customerProfile.phone || customerProfile.email}
            </p>
          </div>
          
          {/* Credit Balance Badge */}
          <div className="bg-green-50 border-2 border-green-500 rounded-lg p-4 text-center">
            <div className="text-sm text-gray-600 mb-1">Credit Balance</div>
            <div className="text-2xl font-bold text-green-600">
              R {customerProfile.creditBalance?.toFixed(2) || '0.00'}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2
                ${
                  activeTab === tab.id
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full text-xs">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'info' && <InfoTab customer={customerProfile} />}
        {activeTab === 'orders' && <OrdersTab orders={customerProfile.orderHistory} />}
        {activeTab === 'invoices' && <InvoicesTab invoices={customerProfile.invoices} />}
        {activeTab === 'payments' && <PaymentsTab payments={customerProfile.paymentHistory} />}
        {activeTab === 'credits' && <CreditsTab customerId={customerProfile.id} creditBalance={customerProfile.creditBalance} />}
      </div>
    </div>
  );
}

// Info Tab Component
interface InfoTabProps {
  customer: CustomerProfile;
}

function InfoTab({ customer }: InfoTabProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: customer.name,
    email: customer.email || '',
    phone: customer.phone || '',
    address: customer.address || '',
    deliveryPreference: customer.deliveryPreference,
  });

  const updateCustomer = useUpdateAdminCustomer();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await updateCustomer.mutateAsync({
        customerId: customer.id,
        data: formData,
      });
      setIsEditing(false);
      alert('Customer updated successfully!');
    } catch (error) {
      alert('Failed to update customer');
    }
  };

  if (isEditing) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Edit Customer Info</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address
            </label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Delivery Preference
            </label>
            <select
              value={formData.deliveryPreference}
              onChange={(e) => setFormData({ ...formData, deliveryPreference: e.target.value as 'delivery' | 'collection' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            >
              <option value="delivery">Delivery</option>
              <option value="collection">Collection</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateCustomer.isPending}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {updateCustomer.isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Customer Information</h2>
        <button
          onClick={() => setIsEditing(true)}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          Edit Info
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-500 mb-1">Name</label>
          <p className="text-gray-900">{customer.name}</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-500 mb-1">Phone</label>
          <p className="text-gray-900">{customer.phone || '-'}</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-500 mb-1">Email</label>
          <p className="text-gray-900">{customer.email || '-'}</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-500 mb-1">Delivery Preference</label>
          <p className="text-gray-900 capitalize">{customer.deliveryPreference}</p>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-500 mb-1">Address</label>
          <p className="text-gray-900">{customer.address || '-'}</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-500 mb-1">Customer Since</label>
          <p className="text-gray-900">{new Date(customer.createdAt).toLocaleDateString()}</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-500 mb-1">Last Updated</label>
          <p className="text-gray-900">{new Date(customer.updatedAt).toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  );
}

// Orders Tab Component
interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  priceAtOrder: number;
}

interface OrderData {
  id: string;
  deliveryDate: string;
  deliveryMethod: string;
  status: string;
  items: OrderItem[];
  createdAt: string;
}

interface OrdersTabProps {
  orders: OrderData[];
}

function OrdersTab({ orders }: OrdersTabProps) {
  if (!orders || orders.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 text-center text-gray-500">
        No orders found
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Order History</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Order Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Delivery Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Items
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Delivery Method
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {orders.map((order) => (
              <tr key={order.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {new Date(order.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {new Date(order.deliveryDate).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {order.items?.length || 0} items
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                    order.status === 'packed' ? 'bg-blue-100 text-blue-800' :
                    order.status === 'confirmed' ? 'bg-yellow-100 text-yellow-800' :
                    order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {order.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                  {order.deliveryMethod}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Invoices Tab Component
interface InvoiceData {
  id: string;
  orderId: string;
  subtotal: number;
  creditApplied: number;
  total: number;
  status: string;
  dueDate: string;
  createdAt: string;
}

interface InvoicesTabProps {
  invoices: InvoiceData[];
}

function InvoicesTab({ invoices }: InvoicesTabProps) {
  if (!invoices || invoices.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 text-center text-gray-500">
        No invoices found
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Invoices</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Invoice Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Subtotal
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Credit Applied
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Total
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Due Date
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {invoices.map((invoice) => (
              <tr key={invoice.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {new Date(invoice.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  R {invoice.subtotal.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                  {invoice.creditApplied > 0 ? `-R ${invoice.creditApplied.toFixed(2)}` : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                  R {invoice.total.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                    invoice.status === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {invoice.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {new Date(invoice.dueDate).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Payments Tab Component
interface PaymentData {
  id: string;
  amount: number;
  method: string;
  paymentDate: string;
  notes: string | null;
  createdAt: string;
}

interface PaymentsTabProps {
  payments: PaymentData[];
}

function PaymentsTab({ payments }: PaymentsTabProps) {
  if (!payments || payments.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 text-center text-gray-500">
        No payments found
      </div>
    );
  }

  // Calculate running balance
  let runningBalance = 0;
  const paymentsWithBalance = [...payments]
    .sort((a, b) => new Date(a.paymentDate).getTime() - new Date(b.paymentDate).getTime())
    .map((payment) => {
      runningBalance += payment.amount;
      return {
        ...payment,
        runningBalance,
      };
    });

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment History</h2>
        <p className="text-sm text-gray-600">
          Total Paid: <span className="font-semibold text-green-600">R {runningBalance.toFixed(2)}</span>
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Payment Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Method
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Running Balance
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Notes
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paymentsWithBalance.map((payment) => (
              <tr key={payment.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {new Date(payment.paymentDate).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                  R {payment.amount.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 uppercase">
                  {payment.method}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                  R {payment.runningBalance.toFixed(2)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {payment.notes || '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Credits Tab Component
interface CreditsTabProps {
  customerId: string;
  creditBalance: number;
}

function CreditsTab({ creditBalance }: CreditsTabProps) {

  return (
    <div className="space-y-6">
      {/* Current Credit Balance */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Current Credit Balance</h2>
        <div className="bg-green-50 border-2 border-green-500 rounded-lg p-6 text-center">
          <div className="text-3xl font-bold text-green-600">
            R {creditBalance.toFixed(2)}
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Available credit to apply to future invoices
          </p>
        </div>
      </div>

      {/* Credit Information */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">About Credits</h2>
        <div className="space-y-3 text-sm text-gray-600">
          <p>
            <strong>Overpayments:</strong> When a customer pays more than the invoice amount, 
            the excess is automatically added to their credit balance.
          </p>
          <p>
            <strong>Short Deliveries:</strong> When products are not delivered as ordered, 
            credits are issued for the missing items.
          </p>
          <p>
            <strong>Automatic Application:</strong> Credits are automatically applied to new 
            invoices, reducing the amount due.
          </p>
        </div>
      </div>

      {/* Credit History Note */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          💡 <strong>Tip:</strong> View the Payments and Invoices tabs to see how credits 
          have been applied and earned over time.
        </p>
      </div>
    </div>
  );
}

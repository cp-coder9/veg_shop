import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAdminCustomer, useUpdateAdminCustomer, CustomerProfile } from '../../hooks/useAdminCustomers';
import { Button, Input, Card, CardContent, Badge, Select, Textarea } from '@/components/ui';
import { ArrowLeft, User, Package, DollarSign, CreditCard, Gift } from 'lucide-react';

type TabType = 'info' | 'orders' | 'invoices' | 'payments' | 'credits';

export default function CustomerDetail() {
  const { customerId } = useParams<{ customerId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('info');
  
  const { data: customer, isLoading } = useAdminCustomer(customerId!, true);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-terracotta"></div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="text-center py-12">
        <p className="font-body text-body-md text-warm-gray">Customer not found</p>
        <button
          onClick={() => navigate('/admin/customers')}
          className="mt-4 text-terracotta hover:text-terracotta/80 font-body font-medium transition-colors"
        >
          Back to Customers
        </button>
      </div>
    );
  }

  const customerProfile = customer as CustomerProfile;

  const tabs = [
    { id: 'info' as TabType, label: 'Info', icon: User, count: undefined },
    { id: 'orders' as TabType, label: 'Orders', icon: Package, count: customerProfile.orderHistory?.length },
    { id: 'invoices' as TabType, label: 'Invoices', icon: DollarSign, count: customerProfile.invoices?.length },
    { id: 'payments' as TabType, label: 'Payments', icon: CreditCard, count: customerProfile.paymentHistory?.length },
    { id: 'credits' as TabType, label: 'Credits', icon: Gift, count: undefined },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/admin/customers')}
          className="text-terracotta hover:text-terracotta/80 mb-4 flex items-center gap-2 font-body text-body-md transition-colors"
        >
          <ArrowLeft size={18} />
          Back to Customers
        </button>
        
        <div className="flex justify-between items-start">
          <div>
            <h1 className="font-display text-display-sm text-primary-dark">{customerProfile.name}</h1>
            <p className="font-body text-body-md text-warm-gray mt-1">
              {customerProfile.phone || customerProfile.email}
            </p>
          </div>
          
          {/* Credit Balance Badge */}
          <Card className="bg-sage-green/10 border-2 border-sage-green">
            <CardContent className="p-4 text-center">
              <div className="font-accent text-caption text-warm-gray uppercase mb-1">Credit Balance</div>
              <div className="font-display text-display-sm text-sage-green">
                R {customerProfile.creditBalance?.toFixed(2) || '0.00'}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-light-gray mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                py-4 px-1 border-b-2 font-accent text-caption uppercase tracking-wide flex items-center gap-2 transition-colors
                ${
                  activeTab === tab.id
                    ? 'border-terracotta text-terracotta'
                    : 'border-transparent text-warm-gray hover:text-primary-dark hover:border-light-gray'
                }
              `}
            >
              <tab.icon size={18} />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <Badge variant="default">{tab.count}</Badge>
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
      <Card>
        <CardContent className="p-6">
          <h2 className="font-display text-body-lg text-primary-dark mb-4">Edit Customer Info</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="font-accent text-caption text-warm-gray uppercase tracking-wide mb-2 block">
                Name *
              </label>
              <Input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div>
              <label className="font-accent text-caption text-warm-gray uppercase tracking-wide mb-2 block">
                Phone
              </label>
              <Input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div>
              <label className="font-accent text-caption text-warm-gray uppercase tracking-wide mb-2 block">
                Email
              </label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div>
              <label className="font-accent text-caption text-warm-gray uppercase tracking-wide mb-2 block">
                Address
              </label>
              <Textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                rows={3}
              />
            </div>

            <div>
              <label className="font-accent text-caption text-warm-gray uppercase tracking-wide mb-2 block">
                Delivery Preference
              </label>
              <Select
                value={formData.deliveryPreference}
                onChange={(e) => setFormData({ ...formData, deliveryPreference: e.target.value as 'delivery' | 'collection' })}
                options={[
                  { value: 'delivery', label: 'Delivery' },
                  { value: 'collection', label: 'Collection' }
                ]}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                onClick={() => setIsEditing(false)}
                variant="secondary"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={updateCustomer.isPending}
              >
                {updateCustomer.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-display text-body-lg text-primary-dark">Customer Information</h2>
          <Button
            onClick={() => setIsEditing(true)}
            variant="primary"
          >
            Edit Info
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="font-accent text-caption text-warm-gray uppercase tracking-wide mb-1 block">Name</label>
            <p className="font-body text-body-md text-primary-dark">{customer.name}</p>
          </div>

          <div>
            <label className="font-accent text-caption text-warm-gray uppercase tracking-wide mb-1 block">Phone</label>
            <p className="font-body text-body-md text-primary-dark">{customer.phone || '-'}</p>
          </div>

          <div>
            <label className="font-accent text-caption text-warm-gray uppercase tracking-wide mb-1 block">Email</label>
            <p className="font-body text-body-md text-primary-dark">{customer.email || '-'}</p>
          </div>

          <div>
            <label className="font-accent text-caption text-warm-gray uppercase tracking-wide mb-1 block">Delivery Preference</label>
            <p className="font-body text-body-md text-primary-dark capitalize">{customer.deliveryPreference}</p>
          </div>

          <div className="md:col-span-2">
            <label className="font-accent text-caption text-warm-gray uppercase tracking-wide mb-1 block">Address</label>
            <p className="font-body text-body-md text-primary-dark">{customer.address || '-'}</p>
          </div>

          <div>
            <label className="font-accent text-caption text-warm-gray uppercase tracking-wide mb-1 block">Customer Since</label>
            <p className="font-body text-body-md text-primary-dark">{new Date(customer.createdAt).toLocaleDateString()}</p>
          </div>

          <div>
            <label className="font-accent text-caption text-warm-gray uppercase tracking-wide mb-1 block">Last Updated</label>
            <p className="font-body text-body-md text-primary-dark">{new Date(customer.updatedAt).toLocaleDateString()}</p>
          </div>
        </div>
      </CardContent>
    </Card>
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
      <Card>
        <CardContent className="p-6 text-center">
          <p className="font-body text-body-md text-warm-gray">No orders found</p>
        </CardContent>
      </Card>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'delivered':
        return <Badge variant="success">{status}</Badge>;
      case 'packed':
        return <Badge variant="info">{status}</Badge>;
      case 'confirmed':
        return <Badge variant="warning">{status}</Badge>;
      case 'cancelled':
        return <Badge variant="error">{status}</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  return (
    <Card padding="none">
      <CardContent className="p-6">
        <h2 className="font-display text-body-lg text-primary-dark mb-4">Order History</h2>
      </CardContent>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-light-gray">
          <thead className="bg-cream">
            <tr>
              <th className="px-6 py-3 text-left font-accent text-caption text-warm-gray uppercase tracking-wide">
                Order Date
              </th>
              <th className="px-6 py-3 text-left font-accent text-caption text-warm-gray uppercase tracking-wide">
                Delivery Date
              </th>
              <th className="px-6 py-3 text-left font-accent text-caption text-warm-gray uppercase tracking-wide">
                Items
              </th>
              <th className="px-6 py-3 text-left font-accent text-caption text-warm-gray uppercase tracking-wide">
                Status
              </th>
              <th className="px-6 py-3 text-left font-accent text-caption text-warm-gray uppercase tracking-wide">
                Delivery Method
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-light-gray">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-cream/50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap font-body text-body-sm text-primary-dark">
                  {new Date(order.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap font-body text-body-sm text-primary-dark">
                  {new Date(order.deliveryDate).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap font-body text-body-sm text-primary-dark">
                  {order.items?.length || 0} items
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(order.status)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap font-body text-body-sm text-primary-dark capitalize">
                  {order.deliveryMethod}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

// Invoices Tab Component
interface InvoiceData {
  id: string;
  orderId: string;
  subtotal: number | string;
  creditApplied: number | string;
  total: number | string;
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
      <Card>
        <CardContent className="p-6 text-center">
          <p className="font-body text-body-md text-warm-gray">No invoices found</p>
        </CardContent>
      </Card>
    );
  }

  // Helper to safely convert to number
  const toNum = (val: number | string): number => {
    if (typeof val === 'number') return val;
    return parseFloat(val) || 0;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge variant="success">{status}</Badge>;
      case 'partial':
        return <Badge variant="warning">{status}</Badge>;
      default:
        return <Badge variant="error">{status}</Badge>;
    }
  };

  return (
    <Card padding="none">
      <CardContent className="p-6">
        <h2 className="font-display text-body-lg text-primary-dark mb-4">Invoices</h2>
      </CardContent>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-light-gray">
          <thead className="bg-cream">
            <tr>
              <th className="px-6 py-3 text-left font-accent text-caption text-warm-gray uppercase tracking-wide">
                Invoice Date
              </th>
              <th className="px-6 py-3 text-left font-accent text-caption text-warm-gray uppercase tracking-wide">
                Subtotal
              </th>
              <th className="px-6 py-3 text-left font-accent text-caption text-warm-gray uppercase tracking-wide">
                Credit Applied
              </th>
              <th className="px-6 py-3 text-left font-accent text-caption text-warm-gray uppercase tracking-wide">
                Total
              </th>
              <th className="px-6 py-3 text-left font-accent text-caption text-warm-gray uppercase tracking-wide">
                Status
              </th>
              <th className="px-6 py-3 text-left font-accent text-caption text-warm-gray uppercase tracking-wide">
                Due Date
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-light-gray">
            {invoices.map((invoice) => (
              <tr key={invoice.id} className="hover:bg-cream/50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap font-body text-body-sm text-primary-dark">
                  {new Date(invoice.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap font-body text-body-sm text-primary-dark">
                  R {toNum(invoice.subtotal).toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap font-body text-body-sm text-sage-green">
                  {toNum(invoice.creditApplied) > 0 ? `-R ${toNum(invoice.creditApplied).toFixed(2)}` : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap font-body text-body-sm font-semibold text-primary-dark">
                  R {toNum(invoice.total).toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(invoice.status)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap font-body text-body-sm text-primary-dark">
                  {new Date(invoice.dueDate).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
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
      <Card>
        <CardContent className="p-6 text-center">
          <p className="font-body text-body-md text-warm-gray">No payments found</p>
        </CardContent>
      </Card>
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
    <Card padding="none">
      <CardContent className="p-6">
        <h2 className="font-display text-body-lg text-primary-dark mb-4">Payment History</h2>
        <p className="font-body text-body-sm text-warm-gray">
          Total Paid: <span className="font-semibold text-sage-green">R {runningBalance.toFixed(2)}</span>
        </p>
      </CardContent>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-light-gray">
          <thead className="bg-cream">
            <tr>
              <th className="px-6 py-3 text-left font-accent text-caption text-warm-gray uppercase tracking-wide">
                Payment Date
              </th>
              <th className="px-6 py-3 text-left font-accent text-caption text-warm-gray uppercase tracking-wide">
                Amount
              </th>
              <th className="px-6 py-3 text-left font-accent text-caption text-warm-gray uppercase tracking-wide">
                Method
              </th>
              <th className="px-6 py-3 text-left font-accent text-caption text-warm-gray uppercase tracking-wide">
                Running Balance
              </th>
              <th className="px-6 py-3 text-left font-accent text-caption text-warm-gray uppercase tracking-wide">
                Notes
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-light-gray">
            {paymentsWithBalance.map((payment) => (
              <tr key={payment.id} className="hover:bg-cream/50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap font-body text-body-sm text-primary-dark">
                  {new Date(payment.paymentDate).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap font-body text-body-sm font-semibold text-sage-green">
                  R {payment.amount.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap font-body text-body-sm text-primary-dark uppercase">
                  {payment.method}
                </td>
                <td className="px-6 py-4 whitespace-nowrap font-body text-body-sm font-semibold text-primary-dark">
                  R {payment.runningBalance.toFixed(2)}
                </td>
                <td className="px-6 py-4 font-body text-body-sm text-warm-gray">
                  {payment.notes || '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
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
      <Card>
        <CardContent className="p-6">
          <h2 className="font-display text-body-lg text-primary-dark mb-4">Current Credit Balance</h2>
          <div className="bg-sage-green/10 border-2 border-sage-green rounded-lg p-6 text-center">
            <div className="font-display text-display-sm text-sage-green">
              R {creditBalance.toFixed(2)}
            </div>
            <p className="font-body text-body-sm text-warm-gray mt-2">
              Available credit to apply to future invoices
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Credit Information */}
      <Card>
        <CardContent className="p-6">
          <h2 className="font-display text-body-lg text-primary-dark mb-4">About Credits</h2>
          <div className="space-y-3 font-body text-body-sm text-warm-gray">
            <p>
              <strong className="text-primary-dark">Overpayments:</strong> When a customer pays more than the invoice amount, 
              the excess is automatically added to their credit balance.
            </p>
            <p>
              <strong className="text-primary-dark">Short Deliveries:</strong> When products are not delivered as ordered, 
              credits are issued for the missing items.
            </p>
            <p>
              <strong className="text-primary-dark">Automatic Application:</strong> Credits are automatically applied to new 
              invoices, reducing the amount due.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Credit History Note */}
      <div className="bg-info/10 border border-info/30 rounded-lg p-4">
        <p className="font-body text-body-sm text-primary-dark">
          💡 <strong>Tip:</strong> View the Payments and Invoices tabs to see how credits 
          have been applied and earned over time.
        </p>
      </div>
    </div>
  );
}

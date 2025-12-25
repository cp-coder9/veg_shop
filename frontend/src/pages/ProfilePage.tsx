import { useState, useMemo } from 'react';
import { useCustomerProfile, useUpdateCustomer, useCustomerInvoices } from '../hooks/useCustomer';
import { Invoice } from '../types';
import { toNumber, isInvoiceOverdue, getDaysOverdue } from '../lib/utils';
import CustomerInvoiceDetailModal from '../components/invoices/CustomerInvoiceDetailModal';
import { useDownloadInvoicePDF } from '../hooks/useInvoicePDF';

export default function ProfilePage() {
  const { data: profile, isLoading } = useCustomerProfile();
  const { data: invoices } = useCustomerInvoices();
  const updateCustomer = useUpdateCustomer();
  const downloadPDF = useDownloadInvoicePDF();

  const [isEditing, setIsEditing] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    deliveryPreference: 'delivery' as 'delivery' | 'collection',
  });

  const handleEdit = () => {
    if (profile) {
      setFormData({
        name: profile.name,
        email: profile.email || '',
        phone: profile.phone || '',
        address: profile.address || '',
        deliveryPreference: profile.deliveryPreference,
      });
      setIsEditing(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateCustomer.mutateAsync(formData);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  // Sort invoices: overdue first, then by date (newest first)
  const sortedInvoices = useMemo(() => {
    if (!invoices) return [];
    
    return [...invoices].sort((a, b) => {
      const aOverdue = isInvoiceOverdue(a.dueDate, a.status);
      const bOverdue = isInvoiceOverdue(b.dueDate, b.status);
      
      // Overdue invoices come first
      if (aOverdue && !bOverdue) return -1;
      if (!aOverdue && bOverdue) return 1;
      
      // Then sort by creation date (newest first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [invoices]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg">
        Failed to load profile. Please try again later.
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">My Profile</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Credit Balance Card */}
        <div className="lg:col-span-1">
          <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg shadow-lg p-6">
            <h2 className="text-lg font-semibold mb-2">Credit Balance</h2>
            <p className="text-4xl font-bold">R{toNumber(profile.creditBalance).toFixed(2)}</p>
            <p className="text-sm mt-2 opacity-90">
              Available for your next order
            </p>
          </div>
        </div>

        {/* Profile Information */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Personal Information</h2>
              {!isEditing && (
                <button
                  onClick={handleEdit}
                  className="text-green-600 hover:text-green-700 font-semibold"
                >
                  Edit
                </button>
              )}
            </div>

            {isEditing ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Delivery Preference
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="delivery"
                        checked={formData.deliveryPreference === 'delivery'}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            deliveryPreference: e.target.value as 'delivery',
                          })
                        }
                        className="mr-2"
                      />
                      <span>Delivery</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="collection"
                        checked={formData.deliveryPreference === 'collection'}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            deliveryPreference: e.target.value as 'collection',
                          })
                        }
                        className="mr-2"
                      />
                      <span>Collection</span>
                    </label>
                  </div>
                </div>

                {updateCustomer.isError && (
                  <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
                    Failed to update profile. Please try again.
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={updateCustomer.isPending}
                    className="flex-1 bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
                  >
                    {updateCustomer.isPending ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-300 transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Name</p>
                  <p className="font-semibold text-gray-900">{profile.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-semibold text-gray-900">{profile.email || 'Not set'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="font-semibold text-gray-900">{profile.phone || 'Not set'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Address</p>
                  <p className="font-semibold text-gray-900">{profile.address || 'Not set'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Delivery Preference</p>
                  <p className="font-semibold text-gray-900">
                    {profile.deliveryPreference === 'delivery' ? 'Delivery' : 'Collection'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Invoice History */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Invoice History</h2>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {sortedInvoices && sortedInvoices.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Invoice
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Due Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Credit Applied
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
                  {sortedInvoices.map((invoice: Invoice) => {
                    const overdue = isInvoiceOverdue(invoice.dueDate, invoice.status);
                    const daysOverdue = overdue ? getDaysOverdue(invoice.dueDate) : 0;
                    
                    return (
                      <tr 
                        key={invoice.id} 
                        className={`hover:bg-gray-50 ${overdue ? 'bg-red-50' : ''}`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          #{invoice.id.slice(0, 8)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {new Date(invoice.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex flex-col">
                            <span className={overdue ? 'text-red-600 font-semibold' : 'text-gray-600'}>
                              {new Date(invoice.dueDate).toLocaleDateString()}
                            </span>
                            {overdue && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-red-600 text-white mt-1">
                                OVERDUE {daysOverdue} {daysOverdue === 1 ? 'day' : 'days'}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                          R{toNumber(invoice.total).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {toNumber(invoice.creditApplied) > 0 ? `R${toNumber(invoice.creditApplied).toFixed(2)}` : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${
                              invoice.status === 'paid'
                                ? 'bg-green-100 text-green-800'
                                : invoice.status === 'partial'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex gap-3">
                            <button
                              onClick={() => setSelectedInvoiceId(invoice.id)}
                              className="text-green-600 hover:text-green-700 font-semibold"
                            >
                              View Details
                            </button>
                            <button
                              onClick={() => downloadPDF.mutate({ invoiceId: invoice.id })}
                              disabled={downloadPDF.isPending}
                              className="text-blue-600 hover:text-blue-700 font-semibold disabled:text-gray-400 disabled:cursor-not-allowed"
                              title="Download PDF"
                            >
                              {downloadPDF.isPending ? 'Downloading...' : 'Download'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-600">
              No invoices yet
            </div>
          )}
        </div>
      </div>

      {/* Invoice Detail Modal */}
      {selectedInvoiceId && (
        <CustomerInvoiceDetailModal
          invoiceId={selectedInvoiceId}
          onClose={() => setSelectedInvoiceId(null)}
        />
      )}
    </div>
  );
}

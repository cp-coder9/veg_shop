import { useState } from 'react';
import { useCustomerProfile, useUpdateCustomer, useCustomerInvoices } from '../hooks/useCustomer';
import { formatPrice } from '../lib/utils';
import { toast } from 'react-hot-toast';
import { Button, Input, Card, CardHeader, Badge } from '../components/ui';

export default function ProfilePage() {
  const { data: profile, isLoading } = useCustomerProfile();
  const { data: invoices } = useCustomerInvoices();
  const updateCustomer = useUpdateCustomer();

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  });

  const handleEdit = () => {
    if (profile) {
      setEditForm({
        name: profile.name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        address: profile.address || '',
      });
      setIsEditing(true);
    }
  };

  const handleSave = async () => {
    try {
      await updateCustomer.mutateAsync(editForm);
      toast.success('Profile updated successfully!');
      setIsEditing(false);
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="loading-spinner h-12 w-12 mx-auto animate-spin rounded-full border-4 border-light-gray border-t-terracotta"></div>
          <p className="mt-4 font-body text-body-md text-warm-gray">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="bg-red-50 text-error px-4 py-3 rounded-lg border border-error/20 font-body">
        Failed to load profile. Please try again later.
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="font-display text-display-md text-primary-dark">My Profile</h1>
        {!isEditing && (
          <Button variant="secondary" onClick={handleEdit}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            Edit
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Information */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader
              title="Account Information"
              subtitle="Your personal details and preferences"
            />

            {isEditing ? (
              <div className="space-y-4">
                <Input
                  label="Full Name"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                />
                <Input
                  label="Email"
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                />
                <Input
                  label="Phone"
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                />
                <Input
                  label="Address"
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                />

                <div className="flex gap-3 pt-4">
                  <Button onClick={handleSave} isLoading={updateCustomer.isPending}>
                    Save Changes
                  </Button>
                  <Button variant="ghost" onClick={handleCancel}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="font-accent text-caption text-warm-gray uppercase tracking-wider mb-1">Full Name</p>
                    <p className="font-body text-body-md text-primary-dark">{profile.name || 'Not set'}</p>
                  </div>
                  <div>
                    <p className="font-accent text-caption text-warm-gray uppercase tracking-wider mb-1">Email</p>
                    <p className="font-body text-body-md text-primary-dark">{profile.email || 'Not set'}</p>
                  </div>
                  <div>
                    <p className="font-accent text-caption text-warm-gray uppercase tracking-wider mb-1">Phone</p>
                    <p className="font-body text-body-md text-primary-dark">{profile.phone || 'Not set'}</p>
                  </div>
                  <div>
                    <p className="font-accent text-caption text-warm-gray uppercase tracking-wider mb-1">Delivery Preference</p>
                    <p className="font-body text-body-md text-primary-dark capitalize">
                      {profile.deliveryPreference || 'Not set'}
                    </p>
                  </div>
                </div>

                {profile.address && (
                  <div>
                    <p className="font-accent text-caption text-warm-gray uppercase tracking-wider mb-1">Address</p>
                    <p className="font-body text-body-md text-primary-dark">{profile.address}</p>
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>

        {/* Credit Balance */}
        <div className="lg:col-span-1">
          <Card className="bg-sage-green/10 border-sage-green/20">
            <div className="text-center">
              <div className="w-16 h-16 bg-sage-green/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-sage-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="font-accent text-caption text-warm-gray uppercase tracking-wider mb-1">Credit Balance</p>
              <p className="font-display text-display-sm text-sage-green font-bold">
                R{formatPrice(profile.creditBalance || 0)}
              </p>
              <p className="font-body text-body-sm text-warm-gray mt-2">
                Credits are automatically applied to your next order
              </p>
            </div>
          </Card>
        </div>
      </div>

      {/* Invoice History */}
      <Card>
        <CardHeader
          title="Invoice History"
          subtitle="View your past invoices and payments"
        />

        {!invoices || invoices.length === 0 ? (
          <div className="text-center py-8">
            <svg className="w-12 h-12 mx-auto text-warm-gray mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="font-body text-body-md text-warm-gray">No invoices yet</p>
            <p className="font-body text-body-sm text-warm-gray mt-1">
              Your invoice history will appear here after your first order
            </p>
          </div>
        ) : (
          <div className="divide-y divide-light-gray">
            {invoices.map((invoice: { id: string; createdAt: Date | string; dueDate: Date | string; total: number; creditApplied: number; status: string }) => (
              <div key={invoice.id} className="py-4 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="font-body text-body-md font-bold text-primary-dark">
                    Invoice #{invoice.id.slice(0, 8)}
                  </p>
                  <p className="font-accent text-caption text-warm-gray">
                    {new Date(invoice.createdAt).toLocaleDateString('en-ZA')}
                    {' • '}
                    Due: {new Date(invoice.dueDate).toLocaleDateString('en-ZA')}
                  </p>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="font-body text-body-md font-bold text-primary-dark">
                      R{formatPrice(invoice.total)}
                    </p>
                    {invoice.creditApplied > 0 && (
                      <p className="font-accent text-caption text-sage-green">
                        Credit applied: R{formatPrice(invoice.creditApplied)}
                      </p>
                    )}
                  </div>
                  <Badge variant={invoice.status === 'paid' ? 'success' : invoice.status === 'pending' ? 'warning' : 'error'}>
                    {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

import { useState } from 'react';
import { useAuthStore } from '../../stores/authStore.js';
import api from '../../lib/api.js';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Input, Card, CardHeader, CardContent, Textarea } from '../../components/ui/index.js';

interface UpdateProfileData {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
}

export default function AdminProfile() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
  });

  const updateProfile = useMutation({
    mutationFn: async (data: UpdateProfileData) => {
      const response = await api.put(`/customers/${user?.id}`, data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      useAuthStore.getState().setUser(data);
      setIsEditing(false);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile.mutateAsync(formData);
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="font-display text-display-sm text-primary-dark">Admin Profile</h1>
        <p className="font-body text-body-md text-warm-gray mt-1">Manage your account settings</p>
      </div>

      <Card>
        <CardHeader
          title="Profile Information"
          action={!isEditing ? (
            <Button
              onClick={() => {
                setFormData({
                  name: user.name,
                  email: user.email || '',
                  phone: user.phone || '',
                  address: user.address || '',
                });
                setIsEditing(true);
              }}
              variant="primary"
            >
              Edit Profile
            </Button>
          ) : undefined}
        />
        <CardContent>
          {isEditing ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="font-accent text-caption text-warm-gray uppercase tracking-wide mb-2 block">
                  Name
                </label>
                <Input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <label htmlFor="email" className="font-accent text-caption text-warm-gray uppercase tracking-wide mb-2 block">
                  Email
                </label>
                <Input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div>
                <label htmlFor="phone" className="font-accent text-caption text-warm-gray uppercase tracking-wide mb-2 block">
                  Phone
                </label>
                <Input
                  type="tel"
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <div>
                <label htmlFor="address" className="font-accent text-caption text-warm-gray uppercase tracking-wide mb-2 block">
                  Address
                </label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={3}
                />
              </div>

              {updateProfile.isError && (
                <div className="bg-error/10 text-error px-4 py-3 rounded-lg font-body text-body-sm">
                  Failed to update profile. Please try again.
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  type="submit"
                  variant="primary"
                  disabled={updateProfile.isPending}
                >
                  {updateProfile.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  variant="secondary"
                >
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="font-accent text-caption text-warm-gray uppercase tracking-wide mb-1">Name</p>
                  <p className="font-body text-body-md text-primary-dark font-medium">{user.name}</p>
                </div>
                <div>
                  <p className="font-accent text-caption text-warm-gray uppercase tracking-wide mb-1">Role</p>
                  <p className="font-body text-body-md text-primary-dark font-medium capitalize">{user.role}</p>
                </div>
                <div>
                  <p className="font-accent text-caption text-warm-gray uppercase tracking-wide mb-1">Email</p>
                  <p className="font-body text-body-md text-primary-dark font-medium">{user.email || 'Not set'}</p>
                </div>
                <div>
                  <p className="font-accent text-caption text-warm-gray uppercase tracking-wide mb-1">Phone</p>
                  <p className="font-body text-body-md text-primary-dark font-medium">{user.phone || 'Not set'}</p>
                </div>
                <div className="col-span-2">
                  <p className="font-accent text-caption text-warm-gray uppercase tracking-wide mb-1">Address</p>
                  <p className="font-body text-body-md text-primary-dark font-medium">{user.address || 'Not set'}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

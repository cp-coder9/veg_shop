import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
    Users,
    Trash2,
    Edit2,
    Plus,
    Truck,
    Package
} from 'lucide-react';
import api from '../../lib/api';

interface User {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    role: 'packer' | 'driver';
    createdAt: string;
}

interface StaffFormData {
    name: string;
    email: string;
    phone: string;
    role: 'packer' | 'driver';
    password?: string;
}

const StaffManagement = () => {
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<'packer' | 'driver'>('packer');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [formData, setFormData] = useState<StaffFormData>({
        name: '',
        email: '',
        phone: '',
        role: 'packer',
        password: ''
    });

    const { data: staff, isLoading } = useQuery<{ data: User[] }>({
        queryKey: ['staff', activeTab],
        queryFn: async () => {
            const response = await api.get(`/admin/users?role=${activeTab}`);
            // api.get returns data directly in some configs, but let's assume standard axio response structure or the configured interceptor
            // If the interceptor unwraps it, we might just get the array.
            // Based on previous code, let's assume it returns the data array directly if configured that way, 
            // OR we need to check how other admin pages do it. 
            // The `useAdminOrders` hook uses `api.get('/admin/orders')` and expects correct data.
            return response;
        }
    });

    // Safe access to array
    const users = Array.isArray(staff) ? staff : (staff as any)?.data || [];

    const createMutation = useMutation({
        mutationFn: (data: StaffFormData) => api.post('/admin/users', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['staff'] });
            toast.success('Staff member created successfully');
            handleCloseModal();
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error?.message || 'Failed to create staff');
        }
    });

    const updateMutation = useMutation({
        mutationFn: (data: { id: string; data: Partial<StaffFormData> }) =>
            api.patch(`/admin/users/${data.id}`, data.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['staff'] });
            toast.success('Staff member updated successfully');
            handleCloseModal();
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error?.message || 'Failed to update staff');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => api.delete(`/admin/users/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['staff'] });
            toast.success('Staff member deleted successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error?.message || 'Failed to delete staff');
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingUser) {
            updateMutation.mutate({ id: editingUser.id, data: formData });
        } else {
            createMutation.mutate(formData);
        }
    };

    const handleEdit = (user: User) => {
        setEditingUser(user);
        setFormData({
            name: user.name,
            email: user.email || '',
            phone: user.phone || '',
            role: user.role,
            password: '' // Don't show password
        });
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingUser(null);
        setFormData({
            name: '',
            email: '',
            phone: '',
            role: activeTab,
            password: ''
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-display font-bold text-gray-900">Staff Management</h1>
                    <p className="text-gray-500">Manage packers and drivers</p>
                </div>
                <button
                    onClick={() => {
                        setFormData(prev => ({ ...prev, role: activeTab }));
                        setIsModalOpen(true);
                    }}
                    className="btn btn-primary flex items-center gap-2"
                >
                    <Plus size={20} />
                    Add {activeTab === 'packer' ? 'Packer' : 'Driver'}
                </button>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                    <button
                        onClick={() => setActiveTab('packer')}
                        className={`
              whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2
              ${activeTab === 'packer'
                                ? 'border-brand-500 text-brand-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
            `}
                    >
                        <Package size={18} />
                        Packers
                    </button>
                    <button
                        onClick={() => setActiveTab('driver')}
                        className={`
              whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2
              ${activeTab === 'driver'
                                ? 'border-brand-500 text-brand-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
            `}
                    >
                        <Truck size={18} />
                        Drivers
                    </button>
                </nav>
            </div>

            {/* List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {isLoading ? (
                    <div className="p-8 text-center text-gray-500">Loading staff...</div>
                ) : users.length === 0 ? (
                    <div className="p-12 text-center">
                        <Users className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900">No {activeTab}s found</h3>
                        <p className="text-gray-500 mt-1">Get started by creating a new {activeTab}.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-200">
                        {users.map((user: User) => (
                            <div key={user.id} className="p-6 flex items-center justify-between hover:bg-gray-50">
                                <div className="flex-1">
                                    <h3 className="text-lg font-medium text-gray-900">{user.name}</h3>
                                    <div className="mt-1 flex items-center gap-4 text-sm text-gray-500">
                                        <span>{user.email}</span>
                                        {user.phone && (
                                            <>
                                                <span className="w-1 h-1 rounded-full bg-gray-300" />
                                                <span>{user.phone}</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => handleEdit(user)}
                                        className="p-2 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                                        title="Edit"
                                    >
                                        <Edit2 size={18} />
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (confirm('Are you sure you want to delete this user?')) {
                                                deleteMutation.mutate(user.id);
                                            }
                                        }}
                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Delete"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl max-w-md w-full p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">
                            {editingUser ? 'Edit Staff Member' : `Add New ${activeTab === 'packer' ? 'Packer' : 'Driver'}`}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                                    placeholder="John Doe"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                                <input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                                    placeholder="john@vegshop.com"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                                    placeholder="+27..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Password {editingUser && '(Leave blank to keep unchanged)'}
                                </label>
                                <input
                                    type="password"
                                    required={!editingUser}
                                    minLength={6}
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                                    placeholder="••••••"
                                />
                            </div>

                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={createMutation.isPending || updateMutation.isPending}
                                    className="btn btn-primary px-6"
                                >
                                    {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save Staff Member'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StaffManagement;

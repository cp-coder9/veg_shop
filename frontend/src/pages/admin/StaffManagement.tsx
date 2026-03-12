import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
    Users,
    Trash2,
    Edit2,
    Plus,
    Truck,
    Package,
    Shield,
    ShieldOff,
    History
} from 'lucide-react';
import api from '../../lib/api';
import StaffHistoryModal from '../../components/StaffHistoryModal';
import { Button, Input, Card, Badge, Modal, Select } from '@/components/ui';

interface User {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    role: 'packer' | 'driver';
    status: 'active' | 'inactive';
    createdAt: string;
}

interface StaffFormData {
    name: string;
    email: string;
    phone: string;
    role: 'packer' | 'driver';
    status: 'active' | 'inactive';
    password?: string;
}

const StaffManagement = () => {
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<'packer' | 'driver'>('packer');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [historyUser, setHistoryUser] = useState<User | null>(null);
    const [formData, setFormData] = useState<StaffFormData>({
        name: '',
        email: '',
        phone: '',
        role: 'packer',
        status: 'active',
        password: ''
    });

    const { data: staff, isLoading } = useQuery<{ data: User[] }>({
        queryKey: ['staff', activeTab],
        queryFn: async () => {
            const response = await api.get(`/admin/users?role=${activeTab}`);
            return response;
        }
    });

    const users = Array.isArray(staff) ? staff : (staff as unknown as { data: User[] })?.data || [];

    const createMutation = useMutation({
        mutationFn: (data: StaffFormData) => api.post('/admin/users', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['staff'] });
            toast.success('Staff member created successfully');
            handleCloseModal();
        },
        onError: (error: unknown) => {
            const err = error as { response?: { data?: { error?: { message?: string } } } };
            toast.error(err.response?.data?.error?.message || 'Failed to create staff');
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
        onError: (error: unknown) => {
            const err = error as { response?: { data?: { error?: { message?: string } } } };
            toast.error(err.response?.data?.error?.message || 'Failed to update staff');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => api.delete(`/admin/users/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['staff'] });
            toast.success('Staff member deleted successfully');
        },
        onError: (error: unknown) => {
            const err = error as { response?: { data?: { error?: { message?: string } } } };
            toast.error(err.response?.data?.error?.message || 'Failed to delete staff');
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

    const handleToggleStatus = (user: User) => {
        const newStatus = user.status === 'active' ? 'inactive' : 'active';
        updateMutation.mutate({ id: user.id, data: { status: newStatus } });
    };

    const handleEdit = (user: User) => {
        setEditingUser(user);
        setFormData({
            name: user.name,
            email: user.email || '',
            phone: user.phone || '',
            role: user.role,
            status: user.status,
            password: ''
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
            status: 'active',
            password: ''
        });
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex justify-between items-center">
                <div className="mb-6">
                    <h1 className="font-display text-display-sm text-primary-dark">Staff Management</h1>
                    <p className="font-body text-body-md text-warm-gray mt-1">Manage packers and drivers</p>
                </div>
                <Button
                    onClick={() => {
                        setFormData(prev => ({ ...prev, role: activeTab }));
                        setIsModalOpen(true);
                    }}
                    variant="primary"
                    className="flex items-center gap-2"
                >
                    <Plus size={20} />
                    Add {activeTab === 'packer' ? 'Packer' : 'Driver'}
                </Button>
            </div>

            {/* Tabs */}
            <div className="border-b border-light-gray">
                <nav className="-mb-px flex space-x-8">
                    <button
                        onClick={() => setActiveTab('packer')}
                        className={`
                            whitespace-nowrap pb-4 px-1 border-b-2 font-accent text-caption uppercase tracking-wide flex items-center gap-2 transition-colors
                            ${activeTab === 'packer'
                                ? 'border-terracotta text-terracotta'
                                : 'border-transparent text-warm-gray hover:text-primary-dark hover:border-light-gray'}
                        `}
                    >
                        <Package size={18} />
                        Packers
                    </button>
                    <button
                        onClick={() => setActiveTab('driver')}
                        className={`
                            whitespace-nowrap pb-4 px-1 border-b-2 font-accent text-caption uppercase tracking-wide flex items-center gap-2 transition-colors
                            ${activeTab === 'driver'
                                ? 'border-terracotta text-terracotta'
                                : 'border-transparent text-warm-gray hover:text-primary-dark hover:border-light-gray'}
                        `}
                    >
                        <Truck size={18} />
                        Drivers
                    </button>
                </nav>
            </div>

            {/* List */}
            <Card padding="none">
                {isLoading ? (
                    <div className="p-8 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-terracotta mx-auto"></div>
                        <p className="font-body text-body-md text-warm-gray mt-4">Loading staff...</p>
                    </div>
                ) : users.length === 0 ? (
                    <div className="p-12 text-center">
                        <Users className="mx-auto h-12 w-12 text-light-gray mb-4" />
                        <h3 className="font-display text-body-lg text-primary-dark">No {activeTab}s found</h3>
                        <p className="font-body text-body-md text-warm-gray mt-1">Get started by creating a new {activeTab}.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-light-gray">
                        {users.map((user: User) => (
                            <div
                                key={user.id}
                                className={`p-6 flex items-center justify-between hover:bg-cream/50 transition-colors ${user.status === 'inactive' ? 'opacity-60 bg-light-gray/30' : ''}`}
                            >
                                <div className="flex-1">
                                    <div className="flex items-center gap-3">
                                        <h3 className="font-body text-body-lg font-medium text-primary-dark">{user.name}</h3>
                                        <Badge variant={user.status === 'active' ? 'success' : 'default'}>
                                            {user.status}
                                        </Badge>
                                    </div>
                                    <div className="mt-1 flex items-center gap-4 font-body text-body-sm text-warm-gray">
                                        <span>{user.email}</span>
                                        {user.phone && (
                                            <>
                                                <span className="w-1 h-1 rounded-full bg-light-gray" />
                                                <span>{user.phone}</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setHistoryUser(user)}
                                        className="p-2 text-warm-gray hover:text-info hover:bg-info/10 rounded-lg transition-colors"
                                        title="View History"
                                    >
                                        <History size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleToggleStatus(user)}
                                        className={`p-2 rounded-lg transition-colors ${user.status === 'active' ? 'text-warm-gray hover:text-warning hover:bg-warning/10' : 'text-success hover:bg-success/10'}`}
                                        title={user.status === 'active' ? 'Deactivate' : 'Activate'}
                                    >
                                        {user.status === 'active' ? <ShieldOff size={18} /> : <Shield size={18} />}
                                    </button>
                                    <button
                                        onClick={() => handleEdit(user)}
                                        className="p-2 text-warm-gray hover:text-terracotta hover:bg-terracotta/10 rounded-lg transition-colors"
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
                                        className="p-2 text-warm-gray hover:text-error hover:bg-error/10 rounded-lg transition-colors"
                                        title="Delete"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Card>

            {/* History Modal */}
            {historyUser && (
                <StaffHistoryModal
                    user={historyUser}
                    onClose={() => setHistoryUser(null)}
                />
            )}

            {/* Edit/Create Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title={editingUser ? 'Edit Staff Member' : `Add New ${activeTab === 'packer' ? 'Packer' : 'Driver'}`}
                size="md"
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="font-accent text-caption text-warm-gray uppercase tracking-wide mb-2 block">Full Name</label>
                        <Input
                            type="text"
                            required
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            placeholder="John Doe"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="font-accent text-caption text-warm-gray uppercase tracking-wide mb-2 block">Email Address</label>
                            <Input
                                type="email"
                                required
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                placeholder="john@vegshop.com"
                            />
                        </div>
                        <div>
                            <label className="font-accent text-caption text-warm-gray uppercase tracking-wide mb-2 block">Status</label>
                            <Select
                                value={formData.status}
                                onChange={e => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
                                options={[
                                    { value: 'active', label: 'Active' },
                                    { value: 'inactive', label: 'Inactive' }
                                ]}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="font-accent text-caption text-warm-gray uppercase tracking-wide mb-2 block">Phone Number</label>
                        <Input
                            type="tel"
                            value={formData.phone}
                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                            placeholder="+27..."
                        />
                    </div>

                    <div>
                        <label className="font-accent text-caption text-warm-gray uppercase tracking-wide mb-2 block">
                            Password {editingUser && '(Leave blank to keep unchanged)'}
                        </label>
                        <Input
                            type="password"
                            required={!editingUser}
                            minLength={6}
                            value={formData.password}
                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                            placeholder="••••••"
                        />
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <Button
                            type="button"
                            onClick={handleCloseModal}
                            variant="secondary"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            disabled={createMutation.isPending || updateMutation.isPending}
                        >
                            {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save Staff Member'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default StaffManagement;

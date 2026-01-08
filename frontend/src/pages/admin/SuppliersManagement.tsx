import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import { Plus, Edit2, Archive, CheckCircle, XCircle } from 'lucide-react';

interface Supplier {
    id: string;
    name: string;
    contactInfo: string | null;
    isAvailable: boolean;
    products?: { id: string }[];
    _count?: {
        products: number;
    };
}

export default function SuppliersManagement() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
    const queryClient = useQueryClient();

    const { data: suppliers, isLoading } = useQuery<Supplier[]>({
        queryKey: ['admin', 'suppliers'],
        queryFn: async () => {
            const response = await api.get('/admin/suppliers');
            return response.data;
        },
    });

    const createMutation = useMutation({
        mutationFn: async (data: { name: string; contactInfo: string }) => {
            await api.post('/admin/suppliers', data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'suppliers'] });
            setIsModalOpen(false);
        },
    });

    const updateMutation = useMutation({
        mutationFn: async (data: { id: string; name: string; contactInfo: string }) => {
            await api.put(`/admin/suppliers/${data.id}`, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'suppliers'] });
            setIsModalOpen(false);
            setEditingSupplier(null);
        },
    });

    const toggleAvailabilityMutation = useMutation({
        mutationFn: async ({ id, isAvailable }: { id: string; isAvailable: boolean }) => {
            await api.patch(`/admin/suppliers/${id}/availability`, { isAvailable });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'suppliers'] });
        },
    });

    const handleEdit = (supplier: Supplier) => {
        setEditingSupplier(supplier);
        setIsModalOpen(true);
    };

    const handleClose = () => {
        setIsModalOpen(false);
        setEditingSupplier(null);
    };

    if (isLoading) {
        return <div className="p-8 text-center text-gray-500">Loading suppliers...</div>;
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Suppliers</h1>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                    <Plus size={20} />
                    Add Supplier
                </button>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact Info</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Products</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {suppliers?.map((supplier) => (
                            <tr key={supplier.id} className={!supplier.isAvailable ? 'bg-gray-50' : ''}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {supplier.name}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {supplier.contactInfo || '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {supplier._count?.products || 0}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <button
                                        onClick={() => toggleAvailabilityMutation.mutate({ id: supplier.id, isAvailable: !supplier.isAvailable })}
                                        className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${supplier.isAvailable
                                                ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                                : 'bg-red-100 text-red-800 hover:bg-red-200'
                                            }`}
                                    >
                                        {supplier.isAvailable ? (
                                            <><CheckCircle size={12} /> Active</>
                                        ) : (
                                            <><XCircle size={12} /> Inactive</>
                                        )}
                                    </button>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button
                                        onClick={() => handleEdit(supplier)}
                                        className="text-blue-600 hover:text-blue-900 mr-4"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {suppliers?.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                    No suppliers found. Create one to link products.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <SupplierModal
                    supplier={editingSupplier}
                    onClose={handleClose}
                    onSave={async (data) => {
                        if (editingSupplier) {
                            await updateMutation.mutateAsync({ ...data, id: editingSupplier.id });
                        } else {
                            await createMutation.mutateAsync(data);
                        }
                    }}
                />
            )}
        </div>
    );
}

function SupplierModal({
    supplier,
    onClose,
    onSave
}: {
    supplier: Supplier | null;
    onClose: () => void;
    onSave: (data: { name: string; contactInfo: string }) => Promise<void>;
}) {
    const [name, setName] = useState(supplier?.name || '');
    const [contactInfo, setContactInfo] = useState(supplier?.contactInfo || '');
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await onSave({ name, contactInfo });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h2 className="text-xl font-bold mb-4">
                    {supplier ? 'Edit Supplier' : 'Add Supplier'}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Name
                        </label>
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Contact Info (Optional)
                        </label>
                        <textarea
                            value={contactInfo}
                            onChange={(e) => setContactInfo(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            rows={3}
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                        >
                            {isSaving ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import { Plus, Edit2, CheckCircle, XCircle, Package, ChevronDown, ChevronUp } from 'lucide-react';
import SupplierModal from '../../components/admin/SupplierModal';
import { Button, Card, CardContent } from '@/components/ui';

interface Supplier {
    id: string;
    name: string;
    contactInfo: string | null;
    isAvailable: boolean;
    products?: {
        id: string;
        name: string;
        isAvailable: boolean;
    }[];
    _count?: {
        products: number;
    };
    // Prisma newer versions return _aggr_count_products instead of _count
    _aggr_count_products?: number;
}

export default function SuppliersManagement() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
    const [expandedSupplier, setExpandedSupplier] = useState<string | null>(null);
    const queryClient = useQueryClient();

    const { data: suppliers, isLoading } = useQuery<Supplier[]>({
        queryKey: ['admin', 'suppliers'],
        queryFn: async () => {
            const response = await api.get('/admin/suppliers');
            return response.data;
        },
    });

    // Fetch products for expanded suppliers
    const { data: productsData } = useQuery<{ data: { id: string; name: string; isAvailable: boolean; supplierId: string }[] }>({
        queryKey: ['products'],
        queryFn: async () => {
            const response = await api.get('/products');
            return response;
        },
        enabled: !!expandedSupplier,
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

    const toggleExpand = (supplierId: string) => {
        setExpandedSupplier(expandedSupplier === supplierId ? null : supplierId);
    };

    // Get products for a specific supplier
    const getSupplierProducts = (supplierId: string) => {
        if (!productsData?.data) return [];
        return productsData.data.filter((p: { supplierId: string }) => p.supplierId === supplierId);
    };

    if (isLoading) {
        return <div className="p-8 text-center text-gray-500">Loading suppliers...</div>;
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="font-display text-display-sm text-primary-dark">Suppliers Management</h1>
                    <p className="font-body text-body-md text-warm-gray mt-1">Manage your product suppliers</p>
                </div>
                <Button
                    onClick={() => setIsModalOpen(true)}
                    variant="primary"
                    className="flex items-center gap-2"
                >
                    <Plus size={20} />
                    Add Supplier
                </Button>
            </div>

            {suppliers?.length === 0 ? (
                <Card>
                    <CardContent className="text-center py-12">
                        <Package className="mx-auto h-12 w-12 text-light-gray mb-4" />
                        <h3 className="font-display text-body-lg text-primary-dark">No suppliers found</h3>
                        <p className="font-body text-body-md text-warm-gray mt-1">Create a supplier to start linking products.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {suppliers?.map((supplier) => (
                        <Card key={supplier.id} padding="none">
                            <div className={`p-4 ${!supplier.isAvailable ? 'bg-gray-50' : ''}`}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <button
                                            onClick={() => toggleExpand(supplier.id)}
                                            className="p-2 hover:bg-cream rounded-lg transition-colors"
                                        >
                                            {expandedSupplier === supplier.id ? (
                                                <ChevronUp size={20} className="text-warm-gray" />
                                            ) : (
                                                <ChevronDown size={20} className="text-warm-gray" />
                                            )}
                                        </button>
                                        <div>
                                            <h3 className="font-body text-body-md font-medium text-primary-dark">
                                                {supplier.name}
                                            </h3>
                                            <p className="font-accent text-caption text-warm-gray">
                                                {supplier.contactInfo || 'No contact info'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="font-accent text-caption text-warm-gray">
                                            {(supplier._count?.products ?? supplier._aggr_count_products ?? 0)} products
                                        </span>
                                        <button
                                            onClick={() => toggleAvailabilityMutation.mutate({ 
                                                id: supplier.id, 
                                                isAvailable: !supplier.isAvailable 
                                            })}
                                            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold ${
                                                supplier.isAvailable
                                                    ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                                    : 'bg-red-100 text-red-800 hover:bg-red-200'
                                            }`}
                                        >
                                            {supplier.isAvailable ? (
                                                <><CheckCircle size={14} /> Active</>
                                            ) : (
                                                <><XCircle size={14} /> Inactive</>
                                            )}
                                        </button>
                                        <button
                                            onClick={() => handleEdit(supplier)}
                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Expanded Products Section */}
                            {expandedSupplier === supplier.id && (
                                <div className="border-t border-light-gray bg-cream/30">
                                    <div className="p-4">
                                        <h4 className="font-body text-body-sm font-medium text-primary-dark mb-3">
                                            Associated Products ({(supplier._count?.products ?? supplier._aggr_count_products ?? 0)})
                                        </h4>
                                        {(supplier._count?.products ?? supplier._aggr_count_products ?? 0) > 0 ? (
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                                {getSupplierProducts(supplier.id).map((product) => (
                                                    <div 
                                                        key={product.id}
                                                        className="flex items-center justify-between p-3 bg-white rounded-lg border border-light-gray"
                                                    >
                                                        <span className="font-body text-body-sm text-primary-dark">
                                                            {product.name}
                                                        </span>
                                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                                            product.isAvailable
                                                                ? 'bg-green-100 text-green-800'
                                                                : 'bg-gray-100 text-gray-600'
                                                        }`}>
                                                            {product.isAvailable ? 'Available' : 'Unavailable'}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="font-body text-body-sm text-warm-gray">
                                                No products linked to this supplier yet.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </Card>
                    ))}
                </div>
            )}

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

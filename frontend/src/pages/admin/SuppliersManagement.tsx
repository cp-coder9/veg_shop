import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api.js';
import { Plus, Edit2, Package, ChevronDown, ChevronUp, LayoutDashboard } from 'lucide-react';
import SupplierModal from '../../components/admin/SupplierModal.js';
import { Button, Card, CardContent, Badge } from '../../components/ui/index.js';

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
    const { data: productsData } = useQuery<{ id: string; name: string; isAvailable: boolean; supplierId: string }[]>({
        queryKey: ['products'],
        queryFn: async () => {
            const response = await api.get('/products');
            return response.data;
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
        if (!Array.isArray(productsData)) return [];
        return productsData.filter((p: { supplierId: string }) => p.supplierId === supplierId);
    };

    if (isLoading) {
        return <div className="p-8 text-center text-gray-500">Loading suppliers...</div>;
    }

    return (
        <div className="space-y-8 max-w-[1600px] mx-auto">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div>
                    <h1 className="font-display text-display-md text-primary-dark">Suppliers Management</h1>
                    <p className="font-body text-body-md text-warm-gray mt-1 flex items-center gap-2">
                        <LayoutDashboard size={16} /> Manage product sourcing and availability
                    </p>
                </div>
                <Button
                    onClick={() => setIsModalOpen(true)}
                    variant="harvest"
                    size="md"
                    className="flex items-center gap-2"
                    leftIcon={<Plus size={20} />}
                >
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
                                        <Badge variant="outline" className="text-warm-gray font-accent">
                                            {(supplier._count?.products ?? supplier._aggr_count_products ?? 0)} products
                                        </Badge>
                                        <button
                                            onClick={() => toggleAvailabilityMutation.mutate({
                                                id: supplier.id,
                                                isAvailable: !supplier.isAvailable
                                            })}
                                        >
                                            <Badge variant={supplier.isAvailable ? 'success' : 'error'} className="cursor-pointer hover:opacity-80 transition-opacity">
                                                {supplier.isAvailable ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </button>
                                        <Button
                                            onClick={() => handleEdit(supplier)}
                                            variant="ghost"
                                            size="sm"
                                            className="text-primary-dark hover:text-black"
                                        >
                                            <Edit2 size={18} />
                                        </Button>
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
                                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${product.isAvailable
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

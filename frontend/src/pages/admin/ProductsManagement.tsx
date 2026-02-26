import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { Package, Plus, Edit2, Trash2, Search, Grid, List, Check, X, AlertTriangle } from 'lucide-react';
import api from '../../lib/api';
import { Button, Input, Card, CardContent, Badge, Modal, Select, Textarea } from '@/components/ui';

interface Product {
    id: string;
    name: string;
    category: string;
    price: number;
    unit: string;
    isAvailable: boolean;
    imageUrl?: string;
    deliveryDay?: 'Wednesday' | 'Friday';
    description?: string | null;
    supplierId?: string | null;
    supplier?: {
        id: string;
        name: string;
    } | null;
}

interface Supplier {
    id: string;
    name: string;
}

interface Order {
    id: string;
    customer: {
        name: string;
    };
    deliveryDate: string;
    status: string;
}

interface AffectedOrder {
    orderId: string;
    customerName: string;
    customerPhone: string;
    orderDate: string;
    deliveryDate: string;
    orderStatus: string;
    productQuantity: number;
    productName?: string;
}

interface ProductFormData {
    name: string;
    category: string;
    price: number;
    unit: string;
    isAvailable: boolean;
    deliveryDay?: 'Wednesday' | 'Friday';
    description?: string;
    supplierId?: string;
}

const ProductsManagement = () => {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [supplierFilter, setSupplierFilter] = useState('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
    const [showOrdersPopup, setShowOrdersPopup] = useState(false);
    const [ordersForProduct, setOrdersForProduct] = useState<Order[]>([]);
    const [productToToggle, setProductToToggle] = useState<{ id: string; isAvailable: boolean } | null>(null);
    const [bulkAffectedOrders, setBulkAffectedOrders] = useState<AffectedOrder[]>([]);
    const [showBulkOrdersPopup, setShowBulkOrdersPopup] = useState(false);
    const [pendingBulkIds, setPendingBulkIds] = useState<string[]>([]);
    
    const [formData, setFormData] = useState<ProductFormData>({
        name: '',
        category: '',
        price: 0,
        unit: 'kg',
        isAvailable: true,
        deliveryDay: undefined,
        description: '',
        supplierId: ''
    });

    const { data: products, isLoading } = useQuery<{ data: Product[] }>({
        queryKey: ['products'],
        queryFn: async () => {
            const response = await api.get('/products');
            return response;
        }
    });

    const { data: categories } = useQuery<{ data: { key: string; label: string }[] }>({
        queryKey: ['categories'],
        queryFn: async () => {
            const response = await api.get('/categories');
            return response;
        }
    });

    const { data: suppliers } = useQuery<Supplier[]>({
        queryKey: ['admin', 'suppliers'],
        queryFn: async () => {
            const response = await api.get('/admin/suppliers');
            return response.data;
        }
    });

    // Fetch orders - kept for potential future use
    // Currently using API response for affected orders instead

    const createMutation = useMutation({
        mutationFn: (data: ProductFormData) => api.post('/products', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            toast.success('Product created successfully');
            handleCloseModal();
        },
        onError: (error: unknown) => {
            const err = error as { response?: { data?: { error?: { message?: string } } } };
            toast.error(err.response?.data?.error?.message || 'Failed to create product');
        }
    });

    const updateMutation = useMutation({
        mutationFn: (data: { id: string; data: Partial<ProductFormData> }) =>
            api.patch(`/products/${data.id}`, data.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            toast.success('Product updated successfully');
            handleCloseModal();
        },
        onError: (error: unknown) => {
            const err = error as { response?: { data?: { error?: { message?: string } } } };
            toast.error(err.response?.data?.error?.message || 'Failed to update product');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => api.delete(`/products/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            toast.success('Product deleted successfully');
        },
        onError: (error: unknown) => {
            const err = error as { response?: { data?: { error?: { message?: string } } } };
            toast.error(err.response?.data?.error?.message || 'Failed to delete product');
        }
    });

    const toggleAvailabilityMutation = useMutation({
        mutationFn: (data: { id: string; isAvailable: boolean }) =>
            api.put(`/products/${data.id}`, { isAvailable: data.isAvailable }),
        onSuccess: (response) => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            
            // Check if there are affected orders in the response
            const responseData = response as any;
            const affectedOrders = responseData?.data?.affectedOrders || [];
            if (affectedOrders.length > 0) {
                // Show the popup with affected orders
                setOrdersForProduct(affectedOrders.map((order: AffectedOrder) => ({
                    id: order.orderId,
                    customer: { name: order.customerName },
                    deliveryDate: order.deliveryDate,
                    status: order.orderStatus
                })));
                setShowOrdersPopup(true);
            } else {
                toast.success('Product availability updated');
            }
            setProductToToggle(null);
        },
        onError: (error: unknown) => {
            const err = error as { response?: { data?: { error?: { message?: string } } } };
            toast.error(err.response?.data?.error?.message || 'Failed to update availability');
            setShowOrdersPopup(false);
            setOrdersForProduct([]);
            setProductToToggle(null);
        }
    });

    const bulkUpdateMutation = useMutation({
        mutationFn: async (data: { ids: string[]; isAvailable: boolean }) => {
            if (!data.isAvailable) {
                // For bulk unavailable, we need to check each product for affected orders first
                const allAffectedOrders: AffectedOrder[] = [];
                const productsList = Array.isArray(products) ? products : (products as unknown as { data: Product[] })?.data || [];
                
                for (const id of data.ids) {
                    const product = productsList.find((p: Product) => p.id === id);
                    if (product && product.isAvailable) {
                        try {
                            const response = await api.put(`/products/${id}`, { isAvailable: false }) as any;
                            const responseData = response?.data;
                            if (responseData?.affectedOrders && responseData.affectedOrders.length > 0) {
                                // Add product name to each affected order
                                const ordersWithProduct = responseData.affectedOrders.map((order: AffectedOrder) => ({
                                    ...order,
                                    productName: product.name
                                }));
                                allAffectedOrders.push(...ordersWithProduct);
                            }
                        } catch (error) {
                            console.error(`Error updating product ${id}:`, error);
                        }
                    }
                }
                
                // If there are affected orders, show popup and don't complete the update yet
                if (allAffectedOrders.length > 0) {
                    setBulkAffectedOrders(allAffectedOrders);
                    setShowBulkOrdersPopup(true);
                    setPendingBulkIds(data.ids);
                    throw new Error('AFFECTED_ORDERS_FOUND');
                }
                
                // No affected orders, proceed with bulk update
                return Promise.all(data.ids.map(id => api.put(`/products/${id}`, { isAvailable: false })));
            } else {
                // For making available, just update directly
                return Promise.all(data.ids.map(id => api.put(`/products/${id}`, { isAvailable: true })));
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            toast.success(`Updated ${selectedProducts.size} products`);
            setSelectedProducts(new Set());
        },
        onError: (error: unknown) => {
            // Don't show error toast if we found affected orders (handled separately)
            if (error instanceof Error && error.message === 'AFFECTED_ORDERS_FOUND') {
                return;
            }
            const err = error as { response?: { data?: { error?: { message?: string } } } };
            toast.error(err.response?.data?.error?.message || 'Failed to update products');
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingProduct) {
            updateMutation.mutate({ id: editingProduct.id, data: formData });
        } else {
            createMutation.mutate(formData);
        }
    };

    const handleEdit = (product: Product) => {
        setEditingProduct(product);
        setFormData({
            name: product.name,
            category: product.category,
            price: product.price,
            unit: product.unit,
            isAvailable: product.isAvailable,
            deliveryDay: product.deliveryDay,
            description: product.description || '',
            supplierId: product.supplierId || ''
        });
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingProduct(null);
        setFormData({
            name: '',
            category: '',
            price: 0,
            unit: 'kg',
            isAvailable: true,
            deliveryDay: undefined,
            description: '',
            supplierId: ''
        });
    };

    // Toggle single product availability with check for active orders
    // Note: Now using API response for affected orders instead of local filtering
    const handleToggleAvailability = (product: Product) => {
        if (!product.isAvailable) {
            // Making available - no need to check orders
            toggleAvailabilityMutation.mutate({ id: product.id, isAvailable: true });
        } else {
            // Making unavailable - the API will return affected orders
            toggleAvailabilityMutation.mutate({ id: product.id, isAvailable: false });
        }
    };

    const confirmToggleWithOrders = () => {
        if (productToToggle) {
            toggleAvailabilityMutation.mutate(productToToggle);
        }
    };

    // Handle bulk unavailable with confirmation
    const confirmBulkUnavailable = async () => {
        setShowBulkOrdersPopup(false);
        
        // Now perform the actual bulk update
        const productsList = Array.isArray(products) ? products : (products as unknown as { data: Product[] })?.data || [];
        
        for (const id of pendingBulkIds) {
            const product = productsList.find((p: Product) => p.id === id);
            if (product && product.isAvailable) {
                try {
                    await api.put(`/products/${id}`, { isAvailable: false });
                } catch (error) {
                    console.error(`Error updating product ${id}:`, error);
                }
            }
        }
        
        queryClient.invalidateQueries({ queryKey: ['products'] });
        toast.success(`Updated ${pendingBulkIds.length} products`);
        setSelectedProducts(new Set());
        setBulkAffectedOrders([]);
        setPendingBulkIds([]);
    };

    const cancelBulkUnavailable = () => {
        setShowBulkOrdersPopup(false);
        setBulkAffectedOrders([]);
        setPendingBulkIds([]);
    };
    const toggleSelectAll = () => {
        if (selectedProducts.size === filteredProducts.length) {
            setSelectedProducts(new Set());
        } else {
            setSelectedProducts(new Set(filteredProducts.map(p => p.id)));
        }
    };

    const toggleSelectProduct = (id: string) => {
        const newSelected = new Set(selectedProducts);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedProducts(newSelected);
    };

    // Bulk actions
    const handleBulkMakeAvailable = () => {
        bulkUpdateMutation.mutate({ ids: Array.from(selectedProducts), isAvailable: true });
    };

    const handleBulkMakeUnavailable = () => {
        bulkUpdateMutation.mutate({ ids: Array.from(selectedProducts), isAvailable: false });
    };

    const productsList = Array.isArray(products) ? products : (products as unknown as { data: Product[] })?.data || [];
    
    const filteredProducts = productsList.filter((product: Product) => {
        const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
        const matchesSupplier = supplierFilter === 'all' || product.supplierId === supplierFilter;
        return matchesSearch && matchesCategory && matchesSupplier;
    });

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="font-display text-display-sm text-primary-dark">Products Management</h1>
                    <p className="font-body text-body-md text-warm-gray mt-1">Manage your product catalog</p>
                </div>
                <Button
                    onClick={() => setIsModalOpen(true)}
                    variant="primary"
                    className="flex items-center gap-2"
                >
                    <Plus size={20} />
                    Add Product
                </Button>
            </div>

            {/* Filters and View Toggle */}
            <Card>
                <CardContent className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-gray" size={20} />
                            <Input
                                type="text"
                                placeholder="Search products..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>
                    <Select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        options={[
                            { value: 'all', label: 'All Categories' },
                            ...(categories?.data?.map((c: { key: string; label: string }) => ({ value: c.key, label: c.label })) || [])
                        ]}
                        className="w-full md:w-48"
                    />
                    <Select
                        value={supplierFilter}
                        onChange={(e) => setSupplierFilter(e.target.value)}
                        options={[
                            { value: 'all', label: 'All Suppliers' },
                            ...(suppliers?.map((s: Supplier) => ({ value: s.id, label: s.name })) || [])
                        ]}
                        className="w-full md:w-48"
                    />
                    <div className="flex gap-1 border border-light-gray rounded-lg p-1">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded ${viewMode === 'grid' ? 'bg-terracotta text-white' : 'text-warm-gray hover:bg-cream'}`}
                            title="Grid View"
                        >
                            <Grid size={20} />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded ${viewMode === 'list' ? 'bg-terracotta text-white' : 'text-warm-gray hover:bg-cream'}`}
                            title="List View"
                        >
                            <List size={20} />
                        </button>
                    </div>
                </CardContent>
            </Card>

            {/* Bulk Actions Bar */}
            {selectedProducts.size > 0 && (
                <Card className="bg-terracotta/10 border-terracotta/30">
                    <CardContent className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <span className="font-body text-body-md text-primary-dark">
                                {selectedProducts.size} product(s) selected
                            </span>
                            <button
                                onClick={toggleSelectAll}
                                className="font-body text-body-sm text-terracotta hover:underline"
                            >
                                {selectedProducts.size === filteredProducts.length ? 'Deselect All' : 'Select All'}
                            </button>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                onClick={handleBulkMakeAvailable}
                                variant="primary"
                                size="sm"
                                className="flex items-center gap-1"
                            >
                                <Check size={16} />
                                Make Available
                            </Button>
                            <Button
                                onClick={handleBulkMakeUnavailable}
                                variant="secondary"
                                size="sm"
                                className="flex items-center gap-1"
                            >
                                <X size={16} />
                                Make Unavailable
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Products Display */}
            <Card padding="none">
                {isLoading ? (
                    <div className="p-8 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-terracotta mx-auto"></div>
                        <p className="font-body text-body-md text-warm-gray mt-4">Loading products...</p>
                    </div>
                ) : filteredProducts.length === 0 ? (
                    <div className="p-12 text-center">
                        <Package className="mx-auto h-12 w-12 text-light-gray mb-4" />
                        <h3 className="font-display text-body-lg text-primary-dark">No products found</h3>
                        <p className="font-body text-body-md text-warm-gray mt-1">Get started by adding a new product.</p>
                    </div>
                ) : viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-6">
                        {filteredProducts.map((product: Product) => (
                            <div 
                                key={product.id} 
                                className={`border border-light-gray rounded-lg overflow-hidden hover:shadow-md transition-shadow ${
                                    selectedProducts.has(product.id) ? 'ring-2 ring-terracotta' : ''
                                }`}
                            >
                                <div className="h-32 bg-cream flex items-center justify-center relative">
                                    <button
                                        onClick={() => toggleSelectProduct(product.id)}
                                        className={`absolute top-2 left-2 w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                                            selectedProducts.has(product.id)
                                                ? 'bg-terracotta border-terracotta text-white'
                                                : 'border-gray-300 bg-white hover:border-terracotta'
                                        }`}
                                    >
                                        {selectedProducts.has(product.id) && <Check size={14} />}
                                    </button>
                                    {product.imageUrl ? (
                                        <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
                                    ) : (
                                        <Package className="h-12 w-12 text-light-gray" />
                                    )}
                                </div>
                                <div className="p-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <h3 className="font-body text-body-md font-medium text-primary-dark">{product.name}</h3>
                                            <p className="font-accent text-caption text-warm-gray">{product.category}</p>
                                            {product.supplier && (
                                                <p className="font-accent text-caption text-warm-gray mt-1">
                                                    Supplier: {product.supplier.name}
                                                </p>
                                            )}
                                        </div>
                                        <Badge variant={product.isAvailable ? 'success' : 'default'}>
                                            {product.isAvailable ? 'Available' : 'Unavailable'}
                                        </Badge>
                                    </div>
                                    <div className="mt-4 flex items-center justify-between">
                                        <p className="font-display text-body-lg text-primary-dark">
                                            R{(product.price / 100).toFixed(2)}/{product.unit}
                                        </p>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleToggleAvailability(product)}
                                                className={`p-2 rounded-lg transition-colors ${
                                                    product.isAvailable
                                                        ? 'text-red-600 hover:bg-red-50'
                                                        : 'text-green-600 hover:bg-green-50'
                                                }`}
                                                title={product.isAvailable ? 'Make Unavailable' : 'Make Available'}
                                            >
                                                {product.isAvailable ? <X size={16} /> : <Check size={16} />}
                                            </button>
                                            <button
                                                onClick={() => handleEdit(product)}
                                                className="p-2 text-warm-gray hover:text-terracotta hover:bg-terracotta/10 rounded-lg transition-colors"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    if (confirm('Are you sure you want to delete this product?')) {
                                                        deleteMutation.mutate(product.id);
                                                    }
                                                }}
                                                className="p-2 text-warm-gray hover:text-error hover:bg-error/10 rounded-lg transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    /* List View */
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left">
                                        <button
                                            onClick={toggleSelectAll}
                                            className="w-6 h-6 rounded border-2 flex items-center justify-center transition-colors"
                                        >
                                            {selectedProducts.size === filteredProducts.length && filteredProducts.length > 0 && <Check size={14} />}
                                        </button>
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Supplier</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredProducts.map((product: Product) => (
                                    <tr key={product.id} className={selectedProducts.has(product.id) ? 'bg-terracotta/5' : ''}>
                                        <td className="px-4 py-4">
                                            <button
                                                onClick={() => toggleSelectProduct(product.id)}
                                                className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                                                    selectedProducts.has(product.id)
                                                        ? 'bg-terracotta border-terracotta text-white'
                                                        : 'border-gray-300 hover:border-terracotta'
                                                }`}
                                            >
                                                {selectedProducts.has(product.id) && <Check size={14} />}
                                            </button>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-cream rounded flex items-center justify-center">
                                                    {product.imageUrl ? (
                                                        <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover rounded" />
                                                    ) : (
                                                        <Package className="w-5 h-5 text-light-gray" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-body text-body-sm font-medium text-primary-dark">{product.name}</p>
                                                    {product.description && (
                                                        <p className="font-accent text-caption text-warm-gray truncate max-w-xs">
                                                            {product.description}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-body-sm text-gray-500">{product.category}</td>
                                        <td className="px-4 py-4 text-body-sm text-gray-500">
                                            {product.supplier?.name || '-'}
                                        </td>
                                        <td className="px-4 py-4 text-body-sm font-medium text-primary-dark">
                                            R{(product.price / 100).toFixed(2)}/{product.unit}
                                        </td>
                                        <td className="px-4 py-4">
                                            <button
                                                onClick={() => handleToggleAvailability(product)}
                                                className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                                                    product.isAvailable
                                                        ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                }`}
                                            >
                                                {product.isAvailable ? <><Check size={12} /> Available</> : <><X size={12} /> Unavailable</>}
                                            </button>
                                        </td>
                                        <td className="px-4 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleEdit(product)}
                                                    className="p-2 text-warm-gray hover:text-terracotta hover:bg-terracotta/10 rounded-lg transition-colors"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        if (confirm('Are you sure you want to delete this product?')) {
                                                            deleteMutation.mutate(product.id);
                                                        }
                                                    }}
                                                    className="p-2 text-warm-gray hover:text-error hover:bg-error/10 rounded-lg transition-colors"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            {/* Create/Edit Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title={editingProduct ? 'Edit Product' : 'Add New Product'}
                size="lg"
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="font-accent text-caption text-warm-gray uppercase tracking-wide mb-2 block">Product Name</label>
                        <Input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Organic Tomatoes"
                        />
                    </div>

                    <div>
                        <label className="font-accent text-caption text-warm-gray uppercase tracking-wide mb-2 block">Description</label>
                        <Textarea
                            value={formData.description || ''}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Describe the product..."
                            rows={3}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="font-accent text-caption text-warm-gray uppercase tracking-wide mb-2 block">Category</label>
                            <Select
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                required
                                options={[
                                    { value: '', label: 'Select category' },
                                    ...(categories?.data?.map((c: { key: string; label: string }) => ({ value: c.key, label: c.label })) || [])
                                ]}
                            />
                        </div>
                        <div>
                            <label className="font-accent text-caption text-warm-gray uppercase tracking-wide mb-2 block">Supplier</label>
                            <Select
                                value={formData.supplierId || ''}
                                onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                                options={[
                                    { value: '', label: 'Select supplier' },
                                    ...(suppliers?.map((s: Supplier) => ({ value: s.id, label: s.name })) || [])
                                ]}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="font-accent text-caption text-warm-gray uppercase tracking-wide mb-2 block">Unit</label>
                            <Select
                                value={formData.unit}
                                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                                options={[
                                    { value: 'kg', label: 'kg' },
                                    { value: 'piece', label: 'piece' },
                                    { value: 'bunch', label: 'bunch' },
                                    { value: 'bag', label: 'bag' },
                                    { value: 'box', label: 'box' }
                                ]}
                            />
                        </div>
                        <div>
                            <label className="font-accent text-caption text-warm-gray uppercase tracking-wide mb-2 block">Price (cents)</label>
                            <Input
                                type="number"
                                required
                                min="0"
                                value={formData.price}
                                onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                                placeholder="5000"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="font-accent text-caption text-warm-gray uppercase tracking-wide mb-2 block">Status</label>
                            <Select
                                value={formData.isAvailable ? 'available' : 'unavailable'}
                                onChange={(e) => setFormData({ ...formData, isAvailable: e.target.value === 'available' })}
                                options={[
                                    { value: 'available', label: 'Available' },
                                    { value: 'unavailable', label: 'Unavailable' }
                                ]}
                            />
                        </div>
                        <div>
                            <label className="font-accent text-caption text-warm-gray uppercase tracking-wide mb-2 block">Delivery Day</label>
                            <Select
                                value={formData.deliveryDay || ''}
                                onChange={(e) => setFormData({ ...formData, deliveryDay: (e.target.value as 'Wednesday' | 'Friday') || undefined })}
                                options={[
                                    { value: '', label: 'Select delivery day' },
                                    { value: 'Wednesday', label: 'Wednesday' },
                                    { value: 'Friday', label: 'Friday' }
                                ]}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <Button type="button" onClick={handleCloseModal} variant="secondary">
                            Cancel
                        </Button>
                        <Button type="submit" variant="primary">
                            {editingProduct ? 'Update Product' : 'Create Product'}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Active Orders Popup for Single Product */}
            <Modal
                isOpen={showOrdersPopup}
                onClose={() => {
                    setShowOrdersPopup(false);
                    setOrdersForProduct([]);
                    setProductToToggle(null);
                }}
                title="Active Orders Found"
                size="md"
            >
                <div className="space-y-4">
                    <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                        <AlertTriangle className="text-amber-600 flex-shrink-0 mt-0.5" size={20} />
                        <div>
                            <p className="font-body text-body-md text-primary-dark">
                                This product has {ordersForProduct.length} active order(s).
                            </p>
                            <p className="font-accent text-caption text-warm-gray mt-1">
                                The item will be delivered with the next batch (Wednesday or Friday). Customers will be notified.
                            </p>
                        </div>
                    </div>

                    <div className="max-h-60 overflow-y-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Order ID</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Customer</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Date</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {ordersForProduct.map((order) => (
                                    <tr key={order.id}>
                                        <td className="px-3 py-2 text-body-sm text-gray-900">{order.id.slice(0, 8)}</td>
                                        <td className="px-3 py-2 text-body-sm text-gray-500">{order.customer?.name}</td>
                                        <td className="px-3 py-2 text-body-sm text-gray-500">
                                            {new Date(order.deliveryDate).toLocaleDateString()}
                                        </td>
                                        <td className="px-3 py-2">
                                            <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800">
                                                {order.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button 
                            variant="secondary" 
                            onClick={() => {
                                setShowOrdersPopup(false);
                                setOrdersForProduct([]);
                                setProductToToggle(null);
                            }}
                        >
                            Cancel
                        </Button>
                        <Button 
                            variant="primary" 
                            onClick={confirmToggleWithOrders}
                        >
                            Make Unavailable Anyway
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Bulk Active Orders Popup */}
            <Modal
                isOpen={showBulkOrdersPopup}
                onClose={cancelBulkUnavailable}
                title="Active Orders Will Be Affected"
                size="lg"
            >
                <div className="space-y-4">
                    <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                        <AlertTriangle className="text-amber-600 flex-shrink-0 mt-0.5" size={20} />
                        <div>
                            <p className="font-body text-body-md text-primary-dark">
                                {bulkAffectedOrders.length} active order(s) will be affected across {pendingBulkIds.length} product(s).
                            </p>
                            <p className="font-accent text-caption text-warm-gray mt-1">
                                The items will be delivered with the next batch (Wednesday or Friday). Affected customers need to be notified.
                            </p>
                        </div>
                    </div>

                    <div className="max-h-80 overflow-y-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50 sticky top-0">
                                <tr>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Customer</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Phone</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Product</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Qty</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Delivery</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {bulkAffectedOrders.map((order, index) => (
                                    <tr key={`${order.orderId}-${order.productName}-${index}`}>
                                        <td className="px-3 py-2 text-body-sm text-gray-900">{order.customerName}</td>
                                        <td className="px-3 py-2 text-body-sm text-gray-500">{order.customerPhone}</td>
                                        <td className="px-3 py-2 text-body-sm text-gray-500">{order.productName}</td>
                                        <td className="px-3 py-2 text-body-sm text-gray-500">{order.productQuantity}</td>
                                        <td className="px-3 py-2 text-body-sm text-gray-500">
                                            {new Date(order.deliveryDate).toLocaleDateString()}
                                        </td>
                                        <td className="px-3 py-2">
                                            <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800">
                                                {order.orderStatus}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button 
                            variant="secondary" 
                            onClick={cancelBulkUnavailable}
                        >
                            Cancel
                        </Button>
                        <Button 
                            variant="primary" 
                            onClick={confirmBulkUnavailable}
                        >
                            Make Unavailable Anyway
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default ProductsManagement;

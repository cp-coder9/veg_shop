import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { Package, Plus, Edit2, Trash2, Search, Grid, List, Check, X, AlertTriangle } from 'lucide-react';
import api from '../../lib/api.js';
import { Button, Input, Card, CardContent, Badge, Modal, Select, Textarea } from '../../components/ui/index.js';

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
    packingType?: string;
    packQuantity?: number;
    updatedAt?: string;
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
    imageUrl?: string;
    deliveryDay?: 'Wednesday' | 'Friday';
    description?: string;
    supplierId?: string;
    packingType?: string;
    packQuantity?: number;
}

const PRODUCT_UNITS = ['kg', 'g', 'unit', 'bunch', 'pack', 'bag', 'box'];

const InlinePriceInput = ({ product, onUpdate }: { product: Product; onUpdate: (id: string, newPrice: number) => void }) => {
    const [price, setPrice] = useState((product.price / 100).toFixed(2));
    const [isEditing, setIsEditing] = useState(false);

    const handleBlur = () => {
        setIsEditing(false);
        const parsed = Math.round(parseFloat(price) * 100);
        if (!isNaN(parsed) && parsed !== product.price) {
            onUpdate(product.id, parsed);
        } else {
            setPrice((product.price / 100).toFixed(2));
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleBlur();
        } else if (e.key === 'Escape') {
            setIsEditing(false);
            setPrice((product.price / 100).toFixed(2));
        }
    };

    if (isEditing) {
        return (
            <div className="flex items-center gap-1">
                <span className="text-warm-gray">R</span>
                <input
                    type="number"
                    step="0.01"
                    min="0"
                    autoFocus
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    className="w-20 px-1 py-1 text-right border rounded bg-white"
                />
                <span className="text-warm-gray font-normal text-sm">/{product.unit}</span>
            </div>
        );
    }

    return (
        <div
            className="flex items-center gap-1 cursor-pointer hover:bg-black/5 p-1 -ml-1 rounded transition-colors"
            onClick={() => setIsEditing(true)}
            title="Click to edit price inline"
        >
            <span className="font-display text-body-lg text-primary-dark font-medium">R{(product.price / 100).toFixed(2)}</span>
            <span className="text-warm-gray text-sm">/{product.unit}</span>
            <Edit2 size={12} className="text-light-gray opacity-50 ml-1" />
        </div>
    );
};

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

    // Bulk Price
    const [isBulkPriceModalOpen, setIsBulkPriceModalOpen] = useState(false);
    const [bulkPriceAction, setBulkPriceAction] = useState('set');
    const [bulkPriceValue, setBulkPriceValue] = useState(0);

    const [priceInput, setPriceInput] = useState('');

    const [isAddingCategory, setIsAddingCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [isAddingSupplier, setIsAddingSupplier] = useState(false);
    const [newSupplierName, setNewSupplierName] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const [formData, setFormData] = useState<ProductFormData>({
        name: '',
        category: '',
        price: 0,
        unit: 'unit',
        isAvailable: true,
        deliveryDay: undefined,
        description: '',
        supplierId: '',
        packingType: 'ambient',
        packQuantity: undefined
    });

    const { data: products, isLoading } = useQuery<Product[]>({
        queryKey: ['products'],
        queryFn: async () => {
            const response = await api.get('/products');
            return response.data;
        }
    });

    const { data: categories } = useQuery<{ key: string; label: string }[]>({
        queryKey: ['categories'],
        queryFn: async () => {
            const response = await api.get('/categories');
            return response.data;
        }
    });

    const { data: suppliers } = useQuery<Supplier[]>({
        queryKey: ['admin', 'suppliers'],
        queryFn: async () => {
            const response = await api.get('/admin/suppliers');
            return response.data;
        }
    });

    const createMutation = useMutation({
        mutationFn: (data: ProductFormData) => api.post('/products', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            queryClient.invalidateQueries({ queryKey: ['admin', 'suppliers'] });
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
            queryClient.invalidateQueries({ queryKey: ['admin', 'suppliers'] });
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
            queryClient.invalidateQueries({ queryKey: ['admin', 'suppliers'] });
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
            queryClient.invalidateQueries({ queryKey: ['admin', 'suppliers'] });

            const responseData = response as any;
            const affectedOrders = responseData?.data?.affectedOrders || [];
            if (affectedOrders.length > 0) {
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
                const allAffectedOrders: AffectedOrder[] = [];
                const productsList = Array.isArray(products) ? products : (products as unknown as { data: Product[] })?.data || [];

                for (const id of data.ids) {
                    const product = productsList.find((p: Product) => p.id === id);
                    if (product && product.isAvailable) {
                        try {
                            const response = await api.put(`/products/${id}`, { isAvailable: false }) as any;
                            const responseData = response?.data;
                            if (responseData?.affectedOrders && responseData.affectedOrders.length > 0) {
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

                if (allAffectedOrders.length > 0) {
                    setBulkAffectedOrders(allAffectedOrders);
                    setShowBulkOrdersPopup(true);
                    setPendingBulkIds(data.ids);
                    throw new Error('AFFECTED_ORDERS_FOUND');
                }

                return Promise.all(data.ids.map(id => api.put(`/products/${id}`, { isAvailable: false })));
            } else {
                return Promise.all(data.ids.map(id => api.put(`/products/${id}`, { isAvailable: true })));
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            queryClient.invalidateQueries({ queryKey: ['admin', 'suppliers'] });
            toast.success(`Updated ${selectedProducts.size} products`);
            setSelectedProducts(new Set());
        },
        onError: (error: unknown) => {
            if (error instanceof Error && error.message === 'AFFECTED_ORDERS_FOUND') {
                return;
            }
            const err = error as { response?: { data?: { error?: { message?: string } } } };
            toast.error(err.response?.data?.error?.message || 'Failed to update products');
        }
    });

    const bulkPriceMutation = useMutation({
        mutationFn: async (data: { ids: string[]; action: string; value: number }) => {
            const productsList = Array.isArray(products) ? products : (products as unknown as { data: Product[] })?.data || [];
            return Promise.all(data.ids.map(id => {
                const product = productsList.find((p: Product) => p.id === id);
                if (!product) return Promise.resolve();

                let newPrice = product.price;
                if (data.action === 'set') newPrice = data.value * 100;
                else if (data.action === 'add') newPrice = product.price + (data.value * 100);
                else if (data.action === 'increase_percent') newPrice = product.price * (1 + (data.value / 100));

                return api.patch(`/products/${id}`, { price: Math.round(newPrice) });
            }));
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            queryClient.invalidateQueries({ queryKey: ['admin', 'suppliers'] });
            toast.success(`Updated prices for ${selectedProducts.size} products`);
            setIsBulkPriceModalOpen(false);
            setBulkPriceValue(0);
        },
        onError: (error: unknown) => {
            const err = error as { response?: { data?: { error?: { message?: string } } } };
            toast.error(err.response?.data?.error?.message || 'Failed to update prices');
        }
    });

    const handleInlinePriceUpdate = (id: string, newPrice: number) => {
        updateMutation.mutate({ id, data: { price: newPrice } });
    };

    const createCategoryMutation = useMutation({
        mutationFn: (data: { key: string; label: string }) => api.post('/categories', data),
        onSuccess: (response) => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            setFormData(prev => ({ ...prev, category: response.data?.key }));
            setIsAddingCategory(false);
            setNewCategoryName('');
            toast.success('Category created successfully');
        },
        onError: () => toast.error('Failed to create category')
    });

    const createSupplierMutation = useMutation({
        mutationFn: (data: { name: string }) => api.post('/admin/suppliers', data),
        onSuccess: (response) => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'suppliers'] });
            queryClient.invalidateQueries({ queryKey: ['suppliers'] });
            setFormData(prev => ({ ...prev, supplierId: response.data?.id }));
            setIsAddingSupplier(false);
            setNewSupplierName('');
            toast.success('Supplier created successfully');
        },
        onError: () => toast.error('Failed to create supplier')
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        let currentImageUrl = formData.imageUrl;

        if (imageFile) {
            const formDataUpload = new FormData();
            formDataUpload.append('file', imageFile);
            try {
                const uploadRes = await api.post('/upload/image', formDataUpload, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                currentImageUrl = uploadRes.data.url;
            } catch (err) {
                toast.error('Failed to upload image');
                return;
            }
        }

        const finalData = {
            ...formData,
            imageUrl: currentImageUrl,
            price: Math.round(parseFloat(priceInput) * 100) || 0
        };

        if (editingProduct) {
            updateMutation.mutate({ id: editingProduct.id, data: finalData });
        } else {
            createMutation.mutate(finalData);
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
            imageUrl: product.imageUrl || '',
            deliveryDay: product.deliveryDay,
            description: product.description || '',
            supplierId: product.supplierId || '',
            packingType: product.packingType || 'ambient',
            packQuantity: product.packQuantity
        });
        setImageFile(null);
        setImagePreview(product.imageUrl || null);
        setPriceInput((product.price / 100).toString());
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingProduct(null);
        setFormData({
            name: '',
            category: '',
            price: 0,
            unit: 'unit',
            isAvailable: true,
            imageUrl: '',
            deliveryDay: undefined,
            description: '',
            supplierId: '',
            packingType: 'ambient',
            packQuantity: undefined
        });
        setImageFile(null);
        setImagePreview(null);
        setIsAddingCategory(false);
        setNewCategoryName('');
        setIsAddingSupplier(false);
        setNewSupplierName('');
        setPriceInput('');
    };

    const handleToggleAvailability = (product: Product) => {
        if (!product.isAvailable) {
            toggleAvailabilityMutation.mutate({ id: product.id, isAvailable: true });
        } else {
            setProductToToggle({ id: product.id, isAvailable: false });
            // The API will return affected orders which shows the popup
            toggleAvailabilityMutation.mutate({ id: product.id, isAvailable: false });
        }
    };

    const confirmToggleWithOrders = () => {
        if (productToToggle) {
            toggleAvailabilityMutation.mutate(productToToggle);
        }
    };

    const confirmBulkUnavailable = async () => {
        setShowBulkOrdersPopup(false);
        const productsList = Array.isArray(products) ? products : (products as any)?.data || [];
        
        for (const id of pendingBulkIds) {
            const product = productsList.find((p: any) => p.id === id);
            if (product?.isAvailable) {
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

    const handleBulkMakeAvailable = () => {
        bulkUpdateMutation.mutate({ ids: Array.from(selectedProducts), isAvailable: true });
    };

    const handleBulkMakeUnavailable = () => {
        bulkUpdateMutation.mutate({ ids: Array.from(selectedProducts), isAvailable: false });
    };

    const productsList = Array.isArray(products) ? products : [];

    const filteredProducts = productsList.filter((product: Product) => {
        const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
        const matchesSupplier = supplierFilter === 'all' || product.supplierId === supplierFilter;
        return matchesSearch && matchesCategory && matchesSupplier;
    });

    return (
        <div className="space-y-8 max-w-[1600px] mx-auto">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div>
                    <h1 className="font-display text-display-md text-primary-dark">Products Management</h1>
                    <p className="font-body text-body-md text-warm-gray mt-1 flex items-center gap-2">
                        <Package size={16} /> Manage and update your product catalog
                    </p>
                </div>
                <Button
                    onClick={() => setIsModalOpen(true)}
                    variant="harvest"
                    size="md"
                    className="flex items-center gap-2"
                    leftIcon={<Plus size={20} />}
                >
                    Add Product
                </Button>
            </div>

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
                            ...(categories?.map((c: { key: string; label: string }) => ({ value: c.key, label: c.label })) || [])
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

            {selectedProducts.size > 0 && (
                <Card className="bg-green-50 border-green-100 shadow-sm animate-in fade-in slide-in-from-top-4">
                    <CardContent className="flex flex-col md:flex-row items-center justify-between gap-4 py-3">
                        <div className="flex items-center gap-2">
                            <span className="font-body text-body-md font-bold text-green-800">
                                {selectedProducts.size} product(s) selected
                            </span>
                            <button
                                onClick={toggleSelectAll}
                                className="font-body text-body-sm text-green-600 hover:text-green-800 underline transition-colors"
                            >
                                {selectedProducts.size === filteredProducts.length ? 'Deselect All' : 'Select All'}
                            </button>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                onClick={handleBulkMakeAvailable}
                                variant="harvest"
                                size="sm"
                                className="flex items-center gap-1"
                                leftIcon={<Check size={16} />}
                            >
                                Make Available
                            </Button>
                            <Button
                                onClick={handleBulkMakeUnavailable}
                                variant="secondary"
                                size="sm"
                                className="flex items-center gap-1"
                                leftIcon={<X size={16} />}
                            >
                                Make Unavailable
                            </Button>
                            <Button
                                onClick={() => setIsBulkPriceModalOpen(true)}
                                variant="secondary"
                                size="sm"
                                className="flex items-center gap-1"
                                leftIcon={<Edit2 size={16} />}
                            >
                                Update Price
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

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
                                className={`border border-light-gray rounded-lg overflow-hidden hover:shadow-md transition-shadow ${selectedProducts.has(product.id) ? 'ring-2 ring-terracotta' : ''
                                    }`}
                            >
                                <div className="h-32 bg-cream flex items-center justify-center relative">
                                    <button
                                        onClick={() => toggleSelectProduct(product.id)}
                                        className={`absolute top-2 left-2 w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${selectedProducts.has(product.id)
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
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                <span className="font-accent text-[10px] tracking-wider uppercase px-1.5 py-0.5 bg-cream text-warm-gray rounded border border-light-gray">
                                                    {product.category}
                                                </span>
                                                {product.packingType && (
                                                    <span className="font-accent text-[10px] tracking-wider uppercase px-1.5 py-0.5 bg-terracotta/5 text-terracotta rounded border border-terracotta/20">
                                                        {product.packingType === 'ambient' && '📦 Ambient (Box or Bag)'}
                                                        {product.packingType === 'cold' && '❄️ Cold (Cooler Box)'}
                                                        {product.packingType === 'frozen' && '🧊 Frozen (Cooler Box)'}
                                                        {product.packingType === 'loose' && '🧺 Loose Items'}
                                                    </span>
                                                )}
                                            </div>
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
                                    <div className="mt-4 flex flex-col gap-2">
                                        <div className="flex items-center justify-between">
                                            <InlinePriceInput product={product} onUpdate={handleInlinePriceUpdate} />
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleToggleAvailability(product)}
                                                    className={`p-2 rounded-lg transition-colors ${product.isAvailable
                                                        ? 'text-error hover:bg-error/10'
                                                        : 'text-success hover:bg-success/10'
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
                                            </div>
                                        </div>
                                        {product.updatedAt && (
                                            <div className="text-xs text-warm-gray">
                                                Last updated: {new Date(product.updatedAt).toLocaleDateString()} {new Date(product.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
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
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Updated</th>
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
                                                className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${selectedProducts.has(product.id)
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
                                        <td className="px-4 py-4">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-body-sm text-gray-500">{product.category}</span>
                                                {product.packingType && (
                                                    <span className="text-[10px] font-bold uppercase tracking-tighter text-terracotta">
                                                        {product.packingType === 'ambient' && '📦 Ambient (Box or Bag)'}
                                                        {product.packingType === 'cold' && '❄️ Cold (Cooler Box)'}
                                                        {product.packingType === 'frozen' && '🧊 Frozen (Cooler Box)'}
                                                        {product.packingType === 'loose' && '🧺 Loose Items'}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-body-sm text-gray-500">
                                            {product.supplier?.name || '-'}
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap">
                                            <InlinePriceInput product={product} onUpdate={handleInlinePriceUpdate} />
                                        </td>
                                        <td className="px-4 py-4 text-xs text-warm-gray whitespace-nowrap">
                                            {product.updatedAt ? (
                                                <>
                                                    {new Date(product.updatedAt).toLocaleDateString()}<br />
                                                    {new Date(product.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </>
                                            ) : '-'}
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap">
                                            <button
                                                onClick={() => handleToggleAvailability(product)}
                                                className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${product.isAvailable
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

                    <div>
                        <label className="font-accent text-caption text-warm-gray uppercase tracking-wide mb-2 block">Product Image</label>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                            {imagePreview ? (
                                <div className="relative w-20 h-20 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setImageFile(null);
                                            setImagePreview(null);
                                            setFormData({ ...formData, imageUrl: '' });
                                        }}
                                        className="absolute top-0 right-0 p-1 bg-black/50 text-white hover:bg-black rounded-bl"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ) : (
                                <div className="w-20 h-20 bg-gray-50 border border-dashed border-gray-300 rounded flex items-center justify-center text-gray-400 flex-shrink-0">
                                    <Package size={24} />
                                </div>
                            )}
                            <div className="flex-1 w-full">
                                <Input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            setImageFile(file);
                                            setImagePreview(URL.createObjectURL(file));
                                        }
                                    }}
                                />
                                <p className="text-xs text-warm-gray mt-1">Suggested format: Square (1:1) JPG or PNG.</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="font-accent text-caption text-warm-gray uppercase tracking-wide mb-2 block">Category</label>
                            {isAddingCategory ? (
                                <div className="flex gap-2">
                                    <Input
                                        value={newCategoryName}
                                        onChange={(e) => setNewCategoryName(e.target.value)}
                                        placeholder="New category name"
                                        autoFocus
                                    />
                                    <Button
                                        type="button"
                                        onClick={() => {
                                            if (newCategoryName.trim()) {
                                                const key = newCategoryName.trim().toLowerCase().replace(/[^a-z]/g, '_').replace(/_+/g, '_').replace(/^_+|_+$/g, '');
                                                if (key) {
                                                    createCategoryMutation.mutate({ key, label: newCategoryName.trim() });
                                                } else {
                                                    toast.error('Category name must contain letters');
                                                }
                                            }
                                        }}
                                        disabled={createCategoryMutation.isPending || !newCategoryName.trim()}
                                        variant="harvest"
                                    >
                                        Save
                                    </Button>
                                    <Button type="button" variant="secondary" onClick={() => setIsAddingCategory(false)}>
                                        Cancel
                                    </Button>
                                </div>
                            ) : (
                                <Select
                                    value={formData.category}
                                    onChange={(e) => {
                                        if (e.target.value === 'ADD_NEW') setIsAddingCategory(true);
                                        else setFormData({ ...formData, category: e.target.value });
                                    }}
                                    required
                                    options={[
                                        { value: '', label: 'Select category' },
                                        ...(categories?.map((c: { key: string; label: string }) => ({ value: c.key, label: c.label })) || []),
                                        { value: 'ADD_NEW', label: '+ Add New Category' }
                                    ]}
                                />
                            )}
                        </div>
                        <div>
                            <label className="font-accent text-caption text-warm-gray uppercase tracking-wide mb-2 block">Supplier</label>
                            {isAddingSupplier ? (
                                <div className="flex gap-2">
                                    <Input
                                        value={newSupplierName}
                                        onChange={(e) => setNewSupplierName(e.target.value)}
                                        placeholder="New supplier name"
                                        autoFocus
                                    />
                                    <Button
                                        type="button"
                                        onClick={() => {
                                            if (newSupplierName.trim()) {
                                                createSupplierMutation.mutate({ name: newSupplierName.trim() });
                                            }
                                        }}
                                        disabled={createSupplierMutation.isPending || !newSupplierName.trim()}
                                        variant="harvest"
                                    >
                                        Save
                                    </Button>
                                    <Button type="button" variant="secondary" onClick={() => setIsAddingSupplier(false)}>
                                        Cancel
                                    </Button>
                                </div>
                            ) : (
                                <Select
                                    value={formData.supplierId || ''}
                                    onChange={(e) => {
                                        if (e.target.value === 'ADD_NEW') setIsAddingSupplier(true);
                                        else setFormData({ ...formData, supplierId: e.target.value });
                                    }}
                                    options={[
                                        { value: '', label: 'Select supplier' },
                                        ...(suppliers?.map((s: Supplier) => ({ value: s.id, label: s.name })) || []),
                                        { value: 'ADD_NEW', label: '+ Add New Supplier' }
                                    ]}
                                />
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="font-accent text-caption text-warm-gray uppercase tracking-wide mb-2 block">Unit</label>
                            <select
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                value={formData.unit}
                                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                                required
                            >
                                {PRODUCT_UNITS.map(unit => (
                                    <option key={unit} value={unit}>{unit}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="font-accent text-caption text-warm-gray uppercase tracking-wide mb-2 block">Price (R)</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-light-gray">R</span>
                                <Input
                                    type="number"
                                    required
                                    min="0"
                                    step="0.01"
                                    className="pl-8"
                                    value={priceInput}
                                    onChange={(e) => setPriceInput(e.target.value)}
                                    onBlur={(e) => {
                                        if (e.target.value) {
                                            const num = parseFloat(e.target.value);
                                            if (!isNaN(num)) {
                                                setPriceInput(num.toFixed(2));
                                            }
                                        }
                                    }}
                                    placeholder="0.00"
                                />
                            </div>
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
                                onChange={(e) => setFormData({ ...formData, deliveryDay: e.target.value === '' ? undefined : (e.target.value as 'Wednesday' | 'Friday') })}
                                options={[
                                    { value: '', label: 'Select delivery day' },
                                    { value: 'Wednesday', label: 'Wednesday' },
                                    { value: 'Friday', label: 'Friday' }
                                ]}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="font-accent text-caption text-warm-gray uppercase tracking-wide mb-2 block">Packing Type</label>
                        <Select
                            value={formData.packingType}
                            onChange={(e) => setFormData({ ...formData, packingType: e.target.value })}
                            options={[
                                { value: 'ambient', label: 'Ambient (Box or Bag)' },
                                { value: 'cold', label: 'Cold (Cooler Box)' },
                                { value: 'frozen', label: 'Frozen (Cooler Box)' },
                                { value: 'loose', label: 'Loose Items' }
                            ]}
                        />
                    </div>

                    {formData.unit?.toLowerCase() === 'pack' && (
                        <div className="mt-4 p-4 bg-emerald-50 rounded-lg border border-emerald-100">
                            <label className="font-accent text-caption text-emerald-800 uppercase tracking-wide mb-2 block">
                                Items per Pack (Multiplier)
                            </label>
                            <p className="text-xs text-emerald-600 mb-3">
                                Total Price = Quantity Ordered × Items per Pack × Unit Price
                            </p>
                            <Input
                                type="number"
                                required
                                min="1"
                                placeholder="e.g. 6, 12, 24"
                                value={formData.packQuantity || ''}
                                onChange={(e) => setFormData({ ...formData, packQuantity: parseInt(e.target.value) || undefined })}
                                className="border-emerald-200 focus:ring-emerald-500 font-bold text-lg"
                            />
                        </div>
                    )}

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

            {/* Bulk Price Update Modal */}
            <Modal
                isOpen={isBulkPriceModalOpen}
                onClose={() => {
                    setIsBulkPriceModalOpen(false);
                    setBulkPriceValue(0);
                }}
                title="Bulk Update Prices"
                size="md"
            >
                <div className="space-y-4">
                    <p className="text-body-sm text-warm-gray mb-4">
                        Update prices for {selectedProducts.size} selected product{selectedProducts.size !== 1 ? 's' : ''}.
                    </p>
                    <div>
                        <label className="font-accent text-caption text-warm-gray uppercase tracking-wide mb-2 block">Action</label>
                        <Select
                            value={bulkPriceAction}
                            onChange={(e) => setBulkPriceAction(e.target.value)}
                            options={[
                                { value: 'set', label: 'Set exact price (Rs)' },
                                { value: 'add', label: 'Add amount (+ Rs)' },
                                { value: 'increase_percent', label: 'Increase by percentage (%)' }
                            ]}
                        />
                    </div>
                    <div>
                        <label className="font-accent text-caption text-warm-gray uppercase tracking-wide mb-2 block">Value</label>
                        <Input
                            type="number"
                            step={bulkPriceAction === 'increase_percent' ? "1" : "0.01"}
                            value={bulkPriceValue === 0 ? '' : bulkPriceValue}
                            onChange={(e) => setBulkPriceValue(parseFloat(e.target.value) || 0)}
                            placeholder={bulkPriceAction === 'increase_percent' ? "e.g. 10 for +10%" : "e.g. 5.50"}
                        />
                    </div>
                    <div className="flex justify-end gap-3 mt-6">
                        <Button type="button" onClick={() => setIsBulkPriceModalOpen(false)} variant="secondary">
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            variant="primary"
                            onClick={() => bulkPriceMutation.mutate({
                                ids: Array.from(selectedProducts),
                                action: bulkPriceAction,
                                value: bulkPriceValue
                            })}
                            disabled={bulkPriceMutation.isPending || (bulkPriceValue === 0 && bulkPriceAction !== 'set')}
                        >
                            {bulkPriceMutation.isPending ? 'Updating...' : 'Update Prices'}
                        </Button>
                    </div>
                </div>
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

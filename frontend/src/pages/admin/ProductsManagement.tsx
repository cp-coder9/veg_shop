import { useState, useMemo, useRef } from 'react';
import { Product, CATEGORY_LABELS, UNIT_LABELS, ProductUnit } from '../../types';
import {
  useAdminProducts,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  useWhatsAppProductList,
  UpdateProductDto,
} from '../../hooks/useAdminProducts';
import { useCategories, useCreateCategory } from '../../hooks/useCategories';
import { useUploadImage } from '../../hooks/useUpload';
import { useSuppliers } from '../../hooks/useSuppliers';
import { toNumber } from '../../lib/utils';
import SupplierModal from '../../components/admin/SupplierModal';
import api from '../../lib/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export default function ProductsManagement() {
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [availabilityFilter, setAvailabilityFilter] = useState<string>('');
  const [showProductModal, setShowProductModal] = useState(false);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [showWhatsAppList, setShowWhatsAppList] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingSupplier, setEditingSupplier] = useState<{ id: string; name: string; contactInfo: string | null; isAvailable: boolean } | null>(null);
  const [targetSupplierId, setTargetSupplierId] = useState<string | null>(null); // For pre-filling supplier in Add Product

  const filters = {
    category: categoryFilter || undefined,
    isAvailable: availabilityFilter ? availabilityFilter === 'true' : undefined,
  };

  const { data: products, isLoading: productsLoading } = useAdminProducts(filters);
  const { data: categories } = useCategories();
  const { data: suppliers, isLoading: suppliersLoading } = useSuppliers();

  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const { data: whatsappList, refetch: fetchWhatsAppList } = useWhatsAppProductList();
  const queryClient = useQueryClient();

  // Merge default and API categories
  const allCategories = useMemo(() => {
    const merged: Record<string, string> = { ...CATEGORY_LABELS };
    categories?.forEach(cat => {
      merged[cat.key] = cat.label;
    });
    return merged;
  }, [categories]);

  // Group products by supplier
  const groupedProducts = useMemo(() => {
    if (!products) return {};
    const groups: Record<string, Product[]> = {};

    // Initialize groups for all available suppliers
    suppliers?.forEach(supplier => {
      groups[supplier.id] = [];
    });
    // Add "In-house / No Supplier" group
    groups['null'] = [];

    products.forEach(product => {
      const supplierId = product.supplierId || 'null';
      if (!groups[supplierId]) {
        groups[supplierId] = []; // Should be initialized, but just in case
      }
      groups[supplierId].push(product);
    });

    return groups;
  }, [products, suppliers]);

  const handleOpenProductModal = (product?: Product, supplierId?: string) => {
    setEditingProduct(product || null);
    if (supplierId && !product) {
      // Pre-fill supplier if adding new to a group
      setTargetSupplierId(supplierId);
    } else {
      setTargetSupplierId(null);
    }
    setShowProductModal(true);
  };

  const handleCloseProductModal = () => {
    setShowProductModal(false);
    setEditingProduct(null);
    setTargetSupplierId(null);
  };

  const handleDeleteProduct = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      await deleteProduct.mutateAsync(id);
    }
  };

  const handleShowWhatsAppList = async () => {
    await fetchWhatsAppList();
    setShowWhatsAppList(true);
  };

  // Supplier Modal Handlers
  const handleEditSupplier = (supplier: any) => {
    setEditingSupplier(supplier);
    setShowSupplierModal(true);
  };

  const handleAddSupplier = () => {
    setEditingSupplier(null);
    setShowSupplierModal(true);
  };

  const createSupplierMutation = useMutation({
    mutationFn: async (data: { name: string; contactInfo: string }) => {
      await api.post('/admin/suppliers', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'suppliers'] });
      setShowSupplierModal(false);
    },
  });

  const updateSupplierMutation = useMutation({
    mutationFn: async (data: { id: string; name: string; contactInfo: string }) => {
      await api.put(`/admin/suppliers/${data.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'suppliers'] });
      setShowSupplierModal(false);
      setEditingSupplier(null);
    },
  });

  if (productsLoading || suppliersLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Products Management</h1>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <button
            onClick={handleShowWhatsAppList}
            className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Generate WhatsApp List
          </button>
          <button
            onClick={handleAddSupplier}
            className="w-full sm:w-auto px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Add Supplier
          </button>
          <button
            onClick={() => handleOpenProductModal()}
            className="w-full sm:w-auto px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Add Product (General)
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">All Categories</option>
              {Object.entries(allCategories).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Availability
            </label>
            <select
              value={availabilityFilter}
              onChange={(e) => setAvailabilityFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">All</option>
              <option value="true">Available</option>
              <option value="false">Unavailable</option>
            </select>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        {/* Render In-house products first */}
        <SupplierSection
          title="In-house / No Supplier"
          products={groupedProducts['null'] || []}
          allCategories={allCategories}
          onEditProduct={handleOpenProductModal}
          onDeleteProduct={handleDeleteProduct}
          onAddProduct={() => handleOpenProductModal(undefined, undefined)}
          isAvailable={true}
        />

        {/* Render Supplier Groups */}
        {suppliers?.map(supplier => (
          <SupplierSection
            key={supplier.id}
            title={supplier.name}
            supplier={supplier}
            products={groupedProducts[supplier.id] || []}
            allCategories={allCategories}
            onEditProduct={handleOpenProductModal}
            onDeleteProduct={handleDeleteProduct}
            onAddProduct={() => handleOpenProductModal(undefined, supplier.id)}
            isAvailable={supplier.isAvailable}
            onEditSupplier={() => handleEditSupplier(supplier)}
          />
        ))}
      </div>

      {/* Product Modal */}
      {showProductModal && (
        <ProductModal
          product={editingProduct}
          initialSupplierId={targetSupplierId} // Use separate prop for default
          onClose={handleCloseProductModal}
          onSave={async (data) => {
            if (editingProduct) {
              const updateData = {
                ...data,
                price: data.price !== undefined ? toNumber(data.price) : undefined,
              };
              await updateProduct.mutateAsync({ id: editingProduct.id, data: updateData });
            } else {
              const createData = {
                name: data.name!,
                price: toNumber(data.price!),
                category: data.category!,
                unit: data.unit!,
                description: data.description,
                imageUrl: data.imageUrl,
                isAvailable: data.isAvailable!,
                isSeasonal: data.isSeasonal!,
                packingType: data.packingType!,
                supplierId: data.supplierId, // Should be passed from form
              };
              await createProduct.mutateAsync(createData);
            }
            handleCloseProductModal();
          }}
        />
      )}

      {/* Supplier Modal */}
      {showSupplierModal && (
        <SupplierModal
          supplier={editingSupplier}
          onClose={() => setShowSupplierModal(false)}
          onSave={async (data) => {
            if (editingSupplier) {
              await updateSupplierMutation.mutateAsync({ ...data, id: editingSupplier.id });
            } else {
              await createSupplierMutation.mutateAsync(data);
            }
          }}
        />
      )}

      {/* WhatsApp List Modal */}
      {showWhatsAppList && (
        <WhatsAppListModal
          content={whatsappList || ''}
          onClose={() => setShowWhatsAppList(false)}
        />
      )}
    </div>
  );
}

// Sub-component for rendering a supplier section
function SupplierSection({
  title,
  supplier,
  products,
  allCategories,
  onEditProduct,
  onDeleteProduct,
  onAddProduct,
  isAvailable,
  onEditSupplier
}: {
  title: string,
  supplier?: any,
  products: Product[],
  allCategories: Record<string, string>,
  onEditProduct: (p: Product) => void,
  onDeleteProduct: (id: string) => void,
  onAddProduct: () => void,
  isAvailable: boolean
  onEditSupplier?: () => void
}) {
  return (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden border-t-4 ${isAvailable ? 'border-t-green-500' : 'border-t-red-500'}`}>
      <div className="bg-gray-50 px-6 py-4 flex flex-col sm:flex-row justify-between items-center border-b border-gray-200">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-gray-800">{title}</h2>
          {!isAvailable && <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">Inactive Supplier</span>}
          {supplier && (
            <button onClick={onEditSupplier} className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              Edit Supplier
            </button>
          )}
        </div>
        <button
          onClick={onAddProduct}
          className="mt-2 sm:mt-0 px-3 py-1.5 bg-green-100 text-green-700 rounded-md hover:bg-green-200 text-sm font-medium flex items-center gap-1"
        >
          + Add Product here
        </button>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Packing</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {products.map((product) => (
              <tr key={product.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{product.name}</div>
                      {product.isSeasonal && <span className="text-xs text-orange-600">Seasonal</span>}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {allCategories[product.category] || product.category}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  R {toNumber(product.price).toFixed(2)} / {product.unit}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                  {product.packingType || 'box'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${product.isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {product.isAvailable ? 'Available' : 'Unavailable'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button onClick={() => onEditProduct(product)} className="text-blue-600 hover:text-blue-900 mr-4">Edit</button>
                  <button onClick={() => onDeleteProduct(product.id)} className="text-red-600 hover:text-red-900">Delete</button>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500 italic">
                  No products listed for this supplier using current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden p-4 space-y-4">
        {products.map((product) => (
          <div key={product.id} className="bg-gray-50 p-4 rounded-lg border border-gray-100 space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-bold text-gray-900">{product.name}</p>
                {product.isSeasonal && <span className="text-xs text-orange-600 font-medium">Seasonal</span>}
              </div>
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${product.isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {product.isAvailable ? 'Available' : 'Unavailable'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="text-gray-500">Price:</span> R {toNumber(product.price).toFixed(2)} / {product.unit}</div>
              <div><span className="text-gray-500">Category:</span> {allCategories[product.category] || product.category}</div>
            </div>
            <div className="pt-2 border-t border-gray-200 flex justify-end gap-3">
              <button onClick={() => onEditProduct(product)} className="text-blue-600 font-medium text-sm">Edit</button>
              <button onClick={() => onDeleteProduct(product.id)} className="text-red-600 font-medium text-sm">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface ProductModalProps {
  product: Product | null;
  initialSupplierId?: string | null;
  onClose: () => void;
  onSave: (data: UpdateProductDto) => Promise<void>;
}

function ProductModal({ product, initialSupplierId, onClose, onSave }: ProductModalProps) {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    price: product?.price ? toNumber(product.price) : 0,
    category: (product?.category || 'vegetables') as Product['category'],
    unit: (product?.unit || 'kg') as Product['unit'],
    description: product?.description || '',
    imageUrl: product?.imageUrl || '',
    isAvailable: product?.isAvailable ?? true,
    isSeasonal: product?.isSeasonal ?? false,
    packingType: product?.packingType || 'box',
    supplierId: product?.supplierId || initialSupplierId || null,
  });

  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryKey, setNewCategoryKey] = useState('');
  const [newCategoryLabel, setNewCategoryLabel] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(product?.imageUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: categories } = useCategories();
  const { data: suppliers } = useSuppliers();
  const createCategory = useCreateCategory();
  const uploadImage = useUploadImage();

  const allCategories = useMemo(() => {
    const merged: Record<string, string> = { ...CATEGORY_LABELS };
    categories?.forEach(cat => {
      merged[cat.key] = cat.label;
    });
    return merged;
  }, [categories]);

  const handleAddCategory = async () => {
    if (!newCategoryKey || !newCategoryLabel) {
      alert('Please enter both category key and label');
      return;
    }

    if (!/^[a-z_]+$/.test(newCategoryKey)) {
      alert('Category key must be lowercase letters and underscores only');
      return;
    }

    if (allCategories[newCategoryKey]) {
      alert('Category key already exists');
      return;
    }

    try {
      await createCategory.mutateAsync({
        key: newCategoryKey,
        label: newCategoryLabel,
        description: newCategoryDescription || undefined,
      });

      setFormData({ ...formData, category: newCategoryKey as Product['category'] });

      setNewCategoryKey('');
      setNewCategoryLabel('');
      setNewCategoryDescription('');
      setShowAddCategory(false);
    } catch (error) {
      console.error('Failed to create category:', error);
      alert('Failed to create category. Please try again.');
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    try {
      setUploadingImage(true);

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      const result = await uploadImage.mutateAsync(file);

      setFormData({ ...formData, imageUrl: result.url });
    } catch (error) {
      console.error('Failed to upload image:', error);
      alert('Failed to upload image. Please try again.');
      setImagePreview(formData.imageUrl || null);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = () => {
    setFormData({ ...formData, imageUrl: '' });
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-full mx-4 md:max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          {product ? 'Edit Product' : 'Add Product'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price *
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unit *
              </label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value as ProductUnit })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                {Object.entries(UNIT_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category *
            </label>
            <div className="flex gap-2">
              <select
                value={formData.category}
                onChange={(e) => {
                  if (e.target.value === '__add_new__') {
                    setShowAddCategory(true);
                  } else {
                    setFormData({ ...formData, category: e.target.value as Product['category'] });
                  }
                }}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                {Object.entries(allCategories).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
                <option value="__add_new__" className="text-green-600 font-semibold">
                  + Add New Category
                </option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Supplier (Optional)
            </label>
            <select
              value={formData.supplierId || ''}
              onChange={(e) => setFormData({ ...formData, supplierId: e.target.value || null })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">-- None (In-house) --</option>
              {suppliers?.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name} {!supplier.isAvailable ? '(Unavailable)' : ''}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              If a supplier is marked unavailable, this product will be hidden.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Product Image
            </label>

            {/* Image Preview */}
            {imagePreview && (
              <div className="mb-3 relative inline-block">
                <img
                  src={imagePreview.startsWith('/uploads') ? `http://localhost:3000${imagePreview}` : imagePreview}
                  alt="Preview"
                  className="w-32 h-32 object-cover rounded-lg border-2 border-gray-300"
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                >
                  ×
                </button>
              </div>
            )}

            {/* Upload Button */}
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImage}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                {uploadingImage ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Uploading...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Upload Image
                  </>
                )}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Max file size: 5MB. Supported formats: JPEG, PNG, GIF, WebP
            </p>

            {/* Or use URL */}
            <div className="mt-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Or enter image URL
              </label>
              <input
                type="url"
                value={formData.imageUrl}
                onChange={(e) => {
                  setFormData({ ...formData, imageUrl: e.target.value });
                  setImagePreview(e.target.value || null);
                }}
                placeholder="https://example.com/image.jpg"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex gap-6">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.isAvailable}
                onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                className="mr-2"
              />
              <span className="text-sm font-medium text-gray-700">Available</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.isSeasonal}
                onChange={(e) => setFormData({ ...formData, isSeasonal: e.target.checked })}
                className="mr-2"
              />
              <span className="text-sm font-medium text-gray-700">Seasonal</span>
            </label>
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="w-full sm:w-auto px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              {product ? 'Update' : 'Create'}
            </button>
          </div>
        </form>

        {/* Add Category Modal */}
        {showAddCategory && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-full mx-4 md:max-w-md">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Add New Category</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category Key *
                  </label>
                  <input
                    type="text"
                    value={newCategoryKey}
                    onChange={(e) => setNewCategoryKey(e.target.value.toLowerCase().replace(/[^a-z_]/g, ''))}
                    placeholder="e.g., herbs_spices"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Lowercase letters and underscores only
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category Label *
                  </label>
                  <input
                    type="text"
                    value={newCategoryLabel}
                    onChange={(e) => setNewCategoryLabel(e.target.value)}
                    placeholder="e.g., Herbs & Spices"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Display name for the category
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description (Optional)
                  </label>
                  <textarea
                    value={newCategoryDescription}
                    onChange={(e) => setNewCategoryDescription(e.target.value)}
                    placeholder="Brief description of this category"
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div className="bg-green-50 p-3 rounded-lg">
                  <p className="text-sm text-green-800">
                    <strong>✓ Synced:</strong> This category will be saved to the database and available to all admins across all devices.
                  </p>
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddCategory(false);
                    setNewCategoryKey('');
                    setNewCategoryLabel('');
                  }}
                  className="w-full sm:w-auto px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddCategory}
                  disabled={createCategory.isPending}
                  className="w-full sm:w-auto px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {createCategory.isPending ? 'Creating...' : 'Add Category'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface WhatsAppListModalProps {
  content: string;
  onClose: () => void;
}

function WhatsAppListModal({ content, onClose }: WhatsAppListModalProps) {
  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    alert('Copied to clipboard!');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-full mx-4 md:max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          WhatsApp Product List
        </h2>

        <div className="bg-gray-50 p-4 rounded-lg mb-4 whitespace-pre-wrap font-mono text-sm text-gray-800">
          {typeof content === 'string' ? content : JSON.stringify(content, null, 2)}
        </div>

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            Close
          </button>
          <button
            onClick={handleCopy}
            className="w-full sm:w-auto px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Copy to Clipboard
          </button>
        </div>
      </div>
    </div>
  );
}

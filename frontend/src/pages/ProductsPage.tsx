import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useProducts } from '../hooks/useProducts';
import { useCartStore } from '../stores/cartStore';
import { Button, Input, Card } from '../components/ui';
import { ProductQuickOrderList } from '../components/shop/ProductQuickOrderList';
import { ProductDetailModal } from '../components/shop/ProductDetailModal';
import { Product, CATEGORY_LABELS } from '../types';

// Category display names mapping (fallback)
const categoryNames: Record<string, string> = {
  vegetables: 'Vegetables',
  fruit: 'Fruit',
  herbs: 'Herbs',
  dairy: 'Dairy',
  pantry: 'Pantry',
  other: 'Other',
};

export default function ProductsPage() {
  const { data: products, isLoading, isError } = useProducts();
  const { getTotalItems } = useCartStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Group products by category - ensure products is an array
  const groupedProducts: Record<string, Product[]> = Array.isArray(products)
    ? products.reduce((acc, product) => {
        const category = product.category || 'other';
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(product);
        return acc;
      }, {} as Record<string, Product[]>)
    : {};

  // Filter products based on search and category
  const filteredGroups = Object.entries(groupedProducts).reduce((acc, [category, categoryProducts]) => {
        const filtered = (categoryProducts || []).filter(
          (p) =>
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
            (!selectedCategory || category === selectedCategory)
        );
        if (filtered.length > 0) {
          acc[category] = filtered;
        }
        return acc;
      }, {} as Record<string, Product[]>);

  // Get unique categories for filter - defensive check for array
  const categories = Array.isArray(products)
    ? [...new Set(products.map((p) => p.category || 'other'))]
    : [];

  // Handle product click to open modal
  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  // Close modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProduct(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="loading-spinner h-12 w-12 mx-auto animate-spin rounded-full border-4 border-light-gray border-t-terracotta"></div>
          <p className="mt-4 font-body text-body-md text-warm-gray">Loading products...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-red-50 text-error px-4 py-3 rounded-lg border border-error/20 font-body">
        Failed to load products. Please try again later.
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-display-md text-primary-dark">Quick Order</h1>
          <p className="font-body text-body-md text-warm-gray mt-1">
            Tap a product to view details, or click Add → to order quickly
          </p>
        </div>
        <Link to="/cart" className="relative">
          <Button variant="secondary">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Cart ({getTotalItems()})
          </Button>
        </Link>
      </div>

      {/* Search and Category Filters */}
      <div className="flex flex-col gap-4">
        <div>
          <Input
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            }
          />
        </div>
        
        {/* Category Filter Chips */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-full text-body-sm font-medium transition-colors ${
              selectedCategory === null
                ? 'bg-primary-dark text-white'
                : 'bg-cream text-primary-dark hover:bg-light-gray'
            }`}
          >
            All
          </button>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category === selectedCategory ? null : category)}
              className={`px-4 py-2 rounded-full text-body-sm font-medium transition-colors ${
                selectedCategory === category
                  ? 'bg-primary-dark text-white'
                  : 'bg-cream text-primary-dark hover:bg-light-gray'
              }`}
            >
              {CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS] || categoryNames[category] || category}
            </button>
          ))}
        </div>
      </div>

      {/* Products List (Quick Order Format) */}
      {Object.keys(filteredGroups).length === 0 ? (
        <Card className="text-center py-12">
          <svg className="w-16 h-16 mx-auto text-warm-gray mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <h3 className="font-display text-display-sm text-primary-dark mb-2">No Products Found</h3>
          <p className="font-body text-body-md text-warm-gray">
            Try adjusting your search or filter criteria
          </p>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(filteredGroups).map(([category, categoryProducts]) => (
            <ProductQuickOrderList
              key={category}
              products={categoryProducts || []}
              category={category}
              onProductClick={handleProductClick}
            />
          ))}
        </div>
      )}

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={selectedProduct}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
}

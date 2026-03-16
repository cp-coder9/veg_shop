import { useState } from 'react';
import { useProducts } from '../hooks/useProducts';
import { ProductQuickOrderList } from '../components/shop/ProductQuickOrderList';
import { ProductDetailModal } from '../components/shop/ProductDetailModal';
import { Product, CATEGORY_LABELS } from '../types';
import { Search, SlidersHorizontal, PackageX } from 'lucide-react';

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
      <div className="flex flex-col items-center justify-center py-40 gap-8">
        <div className="w-16 h-16 border-4 border-[var(--pigment-green)]/10 border-t-[var(--pigment-green)] rounded-full animate-spin" />
        <p className="font-mono text-xs uppercase tracking-[0.3em] opacity-40">Consulting the harvest...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-4xl mx-auto py-20 px-8">
        <div className="bg-[var(--pigment-oxide)]/10 border border-[var(--pigment-oxide)]/20 p-12 text-center">
          <h2 className="text-2xl font-black uppercase tracking-tighter text-[var(--pigment-oxide)] mb-4">Connection Lost</h2>
          <p className="font-mono text-sm opacity-60 uppercase tracking-widest leading-relaxed">
            We couldn't reach the fields. <br /> Please attempt a reconnection shortly.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto px-8 py-20 pb-40">
      {/* Header */}
      <div className="mb-20">
        <p className="font-mono text-[10px] uppercase font-bold tracking-[0.4em] text-[var(--pigment-ochre)] mb-4">
          Direct from the earth
        </p>
        <h1 className="text-6xl font-[900] uppercase tracking-tighter text-[var(--pigment-green)] mb-6">
          Seasonal Shop
        </h1>
        <p className="font-mono text-xs opacity-60 uppercase tracking-widest max-w-sm leading-relaxed">
          Select from our weekly harvest. <br /> Orders harvested fresh for you.
        </p>
      </div>

      {/* Search and Filters */}
      <div className="mb-16 space-y-8">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 opacity-20 group-focus-within:opacity-100 transition-opacity" size={18} />
          <input
            type="text"
            placeholder="FIND PRODUCE..."
            className="w-full bg-white/40 border-b-2 border-[var(--pigment-green)]/10 focus:border-[var(--pigment-green)] py-6 pl-12 pr-6 outline-none font-mono text-xs uppercase tracking-widest transition-all placeholder:opacity-30"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 opacity-40 font-mono text-[10px] uppercase tracking-[0.2em] mb-2">
            <SlidersHorizontal size={14} />
            <span>Classification</span>
          </div>
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-6 py-2 border transition-all font-mono text-[10px] uppercase tracking-widest ${selectedCategory === null
                ? 'bg-[var(--pigment-green)] text-[var(--canvas)] border-[var(--pigment-green)]'
                : 'bg-transparent border-[var(--pigment-ochre)]/20 text-[var(--ink)] hover:border-[var(--pigment-ochre)]'
                }`}
            >
              All Produce
            </button>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category === selectedCategory ? null : category)}
                className={`px-6 py-2 border transition-all font-mono text-[10px] uppercase tracking-widest ${selectedCategory === category
                  ? 'bg-[var(--pigment-green)] text-[var(--canvas)] border-[var(--pigment-green)]'
                  : 'bg-transparent border-[var(--pigment-ochre)]/20 text-[var(--ink)] hover:border-[var(--pigment-ochre)]'
                  }`}
              >
                {CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS] || categoryNames[category] || category}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Products List */}
      {Object.keys(filteredGroups).length === 0 ? (
        <div className="py-32 text-center border-y border-[var(--pigment-ochre)]/10">
          <div className="flex justify-center mb-8 opacity-10">
            <PackageX size={64} />
          </div>
          <h3 className="text-xl font-black uppercase tracking-tighter text-[var(--pigment-green)] mb-3">Void In The Fields</h3>
          <p className="font-mono text-[10px] opacity-40 uppercase tracking-[0.2em]">
            No produce matches your current criteria
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-12">
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


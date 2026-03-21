import { useState } from 'react';
import { useProducts } from '../hooks/useProducts.js';
import { useOrderWindowStatus } from '../hooks/useOrders.js';
import { ProductQuickOrderList } from '../components/shop/ProductQuickOrderList.js';
import { ProductDetailModal } from '../components/shop/ProductDetailModal.js';
import { QuickOrderSection } from '../components/shop/QuickOrderSection.js';
import { Product, CATEGORY_LABELS } from '../types/index.js';
import { Search, SlidersHorizontal, PackageX, Calendar, Truck, Layers, Leaf } from 'lucide-react';

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
  const { data: windowStatus } = useOrderWindowStatus();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<string | null>(null);
  const [selectedDeliveryDay, setSelectedDeliveryDay] = useState<string | null>(null);
  const [groupBy, setGroupBy] = useState<'category' | 'supplier' | 'deliveryDay'>('category');
  const [showSeasonalOnly, setShowSeasonalOnly] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Group products based on selected grouping method
  const groupedProducts: Record<string, Product[]> = Array.isArray(products)
    ? products.reduce((acc, product) => {
      let key = 'other';
      if (groupBy === 'category') {
        key = product.category || 'other';
      } else if (groupBy === 'supplier') {
        key = product.supplier?.name || 'Unknown Supplier';
      } else if (groupBy === 'deliveryDay') {
        key = product.deliveryDay || 'Unscheduled';
      }

      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(product);
      return acc;
    }, {} as Record<string, Product[]>)
    : {};

  // Filter products based on all criteria
  const filteredGroups = Object.entries(groupedProducts).reduce((acc, [groupKey, groupProducts]) => {
    const filtered = (groupProducts || []).filter(
      (p) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        (!selectedCategory || p.category === selectedCategory) &&
        (!selectedSupplier || p.supplier?.name === selectedSupplier) &&
        (!selectedDeliveryDay || p.deliveryDay === selectedDeliveryDay) &&
        (!showSeasonalOnly || p.isSeasonal)
    );
    if (filtered.length > 0) {
      acc[groupKey] = filtered;
    }
    return acc;
  }, {} as Record<string, Product[]>);

  // Get unique values for filters
  const categories = Array.isArray(products) ? [...new Set(products.map((p) => p.category || 'other'))].sort() : [];
  const supplierNames = Array.isArray(products)
    ? [...new Set(products.filter(p => p.supplier?.name).map(p => p.supplier!.name))].sort()
    : [];
  const deliveryDays = Array.isArray(products) ? [...new Set(products.filter(p => p.deliveryDay).map(p => p.deliveryDay!))].sort() : [];

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

        <div className="flex flex-col gap-6">
          <div className="flex flex-col md:flex-row justify-between gap-8">
            {/* Group By Toggle */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 opacity-40 font-mono text-[10px] uppercase tracking-[0.2em] mb-2">
                <Layers size={14} />
                <span>Organisation</span>
              </div>
              <div className="flex border border-[var(--pigment-green)]/10 p-1 bg-white/40 self-start">
                {[
                  { id: 'category', label: 'By Type' },
                  { id: 'supplier', label: 'By Supplier' },
                  { id: 'deliveryDay', label: 'By Harvest Day' },
                ].map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setGroupBy(option.id as any)}
                    className={`px-6 py-2 font-mono text-[10px] uppercase tracking-widest transition-all ${groupBy === option.id
                      ? 'bg-[var(--pigment-green)] text-[var(--canvas)]'
                      : 'text-[var(--ink)] opacity-40 hover:opacity-100'
                      }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Seasonal Toggle */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 opacity-40 font-mono text-[10px] uppercase tracking-[0.2em] mb-2">
                <Leaf size={14} />
                <span>Curation</span>
              </div>
              <button
                onClick={() => setShowSeasonalOnly(!showSeasonalOnly)}
                className={`flex justify-between items-center gap-8 px-6 py-3 border transition-all font-mono text-[10px] uppercase tracking-widest self-start ${showSeasonalOnly
                  ? 'bg-amber-100 border-amber-300 text-amber-800'
                  : 'bg-white/40 border-[var(--pigment-green)]/10 opacity-40 hover:opacity-100'
                  }`}
              >
                <span>Seasonal Only</span>
                <div className={`w-3 h-3 rounded-full ${showSeasonalOnly ? 'bg-amber-500 animate-pulse' : 'bg-gray-300'}`} />
              </button>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-[var(--pigment-green)]/5">
            <div className="flex items-center gap-3 opacity-40 font-mono text-[10px] uppercase tracking-[0.2em]">
              <SlidersHorizontal size={14} />
              <span>Refinements</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {/* Category Filters */}
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category === selectedCategory ? null : category)}
                  className={`px-4 py-2 border transition-all font-mono text-[9px] uppercase tracking-widest ${selectedCategory === category
                    ? 'bg-[var(--pigment-green)] text-[var(--canvas)] border-[var(--pigment-green)]'
                    : 'bg-transparent border-[var(--pigment-ochre)]/20 text-[var(--ink)] opacity-40 hover:opacity-100 hover:border-[var(--pigment-ochre)]'
                    }`}
                >
                  {CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS] || categoryNames[category] || category}
                </button>
              ))}

              {/* Delivery Day Filters */}
              {deliveryDays.map((day) => (
                <button
                  key={day}
                  onClick={() => setSelectedDeliveryDay(day === selectedDeliveryDay ? null : day)}
                  className={`px-4 py-2 border transition-all font-mono text-[9px] uppercase tracking-widest flex items-center gap-2 ${selectedDeliveryDay === day
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-transparent border-blue-200 text-blue-800 opacity-40 hover:opacity-100'
                    }`}
                >
                  <Calendar size={10} />
                  {day}
                </button>
              ))}

              {/* Supplier Filters */}
              {supplierNames.map((supplier) => (
                <button
                  key={supplier}
                  onClick={() => setSelectedSupplier(supplier === selectedSupplier ? null : supplier)}
                  className={`px-4 py-2 border transition-all font-mono text-[9px] uppercase tracking-widest flex items-center gap-2 ${selectedSupplier === supplier
                    ? 'bg-purple-600 text-white border-purple-600'
                    : 'bg-transparent border-purple-200 text-purple-800 opacity-40 hover:opacity-100'
                    }`}
                >
                  <Truck size={10} />
                  {supplier}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Order Section */}
      <QuickOrderSection />

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
          {Object.entries(filteredGroups).map(([groupKey, groupProducts]) => (
            <ProductQuickOrderList
              key={groupKey}
              products={groupProducts || []}
              category={groupBy === 'category' ? groupKey : groupBy === 'supplier' ? `Supplier: ${groupKey}` : `Harvest: ${groupKey}`}
              onProductClick={handleProductClick}
              isDisabled={windowStatus?.isOpen === false}
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

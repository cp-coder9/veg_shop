import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useProducts } from '../hooks/useProducts';
import { useCartStore } from '../stores/cartStore';
import ProductCard from '../components/ProductCard';
import { CATEGORY_LABELS, Product, ProductCategory } from '../types';

export default function ProductsPage() {
  const { data: products, isLoading, isError } = useProducts();
  const totalItems = useCartStore((state) => state.getTotalItems());
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = useMemo(() => {
    if (!products) return [];
    const uniqueCategories = [...new Set(products.map(p => p.category))];
    return uniqueCategories.sort();
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (!products) return {};
    
    let filtered = products;
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query) ||
        CATEGORY_LABELS[p.category].toLowerCase().includes(query)
      );
    }
    
    return filtered.reduce((acc, product) => {
      if (!acc[product.category]) {
        acc[product.category] = [];
      }
      acc[product.category].push(product);
      return acc;
    }, {} as Record<Product['category'], Product[]>);
  }, [products, selectedCategory, searchQuery]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 min-h-screen">
        <div className="text-center">
          <div className="loading-spinner h-16 w-16 mx-auto mb-4"></div>
          <p className="text-lg text-warm-gray-600">Loading fresh products...</p>
          <p className="text-sm text-warm-gray-500 mt-2">Please wait while we fetch the latest harvest</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="card border-l-4 border-red-500">
          <div className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-display font-semibold text-lg text-organic-green-900 mb-2">
                  Failed to Load Products
                </h3>
                <p className="text-warm-gray-600 mb-4">
                  We're having trouble fetching our product catalog. Please try again in a few moments.
                </p>
                <button 
                  onClick={() => window.location.reload()}
                  className="btn-primary"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-organic-green-600 to-organic-green-700 p-8 text-white">
        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-4xl font-display font-bold mb-2">
                Fresh Organic Products
              </h1>
              <p className="text-organic-green-100 text-lg">
                Browse our selection of farm-fresh vegetables and fruits
              </p>
            </div>
            {totalItems > 0 && (
              <Link
                to="/cart"
                className="inline-flex items-center gap-3 bg-white text-organic-green-700 px-6 py-3 rounded-xl font-semibold hover:bg-organic-green-50 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span>View Cart</span>
                <span className="bg-organic-green-600 text-white text-sm font-bold px-2 py-1 rounded-full">
                  {totalItems}
                </span>
              </Link>
            )}
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full filter blur-3xl transform translate-x-16 -translate-y-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full filter blur-2xl transform -translate-x-8 translate-y-8"></div>
      </div>

      {/* Search and Filters */}
      <div className="card">
        <div className="p-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Search */}
            <div className="flex-1">
              <label htmlFor="search" className="block text-sm font-medium text-warm-gray-700 mb-2">
                Search Products
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-warm-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  id="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input-field pl-10"
                  placeholder="Search by name, description, or category..."
                />
              </div>
            </div>
            
            {/* Category Filter */}
            <div className="lg:w-80">
              <label htmlFor="category" className="block text-sm font-medium text-warm-gray-700 mb-2">
                Filter by Category
              </label>
              <select
                id="category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="input-field"
              >
                <option value="all">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {CATEGORY_LABELS[category as ProductCategory]}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Results count */}
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-warm-gray-600">
              {Object.values(filteredProducts).reduce((acc: number, prods) => acc + (prods as Product[]).length, 0)} products found
            </p>
            {(selectedCategory !== 'all' || searchQuery) && (
              <button
                onClick={() => {
                  setSelectedCategory('all');
                  setSearchQuery('');
                }}
                className="text-sm text-organic-green-600 hover:text-organic-green-700 font-medium"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Products by Category */}
      {Object.entries(filteredProducts).map(([category, categoryProducts]) => (
        <div key={category} className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-1 h-8 bg-organic-green-600 rounded-full"></div>
              <h2 className="text-3xl font-display font-bold text-organic-green-900">
                {CATEGORY_LABELS[category as Product['category']]}
              </h2>
            </div>
            <div className="flex items-center gap-2 text-sm text-warm-gray-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              {(categoryProducts as Product[]).length} items
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {(categoryProducts as Product[]).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      ))}

      {/* Empty State */}
      {products && Object.values(filteredProducts).reduce((acc: number, prods) => acc + (prods as Product[]).length, 0) === 0 && (
        <div className="card">
          <div className="p-12 text-center">
            <div className="w-20 h-20 bg-warm-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-warm-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13H4m16 0a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4a2 2 0 012-2m16 0V9a2 2 0 00-2-2M4 13V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-xl font-display font-semibold text-organic-green-900 mb-2">
              No Products Found
            </h3>
            <p className="text-warm-gray-600 max-w-md mx-auto">
              {searchQuery 
                ? `No products match your search for "${searchQuery}"`
                : selectedCategory !== 'all'
                ? `No products available in ${CATEGORY_LABELS[selectedCategory as ProductCategory]}`
                : 'No products are currently available in our catalog.'}
            </p>
            {(searchQuery || selectedCategory !== 'all') && (
              <button
                onClick={() => {
                  setSelectedCategory('all');
                  setSearchQuery('');
                }}
                className="btn-primary mt-6"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
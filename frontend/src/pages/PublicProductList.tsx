import { useState } from 'react';
import { useProducts } from '../hooks/useProducts.js';
import { Product, CATEGORY_LABELS } from '../types/index.js';
import { Search, Leaf } from 'lucide-react';

export default function PublicProductList() {
    const { data: products, isLoading } = useProducts();
    const [searchTerm, setSearchTerm] = useState('');

    const filteredProducts = Array.isArray(products)
        ? products.filter(p =>
            p.isAvailable &&
            (p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.description?.toLowerCase().includes(searchTerm.toLowerCase()))
        )
        : [];

    const groupedProducts = filteredProducts.reduce((acc, product) => {
        const key = product.category || 'other';
        if (!acc[key]) acc[key] = [];
        acc[key].push(product);
        return acc;
    }, {} as Record<string, Product[]>);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-warm-gray-50 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-organic-green-200 border-t-organic-green-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-warm-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-warm-gray-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Leaf className="text-organic-green-600 w-8 h-8" />
                            <h1 className="font-display font-bold text-2xl text-organic-green-900 tracking-tight">Our Fresh List</h1>
                        </div>
                        <div className="relative w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Search products..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-warm-gray-100 border-transparent rounded-full text-sm focus:bg-white focus:ring-2 focus:ring-organic-green-500 transition-all"
                            />
                        </div>
                    </div>
                </div>
            </header>

            {/* Hero */}
            <section className="bg-organic-green-900 text-white py-16 overflow-hidden relative">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="max-w-2xl">
                        <h2 className="text-4xl md:text-5xl font-display font-black leading-tight mb-4">
                            Direct from our fields <br />to your table.
                        </h2>
                        <p className="text-organic-green-100 text-lg mb-8 max-w-lg">
                            Check our available harvest this week. Freshly picked, organically grown, and hand-delivered.
                        </p>
                        <a
                            href="/login"
                            className="inline-block bg-white text-organic-green-900 font-bold px-8 py-4 rounded-xl hover:bg-organic-green-50 transition-colors shadow-xl"
                        >
                            Sign up to Order
                        </a>
                    </div>
                </div>
                {/* Abstract background element */}
                <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-organic-green-800 rounded-full blur-3xl opacity-50"></div>
            </section>

            {/* Product List */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {Object.entries(groupedProducts).length > 0 ? (
                    Object.entries(groupedProducts).map(([category, items]) => (
                        <div key={category} className="mb-16 last:mb-0">
                            <h3 className="text-xl font-display font-bold text-warm-gray-900 mb-8 flex items-center gap-3">
                                <span className="w-8 h-0.5 bg-organic-green-600"></span>
                                {CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS] || category}
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                                {items.map(product => (
                                    <div key={product.id} className="bg-white rounded-2xl border border-warm-gray-200 overflow-hidden group hover:shadow-2xl transition-all duration-300">
                                        <div className="relative aspect-square">
                                            {product.imageUrl ? (
                                                <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                            ) : (
                                                <div className="w-full h-full bg-organic-green-50 flex items-center justify-center">
                                                    <Leaf className="w-12 h-12 text-organic-green-200" />
                                                </div>
                                            )}
                                            <div className="absolute top-4 left-4 flex flex-col gap-2">
                                                {product.isSeasonal && <span className="px-3 py-1 bg-amber-100 text-amber-800 text-[10px] font-bold uppercase tracking-wider rounded-full shadow-sm">Seasonal</span>}
                                            </div>
                                        </div>
                                        <div className="p-6">
                                            <h4 className="font-display font-bold text-lg text-warm-gray-900 mb-1">{product.name}</h4>
                                            <p className="text-sm text-warm-gray-500 mb-4 line-clamp-2">{product.description}</p>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <span className="text-2xl font-black text-organic-green-900">R{(Number(product.price) / 100).toFixed(2)}</span>
                                                    <span className="text-sm text-warm-gray-400"> / {product.unit}</span>
                                                </div>
                                                <a href="/login" className="text-organic-green-600 font-bold text-sm hover:underline">Log in to buy</a>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-24">
                        <h3 className="text-2xl font-display font-bold text-warm-gray-900 mb-2">No products found</h3>
                        <p className="text-warm-gray-500">Try adjusting your search or check back later for a fresh harvest.</p>
                    </div>
                )}
            </main>

            {/* Footer info */}
            <footer className="bg-white border-t border-warm-gray-200 py-12">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <p className="text-warm-gray-400 text-sm">© 2026 The Organic Vegetable Shop. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}

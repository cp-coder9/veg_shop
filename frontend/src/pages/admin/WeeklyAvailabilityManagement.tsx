import { useState, useMemo } from 'react';
import {
    useWeeklyAvailability,
    useToggleAvailability,
    useConfirmAvailability,
    useCopyPreviousWeek,
    WeeklyAvailabilityItem,
} from '../../hooks/useWeeklyAvailability.js';
import {
    CheckCircle,
    XCircle,
    Search,
    Copy,
    Lock,
    ChevronLeft,
    ChevronRight,
    Leaf,
    Filter,
} from 'lucide-react';
import { Button, Card, CardContent } from '../../components/ui/index.js';
import { toast } from 'react-hot-toast';

/** Get the Monday of the week containing `date` */
function getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
}

function formatWeekLabel(date: Date): string {
    const end = new Date(date);
    end.setDate(end.getDate() + 6);
    const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
    return `${date.toLocaleDateString('en-ZA', opts)} – ${end.toLocaleDateString('en-ZA', opts)}`;
}

function toISODate(date: Date): string {
    return date.toISOString().split('T')[0];
}

export default function WeeklyAvailabilityManagement() {
    // Default to NEXT week's Monday (admin confirms for following week)
    const [weekOffset, setWeekOffset] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState<string>('');
    const [filterSupplier, setFilterSupplier] = useState<string>('');
    const [showSeasonalOnly, setShowSeasonalOnly] = useState(false);

    const currentMonday = useMemo(() => {
        const m = getWeekStart(new Date());
        m.setDate(m.getDate() + weekOffset * 7);
        return m;
    }, [weekOffset]);

    const weekStartStr = toISODate(currentMonday);
    const { data, isLoading, refetch } = useWeeklyAvailability(weekStartStr);
    const toggleMutation = useToggleAvailability();
    const confirmMutation = useConfirmAvailability();
    const copyPrevMutation = useCopyPreviousWeek();

    const availability = data?.availability ?? [];
    const isConfirmed = data?.isConfirmed ?? false;

    // Derive unique categories & suppliers for filtering
    const categories = useMemo(() => {
        const set = new Set(availability.map((a) => a.product.category));
        return Array.from(set).sort();
    }, [availability]);

    const suppliers = useMemo(() => {
        const map = new Map<string, string>();
        availability.forEach((a) => {
            if (a.product.supplier) {
                map.set(a.product.supplier.id, a.product.supplier.name);
            }
        });
        return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]));
    }, [availability]);

    // Filter
    const filtered = useMemo(() => {
        return availability.filter((item) => {
            if (searchTerm && !item.product.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
            if (filterCategory && item.product.category !== filterCategory) return false;
            if (filterSupplier && item.product.supplierId !== filterSupplier) return false;
            if (showSeasonalOnly && !item.product.isSeasonal) return false;
            return true;
        });
    }, [availability, searchTerm, filterCategory, filterSupplier, showSeasonalOnly]);

    // Group by category for display
    const grouped = useMemo(() => {
        const map = new Map<string, WeeklyAvailabilityItem[]>();
        filtered.forEach((item) => {
            const cat = item.product.category;
            if (!map.has(cat)) map.set(cat, []);
            map.get(cat)!.push(item);
        });
        return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    }, [filtered]);

    const stats = useMemo(() => {
        const total = availability.length;
        const available = availability.filter((a) => a.isAvailable).length;
        const seasonal = availability.filter((a) => a.product.isSeasonal).length;
        return { total, available, unavailable: total - available, seasonal };
    }, [availability]);

    const handleToggle = (item: WeeklyAvailabilityItem) => {
        toggleMutation.mutate(
            { weekStart: weekStartStr, productId: item.productId, isAvailable: !item.isAvailable },
            {
                onError: () => toast.error('Failed to toggle availability'),
            },
        );
    };

    const handleConfirm = () => {
        if (isConfirmed) return;
        confirmMutation.mutate(weekStartStr, {
            onSuccess: () => toast.success('Week availability confirmed ✅'),
            onError: () => toast.error('Failed to confirm'),
        });
    };

    const handleCopyPrevious = () => {
        copyPrevMutation.mutate(weekStartStr, {
            onSuccess: (data: { copied: number }) => {
                toast.success(`Copied ${data.copied} products from previous week`);
                refetch();
            },
            onError: () => toast.error('No previous week data found'),
        });
    };

    return (
        <div>
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h1 className="font-display text-display-sm text-primary-dark">Weekly Availability</h1>
                    <p className="font-body text-body-md text-warm-gray mt-1">
                        Toggle products on/off for the upcoming week
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="secondary"
                        onClick={handleCopyPrevious}
                        disabled={copyPrevMutation.isPending || availability.length > 0}
                        className="flex items-center gap-2"
                    >
                        <Copy size={16} />
                        Copy Last Week
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleConfirm}
                        disabled={isConfirmed || confirmMutation.isPending || availability.length === 0}
                        className="flex items-center gap-2"
                    >
                        <Lock size={16} />
                        {isConfirmed ? 'Confirmed ✅' : 'Confirm Availability'}
                    </Button>
                </div>
            </div>

            {/* Week navigator */}
            <Card className="mb-6">
                <CardContent className="flex items-center justify-between py-3">
                    <button
                        onClick={() => setWeekOffset((o) => o - 1)}
                        className="p-2 hover:bg-cream rounded-lg transition-colors"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <div className="text-center">
                        <p className="font-display text-body-lg text-primary-dark">{formatWeekLabel(currentMonday)}</p>
                        <p className="font-accent text-caption text-warm-gray">
                            {weekOffset === 0 ? 'This week' : weekOffset === 1 ? 'Next week' : `${weekOffset > 0 ? '+' : ''}${weekOffset} weeks`}
                        </p>
                    </div>
                    <button
                        onClick={() => setWeekOffset((o) => o + 1)}
                        className="p-2 hover:bg-cream rounded-lg transition-colors"
                    >
                        <ChevronRight size={20} />
                    </button>
                </CardContent>
            </Card>

            {/* Stats bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                <Card>
                    <CardContent className="py-3 text-center">
                        <p className="font-display text-display-xs text-primary-dark">{stats.total}</p>
                        <p className="font-accent text-caption text-warm-gray">Total Products</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="py-3 text-center">
                        <p className="font-display text-display-xs text-green-600">{stats.available}</p>
                        <p className="font-accent text-caption text-warm-gray">Available</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="py-3 text-center">
                        <p className="font-display text-display-xs text-red-500">{stats.unavailable}</p>
                        <p className="font-accent text-caption text-warm-gray">Unavailable</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="py-3 text-center">
                        <p className="font-display text-display-xs text-amber-600">{stats.seasonal}</p>
                        <p className="font-accent text-caption text-warm-gray">Seasonal</p>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card className="mb-6">
                <CardContent className="py-3">
                    <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-gray" size={18} />
                            <input
                                type="text"
                                placeholder="Search products..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-light-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-green font-body text-body-sm"
                            />
                        </div>
                        <div className="flex gap-2 items-center flex-wrap">
                            <Filter size={16} className="text-warm-gray" />
                            <select
                                value={filterCategory}
                                onChange={(e) => setFilterCategory(e.target.value)}
                                className="px-3 py-2 border border-light-gray rounded-lg font-body text-body-sm focus:outline-none focus:ring-2 focus:ring-primary-green"
                            >
                                <option value="">All Categories</option>
                                {categories.map((cat) => (
                                    <option key={cat} value={cat}>
                                        {cat}
                                    </option>
                                ))}
                            </select>
                            <select
                                value={filterSupplier}
                                onChange={(e) => setFilterSupplier(e.target.value)}
                                className="px-3 py-2 border border-light-gray rounded-lg font-body text-body-sm focus:outline-none focus:ring-2 focus:ring-primary-green"
                            >
                                <option value="">All Suppliers</option>
                                {suppliers.map(([id, name]) => (
                                    <option key={id} value={id}>
                                        {name}
                                    </option>
                                ))}
                            </select>
                            <button
                                onClick={() => setShowSeasonalOnly((v) => !v)}
                                className={`flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${showSeasonalOnly
                                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                    : 'bg-gray-50 text-gray-600 border border-light-gray hover:bg-gray-100'
                                    }`}
                            >
                                <Leaf size={14} />
                                Seasonal
                            </button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Confirmed banner */}
            {isConfirmed && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                    <CheckCircle size={18} className="text-green-600" />
                    <span className="font-body text-body-sm text-green-800">
                        This week's availability has been confirmed. Toggle changes will still be saved.
                    </span>
                </div>
            )}

            {/* Product list */}
            {isLoading ? (
                <div className="p-12 text-center text-warm-gray">Loading availability...</div>
            ) : availability.length === 0 ? (
                <Card>
                    <CardContent className="text-center py-12">
                        <p className="font-body text-body-md text-warm-gray">
                            No availability data for this week yet.
                        </p>
                        <Button variant="secondary" onClick={handleCopyPrevious} className="mt-4">
                            <Copy size={16} className="mr-2" />
                            Copy from Last Week
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-6">
                    {grouped.map(([category, items]) => (
                        <div key={category}>
                            <h2 className="font-display text-body-lg text-primary-dark mb-3 capitalize">
                                {category.replace(/_/g, ' ')}
                                <span className="font-accent text-caption text-warm-gray ml-2">({items.length})</span>
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {items.map((item) => (
                                    <div
                                        key={item.id}
                                        className={`flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer ${item.isAvailable
                                            ? 'bg-white border-green-200 hover:border-green-400'
                                            : 'bg-gray-50 border-gray-200 hover:border-gray-400 opacity-60'
                                            }`}
                                        onClick={() => handleToggle(item)}
                                    >
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="font-body text-body-sm text-primary-dark truncate">
                                                    {item.product.name}
                                                </span>
                                                {item.product.isSeasonal && (
                                                    <Leaf size={14} className="text-amber-500 flex-shrink-0" />
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="font-accent text-caption text-warm-gray">
                                                    R{Number(item.product.price).toFixed(2)} / {item.product.unit}
                                                </span>
                                                {item.product.supplier && (
                                                    <span className="font-accent text-caption text-blue-500">
                                                        · {item.product.supplier.name}
                                                    </span>
                                                )}
                                                {item.product.deliveryDay && (
                                                    <span className="font-accent text-caption text-purple-500">
                                                        · {item.product.deliveryDay}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleToggle(item);
                                            }}
                                            className={`ml-3 p-1.5 rounded-full transition-colors flex-shrink-0 ${item.isAvailable
                                                ? 'bg-green-100 text-green-600 hover:bg-green-200'
                                                : 'bg-red-100 text-red-500 hover:bg-red-200'
                                                }`}
                                        >
                                            {item.isAvailable ? <CheckCircle size={20} /> : <XCircle size={20} />}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <p className="font-accent text-caption text-warm-gray mt-6 text-center">
                Showing {filtered.length} of {availability.length} products
            </p>
        </div>
    );
}

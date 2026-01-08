export type ProductCategory = 'bakery' | 'broths' | 'nuts_fruit' | 'vegetables' | 'fruit' | 'local_produce' | 'plant_based' | 'dairy' | 'meat';

export interface Product {
  id: string;
  name: string;
  price: number | string; // Prisma Decimal serializes as string
  category: ProductCategory;
  unit: ProductUnit;
  description: string | null;
  imageUrl: string | null;
  isAvailable: boolean;
  isSeasonal: boolean;
  packingType: string;
  supplierId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  productId: string;
  quantity: number;
}

export interface Order {
  id: string;
  customerId: string;
  deliveryDate: string;
  deliveryMethod: 'delivery' | 'collection';
  deliveryAddress: string | null;
  specialInstructions: string | null;
  status: 'pending' | 'confirmed' | 'packed' | 'delivered' | 'cancelled';
  packerId?: string | null;
  items: {
    id: string;
    productId: string;
    product: Product;
    quantity: number;
    priceAtOrder: number | string; // Prisma Decimal serializes as string
  }[];
  customerName?: string;
  totalAmount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Invoice {
  id: string;
  orderId: string;
  customerId: string;
  customer?: { id: string; name: string };
  subtotal: number | string; // Prisma Decimal serializes as string
  creditApplied: number | string; // Prisma Decimal serializes as string
  total: number | string; // Prisma Decimal serializes as string
  status: 'unpaid' | 'partial' | 'paid';
  pdfUrl: string | null;
  createdAt: string;
  dueDate: string;
}

export const CATEGORY_LABELS: Record<ProductCategory, string> = {
  bakery: '🍞 Pantry & Bakery',
  broths: '🥣 Broths & Brothcicles',
  nuts_fruit: '🥜 Nuts & Dried Fruit',
  vegetables: '🥬 Vegetables',
  fruit: '🍎 Fruit',
  local_produce: '🏞️ Local Farm Produce',
  plant_based: '🌱 Plant Based (Tabu)',
  dairy: '🥛 Dairy',
  meat: '🥩 Meat & Poultry',
};

export type ProductUnit =
  | 'bottle' | 'box' | 'bucket' | 'bunch' | 'dozen' | 'each' | 'g' | 'kg'
  | 'kg_approx' | 'litres' | 'loaf' | 'ml' | 'pack' | 'punnet' | 'tray' | 'tub' | 'unit';

export const UNIT_LABELS: Record<ProductUnit, string> = {
  bottle: 'bottle',
  box: 'box',
  bucket: 'bucket',
  bunch: 'bunch',
  dozen: 'dozen',
  each: 'each',
  g: 'g',
  kg: 'kg',
  kg_approx: 'kg (approx)',
  litres: 'litres',
  loaf: 'loaf',
  ml: 'ml',
  pack: 'pack',
  punnet: 'punnet',
  tray: 'tray',
  tub: 'tub',
  unit: 'unit',
};

export interface SalesReport {
  startDate: string;
  endDate: string;
  totalRevenue: number;
  totalOrders: number;
  productsSold: {
    productId: string;
    productName: string;
    quantitySold: number;
    revenue: number;
  }[];
}

export interface PaymentStatusReport {
  totalOutstanding: number;
  customers: {
    customerId: string;
    customerName: string;
    outstandingBalance: number;
    lastPaymentDate: string | null;
  }[];
}

export interface ProductPopularityReport {
  startDate: string;
  endDate: string;
  products: {
    productId: string;
    productName: string;
    orderCount: number;
    totalQuantity: number;
    revenue: number;
  }[];
}

export interface CustomerActivityReport {
  startDate: string;
  endDate: string;
  customers: {
    customerId: string;
    customerName: string;
    orderCount: number;
    totalSpent: number;
    averageOrderValue: number;
    lastOrderDate: string | null;
  }[];
}

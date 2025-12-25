export type ProductCategory = 'vegetables' | 'fruits' | 'dairy_eggs' | 'bread_bakery' | 'pantry' | 'meat_protein';

export interface Product {
  id: string;
  name: string;
  price: number | string; // Prisma Decimal serializes as string
  category: ProductCategory;
  unit: 'kg' | 'g' | 'L' | 'ml' | 'dozen' | 'loaf' | 'pack' | 'piece';
  description: string | null;
  imageUrl: string | null;
  isAvailable: boolean;
  isSeasonal: boolean;
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
  subtotal: number | string; // Prisma Decimal serializes as string
  creditApplied: number | string; // Prisma Decimal serializes as string
  total: number | string; // Prisma Decimal serializes as string
  status: 'unpaid' | 'partial' | 'paid';
  pdfUrl: string | null;
  createdAt: string;
  dueDate: string;
}

export const CATEGORY_LABELS: Record<ProductCategory, string> = {
  vegetables: 'Vegetables',
  fruits: 'Fruits',
  dairy_eggs: 'Dairy & Eggs',
  bread_bakery: 'Bread & Bakery',
  pantry: 'Pantry Items',
  meat_protein: 'Meat & Protein',
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

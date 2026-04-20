export type ProductCategory = 'bakery' | 'broths' | 'nuts_fruit' | 'vegetables' | 'fruit' | 'local_produce' | 'plant_based' | 'dairy' | 'meat';
export type PackingType = 'ambient' | 'cold' | 'frozen' | 'loose';

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
  isPerishable: boolean;
  packingType: PackingType;
  supplierId?: string | null;
  supplier?: { id: string; name: string } | null;
  deliveryDay?: string | null; // "Wednesday" | "Friday" - delivery day for the product
  packQuantity?: number;
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
  deliveryFees?: number | string;
  deliveryInstruction?: 'door' | 'hand_to_me' | 'inside_fridge' | 'inside_freezer' | null;
  groupDelivery?: boolean;
  status: 'pending' | 'confirmed' | 'packed' | 'delivered' | 'cancelled' | 'out_for_delivery';
  packerId?: string | null;
  packerNotes?: string | null;
  packerSignature?: string | null;
  driverId?: string | null;
  deliveryNotes?: string | null;
  driverNotes?: string | null;
  area?: string | null;
  handoverConfirmed?: boolean;
  handoverConfirmedAt?: string;
  packageDetails?: string;
  coolerBagOption: boolean;
  coolerBagStatus: 'none' | 'taken' | 'returned';
  invoice?: Invoice | null;
  items: {
    id: string;
    productId: string;
    product?: Product;
    quantity: number;
    priceAtOrder: number | string; // Prisma Decimal serializes as string
  }[];
  customerName?: string;
  totalAmount?: number;
  customer: {
    id: string;
    name: string;
  };
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

export const PACKING_TYPE_LABELS: Record<PackingType, string> = {
  ambient: '📦 Ambient (Box or Bag)',
  cold: '❄️ Cold (Cooler Box)',
  frozen: '🧊 Frozen (Cooler Box)',
  loose: '🧺 Loose Items',
};

export type ProductUnit =
  | 'pack'
  | 'bottle'
  | 'jar'
  | 'tub'
  | 'block'
  | 'wedge'
  | 'round'
  | 'tray'
  | 'box'
  | 'head'
  | 'each'
  | 'kg'
  | 'g'
  | 'L'
  | 'ml'
  | 'loaf'
  | 'bunch'
  | 'piece';

export const UNIT_LABELS: Record<ProductUnit, string> = {
  pack: 'pack',
  bottle: 'bottle',
  jar: 'jar',
  tub: 'tub',
  block: 'block',
  wedge: 'wedge',
  round: 'round',
  tray: 'tray',
  box: 'box',
  head: 'head',
  each: 'each',
  kg: 'kg',
  g: 'g',
  L: 'L',
  ml: 'ml',
  loaf: 'loaf',
  bunch: 'bunch',
  piece: 'piece',
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

export interface User {
  id: string;
  phone: string | null;
  email: string | null;
  name: string;
  address: string | null;
  deliveryPreference: string;
  birthday: string;
  role: 'customer' | 'admin' | 'packer' | 'driver';
  status: 'active' | 'inactive';
  loyaltyPoints: number;
  createdAt: string;
  updatedAt: string;
}

import { create } from 'zustand';
import { persist, PersistStorage, StorageValue } from 'zustand/middleware';
import { toast } from 'react-hot-toast';

// Cart expiration: 24 hours in milliseconds
const CART_EXPIRATION_MS = 24 * 60 * 60 * 1000; // 24 hours

interface CartItem {
  productId: string;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  _timestamp?: number; // Last modified timestamp
  addItem: (productId: string, quantity?: number, isAvailable?: boolean, productName?: string) => boolean;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number, isAvailable?: boolean, productName?: string) => boolean;
  clearCart: () => void;
  getItemQuantity: (productId: string) => number;
  getTotalItems: () => number;
  setItems: (items: CartItem[]) => void;
  isCartExpired: () => boolean;
}

// Custom storage with expiration check
const cartStorage: PersistStorage<CartState> = {
  getItem: (name: string): StorageValue<CartState> | null => {
    const value = localStorage.getItem(name);
    if (!value) return null;
    
    try {
      const parsed = JSON.parse(value) as StorageValue<CartState>;
      // Check if cart has expired
      if (parsed.state && parsed.state._timestamp) {
        const elapsed = Date.now() - parsed.state._timestamp;
        if (elapsed > CART_EXPIRATION_MS) {
          // Cart expired, remove it
          localStorage.removeItem(name);
          return null;
        }
      }
      return parsed;
    } catch {
      return null;
    }
  },
  setItem: (name: string, value: StorageValue<CartState>): void => {
    localStorage.setItem(name, JSON.stringify(value));
  },
  removeItem: (name: string): void => {
    localStorage.removeItem(name);
  },
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      _timestamp: undefined,

      addItem: (productId, quantity = 1, isAvailable = true, productName = 'Product') => {
        // Check if product is out of stock
        if (!isAvailable) {
          toast.error(`${productName} is currently out of stock`);
          return false;
        }

        set((state) => {
          const existingItem = state.items.find((item) => item.productId === productId);

          if (existingItem) {
            return {
              items: state.items.map((item) =>
                item.productId === productId
                  ? { ...item, quantity: item.quantity + quantity }
                  : item
              ),
              _timestamp: Date.now(),
            };
          }

          return {
            items: [...state.items, { productId, quantity }],
            _timestamp: Date.now(),
          };
        });

        return true;
      },

      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter((item) => item.productId !== productId),
          _timestamp: Date.now(),
        }));
      },

      updateQuantity: (productId, quantity, isAvailable = true, productName = 'Product') => {
        // Check if product is out of stock when trying to add more
        if (!isAvailable && quantity > 0) {
          toast.error(`${productName} is currently out of stock`);
          return false;
        }

        if (quantity <= 0) {
          get().removeItem(productId);
          return true;
        }

        set((state) => ({
          items: state.items.map((item) =>
            item.productId === productId ? { ...item, quantity } : item
          ),
          _timestamp: Date.now(),
        }));

        return true;
      },

      clearCart: () => {
        set({ items: [], _timestamp: undefined });
      },

      getItemQuantity: (productId) => {
        const item = get().items.find((item) => item.productId === productId);
        return item?.quantity || 0;
      },

      setItems: (newItems: CartItem[]) => {
        set({ items: newItems, _timestamp: Date.now() });
      },

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      isCartExpired: () => {
        const timestamp = get()._timestamp;
        if (!timestamp) return false;
        return Date.now() - timestamp > CART_EXPIRATION_MS;
      },
    }),
    {
      name: 'cart-storage',
      storage: cartStorage,
    }
  )
);

import { describe, it, expect, beforeEach } from 'vitest';
import { useCartStore } from './cartStore';

describe('cartStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useCartStore.setState({ items: [] });
  });

  it('adds item to empty cart', () => {
    const { addItem } = useCartStore.getState();
    
    addItem('product-1', 2);
    
    const updatedItems = useCartStore.getState().items;
    expect(updatedItems).toHaveLength(1);
    expect(updatedItems[0]).toEqual({ productId: 'product-1', quantity: 2 });
  });

  it('increases quantity when adding existing item', () => {
    const { addItem } = useCartStore.getState();
    
    addItem('product-1', 2);
    addItem('product-1', 3);
    
    const items = useCartStore.getState().items;
    expect(items).toHaveLength(1);
    expect(items[0].quantity).toBe(5);
  });

  it('removes item from cart', () => {
    const { addItem, removeItem } = useCartStore.getState();
    
    addItem('product-1', 2);
    addItem('product-2', 1);
    removeItem('product-1');
    
    const items = useCartStore.getState().items;
    expect(items).toHaveLength(1);
    expect(items[0].productId).toBe('product-2');
  });

  it('updates item quantity', () => {
    const { addItem, updateQuantity } = useCartStore.getState();
    
    addItem('product-1', 2);
    updateQuantity('product-1', 5);
    
    const items = useCartStore.getState().items;
    expect(items[0].quantity).toBe(5);
  });

  it('removes item when quantity is set to 0', () => {
    const { addItem, updateQuantity } = useCartStore.getState();
    
    addItem('product-1', 2);
    updateQuantity('product-1', 0);
    
    const items = useCartStore.getState().items;
    expect(items).toHaveLength(0);
  });

  it('clears all items from cart', () => {
    const { addItem, clearCart } = useCartStore.getState();
    
    addItem('product-1', 2);
    addItem('product-2', 1);
    clearCart();
    
    const items = useCartStore.getState().items;
    expect(items).toHaveLength(0);
  });

  it('gets item quantity', () => {
    const { addItem, getItemQuantity } = useCartStore.getState();
    
    addItem('product-1', 3);
    
    expect(getItemQuantity('product-1')).toBe(3);
    expect(getItemQuantity('product-2')).toBe(0);
  });

  it('calculates total items count', () => {
    const { addItem, getTotalItems } = useCartStore.getState();
    
    addItem('product-1', 2);
    addItem('product-2', 3);
    
    expect(getTotalItems()).toBe(5);
  });
});

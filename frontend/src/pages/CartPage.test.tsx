/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '../test/utils.js';
import userEvent from '@testing-library/user-event';
import CartPage from './CartPage.js';

const mockProducts = [
  {
    id: '1',
    name: 'Tomatoes',
    price: 25.99,
    category: 'vegetables',
    unit: 'kg',
    isAvailable: true,
    isSeasonal: false,
  },
];

const mockClearCart = vi.fn();

// Mock stores and hooks
vi.mock('../stores/cartStore', () => ({
  useCartStore: vi.fn((selector) => {
    const state = {
      items: [],
      clearCart: mockClearCart,
    };
    return typeof selector === 'function' ? selector(state) : state;
  }),
}));

vi.mock('../stores/authStore', () => ({
  useAuthStore: vi.fn((selector) => {
    const state = {
      user: { id: '1', name: 'Test User', address: '123 Test St' },
    };
    return typeof selector === 'function' ? selector(state) : state;
  }),
}));

vi.mock('../hooks/useProducts', () => ({
  useProducts: () => ({
    data: mockProducts,
    isLoading: false,
  }),
}));

vi.mock('../hooks/useOrders', () => ({
  useCreateOrder: () => ({
    mutateAsync: vi.fn().mockResolvedValue({ id: 'order-1' }),
    isPending: false,
    isError: false,
  }),
}));

import { useCartStore } from '../stores/cartStore.js';

describe('CartPage', () => {
  it('shows empty cart message when cart is empty', () => {
    render(<CartPage />);

    expect(screen.getByText(/your cart is empty/i)).toBeInTheDocument();
    expect(screen.getByText(/browse products/i)).toBeInTheDocument();
  });

  it('displays cart items when cart has products', () => {
    vi.mocked(useCartStore).mockImplementation((selector: any) => {
      const state = {
        items: [{ productId: '1', quantity: 2 }],
        clearCart: mockClearCart,
      };
      return typeof selector === 'function' ? selector(state) : state;
    });

    render(<CartPage />);

    expect(screen.getByText('Review Your Order')).toBeInTheDocument();
    expect(screen.getByText(/Your Checklist/i)).toBeInTheDocument();
  });

  it('shows checkout form when proceed to checkout is clicked', async () => {
    const user = (userEvent as any).setup();
    vi.mocked(useCartStore).mockImplementation((selector: any) => {
      const state = {
        items: [{ productId: '1', quantity: 2 }],
        clearCart: mockClearCart,
      };
      return typeof selector === 'function' ? selector(state) : state;
    });

    render(<CartPage />);

    const checkoutButton = screen.getByText(/Proceed to Checkout/i);
    await user.click(checkoutButton);

    expect(screen.getByText('Checkout')).toBeInTheDocument();
  });

  it('shows delivery address field when delivery method is selected', async () => {
    const user = (userEvent as any).setup();
    vi.mocked(useCartStore).mockImplementation((selector: any) => {
      const state = {
        items: [{ productId: '1', quantity: 2 }],
        clearCart: mockClearCart,
      };
      return typeof selector === 'function' ? selector(state) : state;
    });

    render(<CartPage />);

    const checkoutButton = screen.getByText(/Proceed to Checkout/i);
    await user.click(checkoutButton);

    // Select a delivery option
    const deliverySelect = screen.getByLabelText(/Delivery \/ Collection Point/i);
    fireEvent.change(deliverySelect, { target: { value: 'delivery_paarl' } });

    expect(screen.getByLabelText(/Street Address/i)).toBeInTheDocument();
  });

  it('hides delivery address field when collection method is selected', async () => {
    const user = (userEvent as any).setup();
    vi.mocked(useCartStore).mockImplementation((selector: any) => {
      const state = {
        items: [{ productId: '1', quantity: 2 }],
        clearCart: mockClearCart,
      };
      return typeof selector === 'function' ? selector(state) : state;
    });

    render(<CartPage />);

    const checkoutButton = screen.getByText(/Proceed to Checkout/i);
    await user.click(checkoutButton);

    // Select a collection option
    const deliverySelect = screen.getByLabelText(/Delivery \/ Collection Point/i);
    fireEvent.change(deliverySelect, { target: { value: 'collection_uitgezocht' } });

    expect(screen.queryByLabelText(/Street Address/i)).not.toBeInTheDocument();
  });
});

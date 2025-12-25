/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '../test/utils';
import ProductsPage from './ProductsPage';

const mockProducts = [
  {
    id: '1',
    name: 'Tomatoes',
    price: 25.99,
    category: 'vegetables',
    unit: 'kg',
    description: 'Fresh organic tomatoes',
    imageUrl: null,
    isAvailable: true,
    isSeasonal: false,
  },
  {
    id: '2',
    name: 'Apples',
    price: 35.50,
    category: 'fruits',
    unit: 'kg',
    description: 'Crisp red apples',
    imageUrl: null,
    isAvailable: true,
    isSeasonal: true,
  },
];

// Mock the useProducts hook
vi.mock('../hooks/useProducts', () => ({
  useProducts: vi.fn(),
}));

// Mock the cart store
vi.mock('../stores/cartStore', () => ({
  useCartStore: vi.fn((selector) => {
    const state = {
      getTotalItems: () => 0,
      getItemQuantity: () => 0,
      addItem: vi.fn(),
    };
    if (typeof selector === 'function') {
      return selector(state);
    }
    return state;
  }),
}));

import { useProducts } from '../hooks/useProducts';

describe('ProductsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading state', () => {
    vi.mocked(useProducts).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    } as any);

    render(<ProductsPage />);
    expect(screen.getByText(/loading products/i)).toBeInTheDocument();
  });

  it('shows error state', () => {
    vi.mocked(useProducts).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    } as any);

    render(<ProductsPage />);
    expect(screen.getByText(/failed to load products/i)).toBeInTheDocument();
  });

  it('renders products grouped by category', () => {
    vi.mocked(useProducts).mockReturnValue({
      data: mockProducts,
      isLoading: false,
      isError: false,
    } as any);

    render(<ProductsPage />);
    
    expect(screen.getByText('Vegetables')).toBeInTheDocument();
    expect(screen.getByText('Fruits')).toBeInTheDocument();
    expect(screen.getByText('Tomatoes')).toBeInTheDocument();
    expect(screen.getByText('Apples')).toBeInTheDocument();
  });

  it('shows empty state when no products', () => {
    vi.mocked(useProducts).mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    } as any);

    render(<ProductsPage />);
    expect(screen.getByText(/no products available/i)).toBeInTheDocument();
  });
});

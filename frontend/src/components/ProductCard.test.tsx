import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../test/utils';
import userEvent from '@testing-library/user-event';
import ProductCard from './ProductCard';

const mockProduct = {
  id: '1',
  name: 'Tomatoes',
  price: 25.99,
  category: 'vegetables' as const,
  unit: 'kg' as const,
  description: 'Fresh organic tomatoes',
  imageUrl: null,
  isAvailable: true,
  isSeasonal: false,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

const mockAddItem = vi.fn();
const mockGetItemQuantity = vi.fn();

// Mock the cart store
vi.mock('../stores/cartStore', () => ({
  useCartStore: vi.fn((selector) => {
    if (typeof selector === 'function') {
      return selector({
        addItem: mockAddItem,
        getItemQuantity: mockGetItemQuantity,
      });
    }
    return {
      addItem: mockAddItem,
      getItemQuantity: mockGetItemQuantity,
    };
  }),
}));

describe('ProductCard', () => {
  it('renders product information correctly', () => {
    mockGetItemQuantity.mockReturnValue(0);
    render(<ProductCard product={mockProduct} />);
    
    expect(screen.getByText('Tomatoes')).toBeInTheDocument();
    expect(screen.getByText('R25.99 / kg')).toBeInTheDocument();
    expect(screen.getByText('Fresh organic tomatoes')).toBeInTheDocument();
  });

  it('shows seasonal badge for seasonal products', () => {
    mockGetItemQuantity.mockReturnValue(0);
    const seasonalProduct = { ...mockProduct, isSeasonal: true };
    render(<ProductCard product={seasonalProduct} />);
    
    expect(screen.getByText('Seasonal')).toBeInTheDocument();
  });

  it('calls addItem when add to cart button is clicked', async () => {
    const user = userEvent.setup();
    mockGetItemQuantity.mockReturnValue(0);
    mockAddItem.mockClear();
    
    render(<ProductCard product={mockProduct} />);
    
    const button = screen.getByRole('button', { name: /add to cart/i });
    await user.click(button);
    
    expect(mockAddItem).toHaveBeenCalledWith('1', 1);
  });

  it('shows quantity in cart when item is in cart', () => {
    mockGetItemQuantity.mockReturnValue(3);
    render(<ProductCard product={mockProduct} />);
    
    expect(screen.getByText(/add more \(3 in cart\)/i)).toBeInTheDocument();
  });
});

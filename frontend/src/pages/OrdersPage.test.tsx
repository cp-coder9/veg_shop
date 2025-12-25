/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../test/utils';
import userEvent from '@testing-library/user-event';
import OrdersPage from './OrdersPage';

const mockOrders = [
  {
    id: 'order-1',
    customerId: '1',
    deliveryDate: new Date('2024-02-05'),
    deliveryMethod: 'delivery' as const,
    deliveryAddress: '123 Test St',
    specialInstructions: 'Leave at door',
    status: 'confirmed' as const,
    items: [
      {
        id: 'item-1',
        productId: 'prod-1',
        quantity: 2,
        priceAtOrder: 25.99,
        product: {
          id: 'prod-1',
          name: 'Tomatoes',
          price: 25.99,
          category: 'vegetables',
          unit: 'kg',
        },
      },
    ],
    createdAt: new Date('2024-02-01'),
  },
];

// Mock hooks
vi.mock('../hooks/useOrders', () => ({
  useCustomerOrders: vi.fn(),
}));

// Mock useSearchParams
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useSearchParams: () => [new URLSearchParams()],
  };
});

import { useCustomerOrders } from '../hooks/useOrders';

describe('OrdersPage', () => {
  it('shows loading state', () => {
    vi.mocked(useCustomerOrders).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    } as any);

    render(<OrdersPage />);
    expect(screen.getByText(/loading orders/i)).toBeInTheDocument();
  });

  it('shows error state', () => {
    vi.mocked(useCustomerOrders).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    } as any);

    render(<OrdersPage />);
    expect(screen.getByText(/failed to load orders/i)).toBeInTheDocument();
  });

  it('shows empty state when no orders', () => {
    vi.mocked(useCustomerOrders).mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    } as any);

    render(<OrdersPage />);
    expect(screen.getByText(/no orders yet/i)).toBeInTheDocument();
  });

  it('displays order list', () => {
    vi.mocked(useCustomerOrders).mockReturnValue({
      data: mockOrders,
      isLoading: false,
      isError: false,
    } as any);

    render(<OrdersPage />);
    
    expect(screen.getByText(/order #order-1/i)).toBeInTheDocument();
    expect(screen.getByText('Confirmed')).toBeInTheDocument();
    expect(screen.getByText('R51.98')).toBeInTheDocument();
  });

  it('expands order details when clicked', async () => {
    const user = userEvent.setup();
    vi.mocked(useCustomerOrders).mockReturnValue({
      data: mockOrders,
      isLoading: false,
      isError: false,
    } as any);

    render(<OrdersPage />);
    
    const orderCard = screen.getByText(/order #order-1/i).closest('div');
    if (orderCard) {
      await user.click(orderCard);
    }
    
    expect(screen.getByText('Order Details')).toBeInTheDocument();
    expect(screen.getByText(/tomatoes x 2/i)).toBeInTheDocument();
    expect(screen.getByText('Leave at door')).toBeInTheDocument();
  });
});

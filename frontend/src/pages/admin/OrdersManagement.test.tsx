/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../../test/utils';
import { fireEvent } from '@testing-library/react';
import OrdersManagement from './OrdersManagement';

const mockOrders = [
  {
    id: 'order-1',
    customerId: 'customer-1',
    deliveryDate: '2025-10-29',
    deliveryMethod: 'delivery',
    deliveryAddress: '123 Main St',
    specialInstructions: 'Leave at door',
    status: 'pending',
    items: [
      {
        id: 'item-1',
        productId: 'product-1',
        quantity: 2,
        priceAtOrder: 25.99,
        product: {
          id: 'product-1',
          name: 'Tomatoes',
          unit: 'kg',
        },
      },
    ],
    createdAt: '2025-10-28',
    updatedAt: '2025-10-28',
  },
  {
    id: 'order-2',
    customerId: 'customer-2',
    deliveryDate: '2025-10-30',
    deliveryMethod: 'collection',
    deliveryAddress: null,
    specialInstructions: null,
    status: 'confirmed',
    items: [
      {
        id: 'item-2',
        productId: 'product-2',
        quantity: 3,
        priceAtOrder: 35.50,
        product: {
          id: 'product-2',
          name: 'Apples',
          unit: 'kg',
        },
      },
    ],
    createdAt: '2025-10-28',
    updatedAt: '2025-10-28',
  },
];

vi.mock('../../hooks/useAdminOrders', () => ({
  useAdminOrders: vi.fn(),
  useOrder: vi.fn(),
  useUpdateOrderStatus: vi.fn(),
  useGenerateBulkOrder: vi.fn(),
}));

import {
  useAdminOrders,
  useOrder,
  useUpdateOrderStatus,
  useGenerateBulkOrder,
} from '../../hooks/useAdminOrders';

describe('OrdersManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    vi.mocked(useUpdateOrderStatus).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);
    
    vi.mocked(useGenerateBulkOrder).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);
    
    vi.mocked(useOrder).mockReturnValue({
      data: undefined,
      isLoading: false,
    } as any);
  });

  it('shows loading state', () => {
    vi.mocked(useAdminOrders).mockReturnValue({
      data: undefined,
      isLoading: true,
    } as any);

    render(<OrdersManagement />);
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('renders orders table with data', () => {
    vi.mocked(useAdminOrders).mockReturnValue({
      data: mockOrders,
      isLoading: false,
    } as any);

    render(<OrdersManagement />);
    
    expect(screen.getByText('Orders Management')).toBeInTheDocument();
    expect(screen.getByText(/order-1/i)).toBeInTheDocument();
    expect(screen.getByText(/order-2/i)).toBeInTheDocument();
    expect(screen.getByText('delivery')).toBeInTheDocument();
    expect(screen.getByText('collection')).toBeInTheDocument();
  });

  it('filters orders by delivery date', () => {
    vi.mocked(useAdminOrders).mockReturnValue({
      data: mockOrders,
      isLoading: false,
    } as any);

    render(<OrdersManagement />);
    
    const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;
    fireEvent.change(dateInput, { target: { value: '2025-10-29' } });
    
    expect(useAdminOrders).toHaveBeenCalledWith(
      expect.objectContaining({ deliveryDate: '2025-10-29' })
    );
  });

  it('filters orders by status', () => {
    vi.mocked(useAdminOrders).mockReturnValue({
      data: mockOrders,
      isLoading: false,
    } as any);

    render(<OrdersManagement />);
    
    const statusSelect = screen.getAllByRole('combobox')[0];
    fireEvent.change(statusSelect, { target: { value: 'pending' } });
    
    expect(useAdminOrders).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'pending' })
    );
  });

  it('updates order status', async () => {
    const mockUpdate = vi.fn().mockResolvedValue({});
    vi.mocked(useUpdateOrderStatus).mockReturnValue({
      mutateAsync: mockUpdate,
      isPending: false,
    } as any);
    
    vi.mocked(useAdminOrders).mockReturnValue({
      data: mockOrders,
      isLoading: false,
    } as any);

    render(<OrdersManagement />);
    
    const statusSelects = screen.getAllByRole('combobox');
    // Skip the filter select (index 0), get the first order status select (index 1)
    fireEvent.change(statusSelects[1], { target: { value: 'confirmed' } });
    
    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith({
        id: 'order-1',
        status: 'confirmed',
      });
    });
  });

  it('opens order detail modal', () => {
    vi.mocked(useAdminOrders).mockReturnValue({
      data: mockOrders,
      isLoading: false,
    } as any);

    render(<OrdersManagement />);
    
    const viewButtons = screen.getAllByText('View Details');
    fireEvent.click(viewButtons[0]);
    
    expect(useOrder).toHaveBeenCalledWith('order-1');
  });

  it('opens bulk order modal', () => {
    vi.mocked(useAdminOrders).mockReturnValue({
      data: mockOrders,
      isLoading: false,
    } as any);

    render(<OrdersManagement />);
    
    const bulkButton = screen.getByText('Generate Bulk Order');
    fireEvent.click(bulkButton);
    
    expect(screen.getByText('Generate Bulk Order', { selector: 'h2' })).toBeInTheDocument();
  });

  it('generates bulk order', async () => {
    const mockGenerate = vi.fn().mockResolvedValue({
      weekStartDate: '2025-10-27',
      items: [
        {
          productName: 'Tomatoes',
          totalQuantity: 10,
          bufferQuantity: 1,
          finalQuantity: 11,
        },
      ],
    });
    
    vi.mocked(useGenerateBulkOrder).mockReturnValue({
      mutateAsync: mockGenerate,
      isPending: false,
    } as any);
    
    vi.mocked(useAdminOrders).mockReturnValue({
      data: mockOrders,
      isLoading: false,
    } as any);

    render(<OrdersManagement />);
    
    const bulkButton = screen.getByText('Generate Bulk Order');
    fireEvent.click(bulkButton);
    
    const dateInputs = document.querySelectorAll('input[type="date"]');
    const weekDateInput = dateInputs[dateInputs.length - 1];
    fireEvent.change(weekDateInput, { target: { value: '2025-10-27' } });
    
    const generateButton = screen.getByText('Generate');
    fireEvent.click(generateButton);
    
    await waitFor(() => {
      expect(mockGenerate).toHaveBeenCalledWith('2025-10-27');
    });
  });
});

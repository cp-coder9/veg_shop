/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../../test/utils';
import { fireEvent } from '@testing-library/react';
import ProductsManagement from './ProductsManagement';

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
    isAvailable: false,
    isSeasonal: true,
  },
];

vi.mock('../../hooks/useAdminProducts', () => ({
  useAdminProducts: vi.fn(),
  useCreateProduct: vi.fn(),
  useUpdateProduct: vi.fn(),
  useDeleteProduct: vi.fn(),
  useWhatsAppProductList: vi.fn(),
}));

import {
  useAdminProducts,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  useWhatsAppProductList,
} from '../../hooks/useAdminProducts';

describe('ProductsManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    vi.mocked(useCreateProduct).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);
    
    vi.mocked(useUpdateProduct).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);
    
    vi.mocked(useDeleteProduct).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);
    
    vi.mocked(useWhatsAppProductList).mockReturnValue({
      data: 'Product List',
      refetch: vi.fn(),
    } as any);
  });

  it('shows loading state', () => {
    vi.mocked(useAdminProducts).mockReturnValue({
      data: undefined,
      isLoading: true,
    } as any);

    render(<ProductsManagement />);
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('renders products table with data', () => {
    vi.mocked(useAdminProducts).mockReturnValue({
      data: mockProducts,
      isLoading: false,
    } as any);

    render(<ProductsManagement />);
    
    expect(screen.getByText('Products Management')).toBeInTheDocument();
    expect(screen.getByText('Tomatoes')).toBeInTheDocument();
    expect(screen.getByText('Apples')).toBeInTheDocument();
    expect(screen.getByText('R 25.99')).toBeInTheDocument();
    expect(screen.getByText('R 35.50')).toBeInTheDocument();
  });

  it('filters products by category', () => {
    vi.mocked(useAdminProducts).mockReturnValue({
      data: mockProducts,
      isLoading: false,
    } as any);

    render(<ProductsManagement />);
    
    const categorySelect = screen.getAllByRole('combobox')[0];
    fireEvent.change(categorySelect, { target: { value: 'vegetables' } });
    
    expect(useAdminProducts).toHaveBeenCalledWith(
      expect.objectContaining({ category: 'vegetables' })
    );
  });

  it('filters products by availability', () => {
    vi.mocked(useAdminProducts).mockReturnValue({
      data: mockProducts,
      isLoading: false,
    } as any);

    render(<ProductsManagement />);
    
    const availabilitySelect = screen.getAllByRole('combobox')[1];
    fireEvent.change(availabilitySelect, { target: { value: 'true' } });
    
    expect(useAdminProducts).toHaveBeenCalledWith(
      expect.objectContaining({ isAvailable: true })
    );
  });

  it('opens add product modal', () => {
    vi.mocked(useAdminProducts).mockReturnValue({
      data: mockProducts,
      isLoading: false,
    } as any);

    render(<ProductsManagement />);
    
    const addButton = screen.getByText('Add Product');
    fireEvent.click(addButton);
    
    expect(screen.getByText('Add Product', { selector: 'h2' })).toBeInTheDocument();
  });

  it('opens edit product modal', () => {
    vi.mocked(useAdminProducts).mockReturnValue({
      data: mockProducts,
      isLoading: false,
    } as any);

    render(<ProductsManagement />);
    
    const editButtons = screen.getAllByText('Edit');
    fireEvent.click(editButtons[0]);
    
    expect(screen.getByText('Edit Product')).toBeInTheDocument();
  });

  it('handles product deletion with confirmation', async () => {
    const mockDelete = vi.fn().mockResolvedValue({});
    vi.mocked(useDeleteProduct).mockReturnValue({
      mutateAsync: mockDelete,
      isPending: false,
    } as any);
    
    vi.mocked(useAdminProducts).mockReturnValue({
      data: mockProducts,
      isLoading: false,
    } as any);

    window.confirm = vi.fn(() => true);

    render(<ProductsManagement />);
    
    const deleteButtons = screen.getAllByText('Delete');
    fireEvent.click(deleteButtons[0]);
    
    await waitFor(() => {
      expect(mockDelete).toHaveBeenCalledWith('1');
    });
  });

  it('shows WhatsApp list modal', async () => {
    const mockRefetch = vi.fn().mockResolvedValue({});
    vi.mocked(useWhatsAppProductList).mockReturnValue({
      data: 'Test Product List',
      refetch: mockRefetch,
    } as any);
    
    vi.mocked(useAdminProducts).mockReturnValue({
      data: mockProducts,
      isLoading: false,
    } as any);

    render(<ProductsManagement />);
    
    const whatsappButton = screen.getByText('Generate WhatsApp List');
    fireEvent.click(whatsappButton);
    
    await waitFor(() => {
      expect(mockRefetch).toHaveBeenCalled();
      expect(screen.getByText('WhatsApp Product List')).toBeInTheDocument();
    });
  });
});

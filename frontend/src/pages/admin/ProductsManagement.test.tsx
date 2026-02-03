/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../../test/utils';
import userEvent from '@testing-library/user-event';
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

vi.mock('../../hooks/useCategories', () => ({
  useCategories: vi.fn(),
  useCreateCategory: vi.fn(),
}));

vi.mock('../../hooks/useSuppliers', () => ({
  useSuppliers: vi.fn(),
}));

import {
  useAdminProducts,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  useWhatsAppProductList,
} from '../../hooks/useAdminProducts';
import { useCategories } from '../../hooks/useCategories';
import { useSuppliers } from '../../hooks/useSuppliers';

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

    vi.mocked(useCategories).mockReturnValue({
      data: [],
      isLoading: false,
    } as any);

    vi.mocked(useSuppliers).mockReturnValue({
      data: [],
      isLoading: false,
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

    expect(screen.getByRole('heading', { name: /Products Management/i })).toBeInTheDocument();
    expect(screen.getAllByRole('cell', { name: /Tomatoes/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('cell', { name: /Apples/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('cell', { name: /R 25.99/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('cell', { name: /R 35.50/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Available/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Unavailable/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Seasonal/i).length).toBeGreaterThan(0);
  });

  it('filters products by category', async () => {
    vi.mocked(useAdminProducts).mockReturnValue({
      data: mockProducts,
      isLoading: false,
    } as any);

    render(<ProductsManagement />);

    const categorySelect = screen.getByRole('combobox', { name: /Category/i });
    await userEvent.selectOptions(categorySelect, 'vegetables');

    expect(useAdminProducts).toHaveBeenCalledWith(
      expect.objectContaining({ category: 'vegetables' })
    );
  });

  it('filters products by availability', async () => {
    vi.mocked(useAdminProducts).mockReturnValue({
      data: mockProducts,
      isLoading: false,
    } as any);

    render(<ProductsManagement />);

    const availabilitySelect = screen.getByRole('combobox', { name: /Availability/i });
    await userEvent.selectOptions(availabilitySelect, 'true');

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

    expect(screen.getByRole('button', { name: 'Add Product (General)' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Add Product (General)' }));

    expect(screen.getByRole('heading', { name: 'Add Product' })).toBeInTheDocument();
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

/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../test/utils';
import userEvent from '@testing-library/user-event';
import ProfilePage from './ProfilePage';

const mockProfile = {
  id: '1',
  name: 'John Doe',
  email: 'john@example.com',
  phone: '0821234567',
  address: '123 Test Street',
  deliveryPreference: 'delivery' as const,
  creditBalance: 50.00,
};

const mockInvoices = [
  {
    id: 'inv-1',
    orderId: 'order-1',
    customerId: '1',
    subtotal: 100,
    creditApplied: 10,
    total: 90,
    status: 'paid' as const,
    createdAt: new Date('2024-01-15'),
    dueDate: new Date('2024-01-22'),
  },
];

// Mock hooks
vi.mock('../hooks/useCustomer', () => ({
  useCustomerProfile: vi.fn(),
  useUpdateCustomer: () => ({
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
    isError: false,
  }),
  useCustomerInvoices: vi.fn(),
}));

import { useCustomerProfile, useCustomerInvoices } from '../hooks/useCustomer';

describe('ProfilePage', () => {
  it('shows loading state', () => {
    vi.mocked(useCustomerProfile).mockReturnValue({
      data: undefined,
      isLoading: true,
    } as any);
    vi.mocked(useCustomerInvoices).mockReturnValue({
      data: undefined,
    } as any);

    render(<ProfilePage />);
    expect(screen.getByText(/loading profile/i)).toBeInTheDocument();
  });

  it('displays profile information', () => {
    vi.mocked(useCustomerProfile).mockReturnValue({
      data: mockProfile,
      isLoading: false,
    } as any);
    vi.mocked(useCustomerInvoices).mockReturnValue({
      data: mockInvoices,
    } as any);

    render(<ProfilePage />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
    expect(screen.getByText('0821234567')).toBeInTheDocument();
    expect(screen.getByText('R50.00')).toBeInTheDocument();
  });

  it('shows edit form when edit button is clicked', async () => {
    const user = userEvent.setup();
    vi.mocked(useCustomerProfile).mockReturnValue({
      data: mockProfile,
      isLoading: false,
    } as any);
    vi.mocked(useCustomerInvoices).mockReturnValue({
      data: mockInvoices,
    } as any);

    render(<ProfilePage />);
    
    const editButton = screen.getByRole('button', { name: /edit/i });
    await user.click(editButton);
    
    expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
  });

  it('displays invoice history', () => {
    vi.mocked(useCustomerProfile).mockReturnValue({
      data: mockProfile,
      isLoading: false,
    } as any);
    vi.mocked(useCustomerInvoices).mockReturnValue({
      data: mockInvoices,
    } as any);

    render(<ProfilePage />);
    
    expect(screen.getByText('Invoice History')).toBeInTheDocument();
    expect(screen.getByText('R90.00')).toBeInTheDocument();
    expect(screen.getByText('R10.00')).toBeInTheDocument();
    expect(screen.getByText('Paid')).toBeInTheDocument();
  });

  it('shows empty state when no invoices', () => {
    vi.mocked(useCustomerProfile).mockReturnValue({
      data: mockProfile,
      isLoading: false,
    } as any);
    vi.mocked(useCustomerInvoices).mockReturnValue({
      data: [],
    } as any);

    render(<ProfilePage />);
    
    expect(screen.getByText(/no invoices yet/i)).toBeInTheDocument();
  });
});

/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../../test/utils';
import { fireEvent } from '@testing-library/react';
import InvoicesManagement from './InvoicesManagement';

const mockInvoices = [
  {
    id: 'invoice-1',
    orderId: 'order-1',
    customerId: 'customer-1',
    subtotal: 100.00,
    creditApplied: 10.00,
    total: 90.00,
    status: 'unpaid',
    pdfUrl: 'https://example.com/invoice-1.pdf',
    createdAt: '2025-10-28',
    dueDate: '2025-11-04',
  },
  {
    id: 'invoice-2',
    orderId: 'order-2',
    customerId: 'customer-2',
    subtotal: 150.00,
    creditApplied: 0,
    total: 150.00,
    status: 'paid',
    pdfUrl: null,
    createdAt: '2025-10-27',
    dueDate: '2025-11-03',
  },
];

vi.mock('../../hooks/useAdminInvoices', () => ({
  useAdminInvoices: vi.fn(),
  useInvoice: vi.fn(),
  useDownloadInvoicePDF: vi.fn(),
}));

import {
  useAdminInvoices,
  useInvoice,
  useDownloadInvoicePDF,
} from '../../hooks/useAdminInvoices';

describe('InvoicesManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    vi.mocked(useDownloadInvoicePDF).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);
    
    vi.mocked(useInvoice).mockReturnValue({
      data: undefined,
      isLoading: false,
    } as any);
  });

  it('shows loading state', () => {
    vi.mocked(useAdminInvoices).mockReturnValue({
      data: undefined,
      isLoading: true,
    } as any);

    render(<InvoicesManagement />);
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('renders invoices table with data', () => {
    vi.mocked(useAdminInvoices).mockReturnValue({
      data: mockInvoices,
      isLoading: false,
    } as any);

    render(<InvoicesManagement />);
    
    expect(screen.getByText('Invoices Management')).toBeInTheDocument();
    // Check for invoice IDs in the table
    const invoiceCells = document.querySelectorAll('td.px-6.py-4.whitespace-nowrap.text-sm.font-medium.text-gray-900');
    expect(invoiceCells.length).toBe(2);
    expect(invoiceCells[0].textContent).toContain('invoice-');
    expect(screen.getByText('R 90.00')).toBeInTheDocument();
    expect(screen.getAllByText('R 150.00').length).toBeGreaterThan(0);
  });

  it('displays credit applied correctly', () => {
    vi.mocked(useAdminInvoices).mockReturnValue({
      data: mockInvoices,
      isLoading: false,
    } as any);

    render(<InvoicesManagement />);
    
    expect(screen.getByText('-R 10.00')).toBeInTheDocument();
  });

  it('filters invoices by status', () => {
    vi.mocked(useAdminInvoices).mockReturnValue({
      data: mockInvoices,
      isLoading: false,
    } as any);

    render(<InvoicesManagement />);
    
    const statusSelect = screen.getByRole('combobox');
    fireEvent.change(statusSelect, { target: { value: 'unpaid' } });
    
    expect(useAdminInvoices).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'unpaid' })
    );
  });

  it('filters invoices by date range', () => {
    vi.mocked(useAdminInvoices).mockReturnValue({
      data: mockInvoices,
      isLoading: false,
    } as any);

    render(<InvoicesManagement />);
    
    const dateInputs = document.querySelectorAll('input[type="date"]');
    const startDateInput = dateInputs[0] as HTMLInputElement;
    const endDateInput = dateInputs[1] as HTMLInputElement;
    
    fireEvent.change(startDateInput, { target: { value: '2025-10-01' } });
    fireEvent.change(endDateInput, { target: { value: '2025-10-31' } });
    
    expect(useAdminInvoices).toHaveBeenCalledWith(
      expect.objectContaining({
        startDate: '2025-10-01',
        endDate: '2025-10-31',
      })
    );
  });

  it('opens invoice detail modal', () => {
    vi.mocked(useAdminInvoices).mockReturnValue({
      data: mockInvoices,
      isLoading: false,
    } as any);

    render(<InvoicesManagement />);
    
    const viewButtons = screen.getAllByText('View');
    fireEvent.click(viewButtons[0]);
    
    expect(useInvoice).toHaveBeenCalledWith('invoice-1');
  });

  it('downloads invoice PDF', async () => {
    const mockDownload = vi.fn().mockResolvedValue({});
    vi.mocked(useDownloadInvoicePDF).mockReturnValue({
      mutateAsync: mockDownload,
      isPending: false,
    } as any);
    
    vi.mocked(useAdminInvoices).mockReturnValue({
      data: mockInvoices,
      isLoading: false,
    } as any);

    render(<InvoicesManagement />);
    
    const pdfButtons = screen.getAllByText('PDF');
    fireEvent.click(pdfButtons[0]);
    
    await waitFor(() => {
      expect(mockDownload).toHaveBeenCalledWith('invoice-1');
    });
  });

  it('shows invoice status badges correctly', () => {
    vi.mocked(useAdminInvoices).mockReturnValue({
      data: mockInvoices,
      isLoading: false,
    } as any);

    render(<InvoicesManagement />);
    
    const unpaidBadge = screen.getByText('unpaid');
    const paidBadge = screen.getByText('paid');
    
    expect(unpaidBadge).toBeInTheDocument();
    expect(paidBadge).toBeInTheDocument();
  });
});

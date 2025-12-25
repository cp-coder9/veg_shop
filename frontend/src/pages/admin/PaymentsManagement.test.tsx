/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../../test/utils';
import { fireEvent } from '@testing-library/react';
import PaymentsManagement from './PaymentsManagement';

const mockInvoices = [
  {
    id: 'invoice-1',
    orderId: 'order-1',
    customerId: 'customer-1',
    subtotal: 100.00,
    creditApplied: 0,
    total: 100.00,
    status: 'unpaid',
    pdfUrl: null,
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
    status: 'partial',
    pdfUrl: null,
    createdAt: '2025-10-27',
    dueDate: '2025-11-03',
  },
];

const mockPayments = [
  {
    id: 'payment-1',
    invoiceId: 'invoice-1',
    customerId: 'customer-1',
    amount: 50.00,
    method: 'cash',
    paymentDate: '2025-10-28',
    notes: 'Partial payment',
  },
];

vi.mock('../../hooks/useAdminInvoices', () => ({
  useAdminInvoices: vi.fn(),
}));

vi.mock('../../hooks/useAdminPayments', () => ({
  useCustomerPayments: vi.fn(),
  useRecordPayment: vi.fn(),
}));

import { useAdminInvoices } from '../../hooks/useAdminInvoices';
import { useCustomerPayments, useRecordPayment } from '../../hooks/useAdminPayments';

describe('PaymentsManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    vi.mocked(useAdminInvoices).mockReturnValue({
      data: [],
      isLoading: false,
    } as any);
    
    vi.mocked(useCustomerPayments).mockReturnValue({
      data: [],
      isLoading: false,
    } as any);
    
    vi.mocked(useRecordPayment).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);
  });

  it('renders payments management page', () => {
    render(<PaymentsManagement />);
    
    expect(screen.getByText('Payments Management')).toBeInTheDocument();
    expect(screen.getByText('Record Payment')).toBeInTheDocument();
  });

  it('displays outstanding invoices', () => {
    vi.mocked(useAdminInvoices).mockImplementation((filters: any) => {
      if (filters?.status === 'unpaid') {
        return { data: [mockInvoices[0]], isLoading: false } as any;
      }
      if (filters?.status === 'partial') {
        return { data: [mockInvoices[1]], isLoading: false } as any;
      }
      return { data: [], isLoading: false } as any;
    });

    render(<PaymentsManagement />);
    
    expect(screen.getByText('Outstanding Invoices')).toBeInTheDocument();
    // Check for invoice IDs in the table
    const invoiceCells = document.querySelectorAll('td.px-6.py-4.whitespace-nowrap.text-sm.font-medium.text-gray-900');
    expect(invoiceCells.length).toBeGreaterThan(0);
    expect(invoiceCells[0].textContent).toContain('invoice-');
  });

  it('shows empty state when no outstanding invoices', () => {
    render(<PaymentsManagement />);
    
    expect(screen.getByText('No outstanding invoices')).toBeInTheDocument();
  });

  it('opens payment modal', () => {
    render(<PaymentsManagement />);
    
    const recordButtons = screen.getAllByText('Record Payment');
    fireEvent.click(recordButtons[0]);
    
    expect(screen.getByText('Record Payment', { selector: 'h2' })).toBeInTheDocument();
  });

  it('records payment successfully', async () => {
    const mockRecord = vi.fn().mockResolvedValue({});
    vi.mocked(useRecordPayment).mockReturnValue({
      mutateAsync: mockRecord,
      isPending: false,
    } as any);
    
    vi.mocked(useAdminInvoices).mockReturnValue({
      data: mockInvoices,
      isLoading: false,
    } as any);

    window.alert = vi.fn();

    render(<PaymentsManagement />);
    
    const recordButtons = screen.getAllByText('Record Payment');
    fireEvent.click(recordButtons[0]);
    
    // Fill in form
    const customerIdInput = screen.getByPlaceholderText(/enter customer id/i);
    fireEvent.change(customerIdInput, { target: { value: 'customer-1' } });
    
    await waitFor(() => {
      const invoiceSelects = screen.getAllByRole('combobox');
      const invoiceSelect = invoiceSelects[invoiceSelects.length - 1];
      fireEvent.change(invoiceSelect, { target: { value: 'invoice-1' } });
    });
    
    const amountInput = screen.getByRole('spinbutton');
    fireEvent.change(amountInput, { target: { value: '100' } });
    
    const submitButtons = screen.getAllByText('Record Payment');
    const submitButton = submitButtons[submitButtons.length - 1];
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockRecord).toHaveBeenCalledWith(
        expect.objectContaining({
          invoiceId: 'invoice-1',
          customerId: 'customer-1',
          amount: 100,
        })
      );
    });
  });

  it('shows overpayment warning', async () => {
    vi.mocked(useAdminInvoices).mockReturnValue({
      data: mockInvoices,
      isLoading: false,
    } as any);

    render(<PaymentsManagement />);
    
    const recordButtons = screen.getAllByText('Record Payment');
    fireEvent.click(recordButtons[0]);
    
    const customerIdInput = screen.getByPlaceholderText(/enter customer id/i);
    fireEvent.change(customerIdInput, { target: { value: 'customer-1' } });
    
    await waitFor(() => {
      const invoiceSelects = screen.getAllByRole('combobox');
      const invoiceSelect = invoiceSelects[invoiceSelects.length - 1];
      fireEvent.change(invoiceSelect, { target: { value: 'invoice-1' } });
    });
    
    const amountInput = screen.getByRole('spinbutton');
    fireEvent.change(amountInput, { target: { value: '150' } });
    
    await waitFor(() => {
      expect(screen.getByText(/overpayment of R 50.00/i)).toBeInTheDocument();
    });
  });

  it('displays payment history for customer', () => {
    vi.mocked(useCustomerPayments).mockReturnValue({
      data: mockPayments,
      isLoading: false,
    } as any);
    
    vi.mocked(useAdminInvoices).mockImplementation((filters: any) => {
      if (filters?.status === 'unpaid') {
        return { data: [mockInvoices[0]], isLoading: false } as any;
      }
      return { data: [], isLoading: false } as any;
    });

    render(<PaymentsManagement />);
    
    // Click record payment on an invoice to select customer
    const recordPaymentButtons = screen.getAllByText('Record Payment');
    fireEvent.click(recordPaymentButtons[1]);
    
    expect(screen.getByText(/Payment History - Customer/)).toBeInTheDocument();
  });

  it('supports different payment methods', async () => {
    vi.mocked(useAdminInvoices).mockReturnValue({
      data: mockInvoices,
      isLoading: false,
    } as any);

    render(<PaymentsManagement />);
    
    const recordButtons = screen.getAllByText('Record Payment');
    fireEvent.click(recordButtons[0]);
    
    const cashRadio = screen.getByRole('radio', { name: /cash/i });
    const yocoRadio = screen.getByRole('radio', { name: /yoco/i });
    const eftRadio = screen.getByRole('radio', { name: /eft/i });
    
    expect(cashRadio).toBeInTheDocument();
    expect(yocoRadio).toBeInTheDocument();
    expect(eftRadio).toBeInTheDocument();
    
    fireEvent.click(yocoRadio);
    expect(yocoRadio).toBeChecked();
  });
});

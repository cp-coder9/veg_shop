import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '../../test/utils';
import { fireEvent } from '@testing-library/react';
import ReportsManagement from './ReportsManagement';

// Mock the report components
vi.mock('../../components/admin/reports/SalesReport', () => ({
  default: () => <div>Sales Report Content</div>,
}));

vi.mock('../../components/admin/reports/PaymentStatusReport', () => ({
  default: () => <div>Payment Status Report Content</div>,
}));

vi.mock('../../components/admin/reports/ProductPopularityReport', () => ({
  default: () => <div>Product Popularity Report Content</div>,
}));

vi.mock('../../components/admin/reports/CustomerActivityReport', () => ({
  default: () => <div>Customer Activity Report Content</div>,
}));

describe('ReportsManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders reports page with tabs', () => {
    render(<ReportsManagement />);
    
    expect(screen.getByText('Reports')).toBeInTheDocument();
    expect(screen.getByText('Sales')).toBeInTheDocument();
    expect(screen.getByText('Payments')).toBeInTheDocument();
    expect(screen.getByText('Products')).toBeInTheDocument();
    expect(screen.getByText('Customers')).toBeInTheDocument();
  });

  it('shows sales report by default', () => {
    render(<ReportsManagement />);
    
    expect(screen.getByText('Sales Report Content')).toBeInTheDocument();
  });

  it('switches to payments tab', () => {
    render(<ReportsManagement />);
    
    const paymentsTab = screen.getByText('Payments');
    fireEvent.click(paymentsTab);
    
    expect(screen.getByText('Payment Status Report Content')).toBeInTheDocument();
    expect(screen.queryByText('Sales Report Content')).not.toBeInTheDocument();
  });

  it('switches to products tab', () => {
    render(<ReportsManagement />);
    
    const productsTab = screen.getByText('Products');
    fireEvent.click(productsTab);
    
    expect(screen.getByText('Product Popularity Report Content')).toBeInTheDocument();
    expect(screen.queryByText('Sales Report Content')).not.toBeInTheDocument();
  });

  it('switches to customers tab', () => {
    render(<ReportsManagement />);
    
    const customersTab = screen.getByText('Customers');
    fireEvent.click(customersTab);
    
    expect(screen.getByText('Customer Activity Report Content')).toBeInTheDocument();
    expect(screen.queryByText('Sales Report Content')).not.toBeInTheDocument();
  });

  it('highlights active tab', () => {
    render(<ReportsManagement />);
    
    const salesTab = screen.getByText('Sales');
    const paymentsTab = screen.getByText('Payments');
    
    // Sales tab should be active by default
    expect(salesTab.className).toContain('text-green-600');
    expect(paymentsTab.className).toContain('text-gray-500');
    
    // Click payments tab
    fireEvent.click(paymentsTab);
    
    // Payments tab should now be active
    expect(paymentsTab.className).toContain('text-green-600');
  });

  it('maintains tab state when switching between tabs', () => {
    render(<ReportsManagement />);
    
    // Switch to payments
    const paymentsTab = screen.getByText('Payments');
    fireEvent.click(paymentsTab);
    expect(screen.getByText('Payment Status Report Content')).toBeInTheDocument();
    
    // Switch to products
    const productsTab = screen.getByText('Products');
    fireEvent.click(productsTab);
    expect(screen.getByText('Product Popularity Report Content')).toBeInTheDocument();
    
    // Switch back to payments
    fireEvent.click(paymentsTab);
    expect(screen.getByText('Payment Status Report Content')).toBeInTheDocument();
  });
});

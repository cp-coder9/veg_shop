import { Badge, type BadgeVariant } from '../ui/Badge';

export type PaymentStatus = 'paid' | 'partial' | 'unpaid';

interface PaymentStatusBadgeProps {
  status: PaymentStatus;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

// Map payment status to Badge variant
const statusToVariant: Record<PaymentStatus, BadgeVariant> = {
  paid: 'success',
  partial: 'warning',
  unpaid: 'error',
};

// Map payment status to display text
const statusLabels: Record<PaymentStatus, string> = {
  paid: 'Paid',
  partial: 'Partial',
  unpaid: 'Unpaid',
};

// Map payment status to icons
const statusIcons: Record<PaymentStatus, string> = {
  paid: '✓',
  partial: '◐',
  unpaid: '○',
};

/**
 * Payment Status Badge Component
 * 
 * Displays payment status with appropriate colors:
 * - 🟢 Paid (green) - success variant
 * - 🟡 Partial (yellow) - warning variant  
 * - 🔴 Unpaid (red) - error variant
 * 
 * @example
 * <PaymentStatusBadge status="paid" />
 * <PaymentStatusBadge status="partial" showIcon />
 * <PaymentStatusBadge status="unpaid" size="lg" />
 */
export function PaymentStatusBadge({ status, size = 'md', showIcon = false }: PaymentStatusBadgeProps) {
  return (
    <Badge variant={statusToVariant[status]} size={size}>
      {showIcon && <span className="mr-1">{statusIcons[status]}</span>}
      {statusLabels[status]}
    </Badge>
  );
}

export default PaymentStatusBadge;

import { Badge, type BadgeVariant } from '../ui/Badge';

export type PaymentMethod = 'cash' | 'yoco' | 'eft';

interface PaymentMethodBadgeProps {
  method: PaymentMethod;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

// Map payment method to Badge variant
const methodToVariant: Record<PaymentMethod, BadgeVariant> = {
  cash: 'info',
  yoco: 'default',
  eft: 'warning',
};

// Map payment method to display text
const methodLabels: Record<PaymentMethod, string> = {
  cash: 'Cash',
  yoco: 'Yoco',
  eft: 'EFT',
};

// Map payment method to icons
const methodIcons: Record<PaymentMethod, string> = {
  cash: '💵',
  yoco: '💳',
  eft: '🏦',
};

/**
 * Payment Method Badge Component
 * 
 * Displays payment method with appropriate styling:
 * - 💵 Cash (blue/info)
 * - 💳 Yoco (default/gray)
 * - 🏦 EFT (yellow/warning)
 * 
 * @example
 * <PaymentMethodBadge method="yoco" />
 * <PaymentMethodBadge method="cash" showIcon />
 * <PaymentMethodBadge method="eft" size="lg" />
 */
export function PaymentMethodBadge({ method, size = 'md', showIcon = false }: PaymentMethodBadgeProps) {
  return (
    <Badge variant={methodToVariant[method]} size={size}>
      {showIcon && <span className="mr-1">{methodIcons[method]}</span>}
      {methodLabels[method]}
    </Badge>
  );
}

export default PaymentMethodBadge;

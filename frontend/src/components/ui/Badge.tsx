import { HTMLAttributes, forwardRef } from 'react';

export type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'outline';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: 'sm' | 'md' | 'lg';
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-light-gray text-primary-dark',
  success: 'bg-success/20 text-success',
  warning: 'bg-warning/20 text-warning',
  error: 'bg-error/20 text-error',
  info: 'bg-info/20 text-info',
  outline: 'bg-transparent border border-light-gray text-primary-dark',
};

const sizeStyles = {
  sm: 'px-2 py-0.5 text-overline',
  md: 'px-3 py-1 text-caption',
  lg: 'px-4 py-1.5 text-body-sm',
};

/**
 * Badge component following Never.Regular.Studio design system
 * 
 * @example
 * // Default badge
 * <Badge>New</Badge>
 * 
 * // Success badge
 * <Badge variant="success">Active</Badge>
 * 
 * // Warning badge
 * <Badge variant="warning">Pending</Badge>
 * 
 * // Error badge
 * <Badge variant="error">Failed</Badge>
 * 
 * // Outline badge
 * <Badge variant="outline">Draft</Badge>
 */
export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant = 'default', size = 'md', className = '', children, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center font-medium rounded-full transition-colors';

    return (
      <span
        ref={ref}
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

export default Badge;

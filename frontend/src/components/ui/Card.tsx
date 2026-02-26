import { HTMLAttributes, forwardRef } from 'react';

export type CardVariant = 'default' | 'elevated' | 'outlined';
export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padding?: CardPadding;
  hoverable?: boolean;
  as?: 'div' | 'article' | 'section';
}

const variantStyles: Record<CardVariant, string> = {
  default: 'bg-white shadow-sm',
  elevated: 'bg-white shadow-md',
  outlined: 'bg-white border border-light-gray',
};

const paddingStyles: Record<CardPadding, string> = {
  none: 'p-0',
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-8',
};

/**
 * Card component following Never.Regular.Studio design system
 * 
 * @example
 * // Default card
 * <Card>Content here</Card>
 * 
 * // Elevated card with hover effect
 * <Card variant="elevated" hoverable>Content here</Card>
 * 
 * // Outlined card with custom padding
 * <Card variant="outlined" padding="lg">Content here</Card>
 * 
 * // Card as article element
 * <Card as="article">Blog post content</Card>
 */
export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      variant = 'default',
      padding = 'md',
      hoverable = false,
      as: Component = 'div',
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles = 'rounded-lg transition-all duration-200';
    const hoverStyles = hoverable 
      ? 'hover:shadow-md hover:-translate-y-0.5 cursor-pointer' 
      : '';

    return (
      <Component
        ref={ref}
        className={`${baseStyles} ${variantStyles[variant]} ${paddingStyles[padding]} ${hoverStyles} ${className}`}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

Card.displayName = 'Card';

// Card Header subcomponent
interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ title, subtitle, action, className = '', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`flex items-start justify-between mb-4 ${className}`}
        {...props}
      >
        <div>
          <h3 className="font-display text-display-sm text-primary-dark">{title}</h3>
          {subtitle && (
            <p className="text-body-sm text-warm-gray mt-1">{subtitle}</p>
          )}
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>
    );
  }
);

CardHeader.displayName = 'CardHeader';

// Card Content subcomponent
interface CardContentProps extends HTMLAttributes<HTMLDivElement> {}

export const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  ({ className = '', children, ...props }, ref) => {
    return (
      <div ref={ref} className={`text-body-md text-soft-black ${className}`} {...props}>
        {children}
      </div>
    );
  }
);

CardContent.displayName = 'CardContent';

// Card Footer subcomponent
interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {}

export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className = '', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`mt-4 pt-4 border-t border-light-gray ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardFooter.displayName = 'CardFooter';

export default Card;

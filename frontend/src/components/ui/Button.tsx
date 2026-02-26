import { ButtonHTMLAttributes, forwardRef } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-primary-dark text-white hover:bg-soft-black',
  secondary: 'bg-transparent text-primary-dark border border-light-gray hover:bg-cream',
  ghost: 'bg-transparent text-primary-dark hover:bg-black/5',
  danger: 'bg-error text-white hover:bg-error/90',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-4 py-2 text-caption',
  md: 'px-6 py-3 text-body-sm',
  lg: 'px-8 py-4 text-body-md',
};

/**
 * Button component following Never.Regular.Studio design system
 * 
 * @example
 * // Primary button (default)
 * <Button>Click me</Button>
 * 
 * // Secondary button
 * <Button variant="secondary">Cancel</Button>
 * 
 * // Ghost button
 * <Button variant="ghost">Learn More</Button>
 * 
 * // With loading state
 * <Button isLoading>Saving...</Button>
 * 
 * // With icons
 * <Button leftIcon={<PlusIcon />}>Add Item</Button>
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      className = '',
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles = 'rounded-md font-medium tracking-wide transition-all duration-200 inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary-dark/20';

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        {...props}
      >
        {isLoading ? (
          <>
            <svg
              className="animate-spin h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Loading...</span>
          </>
        ) : (
          <>
            {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;

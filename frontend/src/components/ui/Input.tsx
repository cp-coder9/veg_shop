import { InputHTMLAttributes, forwardRef } from 'react';

export type InputSize = 'sm' | 'md' | 'lg';

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  hint?: string;
  inputSize?: InputSize;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const inputSizeStyles: Record<InputSize, string> = {
  sm: 'px-3 py-2 text-body-sm',
  md: 'px-4 py-3.5 text-body-md',
  lg: 'px-5 py-4 text-body-lg',
};

/**
 * Input component following Never.Regular.Studio design system
 * 
 * @example
 * // Default input
 * <Input placeholder="Enter your email" />
 * 
 * // With label
 * <Input label="Email" placeholder="Enter your email" />
 * 
 * // With error
 * <Input label="Email" error="Email is required" />
 * 
 * // With hint
 * <Input label="Password" type="password" hint="Must be at least 8 characters" />
 * 
 * // With icons
 * <Input leftIcon={<SearchIcon />} placeholder="Search..." />
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      hint,
      inputSize = 'md',
      leftIcon,
      rightIcon,
      className = '',
      id,
      disabled,
      ...props
    },
    ref
  ) => {
    const inputId = id || `input-${Math.random().toString(36).slice(2, 11)}`;
    
    const baseStyles = 'font-body text-primary-dark bg-white border rounded-md transition-all duration-200 w-full focus:outline-none placeholder:text-warm-gray';
    
    const normalStyles = 'border-light-gray focus:border-primary-dark focus:ring-2 focus:ring-primary-dark/10';
    const errorStyles = 'border-error bg-red-50 focus:border-error focus:ring-2 focus:ring-error/20';
    const disabledStyles = 'disabled:bg-light-gray disabled:cursor-not-allowed disabled:opacity-60';

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block font-accent text-caption font-medium text-primary-dark mb-2 uppercase tracking-wider"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-gray pointer-events-none">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            className={`
              ${baseStyles}
              ${error ? errorStyles : normalStyles}
              ${disabledStyles}
              ${inputSizeStyles[inputSize]}
              ${leftIcon ? 'pl-10' : ''}
              ${rightIcon ? 'pr-10' : ''}
              ${className}
            `}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-warm-gray">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p id={`${inputId}-error`} className="mt-2 text-caption text-error font-body" role="alert">
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={`${inputId}-hint`} className="mt-2 text-caption text-warm-gray font-body">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;

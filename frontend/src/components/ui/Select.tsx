import { SelectHTMLAttributes, forwardRef } from 'react';

export type SelectSize = 'sm' | 'md' | 'lg';

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string;
  error?: string;
  hint?: string;
  selectSize?: SelectSize;
  options: { value: string; label: string }[];
  placeholder?: string;
}

const selectSizeStyles: Record<SelectSize, string> = {
  sm: 'px-3 py-2 text-body-sm',
  md: 'px-4 py-3.5 text-body-md',
  lg: 'px-5 py-4 text-body-lg',
};

/**
 * Select component following Never.Regular.Studio design system
 * 
 * @example
 * // Basic select
 * <Select
 *   label="Category"
 *   options={[
 *     { value: 'vegetables', label: 'Vegetables' },
 *     { value: 'fruits', label: 'Fruits' },
 *   ]}
 * />
 * 
 * // With placeholder and error
 * <Select
 *   label="Category"
 *   placeholder="Select a category"
 *   error="Category is required"
 *   options={categories}
 * />
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error,
      hint,
      selectSize = 'md',
      options,
      placeholder,
      className = '',
      id,
      disabled,
      ...props
    },
    ref
  ) => {
    const selectId = id || `select-${Math.random().toString(36).slice(2, 11)}`;
    
    const baseStyles = 'font-body text-primary-dark bg-white border rounded-md transition-all duration-200 w-full focus:outline-none appearance-none cursor-pointer';
    const normalStyles = 'border-light-gray focus:border-primary-dark focus:ring-2 focus:ring-primary-dark/10';
    const errorStyles = 'border-error bg-red-50 focus:border-error focus:ring-2 focus:ring-error/20';
    const disabledStyles = 'disabled:bg-light-gray disabled:cursor-not-allowed disabled:opacity-60';

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={selectId}
            className="block font-accent text-caption font-medium text-primary-dark mb-2 uppercase tracking-wider"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            disabled={disabled}
            className={`
              ${baseStyles}
              ${error ? errorStyles : normalStyles}
              ${disabledStyles}
              ${selectSizeStyles[selectSize]}
              pr-10
              ${className}
            `}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? `${selectId}-error` : hint ? `${selectId}-hint` : undefined}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {/* Dropdown arrow icon */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-warm-gray">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </div>
        {error && (
          <p id={`${selectId}-error`} className="mt-2 text-caption text-error font-body" role="alert">
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={`${selectId}-hint`} className="mt-2 text-caption text-warm-gray font-body">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export default Select;

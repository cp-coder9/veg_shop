import { TextareaHTMLAttributes, forwardRef } from 'react';

export type TextareaSize = 'sm' | 'md' | 'lg';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  textareaSize?: TextareaSize;
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
}

const textareaSizeStyles: Record<TextareaSize, string> = {
  sm: 'px-3 py-2 text-body-sm',
  md: 'px-4 py-3.5 text-body-md',
  lg: 'px-5 py-4 text-body-lg',
};

const resizeStyles = {
  none: 'resize-none',
  vertical: 'resize-y',
  horizontal: 'resize-x',
  both: 'resize',
};

/**
 * Textarea component following Never.Regular.Studio design system
 * 
 * @example
 * // Basic textarea
 * <Textarea placeholder="Enter your message" />
 * 
 * // With label
 * <Textarea label="Message" placeholder="Enter your message" />
 * 
 * // With error
 * <Textarea label="Message" error="Message is required" />
 * 
 * // Non-resizable
 * <Textarea resize="none" rows={4} />
 */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      error,
      hint,
      textareaSize = 'md',
      resize = 'vertical',
      className = '',
      id,
      disabled,
      rows = 4,
      ...props
    },
    ref
  ) => {
    const textareaId = id || `textarea-${Math.random().toString(36).slice(2, 11)}`;
    
    const baseStyles = 'font-body text-primary-dark bg-white border rounded-md transition-all duration-200 w-full focus:outline-none placeholder:text-warm-gray';
    const normalStyles = 'border-light-gray focus:border-primary-dark focus:ring-2 focus:ring-primary-dark/10';
    const errorStyles = 'border-error bg-red-50 focus:border-error focus:ring-2 focus:ring-error/20';
    const disabledStyles = 'disabled:bg-light-gray disabled:cursor-not-allowed disabled:opacity-60';

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={textareaId}
            className="block font-accent text-caption font-medium text-primary-dark mb-2 uppercase tracking-wider"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          disabled={disabled}
          rows={rows}
          className={`
            ${baseStyles}
            ${error ? errorStyles : normalStyles}
            ${disabledStyles}
            ${textareaSizeStyles[textareaSize]}
            ${resizeStyles[resize]}
            ${className}
          `}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${textareaId}-error` : hint ? `${textareaId}-hint` : undefined}
          {...props}
        />
        {error && (
          <p id={`${textareaId}-error`} className="mt-2 text-caption text-error font-body" role="alert">
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={`${textareaId}-hint`} className="mt-2 text-caption text-warm-gray font-body">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export default Textarea;

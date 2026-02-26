import { HTMLAttributes, forwardRef, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

interface ModalProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  size?: ModalSize;
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  footer?: React.ReactNode;
}

const sizeStyles: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
  full: 'max-w-[90vw]',
};

/**
 * Modal component following Never.Regular.Studio design system
 * 
 * @example
 * // Basic modal
 * <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Confirm Action">
 *   <p>Are you sure you want to proceed?</p>
 * </Modal>
 * 
 * // Modal with footer
 * <Modal 
 *   isOpen={isOpen} 
 *   onClose={() => setIsOpen(false)} 
 *   title="Edit Item"
 *   footer={
 *     <>
 *       <Button variant="ghost" onClick={onClose}>Cancel</Button>
 *       <Button onClick={handleSave}>Save</Button>
 *     </>
 *   }
 * >
 *   <Input label="Name" />
 * </Modal>
 * 
 * // Large modal without close button
 * <Modal 
 *   isOpen={isOpen} 
 *   onClose={() => setIsOpen(false)} 
 *   size="xl"
 *   showCloseButton={false}
 * >
 *   <div>Large content area</div>
 * </Modal>
 */
export const Modal = forwardRef<HTMLDivElement, ModalProps>(
  (
    {
      isOpen,
      onClose,
      title,
      size = 'md',
      showCloseButton = true,
      closeOnOverlayClick = true,
      closeOnEscape = true,
      footer,
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    // Handle escape key
    const handleKeyDown = useCallback(
      (event: KeyboardEvent) => {
        if (closeOnEscape && event.key === 'Escape') {
          onClose();
        }
      },
      [closeOnEscape, onClose]
    );

    // Add/remove event listener
    useEffect(() => {
      if (isOpen) {
        document.addEventListener('keydown', handleKeyDown);
        document.body.style.overflow = 'hidden';
      }

      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = '';
      };
    }, [isOpen, handleKeyDown]);

    if (!isOpen) return null;

    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
      >
        {/* Overlay */}
        <div
          className="absolute inset-0 bg-primary-dark/50 backdrop-blur-sm transition-opacity"
          onClick={closeOnOverlayClick ? onClose : undefined}
          aria-hidden="true"
        />

        {/* Modal Content */}
        <div
          ref={ref}
          className={`relative bg-white rounded-xl shadow-xl w-full ${sizeStyles[size]} max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95 duration-200 ${className}`}
          {...props}
        >
          {/* Header */}
          {(title || showCloseButton) && (
            <div className="flex items-center justify-between p-6 border-b border-light-gray">
              {title && (
                <h2
                  id="modal-title"
                  className="font-display text-display-sm text-primary-dark"
                >
                  {title}
                </h2>
              )}
              {showCloseButton && (
                <button
                  onClick={onClose}
                  className="p-2 -mr-2 text-warm-gray hover:text-primary-dark hover:bg-light-gray rounded-md transition-colors"
                  aria-label="Close modal"
                >
                  <X size={20} />
                </button>
              )}
            </div>
          )}

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6">{children}</div>

          {/* Footer */}
          {footer && (
            <div className="flex items-center justify-end gap-3 p-6 border-t border-light-gray bg-cream/50 rounded-b-xl">
              {footer}
            </div>
          )}
        </div>
      </div>
    );
  }
);

Modal.displayName = 'Modal';

export default Modal;

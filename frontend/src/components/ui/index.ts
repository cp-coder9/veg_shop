/**
 * UI Components - Never.Regular.Studio Design System
 * 
 * This module exports reusable UI components that follow the design system tokens
 * defined in tailwind.config.js
 * 
 * @example
 * import { Button, Input, Card, Modal } from '@/components/ui';
 * 
 * // Or import individual components
 * import Button from '@/components/ui/Button';
 */

// Button component
export { Button, type ButtonVariant, type ButtonSize } from './Button';
export { default as ButtonDefault } from './Button';

// Input component
export { Input, type InputSize } from './Input';

// Select component
export { Select, type SelectSize } from './Select';

// Textarea component
export { Textarea, type TextareaSize } from './Textarea';

// Card component
export {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  type CardVariant,
  type CardPadding
} from './Card';

// Modal component
export { Modal, type ModalSize } from './Modal';

// Badge component
export { Badge, type BadgeVariant } from './Badge';

// Icons component
export { UserIcon, CartIcon } from './Icons';

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
export { Button, type ButtonVariant, type ButtonSize } from './Button.js';
export { default as ButtonDefault } from './Button.js';

// Input component
export { Input, type InputSize } from './Input.js';

// Select component
export { Select, type SelectSize } from './Select.js';

// Textarea component
export { Textarea, type TextareaSize } from './Textarea.js';

// Card component
export {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  type CardVariant,
  type CardPadding
} from './Card.js';

// Modal component
export { Modal, type ModalSize } from './Modal.js';

// Badge component
export { Badge, type BadgeVariant } from './Badge.js';

// Icons component
export { UserIcon, CartIcon, BackIcon } from './Icons.js';

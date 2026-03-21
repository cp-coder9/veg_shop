/**
 * Converts a Prisma Decimal value (which is serialized as string) to a number
 * @param value - The value to convert (can be number, string, null, or undefined)
 * @returns The numeric value (defaults to 0 for null/undefined)
 */
export function toNumber(value: number | string | null | undefined): number {
  if (value === null || value === undefined) {
    return 0;
  }
  return typeof value === 'string' ? parseFloat(value) : value;
}

/**
 * Formats a price value for display
 * @param value - The price value (can be number, string, null, or undefined)
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted price string
 */
export function formatPrice(value: number | string | null | undefined, decimals: number = 2): string {
  return toNumber(value).toFixed(decimals);
}

/**
 * Formats a currency value with the currency symbol
 * @param value - The currency value (can be number, string, null, or undefined)
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted currency string with R symbol
 */
export function formatCurrency(value: number | string | null | undefined, decimals: number = 2): string {
  return `R ${toNumber(value).toFixed(decimals)}`;
}

/**
 * Checks if an invoice is overdue
 * @param dueDate - The invoice due date (string or Date)
 * @param status - The invoice status
 * @returns True if the invoice is overdue
 */
export function isInvoiceOverdue(dueDate: string | Date, status: string): boolean {
  if (status === 'paid') return false;
  
  const due = typeof dueDate === 'string' ? new Date(dueDate) : dueDate;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return due < today;
}

/**
 * Calculates the number of days an invoice is overdue
 * @param dueDate - The invoice due date (string or Date)
 * @returns Number of days overdue (0 if not overdue)
 */
export function getDaysOverdue(dueDate: string | Date): number {
  const due = typeof dueDate === 'string' ? new Date(dueDate) : dueDate;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  
  const diffTime = today.getTime() - due.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays > 0 ? diffDays : 0;
}

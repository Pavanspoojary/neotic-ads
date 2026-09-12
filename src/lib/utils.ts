/**
 * Lightweight class name joiner adhering to Ponytail Ladder (Rung 6: minimal effective code).
 * Eliminates need for external 'clsx' and 'tailwind-merge' dependencies.
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Format integer cents into standard USD currency string ($XX.XX).
 */
export function formatCentsToDollars(cents: number): string {
  return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

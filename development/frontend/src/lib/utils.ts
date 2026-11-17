import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}


/** Potency/weight for display: "24.50" → "24.5", "1.00" → "1" (design v3 shows THC 24.1%). */
export function formatPct(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') return '';
  const n = typeof value === 'number' ? value : parseFloat(value);
  return Number.isFinite(n) ? String(Math.round(n * 100) / 100) : String(value);
}

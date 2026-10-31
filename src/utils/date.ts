import { addDays, addWeeks, addMonths, addYears, format, parseISO, isAfter, isBefore } from 'date-fns';
import type { BillingFrequency } from '../types';

/**
 * Format date string to readable format (e.g. 12 Oct 2026)
 */
export function formatDate(dateString: string | undefined | null): string {
  if (!dateString) return '-';
  try {
    const d = parseISO(dateString);
    return format(d, 'dd MMM yyyy');
  } catch {
    return dateString;
  }
}

/**
 * Format date to ISO date string (YYYY-MM-DD)
 */
export function toISODate(date: Date = new Date()): string {
  return format(date, 'yyyy-MM-dd');
}

/**
 * Calculate next billing date based on frequency
 */
export function calculateNextBillingDate(startDate: string, frequency: BillingFrequency): string {
  const d = parseISO(startDate);
  let next: Date;
  switch (frequency) {
    case 'daily':
      next = addDays(d, 1);
      break;
    case 'weekly':
      next = addWeeks(d, 1);
      break;
    case 'monthly':
      next = addMonths(d, 1);
      break;
    case 'yearly':
      next = addYears(d, 1);
      break;
    default:
      next = addMonths(d, 1);
  }
  return toISODate(next);
}

/**
 * Calculate period end date (exclusive or inclusive)
 */
export function calculatePeriodEndDate(startDate: string, frequency: BillingFrequency): string {
  const next = calculateNextBillingDate(startDate, frequency);
  // Period end is 1 day before next billing date
  const periodEnd = addDays(parseISO(next), -1);
  return toISODate(periodEnd);
}

/**
 * Check if a date is in the past
 */
export function isPastDate(dateString: string): boolean {
  try {
    const d = parseISO(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return isBefore(d, today);
  } catch {
    return false;
  }
}

/**
 * Check if date is today or earlier
 */
export function isDueTodayOrPast(dateString: string): boolean {
  try {
    const d = parseISO(dateString);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return !isAfter(d, today);
  } catch {
    return false;
  }
}

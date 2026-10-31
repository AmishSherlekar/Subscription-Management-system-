// Monetary calculations using integer paise to completely eliminate floating-point rounding errors

/**
 * Format paise (integer) to formatted currency string (e.g. ₹1,560.00)
 */
export function formatPaise(paise: number | undefined | null, includeSymbol = true): string {
  if (paise === undefined || paise === null || isNaN(paise)) {
    return includeSymbol ? '₹0.00' : '0.00';
  }
  const rupees = paise / 100;
  const formatted = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(rupees);

  return includeSymbol ? `₹${formatted}` : formatted;
}

/**
 * Parse input string or number rupees to integer paise
 * e.g. "1560.50" or 1560.5 -> 156050 paise
 */
export function rupeesToPaise(rupees: number | string): number {
  if (typeof rupees === 'string') {
    const cleaned = rupees.replace(/[^0-9.-]+/g, '');
    const num = parseFloat(cleaned);
    if (isNaN(num)) return 0;
    return Math.round(num * 100);
  }
  if (typeof rupees === 'number') {
    if (isNaN(rupees)) return 0;
    return Math.round(rupees * 100);
  }
  return 0;
}

/**
 * Convert paise to rupees number for form input defaults
 */
export function paiseToRupees(paise: number): number {
  if (!paise || isNaN(paise)) return 0;
  return Number((paise / 100).toFixed(2));
}

/**
 * Integer calculation for percentage discount
 * @param amountInPaise Base amount in paise
 * @param percent Percentage rate (e.g. 10 for 10%)
 */
export function calculatePercentageDiscount(amountInPaise: number, percent: number): number {
  if (percent <= 0 || amountInPaise <= 0) return 0;
  return Math.min(amountInPaise, Math.round((amountInPaise * percent) / 100));
}

/**
 * Integer calculation for tax
 * @param taxableAmountInPaise Taxable subtotal in paise
 * @param taxRatePercent Tax percentage (e.g. 18 for 18%)
 */
export function calculateTaxAmount(taxableAmountInPaise: number, taxRatePercent: number): number {
  if (taxRatePercent <= 0 || taxableAmountInPaise <= 0) return 0;
  return Math.round((taxableAmountInPaise * taxRatePercent) / 100);
}

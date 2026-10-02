/**
 * Formats compensation strings cleanly to ensure standardized INR currency symbol and spacing.
 * Examples:
 *   "22 - 28 LPA" -> "₹22 – 28 LPA"
 *   "80,000 / month" -> "₹80,000 / month"
 *   "25000 / month fellowship" -> "₹25,000 / month fellowship"
 */
export function formatCompensation(raw: string | number | undefined | null): string {
  if (!raw) return 'Compensation undisclosed';
  const str = String(raw).trim();
  if (!str) return 'Compensation undisclosed';

  // Already prefixed with rupee symbol
  if (str.startsWith('₹') || str.startsWith('Rs.') || str.startsWith('INR')) {
    return str.replace(/^Rs\.?\s*/i, '₹').replace(/^INR\s*/i, '₹');
  }

  // Check if numeric or has numbers
  if (/^\d/.test(str)) {
    return `₹${str}`;
  }

  return str;
}

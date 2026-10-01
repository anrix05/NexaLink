/**
 * Date and Time utilities for NexaLink
 * Standardizes on Indian Standard Time (Asia/Kolkata)
 */

/**
 * Adds business days (Monday-Friday) to a given date, skipping weekends.
 */
export function addBusinessDays(startDate: Date, businessDaysToAdd: number): Date {
  const result = new Date(startDate.getTime());
  let added = 0;

  while (added < businessDaysToAdd) {
    result.setDate(result.getDate() + 1);
    const dayOfWeek = result.getDay();
    // 0 = Sunday, 6 = Saturday
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      added++;
    }
  }

  return result;
}

/**
 * Formats a date into a clean sentence-case string in IST.
 * e.g., "Friday, 3 October" or "3 Oct"
 */
export function formatIstDate(
  date: Date | string | number,
  options: { includeWeekday?: boolean; includeYear?: boolean } = {}
): string {
  const d = typeof date === 'object' ? date : new Date(date);
  if (isNaN(d.getTime())) return 'Recently';

  const formatOptions: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Kolkata',
    month: 'short',
    day: 'numeric',
    ...(options.includeWeekday ? { weekday: 'short' } : {}),
    ...(options.includeYear ? { year: 'numeric' } : {})
  };

  return new Intl.DateTimeFormat('en-IN', formatOptions).format(d);
}

/**
 * Formats a timestamp into IST with hours and minutes.
 * e.g., "14 Sep, 10:02" or "10:02 AM"
 */
export function formatIstTimestamp(
  date: Date | string | number,
  includeDate = true
): string {
  const d = typeof date === 'object' ? date : new Date(date);
  if (isNaN(d.getTime())) return 'Recently';

  const formatOptions: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Kolkata',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    ...(includeDate ? { day: 'numeric', month: 'short' } : {})
  };

  return new Intl.DateTimeFormat('en-IN', formatOptions).format(d);
}

/**
 * Computes an estimated review date (2 business days from submission in IST).
 */
export function getEstimatedReviewDate(submittedAt?: Date | string | number): string {
  const baseDate = submittedAt ? new Date(submittedAt) : new Date();
  const validDate = isNaN(baseDate.getTime()) ? new Date() : baseDate;
  const etaDate = addBusinessDays(validDate, 2);
  return formatIstDate(etaDate, { includeWeekday: true, includeYear: false });
}

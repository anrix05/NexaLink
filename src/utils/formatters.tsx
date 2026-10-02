import React from 'react';

const IST_TIMEZONE = 'Asia/Kolkata';

/**
 * Parses date inputs safely into a valid Date object.
 */
export function toSafeDate(input: string | number | Date | null | undefined): Date | null {
  if (!input) return null;
  const d = new Date(input);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Returns formatted date string in Indian Standard Time (e.g., "20 Nov 2026").
 */
export function formatDate(input: string | number | Date | null | undefined): string {
  const d = toSafeDate(input);
  if (!d) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: IST_TIMEZONE,
  }).format(d);
}

/**
 * Returns formatted date and time string in IST (e.g., "20 Nov 2026, 06:00 PM").
 */
export function formatDateTime(input: string | number | Date | null | undefined): string {
  const d = toSafeDate(input);
  if (!d) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: IST_TIMEZONE,
  }).format(d);
}

/**
 * Returns time string in IST (e.g., "06:30 PM").
 */
export function formatTime(input: string | number | Date | null | undefined): string {
  const d = toSafeDate(input);
  if (!d) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: IST_TIMEZONE,
  }).format(d);
}

export interface DeadlineStatus {
  label: string;
  isUrgent: boolean; // <= 7 days
  isClosed: boolean;
  daysRemaining: number;
  formattedDate: string;
}

/**
 * Evaluates opportunity or registration deadlines with urgency calculation.
 */
export function formatDeadline(input: string | number | Date | null | undefined): DeadlineStatus {
  const d = toSafeDate(input);
  if (!d) {
    return {
      label: 'Rolling applications',
      isUrgent: false,
      isClosed: false,
      daysRemaining: 999,
      formattedDate: '—',
    };
  }

  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  const formattedDate = formatDate(d);

  if (daysRemaining < 0) {
    return {
      label: 'Closed',
      isUrgent: false,
      isClosed: true,
      daysRemaining,
      formattedDate,
    };
  }

  if (daysRemaining === 0) {
    return {
      label: 'Closes today',
      isUrgent: true,
      isClosed: false,
      daysRemaining: 0,
      formattedDate,
    };
  }

  if (daysRemaining === 1) {
    return {
      label: 'Closes tomorrow',
      isUrgent: true,
      isClosed: false,
      daysRemaining: 1,
      formattedDate,
    };
  }

  if (daysRemaining <= 7) {
    return {
      label: `Closes in ${daysRemaining} days`,
      isUrgent: true,
      isClosed: false,
      daysRemaining,
      formattedDate,
    };
  }

  return {
    label: `Apply by ${formattedDate}`,
    isUrgent: false,
    isClosed: false,
    daysRemaining,
    formattedDate,
  };
}

/**
 * Returns human-friendly relative time difference.
 */
export function timeAgo(input: string | number | Date | null | undefined): string {
  const d = toSafeDate(input);
  if (!d) return '—';

  const now = Date.now();
  const diffSeconds = Math.floor((now - d.getTime()) / 1000);

  if (diffSeconds < 60) return 'Just now';
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;

  return formatDate(d);
}

/**
 * Renders an accessible semantic <time> element with ISO datetime attribute.
 */
export const TimeTag: React.FC<{
  date: string | number | Date | null | undefined;
  format?: 'date' | 'datetime' | 'time' | 'relative';
  className?: string;
}> = ({ date, format = 'date', className = '' }) => {
  const d = toSafeDate(date);
  if (!d) return <span className={className}>—</span>;

  let text = '';
  switch (format) {
    case 'datetime':
      text = formatDateTime(d);
      break;
    case 'time':
      text = formatTime(d);
      break;
    case 'relative':
      text = timeAgo(d);
      break;
    case 'date':
    default:
      text = formatDate(d);
      break;
  }

  return (
    <time dateTime={d.toISOString()} className={className}>
      {text}
    </time>
  );
};

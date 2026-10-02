import { DEPARTMENTS, type DepartmentInfo } from '../data/constants';

export type { DepartmentInfo };
export const DEPARTMENT_TAXONOMY = DEPARTMENTS;


export type CanonicalOpportunityType = 'full-time' | 'internship' | 'referral' | 'research';

export const OPPORTUNITY_TAXONOMY: Record<CanonicalOpportunityType, { id: CanonicalOpportunityType; label: string }> = {
  'full-time': { id: 'full-time', label: 'Full-time' },
  'internship': { id: 'internship', label: 'Internship' },
  'referral': { id: 'referral', label: 'Referral' },
  'research': { id: 'research', label: 'Research' },
};

/**
 * Normalizes legacy opportunity type strings to canonical taxonomy labels.
 */
export function normalizeOpportunityType(raw: string | undefined | null): string {
  if (!raw) return 'Full-time';
  const lower = raw.toLowerCase();
  if (lower.includes('intern')) return 'Internship';
  if (lower.includes('referral')) return 'Referral';
  if (lower.includes('research')) return 'Research';
  return 'Full-time';
}

export type CanonicalEventType =
  | 'Alumni meet'
  | 'Guest lecture'
  | 'Technical workshop'
  | 'Placement drive'
  | 'Research seminar';

export const EVENT_CATEGORIES: CanonicalEventType[] = [
  'Alumni meet',
  'Guest lecture',
  'Technical workshop',
  'Placement drive',
  'Research seminar',
];

/**
 * Normalizes event category strings to canonical sentence case.
 */
export function normalizeEventCategory(raw: string | undefined | null): CanonicalEventType {
  if (!raw) return 'Alumni meet';
  const lower = raw.toLowerCase();
  if (lower.includes('guest') || lower.includes('lecture')) return 'Guest lecture';
  if (lower.includes('workshop')) return 'Technical workshop';
  if (lower.includes('placement')) return 'Placement drive';
  if (lower.includes('research') || lower.includes('seminar')) return 'Research seminar';
  return 'Alumni meet';
}

import type { DepartmentCode } from '../types';

export const VALID_DEPARTMENT_CODES: DepartmentCode[] = [
  'CMPN',
  'INFT',
  'EXTC',
  'EXCS',
  'BIOM'
];

/**
 * Maps arbitrary department names, abbreviations, or strings to the canonical PostgreSQL department_code enums
 */
export function normalizeDepartmentCode(dept?: string | null): DepartmentCode {
  if (!dept) return 'CMPN';
  const clean = dept.trim().toUpperCase();

  if (VALID_DEPARTMENT_CODES.includes(clean as DepartmentCode)) {
    return clean as DepartmentCode;
  }

  if (clean.includes('TELE') || clean.includes('EXTC')) return 'EXTC';
  if (clean.includes('ELECTR') || clean.includes('ETRX') || clean.includes('EXCS')) return 'EXCS';
  if (clean.includes('BIOM')) return 'BIOM';
  if (clean.includes('INFO') || clean.includes('IT')) return 'INFT';
  if (clean.includes('COMP') || clean.includes('CSE')) return 'CMPN';
  if (clean.includes('MCA')) return 'CMPN';
  if (clean.includes('MBA')) return 'CMPN';

  return 'CMPN';
}

/**
 * Normalizes an array of department codes for PostgreSQL enum array compatibility
 */
export function normalizeDepartmentArray(depts?: (string | DepartmentCode)[] | null): DepartmentCode[] {
  if (!depts || !Array.isArray(depts) || depts.length === 0) return ['CMPN'];
  const normalized = depts.map(d => normalizeDepartmentCode(d));
  return Array.from(new Set(normalized));
}

/**
 * Normalizes mentorship request status to the Title-case PostgreSQL enum:
 * 'Pending' | 'Accepted' | 'Declined' | 'Completed' | 'Expired'
 */
export function normalizeMentorshipStatus(status?: string | null): 'Pending' | 'Accepted' | 'Declined' | 'Completed' | 'Expired' {
  if (!status) return 'Pending';
  const lower = status.trim().toLowerCase();
  if (lower === 'accepted') return 'Accepted';
  if (lower === 'declined' || lower === 'withdrawn') return 'Declined';
  if (lower === 'completed') return 'Completed';
  if (lower === 'expired') return 'Expired';
  return 'Pending';
}

/**
 * Normalizes opportunity status to Title-case PostgreSQL enum:
 * 'Active' | 'Closed' | 'Pending Approval'
 */
export function normalizeJobStatus(status?: string | null): 'Active' | 'Closed' | 'Pending Approval' {
  if (!status) return 'Active';
  const lower = status.trim().toLowerCase();
  if (lower === 'closed') return 'Closed';
  if (lower.includes('pending')) return 'Pending Approval';
  return 'Active';
}

/**
 * Normalizes opportunity moderation status to Title-case PostgreSQL enum:
 * 'Approved' | 'Pending Approval' | 'Rejected'
 */
export function normalizeModerationStatus(status?: string | null): 'Approved' | 'Pending Approval' | 'Rejected' {
  if (!status) return 'Approved';
  const lower = status.trim().toLowerCase();
  if (lower === 'rejected') return 'Rejected';
  if (lower.includes('pending')) return 'Pending Approval';
  return 'Approved';
}

/**
 * Normalizes event status to Title-case PostgreSQL enum:
 * 'Upcoming' | 'Completed' | 'Cancelled'
 */
export function normalizeEventStatus(status?: string | null): 'Upcoming' | 'Completed' | 'Cancelled' {
  if (!status) return 'Upcoming';
  const lower = status.trim().toLowerCase();
  if (lower === 'completed') return 'Completed';
  if (lower === 'cancelled' || lower === 'canceled') return 'Cancelled';
  return 'Upcoming';
}

/**
 * Formats any date input into a strict PostgreSQL DATE string: YYYY-MM-DD
 */
export function toPgDate(dateInput?: string | Date | null): string {
  if (!dateInput) return new Date().toISOString().split('T')[0];
  if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput.trim())) {
    return dateInput.trim();
  }
  const parsed = new Date(dateInput);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0];
  }
  return new Date().toISOString().split('T')[0];
}

/**
 * Formats any date input into a strict PostgreSQL TIMESTAMPTZ ISO string
 */
export function toPgTimestamp(dateInput?: string | Date | null): string {
  if (!dateInput) return new Date().toISOString();
  const parsed = new Date(dateInput);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString();
  }
  return new Date().toISOString();
}

import type { User, StudentProfile, AlumniProfile, FacultyProfile, UserRole } from '../types';

export interface UserEmails {
  /** The email address this user authenticates with */
  loginEmail: string | null;
  /** Official college email (@student.vit.edu.in or @vit.edu.in) */
  collegeEmail: string | null;
  /** Personal email (e.g. Gmail, Outlook) */
  personalEmail: string | null;
  /**
   * The canonical email address to display for this user based on system rules:
   * - student, faculty: displayEmail = collegeEmail (their sign-in email)
   * - alumni: displayEmail = personalEmail (their sign-in email)
   * - admin: displayEmail = loginEmail
   * - missing / unprovided: null (UI shows "Not provided", never silent cross-role fallback)
   */
  displayEmail: string | null;
}

/**
 * Checks whether an email address belongs to the institutional domain.
 */
export function isCollegeDomain(email?: string | null): boolean {
  if (!email || typeof email !== 'string') return false;
  const clean = email.trim().toLowerCase();
  return clean.endsWith('@vit.edu.in') || clean.endsWith('@student.vit.edu.in') || clean.endsWith('@alumni.vit.edu.in');
}

/**
 * Resolves all email fields for any user account following canonical role rules:
 * - student, faculty: sign in with collegeEmail -> displayEmail = collegeEmail
 * - alumni: sign in with personalEmail -> displayEmail = personalEmail
 * - admin: displayEmail = loginEmail
 *
 * Never falls back silently across roles. If an expected email is missing, returns null.
 */
export function getUserEmails(user?: Partial<User | StudentProfile | AlumniProfile | FacultyProfile> | null): UserEmails {
  if (!user) {
    return {
      loginEmail: null,
      collegeEmail: null,
      personalEmail: null,
      displayEmail: null
    };
  }

  const role: UserRole = ((user as any).userType || user.role || 'student').toLowerCase() as UserRole;

  // Clean raw fields
  const rawEmail = typeof user.email === 'string' && user.email.trim() ? user.email.trim() : null;
  const rawInstEmail = typeof user.institutionalEmail === 'string' && user.institutionalEmail.trim() ? user.institutionalEmail.trim() : null;
  const rawPersonalEmail = typeof user.personalEmail === 'string' && user.personalEmail.trim() ? user.personalEmail.trim() : null;

  let collegeEmail: string | null = null;
  let personalEmail: string | null = null;
  let loginEmail: string | null = null;

  if (role === 'student' || role === 'faculty' || (role as string) === 'teacher') {
    // For students and faculty:
    // Primary auth email is their college email.
    if (rawEmail && isCollegeDomain(rawEmail)) {
      collegeEmail = rawEmail;
    } else if (rawInstEmail && isCollegeDomain(rawInstEmail)) {
      collegeEmail = rawInstEmail;
    } else if (rawEmail) {
      // If student/faculty has a raw email without college domain, treat rawEmail as login email
      collegeEmail = rawEmail;
    }

    loginEmail = collegeEmail;

    // Personal recovery email:
    if (rawPersonalEmail && !isCollegeDomain(rawPersonalEmail)) {
      personalEmail = rawPersonalEmail;
    } else if (rawPersonalEmail) {
      personalEmail = rawPersonalEmail;
    }
  } else if (role === 'alumni') {
    // For alumni:
    // Their sign-in / active contact email is their personal email.
    // If user.personalEmail is present, that is their personalEmail and loginEmail.
    // If user.email is non-college, that is their personalEmail and loginEmail.
    if (rawPersonalEmail && !isCollegeDomain(rawPersonalEmail)) {
      personalEmail = rawPersonalEmail;
    } else if (rawEmail && !isCollegeDomain(rawEmail)) {
      personalEmail = rawEmail;
    } else if (rawPersonalEmail) {
      personalEmail = rawPersonalEmail;
    }

    loginEmail = personalEmail || (rawEmail && !isCollegeDomain(rawEmail) ? rawEmail : null);

    // Archival college email for alumni:
    if (rawInstEmail && isCollegeDomain(rawInstEmail)) {
      collegeEmail = rawInstEmail;
    } else if (rawEmail && isCollegeDomain(rawEmail)) {
      collegeEmail = rawEmail;
    }
  } else if (role === 'admin') {
    // For admin:
    loginEmail = rawEmail || rawInstEmail || rawPersonalEmail || null;
    if (rawEmail && isCollegeDomain(rawEmail)) {
      collegeEmail = rawEmail;
    } else if (rawInstEmail && isCollegeDomain(rawInstEmail)) {
      collegeEmail = rawInstEmail;
    }
    if (rawPersonalEmail && !isCollegeDomain(rawPersonalEmail)) {
      personalEmail = rawPersonalEmail;
    }
  } else {
    loginEmail = rawEmail;
  }

  // Derive displayEmail according to exact rules:
  // - student, faculty: displayEmail = collegeEmail (the one they sign in with)
  // - alumni: displayEmail = personalEmail (their sign-in email)
  // - admin: displayEmail = loginEmail
  // - never fall back silently to another role's email; if missing return null
  let displayEmail: string | null = null;

  if (role === 'student' || role === 'faculty' || (role as string) === 'teacher') {
    displayEmail = collegeEmail;
  } else if (role === 'alumni') {
    displayEmail = personalEmail;
  } else if (role === 'admin') {
    displayEmail = loginEmail;
  } else {
    displayEmail = loginEmail;
  }

  return {
    loginEmail,
    collegeEmail,
    personalEmail,
    displayEmail
  };
}

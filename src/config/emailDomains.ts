/**
 * Institutional Email Domain Configuration
 * Vidyalankar Institute of Technology (VIT Wadala)
 *
 * NOTE: Domain matching in NexaLink is ADVISORY, not an authority on account role.
 * Actual account roles (student, faculty, alumni) and verification status are established
 * via explicit registration choice + registrar record verification by an administrator.
 */

export const INSTITUTIONAL_DOMAINS = [
  'vit.edu.in',
  'student.vit.edu.in'
] as const;

export const PRIMARY_STUDENT_DOMAIN = 'student.vit.edu.in';
export const PRIMARY_FACULTY_DOMAIN = 'vit.edu.in';

export interface EmailDomainClassification {
  isInstitutional: boolean;
  suggestedRole?: 'student' | 'faculty' | 'alumni';
  domain: string;
}

/**
 * Classifies an email address for advisory messaging / hints.
 * Does NOT enforce or authorize permissions.
 */
export function classifyEmailDomain(email: string): EmailDomainClassification {
  const clean = (email || '').trim().toLowerCase();
  const atIndex = clean.lastIndexOf('@');
  if (atIndex === -1 || atIndex === clean.length - 1) {
    return { isInstitutional: false, domain: '' };
  }

  const domain = clean.slice(atIndex + 1);

  if (domain === 'student.vit.edu.in') {
    return { isInstitutional: true, suggestedRole: 'student', domain };
  }

  if (domain === 'vit.edu.in') {
    // Both faculty and certain students/staff may have @vit.edu.in addresses
    return { isInstitutional: true, suggestedRole: undefined, domain };
  }

  // Personal / external domains (e.g., gmail, outlook) typically used by alumni
  return { isInstitutional: false, suggestedRole: 'alumni', domain };
}

/**
 * Validates whether an email belongs to an institutional domain.
 */
export function isInstitutionalEmail(email: string): boolean {
  const clean = (email || '').trim().toLowerCase();
  return INSTITUTIONAL_DOMAINS.some(d => clean.endsWith(`@${d}`));
}

/**
 * Static sign-in helper text (neutral, non-presumptive)
 */
export const SIGN_IN_EMAIL_HELPER = 'Use your institutional email. Alumni can use their personal email.';

/**
 * NexaLink Unified Institutional Validation & Presentation Helpers
 */

export type UserRole = 'Student' | 'Alumni' | 'Faculty' | 'Admin';

/**
 * B2: Single shared institutional email validator.
 * - Students: @student.vit.edu.in or @vit.edu.in
 * - Faculty: @vit.edu.in
 * - Admin: @vit.edu.in
 * - Alumni: Any valid email format for personal login; institutional email optional
 */
export function validateEmailByRole(
  email: string,
  role: UserRole
): { isValid: boolean; error?: string } {
  const trimmed = (email || '').trim().toLowerCase();
  if (!trimmed) {
    return { isValid: false, error: 'Email address is required.' };
  }

  // Standard RFC 5322 basic pattern
  const basicEmailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!basicEmailRegex.test(trimmed)) {
    return { isValid: false, error: 'Please enter a valid email address format.' };
  }

  if (role === 'Student') {
    if (trimmed.endsWith('@student.vit.edu.in') || trimmed.endsWith('@vit.edu.in')) {
      return { isValid: true };
    }
    return {
      isValid: false,
      error: 'Student email must end in @student.vit.edu.in or @vit.edu.in'
    };
  }

  if (role === 'Faculty' || role === 'Admin') {
    if (trimmed.endsWith('@vit.edu.in')) {
      return { isValid: true };
    }
    return {
      isValid: false,
      error: `${role} institutional email must end in @vit.edu.in`
    };
  }

  if (role === 'Alumni') {
    // Any valid personal email accepted
    return { isValid: true };
  }

  return { isValid: true };
}

/**
 * Returns dynamic hint text reflecting the exact rule for the current role
 */
export function getEmailHintByRole(role: UserRole): string {
  switch (role) {
    case 'Student':
      return 'Institutional email must end in @student.vit.edu.in or @vit.edu.in';
    case 'Faculty':
      return 'Institutional email must end in @vit.edu.in';
    case 'Admin':
      return 'Institutional administrator email must end in @vit.edu.in';
    case 'Alumni':
    default:
      return 'Use your primary personal or professional email address.';
  }
}

/**
 * B1: Format user name display safely.
 * Never naively split on first space because titles ("Dr.", "Prof.", "Mr.") leave only the prefix!
 * Returns full name, allowing CSS truncation with title tooltip for overflow.
 */
export function formatDisplayName(fullName?: string | null): string {
  if (!fullName) return 'Member';
  const trimmed = fullName.trim();
  if (!trimmed) return 'Member';
  return trimmed;
}

/**
 * B1: Short greeting name that correctly respects honorifics/titles.
 * e.g., "Dr. Ravindra Sangale" -> "Dr. Sangale" or "Dr. Ravindra"
 * "Aarav Sharma" -> "Aarav"
 */
export function getGreetingName(fullName?: string | null): string {
  if (!fullName) return 'there';
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];

  const first = parts[0].toLowerCase();
  const titles = ['dr.', 'dr', 'prof.', 'prof', 'mr.', 'mr', 'mrs.', 'mrs', 'ms.', 'ms'];
  if (titles.includes(first) && parts.length > 1) {
    // If title present, combine title with next word or last name
    return `${parts[0]} ${parts[1]}`;
  }

  return parts[0];
}

/**
 * AUDIT STATUS COMMENT:
 * ITEM 2 STATUS: IMPLEMENTED - Profile Privacy Guard enforces field-level visibility settings
 * ('public' | 'institution' | 'private') across search results, Org Lookup, and recommendation engine.
 */

import type { User, AlumniProfile, StudentProfile, FacultyProfile, UserPrivacySettings } from '../types';

export function redactUserPrivacyFields<T extends User>(
  targetUser: T,
  viewerUser?: User | null
): T {
  if (!targetUser) return targetUser;
  
  // Self-viewing bypasses redaction
  if (viewerUser && viewerUser.id === targetUser.id) {
    return targetUser;
  }

  const isInstitutionalViewer = Boolean(viewerUser && viewerUser.id);
  const privacy: UserPrivacySettings = targetUser.privacySettings || {
    email: 'institution',
    phone: 'private',
    company: 'public',
    higherEd: 'public'
  };

  const copy = { ...targetUser };

  // Email privacy check
  if (privacy.email === 'private') {
    copy.email = '[Private - Restricted by User]';
  } else if (privacy.email === 'institution' && !isInstitutionalViewer) {
    copy.email = '[Institutional Access Only]';
  }

  // Phone privacy check
  if (privacy.phone === 'private') {
    copy.phone = '[Private]';
  } else if (privacy.phone === 'institution' && !isInstitutionalViewer) {
    copy.phone = '[Institutional Access Only]';
  }

  // Company privacy check for Alumni
  if ('company' in copy && privacy.company === 'private') {
    (copy as unknown as AlumniProfile).company = '[Confidential / Hidden]';
  }

  // Higher Ed privacy check for Alumni
  if ('higherEducationInstitute' in copy && privacy.higherEd === 'private') {
    (copy as unknown as AlumniProfile).higherEducationInstitute = undefined;
  }

  return copy;
}

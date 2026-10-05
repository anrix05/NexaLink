/**
 * NexaLink Environment Configuration
 *
 * All env-driven constants are gathered here so they can be used across the
 * app without scattered `import.meta.env.*` calls.  Add new variables here
 * and access them via this module.
 */

// Re-export the primary support email (defined in auth.ts to keep that file minimal).
export { SUPPORT_EMAIL } from './auth';

/** Privacy / data-protection contact (defaults to SUPPORT_EMAIL). */
export const PRIVACY_EMAIL: string =
  (import.meta.env.VITE_PRIVACY_EMAIL as string) ||
  (import.meta.env.VITE_SUPPORT_EMAIL as string) ||
  'support@vit.edu.in';

/** Legal / terms contact (defaults to SUPPORT_EMAIL). */
export const LEGAL_EMAIL: string =
  (import.meta.env.VITE_LEGAL_EMAIL as string) ||
  (import.meta.env.VITE_SUPPORT_EMAIL as string) ||
  'support@vit.edu.in';

/** Name of the operating institution. */
export const INSTITUTION_NAME = 'Vidyalankar Institute of Technology';

/** Short brand name shown in UI. */
export const BRAND_NAME = 'NexaLink';

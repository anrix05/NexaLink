/**
 * Authentication and Registration Configuration
 */

/**
 * When true, proof document upload is mandatory for alumni during registration.
 * When false (default), alumni proof upload is optional with helper text "Upload now for faster approval".
 */
export const REQUIRE_ALUMNI_PROOF_AT_SIGNUP = false;

/**
 * Standard support contact email for verification queries and appeals
 */
export const SUPPORT_EMAIL = (import.meta.env.VITE_SUPPORT_EMAIL as string) || 'support@vit.edu.in';


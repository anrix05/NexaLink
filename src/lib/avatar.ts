import { supabase } from './supabase';

/**
 * List of known stock, mock, or placeholder avatar URL signatures.
 * Any URL matching these will be treated as "no photo" so clean initials render instead.
 */
const KNOWN_STOCK_AVATAR_PATTERNS = [
  'photo-1534528741775', // default stock woman
  'photo-1535713875002', // stock male
  'photo-1573496359142', // stock female
  'photo-1472099645785', // stock male
  'photo-1494790108377', // stock female
  'photo-1507003211169', // stock male
  'photo-1500648767791', // stock male
  'photo-1544005313-94ddf0286df2', // stock female
  'photo-1519085360753', // stock male
  'photo-1539571696357', // stock male
  'photo-1560250097-0b93528c311a', // stock male
  'ui-avatars.com',
  'dicebear.com',
  'pravatar.cc',
  'randomuser.me',
  'placeholder.com',
  'via.placeholder.com',
  'default-avatar',
  'avatar-placeholder',
];

/**
 * Checks whether a given avatar string is empty, bogus, or a known stock placeholder photo.
 */
export function isDefaultAvatar(url?: string | null): boolean {
  if (!url || typeof url !== 'string') return true;
  const trimmed = url.trim().toLowerCase();
  if (
    trimmed === '' ||
    trimmed === 'null' ||
    trimmed === 'undefined' ||
    trimmed === 'none' ||
    trimmed === 'false' ||
    trimmed === 'true'
  ) {
    return true;
  }

  return KNOWN_STOCK_AVATAR_PATTERNS.some((pattern) => trimmed.includes(pattern));
}

/**
 * Resolves an avatar string into a valid, usable image URL or null.
 * Handles full HTTP URLs, Supabase Storage paths, data URLs, and optional cache-busting.
 */
export function getAvatarUrl(
  value?: string | null,
  updatedAt?: string | number | Date | null
): string | null {
  if (!value || isDefaultAvatar(value)) {
    return null;
  }

  const clean = value.trim();
  let resolvedUrl: string;

  if (clean.startsWith('http://') || clean.startsWith('https://') || clean.startsWith('data:image/')) {
    resolvedUrl = clean;
  } else {
    // Relative storage path: resolve to public Supabase Storage URL
    const cleanPath = clean.replace(/^avatars\//, '');
    const { data } = supabase.storage.from('avatars').getPublicUrl(cleanPath);
    resolvedUrl = data?.publicUrl || clean;
  }

  if (updatedAt) {
    const version = updatedAt instanceof Date ? updatedAt.getTime() : String(updatedAt);
    const separator = resolvedUrl.includes('?') ? '&' : '?';
    return `${resolvedUrl}${separator}v=${encodeURIComponent(version)}`;
  }

  return resolvedUrl;
}

/**
 * Generates clean 1 or 2 letter initials for a user.
 * Strips academic and honorific titles (Dr., Prof., Mr., Ms., Mrs.).
 * Falls back to email local part if no name is available.
 */
export function getInitials(name?: string | null, email?: string | null): string {
  if (name && typeof name === 'string' && name.trim().length > 0) {
    // Strip common prefixes/honorifics
    const clean = name
      .trim()
      .replace(/^(Dr\.|Prof\.|Mr\.|Mrs\.|Ms\.|Shri\.|Smt\.)\s+/i, '')
      .replace(/^(Dr|Prof|Mr|Mrs|Ms|Shri|Smt)\s+/i, '');

    const words = clean
      .split(/[\s._-]+/)
      .filter((w) => w.length > 0 && /^[a-zA-Z0-9]/.test(w));

    if (words.length === 1) {
      // Single word name: take first 1 or 2 characters
      return words[0].slice(0, words[0].length >= 2 ? 2 : 1).toUpperCase();
    }

    if (words.length >= 2) {
      // Multiple word name: First character of first word + First character of last word
      const first = words[0][0];
      const last = words[words.length - 1][0];
      return (first + last).toUpperCase();
    }
  }

  if (email && typeof email === 'string' && email.trim().length > 0) {
    const localPart = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '');
    if (localPart.length >= 2) {
      return localPart.slice(0, 2).toUpperCase();
    }
    if (localPart.length === 1) {
      return localPart[0].toUpperCase();
    }
  }

  return '';
}

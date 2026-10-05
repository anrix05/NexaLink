import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.types';

const rawSupabaseUrl = typeof import.meta !== 'undefined' && (import.meta as any).env ? (import.meta as any).env.VITE_SUPABASE_URL : (typeof process !== 'undefined' ? process.env?.VITE_SUPABASE_URL : undefined);
const rawSupabaseAnonKey = typeof import.meta !== 'undefined' && (import.meta as any).env ? (import.meta as any).env.VITE_SUPABASE_ANON_KEY : (typeof process !== 'undefined' ? process.env?.VITE_SUPABASE_ANON_KEY : undefined);

// Check if credentials are valid and not placeholder templates
export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    rawSupabaseUrl &&
    rawSupabaseAnonKey &&
    !rawSupabaseUrl.includes('your-project-id') &&
    rawSupabaseUrl.startsWith('https://') &&
    !rawSupabaseAnonKey.includes('your-anon-key') &&
    rawSupabaseAnonKey.length > 20
  );
};

// Safe fallback URL/Key for offline or demo build environments
const supabaseUrl = isSupabaseConfigured()
  ? rawSupabaseUrl
  : 'https://placeholder-nexalink.supabase.co';

const supabaseAnonKey = isSupabaseConfigured()
  ? rawSupabaseAnonKey
  : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder.mockkey';

/**
 * Singleton Supabase Client instance for NexaLink
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'nexalink-supabase-auth'
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

/**
 * Helper to initiate Google OAuth login restricted to institutional domain
 */
export const signInWithInstitutionalGoogle = async () => {
  if (!isSupabaseConfigured()) {
    return { error: new Error('Supabase credentials not configured in .env') };
  }
  return supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      queryParams: {
        hd: 'vit.edu.in', // Google Workspace institutional domain filter
        prompt: 'select_account'
      },
      redirectTo: `${window.location.origin}/`
    }
  });
};

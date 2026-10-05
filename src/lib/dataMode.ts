import { isSupabaseConfigured } from './supabase';

export type DataMode = 'live' | 'mock';

export interface DataModeStatus {
  ok: boolean;
  mode: DataMode;
  errorReason?: string;
}

export function getDataMode(): DataMode {
  const envMode = (import.meta.env.VITE_DATA_MODE || '').toLowerCase().trim();
  if (envMode === 'mock') return 'mock';
  return 'live';
}

export function isLiveMode(): boolean {
  return getDataMode() === 'live';
}

export function validateDataMode(): DataModeStatus {
  const rawMode = (import.meta.env.VITE_DATA_MODE || '').trim();

  // If not set, silently default to live — do NOT block production deployments
  // that simply omit the var (e.g. Vercel without the env configured).
  if (!rawMode) {
    // Still gate if Supabase itself is unconfigured, since the app truly can't work.
    if (!isSupabaseConfigured()) {
      return {
        ok: false,
        mode: 'live',
        errorReason:
          'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment (Vercel → Project Settings → Environment Variables).',
      };
    }
    return { ok: true, mode: 'live' };
  }

  const normalized = rawMode.toLowerCase();
  if (normalized !== 'live' && normalized !== 'mock') {
    return {
      ok: false,
      mode: 'live',
      errorReason: `Invalid VITE_DATA_MODE "${rawMode}". Allowed values are "live" or "mock".`,
    };
  }

  if (normalized === 'live' && !isSupabaseConfigured()) {
    return {
      ok: false,
      mode: 'live',
      errorReason:
        'Live mode requested (VITE_DATA_MODE=live) but Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
    };
  }

  return { ok: true, mode: normalized as DataMode };
}

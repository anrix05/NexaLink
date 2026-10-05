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
  
  if (!rawMode) {
    return {
      ok: false,
      mode: 'live',
      errorReason: 'Environment variable VITE_DATA_MODE is missing. Explicitly define VITE_DATA_MODE=live or VITE_DATA_MODE=mock in your .env file.'
    };
  }

  const normalized = rawMode.toLowerCase();
  if (normalized !== 'live' && normalized !== 'mock') {
    return {
      ok: false,
      mode: 'live',
      errorReason: `Invalid VITE_DATA_MODE "${rawMode}". Allowed values are "live" or "mock".`
    };
  }

  if (normalized === 'live' && !isSupabaseConfigured()) {
    return {
      ok: false,
      mode: 'live',
      errorReason: 'Live mode requested (VITE_DATA_MODE=live) but Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY or set VITE_DATA_MODE=mock.'
    };
  }

  return {
    ok: true,
    mode: normalized as DataMode
  };
}

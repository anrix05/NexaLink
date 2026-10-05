/**
 * Public Stats Service
 * Fetches institutional aggregate statistics via Supabase RPC 'get_public_stats'.
 * Callable anonymously and by authenticated users.
 * Caches results in memory for 5 minutes (300,000 ms) and deduplicates in-flight requests.
 */

import { supabase } from '../lib/supabase';

export interface PublicStats {
  verified_alumni: number;
  verified_members: number;
  approved_jobs: number;
}

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

let cachedStats: { data: PublicStats; timestamp: number } | null = null;
let inflightRequest: Promise<PublicStats> | null = null;

export async function getPublicStats(): Promise<PublicStats> {
  const now = Date.now();
  if (cachedStats && now - cachedStats.timestamp < CACHE_TTL_MS) {
    return cachedStats.data;
  }

  if (inflightRequest) {
    return inflightRequest;
  }

  inflightRequest = (async () => {
    try {
      const { data, error } = await (supabase.rpc as any)('get_public_stats');

      if (error) {
        throw error;
      }

      if (!data) {
        throw new Error('Empty response from get_public_stats');
      }

      // Handle both table return [ { ... } ] and object return { ... }
      const row = Array.isArray(data) ? data[0] : data;
      if (!row || typeof row !== 'object') {
        throw new Error('Unexpected format returned by get_public_stats');
      }

      const stats: PublicStats = {
        verified_alumni: typeof row.verified_alumni === 'number' ? row.verified_alumni : parseInt(row.verified_alumni ?? '0', 10) || 0,
        verified_members: typeof row.verified_members === 'number' ? row.verified_members : parseInt(row.verified_members ?? '0', 10) || 0,
        approved_jobs: typeof row.approved_jobs === 'number' ? row.approved_jobs : parseInt(row.approved_jobs ?? '0', 10) || 0,
      };

      cachedStats = {
        data: stats,
        timestamp: Date.now(),
      };

      return stats;
    } finally {
      inflightRequest = null;
    }
  })();

  return inflightRequest;
}

export function clearPublicStatsCache(): void {
  cachedStats = null;
  inflightRequest = null;
}

export function getCachedPublicStats(): PublicStats | null {
  if (cachedStats && Date.now() - cachedStats.timestamp < CACHE_TTL_MS) {
    return cachedStats.data;
  }
  return null;
}

/**
 * Global Network Service
 * Fetches verified alumni geographic distribution and totals via Supabase RPC 'get_global_network_stats'.
 * Falls back to public stats aggregates gracefully if the RPC is unavailable.
 * Caches results in memory for 5 minutes (300,000 ms) and deduplicates in-flight requests.
 */

import { supabase } from '../lib/supabase';
import { getPublicStats } from './publicStatsService';
import type { GlobalNetworkStatsResponse } from '../components/landing/networkMapData';

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

let cachedData: { data: GlobalNetworkStatsResponse; timestamp: number } | null = null;
let inflightRequest: Promise<GlobalNetworkStatsResponse> | null = null;

export async function getGlobalNetworkStats(forceRefresh = false): Promise<GlobalNetworkStatsResponse> {
  const now = Date.now();
  if (!forceRefresh && cachedData && now - cachedData.timestamp < CACHE_TTL_MS) {
    return cachedData.data;
  }

  if (!forceRefresh && inflightRequest) {
    return inflightRequest;
  }

  inflightRequest = (async () => {
    try {
      // 1. Attempt to call public get_global_network_stats RPC
      const { data, error } = await (supabase.rpc as unknown as (name: string) => Promise<{ data: unknown; error: unknown }>)(
        'get_global_network_stats'
      );

      if (!error && data && typeof data === 'object') {
        const rawObj = data as Record<string, unknown>;
        const rawTotals = (rawObj.totals || {}) as Record<string, unknown>;
        const rawCities = (Array.isArray(rawObj.cities) ? rawObj.cities : []) as Record<string, unknown>[];

        const parsed: GlobalNetworkStatsResponse = {
          totals: {
            verified_alumni: typeof rawTotals.verified_alumni === 'number' ? rawTotals.verified_alumni : parseInt(String(rawTotals.verified_alumni ?? '0'), 10) || 0,
            countries: typeof rawTotals.countries === 'number' ? rawTotals.countries : parseInt(String(rawTotals.countries ?? '0'), 10) || 0,
            cities: typeof rawTotals.cities === 'number' ? rawTotals.cities : parseInt(String(rawTotals.cities ?? '0'), 10) || 0,
          },
          cities: rawCities.map((c) => ({
            city: String(c.city ?? '').trim(),
            country: String(c.country ?? 'India').trim(),
            alumni_count: typeof c.alumni_count === 'number' ? c.alumni_count : parseInt(String(c.alumni_count ?? '1'), 10) || 1,
          })).filter((c) => c.city.length > 0),
        };

        cachedData = {
          data: parsed,
          timestamp: Date.now(),
        };

        return parsed;
      }

      // 2. Fallback: Fetch base public stats if specific network RPC is not yet applied
      const baseStats = await getPublicStats();
      const verifiedCount = baseStats.verified_alumni || 0;

      const fallbackData: GlobalNetworkStatsResponse = {
        totals: {
          verified_alumni: verifiedCount,
          countries: verifiedCount > 0 ? 1 : 0,
          cities: verifiedCount > 0 ? 1 : 0,
        },
        cities: verifiedCount > 0
          ? [{ city: 'Mumbai', country: 'India', alumni_count: verifiedCount }]
          : [],
      };

      cachedData = {
        data: fallbackData,
        timestamp: Date.now(),
      };

      return fallbackData;
    } catch (err) {
      console.warn('[globalNetworkService] Error fetching network stats, attempting fallback:', err);
      // Try fallback to public stats
      try {
        const baseStats = await getPublicStats();
        return {
          totals: {
            verified_alumni: baseStats.verified_alumni || 0,
            countries: baseStats.verified_alumni > 0 ? 1 : 0,
            cities: baseStats.verified_alumni > 0 ? 1 : 0,
          },
          cities: [],
        };
      } catch {
        throw err;
      }
    } finally {
      inflightRequest = null;
    }
  })();

  return inflightRequest;
}

export function clearGlobalNetworkCache(): void {
  cachedData = null;
  inflightRequest = null;
}

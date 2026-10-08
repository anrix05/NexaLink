import { useState, useEffect, useCallback, useRef } from 'react';
import { announcementsService } from '../services/announcementsService';
import type { Announcement, UserRole } from '../types';

interface CacheEntry {
  data: Announcement[];
  timestamp: number;
}

const memoryCache: Record<string, CacheEntry> = {};
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export function invalidateNoticesCache(): void {
  for (const k in memoryCache) {
    delete memoryCache[k];
  }
}

export interface UseNoticesOptions {
  role?: UserRole | string;
  limit?: number;
}

export interface UseNoticesResult {
  notices: Announcement[];
  isLoading: boolean;
  isError: boolean;
  refetch: () => Promise<void>;
}

export function useNotices(options: UseNoticesOptions = {}): UseNoticesResult {
  const { role, limit = 50 } = options;
  const cacheKey = `${role || 'all'}_${limit}`;

  const [notices, setNotices] = useState<Announcement[]>(() => {
    const cached = memoryCache[cacheKey];
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }
    return [];
  });

  const [isLoading, setIsLoading] = useState<boolean>(() => {
    const cached = memoryCache[cacheKey];
    return !(cached && Date.now() - cached.timestamp < CACHE_TTL_MS);
  });

  const [isError, setIsError] = useState<boolean>(false);
  const isMountedRef = useRef(true);

  const fetchNotices = useCallback(async (bypassCache = false) => {
    const cached = memoryCache[cacheKey];
    if (!bypassCache && cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      if (isMountedRef.current) {
        setNotices(cached.data);
        setIsLoading(false);
        setIsError(false);
      }
      return;
    }

    if (isMountedRef.current) {
      setIsLoading(true);
      setIsError(false);
    }

    try {
      const data = await announcementsService.listForViewer({ role, limit });

      memoryCache[cacheKey] = {
        data,
        timestamp: Date.now()
      };

      if (isMountedRef.current) {
        setNotices(data);
        setIsLoading(false);
        setIsError(false);
      }
    } catch (err) {
      console.warn('[useNotices] Failed to fetch announcements:', err);
      if (isMountedRef.current) {
        setIsLoading(false);
        setIsError(true);
      }
    }
  }, [cacheKey, role, limit]);

  useEffect(() => {
    isMountedRef.current = true;
    fetchNotices();

    const onFocus = () => {
      fetchNotices(true);
    };

    window.addEventListener('focus', onFocus);
    return () => {
      isMountedRef.current = false;
      window.removeEventListener('focus', onFocus);
    };
  }, [fetchNotices]);

  return {
    notices,
    isLoading,
    isError,
    refetch: () => fetchNotices(true)
  };
}

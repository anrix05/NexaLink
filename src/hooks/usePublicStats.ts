import { useState, useEffect } from 'react';
import { getPublicStats, getCachedPublicStats, type PublicStats } from '../services/publicStatsService';

export interface UsePublicStatsResult {
  stats: PublicStats | null;
  isLoading: boolean;
  isError: boolean;
}

export function usePublicStats(): UsePublicStatsResult {
  const cached = getCachedPublicStats();
  const [stats, setStats] = useState<PublicStats | null>(cached);
  const [isLoading, setIsLoading] = useState<boolean>(!cached);
  const [isError, setIsError] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    // If cache is fresh, state is already set
    if (cached) {
      setStats(cached);
      setIsLoading(false);
      setIsError(false);
      return;
    }

    setIsLoading(true);
    setIsError(false);

    getPublicStats()
      .then((data) => {
        if (isMounted) {
          setStats(data);
          setIsLoading(false);
          setIsError(false);
        }
      })
      .catch((_err) => {
        if (isMounted) {
          setStats(null);
          setIsLoading(false);
          setIsError(true);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [cached]);

  return { stats, isLoading, isError };
}

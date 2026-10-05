import { useState, useEffect, useCallback } from 'react';
import { getGlobalNetworkStats } from '../services/globalNetworkService';
import type { GlobalNetworkStatsResponse } from '../components/landing/networkMapData';

export interface UseGlobalNetworkStatsResult {
  data: GlobalNetworkStatsResponse | null;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
}

export function useGlobalNetworkStats(): UseGlobalNetworkStatsResult {
  const [data, setData] = useState<GlobalNetworkStatsResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isError, setIsError] = useState<boolean>(false);

  const fetchData = useCallback((force = false) => {
    let isMounted = true;
    setIsLoading(true);
    setIsError(false);

    getGlobalNetworkStats(force)
      .then((res) => {
        if (isMounted) {
          setData(res);
          setIsLoading(false);
          setIsError(false);
        }
      })
      .catch((_err) => {
        if (isMounted) {
          setIsLoading(false);
          setIsError(true);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    return fetchData(false);
  }, [fetchData]);

  const refetch = useCallback(() => {
    fetchData(true);
  }, [fetchData]);

  return { data, isLoading, isError, refetch };
}

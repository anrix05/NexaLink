import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { authService } from '../services/authService';
import type { VerificationStatePayload } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import type { AccountVerificationStatus } from '../types';

export interface UseVerificationStateReturn {
  state: VerificationStatePayload | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  updateDetails: (patch: { name?: string; department?: any; enrollmentNo?: string; employeeId?: string }) => Promise<{ ok: boolean; error?: string }>;
  replaceDocument: (file: File) => Promise<{ ok: boolean; error?: string }>;
  forceDevState?: (status: AccountVerificationStatus, extras?: Partial<VerificationStatePayload>) => void;
  lastCheckedTime: string;
}

export function useVerificationState(): UseVerificationStateReturn {
  const { currentUser } = useAuth();
  const [state, setState] = useState<VerificationStatePayload | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastCheckedTime, setLastCheckedTime] = useState<string>('Just now');
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchState = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsRefreshing(true);
    try {
      const data = await authService.getMyVerificationState(currentUser);
      setState(data);
      setError(null);
      const now = new Date();
      setLastCheckedTime(
        new Intl.DateTimeFormat('en-IN', {
          timeZone: 'Asia/Kolkata',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        }).format(now)
      );
    } catch (err: any) {
      console.error('Error in useVerificationState:', err);
      setError(err?.message || 'Failed to load verification status');
    } finally {
      setIsLoading(false);
      if (!isSilent) setIsRefreshing(false);
    }
  }, [currentUser]);

  // Initial fetch and 30s polling fallback
  useEffect(() => {
    fetchState(false);

    // 30-second polling fallback
    pollTimerRef.current = setInterval(() => {
      fetchState(true);
    }, 30000);

    // Resume/refresh on visibilitychange (e.g. mobile tab resume)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchState(true);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchState]);

  // Supabase Realtime subscription
  useEffect(() => {
    if (!isSupabaseConfigured() || !currentUser?.id || currentUser.id.startsWith('mock-')) {
      return;
    }

    const channel = supabase
      .channel(`verification-user-${currentUser.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'users',
          filter: `id=eq.${currentUser.id}`
        },
        () => {
          fetchState(true);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser?.id, fetchState]);

  // Update registration details
  const updateDetails = useCallback(async (patch: { name?: string; department?: any; enrollmentNo?: string; employeeId?: string }) => {
    setIsRefreshing(true);
    try {
      const res = await authService.updateMyRegistration(patch);
      if (res.ok) {
        await fetchState(true);
      }
      return res;
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchState]);

  // Replace proof document
  const replaceDocument = useCallback(async (file: File) => {
    if (!currentUser?.id) return { ok: false, error: 'User session not found' };
    setIsRefreshing(true);
    try {
      const res = await authService.submitProofDocument(file, currentUser.id);
      if (res.ok) {
        await fetchState(true);
      }
      return res;
    } finally {
      setIsRefreshing(false);
    }
  }, [currentUser?.id, fetchState]);

  // Dev-only helper to force state for manual inspection
  const forceDevState = useCallback((status: AccountVerificationStatus, extras?: Partial<VerificationStatePayload>) => {
    if (!import.meta.env.DEV) return;
    setState((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        status,
        ...extras
      };
    });
  }, []);

  return {
    state,
    isLoading,
    isRefreshing,
    error,
    refresh: () => fetchState(false),
    updateDetails,
    replaceDocument,
    forceDevState: import.meta.env.DEV ? forceDevState : undefined,
    lastCheckedTime
  };
}

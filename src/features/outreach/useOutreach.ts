// ============================================================================
// NEXALINK V2.8: Outreach Hooks
// ============================================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import { outreachApi } from './api';
import type {
  StudentOutreachSettings,
  DiscoverableStudent,
  SuggestedStudent,
  OutreachInvitation,
  ProfileViewItem,
  DiscoverStudentsFilter,
  SendInvitationResult
} from './types';

export function useOutreachSettings(studentId?: string) {
  const [settings, setSettings] = useState<StudentOutreachSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    if (!studentId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const data = await outreachApi.getSettings(studentId);
      setSettings(data);
    } catch (e: any) {
      setError(e?.message || 'Failed to load outreach settings.');
    } finally {
      setIsLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSettings = async (partial: Partial<StudentOutreachSettings>) => {
    if (!studentId || !settings) return;
    setIsSaving(true);
    setError(null);
    try {
      const updated = await outreachApi.updateSettings(studentId, partial);
      setSettings(updated);
      return updated;
    } catch (e: any) {
      setError(e?.message || 'Failed to save settings.');
      throw e;
    } finally {
      setIsSaving(false);
    }
  };

  return {
    settings,
    isLoading,
    isSaving,
    error,
    updateSettings,
    refresh: fetchSettings
  };
}

export function useDiscoverStudents(
  viewerId?: string,
  viewerRole?: string,
  viewerDept?: string,
  filter?: DiscoverStudentsFilter
) {
  const [students, setStudents] = useState<DiscoverableStudent[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const limit = 24;

  const currentFiltersRef = useRef(filter);
  currentFiltersRef.current = filter;

  const abortControllerRef = useRef<AbortController | null>(null);

  const loadData = useCallback(async (isInitial = true, newOffset = 0) => {
    if (!viewerId || !viewerRole) {
      setIsLoading(false);
      return;
    }

    if (isInitial) {
      setIsLoading(true);
      setOffset(0);
    } else {
      setIsLoadingMore(true);
    }

    try {
      const res = await outreachApi.listDiscoverable(viewerId, viewerRole, viewerDept || 'CMPN', {
        ...currentFiltersRef.current,
        limit,
        offset: newOffset
      });

      if (isInitial) {
        setStudents(res.students);
        setTotalCount(res.totalCount);
      } else {
        setStudents(prev => [...prev, ...res.students]);
      }
      setOffset(newOffset);
    } catch (e) {
      console.warn('[useDiscoverStudents] error loading students:', e);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [viewerId, viewerRole, viewerDept]);

  // Handle filter changes with cancel of in-flight requests
  useEffect(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    const timer = setTimeout(() => {
      loadData(true, 0);
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [viewerId, viewerRole, viewerDept, filter?.query, filter?.department, filter?.year, filter?.skill, loadData]);

  const loadMore = async () => {
    if (isLoadingMore || students.length >= totalCount) return;
    const nextOffset = offset + limit;
    await loadData(false, nextOffset);
  };

  const hasMore = students.length < totalCount;

  return {
    students,
    totalCount,
    isLoading,
    isLoadingMore,
    hasMore,
    loadMore,
    refetch: () => loadData(true, 0)
  };
}

export function useStudentInvitations(studentId?: string) {
  const [invitations, setInvitations] = useState<OutreachInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchInvitations = useCallback(async () => {
    if (!studentId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const list = await outreachApi.getStudentInvitations(studentId);
      setInvitations(list);
    } catch (e) {
      console.warn('[useStudentInvitations] error:', e);
    } finally {
      setIsLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    fetchInvitations();
  }, [fetchInvitations]);

  const respond = async (invitationId: string, action: 'accept' | 'decline' | 'block_report') => {
    if (!studentId) return;
    const res = await outreachApi.respondToInvitation(studentId, invitationId, action);
    if (res.success) {
      await fetchInvitations();
    }
    return res;
  };

  const pendingCount = invitations.filter(i => i.status === 'pending').length;

  return {
    invitations,
    pendingCount,
    isLoading,
    respond,
    refetch: fetchInvitations
  };
}

export function useSentInvitations(senderId?: string) {
  const [sentInvitations, setSentInvitations] = useState<OutreachInvitation[]>([]);
  const [remainingQuota, setRemainingQuota] = useState(5);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSent = useCallback(async () => {
    if (!senderId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const list = await outreachApi.getSentInvitations(senderId);
      setSentInvitations(list);
      // Calculate remaining quota in rolling 7 days
      const sevenDaysAgo = Date.now() - 7 * 86400000;
      const recentValidCount = list.filter(i => {
        const createdTime = new Date(i.createdAt).getTime();
        if (createdTime < sevenDaysAgo) return false;
        if (i.status === 'withdrawn' && i.respondedAt) {
          const respTime = new Date(i.respondedAt).getTime();
          if (respTime <= createdTime + 5 * 60 * 1000) return false;
        }
        return true;
      }).length;
      setRemainingQuota(Math.max(0, 5 - recentValidCount));
    } catch (e) {
      console.warn('[useSentInvitations] error:', e);
    } finally {
      setIsLoading(false);
    }
  }, [senderId]);

  useEffect(() => {
    fetchSent();
  }, [fetchSent]);

  const send = async (studentId: string, reason: string): Promise<SendInvitationResult> => {
    if (!senderId) return { success: false, remainingQuota: 0, error: 'Not authenticated.' };
    const res = await outreachApi.sendInvitation(senderId, studentId, reason);
    if (res.success) {
      await fetchSent();
    }
    return res;
  };

  const withdraw = async (invitationId: string) => {
    if (!senderId) return;
    const res = await outreachApi.withdrawInvitation(senderId, invitationId);
    if (res.success) {
      await fetchSent();
    }
    return res;
  };

  return {
    sentInvitations,
    remainingQuota,
    isLoading,
    send,
    withdraw,
    refetch: fetchSent
  };
}

export function useSuggestedStudents(viewerId?: string, viewerDept?: string) {
  const [suggested, setSuggested] = useState<SuggestedStudent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      if (!viewerId) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const list = await outreachApi.suggestStudents(viewerId, viewerDept || 'CMPN');
        if (isMounted) setSuggested(list);
      } catch (e) {
        console.warn('[useSuggestedStudents] error:', e);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    load();
    return () => { isMounted = false; };
  }, [viewerId, viewerDept]);

  return { suggested, isLoading };
}

export function useProfileViews(studentId?: string) {
  const [views, setViews] = useState<ProfileViewItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      if (!studentId) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const data = await outreachApi.getProfileViews(studentId);
        if (isMounted) setViews(data);
      } catch (e) {
        console.warn('[useProfileViews] error:', e);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    load();
    return () => { isMounted = false; };
  }, [studentId]);

  return { views, isLoading };
}

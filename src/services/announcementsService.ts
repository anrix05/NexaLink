import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { runQuery, runMutation } from './supabaseRunner';
import type { Announcement, UserRole } from '../types';
import { parseAnnouncementMeta, serializeAnnouncementContent } from '../components/common/InstitutionalAnnouncementFeed';
import { invalidateNoticesCache } from '../hooks/useNotices';

function isValidUuid(id?: string): boolean {
  if (!id) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
}

export function getDeletedAnnouncementIds(): Set<string> {
  try {
    const raw = localStorage.getItem('nexalink_deleted_announcement_ids');
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return new Set(arr);
    }
  } catch {}
  return new Set();
}

export function addDeletedAnnouncementId(id: string): void {
  try {
    const current = getDeletedAnnouncementIds();
    current.add(id);
    localStorage.setItem('nexalink_deleted_announcement_ids', JSON.stringify(Array.from(current)));
  } catch {}
  invalidateNoticesCache();
}

export function mapRowToAnnouncement(a: any): Announcement {
  const parsed = parseAnnouncementMeta(a.content || '');
  return {
    id: a.id,
    title: a.title,
    category: a.category,
    author: a.author,
    authorId: a.author_id || undefined,
    date: a.date,
    content: parsed.cleanContent,
    isImportant: Boolean(a.is_important),
    targetAudience: a.target_audience || 'All',
    isRetracted: Boolean(a.is_retracted),
    retractedAt: a.retracted_at || undefined,
    severity: (a.severity || parsed.meta?.severity || (a.is_important ? 'governance' : 'standard')) as any,
    isPinned: Boolean(a.is_pinned ?? parsed.meta?.isPinned),
    expiresAt: a.expires_at || parsed.meta?.expiresAt || undefined
  };
}

export const announcementsService = {
  /**
   * Fetch all unretracted announcements
   */
  async getAnnouncements(): Promise<Announcement[]> {
    const deletedIds = getDeletedAnnouncementIds();
    if (!isSupabaseConfigured()) {
      try {
        const cached = localStorage.getItem('nexalink_announcements_cache');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed)) return parsed.filter((a: any) => !deletedIds.has(a.id));
        }
      } catch {}
      return [];
    }

    try {
      const rows = await runQuery<any[]>(
        'announcements',
        async () => {
          return supabase
            .from('announcements')
            .select('*')
            .eq('is_retracted', false)
            .order('is_pinned', { ascending: false })
            .order('date', { ascending: false });
        },
        { suppressErrorReport: true }
      );

      return (rows || [])
        .map(mapRowToAnnouncement)
        .filter(a => !deletedIds.has(a.id) && !a.isRetracted);
    } catch {
      return [];
    }
  },

  /**
   * Fetch announcements tailored for a specific viewer role
   * Filters out retracted, expired, and non-targeted items
   * Ordered: pinned first, then important, then newest
   */
  async listForViewer(options: { role?: UserRole | string; limit?: number } = {}): Promise<Announcement[]> {
    const { role, limit = 50 } = options;
    const now = Date.now();

    const deletedIds = getDeletedAnnouncementIds();
    const filterAndSort = (list: Announcement[]): Announcement[] => {
      return list
        .filter(a => !a.isRetracted && !deletedIds.has(a.id))
        .filter(anc => {
          if (anc.expiresAt) {
            const expTime = new Date(anc.expiresAt).getTime();
            if (!isNaN(expTime) && expTime <= now) return false;
          }
          if (!role || role === 'admin') return true;
          const aud = (anc.targetAudience || 'All').toLowerCase().trim();
          if (aud === 'all' || aud === 'everyone') return true;
          if (role === 'student' && (aud === 'students' || aud === 'students only' || aud === 'student' || aud.includes('student'))) return true;
          if (role === 'alumni' && (aud === 'alumni' || aud === 'alumni only' || aud.includes('alumni'))) return true;
          if ((role === 'faculty' || role === 'teacher') && (aud === 'faculty' || aud === 'faculty only' || aud.includes('faculty') || aud.includes('teacher'))) return true;
          return false;
        })
        .sort((a, b) => {
          if (a.isPinned && !b.isPinned) return -1;
          if (!a.isPinned && b.isPinned) return 1;
          if (a.isImportant && !b.isImportant) return -1;
          if (!a.isImportant && b.isImportant) return 1;
          const timeA = new Date(a.date).getTime() || 0;
          const timeB = new Date(b.date).getTime() || 0;
          return timeB - timeA;
        })
        .slice(0, limit);
    };

    let items: Announcement[] = [];

    if (isSupabaseConfigured()) {
      try {
        const rows = await runQuery<any[]>(
          'announcements',
          async () => {
            const res = await supabase
              .from('announcements')
              .select('*')
              .eq('is_retracted', false)
              .order('date', { ascending: false })
              .limit(limit);
            if (res.error) {
              return supabase.from('announcements').select('*').eq('is_retracted', false).limit(limit);
            }
            return res;
          },
          { suppressErrorReport: true }
        );

        if (rows && rows.length > 0) {
          items = rows.map(mapRowToAnnouncement);
        }
      } catch {
        // Fallback to local cache below
      }
    }

    // Fallback to local announcements cache if Supabase returned nothing or is unconfigured
    if (items.length === 0) {
      try {
        const cached = localStorage.getItem('nexalink_announcements_cache');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed)) {
            items = parsed;
          }
        }
      } catch {}
    }

    return filterAndSort(items);
  },

  /**
   * Create an announcement
   */
  async createAnnouncement(
    anc: Omit<Announcement, 'id' | 'date'> & { id?: string; date?: string }
  ): Promise<Announcement> {
    const ancId = isValidUuid(anc.id)
      ? anc.id!
      : (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : undefined);

    // Mock fallback: if Supabase is unconfigured or user has a mock/demo ID (e.g. 'user-faculty-1'),
    // create and return the announcement locally without invoking Supabase REST mutations.
    const isMockUser = !isSupabaseConfigured() || (anc.authorId && !isValidUuid(anc.authorId));
    if (isMockUser) {
      invalidateNoticesCache();
      return {
        id: ancId || `mock-anc-${Date.now()}`,
        title: anc.title,
        category: anc.category,
        author: anc.author || 'Faculty Member',
        authorId: anc.authorId,
        date: anc.date || new Date().toISOString(),
        content: anc.content,
        isImportant: Boolean(anc.isImportant),
        targetAudience: anc.targetAudience || 'Students',
        isRetracted: false,
        severity: anc.severity || (anc.isImportant ? 'governance' : 'standard'),
        isPinned: false,
        expiresAt: anc.expiresAt
      };
    }

    // Client payload: DO NOT send author_id.
    // 1. The server sets author_id = auth.uid() automatically via the BEFORE INSERT trigger.
    // 2. Omitting author_id prevents PostgREST PGRST204 errors if the column is missing or schema cache is refreshing.
    const payload: any = {
      title: anc.title,
      category: anc.category,
      author: anc.author || 'Administrator',
      date: anc.date || new Date().toISOString(),
      content: anc.content,
      is_important: Boolean(anc.isImportant),
      target_audience: anc.targetAudience || 'All',
      severity: anc.severity || (anc.isImportant ? 'governance' : 'standard'),
      is_pinned: Boolean(anc.isPinned),
      expires_at: anc.expiresAt || null,
      is_retracted: false
    };

    if (ancId) {
      payload.id = ancId;
    }

    const row = await runMutation<any>(
      'INSERT',
      'announcements',
      async () => {
        const res = await supabase.from('announcements').insert(payload).select().single();
        if (
          res.error &&
          (res.error.code === 'PGRST204' ||
            res.error.code === '42703' ||
            res.error.message?.includes('schema cache') ||
            res.error.message?.includes('does not exist') ||
            res.error.message?.includes('expires_at') ||
            res.error.message?.includes('severity') ||
            res.error.message?.includes('is_pinned'))
        ) {
          const serializedContent = serializeAnnouncementContent(payload.content, {
            severity: payload.severity || 'standard',
            expiresAt: payload.expires_at || undefined,
            isPinned: Boolean(payload.is_pinned)
          });
          const fallbackPayload: any = {
            id: payload.id,
            title: payload.title,
            category: payload.category,
            author: payload.author,
            date: payload.date,
            content: serializedContent,
            is_important: payload.is_important,
            target_audience: payload.target_audience,
            is_retracted: payload.is_retracted
          };
          return supabase.from('announcements').insert(fallbackPayload).select().single();
        }
        return res;
      },
      { payload }
    );

    invalidateNoticesCache();
    return mapRowToAnnouncement(row);
  },

  /**
   * Update an announcement
   */
  async updateAnnouncement(
    id: string,
    updates: Partial<Omit<Announcement, 'id'>>
  ): Promise<Announcement> {
    const isMock = !isSupabaseConfigured() || !isValidUuid(id);
    if (isMock) {
      invalidateNoticesCache();
      return {
        id,
        title: updates.title || '',
        category: updates.category || 'General',
        author: updates.author || 'Faculty Member',
        authorId: updates.authorId,
        date: updates.date || new Date().toISOString(),
        content: updates.content || '',
        isImportant: Boolean(updates.isImportant),
        targetAudience: updates.targetAudience || 'Students',
        isRetracted: Boolean(updates.isRetracted),
        severity: updates.severity || (updates.isImportant ? 'governance' : 'standard'),
        isPinned: Boolean(updates.isPinned),
        expiresAt: updates.expiresAt
      };
    }

    const payload: any = {};
    if (updates.title !== undefined) payload.title = updates.title;
    if (updates.category !== undefined) payload.category = updates.category;
    if (updates.content !== undefined) payload.content = updates.content;
    if (updates.isImportant !== undefined) payload.is_important = Boolean(updates.isImportant);
    if (updates.targetAudience !== undefined) payload.target_audience = updates.targetAudience;
    if (updates.severity !== undefined) payload.severity = updates.severity;
    if (updates.isPinned !== undefined) payload.is_pinned = Boolean(updates.isPinned);
    if (updates.expiresAt !== undefined) payload.expires_at = updates.expiresAt || null;

    const row = await runMutation<any>(
      'UPDATE',
      'announcements',
      async () => {
        const res = await supabase.from('announcements').update(payload).eq('id', id).select().single();
        if (
          res.error &&
          (res.error.code === 'PGRST204' ||
            res.error.code === '42703' ||
            res.error.message?.includes('schema cache') ||
            res.error.message?.includes('does not exist') ||
            res.error.message?.includes('expires_at') ||
            res.error.message?.includes('severity') ||
            res.error.message?.includes('is_pinned'))
        ) {
          const coreUpdatePayload: any = {};
          if (payload.title !== undefined) coreUpdatePayload.title = payload.title;
          if (payload.category !== undefined) coreUpdatePayload.category = payload.category;
          if (payload.content !== undefined) {
            coreUpdatePayload.content = serializeAnnouncementContent(payload.content, {
              severity: payload.severity || 'standard',
              expiresAt: payload.expires_at || undefined,
              isPinned: Boolean(payload.is_pinned)
            });
          }
          if (payload.is_important !== undefined) coreUpdatePayload.is_important = payload.is_important;
          if (payload.target_audience !== undefined) coreUpdatePayload.target_audience = payload.target_audience;
          return supabase.from('announcements').update(coreUpdatePayload).eq('id', id).select().single();
        }
        return res;
      },
      { payload }
    );

    invalidateNoticesCache();
    return mapRowToAnnouncement(row);
  },

  /**
   * Retract an announcement (soft delete, always hide from viewer feeds immediately)
   */
  async retractAnnouncement(id: string): Promise<void> {
    addDeletedAnnouncementId(id);
    if (!isSupabaseConfigured()) {
      invalidateNoticesCache();
      return;
    }

    const payload = {
      is_retracted: true,
      retracted_at: new Date().toISOString()
    };

    try {
      await supabase.from('announcements').update(payload).eq('id', id);
    } catch (e) {
      console.warn('[announcementsService] Supabase retract error:', e);
    }
    invalidateNoticesCache();
  },

  /**
   * Delete an announcement (hard delete or fallback soft delete, immediate local cache eviction)
   */
  async deleteAnnouncement(id: string): Promise<void> {
    addDeletedAnnouncementId(id);
    if (!isSupabaseConfigured()) {
      invalidateNoticesCache();
      return;
    }

    try {
      const { error } = await supabase.from('announcements').delete().eq('id', id);
      if (error) {
        await supabase.from('announcements').update({
          is_retracted: true,
          retracted_at: new Date().toISOString()
        }).eq('id', id);
      }
    } catch (e) {
      console.warn('[announcementsService] Supabase delete error:', e);
    }
    invalidateNoticesCache();
  }
};

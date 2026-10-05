import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { runQuery, runMutation } from './supabaseRunner';
import type { Announcement } from '../types';

function isValidUuid(id?: string): boolean {
  if (!id) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
}

function mapRowToAnnouncement(a: any): Announcement {
  return {
    id: a.id,
    title: a.title,
    category: a.category,
    author: a.author,
    date: a.date,
    content: a.content,
    isImportant: a.is_important,
    targetAudience: a.target_audience,
    isRetracted: a.is_retracted || false,
    retractedAt: a.retracted_at || undefined,
    severity: (a.severity || (a.is_important ? 'governance' : 'standard')) as any,
    isPinned: a.is_pinned ?? false
  };
}

export const announcementsService = {
  /**
   * Fetch all unretracted announcements
   */
  async getAnnouncements(): Promise<Announcement[]> {
    if (!isSupabaseConfigured()) {
      return [];
    }

    const rows = await runQuery<any[]>('announcements', async () => {
      return supabase
        .from('announcements')
        .select('*')
        .eq('is_retracted', false)
        .order('date', { ascending: false });
    });

    return (rows || []).map(mapRowToAnnouncement);
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

    const payload: any = {
      title: anc.title,
      category: anc.category,
      author: anc.author,
      date: anc.date || new Date().toISOString(),
      content: anc.content,
      is_important: Boolean(anc.isImportant),
      target_audience: anc.targetAudience || 'All',
      is_retracted: false
    };

    if (ancId) {
      payload.id = ancId;
    }

    const row = await runMutation<any>(
      'INSERT',
      'announcements',
      async () => {
        return supabase.from('announcements').insert(payload).select().single();
      },
      { payload }
    );

    return mapRowToAnnouncement(row);
  },

  /**
   * Retract / delete an announcement
   */
  async retractAnnouncement(id: string): Promise<void> {
    const payload = {
      is_retracted: true,
      retracted_at: new Date().toISOString()
    };

    await runMutation<any>(
      'UPDATE',
      'announcements',
      async () => {
        return supabase.from('announcements').update(payload).eq('id', id).select().single();
      },
      { payload }
    );
  }
};

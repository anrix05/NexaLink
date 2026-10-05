import { supabase, isSupabaseConfigured } from '../lib/supabase.ts';
import { runQuery, runMutation } from './supabaseRunner.ts';
import type { NotificationItem, NotificationPreferences } from '../types';

function isValidUuid(id?: string): boolean {
  if (!id) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
}

export function mapRowToNotification(n: any): NotificationItem {
  return {
    id: n.id,
    user_id: n.user_id,
    title: n.title,
    body: n.body || n.message || '',
    category: n.category || 'general',
    type: n.type || 'System Alert',
    is_read: n.is_read || false,
    created_at: n.created_at || n.date || new Date().toISOString(),
    link: n.link || n.link_tab,
    related_entity_id: n.related_entity_id,
    dedupe_key: n.dedupe_key
  };
}

export const NOTIFICATIONS_PAGE_SIZE = 20;

export const notificationsService = {
  PAGE_SIZE: NOTIFICATIONS_PAGE_SIZE,

  /**
   * Fetch lightweight unread count for navbar badge
   */
  async getUnreadCount(userId: string): Promise<number> {
    if (!isSupabaseConfigured() || !isValidUuid(userId)) return 0;
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);
      if (error) return 0;
      return count || 0;
    } catch {
      return 0;
    }
  },

  /**
   * Fetch paginated notifications with constant PAGE_SIZE = 20
   */
  async getNotificationsPaginated(
    userId: string,
    options: { page?: number; pageSize?: number; unreadOnly?: boolean; category?: string } = {}
  ): Promise<{ items: NotificationItem[]; totalCount: number; hasMore: boolean }> {
    const page = Math.max(1, options.page || 1);
    const pageSize = options.pageSize || NOTIFICATIONS_PAGE_SIZE;
    const offset = (page - 1) * pageSize;

    if (!isSupabaseConfigured() || !isValidUuid(userId)) {
      return { items: [], totalCount: 0, hasMore: false };
    }

    try {
      let query = supabase
        .from('notifications')
        .select('*', { count: 'exact' })
        .eq('user_id', userId);

      if (options.unreadOnly) {
        query = query.eq('is_read', false);
      }

      if (options.category && options.category !== 'all') {
        query = (query as any).eq('type', options.category);
      }

      query = (query as any)
        .order('date', { ascending: false })
        .range(offset, offset + pageSize - 1);

      const { data, count, error } = await query;
      if (error) throw error;

      const items = (data || []).map(mapRowToNotification);
      const totalCount = count || items.length;

      return {
        items,
        totalCount,
        hasMore: offset + items.length < totalCount
      };
    } catch {
      return { items: [], totalCount: 0, hasMore: false };
    }
  },

  /**
   * Fetch notifications for a user, ordered newest first (top 20)
   */
  async getNotifications(userId: string): Promise<NotificationItem[]> {
    if (!isSupabaseConfigured() || !isValidUuid(userId)) {
      return [];
    }

    const rows = await runQuery<any[]>('notifications', async () => {
      return supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);
    });

    return (rows || []).map(mapRowToNotification);
  },

  /**
   * Mark a single notification as read
   */
  async markRead(id: string): Promise<void> {
    if (!isSupabaseConfigured() || !isValidUuid(id)) return;

    await runMutation<any>(
      'UPDATE',
      'notifications',
      async () => {
        return supabase.from('notifications').update({ is_read: true }).eq('id', id).select().single();
      },
      { allowEmptyResult: true }
    );
  },

  /**
   * Mark all notifications as read for a user
   */
  async markAllRead(userId: string): Promise<void> {
    if (!isSupabaseConfigured() || !isValidUuid(userId)) return;

    await runMutation<any>(
      'UPDATE',
      'notifications',
      async () => {
        return supabase.from('notifications').update({ is_read: true }).eq('user_id', userId);
      },
      { allowEmptyResult: true }
    );
  },

  /**
   * Get notification preferences for category muting
   */
  async getPreferences(userId: string): Promise<NotificationPreferences> {
    const defaultPrefs: NotificationPreferences = {
      user_id: userId,
      mute_opportunities: false,
      mute_events: false,
      mute_announcements: false
    };

    if (!isSupabaseConfigured() || !isValidUuid(userId)) {
      return defaultPrefs;
    }

    try {
      const rows = await runQuery<any[]>('notification_preferences', async () => {
        return (supabase as any)
          .from('notification_preferences')
          .select('*')
          .eq('user_id', userId)
          .limit(1);
      });

      if (rows && rows.length > 0) {
        const r = rows[0];
        return {
          user_id: r.user_id,
          mute_opportunities: Boolean(r.mute_opportunities),
          mute_events: Boolean(r.mute_events),
          mute_announcements: Boolean(r.mute_announcements),
          updated_at: r.updated_at
        };
      }
    } catch (e) {
      console.warn('[notificationsService] Could not fetch preferences, using defaults:', e);
    }

    return defaultPrefs;
  },

  /**
   * Update notification preferences
   */
  async updatePreferences(
    userId: string,
    prefs: Partial<Omit<NotificationPreferences, 'user_id'>>
  ): Promise<NotificationPreferences> {
    const defaultPrefs: NotificationPreferences = {
      user_id: userId,
      mute_opportunities: false,
      mute_events: false,
      mute_announcements: false
    };

    if (!isSupabaseConfigured() || !isValidUuid(userId)) {
      return { ...defaultPrefs, ...prefs };
    }

    const payload = {
      user_id: userId,
      ...prefs,
      updated_at: new Date().toISOString()
    };

    const row = await runMutation<any>(
      'UPSERT',
      'notification_preferences',
      async () => {
        return (supabase as any)
          .from('notification_preferences')
          .upsert(payload)
          .select()
          .single();
      },
      { payload }
    );

    return {
      user_id: row?.user_id || userId,
      mute_opportunities: Boolean(row?.mute_opportunities),
      mute_events: Boolean(row?.mute_events),
      mute_announcements: Boolean(row?.mute_announcements),
      updated_at: row?.updated_at
    };
  },

  /**
   * Create an in-app notification for a user
   */
  async createNotification(notification: {
    userId: string;
    title: string;
    body: string;
    category?: string;
    type?: string;
    link?: string;
    relatedEntityId?: string;
  }): Promise<void> {
    if (!isSupabaseConfigured() || !isValidUuid(notification.userId)) return;
    const payload = {
      user_id: notification.userId,
      title: notification.title,
      body: notification.body,
      category: notification.category || 'opportunity',
      type: notification.type || 'Application Update',
      link: notification.link || 'opportunities',
      related_entity_id: notification.relatedEntityId || null,
      is_read: false,
      created_at: new Date().toISOString()
    };
    await runMutation('INSERT', 'notifications', async () => {
      return (supabase.from as any)('notifications').insert(payload);
    }, { payload, allowEmptyResult: true });
  }
};

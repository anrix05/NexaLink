import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { runQuery, runMutation } from './supabaseRunner';
import type { AuditLogEntry } from '../types';

function isValidUuid(id?: string): boolean {
  if (!id) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
}

export const AUDIT_PAGE_SIZE = 20;

export interface AuditLogPaginationParams {
  limit?: number;
  cursor?: string; // timestamp ISO string for keyset cursor
  direction?: 'next' | 'prev';
  search?: string;
  category?: 'All' | 'User Events' | 'Governance' | 'System';
}

export interface PaginatedAuditLogsResult {
  items: AuditLogEntry[];
  totalCount: number;
  nextCursor?: string;
  prevCursor?: string;
  hasMore: boolean;
}

export function filterAuditLogsInMemory(
  logs: AuditLogEntry[],
  search?: string,
  category?: string
): AuditLogEntry[] {
  return logs.filter(log => {
    if (search && search.trim()) {
      const q = search.toLowerCase();
      const match =
        log.action.toLowerCase().includes(q) ||
        log.performedBy.toLowerCase().includes(q) ||
        log.details.toLowerCase().includes(q);
      if (!match) return false;
    }

    if (category === 'User Events') {
      return log.action.includes('USER') || log.action.includes('CRITICAL');
    }
    if (category === 'Governance') {
      return log.action.includes('ROLE') || log.action.includes('ADMIN') || log.action.includes('GRADUATION');
    }
    if (category === 'System') {
      return log.action.includes('SYSTEM') || log.action.includes('ANNOUNCEMENT');
    }
    return true;
  });
}

export function mapRowToAuditLog(r: any): AuditLogEntry {
  return {
    id: r.id,
    action: r.action,
    performedBy: r.performed_by,
    targetUserOrItem: r.target_user_or_item || undefined,
    timestamp: r.timestamp || r.created_at || new Date().toISOString(),
    details: r.details || '',
    isBulkAction: r.is_bulk_action || false,
    bulkMetadata: r.bulk_metadata || undefined
  };
}

export const auditService = {
  PAGE_SIZE: AUDIT_PAGE_SIZE,

  /**
   * Fetch paginated audit logs using keyset cursor pagination on timestamp
   */
  async getAuditLogs(
    params: AuditLogPaginationParams = {},
    fallbackLogs: AuditLogEntry[] = []
  ): Promise<PaginatedAuditLogsResult> {
    const limit = params.limit || AUDIT_PAGE_SIZE;

    if (!isSupabaseConfigured()) {
      const filtered = filterAuditLogsInMemory(fallbackLogs, params.search, params.category);
      const totalCount = filtered.length;

      let startIndex = 0;
      if (params.cursor) {
        const cursorIdx = filtered.findIndex(l => l.timestamp === params.cursor);
        if (cursorIdx !== -1) {
          startIndex = params.direction === 'prev' ? Math.max(0, cursorIdx - limit) : cursorIdx + 1;
        }
      }

      const items = filtered.slice(startIndex, startIndex + limit);
      const nextCursor = items.length > 0 ? items[items.length - 1].timestamp : undefined;
      const prevCursor = startIndex > 0 ? items[0].timestamp : undefined;
      const hasMore = startIndex + items.length < totalCount;

      return {
        items,
        totalCount,
        nextCursor,
        prevCursor,
        hasMore
      };
    }

    try {
      let query = supabase
        .from('audit_logs')
        .select('*', { count: 'exact' });

      // Apply keyset cursor
      if (params.cursor) {
        if (params.direction === 'prev') {
          query = query.gt('timestamp', params.cursor);
        } else {
          query = query.lt('timestamp', params.cursor);
        }
      }

      query = query.order('timestamp', { ascending: params.direction === 'prev' }).limit(limit);

      const { data, count, error } = await query;
      if (error) throw error;

      let items = (data || []).map(mapRowToAuditLog);
      if (params.direction === 'prev') {
        items = items.reverse();
      }

      const totalCount = count || items.length;
      const nextCursor = items.length > 0 ? items[items.length - 1].timestamp : undefined;
      const prevCursor = items.length > 0 ? items[0].timestamp : undefined;
      const hasMore = items.length === limit;

      return {
        items,
        totalCount,
        nextCursor,
        prevCursor,
        hasMore
      };
    } catch {
      // In-memory fallback
      const filtered = filterAuditLogsInMemory(fallbackLogs, params.search, params.category);
      const items = filtered.slice(0, limit);
      return {
        items,
        totalCount: filtered.length,
        nextCursor: items.length > 0 ? items[items.length - 1].timestamp : undefined,
        hasMore: items.length < filtered.length
      };
    }
  },

  /**
   * Log an immutable audit entry
   */
  async appendLog(entry: AuditLogEntry): Promise<void> {
    if (!isSupabaseConfigured()) return;
    try {
      const logId = isValidUuid(entry.id)
        ? entry.id
        : (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : undefined);

      const payload: any = {
        action: entry.action,
        performed_by: entry.performedBy,
        target_user_or_item: entry.targetUserOrItem || null,
        timestamp: entry.timestamp,
        details: entry.details,
        is_bulk_action: entry.isBulkAction || false,
        bulk_metadata: entry.bulkMetadata || null
      };

      if (logId) {
        payload.id = logId;
      }

      await runMutation('INSERT', 'audit_logs', async () => {
        return supabase.from('audit_logs').insert(payload);
      }, { payload });
    } catch (e) {
      console.error('[auditService.appendLog] failed:', e);
    }
  }
};

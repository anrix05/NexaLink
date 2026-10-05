import type { NotificationItem } from '../types';

/**
 * Format timestamp into human-readable relative time string
 */
export function formatRelativeTime(dateStr?: string): string {
  if (!dateStr) return 'Just now';

  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'Recently';

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSec < 60) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return 'Recently';
  }
}

/**
 * Group notifications into "Today" and "Earlier"
 */
export function groupNotificationsByDate(items: NotificationItem[]): {
  today: NotificationItem[];
  earlier: NotificationItem[];
} {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  const today: NotificationItem[] = [];
  const earlier: NotificationItem[] = [];

  for (const item of items) {
    const itemTime = new Date(item.created_at).getTime();
    if (!isNaN(itemTime) && itemTime >= startOfToday) {
      today.push(item);
    } else {
      earlier.push(item);
    }
  }

  return { today, earlier };
}

/**
 * Format unread badge text with 99+ cap
 */
export function capUnreadCount(count: number): string {
  if (count <= 0) return '0';
  if (count > 99) return '99+';
  return String(count);
}

/**
 * Deduplicate notification items by id and dedupe_key
 */
export function deduplicateNotifications(items: NotificationItem[]): NotificationItem[] {
  const seenIds = new Set<string>();
  const seenDedupeKeys = new Set<string>();
  const result: NotificationItem[] = [];

  for (const item of items) {
    if (item.id && seenIds.has(item.id)) continue;
    if (item.dedupe_key && seenDedupeKeys.has(item.dedupe_key)) continue;

    if (item.id) seenIds.add(item.id);
    if (item.dedupe_key) seenDedupeKeys.add(item.dedupe_key);
    result.push(item);
  }

  return result;
}

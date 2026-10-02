/**
 * NexaLink Messaging v2 - Outbox & Offline Text Resilience
 * Persists pending and failed text messages in localStorage with exponential backoff retry.
 */

export interface OutboxEntry {
  clientMessageId: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  content: string;
  replyToId?: string | null;
  timestamp: string;
  retryCount: number;
  lastAttemptAt: number;
  status: 'pending' | 'failed';
  errorReason?: string;
}

const OUTBOX_STORAGE_KEY = 'nexalink:messaging:outbox:v2';

export class OutboxManager {
  private static loadEntries(): OutboxEntry[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(OUTBOX_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private static saveEntries(entries: OutboxEntry[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(OUTBOX_STORAGE_KEY, JSON.stringify(entries));
    } catch {
      // Storage full or unavailable
    }
  }

  public static add(entry: Omit<OutboxEntry, 'retryCount' | 'lastAttemptAt' | 'status'>): void {
    const entries = this.loadEntries();
    // Prevent duplicate entries
    const filtered = entries.filter(e => e.clientMessageId !== entry.clientMessageId);
    filtered.push({
      ...entry,
      retryCount: 0,
      lastAttemptAt: Date.now(),
      status: 'pending'
    });
    this.saveEntries(filtered);
  }

  public static remove(clientMessageId: string): void {
    const entries = this.loadEntries();
    const updated = entries.filter(e => e.clientMessageId !== clientMessageId);
    this.saveEntries(updated);
  }

  public static markFailed(clientMessageId: string, errorReason: string): void {
    const entries = this.loadEntries();
    const target = entries.find(e => e.clientMessageId === clientMessageId);
    if (target) {
      target.status = 'failed';
      target.errorReason = errorReason;
      target.retryCount += 1;
      target.lastAttemptAt = Date.now();
      this.saveEntries(entries);
    }
  }

  public static getPending(): OutboxEntry[] {
    const entries = this.loadEntries();
    return entries.filter(e => e.status === 'pending');
  }

  public static getAll(): OutboxEntry[] {
    return this.loadEntries();
  }
}

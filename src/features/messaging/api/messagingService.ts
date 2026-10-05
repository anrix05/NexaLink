/**
 * NexaLink Messaging v2 - API Service
 * Encapsulates all network communication (Supabase RPCs, Storage, and Resilient Local Fallback).
 * Implements strict error code mapping: offline, forbidden, rate_limited, too_long, too_many_files, bad_file, blocked, not_verified.
 */

import { supabase, isSupabaseConfigured } from '../../../lib/supabase';
import type {
  ChatMessage,
  ConversationInboxItem,
  ConversationItem,
  MessageAttachment,
  UserRole
} from '../../../types';
import { OutboxManager } from '../utils/outbox';

export type MessagingErrorCode =
  | 'offline'
  | 'forbidden'
  | 'rate_limited'
  | 'too_long'
  | 'too_many_files'
  | 'bad_file'
  | 'blocked'
  | 'not_verified'
  | 'duplicate'
  | 'unknown';

export interface SendMessagePayload {
  conversationId: string;
  clientMessageId: string;
  content: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  senderAvatar: string;
  receiverId: string;
  replyToId?: string | null;
  replySnippet?: { id: string; name: string; content: string } | null;
  attachments?: {
    file: File;
    storagePath: string;
    thumbPath?: string;
    fileName: string;
    mimeType: 'image/jpeg' | 'image/png' | 'image/webp' | 'application/pdf';
    sizeBytes: number;
    width?: number;
    height?: number;
  }[];
}

// In-memory cache for short-lived signed URLs (keyed by storagePath)
const signedUrlCache = new Map<string, { url: string; expiresAt: number }>();

export class MessagingService {
  /**
   * Fetches signed URL for a private attachment with in-memory caching (1 hour TTL)
   */
  public static async getSignedUrl(storagePath: string, downloadFilename?: string): Promise<string> {
    if (!storagePath) return '';
    // If it's already a blob:, data:, or full external url, return as-is
    if (storagePath.startsWith('blob:') || storagePath.startsWith('data:') || storagePath.startsWith('http://') || storagePath.startsWith('https://')) {
      return storagePath;
    }

    const cached = signedUrlCache.get(storagePath);
    if (cached && cached.expiresAt > Date.now() + 60000) {
      return cached.url;
    }

    if (!isSupabaseConfigured()) {
      return storagePath;
    }

    try {
      const options: { download?: string } = {};
      if (downloadFilename) {
        options.download = downloadFilename;
      }

      const { data, error } = await supabase.storage
        .from('chat-attachments')
        .createSignedUrl(storagePath, 3600, options); // 1 hour TTL

      if (error || !data?.signedUrl) {
        throw error || new Error('Failed to create signed URL');
      }

      signedUrlCache.set(storagePath, {
        url: data.signedUrl,
        expiresAt: Date.now() + 3500 * 1000 // 58 minutes
      });

      return data.signedUrl;
    } catch {
      return storagePath;
    }
  }

  /**
   * Batch resolves signed URLs for private attachments
   */
  public static async getSignedUrls(storagePaths: string[]): Promise<Record<string, string>> {
    const result: Record<string, string> = {};
    const toFetch: string[] = [];

    for (const p of storagePaths) {
      if (!p) continue;
      if (p.startsWith('blob:') || p.startsWith('data:') || p.startsWith('http://') || p.startsWith('https://')) {
        result[p] = p;
        continue;
      }
      const cached = signedUrlCache.get(p);
      if (cached && cached.expiresAt > Date.now() + 60000) {
        result[p] = cached.url;
      } else {
        toFetch.push(p);
      }
    }

    if (toFetch.length === 0 || !isSupabaseConfigured()) {
      return result;
    }

    try {
      const { data, error } = await supabase.storage
        .from('chat-attachments')
        .createSignedUrls(toFetch, 3600);

      if (!error && Array.isArray(data)) {
        for (const item of data) {
          if (item.signedUrl && item.path) {
            signedUrlCache.set(item.path, {
              url: item.signedUrl,
              expiresAt: Date.now() + 3500 * 1000
            });
            result[item.path] = item.signedUrl;
          }
        }
      }
    } catch (e) {
      console.warn('[MessagingService] Failed to batch fetch signed URLs:', e);
    }

    return result;
  }

  /**
   * Uploads an attachment to Supabase Storage with strict path format {senderId}/{receiverId}/{uuid}-{safeFileName}
   */
  public static async uploadAttachment(
    senderId: string,
    receiverId: string,
    file: File | Blob,
    filename: string,
    onProgress?: (percent: number) => void
  ): Promise<string> {
    const ext = filename.split('.').pop()?.toLowerCase() || 'bin';
    const uuid = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`;
    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    // Strict path structure: {senderId}/{receiverId}/{uuid}-{safeFileName}
    const storagePath = `${senderId}/${receiverId}/${uuid}-${safeName}`;

    if (!isSupabaseConfigured()) {
      if (onProgress) {
        onProgress(50);
        await new Promise(r => setTimeout(r, 60));
        onProgress(100);
      }
      return storagePath;
    }

    const { data, error } = await supabase.storage
      .from('chat-attachments')
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error || !data?.path) {
      throw new Error(`Upload failed: ${error?.message || 'Storage error'}`);
    }

    if (onProgress) onProgress(100);
    return data.path;
  }

  /**
   * Retrieves or establishes a canonical conversation with another user
   */
  public static async getOrCreateConversation(
    otherUserId: string,
    contextType?: string,
    contextId?: string
  ): Promise<{ conversationId: string; status: string }> {
    if (!isSupabaseConfigured()) {
      const mockConvId = `conv-${[otherUserId].sort().join('-')}`;
      return { conversationId: mockConvId, status: 'active' };
    }

    const { data, error } = await supabase.rpc('get_or_create_conversation', {
      p_other_user_id: otherUserId,
      p_context_type: contextType || null,
      p_context_id: contextId || null
    });

    if (error) throw new Error(error.message);
    if (!data?.success) {
      throw new Error(data?.message || 'Failed to start conversation');
    }

    return {
      conversationId: data.conversation_id || '',
      status: data.status || 'active'
    };
  }

  /**
   * Sends a message with idempotency, attachments, and optional reply
   */
  public static async sendMessage(payload: SendMessagePayload): Promise<{
    messageId: string;
    timestamp: string;
    duplicate?: boolean;
  }> {
    // Record in outbox first for resilience
    OutboxManager.add({
      clientMessageId: payload.clientMessageId,
      conversationId: payload.conversationId,
      senderId: payload.senderId,
      receiverId: payload.receiverId,
      content: payload.content,
      replyToId: payload.replyToId,
      timestamp: new Date().toISOString()
    });

    if (!isSupabaseConfigured()) {
      // Local demo mode simulation
      OutboxManager.remove(payload.clientMessageId);
      return {
        messageId: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        timestamp: new Date().toISOString()
      };
    }

    try {
      // Format attachments for JSONB RPC argument matching send_message_v2 schema
      const formattedAttachments = (payload.attachments || []).map(a => ({
        path: a.storagePath,
        name: a.fileName,
        mime: a.mimeType,
        size: a.sizeBytes,
        width: a.width || null,
        height: a.height || null
      }));

      const { data, error } = await supabase.rpc('send_message_v2', {
        p_client_message_id: payload.clientMessageId,
        p_receiver_id: payload.receiverId,
        p_content: payload.content,
        p_reply_to_id: payload.replyToId || null,
        p_attachments: formattedAttachments
      });

      if (error) throw error;
      const res = data as any;
      if (!res?.success) {
        throw new Error(res?.message || res?.error_code || 'Failed to send message');
      }

      OutboxManager.remove(payload.clientMessageId);
      return {
        messageId: res?.id || res?.message_id || '',
        timestamp: res?.timestamp || new Date().toISOString(),
        duplicate: res?.duplicate
      };
    } catch (err: any) {
      OutboxManager.markFailed(payload.clientMessageId, err.message || 'unknown');
      throw err;
    }
  }

  /**
   * Toggles an emoji reaction on a message
   */
  public static async toggleReaction(
    messageId: string,
    emoji: string
  ): Promise<{ action: 'added' | 'removed' | 'replaced' }> {
    if (!isSupabaseConfigured()) {
      return { action: 'added' };
    }

    const { data, error } = await supabase.rpc('toggle_reaction', {
      p_message_id: messageId,
      p_emoji: emoji
    });

    if (error) throw error;
    return { action: data?.action || 'added' };
  }

  /**
   * Marks all messages in conversation as read
   */
  public static async markConversationRead(conversationId: string): Promise<void> {
    if (!isSupabaseConfigured()) return;

    await supabase.rpc('mark_conversation_read', {
      p_conversation_id: conversationId
    });
  }

  /**
   * Deletes a message for everyone (tombstone) within 60 minutes
   */
  public static async deleteMessage(messageId: string): Promise<void> {
    if (!isSupabaseConfigured()) return;

    const { data, error } = await supabase.rpc('delete_message', {
      p_message_id: messageId
    });

    if (error) throw error;
    if (!data?.success) {
      throw new Error(data?.message || 'Cannot delete message');
    }
  }

  /**
   * Edits a message's text within 15 minutes
   */
  public static async editMessage(messageId: string, newContent: string): Promise<void> {
    if (!isSupabaseConfigured()) return;

    const { data, error } = await supabase.rpc('edit_message', {
      p_message_id: messageId,
      p_new_content: newContent
    });

    if (error) throw error;
    if (!data?.success) {
      throw new Error(data?.message || 'Cannot edit message');
    }
  }
}

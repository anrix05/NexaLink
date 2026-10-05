import { supabase, isSupabaseConfigured } from '../lib/supabase.ts';
import { runQuery, runMutation, runRpc, RpcNotFoundError } from './supabaseRunner.ts';
import type { ChatMessage, UserRole, MentorshipGuidancePurpose, MessageAttachment, ReplySnippet } from '../types';

function isValidUuid(id?: string): boolean {
  if (!id) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
}

export function mapRowToChatMessage(m: any, existingAttachments?: MessageAttachment[]): ChatMessage {
  let mappedAttachments: MessageAttachment[] | undefined = undefined;

  const rawAttachments = m.attachments || (m.raw && m.raw.attachments);
  if (Array.isArray(rawAttachments) && rawAttachments.length > 0) {
    mappedAttachments = rawAttachments.map((att: any, idx: number) => {
      const storagePath = att.path || att.storage_path || att.storagePath || '';
      const existing = existingAttachments?.find(
        ea => (storagePath && ea.storagePath === storagePath) || ea.fileName === (att.name || att.file_name)
      );

      return {
        id: att.id || `${m.id}-att-${idx}`,
        messageId: m.id,
        conversationId: m.receiver_id,
        uploaderId: m.sender_id,
        storagePath,
        fileName: att.name || att.file_name || 'attachment',
        mimeType: att.mime || att.mime_type || att.mimeType || 'application/octet-stream',
        sizeBytes: att.size || att.size_bytes || att.sizeBytes || 0,
        width: att.width,
        height: att.height,
        scanStatus: 'ok',
        // Preserve local preview URL (blob:) if existing, or keep existing signedUrl
        signedUrl: existing?.signedUrl || att.signedUrl || undefined
      };
    });
  } else if (existingAttachments && existingAttachments.length > 0) {
    mappedAttachments = existingAttachments;
  }

  return {
    id: m.id,
    clientMessageId: m.client_message_id || undefined,
    senderId: m.sender_id,
    senderName: m.sender_name,
    senderRole: m.sender_role as UserRole,
    senderAvatar: m.sender_avatar,
    receiverId: m.receiver_id,
    content: m.content || '',
    timestamp: m.timestamp,
    isRead: m.is_read || false,
    category: m.category as MentorshipGuidancePurpose || undefined,
    attachmentName: m.attachment_name || (mappedAttachments?.[0]?.fileName) || undefined,
    attachmentUrl: m.attachment_url || undefined,
    attachments: mappedAttachments,
    reactions: m.reactions || [],
    isReported: m.is_reported || false,
    reportReason: m.report_reason || undefined,
    replyToId: m.reply_to_id || undefined,
    replyTo: m.reply_to || undefined,
    editedAt: m.edited_at || undefined,
    deletedAt: m.deleted_at || undefined,
    status: 'delivered'
  };
}

export const messagingService = {
  /**
   * Fetch all messages for current user
   */
  async getMessages(userId: string): Promise<ChatMessage[]> {
    if (!isSupabaseConfigured() || !isValidUuid(userId)) {
      return [];
    }

    const rows = await runQuery<any[]>('chat_messages', async () => {
      return supabase
        .from('chat_messages')
        .select('*')
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .order('timestamp', { ascending: true });
    });

    return (rows || []).map(r => mapRowToChatMessage(r));
  },

  /**
   * Fetch all reported messages for admin moderation
   */
  async getReportedMessages(): Promise<ChatMessage[]> {
    if (!isSupabaseConfigured()) {
      return [];
    }

    const rows = await runQuery<any[]>('chat_messages', async () => {
      return supabase
        .from('chat_messages')
        .select('*')
        .eq('is_reported', true)
        .order('reported_at', { ascending: false });
    });

    return (rows || []).map(r => mapRowToChatMessage(r));
  },

  /**
   * Send a message via send_message_v2 with graceful fallback to direct insertion
   */
  async sendMessage(params: {
    senderId: string;
    senderName: string;
    senderRole: UserRole;
    senderAvatar: string;
    receiverId: string;
    content: string;
    category?: MentorshipGuidancePurpose;
    attachmentName?: string;
    attachmentUrl?: string;
    clientMessageId?: string;
    attachments?: MessageAttachment[];
    replyTo?: ReplySnippet;
    replyToId?: string | null;
    voiceNoteUrl?: string;
    voiceNoteDuration?: number;
  }): Promise<ChatMessage> {
    const msgId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : undefined;
    const clientMsgId = params.clientMessageId && isValidUuid(params.clientMessageId)
      ? params.clientMessageId
      : (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : msgId || '00000000-0000-4000-8000-000000000000');

    // Format attachments for send_message_v2 RPC: array of { path, name, mime, size, width?, height? }
    const rpcAttachments = (params.attachments || []).map(a => ({
      path: a.storagePath,
      name: a.fileName,
      mime: a.mimeType,
      size: a.sizeBytes,
      width: a.width || null,
      height: a.height || null
    }));

    const replyTargetId = params.replyToId || (params.replyTo?.id && isValidUuid(params.replyTo.id) ? params.replyTo.id : null);

    // Try send_message_v2 RPC first
    try {
      const rpcResult = await runRpc<any>('send_message_v2', async () => {
        return (supabase.rpc as any)('send_message_v2', {
          p_client_message_id: clientMsgId,
          p_receiver_id: params.receiverId,
          p_content: params.content || '',
          p_attachments: rpcAttachments,
          p_reply_to_id: replyTargetId
        });
      }, { receiverId: params.receiverId });

      if (rpcResult && (rpcResult.id || rpcResult.client_message_id || rpcResult.success)) {
        return mapRowToChatMessage(rpcResult, params.attachments);
      }
    } catch (rpcErr) {
      if (!(rpcErr instanceof RpcNotFoundError)) {
        console.warn('[messagingService] RPC send_message_v2 failed, attempting direct insert fallback:', rpcErr);
      }
    }

    // Direct insert fallback into chat_messages
    const basePayload: any = {
      sender_id: params.senderId,
      sender_name: params.senderName || 'Active User',
      sender_role: params.senderRole || 'student',
      sender_avatar: params.senderAvatar || '',
      receiver_id: params.receiverId,
      content: params.content || '',
      attachments: rpcAttachments,
      reply_to_id: replyTargetId,
      timestamp: new Date().toISOString(),
      is_read: false,
      category: params.category || null,
      attachment_name: params.attachmentName || (params.attachments?.[0]?.fileName) || null,
      attachment_url: params.attachmentUrl || null,
      is_reported: false,
      client_message_id: clientMsgId
    };

    if (msgId) {
      basePayload.id = msgId;
    }

    const row = await runMutation<any>(
      'INSERT',
      'chat_messages',
      async () => {
        return supabase.from('chat_messages').insert(basePayload).select().single();
      },
      { payload: basePayload }
    );

    return mapRowToChatMessage(row, params.attachments);
  },

  /**
   * Mark all unread messages from a contact as read
   */
  async markThreadRead(currentUserId: string, contactId: string): Promise<void> {
    if (!isValidUuid(currentUserId) || !isValidUuid(contactId)) return;

    // Try mark_conversation_read RPC first
    try {
      await runRpc<any>('mark_conversation_read', async () => {
        return (supabase.rpc as any)('mark_conversation_read', { p_conversation_id: contactId });
      });
      return;
    } catch {
      // Fallback to direct mutation
    }

    await runMutation<any>(
      'UPDATE',
      'chat_messages',
      async () => {
        return supabase
          .from('chat_messages')
          .update({ is_read: true })
          .eq('receiver_id', currentUserId)
          .eq('sender_id', contactId)
          .eq('is_read', false);
      },
      { allowEmptyResult: true }
    );
  },

  /**
   * Edit message content within 15-minute window (server-enforced)
   */
  async editMessage(messageId: string, newContent: string): Promise<void> {
    if (!isValidUuid(messageId)) return;

    try {
      const res = await runRpc<any>('edit_message', async () => {
        return (supabase.rpc as any)('edit_message', {
          p_message_id: messageId,
          p_new_content: newContent
        });
      });
      if (res && res.success === false) {
        throw new Error(res.message || 'Cannot edit message');
      }
      return;
    } catch (rpcErr: any) {
      if (rpcErr?.rawError?.code === '42501' || rpcErr?.message?.includes('15 minutes')) {
        throw rpcErr;
      }
      // Fallback to direct UPDATE if RPC not yet created
      await runMutation<any>(
        'UPDATE',
        'chat_messages',
        async () => {
          return supabase
            .from('chat_messages')
            .update({ content: newContent, edited_at: new Date().toISOString() } as any)
            .eq('id', messageId)
            .select()
            .single();
        }
      );
    }
  },

  /**
   * Delete message for everyone within 60-minute window (server-enforced)
   */
  async deleteMessage(messageId: string): Promise<void> {
    if (!isValidUuid(messageId)) return;

    try {
      const res = await runRpc<any>('delete_message', async () => {
        return (supabase.rpc as any)('delete_message', {
          p_message_id: messageId
        });
      });
      if (res && res.success === false) {
        throw new Error(res.message || 'Cannot delete message');
      }
      return;
    } catch (rpcErr: any) {
      if (rpcErr?.rawError?.code === '42501' || rpcErr?.message?.includes('60 minutes')) {
        throw rpcErr;
      }
      // Fallback to direct tombstone UPDATE if RPC not yet created
      await runMutation<any>(
        'UPDATE',
        'chat_messages',
        async () => {
          return supabase
            .from('chat_messages')
            .update({
              content: 'This message was deleted',
              deleted_at: new Date().toISOString(),
              is_deleted: true,
              attachment_name: null,
              attachment_url: null,
              reactions: []
            } as any)
            .eq('id', messageId)
            .select()
            .single();
        }
      );
    }
  },

  /**
   * Toggle emoji reaction on message (1-per-user policy)
   */
  async toggleReaction(messageId: string, emoji: string, userId: string, userName?: string): Promise<void> {
    if (!isValidUuid(messageId)) return;

    try {
      await runRpc<any>('toggle_reaction', async () => {
        return (supabase.rpc as any)('toggle_reaction', {
          p_message_id: messageId,
          p_emoji: emoji
        });
      });
    } catch (rpcErr: any) {
      // Fallback to reading and updating reactions array
      const row = await runQuery<any>('chat_messages', async () => {
        return supabase.from('chat_messages').select('reactions').eq('id', messageId).single();
      });

      const existingReactions = (row?.reactions || []) as any[];
      const filtered = existingReactions.filter(r => r.userId !== userId);
      const hadSame = existingReactions.some(r => r.userId === userId && r.emoji === emoji);

      const nextReactions = hadSame
        ? filtered
        : [...filtered, { emoji, userId, userName: userName || 'User' }];

      await runMutation<any>(
        'UPDATE',
        'chat_messages',
        async () => {
          return supabase
            .from('chat_messages')
            .update({ reactions: nextReactions })
            .eq('id', messageId)
            .select()
            .single();
        }
      );
    }
  }
};

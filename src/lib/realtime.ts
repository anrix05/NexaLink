import { supabase, isSupabaseConfigured } from './supabase';
import type { ChatMessage } from '../types';

export type MessageChangeCallback = (message: ChatMessage) => void;

/**
 * Subscribes to realtime insertions on the chat_messages table
 */
export const subscribeToChatMessages = (
  userId: string,
  onNewMessage: MessageChangeCallback
) => {
  if (!isSupabaseConfigured()) {
    // In local demo mode, messages are pushed directly via state
    return {
      unsubscribe: () => {}
    };
  }

  const channel = supabase
    .channel(`public:chat_messages:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages'
      },
      (payload) => {
        const row = payload.new as any;
        if (row.sender_id === userId || row.receiver_id === userId) {
          const msg: ChatMessage = {
            id: row.id,
            senderId: row.sender_id,
            senderName: row.sender_name,
            senderRole: row.sender_role,
            senderAvatar: row.sender_avatar,
            receiverId: row.receiver_id,
            content: row.content,
            timestamp: row.timestamp ? new Date(row.timestamp).toISOString().replace('T', ' ').substring(0, 16) : new Date().toISOString(),
            isRead: row.is_read ?? false,
            category: row.category,
            attachmentName: row.attachment_name,
            attachmentUrl: row.attachment_url,
            isReported: row.is_reported,
            reportedAt: row.reported_at,
            reportedBy: row.reported_by,
            reportReason: row.report_reason,
            moderationStatus: row.moderation_status,
            moderatedBy: row.moderated_by,
            moderatedAt: row.moderated_at
          };
          onNewMessage(msg);
        }
      }
    )
    .subscribe();

  return {
    unsubscribe: () => {
      supabase.removeChannel(channel);
    }
  };
};

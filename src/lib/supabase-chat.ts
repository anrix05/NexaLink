import { supabase } from './supabase';

export const uploadChatAttachmentToStorage = async (file: File | Blob, pathPrefix: string): Promise<string> => {
  const fileName = `${pathPrefix}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  const { data, error } = await supabase.storage
    .from('chat-attachments')
    .upload(fileName, file, { cacheControl: '3600', upsert: false });

  if (error) throw error;
  
  const { data: { publicUrl } } = supabase.storage
    .from('chat-attachments')
    .getPublicUrl(data.path);
    
  return publicUrl;
};

export const fetchAllUserMessages = async (userId: string) => {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    .order('timestamp', { ascending: true });

  if (error) throw error;
  return data;
};

export const fetchReportedMessages = async () => {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('is_reported', true)
    .order('reported_at', { ascending: false });

  if (error) throw error;
  return data;
};

export const markThreadAsReadInDB = async (currentUserId: string, contactId: string) => {
  const { error } = await supabase
    .from('chat_messages')
    .update({ is_read: true })
    .eq('receiver_id', currentUserId)
    .eq('sender_id', contactId)
    .eq('is_read', false);

  if (error) throw error;
};

export const fetchStarredConversations = async (userId: string) => {
  const { data, error } = await supabase
    .from('starred_conversations')
    .select('contact_id')
    .eq('user_id', userId);

  if (error) throw error;
  return data.map(d => d.contact_id);
};

export const toggleStarredConversationInDB = async (userId: string, contactId: string, isCurrentlyStarred: boolean) => {
  if (isCurrentlyStarred) {
    const { error } = await supabase
      .from('starred_conversations')
      .delete()
      .match({ user_id: userId, contact_id: contactId });
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('starred_conversations')
      .insert({ user_id: userId, contact_id: contactId });
    if (error) throw error;
  }
};

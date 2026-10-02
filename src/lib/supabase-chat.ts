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
  const isValidUUID = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
  if (!isValidUUID(userId)) return [];
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
  const isValidUUID = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
  if (!isValidUUID(currentUserId) || !isValidUUID(contactId)) return;
  const { error } = await supabase
    .from('chat_messages')
    .update({ is_read: true })
    .eq('receiver_id', currentUserId)
    .eq('sender_id', contactId)
    .eq('is_read', false);

  if (error) throw error;
};

export const fetchStarredConversations = async (userId: string) => {
  const isValidUUID = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
  if (!isValidUUID(userId)) return [];
  try {
    const { data, error } = await supabase
      .from('conversation_participants')
      .select('contact_id')
      .eq('user_id', userId)
      .eq('is_starred', true);
    if (error) return [];
    return (data || []).map(d => d.contact_id);
  } catch {
    return [];
  }
};

export const toggleStarredConversationInDB = async (userId: string, contactId: string, isCurrentlyStarred: boolean) => {
  const isValidUUID = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
  if (!isValidUUID(userId) || !isValidUUID(contactId)) return;
  try {
    await supabase
      .from('conversation_participants')
      .upsert({
        user_id: userId,
        contact_id: contactId,
        is_starred: !isCurrentlyStarred,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id,contact_id' });
  } catch (err) {
    console.warn('[toggleStarredConversationInDB error]', err);
  }
};

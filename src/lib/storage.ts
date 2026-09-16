import { supabase, isSupabaseConfigured } from './supabase';

export interface StorageUploadResult {
  path: string;
  url: string;
  error?: string;
}

/**
 * Sanitizes file name for secure cloud storage keys
 */
const sanitizeFilename = (name: string): string => {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').toLowerCase();
};

/**
 * Upload an identity or admit card proof document to private 'proof-documents' bucket
 */
export const uploadProofDocument = async (
  file: File,
  userId: string
): Promise<StorageUploadResult> => {
  if (!isSupabaseConfigured()) {
    // Resilient local demo fallback
    return {
      path: `local/${file.name}`,
      url: URL.createObjectURL(file)
    };
  }

  try {
    const cleanName = sanitizeFilename(file.name);
    const filePath = `${userId}/${Date.now()}_${cleanName}`;

    const { error: uploadError } = await supabase.storage
      .from('proof-documents')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) {
      console.warn('[Storage] Upload to proof-documents bucket failed:', uploadError.message);
      return { path: filePath, url: URL.createObjectURL(file), error: uploadError.message };
    }

    // Generate signed URL with 24-hour validity for verification review
    const { data: signedData, error: signError } = await supabase.storage
      .from('proof-documents')
      .createSignedUrl(filePath, 60 * 60 * 24);

    const publicUrl = signedData?.signedUrl || URL.createObjectURL(file);
    return { path: filePath, url: publicUrl, error: signError?.message };
  } catch (err: any) {
    return { path: file.name, url: URL.createObjectURL(file), error: err.message };
  }
};

/**
 * Upload a resume PDF to private 'resumes' bucket
 */
export const uploadResume = async (
  file: File,
  userId: string
): Promise<StorageUploadResult> => {
  if (!isSupabaseConfigured()) {
    return { path: `local/${file.name}`, url: URL.createObjectURL(file) };
  }

  try {
    const cleanName = sanitizeFilename(file.name);
    const filePath = `${userId}/${Date.now()}_${cleanName}`;

    const { error: uploadError } = await supabase.storage
      .from('resumes')
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      return { path: filePath, url: URL.createObjectURL(file), error: uploadError.message };
    }

    const { data: signedData } = await supabase.storage
      .from('resumes')
      .createSignedUrl(filePath, 60 * 60 * 24);

    return { path: filePath, url: signedData?.signedUrl || URL.createObjectURL(file) };
  } catch (err: any) {
    return { path: file.name, url: URL.createObjectURL(file), error: err.message };
  }
};

/**
 * Upload a chat attachment to private 'chat-attachments' bucket
 */
export const uploadChatAttachment = async (
  file: File,
  senderId: string
): Promise<StorageUploadResult> => {
  if (!isSupabaseConfigured()) {
    return { path: `local/${file.name}`, url: URL.createObjectURL(file) };
  }

  try {
    const cleanName = sanitizeFilename(file.name);
    const filePath = `${senderId}/${Date.now()}_${cleanName}`;

    const { error: uploadError } = await supabase.storage
      .from('chat-attachments')
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      return { path: filePath, url: URL.createObjectURL(file), error: uploadError.message };
    }

    const { data: signedData } = await supabase.storage
      .from('chat-attachments')
      .createSignedUrl(filePath, 60 * 60 * 24 * 7); // 7-day signed link

    return { path: filePath, url: signedData?.signedUrl || URL.createObjectURL(file) };
  } catch (err: any) {
    return { path: file.name, url: URL.createObjectURL(file), error: err.message };
  }
};

/**
 * Upload a user avatar to public 'avatars' bucket
 */
export const uploadAvatar = async (
  file: File,
  userId: string
): Promise<StorageUploadResult> => {
  if (!isSupabaseConfigured()) {
    return { path: `local/${file.name}`, url: URL.createObjectURL(file) };
  }

  try {
    const cleanName = sanitizeFilename(file.name);
    const filePath = `${userId}/${Date.now()}_${cleanName}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      return { path: filePath, url: URL.createObjectURL(file), error: uploadError.message };
    }

    const { data: publicData } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    return { path: filePath, url: publicData.publicUrl };
  } catch (err: any) {
    return { path: file.name, url: URL.createObjectURL(file), error: err.message };
  }
};

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
 * Client-side image compression using HTML5 Canvas
 */
const compressImage = async (file: File, maxWidth = 1600, maxHeight = 1600, quality = 0.8): Promise<File> => {
  if (!file.type.startsWith('image/') || file.type === 'image/svg+xml' || file.type === 'image/gif') return file;
  
  return new Promise((resolve) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(file);
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const newName = file.name.replace(/\.[^/.]+$/, "") + ".jpg";
            const compressedFile = new File([blob], newName, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          } else {
            resolve(file);
          }
        },
        'image/jpeg',
        quality
      );
    };
    img.onerror = () => resolve(file);
  });
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
    const compressedFile = await compressImage(file, 2048, 2048, 0.85); // High quality for proofs
    const cleanName = sanitizeFilename(compressedFile.name);
    const filePath = `${userId}/${Date.now()}_${cleanName}`;

    const { error: uploadError } = await supabase.storage
      .from('proof-documents')
      .upload(filePath, compressedFile, {
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
    const compressedFile = await compressImage(file, 1600, 1600, 0.8);
    const cleanName = sanitizeFilename(compressedFile.name);
    const filePath = `${senderId}/${Date.now()}_${cleanName}`;

    const { error: uploadError } = await supabase.storage
      .from('chat-attachments')
      .upload(filePath, compressedFile, { upsert: true });

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
    const compressedFile = await compressImage(file, 400, 400, 0.85); // Small size for avatars
    const cleanName = sanitizeFilename(compressedFile.name);
    const filePath = `${userId}/${Date.now()}_${cleanName}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, compressedFile, { upsert: true });

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

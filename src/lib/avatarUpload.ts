import { supabase, isSupabaseConfigured } from './supabase';
import { profileService } from '../services/profileService';
import type { UserRole } from '../types';

export interface Area {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  width?: number;
  height?: number;
}

export const MAX_AVATAR_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
export const MIN_AVATAR_DIMENSION = 200; // 200px
export const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * Validates file type, size, and minimum dimensions.
 */
export async function validateAvatarFile(file: File): Promise<ValidationResult> {
  // 1. Type validation
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'Please choose a JPG, PNG or WebP image.',
    };
  }

  // 2. Size validation
  if (file.size > MAX_AVATAR_FILE_SIZE) {
    return {
      valid: false,
      error: 'Image is too large (max 5 MB).',
    };
  }

  // 3. Dimensions validation
  try {
    const dimensions = await getImageDimensions(file);
    if (dimensions.width < MIN_AVATAR_DIMENSION || dimensions.height < MIN_AVATAR_DIMENSION) {
      return {
        valid: false,
        error: 'Image is too small (min 200 x 200 px).',
        width: dimensions.width,
        height: dimensions.height,
      };
    }
    return {
      valid: true,
      width: dimensions.width,
      height: dimensions.height,
    };
  } catch {
    return {
      valid: false,
      error: 'Could not read image. Please ensure the file is not corrupted.',
    };
  }
}

/**
 * Reads image dimensions with EXIF orientation awareness.
 */
export async function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  if (typeof createImageBitmap !== 'undefined') {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
      const width = bitmap.width;
      const height = bitmap.height;
      bitmap.close();
      return { width, height };
    } catch {
      // fallback to Image element below
    }
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth || img.width, height: img.naturalHeight || img.height });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image for dimensions check'));
    };
    img.src = url;
  });
}

/**
 * Loads an image from a URL with crossOrigin support.
 */
export function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });
}

/**
 * Generates a 512x512 cropped and rotated image Blob from image source and crop coordinates.
 */
export async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area,
  rotation = 0,
  targetSize = 512
): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Canvas 2D context is not available');
  }

  // 1. Create a bounding canvas to handle full image rotation
  const rotRad = (rotation * Math.PI) / 180;
  const { width: bBoxWidth, height: bBoxHeight } = calculateRotatedSize(
    image.naturalWidth || image.width,
    image.naturalHeight || image.height,
    rotation
  );

  const rotCanvas = document.createElement('canvas');
  rotCanvas.width = bBoxWidth;
  rotCanvas.height = bBoxHeight;
  const rotCtx = rotCanvas.getContext('2d');

  if (!rotCtx) {
    throw new Error('Rotated canvas context not available');
  }

  rotCtx.translate(bBoxWidth / 2, bBoxHeight / 2);
  rotCtx.rotate(rotRad);
  rotCtx.drawImage(
    image,
    -(image.naturalWidth || image.width) / 2,
    -(image.naturalHeight || image.height) / 2
  );

  // 2. Set final output canvas to 512x512 with high quality smoothing
  canvas.width = targetSize;
  canvas.height = targetSize;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // 3. Draw the cropped section scaled to targetSize x targetSize
  ctx.drawImage(
    rotCanvas,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    targetSize,
    targetSize
  );

  // 4. Export as WebP quality 0.9 (with fallback to JPEG quality 0.9)
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          // WebP not supported or failed, fallback to JPEG
          canvas.toBlob(
            (jpegBlob) => {
              if (jpegBlob) resolve(jpegBlob);
              else reject(new Error('Failed to create cropped image blob'));
            },
            'image/jpeg',
            0.9
          );
        }
      },
      'image/webp',
      0.9
    );
  });
}

function calculateRotatedSize(width: number, height: number, rotation: number) {
  const rotRad = (rotation * Math.PI) / 180;
  return {
    width: Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
    height: Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
  };
}

/**
 * Extracts storage path from a full URL or relative path if belonging to avatars bucket.
 */
export function extractStoragePath(urlOrPath: string, bucket = 'avatars'): string | null {
  if (!urlOrPath) return null;
  const trimmed = urlOrPath.trim();
  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) return null;

  try {
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      const parsed = new URL(trimmed);
      const parts = parsed.pathname.split(`/${bucket}/`);
      if (parts.length > 1) {
        return decodeURIComponent(parts[1].split('?')[0]);
      }
    }
  } catch {
    // ignore
  }

  const clean = trimmed.replace(new RegExp(`^${bucket}/`), '').split('?')[0];
  if (clean.includes('/')) {
    return clean;
  }
  return null;
}

export interface SaveAvatarResult {
  success: boolean;
  avatarUrl: string | null;
  error?: string;
}

/**
 * Uploads cropped avatar blob to Supabase Storage and updates the user's profile.
 * Cleans up previous avatar file on success, or removes newly uploaded file if database update fails.
 */
export async function uploadAndSaveAvatar(
  blob: Blob,
  userId: string,
  userRole: UserRole,
  oldAvatarUrl?: string | null
): Promise<SaveAvatarResult> {
  const filename = `avatar-${Date.now()}.webp`;
  const filePath = `${userId}/${filename}`;

  if (!isSupabaseConfigured()) {
    const localUrl = URL.createObjectURL(blob);
    return {
      success: true,
      avatarUrl: localUrl,
    };
  }

  // 1. Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, blob, {
      contentType: 'image/webp',
      cacheControl: '3600',
      upsert: true,
    });

  if (uploadError) {
    return {
      success: false,
      avatarUrl: null,
      error: uploadError.message || 'Storage upload failed.',
    };
  }

  const { data: publicData } = supabase.storage.from('avatars').getPublicUrl(filePath);
  const newAvatarUrl = publicData.publicUrl;

  // 2. Update profiles / users table in database
  try {
    const saveRes = await profileService.saveProfile(userId, userRole, {
      avatar: newAvatarUrl,
    });

    if (!saveRes.success) {
      // Rollback newly uploaded file to avoid orphaned storage object
      await supabase.storage.from('avatars').remove([filePath]);
      return {
        success: false,
        avatarUrl: null,
        error: saveRes.error || 'Failed to update user profile with new avatar.',
      };
    }

    // 3. Delete old avatar file from storage (best-effort)
    if (oldAvatarUrl) {
      const oldPath = extractStoragePath(oldAvatarUrl, 'avatars');
      if (oldPath && oldPath !== filePath) {
        supabase.storage
          .from('avatars')
          .remove([oldPath])
          .catch((delErr) => {
            console.warn('[Storage] Best-effort delete of previous avatar failed:', delErr);
          });
      }
    }

    return {
      success: true,
      avatarUrl: newAvatarUrl,
    };
  } catch (err: any) {
    // Rollback uploaded file
    await supabase.storage.from('avatars').remove([filePath]).catch(() => {});
    return {
      success: false,
      avatarUrl: null,
      error: err.message || 'Unexpected error while saving avatar profile.',
    };
  }
}

/**
 * Removes user avatar from database and deletes storage file.
 */
export async function removeAvatar(
  userId: string,
  userRole: UserRole,
  currentAvatarUrl?: string | null
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { success: true };
  }

  try {
    const saveRes = await profileService.saveProfile(userId, userRole, {
      avatar: null,
    });

    if (!saveRes.success) {
      return {
        success: false,
        error: saveRes.error || 'Failed to remove avatar from profile.',
      };
    }

    if (currentAvatarUrl) {
      const oldPath = extractStoragePath(currentAvatarUrl, 'avatars');
      if (oldPath) {
        supabase.storage
          .from('avatars')
          .remove([oldPath])
          .catch((delErr) => {
            console.warn('[Storage] Delete of removed avatar file failed:', delErr);
          });
      }
    }

    return { success: true };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Unexpected error while removing avatar.',
    };
  }
}

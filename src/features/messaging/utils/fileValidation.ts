/**
 * NexaLink Messaging v2 - File Validation & Magic-Byte Sniffing
 * Strictly validates image and PDF uploads for security and integrity.
 */

export interface FileValidationResult {
  valid: boolean;
  mimeType?: 'image/jpeg' | 'image/png' | 'image/webp' | 'application/pdf';
  error?: string;
}

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
export const MAX_FILES_PER_MESSAGE = 5;

/**
 * Sniffs the magic bytes of a file slice to verify actual content type
 */
export async function sniffMagicBytes(file: File): Promise<string | null> {
  const slice = file.slice(0, 16);
  const buffer = await slice.arrayBuffer();
  const bytes = new Uint8Array(buffer);

  if (bytes.length < 4) return null;

  // JPEG: FF D8 FF
  if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
    return 'image/jpeg';
  }

  // PNG: 89 50 4E 47
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) {
    return 'image/png';
  }

  // PDF: %PDF- (25 50 44 46 2D)
  if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) {
    return 'application/pdf';
  }

  // WebP: RIFF ... WEBP
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 && // RIFF
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50  // WEBP
  ) {
    return 'image/webp';
  }

  return null;
}

/**
 * Validates file size, extension, MIME type, and magic bytes
 */
export async function validateChatAttachment(file: File): Promise<FileValidationResult> {
  const ext = file.name.split('.').pop()?.toLowerCase() || '';

  // Friendly check for videos
  if (
    file.type.startsWith('video/') ||
    ['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext)
  ) {
    return {
      valid: false,
      error: "Videos aren't supported. Share a link instead."
    };
  }

  // Friendly check for SVGs (Security protection against stored XSS)
  if (file.type.includes('svg') || ext === 'svg') {
    return {
      valid: false,
      error: 'SVG files are not permitted for security reasons. Please use PNG or JPG.'
    };
  }

  // Friendly check for archives and executables
  if (['zip', 'rar', 'tar', 'gz', 'exe', 'bat', 'sh', 'docx', 'xlsx'].includes(ext)) {
    return {
      valid: false,
      error: `Files of type .${ext} are not supported. Only images (PNG, JPG, WebP) and PDF documents are allowed.`
    };
  }

  // Size limit check (10MB)
  if (file.size > MAX_FILE_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `File is too large (${sizeMb} MB). Maximum allowed size is 10 MB.`
    };
  }

  if (file.size === 0) {
    return {
      valid: false,
      error: 'The selected file is empty.'
    };
  }

  // Magic byte verification
  const detectedMime = await sniffMagicBytes(file);
  if (!detectedMime) {
    return {
      valid: false,
      error: 'File format mismatch. Only genuine PNG, JPG, WebP, or PDF files are supported.'
    };
  }

  return {
    valid: true,
    mimeType: detectedMime as 'image/jpeg' | 'image/png' | 'image/webp' | 'application/pdf'
  };
}

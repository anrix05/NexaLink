/**
 * NexaLink Messaging v2 - Client-Side Image Processor
 * - Downscales high-resolution images to long-edge <= 2048px
 * - Strips EXIF/geolocation metadata via canvas re-encoding
 * - Generates crisp 480px thumbnails for high-performance lazy loading
 * - Preserves intrinsic width and height for Zero CLS (Cumulative Layout Shift)
 */

export interface ProcessedImageResult {
  processedBlob: Blob;
  thumbBlob: Blob;
  width: number;
  height: number;
  thumbWidth: number;
  thumbHeight: number;
}

export async function processChatImage(
  file: File,
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp'
): Promise<ProcessedImageResult> {
  let sourceBitmap: ImageBitmap | HTMLImageElement;

  try {
    sourceBitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    // Fallback using standard Image element
    sourceBitmap = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      img.onerror = (e) => {
        URL.revokeObjectURL(url);
        reject(e);
      };
      img.src = url;
    });
  }

  const origWidth = sourceBitmap.width;
  const origHeight = sourceBitmap.height;

  // 1. Calculate main image dimensions (long edge <= 2048px)
  let targetWidth = origWidth;
  let targetHeight = origHeight;
  const maxLongEdge = 2048;

  if (Math.max(origWidth, origHeight) > maxLongEdge) {
    if (origWidth >= origHeight) {
      targetWidth = maxLongEdge;
      targetHeight = Math.round((origHeight * maxLongEdge) / origWidth);
    } else {
      targetHeight = maxLongEdge;
      targetWidth = Math.round((origWidth * maxLongEdge) / origHeight);
    }
  }

  // Render to canvas (strips EXIF metadata)
  const mainCanvas = document.createElement('canvas');
  mainCanvas.width = targetWidth;
  mainCanvas.height = targetHeight;
  const mainCtx = mainCanvas.getContext('2d');
  if (!mainCtx) throw new Error('Could not get canvas context');
  mainCtx.drawImage(sourceBitmap, 0, 0, targetWidth, targetHeight);

  // Encode main image (quality 0.85 for JPEG/WebP)
  const mainMime = mimeType === 'image/png' ? 'image/png' : 'image/jpeg';
  const processedBlob = await new Promise<Blob>((resolve, reject) => {
    mainCanvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to encode main image'));
      },
      mainMime,
      0.85
    );
  });

  // 2. Calculate thumbnail dimensions (long edge <= 480px)
  const maxThumbEdge = 480;
  let thumbWidth = origWidth;
  let thumbHeight = origHeight;

  if (Math.max(origWidth, origHeight) > maxThumbEdge) {
    if (origWidth >= origHeight) {
      thumbWidth = maxThumbEdge;
      thumbHeight = Math.round((origHeight * maxThumbEdge) / origWidth);
    } else {
      thumbHeight = maxThumbEdge;
      thumbWidth = Math.round((origWidth * maxThumbEdge) / origHeight);
    }
  }

  const thumbCanvas = document.createElement('canvas');
  thumbCanvas.width = thumbWidth;
  thumbCanvas.height = thumbHeight;
  const thumbCtx = thumbCanvas.getContext('2d');
  if (!thumbCtx) throw new Error('Could not get canvas context for thumbnail');
  thumbCtx.drawImage(sourceBitmap, 0, 0, thumbWidth, thumbHeight);

  const thumbBlob = await new Promise<Blob>((resolve, reject) => {
    thumbCanvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to encode thumbnail'));
      },
      'image/jpeg',
      0.75
    );
  });

  // Cleanup ImageBitmap if applicable
  if ('close' in sourceBitmap && typeof sourceBitmap.close === 'function') {
    sourceBitmap.close();
  }

  return {
    processedBlob,
    thumbBlob,
    width: targetWidth,
    height: targetHeight,
    thumbWidth,
    thumbHeight
  };
}

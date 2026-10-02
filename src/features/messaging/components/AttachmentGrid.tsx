/**
 * NexaLink Messaging v2 - Responsive Attachment Image Grid
 * - Supports 1 to 5 images per message
 * - Space reserved via aspect ratio (Zero CLS)
 * - 12px rounded corners, crisp thumbnails with lazy high-res preview
 * - Triggers Lightbox on click
 */

import React, { useState } from 'react';
import type { MessageAttachment } from '../../../types';
import { LightboxModal, type LightboxImageItem } from './LightboxModal';

interface AttachmentGridProps {
  attachments: MessageAttachment[];
  isMe: boolean;
}

export const AttachmentGrid: React.FC<AttachmentGridProps> = ({ attachments, isMe }) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const imageAttachments = attachments.filter((a) => a.mimeType.startsWith('image/'));
  if (imageAttachments.length === 0) return null;

  const count = imageAttachments.length;

  const lightboxImages: LightboxImageItem[] = imageAttachments.map((a) => ({
    url: a.signedUrl || a.storagePath,
    fileName: a.fileName,
    width: a.width,
    height: a.height
  }));

  const openLightbox = (index: number) => {
    setSelectedIndex(index);
    setLightboxOpen(true);
  };

  // Determine grid layout
  // 1 image: standalone card max 320x360
  // 2 images: 2 columns
  // 3 images: 1 large on top or left, 2 smaller
  // 4+ images: 2x2 grid with +n badge
  return (
    <>
      <div className={`mt-1.5 flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
        {count === 1 && (
          <div
            onClick={() => openLightbox(0)}
            className="relative max-w-[320px] max-h-[360px] rounded-xl overflow-hidden border border-[#E5E7EB] bg-neutral-100 cursor-pointer group shadow-2xs transition-transform active:scale-[0.99]"
            style={{
              aspectRatio:
                imageAttachments[0].width && imageAttachments[0].height
                  ? `${imageAttachments[0].width} / ${imageAttachments[0].height}`
                  : '4 / 3'
            }}
          >
            <img
              src={imageAttachments[0].signedUrl || imageAttachments[0].storagePath}
              alt={imageAttachments[0].fileName}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          </div>
        )}

        {count === 2 && (
          <div className="grid grid-cols-2 gap-1.5 max-w-[340px]">
            {imageAttachments.slice(0, 2).map((att, idx) => (
              <div
                key={att.id || idx}
                onClick={() => openLightbox(idx)}
                className="aspect-square rounded-xl overflow-hidden border border-[#E5E7EB] bg-neutral-100 cursor-pointer group shadow-2xs"
              >
                <img
                  src={att.signedUrl || att.storagePath}
                  alt={att.fileName}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        )}

        {count === 3 && (
          <div className="grid grid-cols-2 gap-1.5 max-w-[340px]">
            <div
              onClick={() => openLightbox(0)}
              className="col-span-2 aspect-video rounded-xl overflow-hidden border border-[#E5E7EB] bg-neutral-100 cursor-pointer group shadow-2xs"
            >
              <img
                src={imageAttachments[0].signedUrl || imageAttachments[0].storagePath}
                alt={imageAttachments[0].fileName}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
            </div>
            {imageAttachments.slice(1, 3).map((att, idx) => (
              <div
                key={att.id || idx + 1}
                onClick={() => openLightbox(idx + 1)}
                className="aspect-square rounded-xl overflow-hidden border border-[#E5E7EB] bg-neutral-100 cursor-pointer group shadow-2xs"
              >
                <img
                  src={att.signedUrl || att.storagePath}
                  alt={att.fileName}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        )}

        {count >= 4 && (
          <div className="grid grid-cols-2 gap-1.5 max-w-[340px]">
            {imageAttachments.slice(0, 4).map((att, idx) => {
              const isFourthWithMore = idx === 3 && count > 4;
              return (
                <div
                  key={att.id || idx}
                  onClick={() => openLightbox(idx)}
                  className="aspect-square rounded-xl overflow-hidden border border-[#E5E7EB] bg-neutral-100 cursor-pointer relative group shadow-2xs"
                >
                  <img
                    src={att.signedUrl || att.storagePath}
                    alt={att.fileName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  {isFourthWithMore && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-2xs flex items-center justify-center text-white font-bold text-base">
                      +{count - 3}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <LightboxModal
        images={lightboxImages}
        initialIndex={selectedIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </>
  );
};

/**
 * NexaLink Messaging v2 - Responsive Attachment Image Grid
 * - Supports 1 to 5 images per message
 * - Space reserved via aspect ratio (Zero CLS)
 * - 12px rounded corners, crisp thumbnails with lazy high-res preview
 * - Triggers Lightbox on click
 */

import React, { useState, useEffect } from 'react';
import type { MessageAttachment } from '../../../types';
import { LightboxModal, type LightboxImageItem } from './LightboxModal';
import { MessagingService } from '../api/messagingService';

interface AttachmentGridProps {
  attachments: MessageAttachment[];
  isMe: boolean;
}

export const AttachmentImage: React.FC<{
  attachment: MessageAttachment;
  className?: string;
  alt: string;
}> = ({ attachment, className, alt }) => {
  const [src, setSrc] = useState<string>(() => {
    if (
      attachment.signedUrl &&
      (attachment.signedUrl.startsWith('blob:') ||
        attachment.signedUrl.startsWith('http://') ||
        attachment.signedUrl.startsWith('https://') ||
        attachment.signedUrl.startsWith('data:'))
    ) {
      return attachment.signedUrl;
    }
    return '';
  });

  useEffect(() => {
    if (
      attachment.signedUrl &&
      (attachment.signedUrl.startsWith('blob:') ||
        attachment.signedUrl.startsWith('http://') ||
        attachment.signedUrl.startsWith('https://') ||
        attachment.signedUrl.startsWith('data:'))
    ) {
      setSrc(attachment.signedUrl);
      return;
    }

    if (!attachment.storagePath) return;

    let active = true;
    MessagingService.getSignedUrl(attachment.storagePath).then((url) => {
      if (active && url) {
        setSrc(url);
      }
    });

    return () => {
      active = false;
    };
  }, [attachment.storagePath, attachment.signedUrl]);

  if (!src) {
    return (
      <div className="w-full h-full bg-neutral-100 flex items-center justify-center text-[10px] text-neutral-400">
        Loading...
      </div>
    );
  }

  return <img src={src} alt={alt} className={className} loading="lazy" />;
};

export const AttachmentGrid: React.FC<AttachmentGridProps> = ({ attachments, isMe }) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [resolvedLightboxImages, setResolvedLightboxImages] = useState<LightboxImageItem[]>([]);

  const imageAttachments = attachments.filter((a) => a.mimeType.startsWith('image/'));
  if (imageAttachments.length === 0) return null;

  const count = imageAttachments.length;

  const openLightbox = async (index: number) => {
    const resolved: LightboxImageItem[] = await Promise.all(
      imageAttachments.map(async (a) => {
        let url = a.signedUrl;
        if (!url || (!url.startsWith('blob:') && !url.startsWith('http') && !url.startsWith('data:'))) {
          url = await MessagingService.getSignedUrl(a.storagePath);
        }
        return {
          url: url || a.storagePath,
          fileName: a.fileName,
          width: a.width,
          height: a.height
        };
      })
    );
    setResolvedLightboxImages(resolved);
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
            <AttachmentImage
              attachment={imageAttachments[0]}
              alt={imageAttachments[0].fileName}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
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
                <AttachmentImage
                  attachment={att}
                  alt={att.fileName}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
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
              <AttachmentImage
                attachment={imageAttachments[0]}
                alt={imageAttachments[0].fileName}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            {imageAttachments.slice(1, 3).map((att, idx) => (
              <div
                key={att.id || idx + 1}
                onClick={() => openLightbox(idx + 1)}
                className="aspect-square rounded-xl overflow-hidden border border-[#E5E7EB] bg-neutral-100 cursor-pointer group shadow-2xs"
              >
                <AttachmentImage
                  attachment={att}
                  alt={att.fileName}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
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
                  <AttachmentImage
                    attachment={att}
                    alt={att.fileName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
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
        images={resolvedLightboxImages.length > 0 ? resolvedLightboxImages : imageAttachments.map(a => ({
          url: a.signedUrl || a.storagePath,
          fileName: a.fileName,
          width: a.width,
          height: a.height
        }))}
        initialIndex={selectedIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </>
  );
};

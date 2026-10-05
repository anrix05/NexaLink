/**
 * NexaLink Messaging v2 - Composer Attachment Tray
 * Displays pending/uploading attachments with progress, thumbnail, cancel, and retry.
 */

import React from 'react';
import { X, FileText, RefreshCw, AlertCircle } from 'lucide-react';

export interface PendingAttachmentItem {
  id: string;
  file: File;
  name: string;
  sizeStr: string;
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp' | 'application/pdf';
  previewUrl?: string;
  storagePath?: string;
  width?: number;
  height?: number;
  progress: number;
  status: 'validating' | 'processing' | 'uploading' | 'ready' | 'error';
  error?: string;
}

interface ComposerAttachmentTrayProps {
  items: PendingAttachmentItem[];
  onRemove: (id: string) => void;
  onRetry: (id: string) => void;
}

export const ComposerAttachmentTray: React.FC<ComposerAttachmentTrayProps> = ({
  items,
  onRemove,
  onRetry
}) => {
  if (items.length === 0) return null;

  return (
    <div className="p-2 border-b border-[#E5E7EB] bg-[#FAFAFA] flex items-center gap-2 overflow-x-auto custom-scrollbar">
      {items.map((item) => {
        const isPdf = item.mimeType === 'application/pdf';
        const isError = item.status === 'error';
        const isUploading = item.status === 'uploading' || item.status === 'processing';

        return (
          <div
            key={item.id}
            className={`flex items-center gap-2 p-1.5 pr-2 rounded-xl border bg-white shadow-2xs shrink-0 max-w-[220px] transition-all ${
              isError
                ? 'border-rose-300 bg-rose-50/50'
                : 'border-[#E5E7EB]'
            }`}
          >
            {/* Thumbnail or PDF icon */}
            <div className="w-9 h-9 rounded-lg overflow-hidden bg-neutral-100 border border-[#E5E7EB] flex items-center justify-center shrink-0 relative">
              {isPdf ? (
                <FileText className="w-5 h-5 text-rose-600" />
              ) : item.previewUrl ? (
                <img
                  src={item.previewUrl}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-4 h-4 rounded-full border-2 border-[#0A0A0A] border-t-transparent animate-spin" />
              )}

              {/* Uploading progress overlay */}
              {isUploading && (
                <div
                  role="progressbar"
                  aria-valuenow={item.progress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  className="absolute inset-0 bg-black/50 backdrop-blur-2xs flex items-center justify-center text-[10px] text-white font-bold"
                >
                  {item.progress}%
                </div>
              )}
            </div>

            {/* Name & status */}
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold text-[#0A0A0A] truncate">
                {item.name}
              </p>
              <p className="text-[10px] text-[#6B7280]">
                {isError ? (
                  <span className="text-rose-600 font-medium truncate block">
                    {item.error || 'Failed'}
                  </span>
                ) : (
                  item.sizeStr
                )}
              </p>
            </div>

            {/* Actions: Retry or Remove */}
            <div className="flex items-center gap-1 shrink-0">
              {isError && (
                <button
                  type="button"
                  onClick={() => onRetry(item.id)}
                  className="p-1 text-[#0A0A0A] hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
                  title="Retry upload"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              )}

              <button
                type="button"
                onClick={() => onRemove(item.id)}
                className="p-1 text-[#6B7280] hover:text-[#0A0A0A] hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
                title="Remove attachment"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

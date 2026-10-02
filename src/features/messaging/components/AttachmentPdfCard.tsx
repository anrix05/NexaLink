/**
 * NexaLink Messaging v2 - Standalone PDF Attachment Card
 * Rendered outside dark text bubbles with middle-truncated name, file size, and Open/Download actions.
 */

import React from 'react';
import type { MessageAttachment } from '../../../types';
import { FileText, Download, ExternalLink } from 'lucide-react';

interface AttachmentPdfCardProps {
  attachment: MessageAttachment;
  isMe: boolean;
}

function middleTruncate(str: string, maxLength = 32): string {
  if (str.length <= maxLength) return str;
  const ext = str.split('.').pop() || '';
  const nameWithoutExt = str.substring(0, str.lastIndexOf('.')) || str;
  const keepFront = Math.floor((maxLength - ext.length - 3) / 2);
  const keepBack = Math.ceil((maxLength - ext.length - 3) / 2);
  return `${nameWithoutExt.substring(0, keepFront)}…${nameWithoutExt.substring(nameWithoutExt.length - keepBack)}.${ext}`;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const AttachmentPdfCard: React.FC<AttachmentPdfCardProps> = ({ attachment, isMe }) => {
  const url = attachment.signedUrl || attachment.storagePath;
  const truncatedName = middleTruncate(attachment.fileName, 28);
  const sizeStr = formatBytes(attachment.sizeBytes || 0);

  return (
    <div
      className={`mt-1.5 max-w-[320px] p-3 rounded-2xl border border-[#E5E7EB] bg-[#FAFAFA] shadow-2xs space-y-2.5 ${
        isMe ? 'self-end' : 'self-start'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex flex-col items-center justify-center shrink-0 text-rose-700">
          <FileText className="w-5 h-5" />
          <span className="text-[8px] font-bold tracking-tight uppercase leading-none mt-0.5">
            PDF
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <h4
            className="text-xs font-semibold text-[#0A0A0A] truncate leading-tight"
            title={attachment.fileName}
          >
            {truncatedName}
          </h4>
          <p className="text-[11px] text-[#6B7280] mt-0.5">
            PDF · {sizeStr}
          </p>
        </div>
      </div>

      <div className="pt-2 border-t border-[#E5E7EB] flex items-center justify-end gap-2 text-xs">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="px-2.5 py-1 rounded-lg text-[#0A0A0A] hover:bg-neutral-200/60 font-medium flex items-center gap-1 transition-colors cursor-pointer"
        >
          <ExternalLink className="w-3.5 h-3.5 text-[#6B7280]" />
          <span>Open</span>
        </a>

        <a
          href={url}
          download={attachment.fileName}
          className="px-2.5 py-1 rounded-lg bg-[#0A0A0A] hover:bg-[#262626] text-white font-medium flex items-center gap-1 transition-colors cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Download</span>
        </a>
      </div>
    </div>
  );
};

import React, { useEffect } from 'react';
import { X, Calendar, User, Tag, AlertTriangle, Pin } from 'lucide-react';
import type { Announcement } from '../../types';
import { formatIstDate } from '../../utils/dateUtils';

export interface NoticeDetailModalProps {
  notice: Announcement | null;
  isOpen: boolean;
  onClose: () => void;
}

export const NoticeDetailModal: React.FC<NoticeDetailModalProps> = ({
  notice,
  isOpen,
  onClose
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !notice) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="notice-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        className="w-full max-w-xl bg-white border border-[#E5E7EB] rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#E5E7EB] flex items-start justify-between gap-4">
          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {notice.isPinned && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-[#0A0A0A] text-white">
                  <Pin className="w-3 h-3 fill-white" />
                  Pinned
                </span>
              )}
              {notice.isImportant && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]">
                  <AlertTriangle className="w-3 h-3 text-[#92400E]" />
                  Important
                </span>
              )}
              <span className="text-xs font-medium text-[#6B7280] bg-[#F3F4F6] px-2 py-0.5 rounded">
                {notice.category}
              </span>
            </div>
            <h2 id="notice-modal-title" className="text-base sm:text-lg font-semibold text-[#0A0A0A] leading-snug">
              {notice.title}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close details"
            className="p-1.5 rounded-lg text-[#6B7280] hover:text-[#0A0A0A] hover:bg-[#F3F4F6] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0A0A0A] cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs sm:text-sm text-[#1F2937] leading-relaxed whitespace-pre-line">
          {notice.content}
        </div>

        {/* Footer Metadata */}
        <div className="px-6 py-4 border-t border-[#E5E7EB] bg-[#FAFAFA] flex flex-wrap items-center justify-between gap-3 text-xs text-[#6B7280]">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#9CA3AF]" />
              <span>{notice.author || 'Institutional Admin'}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#9CA3AF]" />
              <span>Posted {formatIstDate(notice.date, { includeYear: true })}</span>
            </span>
            {notice.targetAudience && (
              <span className="flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-[#9CA3AF]" />
                <span>Audience: {notice.targetAudience}</span>
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 bg-[#0A0A0A] text-white text-xs font-medium rounded-lg hover:bg-[#262626] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0A0A0A] cursor-pointer ml-auto"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

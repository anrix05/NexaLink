/**
 * NexaLink Messaging v2 - Quoted Reply Banner
 * Positioned directly above composer input when drafting a reply.
 */

import React from 'react';
import { Reply, X } from 'lucide-react';
import type { ReplySnippet } from '../../../types';

interface ReplyBarProps {
  reply: ReplySnippet | null;
  onCancel: () => void;
}

export const ReplyBar: React.FC<ReplyBarProps> = ({ reply, onCancel }) => {
  if (!reply) return null;

  return (
    <div className="px-3 py-2 border-b border-[#E5E7EB] bg-[#F9FAFB] flex items-center justify-between gap-3 text-xs animate-in slide-in-from-bottom-2 duration-150">
      <div className="flex items-center gap-2 min-w-0">
        <div className="w-5 h-5 rounded-md bg-[#0A0A0A] text-white flex items-center justify-center shrink-0">
          <Reply className="w-3 h-3" />
        </div>
        <div className="min-w-0">
          <span className="font-semibold text-[#0A0A0A] mr-1.5">
            Replying to {reply.name}
          </span>
          <span className="text-[#6B7280] truncate inline-block max-w-[280px] sm:max-w-md align-bottom">
            {reply.isDeleted ? 'Original message deleted' : `"${reply.content}"`}
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={onCancel}
        className="p-1 text-[#6B7280] hover:text-[#0A0A0A] rounded-lg hover:bg-neutral-200 transition-colors cursor-pointer"
        title="Cancel reply (Esc)"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

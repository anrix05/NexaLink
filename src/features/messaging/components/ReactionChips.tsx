/**
 * NexaLink Messaging v2 - Reaction Chips Under Bubbles
 * Displays emoji counters, highlighted when current user reacted.
 */

import React from 'react';

interface ReactionChipsProps {
  reactions?: { emoji: string; userId: string }[];
  currentUserId: string;
  onToggleReaction: (emoji: string) => void;
  isMe: boolean;
}

export const ReactionChips: React.FC<ReactionChipsProps> = ({
  reactions = [],
  currentUserId,
  onToggleReaction,
  isMe
}) => {
  if (reactions.length === 0) return null;

  // Group by emoji: emoji -> { count, userIds, didIReact }
  const grouped = reactions.reduce<Record<string, { count: number; userIds: string[]; didIReact: boolean }>>(
    (acc, r) => {
      if (!acc[r.emoji]) {
        acc[r.emoji] = { count: 0, userIds: [], didIReact: false };
      }
      acc[r.emoji].count += 1;
      acc[r.emoji].userIds.push(r.userId);
      if (r.userId === currentUserId) {
        acc[r.emoji].didIReact = true;
      }
      return acc;
    },
    {}
  );

  return (
    <div className={`flex flex-wrap gap-1 mt-1 ${isMe ? 'justify-end mr-1' : 'justify-start ml-1'}`}>
      {Object.entries(grouped).map(([emoji, data]) => (
        <button
          key={emoji}
          type="button"
          onClick={() => onToggleReaction(emoji)}
          className={`px-2 py-0.5 rounded-full text-xs flex items-center gap-1.5 transition-all cursor-pointer select-none active:scale-95 ${
            data.didIReact
              ? 'bg-[#F3F4F6] border-2 border-[#0A0A0A] text-[#0A0A0A]'
              : 'bg-white border border-[#E5E7EB] text-[#374151] hover:bg-[#F9FAFB]'
          }`}
          title={`${data.count} reaction${data.count > 1 ? 's' : ''}${data.didIReact ? ' (Click to remove)' : ''}`}
        >
          <span className="text-xs">{emoji}</span>
          <span className="font-semibold text-[11px] tabular-nums text-[#0A0A0A]">
            {data.count}
          </span>
        </button>
      ))}
    </div>
  );
};

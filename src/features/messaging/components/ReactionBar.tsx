/**
 * NexaLink Messaging v2 - Reaction Bar & Quick Emoji Picker
 * Displays quick emojis: 👍 ❤️ 😂 😮 😢 🙏 plus "+" for full picker.
 */

import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { EmojiPicker } from '../emoji/EmojiPicker';

interface ReactionBarProps {
  onSelectEmoji: (emoji: string) => void;
  isMe: boolean;
  onClose?: () => void;
}

const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

export const ReactionBar: React.FC<ReactionBarProps> = ({ onSelectEmoji, isMe, onClose }) => {
  const [showFullPicker, setShowFullPicker] = useState(false);

  return (
    <div className="relative">
      <div
        className={`flex items-center gap-0.5 bg-white border border-[#E5E7EB] rounded-full p-1 shadow-sm animate-in fade-in zoom-in-95 duration-150 select-none z-30`}
        onClick={(e) => e.stopPropagation()}
      >
        {QUICK_REACTIONS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => {
              onSelectEmoji(emoji);
              if (onClose) onClose();
            }}
            className="w-7 h-7 flex items-center justify-center text-sm rounded-full hover:bg-[#F3F4F6] transition-transform hover:scale-125 cursor-pointer"
          >
            {emoji}
          </button>
        ))}

        <div className="w-px h-4 bg-[#E5E7EB] mx-0.5" />

        <button
          type="button"
          onClick={() => setShowFullPicker(!showFullPicker)}
          className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-[#F3F4F6] text-[#6B7280] hover:text-[#0A0A0A] transition-colors cursor-pointer"
          title="More reactions"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {showFullPicker && (
        <div className={`absolute top-9 ${isMe ? 'right-0' : 'left-0'} z-50`}>
          <EmojiPicker
            onSelect={(emoji) => {
              onSelectEmoji(emoji);
              setShowFullPicker(false);
              if (onClose) onClose();
            }}
            onClose={() => setShowFullPicker(false)}
          />
        </div>
      )}
    </div>
  );
};

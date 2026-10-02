/**
 * NexaLink Messaging v2 - Accessible Curated Emoji Picker
 * - Lazy loaded popover chunk
 * - Real-time keyword search
 * - Recents caching with localStorage fallback
 * - Keyboard navigation (Esc to dismiss)
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { EMOJI_DATASET, EMOJI_CATEGORIES, type EmojiItem } from './emojiData';
import { Search, X, Clock } from 'lucide-react';

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose?: () => void;
  className?: string;
}

const RECENTS_KEY = 'nexalink:messaging:emoji:recents';

export const EmojiPicker: React.FC<EmojiPickerProps> = ({
  onSelect,
  onClose,
  className = ''
}) => {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [recents, setRecents] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(RECENTS_KEY);
      return stored ? JSON.parse(stored) : ['👍', '❤️', '🙌', '💡', '🚀', '🎉', '😊', '🙏'];
    } catch {
      return ['👍', '❤️', '🙌', '💡', '🚀', '🎉', '😊', '🙏'];
    }
  });

  const searchInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  // Keyboard navigation: Escape closes popover
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onClose) {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleSelectEmoji = (emoji: string) => {
    // Update recents
    const nextRecents = [emoji, ...recents.filter(e => e !== emoji)].slice(0, 16);
    setRecents(nextRecents);
    try {
      localStorage.setItem(RECENTS_KEY, JSON.stringify(nextRecents));
    } catch {
      // storage unavailable
    }
    onSelect(emoji);
  };

  const filteredEmojis = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      if (activeCategory === 'All') return EMOJI_DATASET;
      return EMOJI_DATASET.filter(e => e.category === activeCategory);
    }
    return EMOJI_DATASET.filter(e =>
      e.name.toLowerCase().includes(query) ||
      e.keywords.some(k => k.toLowerCase().includes(query))
    );
  }, [search, activeCategory]);

  return (
    <div
      ref={containerRef}
      role="dialog"
      aria-label="Emoji Picker"
      className={`w-72 sm:w-80 bg-white border border-[#E5E7EB] rounded-2xl shadow-lg flex flex-col overflow-hidden text-xs z-50 animate-in fade-in zoom-in-95 duration-150 select-none ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header Search Bar */}
      <div className="p-2.5 border-b border-[#E5E7EB] bg-[#FAFAFA] flex items-center gap-2">
        <div className="relative flex-1 flex items-center">
          <Search className="w-3.5 h-3.5 text-[#9CA3AF] absolute left-2.5 pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search emoji..."
            className="w-full h-8 pl-8 pr-7 bg-white border border-[#E5E7EB] rounded-xl text-xs text-[#0A0A0A] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#0A0A0A]"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2 text-[#9CA3AF] hover:text-[#0A0A0A]"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#6B7280] hover:text-[#0A0A0A] rounded-lg hover:bg-neutral-200 transition-colors"
            title="Close emoji picker"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Recents Strip (when not searching) */}
      {!search && recents.length > 0 && (
        <div className="px-2.5 py-1.5 border-b border-[#F3F4F6] bg-white flex items-center gap-1.5 overflow-x-auto custom-scrollbar">
          <Clock className="w-3 h-3 text-[#9CA3AF] shrink-0 ml-1" />
          {recents.slice(0, 8).map((recEmoji) => (
            <button
              key={`rec-${recEmoji}`}
              type="button"
              onClick={() => handleSelectEmoji(recEmoji)}
              className="w-7 h-7 flex items-center justify-center text-sm rounded-lg hover:bg-[#F3F4F6] transition-transform hover:scale-110 cursor-pointer"
            >
              {recEmoji}
            </button>
          ))}
        </div>
      )}

      {/* Category Pills (when not searching) */}
      {!search && (
        <div className="px-2 py-1 border-b border-[#F3F4F6] bg-[#FAFAFA] flex items-center gap-1 overflow-x-auto custom-scrollbar text-[10px]">
          <button
            type="button"
            onClick={() => setActiveCategory('All')}
            className={`px-2 py-0.5 rounded-md font-medium transition-colors shrink-0 cursor-pointer ${
              activeCategory === 'All'
                ? 'bg-[#0A0A0A] text-white'
                : 'text-[#6B7280] hover:text-[#0A0A0A]'
            }`}
          >
            All
          </button>
          {EMOJI_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`px-2 py-0.5 rounded-md font-medium transition-colors shrink-0 cursor-pointer ${
                activeCategory === cat
                  ? 'bg-[#0A0A0A] text-white'
                  : 'text-[#6B7280] hover:text-[#0A0A0A]'
              }`}
            >
              {cat.split(' ')[0]}
            </button>
          ))}
        </div>
      )}

      {/* Emoji Grid */}
      <div className="p-2 overflow-y-auto max-h-56 grid grid-cols-7 sm:grid-cols-8 gap-1 custom-scrollbar">
        {filteredEmojis.length === 0 ? (
          <div className="col-span-full py-8 text-center text-[#6B7280] text-xs">
            No emojis match "{search}"
          </div>
        ) : (
          filteredEmojis.map((item) => (
            <button
              key={`${item.name}-${item.emoji}`}
              type="button"
              onClick={() => handleSelectEmoji(item.emoji)}
              title={item.name}
              className="w-8 h-8 flex items-center justify-center text-base rounded-lg hover:bg-[#F3F4F6] transition-all hover:scale-120 cursor-pointer"
            >
              {item.emoji}
            </button>
          ))
        )}
      </div>
    </div>
  );
};

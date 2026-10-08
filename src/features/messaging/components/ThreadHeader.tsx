/**
 * NexaLink Messaging v2 - Thread Header & Privacy Lock Popover
 * Replaces old "Private" pill with subtle lock icon button and popover modal.
 */

import React, { useState } from 'react';
import { Avatar } from '../../../utils/avatarHelper';
import {
  Lock,
  Search,
  MoreVertical,
  Star,
  BellOff,
  UserX,
  Flag,
  UserCheck,
  X,
  ShieldCheck,
  ChevronDown,
  ArrowLeft
} from 'lucide-react';
import type { ContactItem } from '../../../pages/messaging/MessagingPage';

interface ThreadHeaderProps {
  contact: ContactItem;
  isStarred: boolean;
  isMuted: boolean;
  onToggleStar: () => void;
  onToggleMute: () => void;
  onToggleThreadSearch: () => void;
  onViewProfile?: () => void;
  onReportConversation?: () => void;
  onBlockUser?: () => void;
  onBackMobile?: () => void;
}

export const ThreadHeader: React.FC<ThreadHeaderProps> = ({
  contact,
  isStarred,
  isMuted,
  onToggleStar,
  onToggleMute,
  onToggleThreadSearch,
  onViewProfile,
  onReportConversation,
  onBlockUser,
  onBackMobile
}) => {
  const [showPrivacyPopover, setShowPrivacyPopover] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const subtitle = React.useMemo(() => {
    const parts: string[] = [];
    if (contact.type === 'alumni') {
      parts.push('Alumni');
      const grad = (contact as any).gradYear ? `Class of ${(contact as any).gradYear}` : null;
      if (grad) parts.push(grad);
      if (contact.company && contact.company.toLowerCase() !== 'alumni') {
        parts.push(contact.company);
      }
      if (contact.designation && contact.designation.toLowerCase() !== 'alumni' && contact.designation !== contact.company) {
        parts.push(contact.designation);
      }
    } else if (contact.type === 'faculty') {
      parts.push('Faculty');
      if (contact.department) parts.push(contact.department);
      if (contact.designation && contact.designation.toLowerCase() !== 'faculty') {
        parts.push(contact.designation);
      }
    } else if (contact.type === 'admin') {
      parts.push('Admin');
      parts.push('Institutional Administration');
    } else {
      parts.push('Student');
      if (contact.department) parts.push(contact.department);
      if (contact.designation && contact.designation !== 'Student') {
        parts.push(contact.designation);
      }
    }

    // Deduplicate case-insensitively
    const seen = new Set<string>();
    const unique = parts.filter((p) => {
      const lower = p.trim().toLowerCase();
      if (!lower || seen.has(lower)) return false;
      seen.add(lower);
      return true;
    });

    return unique.join(' · ') || (contact.type === 'alumni' ? 'Alumni' : contact.type === 'faculty' ? 'Faculty' : contact.type === 'admin' ? 'Admin' : 'Student');
  }, [contact]);

  return (
    <div className="h-[72px] min-h-[72px] max-h-[72px] border-b border-[#E5E7EB] bg-white px-5 flex items-center justify-between shrink-0 relative z-20">
      {/* Left: Avatar & Contact Meta */}
      <div className="flex items-center gap-3 min-w-0">
        {onBackMobile && (
          <button
            type="button"
            onClick={onBackMobile}
            className="md:hidden min-w-[44px] min-h-[44px] flex items-center justify-center text-[#0A0A0A] hover:bg-[#F3F4F6] rounded-lg -ml-2 transition-colors cursor-pointer touch-target-44 shrink-0"
            aria-label="Back to conversations"
          >
            <ArrowLeft className="w-5 h-5 text-[#0A0A0A]" />
          </button>
        )}

        <div className="relative shrink-0 cursor-pointer" onClick={onViewProfile}>
          <Avatar
            src={contact.avatarUrl}
            name={contact.name}
            size={40}
            className="border border-[#E5E7EB]"
          />
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <h3
              onClick={onViewProfile}
              className="font-semibold text-base leading-6 text-[#0A0A0A] truncate cursor-pointer hover:underline"
            >
              {contact.name}
            </h3>

            {/* Subtle Private Lock Icon Button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowPrivacyPopover(!showPrivacyPopover)}
                className="p-1 text-[#6B7280] hover:text-[#0A0A0A] rounded-md hover:bg-neutral-100 transition-colors cursor-pointer"
                title={`Private conversation. Only you and ${contact.name} can read it. Admins can see a message only if it is reported.`}
                aria-label="Privacy Information"
              >
                <Lock className="w-3.5 h-3.5" />
              </button>

              {/* Privacy Popover */}
              {showPrivacyPopover && (
                <div
                  className="absolute left-0 mt-1 w-68 p-3.5 bg-white border border-[#E5E7EB] rounded-2xl shadow-xl z-50 text-xs text-[#0A0A0A] space-y-2 animate-in fade-in zoom-in-95 duration-150"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between pb-1.5 border-b border-[#F3F4F6]">
                    <div className="flex items-center gap-1.5 font-semibold text-[#0A0A0A]">
                      <ShieldCheck className="w-4 h-4 text-[#0A0A0A]" />
                      <span>Private conversation</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowPrivacyPopover(false)}
                      className="text-[#9CA3AF] hover:text-[#0A0A0A] cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-[11px] text-[#6B7280] leading-relaxed">
                    Private conversation. Only you and <strong className="text-[#0A0A0A]">{contact.name}</strong> can read it. Admins can see a message only if it is reported.
                  </p>
                </div>
              )}
            </div>
          </div>

          <p className="text-[13px] leading-5 text-[#6B7280] truncate mt-0.5">
            {subtitle}
          </p>
        </div>
      </div>

      {/* Right: 36px Ghost Icon Buttons */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          onClick={onToggleThreadSearch}
          className="w-9 h-9 rounded-lg text-[#6B7280] hover:text-[#0A0A0A] hover:bg-[#F3F4F6] flex items-center justify-center transition-colors cursor-pointer"
          title="Search in conversation"
          aria-label="Search conversation"
        >
          <Search className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={onToggleStar}
          className={`w-9 h-9 rounded-lg flex items-center justify-center hover:bg-[#F3F4F6] transition-colors cursor-pointer ${
            isStarred ? 'text-[#0A0A0A]' : 'text-[#6B7280] hover:text-[#0A0A0A]'
          }`}
          title={isStarred ? 'Unstar conversation' : 'Star conversation'}
          aria-label={isStarred ? 'Unstar conversation' : 'Star conversation'}
        >
          <Star className={`w-4 h-4 ${isStarred ? 'fill-current' : ''}`} />
        </button>

        {/* Overflow Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowMenu(!showMenu)}
            className="w-9 h-9 rounded-lg text-[#6B7280] hover:text-[#0A0A0A] hover:bg-[#F3F4F6] flex items-center justify-center transition-colors cursor-pointer"
            title="More actions"
            aria-label="More actions"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {showMenu && (
            <div
              className="absolute right-0 mt-1 w-48 bg-white border border-[#E5E7EB] rounded-2xl shadow-xl p-1.5 z-50 text-xs text-[#0A0A0A] space-y-0.5 animate-in fade-in duration-100"
              onClick={() => setShowMenu(false)}
            >
              {onViewProfile && (
                <button
                  type="button"
                  onClick={onViewProfile}
                  className="w-full px-2.5 py-1.5 text-left rounded-xl hover:bg-[#FAFAFA] transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <UserCheck className="w-3.5 h-3.5 text-[#6B7280]" />
                  <span>View profile</span>
                </button>
              )}

              <button
                type="button"
                onClick={onToggleMute}
                className="w-full px-2.5 py-1.5 text-left rounded-xl hover:bg-[#FAFAFA] transition-colors flex items-center gap-2 cursor-pointer"
              >
                <BellOff className="w-3.5 h-3.5 text-[#6B7280]" />
                <span>{isMuted ? 'Unmute notifications' : 'Mute notifications'}</span>
              </button>

              {onReportConversation && (
                <button
                  type="button"
                  onClick={onReportConversation}
                  className="w-full px-2.5 py-1.5 text-left rounded-xl hover:bg-rose-50 text-rose-700 transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <Flag className="w-3.5 h-3.5 text-rose-600" />
                  <span>Report conversation</span>
                </button>
              )}

              {onBlockUser && (
                <button
                  type="button"
                  onClick={onBlockUser}
                  className="w-full px-2.5 py-1.5 text-left rounded-xl hover:bg-rose-50 text-rose-700 transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <UserX className="w-3.5 h-3.5 text-rose-600" />
                  <span>Block user</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

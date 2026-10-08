import React from 'react';
import type { Announcement, AnnouncementSeverity } from '../../types';
import {
  Bell,
  AlertTriangle,
  ShieldAlert,
  GraduationCap,
  Pin,
  Calendar,
  Clock,
  Sparkles,
  Info
} from 'lucide-react';
import { Badge } from './UIComponents';

export const ANNOUNCEMENT_META_PREFIX = '<!--nexalink_meta:';
export const ANNOUNCEMENT_META_SUFFIX = '-->';

export const parseAnnouncementMeta = (rawContent: string) => {
  if (!rawContent) {
    return { cleanContent: '', meta: null };
  }
  const match = rawContent.match(/<!--nexalink[_:]meta:(.*?)-->\s*/s);
  if (match) {
    try {
      const meta = JSON.parse(match[1]);
      const cleanContent = rawContent.replace(match[0], '').trim();
      return { cleanContent, meta };
    } catch {
      const cleanContent = rawContent.replace(match[0], '').trim();
      return { cleanContent, meta: null };
    }
  }
  return { cleanContent: rawContent, meta: null };
};

export const serializeAnnouncementContent = (
  cleanContent: string,
  meta: { severity?: string; expiresAt?: string; isPinned?: boolean }
) => {
  const jsonStr = JSON.stringify(meta);
  return `${ANNOUNCEMENT_META_PREFIX}${jsonStr}${ANNOUNCEMENT_META_SUFFIX}\n${cleanContent}`;
};

export const filterAnnouncementsForAudience = (
  announcements: Announcement[],
  role: string | undefined
): Announcement[] => {
  const now = Date.now();
  const normalizedRole = (role || '').toLowerCase();

  return announcements
    .filter(anc => {
      // 1. Exclude retracted
      if (anc.isRetracted) return false;

      // 2. Exclude auto-expired announcements
      if (anc.expiresAt) {
        const expiryTime = new Date(anc.expiresAt).getTime();
        if (!isNaN(expiryTime) && now > expiryTime) {
          return false;
        }
      }

      // 3. Target audience check
      const aud = (anc.targetAudience || 'All').toLowerCase();
      if (aud === 'all') return true;

      if (normalizedRole === 'student') {
        return aud === 'students' || aud === 'student';
      }
      if (normalizedRole === 'alumni') {
        return aud === 'alumni';
      }
      if (normalizedRole === 'faculty' || normalizedRole === 'teacher') {
        return aud === 'faculty' || aud === 'teacher';
      }
      if (normalizedRole === 'admin') {
        return true;
      }
      return false;
    })
    .sort((a, b) => {
      // Pinned items stay at top
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      // Newest date first
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
};

interface InstitutionalAnnouncementFeedProps {
  announcements: Announcement[];
  userRole?: string;
  className?: string;
  title?: string;
  showEmptyState?: boolean;
}

export const InstitutionalAnnouncementFeed: React.FC<InstitutionalAnnouncementFeedProps> = ({
  announcements,
  userRole,
  className = '',
  title = 'Institutional Announcements',
  showEmptyState = false
}) => {
  const visibleAnnouncements = filterAnnouncementsForAudience(announcements, userRole);

  if (visibleAnnouncements.length === 0) {
    if (!showEmptyState) return null;
    return (
      <div className={`p-5 rounded-xl border border-dashed border-[#E5E7EB] bg-[#FAFAFA] text-center text-xs text-[#6B7280] space-y-1 ${className}`}>
        <p className="font-bold text-[#0A0A0A]">No Active Broadcast Notices</p>
        <p className="text-[11px]">There are currently no active announcements targeted to {userRole ? `${userRole}s` : 'this audience'}.</p>
      </div>
    );
  }

  const getSeverityStyles = (severity?: AnnouncementSeverity) => {
    switch (severity) {
      case 'actionable':
        return {
          border: 'border-l-4 border-l-[#B45309] border-t border-r border-b border-[#E5E7EB]',
          bg: 'bg-amber-50/30',
          badgeText: 'Actionable Alert',
          badgeClass: 'bg-amber-100 text-[#B45309] border border-amber-300 font-bold',
          icon: <AlertTriangle className="w-4 h-4 text-[#B45309]" />
        };
      case 'governance':
        return {
          border: 'border-l-4 border-l-[#991B1B] border-t border-r border-b border-[#E5E7EB]',
          bg: 'bg-rose-50/30',
          badgeText: 'Governance Urgent',
          badgeClass: 'bg-rose-100 text-[#991B1B] border border-rose-300 font-bold',
          icon: <ShieldAlert className="w-4 h-4 text-[#991B1B]" />
        };
      case 'academic':
        return {
          border: 'border-l-4 border-l-[#3730A3] border-t border-r border-b border-[#E5E7EB]',
          bg: 'bg-indigo-50/30',
          badgeText: 'Academic Notice',
          badgeClass: 'bg-indigo-100 text-[#3730A3] border border-indigo-300 font-bold',
          icon: <GraduationCap className="w-4 h-4 text-[#3730A3]" />
        };
      case 'standard':
      default:
        return {
          border: 'border border-[#E5E7EB]',
          bg: 'bg-white',
          badgeText: 'Standard Notice',
          badgeClass: 'bg-[#F3F4F6] text-[#374151] border border-[#E5E7EB]',
          icon: <Bell className="w-4 h-4 text-[#6B7280]" />
        };
    }
  };

  return (
    <div className={`space-y-3 font-sans ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-[#0A0A0A] flex items-center gap-2">
          <Bell className="w-3.5 h-3.5 text-[#0A0A0A]" />
          {title} ({visibleAnnouncements.length})
        </h3>
        <span className="text-[10px] font-mono text-[#6B7280]">
          Targeted Institutional Feed
        </span>
      </div>

      <div className="space-y-3">
        {visibleAnnouncements.map(anc => {
          const style = getSeverityStyles(anc.severity);
          const formattedDate = anc.date ? new Date(anc.date).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
          }) : '';

          return (
            <div
              key={anc.id}
              className={`p-4 rounded-xl transition-all shadow-none relative ${style.bg} ${style.border}`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E5E7EB]/60 pb-2.5 mb-2.5">
                <div className="flex items-center flex-wrap gap-2">
                  {anc.isPinned && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-[#0A0A0A] text-white shadow-xs">
                      <Pin className="w-3 h-3 fill-white" />
                      Pinned
                    </span>
                  )}
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium ${style.badgeClass}`}>
                    {style.icon}
                    {style.badgeText}
                  </span>
                  <Badge variant="slate" size="sm">{anc.category}</Badge>
                </div>

                <div className="flex items-center gap-3 text-[11px] font-mono text-[#6B7280]">
                  {anc.expiresAt && (
                    <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                      <Clock className="w-3 h-3" />
                      Expires: {new Date(anc.expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formattedDate}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <h4 className="font-bold text-sm text-[#0A0A0A] leading-snug">
                  {anc.title}
                </h4>
                <p className="text-xs text-[#374151] leading-relaxed whitespace-pre-line font-normal">
                  {anc.content}
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-[#E5E7EB]/60 flex items-center justify-between text-[10px] font-mono text-[#6B7280]">
                <span>Broadcast By: <strong className="text-[#0A0A0A]">{anc.author || 'Institutional Admin Cell'}</strong></span>
                <span>Audience: <strong className="text-[#0A0A0A]">{anc.targetAudience}</strong></span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

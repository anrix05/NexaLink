import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotices } from '../../hooks/useNotices';
import { NoticeDetailModal } from './NoticeDetailModal';
import type { Announcement, UserRole } from '../../types';
import { formatIstDate } from '../../utils/dateUtils';
import { formatRelativeTime } from '../../utils/notificationHelpers';
import { X, ArrowRight, AlertTriangle, Pin } from 'lucide-react';

export interface NoticeBoardProps {
  variant: 'top' | 'rail';
  role?: UserRole | string;
  setActiveTab?: (tab: string, sub?: string) => void;
  onNavigate?: (tab: string, sub?: string) => void;
  className?: string;
}

function useIsDesktop(breakpoint = 1280): boolean {
  const [isDesktop, setIsDesktop] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return window.innerWidth >= breakpoint;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const media = window.matchMedia(`(min-width: ${breakpoint}px)`);
    const update = (e: MediaQueryListEvent | MediaQueryList) => {
      setIsDesktop(e.matches);
    };
    update(media);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, [breakpoint]);

  return isDesktop;
}

export const NoticeBoard: React.FC<NoticeBoardProps> = (props) => {
  const isDesktop = useIsDesktop(1280);

  // At <1280px: do NOT render the rail variant at all
  if (props.variant === 'rail' && !isDesktop) {
    return null;
  }

  // At >=1280px: do NOT render the top variant at all
  if (props.variant === 'top' && isDesktop) {
    return null;
  }

  return <NoticeBoardContent {...props} />;
};

const NoticeBoardContent: React.FC<NoticeBoardProps> = ({
  variant,
  role: propRole,
  setActiveTab,
  onNavigate,
  className = ''
}) => {
  const { currentUser, currentRole } = useAuth();
  const effectiveRole = propRole || currentRole;
  const { notices, isLoading, isError } = useNotices({ role: effectiveRole });

  const [selectedNotice, setSelectedNotice] = useState<Announcement | null>(null);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(() => new Set());

  const storageKey = `nexalink:notices:dismissed:v1:${currentUser?.id || 'guest'}`;

  const handleViewAll = () => {
    if (setActiveTab) setActiveTab('notices');
    else if (onNavigate) onNavigate('notices');
  };

  // Read dismissed IDs from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setDismissedIds(new Set(parsed));
        }
      }
    } catch {
      // Ignore localStorage errors gracefully
    }
  }, [storageKey]);

  const handleDismiss = (e: React.MouseEvent, noticeId: string) => {
    e.stopPropagation();
    setDismissedIds(prev => {
      const next = new Set(prev);
      next.add(noticeId);
      try {
        localStorage.setItem(storageKey, JSON.stringify(Array.from(next)));
      } catch {
        // Ignore localStorage quota/access errors
      }
      return next;
    });
  };

  // ── VARIANT: TOP (<1280px / mobile & tablet header placement) ─────────────
  // Qualifies: not dismissed AND (pinned OR important OR posted in last 7 days)
  const topQualifyingNotices = useMemo(() => {
    if (variant !== 'top') return [];
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

    return notices
      .filter(n => !dismissedIds.has(n.id))
      .filter(n => {
        if (n.isPinned || n.isImportant) return true;
        const postTime = new Date(n.date).getTime();
        return !isNaN(postTime) && postTime >= sevenDaysAgo;
      })
      .slice(0, 2);
  }, [variant, notices, dismissedIds]);

  // ── VARIANT: RAIL (≥1280px RightRail placement) ───────────────────────────
  const railNotices = useMemo(() => {
    if (variant !== 'rail') return [];
    return notices.slice(0, 3);
  }, [variant, notices]);

  // Loading skeleton or error: hide quietly on dashboard
  if (isLoading) {
    if (variant === 'top') {
      return (
        <div className={`xl:hidden space-y-2 py-3 border-y border-[#E5E7EB] animate-pulse ${className}`}>
          <div className="h-4 bg-[#F3F4F6] rounded w-1/3" />
          <div className="h-3 bg-[#F3F4F6] rounded w-2/3" />
        </div>
      );
    }
    return (
      <div className={`hidden xl:block space-y-3 pt-6 border-t border-[#E5E7EB] animate-pulse ${className}`}>
        <div className="h-4 bg-[#F3F4F6] rounded w-1/2" />
        <div className="h-12 bg-[#F3F4F6] rounded-lg" />
      </div>
    );
  }

  if (isError) {
    return null; // Quietly hide the section on error per B2
  }

  // ── RENDER TOP STRIP ──────────────────────────────────────────────────────
  if (variant === 'top') {
    // If nothing qualifies, hide the whole strip (no empty state at top)
    if (topQualifyingNotices.length === 0) {
      return null;
    }

    return (
      <>
        <section
          aria-label="Important notices"
          className={`xl:hidden w-full my-4 ${className}`}
        >
          <div className="border-y border-[#E5E7EB] divide-y divide-[#E5E7EB]">
            {topQualifyingNotices.map(notice => (
              <div
                key={notice.id}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedNotice(notice)}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedNotice(notice);
                  }
                }}
                className="py-3 px-1 flex items-start justify-between gap-3 text-left hover:bg-[#FAFAFA] transition-colors rounded-none cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0A0A0A]"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    {notice.isPinned && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#0A0A0A] text-white">
                        <Pin className="w-2.5 h-2.5 fill-white" />
                        Pinned
                      </span>
                    )}
                    {notice.isImportant && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]">
                        <AlertTriangle className="w-2.5 h-2.5 text-[#92400E]" />
                        Important
                      </span>
                    )}
                    <span className="text-xs text-[#6B7280]">
                      {notice.category}
                    </span>
                    <span className="text-[#9CA3AF] text-xs">·</span>
                    <span
                      className="text-xs text-[#6B7280]"
                      title={formatIstDate(notice.date, { includeYear: true })}
                    >
                      {formatRelativeTime(notice.date)}
                    </span>
                  </div>

                  <h4 className="text-sm font-semibold text-[#0A0A0A] line-clamp-1 leading-snug">
                    {notice.title}
                  </h4>
                  <p className="text-xs text-[#4B5563] line-clamp-2 mt-0.5 leading-relaxed">
                    {notice.content}
                  </p>
                </div>

                <button
                  type="button"
                  aria-label={`Dismiss notice: ${notice.title}`}
                  onClick={e => handleDismiss(e, notice.id)}
                  className="p-1 rounded text-[#9CA3AF] hover:text-[#0A0A0A] hover:bg-[#F3F4F6] transition-colors shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0A0A0A] cursor-pointer mt-0.5"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {(setActiveTab || onNavigate) && notices.length > 0 && (
            <div className="pt-2 px-1 flex justify-end">
              <button
                type="button"
                onClick={handleViewAll}
                className="text-xs font-medium text-[#0A0A0A] hover:underline inline-flex items-center gap-1 cursor-pointer py-1"
              >
                <span>View all notices ({notices.length})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </section>

        <NoticeDetailModal
          isOpen={Boolean(selectedNotice)}
          notice={selectedNotice}
          onClose={() => setSelectedNotice(null)}
        />
      </>
    );
  }

  // ── RENDER RAIL (≥1280px / desktop sidebar) ───────────────────────────────
  return (
    <>
      <section
        aria-label="Important notices"
        className={`space-y-3 pt-6 border-t border-[#E5E7EB] ${className}`}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[#0A0A0A]">Important notices</h3>
          {(setActiveTab || onNavigate) && (
            <button
              type="button"
              onClick={handleViewAll}
              className="text-xs font-medium text-[#6B7280] hover:text-[#0A0A0A] hover:underline cursor-pointer"
            >
              View all
            </button>
          )}
        </div>

        {railNotices.length === 0 ? (
          <p className="text-xs text-[#6B7280] py-1">No notices right now</p>
        ) : (
          <div className="space-y-2.5">
            {railNotices.map(notice => (
              <button
                key={notice.id}
                type="button"
                onClick={() => setSelectedNotice(notice)}
                className="w-full text-left p-2.5 -mx-2 rounded-lg hover:bg-[#FAFAFA] transition-colors group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0A0A0A]"
              >
                <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                  {notice.isImportant && (
                    <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-medium bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]">
                      Important
                    </span>
                  )}
                  <span className="text-[11px] text-[#6B7280]">{notice.category}</span>
                  <span className="text-[#D1D5DB] text-[10px]">·</span>
                  <span
                    className="text-[11px] text-[#6B7280]"
                    title={formatIstDate(notice.date, { includeYear: true })}
                  >
                    {formatRelativeTime(notice.date)}
                  </span>
                </div>
                <h4 className="text-xs font-semibold text-[#0A0A0A] group-hover:text-black line-clamp-1 leading-snug">
                  {notice.title}
                </h4>
                <p className="text-[11px] text-[#6B7280] line-clamp-2 mt-0.5 leading-relaxed">
                  {notice.content}
                </p>
              </button>
            ))}
          </div>
        )}
      </section>

      <NoticeDetailModal
        isOpen={Boolean(selectedNotice)}
        notice={selectedNotice}
        onClose={() => setSelectedNotice(null)}
      />
    </>
  );
};

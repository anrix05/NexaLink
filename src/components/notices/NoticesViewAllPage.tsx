import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotices } from '../../hooks/useNotices';
import { NoticeDetailModal } from './NoticeDetailModal';
import type { Announcement } from '../../types';
import { formatIstDate } from '../../utils/dateUtils';
import { formatRelativeTime } from '../../utils/notificationHelpers';
import {
  Search,
  Filter,
  AlertTriangle,
  Pin,
  RotateCcw,
  BookOpen,
  ArrowLeft
} from 'lucide-react';
import { PageHeader } from '../ui';

export interface NoticesViewAllPageProps {
  setActiveTab: (tab: string, sub?: string) => void;
}

export const NoticesViewAllPage: React.FC<NoticesViewAllPageProps> = ({ setActiveTab }) => {
  const { currentRole } = useAuth();
  const { notices, isLoading, isError, refetch } = useNotices({ role: currentRole, limit: 100 });

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  const [selectedNotice, setSelectedNotice] = useState<Announcement | null>(null);

  // Check URL deep link ?tab=notices&id=<id>
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const idParam = params.get('id');
    if (idParam && notices.length > 0) {
      const match = notices.find(n => n.id === idParam);
      if (match) setSelectedNotice(match);
    }
  }, [notices]);

  // Categories list derived from real data
  const categories = useMemo(() => {
    const set = new Set<string>();
    notices.forEach(n => {
      if (n.category) set.add(n.category);
    });
    return ['All', ...Array.from(set)];
  }, [notices]);

  // Filtered and stably sorted notices
  const filteredNotices = useMemo(() => {
    return notices
      .filter(n => {
        if (categoryFilter !== 'All' && n.category !== categoryFilter) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = n.title?.toLowerCase().includes(q);
          const matchContent = n.content?.toLowerCase().includes(q);
          const matchCategory = n.category?.toLowerCase().includes(q);
          if (!matchTitle && !matchContent && !matchCategory) return false;
        }
        return true;
      })
      .sort((a, b) => {
        // Pinned first
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
        // Important next
        if (a.isImportant !== b.isImportant) return a.isImportant ? -1 : 1;
        // Date desc
        const timeA = new Date(a.date).getTime() || 0;
        const timeB = new Date(b.date).getTime() || 0;
        if (timeA !== timeB) return timeB - timeA;
        // ID desc stable
        return b.id.localeCompare(a.id);
      });
  }, [notices, categoryFilter, searchQuery]);

  const pagedNotices = useMemo(() => {
    return filteredNotices.slice(0, page * PAGE_SIZE);
  }, [filteredNotices, page]);

  const hasMore = pagedNotices.length < filteredNotices.length;

  return (
    <div className="space-y-6">
      {/* Back navigation & Header */}
      <div>
        <button
          type="button"
          onClick={() => setActiveTab('dashboard')}
          className="inline-flex items-center gap-1.5 text-xs text-[#6B7280] hover:text-[#0A0A0A] font-medium mb-3 cursor-pointer transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to dashboard</span>
        </button>

        <PageHeader
          eyebrow="Announcements"
          title="Important notices"
          subtitle="Official institutional updates, placement alerts, academic schedules, and governance broadcasts."
        />
      </div>

      {/* Controls: Search & Category filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search notices by keyword or title..."
            className="w-full h-10 pl-9 pr-4 rounded-xl border border-[#E5E7EB] bg-white text-xs text-[#0A0A0A] placeholder-[#9CA3AF] focus:outline-none focus:border-[#0A0A0A]"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs text-[#6B7280] shrink-0 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            Category:
          </span>
          <select
            value={categoryFilter}
            onChange={e => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
            className="h-10 px-3 rounded-xl border border-[#E5E7EB] bg-white text-xs text-[#0A0A0A] focus:outline-none focus:border-[#0A0A0A] cursor-pointer"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* State: Error with Retry button */}
      {isError && (
        <div className="p-8 border border-rose-200 bg-rose-50/50 rounded-2xl text-center space-y-3">
          <p className="text-xs font-medium text-rose-800">
            Unable to load announcements at this moment.
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#0A0A0A] text-white text-xs font-medium rounded-lg hover:bg-[#262626] transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* State: Loading */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="p-4 border border-[#E5E7EB] rounded-xl bg-white space-y-2 animate-pulse">
              <div className="h-4 bg-[#F3F4F6] rounded w-1/4" />
              <div className="h-4 bg-[#F3F4F6] rounded w-3/4" />
              <div className="h-3 bg-[#F3F4F6] rounded w-1/2" />
            </div>
          ))}
        </div>
      )}

      {/* State: Empty */}
      {!isLoading && !isError && filteredNotices.length === 0 && (
        <div className="p-12 border border-[#E5E7EB] rounded-2xl bg-white text-center space-y-2">
          <BookOpen className="w-6 h-6 text-[#9CA3AF] mx-auto" />
          <h3 className="text-sm font-semibold text-[#0A0A0A]">No notices found</h3>
          <p className="text-xs text-[#6B7280]">
            {searchQuery || categoryFilter !== 'All'
              ? 'Try adjusting your search query or category filter.'
              : 'There are no active notices broadcast to your role at this time.'}
          </p>
        </div>
      )}

      {/* State: Notices List */}
      {!isLoading && !isError && pagedNotices.length > 0 && (
        <div className="space-y-3">
          {pagedNotices.map(notice => (
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
              className="p-5 border border-[#E5E7EB] rounded-xl bg-white hover:border-[#D1D5DB] hover:bg-[#FAFAFA] transition-all cursor-pointer text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0A0A0A]"
            >
              <div className="flex items-center gap-2 flex-wrap mb-1.5">
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
                <span className="text-xs font-medium text-[#0A0A0A] bg-[#F3F4F6] px-2 py-0.5 rounded">
                  {notice.category}
                </span>
                <span className="text-[#9CA3AF] text-xs">·</span>
                <span className="text-xs text-[#6B7280]">
                  {formatRelativeTime(notice.date)}
                </span>
                <span className="text-[#9CA3AF] text-xs">·</span>
                <span className="text-xs text-[#9CA3AF]">
                  Posted {formatIstDate(notice.date, { includeYear: true })}
                </span>
              </div>

              <h3 className="text-base font-semibold text-[#0A0A0A] leading-snug">
                {notice.title}
              </h3>

              <p className="text-xs sm:text-sm text-[#4B5563] line-clamp-3 mt-1.5 leading-relaxed whitespace-pre-line">
                {notice.content}
              </p>
            </div>
          ))}

          {/* Load More Button */}
          {hasMore && (
            <div className="pt-4 text-center">
              <button
                type="button"
                onClick={() => setPage(p => p + 1)}
                className="px-5 py-2.5 bg-white border border-[#E5E7EB] hover:bg-[#FAFAFA] text-xs font-semibold text-[#0A0A0A] rounded-xl transition-colors cursor-pointer"
              >
                Load more notices
              </button>
            </div>
          )}
        </div>
      )}

      {/* Detail Modal */}
      <NoticeDetailModal
        isOpen={Boolean(selectedNotice)}
        notice={selectedNotice}
        onClose={() => setSelectedNotice(null)}
      />
    </div>
  );
};

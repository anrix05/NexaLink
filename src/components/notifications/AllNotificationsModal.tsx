import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Bell,
  Briefcase,
  Calendar,
  Megaphone,
  UserCheck,
  ShieldCheck,
  ShieldAlert,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import type { NotificationItem } from '../../types';
import { formatRelativeTime } from '../../utils/notificationHelpers';

interface AllNotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onNavigate: (link?: string) => void;
}

export const AllNotificationsModal: React.FC<AllNotificationsModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkRead,
  onMarkAllRead,
  onNavigate
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [unreadOnly, setUnreadOnly] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const PAGE_SIZE = 10;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  const filtered = useMemo(() => {
    return notifications.filter(n => {
      if (unreadOnly && n.is_read) return false;
      if (selectedCategory === 'all') return true;
      const cat = (n.category || '').toLowerCase();
      const type = (n.type || '').toLowerCase();
      if (selectedCategory === 'opportunity') {
        return cat === 'opportunity' || type.includes('opportunity') || type.includes('job') || type.includes('internship');
      }
      if (selectedCategory === 'event') {
        return cat === 'event' || type.includes('event');
      }
      if (selectedCategory === 'announcement') {
        return cat === 'announcement' || type.includes('announcement');
      }
      if (selectedCategory === 'mentorship') {
        return cat === 'mentorship' || type.includes('mentorship');
      }
      if (selectedCategory === 'admin') {
        return cat === 'admin' || cat === 'verification' || type.includes('admin') || type.includes('verification');
      }
      return true;
    });
  }, [notifications, selectedCategory, unreadOnly]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, currentPage]);

  if (!isOpen) return null;

  const renderIcon = (n: NotificationItem) => {
    const cat = (n.category || '').toLowerCase();
    const type = (n.type || '').toLowerCase();

    if (cat === 'opportunity' || type.includes('opportunity') || type.includes('job') || type.includes('internship')) {
      return <Briefcase className="w-4 h-4 text-emerald-600 shrink-0" />;
    }
    if (cat === 'event' || type.includes('event')) {
      return <Calendar className="w-4 h-4 text-indigo-600 shrink-0" />;
    }
    if (cat === 'announcement' || type.includes('announcement')) {
      return <Megaphone className="w-4 h-4 text-amber-600 shrink-0" />;
    }
    if (cat === 'mentorship' || type.includes('mentorship')) {
      return <UserCheck className="w-4 h-4 text-blue-600 shrink-0" />;
    }
    if (cat === 'verification' || type.includes('verification')) {
      return <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />;
    }
    if (cat === 'admin' || type.includes('admin')) {
      return <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />;
    }
    return <Bell className="w-4 h-4 text-[#0A0A0A] shrink-0" />;
  };

  const categories = [
    { id: 'all', label: 'All' },
    { id: 'opportunity', label: 'Opportunities' },
    { id: 'event', label: 'Events' },
    { id: 'announcement', label: 'Announcements' },
    { id: 'mentorship', label: 'Mentorship' },
    { id: 'admin', label: 'Admin & Verification' }
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="all-notifications-title"
      className="fixed inset-0 z-99999 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 sm:p-6"
      onClick={onClose}
    >
      <div
        className="bg-white border border-[#E5E7EB] rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#E5E7EB] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <h3 id="all-notifications-title" className="text-base font-semibold text-[#0A0A0A]">
              All Notifications
            </h3>
            <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-[#F3F4F6] text-[#4B5563]">
              {filtered.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onMarkAllRead}
              className="text-xs text-[#4B5563] hover:text-[#0A0A0A] font-medium px-2.5 py-1.5 rounded-lg hover:bg-[#F3F4F6] transition flex items-center gap-1.5"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Mark all as read</span>
            </button>
            <button
              type="button"
              aria-label="Close dialog"
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#6B7280] hover:text-[#0A0A0A] hover:bg-[#F3F4F6] transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="px-5 py-3 border-b border-[#E5E7EB] bg-[#FAFAFA] flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            {categories.map(c => (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  setSelectedCategory(c.id);
                  setCurrentPage(1);
                }}
                className={`text-xs px-2.5 py-1 rounded-full font-medium transition cursor-pointer ${
                  selectedCategory === c.id
                    ? 'bg-[#0A0A0A] text-white shadow-xs'
                    : 'bg-white border border-[#E5E7EB] text-[#6B7280] hover:text-[#0A0A0A] hover:bg-[#F3F4F6]'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          <label className="flex items-center gap-2 text-xs text-[#4B5563] cursor-pointer select-none font-medium">
            <input
              type="checkbox"
              checked={unreadOnly}
              onChange={e => {
                setUnreadOnly(e.target.checked);
                setCurrentPage(1);
              }}
              className="w-3.5 h-3.5 accent-[#0A0A0A] rounded cursor-pointer"
            />
            <span>Unread only</span>
          </label>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto divide-y divide-[#E5E7EB] custom-scrollbar">
          {paginated.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
              <Bell className="w-8 h-8 text-[#D1D5DB] mb-2.5" strokeWidth={1.5} />
              <p className="text-sm font-medium text-[#0A0A0A]">No notifications found</p>
              <p className="text-xs text-[#6B7280] mt-0.5">
                {unreadOnly ? 'You have no unread notifications in this view.' : 'No items match your selected filter.'}
              </p>
            </div>
          ) : (
            paginated.map(n => (
              <div
                key={n.id}
                onClick={() => {
                  if (!n.is_read) onMarkRead(n.id);
                  if (n.link) {
                    onClose();
                    onNavigate(n.link);
                  }
                }}
                className={`p-4 flex items-start gap-3 transition cursor-pointer hover:bg-[#F9FAFB] ${
                  n.is_read ? 'bg-white' : 'bg-blue-50/20'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB] flex items-center justify-center shrink-0 mt-0.5">
                  {renderIcon(n)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className={`text-xs truncate ${n.is_read ? 'text-[#374151]' : 'text-[#0A0A0A] font-semibold'}`}>
                      {n.title}
                    </h4>
                    <span className="text-[10px] text-[#9CA3AF] whitespace-nowrap">
                      {formatRelativeTime(n.created_at)}
                    </span>
                  </div>
                  <p className="text-xs text-[#4B5563] mt-0.5 line-clamp-2 leading-relaxed">
                    {n.body}
                  </p>
                  {n.link && (
                    <div className="flex items-center gap-1 text-[11px] text-[#0A0A0A] font-medium mt-1.5">
                      <span>Open</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </div>
                  )}
                </div>

                {!n.is_read && (
                  <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0 mt-1.5" />
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer with Pagination */}
        {totalPages > 1 && (
          <div className="px-5 py-3 border-t border-[#E5E7EB] bg-[#FAFAFA] flex items-center justify-between text-xs text-[#4B5563]">
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-[#E5E7EB] bg-white hover:bg-[#F3F4F6] disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg border border-[#E5E7EB] bg-white hover:bg-[#F3F4F6] disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

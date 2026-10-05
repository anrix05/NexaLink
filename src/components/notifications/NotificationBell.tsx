import React, { useState, useRef, useEffect } from 'react';
import {
  Bell,
  CheckCheck,
  Settings,
  X,
  Briefcase,
  Calendar,
  Megaphone,
  UserCheck,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  SlidersHorizontal,
  ChevronRight
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { formatRelativeTime, groupNotificationsByDate, capUnreadCount } from '../../utils/notificationHelpers';
import type { NotificationItem } from '../../types';
import { AllNotificationsModal } from './AllNotificationsModal';

interface NotificationBellProps {
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
  className?: string;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({
  setActiveTab,
  className = ''
}) => {
  const {
    notifications,
    unreadNotificationCount,
    markNotificationRead,
    markAllNotificationsRead,
    notificationPreferences,
    updateNotificationPreferences
  } = useData();

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showAllModal, setShowAllModal] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Track viewport width for <1024px mobile full-screen sheet
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Click outside to dismiss desktop popover
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!isMobile && containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setShowSettings(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, isMobile]);

  // Lock body scroll when mobile sheet is open
  useEffect(() => {
    if (isMobile && isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobile, isOpen]);

  const latestTwenty = notifications.slice(0, 20);
  const { today, earlier } = groupNotificationsByDate(latestTwenty);

  const handleNotificationClick = (n: NotificationItem) => {
    if (!n.is_read) {
      markNotificationRead(n.id);
    }
    if (n.link && setActiveTab) {
      setIsOpen(false);
      if (n.link.startsWith('messaging?contact=')) {
        setActiveTab('messaging');
      } else {
        setActiveTab(n.link);
      }
    }
  };

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

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        aria-label={`Notifications${unreadNotificationCount > 0 ? `, ${unreadNotificationCount} unread` : ''}`}
        aria-expanded={isOpen}
        onClick={() => {
          setIsOpen(!isOpen);
          setShowSettings(false);
        }}
        className="relative p-2 text-[#4B5563] hover:text-[#0A0A0A] transition rounded-lg border border-[#E5E7EB] hover:bg-[#F9FAFB] bg-white cursor-pointer touch-target-44"
      >
        <Bell className="w-4 h-4" />
        {unreadNotificationCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#0A0A0A] text-white text-[10px] font-mono font-bold flex items-center justify-center shadow-xs">
            {capUnreadCount(unreadNotificationCount)}
          </span>
        )}
      </button>

      {/* Popover (Desktop) or Full-screen Sheet (Mobile) */}
      {isOpen && (
        <div
          className={
            isMobile
              ? 'fixed inset-0 z-99998 bg-white flex flex-col'
              : 'absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-[#E5E7EB] rounded-2xl shadow-xl z-50 overflow-hidden text-xs'
          }
        >
          {/* Header */}
          <div className="px-4 py-3.5 border-b border-[#E5E7EB] flex items-center justify-between bg-white shrink-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm text-[#0A0A0A]">Notifications</h3>
              {unreadNotificationCount > 0 && (
                <span className="text-[11px] font-medium px-2 py-0.2 rounded-full bg-[#F3F4F6] text-[#0A0A0A]">
                  {unreadNotificationCount} unread
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              {unreadNotificationCount > 0 && (
                <button
                  type="button"
                  onClick={markAllNotificationsRead}
                  className="text-xs text-[#4B5563] hover:text-[#0A0A0A] font-medium px-2 py-1 rounded-md hover:bg-[#F3F4F6] transition flex items-center gap-1"
                  title="Mark all as read"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Mark all read</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setShowSettings(!showSettings)}
                className={`p-1.5 rounded-md transition ${
                  showSettings ? 'bg-[#0A0A0A] text-white' : 'text-[#6B7280] hover:text-[#0A0A0A] hover:bg-[#F3F4F6]'
                }`}
                title="Notification preferences"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
              </button>

              {isMobile && (
                <button
                  type="button"
                  aria-label="Close notifications"
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-md text-[#6B7280] hover:text-[#0A0A0A] hover:bg-[#F3F4F6] transition ml-1"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Mute Preferences Tray */}
          {showSettings && (
            <div className="px-4 py-3 bg-[#FAFAFA] border-b border-[#E5E7EB] space-y-2.5 shrink-0 animate-in fade-in duration-100">
              <div className="flex items-center justify-between text-[11px] font-semibold text-[#0A0A0A]">
                <span>Category Mute Preferences</span>
                <span className="text-[10px] text-[#6B7280]">Toggle to silence alerts</span>
              </div>

              <div className="space-y-2 text-xs">
                <label className="flex items-center justify-between cursor-pointer select-none">
                  <span className="text-[#374151]">Opportunities & Internships</span>
                  <input
                    type="checkbox"
                    checked={Boolean(notificationPreferences?.mute_opportunities)}
                    onChange={(e) => updateNotificationPreferences({ mute_opportunities: e.target.checked })}
                    className="w-4 h-4 accent-[#0A0A0A] rounded cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer select-none">
                  <span className="text-[#374151]">Events & Workshops</span>
                  <input
                    type="checkbox"
                    checked={Boolean(notificationPreferences?.mute_events)}
                    onChange={(e) => updateNotificationPreferences({ mute_events: e.target.checked })}
                    className="w-4 h-4 accent-[#0A0A0A] rounded cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer select-none">
                  <span className="text-[#374151]">Institutional Announcements</span>
                  <input
                    type="checkbox"
                    checked={Boolean(notificationPreferences?.mute_announcements)}
                    onChange={(e) => updateNotificationPreferences({ mute_announcements: e.target.checked })}
                    className="w-4 h-4 accent-[#0A0A0A] rounded cursor-pointer"
                  />
                </label>
              </div>
            </div>
          )}

          {/* Notifications Scroll List */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#F3F4F6] max-h-[60vh] sm:max-h-80 custom-scrollbar">
            {latestTwenty.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <div className="w-10 h-10 rounded-full bg-[#F3F4F6] border border-[#E5E7EB] flex items-center justify-center mb-2.5">
                  <Bell className="w-5 h-5 text-[#9CA3AF]" strokeWidth={1.5} />
                </div>
                <p className="text-xs font-semibold text-[#0A0A0A]">You&apos;re all caught up</p>
                <p className="text-[11px] text-[#6B7280] mt-0.5">Check back later for updates and announcements.</p>
              </div>
            ) : (
              <>
                {today.length > 0 && (
                  <div>
                    <div className="px-4 py-1.5 bg-[#FAFAFA] text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider">
                      Today
                    </div>
                    {today.map(n => (
                      <div
                        key={n.id}
                        onClick={() => handleNotificationClick(n)}
                        className={`px-4 py-3 flex items-start gap-3 transition cursor-pointer hover:bg-[#F9FAFB] ${
                          n.is_read ? 'bg-white opacity-85' : 'bg-blue-50/15'
                        }`}
                      >
                        <div className="w-7 h-7 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB] flex items-center justify-center shrink-0 mt-0.5">
                          {renderIcon(n)}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1.5">
                            <h4 className={`text-xs truncate ${n.is_read ? 'text-[#374151]' : 'text-[#0A0A0A] font-semibold'}`}>
                              {n.title}
                            </h4>
                            <span className="text-[10px] text-[#9CA3AF] whitespace-nowrap">
                              {formatRelativeTime(n.created_at)}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#6B7280] truncate mt-0.5">
                            {n.body}
                          </p>
                        </div>

                        {!n.is_read && (
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0 mt-1.5" />
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {earlier.length > 0 && (
                  <div>
                    <div className="px-4 py-1.5 bg-[#FAFAFA] text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider">
                      Earlier
                    </div>
                    {earlier.map(n => (
                      <div
                        key={n.id}
                        onClick={() => handleNotificationClick(n)}
                        className={`px-4 py-3 flex items-start gap-3 transition cursor-pointer hover:bg-[#F9FAFB] ${
                          n.is_read ? 'bg-white opacity-85' : 'bg-blue-50/15'
                        }`}
                      >
                        <div className="w-7 h-7 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB] flex items-center justify-center shrink-0 mt-0.5">
                          {renderIcon(n)}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1.5">
                            <h4 className={`text-xs truncate ${n.is_read ? 'text-[#374151]' : 'text-[#0A0A0A] font-semibold'}`}>
                              {n.title}
                            </h4>
                            <span className="text-[10px] text-[#9CA3AF] whitespace-nowrap">
                              {formatRelativeTime(n.created_at)}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#6B7280] truncate mt-0.5">
                            {n.body}
                          </p>
                        </div>

                        {!n.is_read && (
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0 mt-1.5" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer View All */}
          <div className="p-2.5 border-t border-[#E5E7EB] bg-[#FAFAFA] shrink-0 text-center">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setShowAllModal(true);
              }}
              className="w-full py-1.5 px-3 rounded-lg text-xs font-medium text-[#0A0A0A] hover:bg-white hover:border hover:border-[#E5E7EB] transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>View all notifications</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* All Notifications Modal with Pagination */}
      <AllNotificationsModal
        isOpen={showAllModal}
        onClose={() => setShowAllModal(false)}
        notifications={notifications}
        onMarkRead={markNotificationRead}
        onMarkAllRead={markAllNotificationsRead}
        onNavigate={(link) => {
          if (link && setActiveTab) {
            if (link.startsWith('messaging?contact=')) {
              setActiveTab('messaging');
            } else {
              setActiveTab(link);
            }
          }
        }}
      />
    </div>
  );
};

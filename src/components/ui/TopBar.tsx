import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { NexaMark } from '../brand/NexaMark';
import { StatusBadge } from './StatusBadge';
import { CommandPalette } from '../common/CommandPalette';
import {
  Search,
  Bell,
  CheckCircle2,
  Settings,
  HelpCircle,
  LogOut,
  ChevronDown,
  X
} from 'lucide-react';

export interface TopBarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  className?: string;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  setActiveTab,
  className = '',
}) => {
  const { currentUser, currentRole, logout } = useAuth();
  const { notifications, markNotificationRead, markAllNotificationsRead } = useData();

  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const profileMenuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  const isMac = typeof window !== 'undefined' && (
    /Mac|iPod|iPhone|iPad/.test((navigator as any)?.userAgentData?.platform || navigator?.platform || '')
  );
  const shortcutHint = isMac ? '⌘K' : 'Ctrl K';

  // Close menus on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setProfileMenuOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadNotifications = notifications.filter(n => !n.is_read);
  const unreadCount = unreadNotifications.length;

  const handleLogoClick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setActiveTab('dashboard');
  };

  const getRoleBadgeTone = (role: string) => {
    switch (role) {
      case 'alumni': return 'emerald';
      case 'student': return 'indigo';
      case 'faculty': return 'indigo';
      case 'admin': return 'rose';
      default: return 'neutral';
    }
  };

  return (
    <>
      <header
        className={`h-16 w-full bg-white border-b border-[#E5E7EB] sticky top-0 z-40 px-4 sm:px-8 transition-colors ${className}`}
      >
        <div className="h-full flex items-center justify-between gap-4 max-w-full">
          {/* Left: Brand Identity (links to dashboard for authenticated users) */}
          <button
            type="button"
            onClick={handleLogoClick}
            aria-label="NexaLink Dashboard"
            className="flex items-center gap-2.5 cursor-pointer group shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0A0A0A] rounded-lg p-1"
          >
            <div className="w-8 h-8 rounded-lg bg-[#0A0A0A] text-white flex items-center justify-center">
              <NexaMark data-intro-target="logo" className="w-5 h-5 text-white" />
            </div>
            <span className="text-base font-display font-bold tracking-tight text-[#0A0A0A]">
              NexaLink
            </span>
          </button>

          {/* Center: Search Trigger (borderless #F3F4F6 pill, 40px high, placeholder #6B7280) */}
          <div className="flex-1 max-w-md hidden md:block mx-4">
            <button
              type="button"
              onClick={() => setCommandPaletteOpen(true)}
              aria-label="Search and quick actions (Press Ctrl K)"
              className="w-full h-10 px-4 rounded-full bg-[#F3F4F6] hover:bg-[#E5E7EB] transition-colors flex items-center justify-between cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0A0A0A]"
            >
              <div className="flex items-center gap-2.5 text-xs text-[#6B7280]">
                <Search className="w-4 h-4 text-[#6B7280] shrink-0" />
                <span>Search alumni, opportunities, events...</span>
              </div>
              <kbd className="text-[10px] font-mono text-[#6B7280] bg-white px-2 py-0.5 rounded border border-[#E5E7EB] shadow-2xs pointer-events-none">
                {shortcutHint}
              </kbd>
            </button>
          </div>

          {/* Right: Notifications & Profile Avatar Menu */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Mobile Search Button */}
            <button
              type="button"
              onClick={() => setCommandPaletteOpen(true)}
              aria-label="Search"
              className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg hover:bg-[#F3F4F6] text-[#6B7280] hover:text-[#0A0A0A] transition-colors"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Notifications Popover */}
            <div className="relative" ref={notificationsRef}>
              <button
                type="button"
                aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative w-9 h-9 flex items-center justify-center rounded-lg hover:bg-[#F3F4F6] text-[#6B7280] hover:text-[#0A0A0A] transition-colors cursor-pointer"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#0A0A0A] ring-2 ring-white" />
                )}
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-[#E5E7EB] rounded-xl shadow-sm p-4 space-y-3 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="flex items-center justify-between pb-2 border-b border-[#E5E7EB]">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-semibold text-[#0A0A0A]">Notifications</h4>
                      {unreadCount > 0 && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-full bg-[#0A0A0A] text-white tabular-nums">
                          {unreadCount}
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllNotificationsRead}
                        className="text-[11px] text-[#6B7280] hover:text-[#0A0A0A] transition-colors"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="max-h-72 overflow-y-auto custom-scrollbar space-y-2">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-[#6B7280] py-6 text-center">
                        No notifications at this time
                      </p>
                    ) : (
                      notifications.slice(0, 10).map(n => (
                        <div
                          key={n.id}
                          onClick={() => markNotificationRead(n.id)}
                          className={`p-2.5 rounded-lg border text-xs space-y-1 transition-colors cursor-pointer ${
                            n.is_read
                              ? 'bg-white border-[#E5E7EB] text-[#6B7280]'
                              : 'bg-[#FAFAFA] border-[#0A0A0A]/10 text-[#0A0A0A] font-medium'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-xs text-[#0A0A0A]">{n.title}</span>
                            <span className="text-[10px] text-[#6B7280]">{n.created_at}</span>
                          </div>
                          <p className="text-xs text-[#6B7280] leading-normal">{n.body}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Avatar & Menu */}
            {currentUser && (
              <div className="relative" ref={profileMenuRef}>
                <button
                  type="button"
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  aria-expanded={profileMenuOpen}
                  aria-label="User menu"
                  className="flex items-center gap-2 p-1 rounded-lg hover:bg-[#F3F4F6] transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0A0A0A]"
                >
                  {currentUser.avatar ? (
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.name}
                      className="w-8 h-8 rounded-full object-cover border border-[#E5E7EB]"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-[#0A0A0A] text-white flex items-center justify-center text-xs font-semibold">
                      {currentUser.name ? currentUser.name.slice(0, 2).toUpperCase() : 'NL'}
                    </div>
                  )}
                  <ChevronDown className="w-3.5 h-3.5 text-[#6B7280] hidden sm:block" />
                </button>

                {profileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white border border-[#E5E7EB] rounded-xl shadow-sm p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="p-3 border-b border-[#E5E7EB] space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-[#0A0A0A] truncate">
                          {currentUser.name}
                        </span>
                        <StatusBadge
                          label={currentRole}
                          tone={getRoleBadgeTone(currentRole)}
                          size="sm"
                        />
                      </div>
                      <p className="text-[11px] text-[#6B7280] truncate">{currentUser.email}</p>
                    </div>

                    <div className="py-1">
                      <button
                        type="button"
                        onClick={() => {
                          setProfileMenuOpen(false);
                          setActiveTab('settings');
                        }}
                        className="w-full px-3 py-2 text-xs text-left text-[#0A0A0A] hover:bg-[#FAFAFA] rounded-lg flex items-center gap-2.5 transition-colors cursor-pointer"
                      >
                        <Settings className="w-4 h-4 text-[#6B7280]" />
                        <span>Settings</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setProfileMenuOpen(false);
                          setActiveTab('landing');
                        }}
                        className="w-full px-3 py-2 text-xs text-left text-[#0A0A0A] hover:bg-[#FAFAFA] rounded-lg flex items-center gap-2.5 transition-colors cursor-pointer"
                      >
                        <HelpCircle className="w-4 h-4 text-[#6B7280]" />
                        <span>About NexaLink</span>
                      </button>
                    </div>

                    <div className="pt-1 border-t border-[#E5E7EB]">
                      <button
                        type="button"
                        onClick={() => {
                          setProfileMenuOpen(false);
                          logout();
                        }}
                        className="w-full px-3 py-2 text-xs text-left text-[#991B1B] hover:bg-[#FEE2E2]/40 rounded-lg flex items-center gap-2.5 transition-colors cursor-pointer"
                      >
                        <LogOut className="w-4 h-4 text-[#991B1B]" />
                        <span>Log out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Global Command Palette */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        setActiveTab={setActiveTab}
      />
    </>
  );
};

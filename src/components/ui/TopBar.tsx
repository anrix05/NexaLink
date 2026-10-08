import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../context/AuthContext';
import { NexaMark } from '../brand/NexaMark';
import { StatusBadge } from './StatusBadge';
import { Avatar } from '../../utils/avatarHelper';
import { getUserEmails } from '../../utils/userEmails';
import { CommandPalette } from '../common/CommandPalette';
import {
  Search,
  Settings,
  HelpCircle,
  LogOut,
  X
} from 'lucide-react';

import { NotificationBell } from '../notifications/NotificationBell';

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

  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const profileMenuRef = useRef<HTMLDivElement>(null);
  const avatarButtonRef = useRef<HTMLButtonElement>(null);
  const mobileSheetRef = useRef<HTMLDivElement>(null);

  const isMac = typeof window !== 'undefined' && (
    /Mac|iPod|iPhone|iPad/.test((navigator as any)?.userAgentData?.platform || navigator?.platform || '')
  );
  const shortcutHint = isMac ? '⌘K' : 'Ctrl K';

  const handleCloseMenu = useCallback(() => {
    setProfileMenuOpen(false);
    avatarButtonRef.current?.focus();
  }, []);

  // Handle ESC key to close profile menu and restore focus to avatar button
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && profileMenuOpen) {
        e.preventDefault();
        handleCloseMenu();
      }
    };

    if (profileMenuOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [profileMenuOpen, handleCloseMenu]);

  // Lock scroll, inert BottomNav, and trap focus while mobile sheet is open
  useEffect(() => {
    if (!profileMenuOpen) return;
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;
    if (!isMobile) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const bottomNav = document.querySelector('nav[aria-label="Primary"]');
    if (bottomNav) {
      bottomNav.setAttribute('inert', '');
      bottomNav.setAttribute('aria-hidden', 'true');
    }

    const focusTimer = setTimeout(() => {
      const focusables = mobileSheetRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
      );
      if (focusables && focusables.length > 0) {
        focusables[0].focus();
      }
    }, 50);

    const handleFocusTrap = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const focusables = mobileSheetRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
      );
      if (!focusables || focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener('keydown', handleFocusTrap);

    return () => {
      clearTimeout(focusTimer);
      document.body.style.overflow = originalOverflow;
      if (bottomNav) {
        bottomNav.removeAttribute('inert');
        bottomNav.removeAttribute('aria-hidden');
      }
      window.removeEventListener('keydown', handleFocusTrap);
    };
  }, [profileMenuOpen]);

  // Click outside to close desktop popover
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        profileMenuRef.current?.contains(target) ||
        mobileSheetRef.current?.contains(target) ||
        avatarButtonRef.current?.contains(target)
      ) {
        return;
      }
      setProfileMenuOpen(false);
    };
    if (profileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [profileMenuOpen]);

  const handleLogoClick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setActiveTab('dashboard');
  };

  const getRoleBadgeTone = (_role: string) => {
    return 'indigo' as const;
  };

  const userEmails = currentUser ? getUserEmails(currentUser) : null;
  const displayEmail = userEmails?.displayEmail || currentUser?.email || '';

  return (
    <>
      <header
        className={`sticky top-0 z-30 w-full bg-white border-b border-[#E5E7EB] transition-colors h-14 lg:h-16 pt-[env(safe-area-inset-top)] px-4 lg:px-6 ${className}`}
      >
        <div className="h-full flex items-center justify-between gap-4 max-w-full">
          {/* Left: Brand Identity (aligned with sidebar item padding) */}
          <button
            type="button"
            onClick={handleLogoClick}
            aria-label="NexaLink Dashboard"
            className="flex items-center gap-2.5 cursor-pointer group shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0A0A0A] focus-visible:ring-offset-2 rounded-lg p-1 -ml-1 transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-[#0A0A0A] text-white flex items-center justify-center shrink-0">
              <NexaMark data-intro-target="logo" className="w-5 h-5 text-white" />
            </div>
            <span className="text-base font-display font-bold tracking-tight text-[#0A0A0A]">
              NexaLink
            </span>
          </button>

          {/* Center: Search Trigger (Desktop: max-w-[560px], 40px, #F3F4F6, Inter 11px keycap, hidden <1024px) */}
          <div className="flex-1 max-w-[560px] hidden lg:block mx-4">
            <button
              type="button"
              onClick={() => setCommandPaletteOpen(true)}
              aria-label={`Search people, jobs, events (${shortcutHint})`}
              className="w-full h-10 px-4 rounded-lg bg-[#F3F4F6] hover:bg-[#E5E7EB] transition-colors flex items-center justify-between cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0A0A0A] focus-visible:ring-offset-2 border-0"
            >
              <div className="flex items-center gap-2.5 text-xs text-[#6B7280]">
                <Search className="w-4 h-4 text-[#6B7280] shrink-0" />
                <span>Search people, jobs, events</span>
              </div>
              <kbd className="text-[11px] font-sans font-medium text-[#6B7280] bg-white px-2 py-0.5 rounded border border-[#E5E7EB] pointer-events-none">
                {shortcutHint}
              </kbd>
            </button>
          </div>

          {/* Right Controls: Search (mobile), Bell, Avatar (All borderless ghost buttons, 40px desktop / 44px mobile touch target) */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Mobile Search Trigger (<1024px) */}
            <button
              type="button"
              onClick={() => setCommandPaletteOpen(true)}
              aria-label="Search people, jobs, events"
              className="lg:hidden w-11 h-11 lg:w-10 lg:h-10 flex items-center justify-center rounded-lg text-[#4B5563] hover:text-[#0A0A0A] hover:bg-[#F3F4F6] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0A0A0A] focus-visible:ring-offset-2 transition-colors border-0 bg-transparent cursor-pointer touch-target-44"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Bell Notification Trigger */}
            <NotificationBell activeTab={activeTab} setActiveTab={setActiveTab} />

            {/* User Avatar Button (36px avatar inside borderless ghost button) */}
            {currentUser && (
              <div className="relative">
                <button
                  ref={avatarButtonRef}
                  type="button"
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  aria-expanded={profileMenuOpen}
                  aria-haspopup="dialog"
                  aria-label={`User menu for ${currentUser.name || 'User'}`}
                  className="w-11 h-11 lg:w-10 lg:h-10 flex items-center justify-center rounded-lg hover:bg-[#F3F4F6] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0A0A0A] focus-visible:ring-offset-2 transition-colors cursor-pointer border-0 bg-transparent touch-target-44"
                >
                  <div className="w-9 h-9 rounded-full ring-1 ring-[#E5E7EB] overflow-hidden flex items-center justify-center">
                    <Avatar
                      src={currentUser.avatar}
                      name={currentUser.name || 'User'}
                      size="sm"
                    />
                  </div>
                </button>

                {/* Desktop Popover (>=1024px) */}
                {profileMenuOpen && (
                  <>
                    <div
                      ref={profileMenuRef}
                      role="dialog"
                      aria-label="User account menu"
                      className="hidden lg:block absolute right-0 mt-2 w-72 bg-white border border-[#E5E7EB] rounded-xl shadow-lg p-2 z-50 animate-in fade-in zoom-in-95 duration-100"
                    >
                      <div className="p-3 border-b border-[#E5E7EB] space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-full ring-1 ring-[#E5E7EB] shrink-0 overflow-hidden">
                              <Avatar
                                src={currentUser.avatar}
                                name={currentUser.name || 'User'}
                                size="sm"
                              />
                            </div>
                            <span className="text-xs font-semibold text-[#0A0A0A] truncate">
                              {currentUser.name}
                            </span>
                          </div>
                          <StatusBadge
                            label={currentRole.charAt(0).toUpperCase() + currentRole.slice(1).toLowerCase()}
                            tone={getRoleBadgeTone(currentRole)}
                            size="sm"
                          />
                        </div>
                        {displayEmail && (
                          <p className="text-[11px] text-[#6B7280] truncate font-sans pl-10.5">
                            {displayEmail}
                          </p>
                        )}
                      </div>

                      <div className="py-1">
                        <button
                          type="button"
                          onClick={() => {
                            setProfileMenuOpen(false);
                            setActiveTab('settings');
                          }}
                          className="w-full px-3 py-2.5 text-xs text-left text-[#0A0A0A] hover:bg-[#FAFAFA] rounded-lg flex items-center gap-2.5 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0A0A0A]"
                        >
                          <Settings className="w-4 h-4 text-[#6B7280]" />
                          <span>Profile and settings</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setProfileMenuOpen(false);
                            setActiveTab('feedback');
                          }}
                          className="w-full px-3 py-2.5 text-xs text-left text-[#0A0A0A] hover:bg-[#FAFAFA] rounded-lg flex items-center gap-2.5 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0A0A0A]"
                        >
                          <HelpCircle className="w-4 h-4 text-[#6B7280]" />
                          <span>Help</span>
                        </button>
                      </div>

                      <div className="pt-1 border-t border-[#E5E7EB]">
                        <button
                          type="button"
                          onClick={() => {
                            setProfileMenuOpen(false);
                            logout();
                          }}
                          className="w-full px-3 py-2.5 text-xs text-left text-[#EF4444] hover:bg-rose-50/50 rounded-lg flex items-center gap-2.5 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0A0A0A]"
                        >
                          <LogOut className="w-4 h-4 text-[#EF4444]" />
                          <span>Sign out</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Avatar Bottom Sheet (<1024px) rendered via Portal at document root */}
      {currentUser && profileMenuOpen && typeof document !== 'undefined' && createPortal(
        <div className="lg:hidden">
          {/* Viewport Overlay covering bottom bar */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[100] transition-opacity"
            onClick={handleCloseMenu}
          />

          {/* Sheet Container */}
          <div
            ref={mobileSheetRef}
            role="dialog"
            aria-modal="true"
            aria-label="User account menu"
            tabIndex={-1}
            className="fixed inset-x-0 bottom-0 bg-white rounded-t-2xl border-t border-[#E5E7EB] z-[101] max-h-[calc(100dvh-24px-env(safe-area-inset-top))] overflow-y-auto pb-[calc(env(safe-area-inset-bottom)+16px)] animate-in slide-in-from-bottom duration-200 shadow-2xl focus:outline-none font-sans"
          >
            {/* Grab Handle */}
            <div className="w-10 h-1 bg-[#E5E7EB] rounded-full mx-auto my-3" />

            {/* Row 1: User Header (48px min-height) */}
            <div className="flex items-center justify-between px-4 pb-3 border-b border-[#E5E7EB] min-h-[48px] gap-2">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full ring-1 ring-[#E5E7EB] shrink-0 overflow-hidden flex items-center justify-center">
                  <Avatar
                    src={currentUser.avatar}
                    name={currentUser.name || 'User'}
                    size="sm"
                  />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-[#0A0A0A] truncate">
                    {currentUser.name}
                  </div>
                  {displayEmail && (
                    <div className="text-[11px] text-[#6B7280] truncate font-sans">
                      {displayEmail}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <StatusBadge
                  label={currentRole.charAt(0).toUpperCase() + currentRole.slice(1).toLowerCase()}
                  tone={getRoleBadgeTone(currentRole)}
                  size="sm"
                />
                <button
                  type="button"
                  aria-label="Close menu"
                  onClick={handleCloseMenu}
                  className="w-11 h-11 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-[#6B7280] hover:text-[#0A0A0A] hover:bg-[#F3F4F6] transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Navigable Rows (All 48px height) */}
            <div className="py-2">
              {/* Profile and Settings */}
              <button
                type="button"
                onClick={() => {
                  handleCloseMenu();
                  setActiveTab('settings');
                }}
                className="w-full h-12 min-h-[48px] px-4 text-xs sm:text-sm text-left text-[#0A0A0A] hover:bg-[#FAFAFA] active:bg-[#F3F4F6] flex items-center gap-3 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0A0A0A] border-0 bg-transparent touch-target-44"
              >
                <Settings className="w-4 h-4 text-[#6B7280] shrink-0" />
                <span className="font-medium">Profile and settings</span>
              </button>

              {/* Help */}
              <button
                type="button"
                onClick={() => {
                  handleCloseMenu();
                  setActiveTab('feedback');
                }}
                className="w-full h-12 min-h-[48px] px-4 text-xs sm:text-sm text-left text-[#0A0A0A] hover:bg-[#FAFAFA] active:bg-[#F3F4F6] flex items-center gap-3 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0A0A0A] border-0 bg-transparent touch-target-44"
              >
                <HelpCircle className="w-4 h-4 text-[#6B7280] shrink-0" />
                <span className="font-medium">Help</span>
              </button>
            </div>

            {/* Hairline Separator */}
            <div className="border-t border-[#E5E7EB] pt-1">
              {/* Sign out */}
              <button
                type="button"
                onClick={() => {
                  handleCloseMenu();
                  logout();
                }}
                className="w-full h-12 min-h-[48px] px-4 text-xs sm:text-sm text-left text-[#DC2626] hover:bg-rose-50/50 active:bg-rose-100/50 flex items-center gap-3 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0A0A0A] border-0 bg-transparent touch-target-44"
              >
                <LogOut className="w-4 h-4 text-[#DC2626] shrink-0" />
                <span className="font-semibold text-rose-600">Sign out</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Global Command Palette */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        setActiveTab={setActiveTab}
      />
    </>
  );
};

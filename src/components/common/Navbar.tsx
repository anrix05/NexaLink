import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { LogoMark } from './LogoMark';
import { Badge } from './UIComponents';
import { CommandPalette } from './CommandPalette';
import {
  Bell,
  Menu,
  X,
  LogIn,
  LogOut,
  Search,
  CheckCircle2,
  Sparkles,
  Shield,
  ExternalLink,
  ChevronDown
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const {
    currentUser,
    currentRole,
    isAuthenticated,
    logout,
    notificationCount,
    clearNotifications
  } = useAuth();

  const { notifications, markNotificationRead, markAllNotificationsRead } = useData();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  // Global Cmd+K / Ctrl+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close popovers on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.navbar-popover-container')) {
        setShowNotifications(false);
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const scrollToSection = (sectionId: string) => {
    if (activeTab !== 'landing') {
      setActiveTab('landing');
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const isUnverified = isAuthenticated && currentUser && (currentUser.isVerified === false || currentUser.verificationStatus === 'Pending Verification' || currentUser.verificationStatus === 'Needs Clarification');
  const isPublicView = activeTab === 'landing' || activeTab === 'auth' || !isAuthenticated || !currentUser;

  const handleLogoClick = () => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    setActiveTab('landing');
  };

  const handleLogoutAction = () => {
    logout();
    setShowProfileMenu(false);
    setActiveTab('landing');
  };

  if (isUnverified && !isPublicView) {
    return (
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/95 border-b border-[#E5E7EB] transition-all w-full max-w-full overflow-x-clip">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand Logo */}
            <div
              onClick={handleLogoClick}
              className="flex items-center gap-2.5 shrink-0 cursor-pointer"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-[#0A0A0A] text-white flex items-center justify-center">
                <LogoMark className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <span className="text-base font-display font-black tracking-tight text-[#0A0A0A]">
                NexaLink
              </span>
            </div>

            {/* Minimal Unverified User Profile & Sign Out */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                {currentUser.avatar ? (
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover border border-[#E5E7EB] shrink-0"
                  />
                ) : (
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#0A0A0A] text-white flex items-center justify-center shrink-0 border border-[#E5E7EB] text-[10px] sm:text-[11px] font-bold font-mono tracking-wider">
                    {currentUser.name ? currentUser.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : 'U'}
                  </div>
                )}
                <span className="text-xs font-bold text-[#0A0A0A] hidden sm:inline">
                  {currentUser.name}
                </span>
              </div>
              <button
                onClick={handleLogoutAction}
                className="px-3 py-1.5 bg-white border border-[#E5E7EB] hover:bg-[#FAFAFA] text-[#0A0A0A] font-bold text-xs rounded-lg flex items-center gap-1.5 transition cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <>
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/95 border-b border-[#E5E7EB] transition-all w-full max-w-full overflow-x-clip">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo */}
          <div
            onClick={handleLogoClick}
            className="flex items-center gap-2.5 cursor-pointer group shrink-0"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-[#0A0A0A] text-white flex items-center justify-center transition-transform">
              <LogoMark className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <span className="text-base font-display font-black tracking-tight text-[#0A0A0A]">
              NexaLink
            </span>
          </div>

          {/* Middle Section: Global Search Command Bar or Public Navigation */}
          {isPublicView ? (
            <nav className="hidden lg:flex items-center gap-7 text-xs font-display font-bold uppercase tracking-wider">
              <button
                onClick={() => scrollToSection('hero-section')}
                className="text-[#6B7280] hover:text-[#0A0A0A] transition cursor-pointer"
              >
                Overview
              </button>

              <button
                onClick={() => scrollToSection('framework-section')}
                className="text-[#6B7280] hover:text-[#0A0A0A] transition cursor-pointer"
              >
                How it Works
              </button>

              <button
                onClick={() => scrollToSection('benefits-section')}
                className="text-[#6B7280] hover:text-[#0A0A0A] transition cursor-pointer"
              >
                Platform Benefits
              </button>

              <button
                onClick={() => scrollToSection('programs-section')}
                className="text-[#6B7280] hover:text-[#0A0A0A] transition cursor-pointer"
              >
                Academic Programs
              </button>
            </nav>
          ) : (
            <div className="hidden md:flex items-center flex-1 max-w-md mx-6 lg:mx-8">
              <div
                onClick={() => setCommandPaletteOpen(true)}
                className="relative w-full cursor-pointer"
              >
                <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  readOnly
                  placeholder="Search alumni by company (e.g. Google), skill, batch..."
                  className="w-full bg-[#FAFAFA] hover:bg-[#F3F4F6] border border-[#E5E7EB] rounded-lg px-4 pl-10 pr-12 py-2 text-xs font-sans text-[#0A0A0A] placeholder:text-[#9CA3AF] focus:outline-none focus:bg-white focus:border-[#0A0A0A] transition cursor-pointer"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-mono text-[#9CA3AF] bg-white px-1.5 py-0.5 rounded border border-[#E5E7EB] pointer-events-none">
                  ⌘K
                </span>
              </div>
            </div>
          )}

          {/* Right Action Controls */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            
            {isPublicView ? (
              <>
                <button
                  onClick={() => {
                    if (isAuthenticated && currentUser) {
                      setActiveTab('dashboard');
                    } else {
                      setActiveTab('auth');
                    }
                  }}
                  className="px-2.5 sm:px-4 py-2 bg-[#0A0A0A] hover:bg-[#222222] text-white font-display font-bold text-xs uppercase tracking-wider transition rounded-lg flex items-center gap-2 cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5 shrink-0" />
                  <span className="hidden sm:inline">{isAuthenticated && currentUser ? 'Return to Dashboard' : 'Portal Access'}</span>
                </button>

                {/* Mobile Public Navigation Menu Button */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="lg:hidden inline-flex items-center justify-center p-2 text-[#6B7280] hover:text-[#0A0A0A] border border-[#E5E7EB] rounded-lg touch-target-44"
                  title="Menu"
                >
                  {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              </>
            ) : (
              <>
                {/* Mobile Search Command Palette Trigger */}
                <button
                  type="button"
                  onClick={() => setCommandPaletteOpen(true)}
                  className="md:hidden inline-flex items-center justify-center p-2 text-[#6B7280] hover:text-[#0A0A0A] transition rounded-lg border border-[#E5E7EB] hover:bg-[#FAFAFA] bg-white touch-target-44"
                  title="Search Network (Cmd+K)"
                >
                  <Search className="w-4 h-4" />
                </button>

                {/* Notifications Dropdown */}
                <div className="relative navbar-popover-container">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowNotifications(!showNotifications);
                      setShowProfileMenu(false);
                      if (notificationCount > 0) clearNotifications();
                    }}
                    className="p-2 text-[#6B7280] hover:text-[#0A0A0A] transition relative rounded-lg border border-[#E5E7EB] hover:bg-[#FAFAFA] bg-white touch-target-44"
                    title="Notifications"
                  >
                    <Bell className="w-4 h-4" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#0A0A0A] text-white text-[9px] font-mono font-bold flex items-center justify-center">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-[#E5E7EB] rounded-xl shadow-2xl p-4 z-50 text-xs space-y-3 font-sans animate-in fade-in zoom-in-95 duration-150">
                      <div className="flex items-center justify-between pb-2.5 border-b border-[#E5E7EB] font-display font-bold uppercase text-[10px] text-[#6B7280] tracking-wider">
                        <span>Notifications & Alerts</span>
                        <span className="px-2 py-0.5 bg-[#FAFAFA] border border-[#E5E7EB] rounded-full text-[#0A0A0A] font-mono">
                          {unreadCount} Unread
                        </span>
                      </div>

                      <div className="space-y-2 max-h-72 overflow-y-auto custom-scrollbar">
                        {notifications.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-8 text-center px-4">
                            <Bell className="w-8 h-8 text-[#E5E7EB] mb-3" strokeWidth={1} />
                            <p className="text-[#6B7280] text-sm font-medium">All caught up</p>
                            <p className="text-[#9CA3AF] text-xs mt-1">Check back later for updates</p>
                          </div>
                        ) : (
                          <>
                            {unreadCount > 0 && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAllNotificationsRead();
                                }}
                                className="w-full text-right text-[10px] uppercase font-bold tracking-wider text-[#0A0A0A] hover:text-[#4B5563] mb-1"
                              >
                                Mark all as read
                              </button>
                            )}
                            {notifications.map(n => (
                              <div
                                key={n.id}
                                onClick={() => {
                                  markNotificationRead(n.id);
                                  if (n.link) {
                                    if (n.link.startsWith('messaging?contact=')) {
                                      setActiveTab('messaging');
                                      // The MessagingPage will need to handle setting the activeContactId via URL/State if we were navigating,
                                      // but currently NexaLink doesn't parse URL query params for contactId in MessagingPage.
                                      // It relies on global state or clicking the user.
                                    } else {
                                      setActiveTab(n.link);
                                    }
                                  }
                                  setShowNotifications(false);
                                }}
                                className={`p-3 rounded-lg border cursor-pointer transition ${
                                  n.is_read
                                    ? 'bg-[#FAFAFA] border-[#E5E7EB] opacity-75'
                                    : 'bg-white border-[#0A0A0A] text-[#0A0A0A] font-medium'
                                }`}
                              >
                                <div className="flex items-center justify-between font-display font-bold text-[10px] uppercase text-[#0A0A0A] mb-1">
                                  <span>{n.title}</span>
                                  <span className="text-[#9CA3AF] font-mono text-[9px]">{n.type}</span>
                                </div>
                                <p className="text-[#374151] text-[11px] leading-snug font-medium">
                                  {n.body}
                                </p>
                                <span className="block text-[9px] font-mono text-[#9CA3AF] mt-1">
                                  {n.created_at}
                                </span>
                              </div>
                            ))}
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Profile Identity Card & Dropdown Menu */}
                <div className="relative navbar-popover-container">
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowProfileMenu(!showProfileMenu);
                      setShowNotifications(false);
                    }}
                    className="flex items-center gap-2 cursor-pointer hover:bg-[#FAFAFA] transition rounded-lg p-1 sm:p-1.5 sm:pr-2.5 border border-[#E5E7EB] bg-white touch-target-44"
                    title="User Profile & Settings"
                  >
                    {currentUser.avatar ? (
                      <img
                        src={currentUser.avatar}
                        alt={currentUser.name}
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover border border-[#E5E7EB] shrink-0"
                      />
                    ) : (
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#0A0A0A] text-white flex items-center justify-center shrink-0 border border-[#E5E7EB] text-[10px] sm:text-[11px] font-bold font-mono tracking-wider">
                        {currentUser.name ? currentUser.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : 'U'}
                      </div>
                    )}
                    <div className="hidden sm:block text-left min-w-0">
                      <p className="text-xs font-bold text-[#0A0A0A] truncate leading-none">
                        {currentUser.name.split(' ')[0]}
                      </p>
                      <Badge variant="indigo" size="sm" className="mt-0.5 text-[9px] px-1.5 py-0">
                        {currentRole}
                      </Badge>
                    </div>
                    <ChevronDown className={`w-3 h-3 text-[#9CA3AF] hidden sm:block transition-transform duration-200 ${showProfileMenu ? 'rotate-180' : ''}`} />
                  </div>

                  {/* Profile Menu Popover */}
                  {showProfileMenu && (
                    <div className="absolute right-0 mt-2 w-64 bg-white border border-[#E5E7EB] rounded-xl shadow-2xl p-3 z-50 text-xs space-y-2 font-sans animate-in fade-in zoom-in-95 duration-150">
                      {/* User Masthead */}
                      <div className="p-2 bg-[#FAFAFA] border border-[#E5E7EB] rounded-lg">
                        <div className="flex items-center gap-2.5">
                          {currentUser.avatar ? (
                            <img
                              src={currentUser.avatar}
                              alt={currentUser.name}
                              className="w-9 h-9 rounded-full object-cover border border-[#E5E7EB]"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-[#0A0A0A] text-white flex items-center justify-center border border-[#E5E7EB] text-xs font-bold font-mono tracking-wider shrink-0">
                              {currentUser.name ? currentUser.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : 'U'}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-bold text-xs text-[#0A0A0A] truncate">
                              {currentUser.name}
                            </p>
                            <p className="text-[10px] font-mono text-[#6B7280] truncate">
                              {currentUser.email || `${currentUser.name.toLowerCase().replace(/\s+/g, '.')}@vit.edu.in`}
                            </p>
                          </div>
                        </div>
                        <div className="mt-2 pt-2 border-t border-[#E5E7EB] flex items-center justify-between">
                          <span className="text-[10px] font-mono font-bold uppercase text-[#9CA3AF]">Role</span>
                          <Badge variant="indigo" size="sm">
                            {currentRole.toUpperCase()}
                          </Badge>
                        </div>
                      </div>

                      {/* Menu Options */}
                      <div className="space-y-1 pt-1">
                        <button
                          onClick={() => {
                            setActiveTab('settings');
                            setShowProfileMenu(false);
                          }}
                          className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-xs font-medium text-[#0A0A0A] hover:bg-[#F3F4F6] transition"
                        >
                          <span>Profile & Privacy Settings</span>
                          <ChevronDown className="w-3.5 h-3.5 -rotate-90 text-[#9CA3AF]" />
                        </button>

                        <button
                          onClick={() => {
                            setCommandPaletteOpen(true);
                            setShowProfileMenu(false);
                          }}
                          className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-xs font-medium text-[#0A0A0A] hover:bg-[#F3F4F6] transition"
                        >
                          <span>Command Palette</span>
                          <span className="text-[9px] font-mono text-[#9CA3AF] bg-[#FAFAFA] border border-[#E5E7EB] px-1.5 py-0.5 rounded">⌘K</span>
                        </button>
                      </div>

                      {/* Logout Action */}
                      <div className="pt-2 border-t border-[#E5E7EB]">
                        <button
                          onClick={handleLogoutAction}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-xs font-bold text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Log Out of NexaLink</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

          </div>

        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-[#E5E7EB] px-4 pt-2 pb-6 space-y-3 font-sans text-xs animate-in slide-in-from-top-2">
          {!isAuthenticated ? (
            <div className="space-y-2 font-bold uppercase text-[11px]">
              <button
                onClick={() => { scrollToSection('hero-section'); setMobileMenuOpen(false); }}
                className="block w-full text-left py-2 text-[#6B7280] hover:text-[#0A0A0A]"
              >
                Overview
              </button>
              <button
                onClick={() => { scrollToSection('framework-section'); setMobileMenuOpen(false); }}
                className="block w-full text-left py-2 text-[#6B7280] hover:text-[#0A0A0A]"
              >
                How it Works
              </button>
              <button
                onClick={() => { scrollToSection('benefits-section'); setMobileMenuOpen(false); }}
                className="block w-full text-left py-2 text-[#6B7280] hover:text-[#0A0A0A]"
              >
                Platform Benefits
              </button>
              <button
                onClick={() => { scrollToSection('programs-section'); setMobileMenuOpen(false); }}
                className="block w-full text-left py-2 text-[#6B7280] hover:text-[#0A0A0A]"
              >
                Academic Programs
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <input
                type="text"
                value={globalSearch}
                onChange={e => setGlobalSearch(e.target.value)}
                placeholder="Search alumni, companies, skills..."
                className="w-full bg-[#FAFAFA] border border-[#E5E7EB] rounded-lg px-3 py-2 text-xs text-[#0A0A0A]"
              />
            </div>
          )}
        </div>
      )}

      </header>

      {/* Command Palette Modal */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        setActiveTab={setActiveTab}
      />
    </>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { NexaMark } from '../brand/NexaMark';
import { Badge } from './UIComponents';
import { CommandPalette } from './CommandPalette';
import { formatDisplayName } from '../../utils/validators';
import {
  Bell,
  Menu,
  X,
  LogIn,
  LogOut,
  Search,
  CheckCircle2,
  ChevronDown,
  ArrowRight
} from 'lucide-react';
import { NotificationBell } from '../notifications/NotificationBell';

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
    switchRole,
    notificationCount,
    clearNotifications
  } = useAuth();

  const { notifications, markNotificationRead, markAllNotificationsRead } = useData();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [scrolledPastHero, setScrolledPastHero] = useState(false);
  const [navVisible, setNavVisible] = useState(true);
  const [activeSection, setActiveSection] = useState('overview');
  const lastScrollY = useRef(0);

  const isMac = typeof window !== 'undefined' && (
    /Mac|iPod|iPhone|iPad/.test((navigator as any)?.userAgentData?.platform || navigator?.platform || '')
  );
  const shortcutHint = isMac ? '⌘K' : 'Ctrl K';

  const isPublicView = activeTab === 'landing' || activeTab === 'auth' || activeTab === 'reset-password' || !isAuthenticated || !currentUser;

  // Scroll direction and header backdrop-blur tracking for public view
  useEffect(() => {
    if (!isPublicView) {
      setNavVisible(true);
      setScrolledPastHero(false);
      return;
    }

    const handleScroll = () => {
      const currentY = window.scrollY;
      setScrolledPastHero(currentY > 40);

      if (currentY > 120) {
        if (currentY > lastScrollY.current + 6) {
          setNavVisible(false); // scrolling down
        } else if (currentY < lastScrollY.current - 6) {
          setNavVisible(true); // scrolling up
        }
      } else {
        setNavVisible(true);
      }
      lastScrollY.current = currentY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isPublicView]);

  // Active section observer on landing page
  useEffect(() => {
    if (activeTab !== 'landing') return;

    const sectionIds = ['overview', 'features', 'how-it-works', 'roles', 'campus', 'academic', 'departments'];
    const observers: IntersectionObserver[] = [];

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setActiveSection(id);
          }
        },
        { threshold: 0.25, rootMargin: '-64px 0px -40% 0px' }
      );

      observer.observe(el);
      observers.push(observer);
    });

    return () => {
      observers.forEach((obs) => obs.disconnect());
    };
  }, [activeTab]);

  // Close mobile menu on Esc
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  const getSearchPlaceholder = () => {
    if (currentRole === 'student') return 'Search alumni, companies, skills...';
    if (currentRole === 'alumni') return 'Search people, companies, opportunities...';
    if (currentRole === 'faculty') return 'Search students, alumni, research areas...';
    if (currentRole === 'admin') return 'Search users, requests, audit log...';
    return 'Search alumni, companies, skills...';
  };

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

  const handleLogoClick = () => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    if (isAuthenticated && currentUser) {
      setActiveTab('dashboard');
    } else {
      setActiveTab('landing');
    }
  };

  const handleLogoutAction = () => {
    logout();
    setShowProfileMenu(false);
    setActiveTab('landing');
  };

  if (isUnverified && !isPublicView) {
    return (
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/95 border-b border-[#E5E7EB] transition-all w-full max-w-full overflow-x-clip">
        <div className="app-container">
          <div className="flex items-center justify-between h-16">
            {/* Brand Logo */}
            <div
              onClick={handleLogoClick}
              className="flex items-center gap-2.5 shrink-0 cursor-pointer"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-[#0A0A0A] text-white flex items-center justify-center">
                <NexaMark className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <span className="text-base font-display font-bold tracking-tight text-[#0A0A0A]">
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
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#0A0A0A] text-white flex items-center justify-center shrink-0 border border-[#E5E7EB] text-[10px] sm:text-[11px] font-bold font-sans">
                    {currentUser.name ? currentUser.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : 'U'}
                  </div>
                )}
                <span className="text-xs font-medium text-[#0A0A0A] hidden sm:inline">
                  {currentUser.name}
                </span>
              </div>
              <button
                onClick={handleLogoutAction}
                className="px-3 py-1.5 bg-white border border-[#E5E7EB] hover:bg-[#FAFAFA] text-[#0A0A0A] font-medium text-xs rounded-lg flex items-center gap-1.5 transition cursor-pointer touch-target-44"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign out</span>
              </button>
            </div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <>
      <header
        className={`sticky top-0 z-50 transition-all duration-300 w-full max-w-full overflow-x-clip ${
          !isPublicView
            ? 'backdrop-blur-md bg-white/95 border-b border-[#E5E7EB]'
            : `${navVisible ? 'translate-y-0' : '-translate-y-full'} ${
                scrolledPastHero
                  ? 'backdrop-blur-md bg-white/90 border-b border-[#E5E7EB]'
                  : 'bg-transparent border-b border-transparent'
              }`
        }`}
      >
        <div className="app-container px-2.5 sm:px-4 lg:px-8">
          <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo */}
          <div
            onClick={handleLogoClick}
            className="flex items-center gap-1.5 sm:gap-2.5 cursor-pointer group shrink-0"
          >
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg bg-[#0A0A0A] text-white flex items-center justify-center transition-transform">
              <NexaMark data-intro-target="logo" className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
            </div>
            <span className="text-sm sm:text-base font-display font-bold tracking-tight text-[#0A0A0A]">
              NexaLink
            </span>
          </div>

          {/* Middle Section: Global Search Command Bar or Public Navigation */}
          {isPublicView ? (
            <nav className="hidden lg:flex items-center gap-7 text-xs font-sans font-medium text-[#6B7280]">
              <button
                onClick={() => scrollToSection('overview')}
                className={`transition-colors cursor-pointer ${
                  activeSection === 'overview' ? 'text-[#0A0A0A] font-semibold' : 'hover:text-[#0A0A0A]'
                }`}
              >
                Overview
              </button>

              <button
                onClick={() => scrollToSection('features')}
                className={`transition-colors cursor-pointer ${
                  activeSection === 'features' ? 'text-[#0A0A0A] font-semibold' : 'hover:text-[#0A0A0A]'
                }`}
              >
                Features
              </button>

              <button
                onClick={() => scrollToSection('how-it-works')}
                className={`transition-colors cursor-pointer ${
                  activeSection === 'how-it-works' ? 'text-[#0A0A0A] font-semibold' : 'hover:text-[#0A0A0A]'
                }`}
              >
                How it works
              </button>

              <button
                onClick={() => scrollToSection('academic')}
                className={`transition-colors cursor-pointer ${
                  activeSection === 'academic' ? 'text-[#0A0A0A] font-semibold' : 'hover:text-[#0A0A0A]'
                }`}
              >
                Accreditation
              </button>

              <button
                onClick={() => scrollToSection('departments')}
                className={`transition-colors cursor-pointer ${
                  activeSection === 'departments' ? 'text-[#0A0A0A] font-semibold' : 'hover:text-[#0A0A0A]'
                }`}
              >
                Departments
              </button>
            </nav>
          ) : (
            <div className="hidden md:flex items-center flex-1 max-w-md mx-6 lg:mx-8">
              <div
                onClick={() => setCommandPaletteOpen(true)}
                className="relative w-full cursor-pointer"
              >
                <Search className="w-4 h-4 text-[#8C8F96] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  readOnly
                  placeholder={getSearchPlaceholder()}
                  className="w-full bg-[#FAFAFA] hover:bg-[#F3F4F6] border border-[#8C8F96] rounded-lg px-4 pl-10 pr-14 py-2 text-xs font-sans text-[#0A0A0A] placeholder:text-[#6B7280] focus:outline-none focus:bg-white focus:border-[#0A0A0A] transition cursor-pointer"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-[#6B7280] bg-white px-1.5 py-0.5 rounded border border-[#E5E7EB] pointer-events-none">
                  {shortcutHint}
                </span>
              </div>
            </div>
          )}

          {/* Right Action Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            
            {isPublicView ? (
              <>
                {activeTab !== 'auth' && (
                  <button
                    onClick={() => {
                      if (isAuthenticated && currentUser) {
                        setActiveTab('dashboard');
                      } else {
                        setActiveTab('auth');
                      }
                    }}
                    className="px-2.5 sm:px-4 py-1.5 sm:py-2 bg-[#0A0A0A] hover:bg-[#222222] text-white font-sans font-medium text-[11px] sm:text-xs transition rounded-lg flex items-center gap-1.5 cursor-pointer touch-target-44 shrink-0 whitespace-nowrap"
                  >
                    <LogIn className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      {isAuthenticated && currentUser ? 'Return to dashboard' : 'Sign in'}
                    </span>
                  </button>
                )}

                {/* Mobile Public Navigation Menu Button */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="lg:hidden inline-flex items-center justify-center p-1.5 sm:p-2 text-[#6B7280] hover:text-[#0A0A0A] border border-[#E5E7EB] rounded-lg touch-target-44 shrink-0"
                  title="Menu"
                  aria-expanded={mobileMenuOpen}
                  aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
                >
                  {mobileMenuOpen ? <X className="w-4 h-4 sm:w-5 sm:h-5" /> : <Menu className="w-4 h-4 sm:w-5 sm:h-5" />}
                </button>
              </>
            ) : (
              <>
                {/* Mobile Search Command Palette Trigger */}
                <button
                  type="button"
                  onClick={() => setCommandPaletteOpen(true)}
                  className="md:hidden inline-flex items-center justify-center p-2 text-[#6B7280] hover:text-[#0A0A0A] transition rounded-lg border border-[#E5E7EB] hover:bg-[#FAFAFA] bg-white touch-target-44"
                  title={`Search (${shortcutHint})`}
                >
                  <Search className="w-4 h-4" />
                </button>

                {/* Notifications Dropdown */}
                <NotificationBell activeTab={activeTab} setActiveTab={setActiveTab} />

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
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#0A0A0A] text-white flex items-center justify-center shrink-0 border border-[#E5E7EB] text-[10px] sm:text-[11px] font-bold font-sans">
                        {currentUser.name ? currentUser.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : 'U'}
                      </div>
                    )}
                    <div className="hidden sm:block text-left min-w-0 max-w-[140px] md:max-w-[180px]">
                      <p
                        className="text-xs font-semibold text-[#0A0A0A] truncate leading-none"
                        title={formatDisplayName(currentUser.name)}
                      >
                        {formatDisplayName(currentUser.name)}
                      </p>
                      <Badge variant="indigo" size="sm" className="mt-0.5 text-[10px] px-1.5 py-0 capitalize">
                        {currentRole}
                      </Badge>
                    </div>
                    <ChevronDown className={`w-3 h-3 text-[#6B7280] hidden sm:block transition-transform duration-200 ${showProfileMenu ? 'rotate-180' : ''}`} />
                  </div>

                  {/* Profile Menu Popover */}
                  {showProfileMenu && (
                    <div className="absolute right-0 mt-2 w-64 bg-white border border-[#E5E7EB] rounded-xl p-3 z-50 text-xs space-y-2 font-sans animate-in fade-in zoom-in-95 duration-150">
                      {/* User Masthead */}
                      <div className="p-2.5 bg-[#FAFAFA] border border-[#E5E7EB] rounded-lg">
                        <div className="flex items-center gap-2.5">
                          {currentUser.avatar ? (
                            <img
                              src={currentUser.avatar}
                              alt={currentUser.name}
                              className="w-9 h-9 rounded-full object-cover border border-[#E5E7EB]"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-[#0A0A0A] text-white flex items-center justify-center border border-[#E5E7EB] text-xs font-bold font-sans shrink-0">
                              {currentUser.name ? currentUser.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : 'U'}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-medium text-xs text-[#0A0A0A] truncate">
                              {currentUser.name}
                            </p>
                            <p className="text-[11px] text-[#6B7280] truncate">
                              {currentUser.email || `${currentUser.name.toLowerCase().replace(/\s+/g, '.')}@vit.edu.in`}
                            </p>
                          </div>
                        </div>
                        <div className="mt-2 pt-2 border-t border-[#E5E7EB] flex items-center justify-between">
                          <span className="text-[11px] font-medium text-[#6B7280]">Role</span>
                          <Badge variant="indigo" size="sm" className="capitalize">
                            {currentRole}
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
                          className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-xs font-medium text-[#0A0A0A] hover:bg-[#F3F4F6] transition cursor-pointer"
                        >
                          <span>Profile & privacy settings</span>
                          <ChevronDown className="w-3.5 h-3.5 -rotate-90 text-[#6B7280]" />
                        </button>

                        <button
                          onClick={() => {
                            setCommandPaletteOpen(true);
                            setShowProfileMenu(false);
                          }}
                          className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-xs font-medium text-[#0A0A0A] hover:bg-[#F3F4F6] transition cursor-pointer"
                        >
                          <span>Command palette</span>
                          <span className="text-[10px] font-mono text-[#6B7280] bg-[#FAFAFA] border border-[#E5E7EB] px-1.5 py-0.5 rounded">{shortcutHint}</span>
                        </button>
                      </div>

                      {/* Quick Portal Switcher (For Evaluation & Verification) */}
                      <div className="pt-2 border-t border-[#E5E7EB] space-y-1.5">
                        <span className="block text-[11px] font-medium text-[#6B7280] px-1">
                          Switch portal role
                        </span>
                        <div className="grid grid-cols-2 gap-1 text-xs">
                          <button
                            type="button"
                            onClick={() => {
                              switchRole('admin');
                              setActiveTab('dashboard');
                              setShowProfileMenu(false);
                            }}
                            className={`px-2.5 py-1.5 rounded-lg text-left font-medium transition flex items-center justify-between cursor-pointer ${
                              currentRole === 'admin' ? 'bg-[#0A0A0A] text-white' : 'bg-[#F9FAFB] hover:bg-[#F3F4F6] text-[#0A0A0A]'
                            }`}
                          >
                            <span>Admin</span>
                            {currentRole === 'admin' && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              switchRole('faculty');
                              setActiveTab('dashboard');
                              setShowProfileMenu(false);
                            }}
                            className={`px-2.5 py-1.5 rounded-lg text-left font-medium transition flex items-center justify-between cursor-pointer ${
                              currentRole === 'faculty' ? 'bg-[#0A0A0A] text-white' : 'bg-[#F9FAFB] hover:bg-[#F3F4F6] text-[#0A0A0A]'
                            }`}
                          >
                            <span>Faculty</span>
                            {currentRole === 'faculty' && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              switchRole('student');
                              setActiveTab('dashboard');
                              setShowProfileMenu(false);
                            }}
                            className={`px-2.5 py-1.5 rounded-lg text-left font-medium transition flex items-center justify-between cursor-pointer ${
                              currentRole === 'student' ? 'bg-[#0A0A0A] text-white' : 'bg-[#F9FAFB] hover:bg-[#F3F4F6] text-[#0A0A0A]'
                            }`}
                          >
                            <span>Student</span>
                            {currentRole === 'student' && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              switchRole('alumni');
                              setActiveTab('dashboard');
                              setShowProfileMenu(false);
                            }}
                            className={`px-2.5 py-1.5 rounded-lg text-left font-medium transition flex items-center justify-between cursor-pointer ${
                              currentRole === 'alumni' ? 'bg-[#0A0A0A] text-white' : 'bg-[#F9FAFB] hover:bg-[#F3F4F6] text-[#0A0A0A]'
                            }`}
                          >
                            <span>Alumni</span>
                            {currentRole === 'alumni' && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                          </button>
                        </div>
                      </div>

                      {/* Logout Action */}
                      <div className="pt-2 border-t border-[#E5E7EB]">
                        <button
                          onClick={handleLogoutAction}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-xs font-medium text-rose-700 hover:bg-rose-50 transition cursor-pointer"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Sign out</span>
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

      {/* Mobile Drawer / Full-Screen Overlay */}
      {mobileMenuOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
          className="lg:hidden fixed inset-x-0 top-16 bottom-0 z-50 bg-white/98 backdrop-blur-xl px-6 py-6 flex flex-col justify-between overflow-y-auto animate-in fade-in slide-in-from-top-4 duration-200"
          style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
        >
          <div className="space-y-4">
            <span className="text-[11px] font-medium text-[#6B7280] block border-b border-[#E5E7EB] pb-2">
              Public navigation
            </span>

            <div className="space-y-1">
              {[
                { id: 'overview', label: 'Overview' },
                { id: 'features', label: 'Features' },
                { id: 'how-it-works', label: 'How it works' },
                { id: 'academic', label: 'Accreditation' },
                { id: 'departments', label: 'Departments' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    scrollToSection(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className="w-full min-h-[48px] text-left py-3 px-3 text-base font-display font-medium text-[#0A0A0A] hover:bg-[#FAFAFA] rounded-xl transition-all flex items-center justify-between touch-target-44"
                >
                  <span>{item.label}</span>
                  <ArrowRight className="w-4 h-4 text-[#6B7280]" />
                </button>
              ))}
            </div>

            {/* Pinned Primary Action */}
            <div className="pt-4 border-t border-[#E5E7EB] space-y-3">
              {isAuthenticated && currentUser ? (
                <button
                  onClick={() => {
                    setActiveTab('dashboard');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full min-h-[48px] py-3 bg-[#0A0A0A] text-white text-sm font-medium rounded-xl flex items-center justify-center gap-2 cursor-pointer touch-target-44 hover:bg-[#222222] transition-colors"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Go to dashboard</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    setActiveTab('auth');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full min-h-[48px] py-3 bg-[#0A0A0A] text-white text-sm font-medium rounded-xl flex items-center justify-center gap-2 cursor-pointer touch-target-44 hover:bg-[#222222] transition-colors"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Sign in</span>
                </button>
              )}
            </div>
          </div>

          <div className="pt-6 border-t border-[#E5E7EB] flex items-center justify-between text-xs text-[#6B7280]">
            <span>Press Esc to close</span>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="text-[#0A0A0A] font-medium p-2 touch-target-44"
            >
              Close menu
            </button>
          </div>
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

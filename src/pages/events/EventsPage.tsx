import React, { useState, useMemo, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import type { EventItem, EventType } from '../../types';
import { EVENT_CATEGORIES } from '../../constants/taxonomy';
import {
  formatEventDate,
  formatEventMetaLine,
  cleanEventTitle,
  generateIcsCalendar
} from '../../utils/eventTimeUtils';
import { loadJsPdf } from '../../utils/chunkedExporter';
import {
  Calendar,
  MapPin,
  Users,
  Plus,
  Check,
  Download,
  RefreshCw,
  Search,
  X,
  CalendarPlus,
  Video,
  AlertTriangle,
  Clock,
  ExternalLink,
  ChevronRight,
  MoreVertical,
  Share2,
  Copy,
  Ban,
  FileSpreadsheet,
  Eye,
  Image as ImageIcon
} from 'lucide-react';
import { UnderlineTabs, StatusBadge, EmptyState } from '../../components/ui';
import { useMobileChrome } from '../../context/MobileChromeContext';
import { EventComposerPage } from './EventComposerPage';
import { EventManageConsole } from './EventManageConsole';

export const EventsPage: React.FC = () => {
  const { eventsList, rsvpEvent, cancelEvent, isDataLoading } = useData();
  const { currentRole, currentUser } = useAuth();
  const { setHideMobileChrome } = useMobileChrome();

  const isHostRole = currentRole === 'alumni' || currentRole === 'faculty' || currentRole === 'admin';

  // Mobile detection
  const [isMobileScreen, setIsMobileScreen] = useState(() => typeof window !== 'undefined' && window.innerWidth < 640);
  useEffect(() => {
    const handleResize = () => setIsMobileScreen(window.innerWidth < 640);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Sub-view management: list, composer (new/edit), manage
  const [currentView, setCurrentView] = useState<'list' | 'composer' | 'manage'>(() => {
    if (typeof window === 'undefined') return 'list';
    const v = new URLSearchParams(window.location.search).get('view');
    if (v === 'new' || v === 'edit') return 'composer';
    if (v === 'manage') return 'manage';
    return 'list';
  });
  const [activeEventId, setActiveEventId] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return new URLSearchParams(window.location.search).get('eventId');
  });
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null);

  // Filter States
  const [activeTab, setActiveTab] = useState<'upcoming' | 'registered' | 'past' | 'hosting'>('upcoming');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [modeFilter, setModeFilter] = useState<'all' | 'campus' | 'online' | 'hybrid'>('all');
  const [timeFilter, setTimeFilter] = useState<'all' | 'this_week' | 'this_month'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [noticeMsg, setNoticeMsg] = useState<string | null>(null);
  const [overflowMenuOpenId, setOverflowMenuOpenId] = useState<string | null>(null);
  const [selectedDetailEvent, setSelectedDetailEvent] = useState<EventItem | null>(null);

  // Hide mobile bottom nav when detail sheet is open on mobile
  useEffect(() => {
    if (selectedDetailEvent && isMobileScreen) {
      setHideMobileChrome(true);
      return () => setHideMobileChrome(false);
    }
  }, [selectedDetailEvent, isMobileScreen, setHideMobileChrome]);

  // Handle Esc key and back button to close event detail sheet
  useEffect(() => {
    if (!selectedDetailEvent) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedDetailEvent(null);
    };
    window.addEventListener('keydown', onKeyDown);

    const onPopState = () => {
      setSelectedDetailEvent(null);
    };
    if (isMobileScreen) {
      window.history.pushState({ modal: 'event-detail' }, '');
      window.addEventListener('popstate', onPopState);
    }

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      if (isMobileScreen) {
        window.removeEventListener('popstate', onPopState);
      }
    };
  }, [selectedDetailEvent, isMobileScreen]);

  // Sync with URL parameters
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get('view');
    const eventParam = params.get('eventId');
    const tabParam = params.get('subtab');

    if (viewParam === 'new') {
      setCurrentView('composer');
      setActiveEventId(null);
    } else if (viewParam === 'edit' && eventParam) {
      setCurrentView('composer');
      setActiveEventId(eventParam);
    } else if (viewParam === 'manage' && eventParam) {
      setCurrentView('manage');
      setActiveEventId(eventParam);
    } else if (tabParam === 'hosting' && isHostRole) {
      setActiveTab('hosting');
    }

    const handlePopState = () => {
      const p = new URLSearchParams(window.location.search);
      const v = p.get('view');
      const e = p.get('eventId');
      if (v === 'new') {
        setCurrentView('composer');
        setActiveEventId(null);
      } else if (v === 'edit' && e) {
        setCurrentView('composer');
        setActiveEventId(e);
      } else if (v === 'manage' && e) {
        setCurrentView('manage');
        setActiveEventId(e);
      } else {
        setCurrentView('list');
        setActiveEventId(null);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isHostRole]);

  const updateUrlView = (view: 'list' | 'composer' | 'manage', eventId?: string) => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    if (view === 'list') {
      url.searchParams.delete('view');
      url.searchParams.delete('eventId');
    } else if (view === 'composer') {
      url.searchParams.set('view', eventId ? 'edit' : 'new');
      if (eventId) url.searchParams.set('eventId', eventId);
      else url.searchParams.delete('eventId');
    } else if (view === 'manage' && eventId) {
      url.searchParams.set('view', 'manage');
      url.searchParams.set('eventId', eventId);
    }
    window.history.pushState({}, '', url.toString());
  };

  const handleOpenComposer = (eventId?: string, templateName?: string) => {
    setActiveEventId(eventId || null);
    setActiveTemplate(templateName || null);
    setCurrentView('composer');
    updateUrlView('composer', eventId);
  };

  const handleOpenManage = (eventId: string) => {
    setActiveEventId(eventId);
    setCurrentView('manage');
    updateUrlView('manage', eventId);
  };

  const handleBackToList = () => {
    setCurrentView('list');
    setActiveEventId(null);
    updateUrlView('list');
  };

  // Close overflow menus on click outside
  useEffect(() => {
    const handleClickOutside = () => setOverflowMenuOpenId(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  // Filter Counts
  const upcomingCount = useMemo(() => {
    const now = Date.now();
    return eventsList.filter(e => {
      const start = e.startsAt ? new Date(e.startsAt).getTime() : new Date(e.date).getTime();
      return (e.lifecycleStatus === 'published' || !e.lifecycleStatus) && e.status !== 'Completed' && e.status !== 'Cancelled' && start >= now;
    }).length;
  }, [eventsList]);

  const registeredCount = useMemo(() => {
    return eventsList.filter(e => e.registeredUserIds.includes(currentUser.id)).length;
  }, [eventsList, currentUser.id]);

  const pastCount = useMemo(() => {
    const now = Date.now();
    return eventsList.filter(e => {
      const end = e.endsAt ? new Date(e.endsAt).getTime() : new Date(e.date).getTime();
      return e.status === 'Completed' || (e.lifecycleStatus === 'completed') || (end < now && e.status !== 'Cancelled');
    }).length;
  }, [eventsList]);

  const hostingCount = useMemo(() => {
    if (!isHostRole) return 0;
    return eventsList.filter(e => e.hostId === currentUser.id || (e.coHostIds || []).includes(currentUser.id)).length;
  }, [eventsList, currentUser.id, isHostRole]);

  // Filter Logic
  const filteredEvents = useMemo(() => {
    const now = new Date();
    const nowMs = now.getTime();

    // Time window calculations
    const endOfWeek = new Date(now);
    endOfWeek.setDate(now.getDate() + (7 - now.getDay()));
    endOfWeek.setHours(23, 59, 59, 999);

    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    return eventsList.filter(evt => {
      const isRegistered = evt.registeredUserIds.includes(currentUser.id);
      const isHost = evt.hostId === currentUser.id || (evt.coHostIds || []).includes(currentUser.id);
      const startMs = evt.startsAt ? new Date(evt.startsAt).getTime() : new Date(evt.date).getTime();
      const endMs = evt.endsAt ? new Date(evt.endsAt).getTime() : startMs + 2 * 60 * 60 * 1000;
      const isPast = evt.status === 'Completed' || evt.lifecycleStatus === 'completed' || endMs < nowMs;

      // Tab filtering
      if (activeTab === 'upcoming') {
        if (isPast || evt.status === 'Cancelled' || evt.lifecycleStatus === 'cancelled') return false;
        // In public upcoming feed, only show published events
        if (evt.lifecycleStatus && evt.lifecycleStatus !== 'published') return false;
      } else if (activeTab === 'registered') {
        if (!isRegistered) return false;
      } else if (activeTab === 'past') {
        if (!isPast && evt.status !== 'Completed') return false;
      } else if (activeTab === 'hosting') {
        if (!isHost && currentRole !== 'admin') return false;
      }

      // Category filter
      if (activeCategory !== 'All' && evt.type !== activeCategory) {
        return false;
      }

      // Mode filter
      if (modeFilter === 'campus' && (evt.mode !== 'on_campus' && evt.isOnline)) return false;
      if (modeFilter === 'online' && (evt.mode !== 'online' && !evt.isOnline)) return false;
      if (modeFilter === 'hybrid' && evt.mode !== 'hybrid') return false;

      // Time filter
      if (timeFilter === 'this_week' && startMs > endOfWeek.getTime()) return false;
      if (timeFilter === 'this_month' && startMs > endOfMonth.getTime()) return false;

      // Search query
      if (searchTerm.trim() !== '') {
        const q = searchTerm.toLowerCase();
        const matchTitle = evt.title.toLowerCase().includes(q);
        const matchDesc = evt.description?.toLowerCase().includes(q);
        const matchSpeaker = evt.speakerName?.toLowerCase().includes(q) || (evt.speakers || []).some(s => s.name.toLowerCase().includes(q));
        const matchLoc = evt.locationOrUrl?.toLowerCase().includes(q);
        return matchTitle || matchDesc || matchSpeaker || matchLoc;
      }

      return true;
    }).sort((a, b) => {
      const aTime = a.startsAt ? new Date(a.startsAt).getTime() : new Date(a.date).getTime();
      const bTime = b.startsAt ? new Date(b.startsAt).getTime() : new Date(b.date).getTime();
      return activeTab === 'past' ? bTime - aTime : aTime - bTime;
    });
  }, [eventsList, activeTab, activeCategory, modeFilter, timeFilter, searchTerm, currentUser.id, currentRole]);

  // Handlers
  const handleRsvp = (evt: EventItem) => {
    const isRegistered = evt.registeredUserIds.includes(currentUser.id);
    const isWaitlisted = (evt.waitlistUserIds || []).includes(currentUser.id);
    const limit = evt.capacityLimit || 60;

    rsvpEvent(evt.id, currentUser.id);

    if (isRegistered || isWaitlisted) {
      setNoticeMsg('Registration cancelled. Your reserved seat has been released.');
    } else if (evt.registeredUserIds.length >= limit) {
      setNoticeMsg('Capacity reached. You have been placed on the waitlist queue.');
    } else {
      setNoticeMsg('Seat confirmed! Check-in code will be provided before the session starts.');
    }
    setTimeout(() => setNoticeMsg(null), 4000);
  };

  const handleDownloadCalendar = (evt: EventItem) => {
    try {
      const ics = generateIcsCalendar({ event: evt, method: 'REQUEST' });
      const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${cleanEventTitle(evt.title, evt.type).replace(/[^a-zA-Z0-9]/g, '_')}.ics`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setNoticeMsg('Calendar invitation (.ics) downloaded.');
      setTimeout(() => setNoticeMsg(null), 3500);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDownloadCertificate = async (evt: EventItem) => {
    try {
      const { jsPDF } = await loadJsPdf();
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const certId = `CERT-VIT-${evt.id.substring(0, 6).toUpperCase()}-${currentUser.id.substring(0, 4).toUpperCase()}`;

      doc.setDrawColor(10, 10, 10);
      doc.setLineWidth(1.5);
      doc.rect(10, 10, 277, 190);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.setTextColor(10, 10, 10);
      doc.text('VIDYALANKAR INSTITUTE OF TECHNOLOGY, MUMBAI', 148.5, 36, { align: 'center' });

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(107, 114, 128);
      doc.text('NAAC "A+" Grade & NBA Accredited Institution • Wadala, Mumbai 400037', 148.5, 43, { align: 'center' });

      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(10, 10, 10);
      doc.text('CERTIFICATE OF PARTICIPATION', 148.5, 70, { align: 'center' });

      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text('This is to certify that verified institutional member', 148.5, 88, { align: 'center' });

      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text(currentUser.name, 148.5, 104, { align: 'center' });

      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`has successfully attended and participated in:`, 148.5, 120, { align: 'center' });

      doc.setFontSize(15);
      doc.setFont('helvetica', 'bold');
      doc.text(`"${cleanEventTitle(evt.title, evt.type)}"`, 148.5, 132, { align: 'center' });

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(107, 114, 128);
      doc.text(`Date of Event: ${formatEventDate(evt.startsAt || evt.date).fullDate}`, 148.5, 145, { align: 'center' });

      // Verification footnote
      doc.setFontSize(9);
      doc.text(`Certificate ID: ${certId}  •  Verify at: https://nexalink.vit.edu.in/verify/${certId}`, 148.5, 175, { align: 'center' });

      doc.save(`VIT_Certificate_${certId}.pdf`);
      setNoticeMsg('Official attendance-verified certificate generated.');
      setTimeout(() => setNoticeMsg(null), 3500);
    } catch (err) {
      console.error(err);
    }
  };

  // Render Composer View
  if (currentView === 'composer') {
    return (
      <EventComposerPage
        eventId={activeEventId}
        initialTemplate={activeTemplate}
        onBack={handleBackToList}
        onSaved={handleBackToList}
      />
    );
  }

  // Render Manage Console View
  if (currentView === 'manage' && activeEventId) {
    return (
      <EventManageConsole
        eventId={activeEventId}
        onBack={handleBackToList}
      />
    );
  }

  return (
    <div className="space-y-6 font-sans text-xs">

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0A0A0A] tracking-tight">
            Events
          </h1>
          <p className="text-xs text-[#6B7280] mt-1">
            Talks, workshops, alumni meets, and placement drives at VIT Wadala.
          </p>
        </div>

        {isHostRole && (
          <button
            type="button"
            onClick={() => handleOpenComposer()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#0A0A0A] hover:bg-[#262626] text-white text-xs font-semibold rounded-xl transition-colors shrink-0 cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Host an event</span>
          </button>
        )}
      </div>

      {noticeMsg && (
        <div className="p-3 bg-[#FAFAFA] border border-[#E5E7EB] text-[#0A0A0A] text-xs font-medium rounded-xl flex items-center gap-2">
          <Check className="w-4 h-4 text-[#0A0A0A] shrink-0" />
          <span>{noticeMsg}</span>
        </div>
      )}

      {/* Mobile Filter & Chips Area (<640px) */}
      <div className="space-y-3 sm:hidden">
        {/* Search Field */}
        <div className="relative w-full">
          <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search events or speakers"
            className="w-full h-10 pl-9 pr-9 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl text-xs text-[#0A0A0A] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#0A0A0A] transition-colors"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-3 text-[#9CA3AF] hover:text-[#0A0A0A]"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Horizontally scrollable row of chips (Upcoming, Registered, Past) with edge fade and scroll-snap */}
        <div className="relative w-full overflow-hidden">
          <div className="flex items-center gap-1.5 overflow-x-auto snap-x snap-mandatory py-0.5 no-scrollbar scroll-smooth">
            {[
              { id: 'upcoming', label: 'Upcoming', count: upcomingCount },
              { id: 'registered', label: 'Registered', count: registeredCount },
              { id: 'past', label: 'Past', count: pastCount },
              ...(isHostRole ? [{ id: 'hosting', label: 'Hosting', count: hostingCount }] : [])
            ].map((chip) => {
              const isSelected = activeTab === chip.id;
              return (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => setActiveTab(chip.id as any)}
                  className={`snap-start shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer touch-target-44 flex items-center gap-1.5 select-none ${
                    isSelected
                      ? 'bg-[#0A0A0A] text-white shadow-2xs font-semibold'
                      : 'bg-[#F3F4F6] text-[#6B7280] hover:text-[#0A0A0A] hover:bg-[#E5E7EB]'
                  }`}
                >
                  <span>{chip.label}</span>
                  {chip.count > 0 && (
                    <span
                      className={`text-[10px] tabular-nums font-semibold px-1.5 py-0.2 rounded-full ${
                        isSelected ? 'bg-white text-[#0A0A0A]' : 'bg-[#E5E7EB] text-[#4B5563]'
                      }`}
                    >
                      {chip.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          {/* Right edge fade */}
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-white to-transparent" />
        </div>
      </div>

      {/* Desktop Underline Tabs & Controls (>=640px) */}
      <div className="hidden sm:block space-y-4">
        <UnderlineTabs
          tabs={[
            { id: 'upcoming', label: 'Upcoming', count: upcomingCount > 0 ? upcomingCount : undefined },
            { id: 'registered', label: 'Registered', count: registeredCount > 0 ? registeredCount : undefined },
            { id: 'past', label: 'Past', count: pastCount > 0 ? pastCount : undefined },
            ...(isHostRole ? [{ id: 'hosting', label: 'Hosting', count: hostingCount > 0 ? hostingCount : undefined }] : [])
          ]}
          activeTab={activeTab}
          onChange={tabId => setActiveTab(tabId as any)}
        />

        {/* Unboxed Single-Row Filter Controls (Section 5) */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-2.5 flex-1 flex-wrap">
            {/* Search Box */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-[#6B7280] absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search talks, speakers, venues..."
                className="w-full h-9 pl-9 pr-8 bg-white border border-[#6B7280] rounded-xl text-xs text-[#0A0A0A] placeholder:text-[#6B7280] focus:outline-none focus:border-[#0A0A0A] transition-colors"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-2.5 text-[#6B7280] hover:text-[#0A0A0A]"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Category Dropdown */}
            <select
              value={activeCategory}
              onChange={e => setActiveCategory(e.target.value)}
              className="h-9 px-3 bg-white border border-[#6B7280] rounded-xl text-xs font-medium text-[#0A0A0A] focus:outline-none focus:border-[#0A0A0A] cursor-pointer"
            >
              <option value="All">All categories</option>
              {EVENT_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            {/* Mode Dropdown */}
            <select
              value={modeFilter}
              onChange={e => setModeFilter(e.target.value as any)}
              className="h-9 px-3 bg-white border border-[#6B7280] rounded-xl text-xs font-medium text-[#0A0A0A] focus:outline-none focus:border-[#0A0A0A] cursor-pointer"
            >
              <option value="all">All modes</option>
              <option value="campus">On campus</option>
              <option value="online">Online</option>
              <option value="hybrid">Hybrid</option>
            </select>

            {/* Time Window Dropdown */}
            <select
              value={timeFilter}
              onChange={e => setTimeFilter(e.target.value as any)}
              className="h-9 px-3 bg-white border border-[#6B7280] rounded-xl text-xs font-medium text-[#0A0A0A] focus:outline-none focus:border-[#0A0A0A] cursor-pointer"
            >
              <option value="all">All dates</option>
              <option value="this_week">This week</option>
              <option value="this_month">This month</option>
            </select>
          </div>

          {/* Counter and Reset */}
          <div className="flex items-center gap-3 text-xs text-[#6B7280] shrink-0">
            <span>
              Showing <strong className="text-[#0A0A0A] font-semibold">{filteredEvents.length}</strong> event{filteredEvents.length === 1 ? '' : 's'}
            </span>
            {(activeCategory !== 'All' || modeFilter !== 'all' || timeFilter !== 'all' || searchTerm) && (
              <button
                type="button"
                onClick={() => {
                  setActiveCategory('All');
                  setModeFilter('all');
                  setTimeFilter('all');
                  setSearchTerm('');
                }}
                className="text-xs text-[#0A0A0A] font-medium hover:underline flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Events List (Unboxed, clean row dividers) */}
      {isDataLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-center space-y-3">
          <div className="animate-spin rounded-full h-7 w-7 border-2 border-[#0A0A0A] border-t-transparent" />
          <p className="text-xs text-[#6B7280]">Loading event schedules…</p>
        </div>
      ) : filteredEvents.length === 0 ? (
        activeTab === 'hosting' ? (
          <div className="py-16 text-center space-y-4 max-w-md mx-auto">
            <Calendar className="w-8 h-8 text-[#6B7280] mx-auto opacity-50" />
            <div>
              <h3 className="font-semibold text-sm text-[#0A0A0A]">
                You haven't hosted an event yet.
              </h3>
              <p className="text-xs text-[#6B7280] mt-1">
                Share practical industry insights, mentor students, or schedule departmental guest lectures.
              </p>
            </div>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => handleOpenComposer(undefined, 'Guest lecture')}
                className="w-full sm:w-auto px-3 py-2 border border-[#6B7280] rounded-xl hover:bg-[#FAFAFA] font-medium text-xs text-[#0A0A0A] transition-colors"
              >
                Guest lecture
              </button>
              <button
                type="button"
                onClick={() => handleOpenComposer(undefined, 'Technical workshop')}
                className="w-full sm:w-auto px-3 py-2 border border-[#6B7280] rounded-xl hover:bg-[#FAFAFA] font-medium text-xs text-[#0A0A0A] transition-colors"
              >
                Technical workshop
              </button>
              <button
                type="button"
                onClick={() => handleOpenComposer(undefined, 'Alumni meet')}
                className="w-full sm:w-auto px-3 py-2 border border-[#6B7280] rounded-xl hover:bg-[#FAFAFA] font-medium text-xs text-[#0A0A0A] transition-colors"
              >
                Alumni meet
              </button>
            </div>
          </div>
        ) : (
          <div className="py-16 text-center text-[#6B7280] space-y-2">
            <Calendar className="w-8 h-8 text-[#6B7280] mx-auto opacity-50 mb-2" />
            <h3 className="font-semibold text-sm text-[#0A0A0A]">No events found</h3>
            <p className="text-xs text-[#6B7280] max-w-sm mx-auto">
              {activeTab === 'registered'
                ? 'You have not registered for any upcoming events yet.'
                : 'No institutional events match your selected filters.'}
            </p>
          </div>
        )
      ) : (
        <div className="divide-y divide-[#E5E7EB] border-t border-b border-[#E5E7EB] pb-[calc(var(--bottomnav-h,56px)+env(safe-area-inset-bottom,0px)+32px)] sm:pb-0">
          {filteredEvents.map(evt => {
            const dateParts = formatEventDate(evt.startsAt || evt.date);
            const isRegistered = evt.registeredUserIds.includes(currentUser.id);
            const isWaitlisted = (evt.waitlistUserIds || []).includes(currentUser.id);
            const isHost = evt.hostId === currentUser.id || (evt.coHostIds || []).includes(currentUser.id);
            const isSpeaker = (evt.speakers || []).some(s => s.memberId === currentUser.id) ||
              (evt.speakerName && evt.speakerName.toLowerCase().includes(currentUser.name.toLowerCase()));
            const isCompleted = evt.status === 'Completed' || evt.lifecycleStatus === 'completed' ||
              (evt.endsAt ? new Date(evt.endsAt).getTime() < Date.now() : false);
            const limit = evt.capacityLimit || 60;
            const isFull = evt.registeredUserIds.length >= limit;
            const seatsLeft = Math.max(0, limit - evt.registeredUserIds.length);
            const capacityRatio = evt.registeredUserIds.length / limit;
            const isLowSeats = capacityRatio >= 0.9 && seatsLeft > 0;

            const cleanTitle = cleanEventTitle(evt.title, evt.type);

            return (
              <div
                key={evt.id}
                onClick={() => setSelectedDetailEvent(evt)}
                className="py-4.5 px-2 sm:px-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#FAFAFA] transition-colors rounded-xl cursor-pointer"
              >
                <div className="flex items-start gap-3 sm:gap-4 min-w-0 flex-1">
                  {/* Neutral Date Block (Day + Sentence Case Month e.g. "20 Nov") */}
                  <div className="w-13 h-13 rounded-xl bg-white border border-[#E5E7EB] flex flex-col items-center justify-center shrink-0 text-center select-none shadow-2xs">
                    <span className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider">
                      {dateParts.month}
                    </span>
                    <span className="text-lg font-bold text-[#0A0A0A] leading-none mt-0.5 tabular-nums">
                      {dateParts.day}
                    </span>
                  </div>

                  {/* 16:9 Banner Thumbnail */}
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedDetailEvent(evt);
                    }}
                    className="w-24 sm:w-32 md:w-36 aspect-video rounded-xl overflow-hidden bg-neutral-100 border border-[#E5E7EB] shrink-0 relative group shadow-2xs cursor-pointer select-none"
                    title="Click to view full event details"
                  >
                    {evt.bannerImage ? (
                      <img
                        src={evt.bannerImage}
                        alt={cleanTitle}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-neutral-100 to-neutral-200 text-neutral-400">
                        <ImageIcon className="w-5 h-5 opacity-60" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <span className="p-1 rounded-full bg-white/90 text-[#0A0A0A] shadow-xs">
                        <Eye className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>

                  {/* Event Details */}
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3
                        className="font-semibold text-sm text-[#0A0A0A] tracking-tight hover:underline cursor-pointer line-clamp-2 break-words"
                      >
                        {cleanTitle}
                      </h3>

                      {/* Plain text Category */}
                      <span className="text-[11px] text-[#6B7280] font-medium">
                        · {evt.type}
                      </span>

                      {/* RSVP State Badge */}
                      {isRegistered ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <Check className="w-3 h-3" />
                          Registered
                        </span>
                      ) : isWaitlisted ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                          Waitlisted
                        </span>
                      ) : isFull ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600 border border-neutral-200">
                          Full
                        </span>
                      ) : null}

                      {/* Status Badges for Hosting View */}
                      {activeTab === 'hosting' && evt.lifecycleStatus && (
                        <StatusBadge
                          tone={
                            evt.lifecycleStatus === 'published'
                              ? 'emerald'
                              : evt.lifecycleStatus === 'pending_review' || evt.lifecycleStatus === 'changes_requested'
                              ? 'amber'
                              : evt.lifecycleStatus === 'cancelled' || evt.lifecycleStatus === 'rejected'
                              ? 'rose'
                              : 'neutral'
                          }
                          label={
                            evt.lifecycleStatus === 'published'
                              ? 'Live'
                              : evt.lifecycleStatus === 'pending_review'
                              ? 'In review'
                              : evt.lifecycleStatus === 'changes_requested'
                              ? 'Changes requested'
                              : evt.lifecycleStatus === 'draft'
                              ? 'Draft'
                              : evt.lifecycleStatus === 'cancelled'
                              ? 'Cancelled'
                              : 'Completed'
                          }
                          size="sm"
                        />
                      )}
                    </div>

                    {/* Meta line: Time range · Location */}
                    <div className="text-xs text-[#6B7280]">
                      {formatEventMetaLine(evt)}
                    </div>

                    {/* Speakers and Capacity Info */}
                    <div className="flex items-center gap-4 flex-wrap pt-0.5 text-xs text-[#6B7280]">
                      {/* Stacked Speaker Avatars & Names */}
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-[#0A0A0A]">
                          Speaker: {evt.speakers && evt.speakers.length > 0
                            ? evt.speakers.map(s => s.name).join(', ')
                            : evt.speakerName || 'Faculty / Invited Speaker'}
                        </span>
                      </div>

                      {/* Capacity Meter / Seats Left */}
                      {!isCompleted && evt.lifecycleStatus !== 'draft' && (
                        <div className="flex items-center gap-1.5">
                          <span>·</span>
                          {isFull ? (
                            <span className="font-semibold text-[#0A0A0A]">Full</span>
                          ) : (
                            <span className="inline-flex items-center gap-1 font-medium">
                              {isLowSeats && <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />}
                              <strong className="text-[#0A0A0A] font-semibold">{seatsLeft}</strong> seats left
                            </span>
                          )}
                          <span className="text-[11px] text-[#6B7280]">
                            ({evt.registeredUserIds.length} of {limit} registered{evt.waitlistUserIds?.length ? ` · ${evt.waitlistUserIds.length} waitlisted` : ''})
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Inline note for changes requested */}
                    {activeTab === 'hosting' && evt.lifecycleStatus === 'changes_requested' && evt.reviewNote && (
                      <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-950 mt-1">
                        <strong>Reviewer note:</strong> {evt.reviewNote}
                      </div>
                    )}
                  </div>
                </div>

                {/* Role-Aware Action Column (Section 5) */}
                <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
                  {/* Hosting tab actions */}
                  {activeTab === 'hosting' ? (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenManage(evt.id)}
                        className="px-3 py-1.5 bg-[#0A0A0A] hover:bg-[#262626] text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                      >
                        Manage
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenComposer(evt.id)}
                        className="px-3 py-1.5 border border-[#6B7280] hover:bg-[#FAFAFA] text-[#0A0A0A] text-xs font-medium rounded-xl transition-colors cursor-pointer"
                      >
                        Edit
                      </button>

                      {/* Overflow options */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOverflowMenuOpenId(overflowMenuOpenId === evt.id ? null : evt.id);
                          }}
                          className="p-1.5 border border-[#E5E7EB] hover:bg-[#FAFAFA] rounded-xl text-[#6B7280] hover:text-[#0A0A0A] transition-colors cursor-pointer"
                          aria-label="More actions"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {overflowMenuOpenId === evt.id && (
                          <div
                            onClick={e => e.stopPropagation()}
                            className="absolute right-0 mt-1 w-44 bg-white border border-[#E5E7EB] rounded-xl shadow-sm p-1.5 z-30 space-y-1 text-xs"
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setOverflowMenuOpenId(null);
                                handleOpenComposer(undefined, evt.type);
                              }}
                              className="w-full px-2.5 py-1.5 text-left text-[#0A0A0A] hover:bg-[#FAFAFA] rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
                            >
                              <Copy className="w-3.5 h-3.5 text-[#6B7280]" />
                              <span>Duplicate event</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setOverflowMenuOpenId(null);
                                navigator.clipboard.writeText(`${window.location.origin}/events?eventId=${evt.id}`);
                                setNoticeMsg('Event share link copied to clipboard.');
                                setTimeout(() => setNoticeMsg(null), 3000);
                              }}
                              className="w-full px-2.5 py-1.5 text-left text-[#0A0A0A] hover:bg-[#FAFAFA] rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
                            >
                              <Share2 className="w-3.5 h-3.5 text-[#6B7280]" />
                              <span>Share link</span>
                            </button>
                            {evt.lifecycleStatus !== 'cancelled' && (
                              <button
                                type="button"
                                onClick={() => {
                                  setOverflowMenuOpenId(null);
                                  const reason = prompt('Cancellation reason:');
                                  if (reason) cancelEvent(evt.id, reason);
                                }}
                                className="w-full px-2.5 py-1.5 text-left text-[#991B1B] hover:bg-rose-50 rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
                              >
                                <Ban className="w-3.5 h-3.5 text-[#991B1B]" />
                                <span>Cancel event</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : isHost ? (
                    // Host or Co-Host Action
                    <button
                      type="button"
                      onClick={() => handleOpenManage(evt.id)}
                      className="px-3.5 py-1.5 bg-[#0A0A0A] hover:bg-[#262626] text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                    >
                      Manage
                    </button>
                  ) : isSpeaker ? (
                    // Listed Speaker Action (Resolves speaker bug!)
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1.5 bg-[#F3F4F6] text-[#0A0A0A] border border-[#E5E7EB] rounded-xl text-xs font-medium cursor-default">
                        You're speaking
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDownloadCalendar(evt)}
                        className="p-1.5 border border-[#E5E7EB] rounded-xl hover:bg-[#FAFAFA] text-[#6B7280] hover:text-[#0A0A0A] transition-colors"
                        title="Add to calendar"
                      >
                        <CalendarPlus className="w-4 h-4" />
                      </button>
                    </div>
                  ) : isCompleted ? (
                    // Ended Session Actions
                    <div className="flex items-center gap-2">
                      {isRegistered && (
                        <button
                          type="button"
                          onClick={() => handleDownloadCertificate(evt)}
                          className="px-3 py-1.5 border border-[#6B7280] rounded-xl text-xs font-medium text-[#0A0A0A] hover:bg-[#FAFAFA] flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Certificate</span>
                        </button>
                      )}
                      <span className="text-xs font-medium text-[#6B7280] px-2">
                        Ended
                      </span>
                    </div>
                  ) : isRegistered ? (
                    // Registered Member Action: Neutral badge with check, NOT emerald!
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleRsvp(evt)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#0A0A0A] text-[#0A0A0A] rounded-xl text-xs font-semibold hover:bg-[#FAFAFA] transition-colors cursor-pointer"
                        title="Click to cancel reservation"
                      >
                        <Check className="w-3.5 h-3.5 text-[#0A0A0A]" />
                        <span>Registered ✓</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDownloadCalendar(evt)}
                        className="p-1.5 rounded-xl border border-[#6B7280] hover:bg-[#FAFAFA] text-[#0A0A0A] transition-colors cursor-pointer"
                        title="Add to calendar (.ics)"
                      >
                        <CalendarPlus className="w-4 h-4" />
                      </button>
                    </div>
                  ) : isWaitlisted ? (
                    // Waitlisted Member Action
                    <button
                      type="button"
                      onClick={() => handleRsvp(evt)}
                      className="px-3 py-1.5 bg-amber-50 text-amber-900 border border-amber-300 rounded-xl text-xs font-semibold hover:bg-amber-100 transition-colors cursor-pointer"
                      title="Click to leave waitlist"
                    >
                      Waitlisted · #{(evt.waitlistUserIds || []).indexOf(currentUser.id) + 1}
                    </button>
                  ) : (
                    // Eligible Member Action
                    <button
                      type="button"
                      onClick={() => handleRsvp(evt)}
                      className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                        isFull
                          ? 'border border-[#0A0A0A] bg-white text-[#0A0A0A] hover:bg-[#FAFAFA]'
                          : 'bg-[#0A0A0A] text-white hover:bg-[#262626]'
                      }`}
                    >
                      {isFull ? 'Join waitlist' : 'Register'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Session Detail Modal (Opens when thumbnail or title clicked) */}
      {(() => {
        if (!selectedDetailEvent) return null;
        const modalEvent = eventsList.find(e => e.id === selectedDetailEvent.id) || selectedDetailEvent;
        const eventLimit = modalEvent.capacityLimit || 60;
        const isEventFull = modalEvent.registeredUserIds.length >= eventLimit;
        const isUserRegistered = modalEvent.registeredUserIds.includes(currentUser.id);
        const isUserHost = modalEvent.hostId === currentUser.id;

        return (
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 bg-[#0A0A0A]/40 backdrop-blur-xs flex flex-col justify-end sm:items-center sm:justify-center p-0 sm:p-4 overflow-y-auto"
            onClick={() => setSelectedDetailEvent(null)}
          >
            <div
              className="bg-white rounded-t-2xl sm:rounded-2xl border-t sm:border border-[#E5E7EB] max-w-2xl w-full shadow-2xl overflow-hidden max-h-[92dvh] flex flex-col animate-in slide-in-from-bottom duration-200"
              onClick={e => e.stopPropagation()}
            >
              {/* Mobile Drag Handle */}
              {isMobileScreen && (
                <div className="pt-2.5 pb-1 bg-white shrink-0 flex justify-center">
                  <div className="w-12 h-1 bg-neutral-300 rounded-full" />
                </div>
              )}

              {/* Modal Header Banner with 16:9 Aspect Ratio */}
              <div className="relative aspect-video w-full bg-neutral-900 overflow-hidden shrink-0">
                {modalEvent.bannerImage ? (
                  <img
                    src={modalEvent.bannerImage}
                    alt={modalEvent.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-neutral-800 to-neutral-900 text-neutral-400">
                    <ImageIcon className="w-12 h-12 opacity-50" />
                  </div>
                )}

                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => setSelectedDetailEvent(null)}
                  className="absolute top-3 right-3 p-2 bg-black/60 hover:bg-black/80 text-white rounded-full backdrop-blur-sm transition-all cursor-pointer z-10 touch-target-44 flex items-center justify-center"
                  aria-label="Close modal"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Overlay Metadata Pills */}
                <div className="absolute bottom-3 left-3 flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-1 bg-white/95 text-[#0A0A0A] rounded-lg text-xs font-semibold shadow-xs backdrop-blur-xs">
                    {modalEvent.type}
                  </span>
                  <span className="px-2.5 py-1 bg-black/70 text-white rounded-lg text-xs font-medium backdrop-blur-xs capitalize">
                    {(modalEvent.mode || 'on_campus').replace('_', ' ')}
                  </span>
                </div>
              </div>

              {/* Modal Body Content (Internal Scroll) */}
              <div className="p-5 sm:p-6 space-y-4 flex-1 overflow-y-auto custom-scrollbar">
                <div className="space-y-1">
                  <h2 className="text-xl font-bold text-[#0A0A0A] tracking-tight">
                    {cleanEventTitle(modalEvent.title, modalEvent.type)}
                  </h2>
                  <p className="text-xs text-[#6B7280]">
                    {formatEventMetaLine(modalEvent)}
                  </p>
                </div>

                {/* Speaker Card */}
                <div className="p-3.5 bg-[#FAFAFA] border border-[#E5E7EB] rounded-xl space-y-2">
                  <span className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider block">
                    Featured Speaker{modalEvent.speakers && modalEvent.speakers.length > 1 ? 's' : ''}
                  </span>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#E5E7EB] border border-[#D1D5DB] flex items-center justify-center font-bold text-xs text-[#0A0A0A] shrink-0">
                      {(modalEvent.speakers?.[0]?.name || modalEvent.speakerName || 'S').charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-[#0A0A0A]">
                        {modalEvent.speakers && modalEvent.speakers.length > 0
                          ? modalEvent.speakers.map(s => s.name).join(', ')
                          : modalEvent.speakerName || 'Faculty / Invited Speaker'}
                      </h4>
                      <p className="text-xs text-[#6B7280]">
                        {modalEvent.speakers?.[0]?.title || 'Keynote Presentation & Interactive Q&A'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Event Description */}
                <div className="space-y-1.5">
                  <h4 className="text-xs font-semibold text-[#0A0A0A] uppercase tracking-wider">
                    About this event
                  </h4>
                  <p className="text-xs text-[#374151] leading-relaxed whitespace-pre-line">
                    {modalEvent.description || 'Join us for this session featuring in-depth technical discussions, practical demonstrations, and peer networking at VIT Wadala.'}
                  </p>
                </div>

                {/* Capacity & Quota Info */}
                <div className="pt-2 border-t border-[#E5E7EB] flex items-center justify-between text-xs text-[#6B7280]">
                  <span>
                    Capacity:{' '}
                    <strong className="text-[#0A0A0A]">
                      {modalEvent.registeredUserIds.length}
                    </strong>{' '}
                    of {eventLimit} registered
                  </span>
                  {isEventFull ? (
                    <span className="font-semibold text-rose-600">Full (Waitlist Available)</span>
                  ) : (
                    <span className="font-semibold text-emerald-700">Registrations Open</span>
                  )}
                </div>
              </div>

              {/* Modal Actions Sticky Footer with Safe Area Padding */}
              <div className="p-4 sm:p-5 bg-[#FAFAFA] border-t border-[#E5E7EB] flex items-center justify-between gap-3 shrink-0 sticky bottom-0 z-10 pb-[max(1rem,env(safe-area-inset-bottom))]">
                <button
                  type="button"
                  onClick={() => handleDownloadCalendar(modalEvent)}
                  className="h-11 min-h-[44px] px-3.5 border border-[#6B7280] rounded-xl text-xs font-medium text-[#0A0A0A] hover:bg-white flex items-center gap-1.5 transition-colors cursor-pointer touch-target-44"
                >
                  <CalendarPlus className="w-4 h-4" />
                  <span>Add to calendar</span>
                </button>

                <div className="flex items-center gap-2">
                  {isUserHost ? (
                    <button
                      type="button"
                      onClick={() => {
                        const id = modalEvent.id;
                        setSelectedDetailEvent(null);
                        handleOpenManage(id);
                      }}
                      className="h-11 min-h-[44px] px-5 bg-[#0A0A0A] hover:bg-[#262626] text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer touch-target-44 flex items-center justify-center"
                    >
                      Manage event
                    </button>
                  ) : isUserRegistered ? (
                    <button
                      type="button"
                      onClick={() => {
                        handleRsvp(modalEvent);
                      }}
                      className="h-11 min-h-[44px] px-4 bg-white border border-[#0A0A0A] text-[#0A0A0A] text-xs font-semibold rounded-xl hover:bg-neutral-100 transition-colors cursor-pointer flex items-center gap-1.5 touch-target-44"
                    >
                      <Check className="w-4 h-4" />
                      <span>Registered (Cancel)</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        handleRsvp(modalEvent);
                      }}
                      className="h-11 min-h-[44px] px-5 bg-[#0A0A0A] hover:bg-[#262626] text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer touch-target-44 flex items-center justify-center"
                    >
                      {isEventFull ? 'Join waitlist' : 'Register now'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

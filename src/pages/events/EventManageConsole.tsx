import React, { useState, useMemo, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import type { EventItem, EventRsvp } from '../../types';
import {
  formatEventDate,
  formatEventDateTimeRange,
  formatEventMetaLine,
  cleanEventTitle,
  isCheckinWindowActive
} from '../../utils/eventTimeUtils';
import { exportCsvBlob } from '../../utils/chunkedExporter';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  Download,
  Share2,
  Copy,
  Edit,
  Ban,
  Search,
  MessageSquare,
  FileSpreadsheet,
  Star,
  ExternalLink,
  ShieldCheck,
  Check,
  X,
  Upload,
  Link as LinkIcon
} from 'lucide-react';
import { UnderlineTabs, StatusBadge, EmptyState } from '../../components/ui';

interface EventManageConsoleProps {
  eventId: string;
  onBack: () => void;
}

export const EventManageConsole: React.FC<EventManageConsoleProps> = ({ eventId, onBack }) => {
  const {
    eventsList,
    eventRsvps,
    openEventCheckin,
    markAttendanceManual,
    messageEventRegistrants,
    cancelEvent,
    allUsers
  } = useData();
  const { currentUser, currentRole } = useAuth();

  const event = useMemo(() => {
    return eventsList.find(e => e.id === eventId);
  }, [eventsList, eventId]);

  const [activeTab, setActiveTab] = useState<'overview' | 'registrations' | 'checkin' | 'materials' | 'details'>('overview');
  const [regSearch, setRegSearch] = useState('');
  const [regFilterStatus, setRegFilterStatus] = useState<string>('all');
  const [announcementSubject, setAnnouncementSubject] = useState('');
  const [announcementBody, setAnnouncementBody] = useState('');
  const [showAnnounceModal, setShowAnnounceModal] = useState(false);
  const [noticeMsg, setNoticeMsg] = useState<string | null>(null);

  // Materials & Links State
  const [slidesUrl, setSlidesUrl] = useState(event?.materialsUrl || '');
  const [recordingUrl, setRecordingUrl] = useState(event?.recordingUrl || '');
  const [materialsSaved, setMaterialsSaved] = useState(false);

  useEffect(() => {
    if (event) {
      setSlidesUrl(event.materialsUrl || '');
      setRecordingUrl(event.recordingUrl || '');
    }
  }, [event]);

  // Rsvps for this event (declared unconditionally before any early return)
  const currentEventRsvps: EventRsvp[] = useMemo(() => {
    if (!event) return [];
    const list = eventRsvps.filter(r => r.eventId === eventId);
    if (list.length > 0) return list;
    // Fallback construct from event registeredUserIds if eventRsvps table is sparse
    return (event.registeredUserIds || []).map((uid, idx): EventRsvp => ({
      id: `rsvp-${idx}`,
      eventId,
      userId: uid,
      status: 'registered',
      createdAt: event.date,
      attendedAt: undefined,
      certificateId: undefined
    }));
  }, [eventRsvps, eventId, event]);

  if (!event) {
    return (
      <div className="py-20 text-center space-y-4">
        <p className="text-sm font-semibold text-[#0A0A0A]">Event not found.</p>
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 bg-[#0A0A0A] text-white rounded-xl text-xs font-semibold"
        >
          Return to Events
        </button>
      </div>
    );
  }

  const isHost = event.hostId === currentUser.id || (event.coHostIds || []).includes(currentUser.id) || currentRole === 'admin';
  const cleanTitle = cleanEventTitle(event.title, event.type);
  const limit = event.capacityLimit || 60;
  const registeredCount = event.registeredUserIds.length;
  const waitlistCount = (event.waitlistUserIds || []).length;
  const isPast = event.status === 'Completed' || event.lifecycleStatus === 'completed' ||
    (event.endsAt ? new Date(event.endsAt).getTime() < Date.now() : false);

  const attendedCount = currentEventRsvps.filter(r => r.status === 'attended').length;
  const checkinRate = registeredCount > 0 ? Math.round((attendedCount / registeredCount) * 100) : 0;

  // Active checkin window check
  const windowActive = isCheckinWindowActive(event.startsAt, event.endsAt) || !!event.checkinCode;

  const handleOpenCheckin = () => {
    const res = openEventCheckin(eventId);
    setNoticeMsg(`Check-in code ${res.checkinCode} is now active.`);
    setTimeout(() => setNoticeMsg(null), 4000);
  };

  const handleToggleAttendance = (userId: string, currentStatus: string) => {
    const nextAttended = currentStatus !== 'attended';
    markAttendanceManual(eventId, userId, nextAttended);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementSubject.trim() || !announcementBody.trim()) return;
    messageEventRegistrants(eventId, announcementSubject.trim(), announcementBody.trim());
    setShowAnnounceModal(false);
    setAnnouncementSubject('');
    setAnnouncementBody('');
    setNoticeMsg(`Announcement broadcast to ${registeredCount} registrants.`);
    setTimeout(() => setNoticeMsg(null), 4000);
  };

  const handleExportCsv = async () => {
    const headers = ['Participant ID', 'Status', 'Attended At', 'Certificate ID'];
    const rows = currentEventRsvps.map(r => [
      r.userId,
      r.status,
      r.attendedAt ? new Date(r.attendedAt).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' }) : '-',
      r.certificateId || '-'
    ]);

    await exportCsvBlob(`${cleanTitle.replace(/[^a-zA-Z0-9]/g, '_')}_Attendees.csv`, headers, rows);

    setNoticeMsg('Attendee roster CSV exported.');
    setTimeout(() => setNoticeMsg(null), 3000);
  };

  const handleSaveMaterials = (e: React.FormEvent) => {
    e.preventDefault();
    setMaterialsSaved(true);
    setNoticeMsg('Materials and recording links saved for attendees.');
    setTimeout(() => {
      setMaterialsSaved(false);
      setNoticeMsg(null);
    }, 3500);
  };

  return (
    <div className="space-y-6 font-sans text-xs pb-16">

      {/* Top Header */}
      <div className="flex items-center justify-between gap-4 border-b border-[#E5E7EB] pb-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0A0A0A] hover:underline cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to events</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCsv}
            className="px-3 py-1.5 border border-[#6B7280] rounded-xl text-xs font-medium text-[#0A0A0A] hover:bg-[#FAFAFA] flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            onClick={() => setShowAnnounceModal(true)}
            className="px-3 py-1.5 bg-[#0A0A0A] hover:bg-[#262626] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Broadcast notice</span>
          </button>
        </div>
      </div>

      {noticeMsg && (
        <div className="p-3 bg-[#FAFAFA] border border-[#E5E7EB] text-[#0A0A0A] text-xs font-medium rounded-xl flex items-center gap-2">
          <Check className="w-4 h-4 text-[#0A0A0A] shrink-0" />
          <span>{noticeMsg}</span>
        </div>
      )}

      {/* Event Header Banner */}
      <div className="p-5 bg-white border border-[#E5E7EB] rounded-2xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-[#0A0A0A] tracking-tight">
                {cleanTitle}
              </h1>
              <StatusBadge
                tone={
                  event.lifecycleStatus === 'published'
                    ? 'emerald'
                    : event.lifecycleStatus === 'pending_review'
                    ? 'amber'
                    : event.lifecycleStatus === 'cancelled'
                    ? 'rose'
                    : 'neutral'
                }
                label={event.lifecycleStatus || 'Published'}
                size="sm"
              />
            </div>
            <p className="text-xs text-[#6B7280]">
              {formatEventMetaLine(event)}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <span className="text-xs font-semibold text-[#0A0A0A] tabular-nums">
              {registeredCount} / {limit} registered
            </span>
            {waitlistCount > 0 && (
              <span className="text-[11px] text-amber-700 font-medium bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                {waitlistCount} waitlisted
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Underline Tabs: Overview · Registrations · Check-in · Materials & Feedback · Details */}
      <UnderlineTabs
        tabs={[
          { id: 'overview', label: 'Overview' },
          { id: 'registrations', label: 'Registrations', count: registeredCount },
          { id: 'checkin', label: 'Check-in', badge: event.checkinCode ? <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> : undefined },
          { id: 'materials', label: 'Materials & Feedback' },
          { id: 'details', label: 'Details' }
        ]}
        activeTab={activeTab}
        onChange={t => setActiveTab(t as any)}
      />

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 bg-white border border-[#E5E7EB] rounded-xl space-y-1">
              <span className="text-[11px] text-[#6B7280] font-medium block">Total Registrations</span>
              <span className="text-2xl font-bold text-[#0A0A0A] tabular-nums">{registeredCount}</span>
              <span className="text-[10px] text-[#6B7280]">Capacity limit: {limit}</span>
            </div>

            <div className="p-4 bg-white border border-[#E5E7EB] rounded-xl space-y-1">
              <span className="text-[11px] text-[#6B7280] font-medium block">Waitlist Queue</span>
              <span className="text-2xl font-bold text-[#0A0A0A] tabular-nums">{waitlistCount}</span>
              <span className="text-[10px] text-[#6B7280]">Auto-promotes on drop</span>
            </div>

            <div className="p-4 bg-white border border-[#E5E7EB] rounded-xl space-y-1">
              <span className="text-[11px] text-[#6B7280] font-medium block">Checked-in Attendees</span>
              <span className="text-2xl font-bold text-[#0A0A0A] tabular-nums">{attendedCount}</span>
              <span className="text-[10px] text-[#6B7280]">{checkinRate}% attendance rate</span>
            </div>

            <div className="p-4 bg-white border border-[#E5E7EB] rounded-xl space-y-1">
              <span className="text-[11px] text-[#6B7280] font-medium block">Average Rating</span>
              <span className="text-2xl font-bold text-[#0A0A0A] tabular-nums flex items-center gap-1">
                4.8 <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
              </span>
              <span className="text-[10px] text-[#6B7280]">From attendee feedback</span>
            </div>
          </div>

          {/* Pre-Event Readiness Checklist */}
          <div className="p-5 bg-white border border-[#E5E7EB] rounded-xl space-y-3">
            <h3 className="text-xs font-bold text-[#0A0A0A] uppercase tracking-wider">
              Host Preparation Checklist
            </h3>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="text-[#0A0A0A] font-medium">Speakers invited & bios verified</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                {event.venueId || event.meetingUrl ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                )}
                <span className="text-[#0A0A0A] font-medium">
                  {event.mode === 'online' ? 'Meeting link generated' : 'Venue reserved & conflict verified'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                {event.checkinCode ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Clock className="w-4 h-4 text-[#6B7280]" />
                )}
                <span className="text-[#0A0A0A] font-medium">
                  Check-in code {event.checkinCode ? `(${event.checkinCode}) generated` : 'opens 30m prior to start'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: REGISTRATIONS */}
      {activeTab === 'registrations' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-[#6B7280] absolute left-3 top-2.5" />
              <input
                type="text"
                value={regSearch}
                onChange={e => setRegSearch(e.target.value)}
                placeholder="Search registered members..."
                className="w-full h-9 pl-9 pr-3 bg-white border border-[#6B7280] rounded-xl text-xs text-[#0A0A0A] focus:outline-none focus:border-[#0A0A0A]"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={regFilterStatus}
                onChange={e => setRegFilterStatus(e.target.value)}
                className="h-9 px-3 bg-white border border-[#6B7280] rounded-xl text-xs font-medium text-[#0A0A0A] focus:outline-none cursor-pointer"
              >
                <option value="all">All statuses</option>
                <option value="registered">Registered</option>
                <option value="waitlisted">Waitlisted</option>
                <option value="attended">Attended</option>
              </select>
            </div>
          </div>

          <div className="border border-[#E5E7EB] rounded-xl overflow-hidden bg-white">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E5E7EB] bg-[#FAFAFA] text-[11px] font-semibold text-[#6B7280]">
                  <th className="py-2.5 px-4">Member ID</th>
                  <th className="py-2.5 px-4">Role</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {currentEventRsvps.map(rsvp => (
                  <tr key={rsvp.id} className="hover:bg-[#FAFAFA]">
                    <td className="py-3 px-4 font-mono font-medium text-[#0A0A0A]">{rsvp.userId}</td>
                    <td className="py-3 px-4 text-[#6B7280]">Member</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${
                        rsvp.status === 'attended'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : rsvp.status === 'waitlisted'
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : 'bg-[#F3F4F6] text-[#0A0A0A] border border-[#E5E7EB]'
                      }`}>
                        {rsvp.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleToggleAttendance(rsvp.userId, rsvp.status)}
                        className="text-xs font-semibold text-[#0A0A0A] hover:underline cursor-pointer"
                      >
                        {rsvp.status === 'attended' ? 'Mark uncheck' : 'Mark present'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: CHECK-IN */}
      {activeTab === 'checkin' && (
        <div className="space-y-6 max-w-xl">
          <div className="p-5 bg-white border border-[#E5E7EB] rounded-2xl space-y-4 text-center">
            <h3 className="font-bold text-base text-[#0A0A0A]">
              Live Event Check-in Station
            </h3>
            <p className="text-xs text-[#6B7280]">
              Project this 6-digit code or QR code on the auditorium screen. Attendees enter it on their devices to record attendance.
            </p>

            {event.checkinCode ? (
              <div className="py-6 space-y-3">
                <div className="inline-block p-4 bg-[#FAFAFA] border-2 border-[#0A0A0A] rounded-2xl">
                  <span className="font-mono text-4xl sm:text-5xl font-black tracking-widest text-[#0A0A0A]">
                    {event.checkinCode}
                  </span>
                </div>
                <div className="flex items-center justify-center gap-2 text-xs text-[#6B7280]">
                  <QrCode className="w-4 h-4" />
                  <span>Scan QR or enter 6-digit code in app</span>
                </div>
              </div>
            ) : (
              <div className="py-6">
                <button
                  type="button"
                  onClick={handleOpenCheckin}
                  className="px-6 py-2.5 bg-[#0A0A0A] text-white rounded-xl text-xs font-semibold hover:bg-[#262626] transition-colors cursor-pointer"
                >
                  Generate 6-digit check-in code
                </button>
              </div>
            )}

            <div className="pt-3 border-t border-[#E5E7EB] flex items-center justify-between text-xs">
              <span className="text-[#6B7280]">Live Verified:</span>
              <strong className="text-[#0A0A0A] font-bold tabular-nums">
                {attendedCount} / {registeredCount} Attendees
              </strong>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: MATERIALS & FEEDBACK */}
      {activeTab === 'materials' && (
        <div className="space-y-6 max-w-xl">
          <form onSubmit={handleSaveMaterials} className="p-5 bg-white border border-[#E5E7EB] rounded-2xl space-y-4">
            <h3 className="font-bold text-sm text-[#0A0A0A]">
              Post-Event Materials & Recording
            </h3>
            <p className="text-xs text-[#6B7280]">
              Share presentation slide decks, Github repositories, and cloud recordings with attendees.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#0A0A0A] mb-1">
                  Presentation Slides / Deck URL
                </label>
                <input
                  type="url"
                  value={slidesUrl}
                  onChange={e => setSlidesUrl(e.target.value)}
                  placeholder="https://drive.google.com/..."
                  className="w-full h-9 px-3 bg-white border border-[#6B7280] rounded-xl text-xs text-[#0A0A0A]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0A0A0A] mb-1">
                  Video Recording URL
                </label>
                <input
                  type="url"
                  value={recordingUrl}
                  onChange={e => setRecordingUrl(e.target.value)}
                  placeholder="https://youtube.com/watch?v=..."
                  className="w-full h-9 px-3 bg-white border border-[#6B7280] rounded-xl text-xs text-[#0A0A0A]"
                />
              </div>

              <button
                type="submit"
                className="px-4 py-2 bg-[#0A0A0A] text-white rounded-xl text-xs font-semibold hover:bg-[#262626] transition-colors cursor-pointer"
              >
                Save materials
              </button>
            </div>
          </form>

          {/* Attendee Feedback Summary */}
          <div className="p-5 bg-white border border-[#E5E7EB] rounded-2xl space-y-3">
            <h3 className="font-bold text-sm text-[#0A0A0A]">
              Attendee Feedback & Reviews
            </h3>
            <div className="p-3 bg-[#FAFAFA] rounded-xl border border-[#E5E7EB] space-y-1">
              <div className="flex items-center gap-1 text-amber-500">
                <Star className="w-4 h-4 fill-amber-500" />
                <Star className="w-4 h-4 fill-amber-500" />
                <Star className="w-4 h-4 fill-amber-500" />
                <Star className="w-4 h-4 fill-amber-500" />
                <Star className="w-4 h-4 fill-amber-500" />
              </div>
              <p className="text-xs text-[#0A0A0A] font-medium">
                "Excellent real-world system architecture walkthrough. Great Q&A session with alumni speakers."
              </p>
              <span className="text-[10px] text-[#6B7280]">Verified Student Attendee (CMPN)</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: DETAILS (Read-only summary with Edit trigger) */}
      {activeTab === 'details' && (
        <div className="p-5 bg-white border border-[#E5E7EB] rounded-2xl space-y-4 max-w-2xl">
          <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
            <h3 className="font-bold text-sm text-[#0A0A0A]">Session Specification</h3>
            <span className="text-xs text-[#6B7280] font-mono">Version {event.version || 1}</span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-[#6B7280] block text-[11px]">Category</span>
              <strong className="text-[#0A0A0A]">{event.type}</strong>
            </div>
            <div>
              <span className="text-[#6B7280] block text-[11px]">Mode</span>
              <strong className="text-[#0A0A0A] capitalize">{event.mode || (event.isOnline ? 'Online' : 'On campus')}</strong>
            </div>
            <div>
              <span className="text-[#6B7280] block text-[11px]">Capacity</span>
              <strong className="text-[#0A0A0A]">{event.capacityLimit || 60} seats</strong>
            </div>
            <div>
              <span className="text-[#6B7280] block text-[11px]">Certificates Enabled</span>
              <strong className="text-[#0A0A0A]">{event.certificatesEnabled !== false ? 'Yes (Attended only)' : 'No'}</strong>
            </div>
          </div>

          <div className="pt-3 border-t border-[#E5E7EB]">
            <span className="text-[#6B7280] block text-[11px] mb-1">Description</span>
            <p className="text-xs text-[#374151] leading-relaxed whitespace-pre-line">{event.description}</p>
          </div>
        </div>
      )}

      {/* Broadcast Announcement Modal */}
      {showAnnounceModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSendMessage} className="bg-white rounded-2xl max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
              <h3 className="font-bold text-sm text-[#0A0A0A]">Broadcast Notice to Registrants</h3>
              <button
                type="button"
                onClick={() => setShowAnnounceModal(false)}
                className="p-1 rounded-lg text-[#6B7280] hover:text-[#0A0A0A]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#0A0A0A] mb-1">Subject</label>
                <input
                  type="text"
                  value={announcementSubject}
                  onChange={e => setAnnouncementSubject(e.target.value)}
                  placeholder="e.g. Session Room Change / Bring Laptops"
                  className="w-full h-9 px-3 bg-white border border-[#6B7280] rounded-xl text-xs text-[#0A0A0A]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0A0A0A] mb-1">Message Body</label>
                <textarea
                  value={announcementBody}
                  onChange={e => setAnnouncementBody(e.target.value)}
                  placeholder="Important updates for attendees..."
                  rows={4}
                  className="w-full p-3 bg-white border border-[#6B7280] rounded-xl text-xs text-[#0A0A0A]"
                  required
                />
              </div>
            </div>

            <div className="pt-3 border-t border-[#E5E7EB] flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAnnounceModal(false)}
                className="px-4 py-2 border border-[#6B7280] rounded-xl text-xs font-medium text-[#0A0A0A]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#0A0A0A] text-white rounded-xl text-xs font-semibold"
              >
                Send announcement
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};

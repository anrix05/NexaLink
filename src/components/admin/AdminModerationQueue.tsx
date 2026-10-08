import React, { useState, useMemo } from 'react';
import type { EventItem, JobListing } from '../../types';
import { checkVenueConflict, cleanEventTitle, formatEventDateTimeRange } from '../../utils/eventTimeUtils';
import { getVenueById } from '../../data/venuesData';
import {
  Calendar,
  Briefcase,
  Flag,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Building,
  User,
  Check,
  X,
  ExternalLink,
  MessageSquare,
  AlertCircle,
  ChevronRight,
  Eye
} from 'lucide-react';
import { Modal } from '../common/UIComponents';

interface AdminModerationQueueProps {
  pendingEvents: EventItem[];
  pendingJobs: JobListing[];
  reportedMessages: any[];
  allEvents: EventItem[];
  onApproveEvent: (id: string) => void;
  onRequestEventChanges: (id: string, note: string) => void;
  onRejectEvent: (id: string, reason: string) => void;
  onApproveJob: (id: string) => void;
  onRequestJobChanges: (id: string, note: string) => void;
  onRejectJob: (id: string, reason: string) => void;
  onDismissReport: (id: string) => void;
  onActionReport: (id: string) => void;
}

export const AdminModerationQueue: React.FC<AdminModerationQueueProps> = ({
  pendingEvents,
  pendingJobs,
  reportedMessages,
  allEvents,
  onApproveEvent,
  onRequestEventChanges,
  onRejectEvent,
  onApproveJob,
  onRequestJobChanges,
  onRejectJob,
  onDismissReport,
  onActionReport
}) => {
  const [subTab, setSubTab] = useState<'events' | 'opportunities' | 'messages'>('events');

  // Selected item IDs for master-detail
  const [selectedEventId, setSelectedEventId] = useState<string | null>(
    pendingEvents[0]?.id || null
  );
  const [selectedJobId, setSelectedJobId] = useState<string | null>(
    pendingJobs[0]?.id || null
  );

  // Request Changes Modal State
  const [changesModalTarget, setChangesModalTarget] = useState<{
    type: 'event' | 'job';
    id: string;
    title: string;
  } | null>(null);
  const [changesSelectedTemplate, setChangesSelectedTemplate] = useState<string>('missing_details');
  const [changesCustomNote, setChangesCustomNote] = useState('');

  // Rejection Modal State
  const [rejectModalTarget, setRejectModalTarget] = useState<{
    type: 'event' | 'job';
    id: string;
    title: string;
  } | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Compute selected items
  const activeEvent = useMemo(() => {
    return pendingEvents.find(e => e.id === selectedEventId) || pendingEvents[0] || null;
  }, [pendingEvents, selectedEventId]);

  const activeJob = useMemo(() => {
    return pendingJobs.find(j => j.id === selectedJobId) || pendingJobs[0] || null;
  }, [pendingJobs, selectedJobId]);

  // SLA Calculation (48h / 2 business days window)
  const getSlaIndicator = (createdAtStr?: string) => {
    const created = createdAtStr ? new Date(createdAtStr).getTime() : Date.now() - 32 * 3600 * 1000;
    const hoursElapsed = Math.max(0, Math.floor((Date.now() - created) / (1000 * 60 * 60)));
    const hoursRemaining = Math.max(0, 48 - hoursElapsed);

    if (hoursRemaining === 0) {
      return {
        label: 'SLA Breached',
        className: 'bg-rose-50 text-rose-700 border-rose-200'
      };
    }
    if (hoursRemaining <= 16) {
      return {
        label: `${hoursRemaining}h left in SLA`,
        className: 'bg-amber-50 text-amber-800 border-amber-200'
      };
    }
    return {
      label: `${hoursRemaining}h SLA window`,
      className: 'bg-neutral-100 text-[#0A0A0A] border-[#E5E7EB]'
    };
  };

  // Event Venue Conflict Check
  const eventVenueConflict = useMemo(() => {
    if (!activeEvent || !activeEvent.venueId || !activeEvent.startsAt || !activeEvent.endsAt) return null;
    return checkVenueConflict(
      activeEvent.venueId,
      activeEvent.startsAt,
      activeEvent.endsAt,
      activeEvent.id,
      allEvents
    );
  }, [activeEvent, allEvents]);

  // Request Changes Templates
  const EVENT_CHANGE_TEMPLATES = [
    {
      id: 'missing_details',
      label: 'Missing Agenda & Prerequisites',
      text: 'Please provide a detailed session breakdown and any required software, prerequisites, or laptop specifications for attending students.'
    },
    {
      id: 'venue_timing',
      label: 'Adjust Venue / Session Timing',
      text: 'The requested campus venue or time slot conflicts with scheduled academic lectures. Please select an alternate seminar hall or adjust start time.'
    },
    {
      id: 'speaker_verification',
      label: 'Speaker Designation & Profile',
      text: 'Please verify the keynote speaker designation, company affiliation, and institutional sponsorship department before publication.'
    }
  ];

  const JOB_CHANGE_TEMPLATES = [
    {
      id: 'comp_clarity',
      label: 'Clarify Compensation Package',
      text: 'Please specify the exact stipend range (monthly) or annual CTC range (LPA) so applicants understand the financial terms.'
    },
    {
      id: 'eligibility_scope',
      label: 'Broaden Academic Eligibility',
      text: 'The academic department criteria or CGPA cutoff is restrictive. Please verify if students across all allied engineering branches may apply.'
    },
    {
      id: 'application_process',
      label: 'Clarify Application Method',
      text: 'Please provide the direct ATS careers portal link or confirm if internal referrals are provided directly on NexaLink.'
    }
  ];

  const handleOpenChangesModal = (type: 'event' | 'job', id: string, title: string) => {
    const templates = type === 'event' ? EVENT_CHANGE_TEMPLATES : JOB_CHANGE_TEMPLATES;
    setChangesModalTarget({ type, id, title });
    setChangesSelectedTemplate(templates[0].id);
    setChangesCustomNote(templates[0].text);
  };

  const handleConfirmRequestChanges = () => {
    if (!changesModalTarget) return;
    const finalNote = changesCustomNote.trim() || 'Changes requested by institutional administrator.';
    if (changesModalTarget.type === 'event') {
      onRequestEventChanges(changesModalTarget.id, finalNote);
    } else {
      onRequestJobChanges(changesModalTarget.id, finalNote);
    }
    setChangesModalTarget(null);
  };

  const handleOpenRejectModal = (type: 'event' | 'job', id: string, title: string) => {
    setRejectModalTarget({ type, id, title });
    setRejectReason('Does not adhere to institutional academic collaboration policies.');
  };

  const handleConfirmReject = () => {
    if (!rejectModalTarget) return;
    if (rejectModalTarget.type === 'event') {
      onRejectEvent(rejectModalTarget.id, rejectReason);
    } else {
      onRejectJob(rejectModalTarget.id, rejectReason);
    }
    setRejectModalTarget(null);
  };

  return (
    <div className="space-y-6 font-sans text-xs">
      {/* Sub-tabs Row */}
      <div className="flex items-center gap-2 border-b border-[#E5E7EB]">
        {[
          { id: 'events', label: 'Events Queue', count: pendingEvents.length, icon: Calendar },
          { id: 'opportunities', label: 'Opportunities Queue', count: pendingJobs.length, icon: Briefcase },
          { id: 'messages', label: 'Reported Messages', count: reportedMessages.length, icon: Flag }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = subTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSubTab(tab.id as any)}
              className={`pb-3 px-3 text-xs font-semibold cursor-pointer border-b-2 transition-colors flex items-center gap-2 ${
                isActive
                  ? 'border-[#0A0A0A] text-[#0A0A0A]'
                  : 'border-transparent text-[#6B7280] hover:text-[#0A0A0A]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                tab.count > 0 ? 'bg-amber-100 text-amber-900 font-bold' : 'bg-neutral-100 text-[#6B7280]'
              }`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* SUB-VIEW 1: EVENTS MODERATION */}
      {subTab === 'events' && (
        <div>
          {pendingEvents.length === 0 ? (
            <div className="bg-white border border-[#E5E7EB] rounded-2xl p-16 text-center space-y-3">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
              <h3 className="text-sm font-bold text-[#0A0A0A]">All events moderated</h3>
              <p className="text-xs text-[#6B7280] max-w-sm mx-auto">
                No guest lectures, workshops, or institutional meetups are currently awaiting administrative review.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Submissions Rail (5 cols) */}
              <div className="lg:col-span-5 bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden shadow-sm divide-y divide-[#E5E7EB]">
                <div className="p-3.5 px-4 bg-[#FAFAFA] border-b border-[#E5E7EB] flex items-center justify-between text-xs text-[#6B7280]">
                  <span className="font-semibold text-[#0A0A0A]">
                    {pendingEvents.length} Event{pendingEvents.length > 1 ? 's' : ''} Pending
                  </span>
                  <span>2-Day Institutional SLA</span>
                </div>

                {pendingEvents.map(evt => {
                  const isSelected = activeEvent?.id === evt.id;
                  const sla = getSlaIndicator(evt.startsAt || evt.date);
                  const venue = evt.venueId ? getVenueById(evt.venueId) : null;
                  const isChangesRequested = evt.lifecycleStatus === 'changes_requested';

                  return (
                    <button
                      key={evt.id}
                      type="button"
                      onClick={() => setSelectedEventId(evt.id)}
                      className={`w-full p-4 text-left cursor-pointer transition-colors block ${
                        isSelected ? 'bg-neutral-50 border-l-4 border-l-[#0A0A0A]' : 'hover:bg-neutral-50/50'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-100 text-[#0A0A0A] font-semibold">
                          {evt.type}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono border font-semibold ${sla.className}`}>
                          {sla.label}
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-[#0A0A0A] leading-snug line-clamp-2">
                        {cleanEventTitle(evt.title, evt.type)}
                      </h4>

                      <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px] text-[#6B7280]">
                        <span className="font-semibold text-[#0A0A0A]">{evt.speakerName || 'Keynote Host'}</span>
                        <span>•</span>
                        <span>{evt.department || 'CMPN'}</span>
                        <span>•</span>
                        <span>{evt.date}</span>
                      </div>

                      {isChangesRequested && (
                        <div className="mt-2 text-[10px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 inline-block">
                          Changes Requested
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Right Column: Master-Detail Review Pane (7 cols) */}
              {activeEvent && (
                <div className="lg:col-span-7 bg-white border border-[#E5E7EB] rounded-2xl p-6 space-y-6 shadow-sm">
                  {/* Header & Status */}
                  <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#E5E7EB]">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-100 text-[#0A0A0A] font-semibold">
                          {activeEvent.type}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200">
                          {activeEvent.mode === 'online' ? 'Online Webinar' : activeEvent.mode === 'hybrid' ? 'Hybrid' : 'On-Campus'}
                        </span>
                      </div>
                      <h2 className="text-base font-bold text-[#0A0A0A] leading-snug font-outfit">
                        {cleanEventTitle(activeEvent.title, activeEvent.type)}
                      </h2>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOpenChangesModal('event', activeEvent.id, activeEvent.title)}
                        className="px-3 py-1.5 border border-[#6B7280] text-[#0A0A0A] rounded-xl text-xs font-semibold hover:border-[#0A0A0A] cursor-pointer"
                      >
                        Request Changes
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenRejectModal('event', activeEvent.id, activeEvent.title)}
                        className="px-3 py-1.5 border border-rose-200 text-rose-700 hover:bg-rose-50 rounded-xl text-xs font-semibold cursor-pointer"
                      >
                        Reject
                      </button>
                      <button
                        type="button"
                        onClick={() => onApproveEvent(activeEvent.id)}
                        className="px-4 py-1.5 bg-[#0A0A0A] text-white rounded-xl text-xs font-semibold hover:bg-neutral-800 cursor-pointer shadow-sm"
                      >
                        Approve & Publish Live
                      </button>
                    </div>
                  </div>

                  {/* Venue Conflict Detector Banner */}
                  {eventVenueConflict ? (
                    <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold">Venue Conflict Detected</p>
                        <p className="text-[11px] text-amber-800 mt-0.5">
                          {eventVenueConflict.message ||
                            `Another institutional event (${eventVenueConflict.conflictingEvent?.title}) is scheduled at the same venue and time.`}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-emerald-50/60 border border-emerald-200/80 rounded-xl text-xs text-emerald-900 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Venue Verified: No campus booking collisions detected for this time slot.</span>
                    </div>
                  )}

                  {/* Event Details Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <span className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">
                        Date & Time (IST)
                      </span>
                      <p className="text-xs font-bold text-[#0A0A0A]">
                        {formatEventDateTimeRange(activeEvent.startsAt, activeEvent.endsAt, activeEvent.time)}
                      </p>
                      <p className="text-[11px] text-[#6B7280]">
                        Standard Academic Slot
                      </p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">
                        Location / Venue
                      </span>
                      <p className="text-xs font-bold text-[#0A0A0A]">
                        {activeEvent.locationOrUrl || 'Campus Venue'}
                      </p>
                      <p className="text-[11px] text-[#6B7280]">
                        Capacity Limit: {activeEvent.capacityLimit || 60} Attendees
                      </p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">
                        Host & Keynote Speaker
                      </span>
                      <p className="text-xs font-bold text-[#0A0A0A]">{activeEvent.speakerName}</p>
                      <p className="text-[11px] text-[#6B7280]">
                        {activeEvent.speakerDesignation} • {activeEvent.speakerCompany}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">
                        Departments
                      </span>
                      <p className="text-xs font-bold text-[#0A0A0A]">
                        Organizing: {activeEvent.department || 'CMPN'}
                      </p>
                      {activeEvent.sponsorDepartment && (
                        <p className="text-[11px] text-[#6B7280]">
                          Sponsoring: {activeEvent.sponsorDepartment} Department
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Description & Overview */}
                  <div className="space-y-1.5 pt-4 border-t border-[#E5E7EB]">
                    <span className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">
                      Event Summary & Syllabus
                    </span>
                    <p className="text-xs text-[#0A0A0A] leading-relaxed bg-[#FAFAFA] p-3 rounded-xl border border-[#E5E7EB] whitespace-pre-line">
                      {activeEvent.summary || activeEvent.description}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* SUB-VIEW 2: OPPORTUNITIES MODERATION */}
      {subTab === 'opportunities' && (
        <div>
          {pendingJobs.length === 0 ? (
            <div className="bg-white border border-[#E5E7EB] rounded-2xl p-16 text-center space-y-3">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
              <h3 className="text-sm font-bold text-[#0A0A0A]">All opportunities moderated</h3>
              <p className="text-xs text-[#6B7280] max-w-sm mx-auto">
                No job postings, internships, or referral requests are currently pending administrative review.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Submissions Rail */}
              <div className="lg:col-span-5 bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden shadow-sm divide-y divide-[#E5E7EB]">
                <div className="p-3.5 px-4 bg-[#FAFAFA] border-b border-[#E5E7EB] flex items-center justify-between text-xs text-[#6B7280]">
                  <span className="font-semibold text-[#0A0A0A]">
                    {pendingJobs.length} Opportunity Listing{pendingJobs.length > 1 ? 's' : ''}
                  </span>
                  <span>Alumni Moderation</span>
                </div>

                {pendingJobs.map(job => {
                  const isSelected = activeJob?.id === job.id;
                  const sla = getSlaIndicator(job.postedDate);

                  return (
                    <button
                      key={job.id}
                      type="button"
                      onClick={() => setSelectedJobId(job.id)}
                      className={`w-full p-4 text-left cursor-pointer transition-colors block ${
                        isSelected ? 'bg-neutral-50 border-l-4 border-l-[#0A0A0A]' : 'hover:bg-neutral-50/50'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-100 text-[#0A0A0A] font-semibold">
                          {job.type}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono border font-semibold ${sla.className}`}>
                          {sla.label}
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-[#0A0A0A] leading-snug line-clamp-2">
                        {job.title}
                      </h4>

                      <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px] text-[#6B7280]">
                        <span className="font-semibold text-[#0A0A0A]">{job.company}</span>
                        <span>•</span>
                        <span>{job.stipendOrSalary}</span>
                        <span>•</span>
                        <span>By {job.postedByAlumniName}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Right Column: Review Details Pane */}
              {activeJob && (
                <div className="lg:col-span-7 bg-white border border-[#E5E7EB] rounded-2xl p-6 space-y-6 shadow-sm">
                  {/* Header & Controls */}
                  <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#E5E7EB]">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-100 text-[#0A0A0A] font-semibold">
                          {activeJob.type}
                        </span>
                        {activeJob.referralProvided && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200">
                            Alumni Referral
                          </span>
                        )}
                      </div>
                      <h2 className="text-base font-bold text-[#0A0A0A] leading-snug font-outfit">
                        {activeJob.title}
                      </h2>
                      <p className="text-xs text-[#6B7280] mt-0.5">
                        {activeJob.company} • {activeJob.location} ({activeJob.workMode || 'Hybrid'})
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOpenChangesModal('job', activeJob.id, activeJob.title)}
                        className="px-3 py-1.5 border border-[#6B7280] text-[#0A0A0A] rounded-xl text-xs font-semibold hover:border-[#0A0A0A] cursor-pointer"
                      >
                        Request Changes
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenRejectModal('job', activeJob.id, activeJob.title)}
                        className="px-3 py-1.5 border border-rose-200 text-rose-700 hover:bg-rose-50 rounded-xl text-xs font-semibold cursor-pointer"
                      >
                        Reject
                      </button>
                      <button
                        type="button"
                        onClick={() => onApproveJob(activeJob.id)}
                        className="px-4 py-1.5 bg-[#0A0A0A] text-white rounded-xl text-xs font-semibold hover:bg-neutral-800 cursor-pointer shadow-sm"
                      >
                        Approve & Publish Live
                      </button>
                    </div>
                  </div>

                  {/* Compensation & Openings Banner */}
                  <div className="p-3.5 bg-[#FAFAFA] border border-[#E5E7EB] rounded-xl grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="text-[10px] text-[#6B7280] uppercase tracking-wider block">Compensation</span>
                      <span className="font-bold text-[#0A0A0A] font-sans tabular-nums">{activeJob.stipendOrSalary}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#6B7280] uppercase tracking-wider block">Deadline</span>
                      <span className="font-bold text-[#0A0A0A] font-mono">{activeJob.applicationDeadline}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#6B7280] uppercase tracking-wider block">Application Method</span>
                      <span className="font-bold text-[#0A0A0A]">
                        {activeJob.applyMethod === 'external' ? 'External Link' : 'NexaLink In-App'}
                      </span>
                    </div>
                  </div>

                  {/* Skills Required */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">
                      Target Stack & Skills
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {(activeJob.skillsRequired || []).map(s => (
                        <span key={s} className="px-2.5 py-0.5 bg-neutral-100 text-[#0A0A0A] rounded-md font-medium text-[11px]">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-1.5 pt-4 border-t border-[#E5E7EB]">
                    <span className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">
                      Role Overview & Responsibilities
                    </span>
                    <p className="text-xs text-[#0A0A0A] leading-relaxed bg-[#FAFAFA] p-3 rounded-xl border border-[#E5E7EB] whitespace-pre-line">
                      {activeJob.description}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* SUB-VIEW 3: REPORTED MESSAGES */}
      {subTab === 'messages' && (
        <div className="space-y-4">
          {reportedMessages.length === 0 ? (
            <div className="bg-white border border-[#E5E7EB] rounded-2xl p-16 text-center space-y-3">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
              <h3 className="text-sm font-bold text-[#0A0A0A]">No reported messages</h3>
              <p className="text-xs text-[#6B7280] max-w-sm mx-auto">
                Member communication channels are safe and free of outstanding misconduct reports.
              </p>
            </div>
          ) : (
            <div className="bg-white border border-[#E5E7EB] rounded-2xl divide-y divide-[#E5E7EB] overflow-hidden shadow-sm">
              {reportedMessages.map(report => (
                <div key={report.id} className="p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-[#0A0A0A]">
                        Reported by: {report.reportedBy || 'Verified Member'}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 font-semibold border border-rose-200">
                        Safety Flag
                      </span>
                      <span className="text-xs text-[#6B7280]">
                        {new Date(report.reportedAt || report.timestamp).toLocaleDateString('en-IN')}
                      </span>
                    </div>

                    <p className="text-xs text-[#6B7280]">
                      Sender: <strong className="text-[#0A0A0A]">{report.senderName}</strong> • Reason: {report.reportReason || 'Policy Violation'}
                    </p>

                    <div className="p-3 bg-[#FAFAFA] border border-[#E5E7EB] rounded-xl text-xs text-[#0A0A0A] italic">
                      "{report.content}"
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => onDismissReport(report.id)}
                      className="px-3.5 py-1.5 border border-[#6B7280] text-[#0A0A0A] rounded-xl text-xs font-semibold hover:border-[#0A0A0A] cursor-pointer"
                    >
                      Dismiss Report
                    </button>
                    <button
                      type="button"
                      onClick={() => onActionReport(report.id)}
                      className="px-3.5 py-1.5 bg-rose-600 text-white rounded-xl text-xs font-semibold hover:bg-rose-700 cursor-pointer"
                    >
                      Issue Warning / Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Request Changes Modal */}
      {changesModalTarget && (
        <Modal
          isOpen={!!changesModalTarget}
          onClose={() => setChangesModalTarget(null)}
          title="Request Submission Changes"
          subtitle={`Provide feedback for "${changesModalTarget.title}". The host can update and resubmit.`}
        >
          <div className="space-y-4 font-sans text-xs">
            <div>
              <label className="block text-xs font-semibold text-[#0A0A0A] mb-1.5">
                Feedback Template
              </label>
              <div className="space-y-2">
                {(changesModalTarget.type === 'event' ? EVENT_CHANGE_TEMPLATES : JOB_CHANGE_TEMPLATES).map(tpl => (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => {
                      setChangesSelectedTemplate(tpl.id);
                      setChangesCustomNote(tpl.text);
                    }}
                    className={`w-full p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                      changesSelectedTemplate === tpl.id
                        ? 'border-[#0A0A0A] bg-neutral-50'
                        : 'border-[#E5E7EB] hover:border-[#6B7280]'
                    }`}
                  >
                    <span className="font-bold text-[#0A0A0A] block">{tpl.label}</span>
                    <span className="text-[11px] text-[#6B7280] line-clamp-1">{tpl.text}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0A0A0A] mb-1">
                Custom Feedback Note for Host
              </label>
              <textarea
                rows={3}
                value={changesCustomNote}
                onChange={e => setChangesCustomNote(e.target.value)}
                className="w-full p-3 bg-white border border-[#6B7280] rounded-xl text-xs text-[#0A0A0A] focus:outline-none focus:border-[#0A0A0A]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E5E7EB]">
              <button
                type="button"
                onClick={() => setChangesModalTarget(null)}
                className="px-3.5 py-1.5 border border-[#6B7280] text-[#0A0A0A] rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRequestChanges}
                className="px-4 py-1.5 bg-[#0A0A0A] text-white rounded-xl text-xs font-semibold hover:bg-neutral-800"
              >
                Send Feedback to Host
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Reject Modal */}
      {rejectModalTarget && (
        <Modal
          isOpen={!!rejectModalTarget}
          onClose={() => setRejectModalTarget(null)}
          title="Reject Submission"
          subtitle={`Are you sure you want to reject "${rejectModalTarget.title}"?`}
        >
          <div className="space-y-4 font-sans text-xs">
            <div>
              <label className="block text-xs font-semibold text-[#0A0A0A] mb-1">
                Rejection Reason (Mandatory)
              </label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="State the institutional policy reason for rejection..."
                className="w-full p-3 bg-white border border-[#6B7280] rounded-xl text-xs text-[#0A0A0A] focus:outline-none focus:border-[#0A0A0A]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E5E7EB]">
              <button
                type="button"
                onClick={() => setRejectModalTarget(null)}
                className="px-3.5 py-1.5 border border-[#6B7280] text-[#0A0A0A] rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="px-4 py-1.5 bg-rose-600 text-white rounded-xl text-xs font-semibold hover:bg-rose-700"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

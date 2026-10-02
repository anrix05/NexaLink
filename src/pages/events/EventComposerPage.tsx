import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import type { EventItem, EventType, EventMode, DepartmentCode, EventSpeaker, EventAgendaItem, UserRole } from '../../types';
import { EVENT_CATEGORIES, DEPARTMENT_TAXONOMY, type DepartmentInfo } from '../../constants/taxonomy';
import { VENUES_REGISTRY, getVenueById } from '../../data/venuesData';
import {
  formatEventDate,
  formatEventDateTimeRange,
  formatEventMetaLine,
  cleanEventTitle,
  checkVenueConflict,
  validateEventLeadTime,
  createEventIsoTimestamps
} from '../../utils/eventTimeUtils';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Video,
  Users,
  Plus,
  Trash2,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Eye,
  X,
  Sparkles,
  Save,
  Send,
  Upload,
  Image as ImageIcon,
  Link as LinkIcon,
  RefreshCw
} from 'lucide-react';
import { StatusBadge } from '../../components/ui';

interface EventComposerPageProps {
  eventId?: string | null;
  initialTemplate?: string | null;
  onBack: () => void;
  onSaved: () => void;
}

interface TemplatePreset {
  name: string;
  category: EventType;
  durationMinutes: number;
  capacity: number;
  mode: EventMode;
  venueId?: string;
  waitlist: boolean;
  approvalRequired: boolean;
  audienceRoles: UserRole[];
  description: string;
}

const EVENT_TEMPLATES: Record<string, TemplatePreset> = {
  'Guest lecture': {
    name: 'Guest lecture',
    category: 'Guest Lecture',
    durationMinutes: 60,
    capacity: 120,
    mode: 'on_campus',
    venueId: 'venue-sh2',
    waitlist: true,
    approvalRequired: false,
    audienceRoles: ['student', 'faculty', 'alumni'],
    description: 'Expert industry address covering emerging engineering paradigms, architectural case studies, and career guidance.'
  },
  'Technical workshop': {
    name: 'Technical workshop',
    category: 'Workshop',
    durationMinutes: 180,
    capacity: 40,
    mode: 'on_campus',
    venueId: 'venue-lab-402',
    waitlist: true,
    approvalRequired: false,
    audienceRoles: ['student', 'faculty'],
    description: 'Hands-on practical development workshop with code walk-throughs, architecture exercises, and lab execution.'
  },
  'Alumni meet': {
    name: 'Alumni meet',
    category: 'Alumni Meet',
    durationMinutes: 120,
    capacity: 250,
    mode: 'on_campus',
    venueId: 'venue-auditorium',
    waitlist: true,
    approvalRequired: false,
    audienceRoles: ['alumni', 'student'],
    description: 'Alumni networking mixer and panel discussion connecting past graduates with current student batches.'
  },
  'Placement drive': {
    name: 'Placement drive',
    category: 'Placement Drive',
    durationMinutes: 120,
    capacity: 80,
    mode: 'on_campus',
    venueId: 'venue-sh1',
    waitlist: false,
    approvalRequired: true,
    audienceRoles: ['student'],
    description: 'Campus placement drive and recruitment seminar for graduating final-year engineering students.'
  },
  'Research seminar': {
    name: 'Research seminar',
    category: 'Research Seminar',
    durationMinutes: 90,
    capacity: 60,
    mode: 'hybrid',
    venueId: 'venue-sh3',
    waitlist: true,
    approvalRequired: false,
    audienceRoles: ['faculty', 'student'],
    description: 'Academic symposium sharing ongoing grant research, peer-reviewed paper presentations, and collaborative projects.'
  }
};

const BANNER_PRESETS = [
  {
    id: 'keynote',
    label: 'Auditorium Keynote',
    url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1280&auto=format&fit=crop&q=80',
    tag: 'Keynote'
  },
  {
    id: 'tech_lab',
    label: 'Cloud & Tech Workshop',
    url: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1280&auto=format&fit=crop&q=80',
    tag: 'Workshop'
  },
  {
    id: 'alumni',
    label: 'Alumni Reunion',
    url: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=1280&auto=format&fit=crop&q=80',
    tag: 'Reunion'
  },
  {
    id: 'research',
    label: 'Research Symposium',
    url: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1280&auto=format&fit=crop&q=80',
    tag: 'Academic'
  },
  {
    id: 'hackathon',
    label: 'Campus Hackathon',
    url: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1280&auto=format&fit=crop&q=80',
    tag: 'Hackathon'
  }
];

export const EventComposerPage: React.FC<EventComposerPageProps> = ({
  eventId,
  initialTemplate,
  onBack,
  onSaved
}) => {
  const { eventsList, saveEventDraft, submitEventForReview, allUsers } = useData();
  const { currentUser, currentRole } = useAuth();

  const existingEvent = useMemo(() => {
    return eventId ? eventsList.find(e => e.id === eventId) : null;
  }, [eventId, eventsList]);

  // Form State
  const [title, setTitle] = useState(existingEvent?.title || '');
  const [category, setCategory] = useState<EventType>(existingEvent?.type || 'Alumni Meet');
  const [summary, setSummary] = useState(existingEvent?.summary || '');
  const [description, setDescription] = useState(existingEvent?.description || '');
  const [coverImageUrl, setCoverImageUrl] = useState(
    existingEvent?.bannerImage ||
    'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1280&auto=format&fit=crop&q=80'
  );

  // Banner Upload & Drop State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);

  const processImageFile = (file: File) => {
    setUploadError(null);
    if (!file.type.startsWith('image/')) {
      setUploadError('Please upload a valid image file (PNG, JPG, or WebP).');
      return;
    }
    // Limit to 5MB
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image size exceeds 5 MB. Please upload a compressed or smaller image.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      if (result) {
        setCoverImageUrl(result);
        performSaveDraft();
      }
    };
    reader.onerror = () => {
      setUploadError('Unable to read image file. Please try another image.');
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processImageFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processImageFile(e.target.files[0]);
    }
  };

  // Time & Mode State
  // Default to 4 days ahead to meet lead time by default
  const defaultDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 4);
    return d.toISOString().split('T')[0];
  }, []);

  const [date, setDate] = useState(existingEvent?.date || defaultDate);
  const [startTime, setStartTime] = useState('18:00');
  const [endTime, setEndTime] = useState('19:30');
  const [registrationCloses, setRegistrationCloses] = useState<'start' | '1day' | '1hour'>('start');

  const [mode, setMode] = useState<EventMode>(existingEvent?.mode || 'on_campus');
  const [venueId, setVenueId] = useState(existingEvent?.venueId || 'venue-sh2');
  const [customLocation, setCustomLocation] = useState(existingEvent?.locationOrUrl || '');
  const [meetingUrl, setMeetingUrl] = useState(existingEvent?.meetingUrl || 'https://meet.google.com/');

  // People & Organization
  const [organizingDept, setOrganizingDept] = useState<DepartmentCode>(
    (currentUser?.department as DepartmentCode) || 'CMPN'
  );
  const [sponsorDept, setSponsorDept] = useState<DepartmentCode>(
    existingEvent?.sponsorDepartment || 'CMPN'
  );

  const [speakers, setSpeakers] = useState<EventSpeaker[]>(
    existingEvent?.speakers || [
      {
        id: 'spk-init-1',
        name: currentUser?.name || 'Featured Speaker',
        title: 'Industry Specialist',
        organization: 'Tech Partner',
        isExternal: false
      }
    ]
  );

  // Registration & Audience
  const [capacity, setCapacity] = useState(existingEvent?.capacityLimit || 60);
  const [waitlistEnabled, setWaitlistEnabled] = useState(existingEvent?.waitlistEnabled ?? true);
  const [approvalRequired, setApprovalRequired] = useState(existingEvent?.approvalRequired ?? false);
  const [certificatesEnabled, setCertificatesEnabled] = useState(existingEvent?.certificatesEnabled ?? true);
  const [audienceRoles, setAudienceRoles] = useState<UserRole[]>(
    existingEvent?.audience?.roles || ['student', 'alumni', 'faculty']
  );
  const [audienceDepts, setAudienceDepts] = useState<DepartmentCode[]>(
    existingEvent?.audience?.departments || ['CMPN', 'INFT', 'EXTC', 'EXCS', 'BIOM']
  );

  // Agenda & Questions
  const [agenda, setAgenda] = useState<EventAgendaItem[]>(
    existingEvent?.agenda || [
      { time: '6:00 pm', item: 'Keynote & Introductions', speaker: currentUser?.name || '' },
      { time: '6:45 pm', item: 'Q&A & Networking Session' }
    ]
  );
  const [questions, setQuestions] = useState<string[]>(existingEvent?.questions || []);
  const [tags, setTags] = useState<string[]>(existingEvent?.tags || ['Engineering', 'Networking']);
  const [tagInput, setTagInput] = useState('');

  const [guidelinesConfirmed, setGuidelinesConfirmed] = useState(false);
  const [autosaveStatus, setAutosaveStatus] = useState<string>('Saved just now');
  const [mobilePreviewOpen, setMobilePreviewOpen] = useState(false);
  const [submitErrorMsg, setSubmitErrorMsg] = useState<string | null>(null);

  // Compute ISO timestamps
  const { startsAt, endsAt } = useMemo(() => {
    return createEventIsoTimestamps(date, startTime, endTime);
  }, [date, startTime, endTime]);

  // Venue Conflict Check
  const venueConflict = useMemo(() => {
    if (mode === 'online') return { hasConflict: false };
    return checkVenueConflict(venueId, startsAt, endsAt, eventId || undefined, eventsList);
  }, [mode, venueId, startsAt, endsAt, eventId, eventsList]);

  // Lead Time Check
  const leadTimeCheck = useMemo(() => {
    return validateEventLeadTime(startsAt, mode);
  }, [startsAt, mode]);

  // Policy-based submission label & state
  const isAutoApproved = currentRole === 'admin' || (currentRole === 'faculty' && organizingDept === currentUser?.department);
  const primaryButtonLabel = isAutoApproved ? 'Publish' : 'Submit for review';

  // Apply template preset
  const handleApplyTemplate = (presetKey: string) => {
    const t = EVENT_TEMPLATES[presetKey];
    if (!t) return;
    setCategory(t.category);
    setCapacity(t.capacity);
    setMode(t.mode);
    if (t.venueId) setVenueId(t.venueId);
    setWaitlistEnabled(t.waitlist);
    setApprovalRequired(t.approvalRequired);
    setAudienceRoles(t.audienceRoles);
    if (!description || description.length < 20) {
      setDescription(t.description);
    }
    setAutosaveStatus('Applied template: ' + t.name);
  };

  useEffect(() => {
    if (initialTemplate && EVENT_TEMPLATES[initialTemplate]) {
      handleApplyTemplate(initialTemplate);
    }
  }, [initialTemplate]);

  // Autosave Draft every 10 seconds and on blur
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const performSaveDraft = () => {
    if (!title.trim()) return;
    saveEventDraft({
      id: eventId || undefined,
      title: title.trim(),
      type: category,
      summary: summary.trim(),
      description: description.trim(),
      bannerImage: coverImageUrl,
      date,
      time: `${startTime} – ${endTime} IST`,
      startsAt,
      endsAt,
      mode,
      venueId: mode !== 'online' ? venueId : undefined,
      locationOrUrl: mode === 'online' ? meetingUrl : (getVenueById(venueId)?.name || customLocation),
      meetingUrl: mode !== 'on_campus' ? meetingUrl : undefined,
      department: organizingDept,
      sponsorDepartment: currentRole === 'alumni' ? sponsorDept : undefined,
      speakers,
      capacityLimit: capacity,
      waitlistEnabled,
      approvalRequired,
      certificatesEnabled,
      audience: { roles: audienceRoles, departments: audienceDepts },
      agenda,
      questions,
      tags
    });
    const now = new Date();
    setAutosaveStatus(`Saved ${now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })}`);
  };

  useEffect(() => {
    autoSaveTimerRef.current = setInterval(() => {
      performSaveDraft();
    }, 10000);
    return () => {
      if (autoSaveTimerRef.current) clearInterval(autoSaveTimerRef.current);
    };
  }, [title, category, summary, description, date, startTime, endTime, mode, venueId, meetingUrl, capacity]);

  // Validation
  const validationErrors = useMemo(() => {
    const errs: string[] = [];
    if (!title.trim() || title.trim().length < 10) {
      errs.push('Title must be at least 10 characters.');
    }
    if (title.length > 100) {
      errs.push('Title cannot exceed 100 characters.');
    }
    if (!description.trim() || description.trim().length < 50) {
      errs.push('Description must be at least 50 characters.');
    }
    if (!leadTimeCheck.valid && leadTimeCheck.message) {
      errs.push(leadTimeCheck.message);
    }
    if (venueConflict.hasConflict && venueConflict.message) {
      errs.push(venueConflict.message);
    }
    if (mode !== 'online' && venueId) {
      const v = getVenueById(venueId);
      if (v && capacity > v.capacity) {
        errs.push(`Capacity (${capacity}) cannot exceed venue capacity (${v.capacity} for ${v.name}).`);
      }
    }
    if (mode !== 'on_campus' && (!meetingUrl.startsWith('https://') || meetingUrl.length < 10)) {
      errs.push('Meeting link must be a valid secure URL starting with https://');
    }
    if (currentRole === 'alumni' && (mode === 'on_campus' || mode === 'hybrid') && !sponsorDept) {
      errs.push('Alumni campus events require a sponsoring academic department.');
    }
    if (!guidelinesConfirmed) {
      errs.push('Please confirm that this event complies with institutional guidelines.');
    }
    return errs;
  }, [title, description, leadTimeCheck, venueConflict, mode, venueId, capacity, meetingUrl, currentRole, sponsorDept, guidelinesConfirmed]);

  const canSubmit = validationErrors.length === 0;

  // Speaker Repeater Handlers
  const handleAddSpeaker = () => {
    if (speakers.length >= 5) return;
    setSpeakers(prev => [
      ...prev,
      {
        id: `spk-${Date.now()}`,
        name: '',
        title: '',
        organization: '',
        isExternal: true
      }
    ]);
  };

  const handleUpdateSpeaker = (index: number, patch: Partial<EventSpeaker>) => {
    setSpeakers(prev => {
      const next = [...prev];
      next[index] = { ...next[index], ...patch };
      return next;
    });
  };

  const handleRemoveSpeaker = (index: number) => {
    setSpeakers(prev => prev.filter((_, i) => i !== index));
  };

  // Agenda Repeater Handlers
  const handleAddAgendaItem = () => {
    setAgenda(prev => [...prev, { time: '', item: '', speaker: '' }]);
  };

  const handleUpdateAgendaItem = (index: number, patch: Partial<EventAgendaItem>) => {
    setAgenda(prev => {
      const next = [...prev];
      next[index] = { ...next[index], ...patch };
      return next;
    });
  };

  const handleRemoveAgendaItem = (index: number) => {
    setAgenda(prev => prev.filter((_, i) => i !== index));
  };

  // Tag Handlers
  const handleAddTag = () => {
    if (!tagInput.trim() || tags.length >= 5) return;
    if (!tags.includes(tagInput.trim())) {
      setTags(prev => [...prev, tagInput.trim()]);
    }
    setTagInput('');
  };

  const handleRemoveTag = (tag: string) => {
    setTags(prev => prev.filter(t => t !== tag));
  };

  // Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) {
      setSubmitErrorMsg(validationErrors[0] || 'Please complete all required fields.');
      return;
    }

    const payload: Partial<EventItem> = {
      id: eventId || undefined,
      title: title.trim(),
      type: category,
      summary: summary.trim() || title.trim(),
      description: description.trim(),
      bannerImage: coverImageUrl,
      date,
      time: `${startTime} – ${endTime} IST`,
      startsAt,
      endsAt,
      mode,
      venueId: mode !== 'online' ? venueId : undefined,
      locationOrUrl: mode === 'online' ? 'Online' : (getVenueById(venueId)?.name || customLocation),
      meetingUrl: mode !== 'on_campus' ? meetingUrl : undefined,
      department: organizingDept,
      sponsorDepartment: currentRole === 'alumni' ? sponsorDept : undefined,
      speakers,
      capacityLimit: capacity,
      waitlistEnabled,
      approvalRequired,
      certificatesEnabled,
      audience: { roles: audienceRoles, departments: audienceDepts },
      agenda,
      questions,
      tags
    };

    const res = submitEventForReview(payload, currentRole);
    if (res.success) {
      onSaved();
    } else {
      setSubmitErrorMsg(res.message);
    }
  };

  const activeVenue = getVenueById(venueId);

  return (
    <div className="space-y-6 font-sans text-xs pb-16">

      {/* Top Navigation & Status */}
      <div className="flex items-center justify-between gap-4 border-b border-[#E5E7EB] pb-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0A0A0A] hover:underline cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to events</span>
        </button>

        <div className="flex items-center gap-3">
          <span className="text-[11px] text-[#6B7280] font-mono">
            {autosaveStatus}
          </span>
          <button
            type="button"
            onClick={performSaveDraft}
            className="px-3 py-1.5 border border-[#6B7280] hover:bg-[#FAFAFA] text-[#0A0A0A] text-xs font-medium rounded-xl transition-colors cursor-pointer flex items-center gap-1"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save draft</span>
          </button>
          <button
            type="button"
            onClick={() => setMobilePreviewOpen(true)}
            className="xl:hidden px-3 py-1.5 border border-[#6B7280] rounded-xl text-xs font-medium text-[#0A0A0A] flex items-center gap-1 cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Preview</span>
          </button>
        </div>
      </div>

      {/* Template Chips Header */}
      <div className="space-y-2">
        <span className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider block">
          Quick start with an institutional template
        </span>
        <div className="flex items-center gap-2 flex-wrap">
          {Object.keys(EVENT_TEMPLATES).map(key => (
            <button
              key={key}
              type="button"
              onClick={() => handleApplyTemplate(key)}
              className="px-3 py-1.5 rounded-xl border border-[#E5E7EB] bg-white text-[#0A0A0A] font-medium text-xs hover:border-[#0A0A0A] transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#6B7280]" />
              <span>{key}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Two Column Layout: Form Column (max-w-[640px]) + Sticky Preview Column */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">

        {/* Left Form Column */}
        <form onSubmit={handleSubmit} className="xl:col-span-7 space-y-8 max-w-[640px]">

          {/* Section 1: Basics */}
          <section className="space-y-4">
            <div className="border-b border-[#E5E7EB] pb-2">
              <h2 className="text-base font-bold text-[#0A0A0A] tracking-tight">
                1. Event Basics
              </h2>
              <p className="text-xs text-[#6B7280] mt-0.5">
                Core identity, taxonomy category, and overview.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#0A0A0A] mb-1">
                  Event Title <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  onBlur={performSaveDraft}
                  placeholder="e.g. Distributed Consensus at Scale: Microservices in Practice"
                  className="w-full h-9 px-3 bg-white border border-[#6B7280] rounded-xl text-xs text-[#0A0A0A] focus:outline-none focus:border-[#0A0A0A]"
                  maxLength={100}
                />
                {title.toLowerCase().startsWith(category.toLowerCase()) && (
                  <p className="text-[11px] text-amber-700 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>The category is shown separately; you can omit "{category}:" from the title.</span>
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#0A0A0A] mb-1">
                    Category <span className="text-rose-600">*</span>
                  </label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value as EventType)}
                    className="w-full h-9 px-3 bg-white border border-[#6B7280] rounded-xl text-xs text-[#0A0A0A] focus:outline-none focus:border-[#0A0A0A] cursor-pointer"
                  >
                    {EVENT_CATEGORIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0A0A0A] mb-1">
                    Short Summary (≤160 chars)
                  </label>
                  <input
                    type="text"
                    value={summary}
                    onChange={e => setSummary(e.target.value)}
                    onBlur={performSaveDraft}
                    placeholder="Brief 1-liner displayed on notification cards"
                    className="w-full h-9 px-3 bg-white border border-[#6B7280] rounded-xl text-xs text-[#0A0A0A] focus:outline-none focus:border-[#0A0A0A]"
                    maxLength={160}
                  />
                </div>
              </div>

              {/* Banner Image Uploader & Presets */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-[#0A0A0A]">
                    Event Banner (16:9 ratio) <span className="text-[#6B7280] font-normal">· Featured on events page and invitations</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowUrlInput(!showUrlInput)}
                    className="text-[11px] font-medium text-[#6B7280] hover:text-[#0A0A0A] flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <LinkIcon className="w-3 h-3" />
                    <span>{showUrlInput ? 'Hide URL input' : 'Paste image URL'}</span>
                  </button>
                </div>

                {/* Hidden File Input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {uploadError && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{uploadError}</span>
                  </div>
                )}

                {/* Main Banner Container */}
                {coverImageUrl ? (
                  <div className="space-y-3">
                    <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-[#E5E7EB] bg-neutral-900 shadow-2xs group">
                      <img
                        src={coverImageUrl}
                        alt="Event Banner Preview"
                        className="w-full h-full object-cover"
                      />

                      {/* Top Action Overlay */}
                      <div className="absolute top-3 right-3 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-3 py-1.5 bg-white/90 hover:bg-white text-[#0A0A0A] text-xs font-medium rounded-xl shadow-xs backdrop-blur-sm transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Replace</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setCoverImageUrl('');
                            performSaveDraft();
                          }}
                          className="p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-xl backdrop-blur-sm transition-all cursor-pointer"
                          title="Remove image"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Aspect Ratio Badge */}
                      <div className="absolute bottom-3 left-3 px-2.5 py-1 bg-black/60 backdrop-blur-sm rounded-lg text-[10px] font-semibold text-white tracking-wide">
                        16:9 Banner
                      </div>
                    </div>

                    {/* Quick Preset Selector Chips */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-medium text-[#6B7280]">
                        Switch preset:
                      </span>
                      {BANNER_PRESETS.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            setCoverImageUrl(p.url);
                            performSaveDraft();
                          }}
                          className={`px-2.5 py-1 text-[11px] rounded-lg border font-medium transition-colors cursor-pointer ${
                            coverImageUrl === p.url
                              ? 'bg-[#0A0A0A] text-white border-[#0A0A0A]'
                              : 'bg-white text-[#374151] border-[#E5E7EB] hover:bg-[#FAFAFA]'
                          }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  /* Dropzone when no banner is chosen */
                  <div className="space-y-3">
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                        isDragging
                          ? 'border-[#0A0A0A] bg-neutral-100 scale-[0.99]'
                          : 'border-[#D1D5DB] hover:border-[#0A0A0A] bg-[#FAFAFA] hover:bg-neutral-50'
                      }`}
                    >
                      <div className="w-11 h-11 mx-auto rounded-full bg-white border border-[#E5E7EB] flex items-center justify-center text-[#0A0A0A] shadow-2xs mb-2">
                        <Upload className="w-5 h-5 text-[#0A0A0A]" />
                      </div>
                      <p className="text-xs font-semibold text-[#0A0A0A]">
                        Click to upload event banner or drag & drop
                      </p>
                      <p className="text-[11px] text-[#6B7280] mt-0.5">
                        PNG, JPG, or WebP (max 5 MB · 1280 × 720 recommended 16:9)
                      </p>
                    </div>

                    {/* Presets Gallery */}
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-medium text-[#6B7280] block">
                        Or pick from curated campus presets:
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                        {BANNER_PRESETS.map((preset) => (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => {
                              setCoverImageUrl(preset.url);
                              performSaveDraft();
                            }}
                            className="group text-left border border-[#E5E7EB] hover:border-[#0A0A0A] rounded-xl overflow-hidden bg-white p-1.5 transition-all shadow-2xs cursor-pointer"
                          >
                            <div className="aspect-video w-full rounded-lg overflow-hidden bg-neutral-100 mb-1.5">
                              <img
                                src={preset.url}
                                alt={preset.label}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                              />
                            </div>
                            <p className="text-[11px] font-semibold text-[#0A0A0A] truncate">
                              {preset.label}
                            </p>
                            <p className="text-[9px] text-[#6B7280]">
                              {preset.tag}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Optional Collapsible URL text input */}
                {showUrlInput && (
                  <div className="pt-1">
                    <label className="block text-[11px] font-medium text-[#6B7280] mb-1">
                      Direct image link (CDN or HTTPS URL)
                    </label>
                    <input
                      type="url"
                      value={coverImageUrl}
                      onChange={e => setCoverImageUrl(e.target.value)}
                      onBlur={performSaveDraft}
                      placeholder="https://example.com/banner.jpg"
                      className="w-full h-8 px-3 bg-white border border-[#6B7280] rounded-xl text-xs text-[#0A0A0A] focus:outline-none focus:border-[#0A0A0A]"
                    />
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Section 2: When */}
          <section className="space-y-4">
            <div className="border-b border-[#E5E7EB] pb-2">
              <h2 className="text-base font-bold text-[#0A0A0A] tracking-tight">
                2. Schedule & Timing
              </h2>
              <p className="text-xs text-[#6B7280] mt-0.5">
                Indian Standard Time (IST) schedule with automated lead time enforcement.
              </p>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#0A0A0A] mb-1">
                    Event Date (IST) <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    onBlur={performSaveDraft}
                    className="w-full h-9 px-3 bg-white border border-[#6B7280] rounded-xl text-xs text-[#0A0A0A] focus:outline-none focus:border-[#0A0A0A] cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0A0A0A] mb-1">
                    Start Time (IST) <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={e => setStartTime(e.target.value)}
                    onBlur={performSaveDraft}
                    className="w-full h-9 px-3 bg-white border border-[#6B7280] rounded-xl text-xs text-[#0A0A0A] focus:outline-none focus:border-[#0A0A0A] cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0A0A0A] mb-1">
                    End Time (IST) <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={e => setEndTime(e.target.value)}
                    onBlur={performSaveDraft}
                    className="w-full h-9 px-3 bg-white border border-[#6B7280] rounded-xl text-xs text-[#0A0A0A] focus:outline-none focus:border-[#0A0A0A] cursor-pointer"
                  />
                </div>
              </div>

              {!leadTimeCheck.valid && (
                <div className="p-3 bg-amber-50 border border-amber-200 text-amber-950 rounded-xl flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>{leadTimeCheck.message}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[#0A0A0A] mb-1">
                  Registration Window Closes
                </label>
                <select
                  value={registrationCloses}
                  onChange={e => setRegistrationCloses(e.target.value as any)}
                  className="w-full h-9 px-3 bg-white border border-[#6B7280] rounded-xl text-xs text-[#0A0A0A] focus:outline-none focus:border-[#0A0A0A] cursor-pointer"
                >
                  <option value="start">At event start</option>
                  <option value="1hour">1 hour before event start</option>
                  <option value="1day">1 day before event start</option>
                </select>
              </div>
            </div>
          </section>

          {/* Section 3: Where */}
          <section className="space-y-4">
            <div className="border-b border-[#E5E7EB] pb-2">
              <h2 className="text-base font-bold text-[#0A0A0A] tracking-tight">
                3. Venue & Format
              </h2>
              <p className="text-xs text-[#6B7280] mt-0.5">
                Select campus venue or online meeting link with automated clash prevention.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#0A0A0A] mb-1.5">
                  Delivery Mode <span className="text-rose-600">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['on_campus', 'online', 'hybrid'] as EventMode[]).map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMode(m)}
                      className={`h-9 rounded-xl border text-xs font-medium transition-colors cursor-pointer capitalize ${
                        mode === m
                          ? 'border-[#0A0A0A] bg-[#0A0A0A] text-white'
                          : 'border-[#6B7280] bg-white text-[#0A0A0A] hover:bg-[#FAFAFA]'
                      }`}
                    >
                      {m.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Campus Venue Select */}
              {(mode === 'on_campus' || mode === 'hybrid') && (
                <div>
                  <label className="block text-xs font-semibold text-[#0A0A0A] mb-1">
                    VIT Wadala Venue <span className="text-rose-600">*</span>
                  </label>
                  <select
                    value={venueId}
                    onChange={e => setVenueId(e.target.value)}
                    className="w-full h-9 px-3 bg-white border border-[#6B7280] rounded-xl text-xs text-[#0A0A0A] focus:outline-none focus:border-[#0A0A0A] cursor-pointer"
                  >
                    {VENUES_REGISTRY.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.name} ({v.building} · Max {v.capacity} seats)
                      </option>
                    ))}
                  </select>

                  {/* Real-time conflict warning banner */}
                  {venueConflict.hasConflict && (
                    <div className="p-3 bg-rose-50 border border-rose-200 text-rose-950 rounded-xl flex items-center gap-2 mt-2">
                      <AlertCircle className="w-4 h-4 text-rose-700 shrink-0" />
                      <span>{venueConflict.message}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Online Meeting Link */}
              {(mode === 'online' || mode === 'hybrid') && (
                <div>
                  <label className="block text-xs font-semibold text-[#0A0A0A] mb-1">
                    Meeting URL (Google Meet / Teams / Zoom) <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="url"
                    value={meetingUrl}
                    onChange={e => setMeetingUrl(e.target.value)}
                    placeholder="https://meet.google.com/..."
                    className="w-full h-9 px-3 bg-white border border-[#6B7280] rounded-xl text-xs text-[#0A0A0A] focus:outline-none focus:border-[#0A0A0A]"
                  />
                  <p className="text-[11px] text-[#6B7280] mt-1">
                    Note: Hidden from non-registered users and revealed 30 minutes before start to confirmed registrants.
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* Section 4: People & Sponsoring Department */}
          <section className="space-y-4">
            <div className="border-b border-[#E5E7EB] pb-2">
              <h2 className="text-base font-bold text-[#0A0A0A] tracking-tight">
                4. People & Governance
              </h2>
              <p className="text-xs text-[#6B7280] mt-0.5">
                Organizing department, faculty sponsorship, and speakers list.
              </p>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#0A0A0A] mb-1">
                    Organizing Department
                  </label>
                  <select
                    value={organizingDept}
                    onChange={e => setOrganizingDept(e.target.value as DepartmentCode)}
                    className="w-full h-9 px-3 bg-white border border-[#6B7280] rounded-xl text-xs text-[#0A0A0A] focus:outline-none focus:border-[#0A0A0A] cursor-pointer"
                  >
                    {DEPARTMENT_TAXONOMY.map((d: DepartmentInfo) => (
                      <option key={d.code} value={d.code}>{d.code} – {d.name}</option>
                    ))}
                  </select>
                </div>

                {currentRole === 'alumni' && (mode === 'on_campus' || mode === 'hybrid') && (
                  <div>
                    <label className="block text-xs font-semibold text-[#0A0A0A] mb-1">
                      Sponsoring Department <span className="text-rose-600">*</span>
                    </label>
                    <select
                      value={sponsorDept}
                      onChange={e => setSponsorDept(e.target.value as DepartmentCode)}
                      className="w-full h-9 px-3 bg-white border border-[#6B7280] rounded-xl text-xs text-[#0A0A0A] focus:outline-none focus:border-[#0A0A0A] cursor-pointer"
                    >
                      {DEPARTMENT_TAXONOMY.map((d: DepartmentInfo) => (
                        <option key={d.code} value={d.code}>{d.code} Department</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Speakers Repeater */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-[#0A0A0A]">
                    Speakers ({speakers.length}/5)
                  </label>
                  {speakers.length < 5 && (
                    <button
                      type="button"
                      onClick={handleAddSpeaker}
                      className="text-xs text-[#0A0A0A] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add speaker</span>
                    </button>
                  )}
                </div>

                {speakers.map((spk, idx) => (
                  <div key={spk.id || idx} className="p-3 bg-[#FAFAFA] border border-[#E5E7EB] rounded-xl space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-[#0A0A0A]">Speaker #{idx + 1}</span>
                      {speakers.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveSpeaker(idx)}
                          className="text-[#991B1B] hover:text-rose-800 p-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <input
                        type="text"
                        value={spk.name}
                        onChange={e => handleUpdateSpeaker(idx, { name: e.target.value })}
                        placeholder="Full Name"
                        className="h-8 px-2.5 bg-white border border-[#6B7280] rounded-lg text-xs"
                      />
                      <input
                        type="text"
                        value={spk.title}
                        onChange={e => handleUpdateSpeaker(idx, { title: e.target.value })}
                        placeholder="Title / Designation"
                        className="h-8 px-2.5 bg-white border border-[#6B7280] rounded-lg text-xs"
                      />
                      <input
                        type="text"
                        value={spk.organization}
                        onChange={e => handleUpdateSpeaker(idx, { organization: e.target.value })}
                        placeholder="Company / Institute"
                        className="h-8 px-2.5 bg-white border border-[#6B7280] rounded-lg text-xs"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Section 5: Registration & Capacity */}
          <section className="space-y-4">
            <div className="border-b border-[#E5E7EB] pb-2">
              <h2 className="text-base font-bold text-[#0A0A0A] tracking-tight">
                5. Registration, Capacity & Audience
              </h2>
              <p className="text-xs text-[#6B7280] mt-0.5">
                Set seat limits, waitlist automation, and attendee criteria.
              </p>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#0A0A0A] mb-1">
                    Seat Capacity Limit <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="number"
                    value={capacity}
                    min={1}
                    max={mode === 'online' ? 5000 : (activeVenue?.capacity || 500)}
                    onChange={e => setCapacity(parseInt(e.target.value, 10) || 10)}
                    className="w-full h-9 px-3 bg-white border border-[#6B7280] rounded-xl text-xs text-[#0A0A0A] focus:outline-none focus:border-[#0A0A0A]"
                  />
                  {activeVenue && mode !== 'online' && (
                    <span className="text-[11px] text-[#6B7280] mt-0.5 block">
                      Max venue capacity: {activeVenue.capacity} seats.
                    </span>
                  )}
                </div>

                <div className="space-y-2 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={waitlistEnabled}
                      onChange={e => setWaitlistEnabled(e.target.checked)}
                      className="rounded border-[#6B7280]"
                    />
                    <span className="text-xs font-medium text-[#0A0A0A]">
                      Enable automated FIFO waitlist
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={approvalRequired}
                      onChange={e => setApprovalRequired(e.target.checked)}
                      className="rounded border-[#6B7280]"
                    />
                    <span className="text-xs font-medium text-[#0A0A0A]">
                      Require host approval for registrations
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={certificatesEnabled}
                      onChange={e => setCertificatesEnabled(e.target.checked)}
                      className="rounded border-[#6B7280]"
                    />
                    <span className="text-xs font-medium text-[#0A0A0A]">
                      Issue verifiable participation certificates (attended only)
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </section>

          {/* Section 6: Details & Agenda */}
          <section className="space-y-4">
            <div className="border-b border-[#E5E7EB] pb-2">
              <h2 className="text-base font-bold text-[#0A0A0A] tracking-tight">
                6. Details & Agenda
              </h2>
              <p className="text-xs text-[#6B7280] mt-0.5">
                Session description, prerequisites, and itinerary.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#0A0A0A] mb-1">
                  Full Event Description (50–2000 chars) <span className="text-rose-600">*</span>
                </label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  onBlur={performSaveDraft}
                  rows={4}
                  placeholder="Outline topics covered, key takeaways, and prerequisites..."
                  className="w-full p-3 bg-white border border-[#6B7280] rounded-xl text-xs text-[#0A0A0A] focus:outline-none focus:border-[#0A0A0A] leading-relaxed"
                  minLength={50}
                  maxLength={2000}
                />
                <span className="text-[11px] text-[#6B7280]">{description.length}/2000 characters</span>
              </div>

              {/* Agenda Repeater */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-[#0A0A0A]">
                    Session Agenda Items ({agenda.length})
                  </label>
                  <button
                    type="button"
                    onClick={handleAddAgendaItem}
                    className="text-xs text-[#0A0A0A] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add agenda item</span>
                  </button>
                </div>

                {agenda.map((ag, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={ag.time}
                      onChange={e => handleUpdateAgendaItem(idx, { time: e.target.value })}
                      placeholder="e.g. 6:00 pm"
                      className="w-28 h-8 px-2.5 bg-white border border-[#6B7280] rounded-lg text-xs"
                    />
                    <input
                      type="text"
                      value={ag.item}
                      onChange={e => handleUpdateAgendaItem(idx, { item: e.target.value })}
                      placeholder="Topic / Activity item"
                      className="flex-1 h-8 px-2.5 bg-white border border-[#6B7280] rounded-lg text-xs"
                    />
                    {agenda.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveAgendaItem(idx)}
                        className="text-[#6B7280] hover:text-[#991B1B] p-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Tags */}
              <div>
                <label className="block text-xs font-semibold text-[#0A0A0A] mb-1">
                  Tags (up to 5)
                </label>
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag(); } }}
                    placeholder="Add tag and press Enter"
                    className="h-8 px-3 bg-white border border-[#6B7280] rounded-lg text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="px-3 py-1.5 border border-[#6B7280] rounded-lg text-xs font-medium"
                  >
                    Add
                  </button>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {tags.map(t => (
                    <span key={t} className="px-2 py-0.5 bg-[#FAFAFA] border border-[#E5E7EB] rounded-full text-xs font-medium text-[#0A0A0A] flex items-center gap-1">
                      #{t}
                      <button type="button" onClick={() => handleRemoveTag(t)} className="text-[#6B7280] hover:text-[#0A0A0A]">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Section 7: Guidelines & Submission */}
          <section className="space-y-4 pt-2 border-t border-[#E5E7EB]">
            <label className="flex items-start gap-2.5 cursor-pointer select-none p-3.5 bg-[#FAFAFA] border border-[#E5E7EB] rounded-xl">
              <input
                type="checkbox"
                checked={guidelinesConfirmed}
                onChange={e => setGuidelinesConfirmed(e.target.checked)}
                className="mt-0.5 rounded border-[#6B7280]"
              />
              <span className="text-xs text-[#0A0A0A] leading-relaxed">
                I confirm that this institutional event follows VIT Wadala academic guidelines, safety standards, and venue capacity limits.
              </span>
            </label>

            {submitErrorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-950 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-700 shrink-0" />
                <span>{submitErrorMsg}</span>
              </div>
            )}

            {/* Sticky Bottom Action Bar */}
            <div className="sticky bottom-0 bg-white/95 backdrop-blur-sm border-t border-[#E5E7EB] py-3 -mx-4 px-4 sm:-mx-6 sm:px-6 flex items-center justify-between gap-4 z-20">
              <span className="text-xs text-[#6B7280]">
                {isAutoApproved
                  ? 'Goes live immediately.'
                  : 'An administrator reviews new events within 2 business days. You\'ll be notified.'}
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={performSaveDraft}
                  className="px-3.5 py-2 border border-[#6B7280] rounded-xl text-xs font-semibold text-[#0A0A0A] hover:bg-[#FAFAFA] transition-colors cursor-pointer"
                >
                  Save draft
                </button>

                <button
                  type="submit"
                  disabled={!canSubmit}
                  className={`px-5 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm ${
                    canSubmit
                      ? 'bg-[#0A0A0A] text-white hover:bg-[#262626]'
                      : 'bg-[#E5E7EB] text-[#6B7280] cursor-not-allowed'
                  }`}
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{primaryButtonLabel}</span>
                </button>
              </div>
            </div>
          </section>
        </form>

          {/* Right Column: Sticky Live Preview (≥1280px Desktop) */}
          <div className="hidden xl:block xl:col-span-5 sticky top-20 space-y-4">
            <div className="border-b border-[#E5E7EB] pb-2 flex items-center justify-between">
              <span className="text-xs font-bold text-[#0A0A0A] uppercase tracking-wider">
                Live Preview
              </span>
              <span className="text-[11px] text-[#6B7280]">How members will see this</span>
            </div>

            {/* Preview 1: Agenda Row */}
            <div className="p-4 bg-white border border-[#E5E7EB] rounded-xl space-y-3 shadow-2xs">
              <span className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider block">
                Events List Card
              </span>

              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-white border border-[#E5E7EB] flex flex-col items-center justify-center shrink-0 text-center select-none shadow-2xs">
                  <span className="text-[9px] font-semibold text-[#6B7280] uppercase">
                    {formatEventDate(date).month}
                  </span>
                  <span className="text-base font-bold text-[#0A0A0A] leading-none mt-0.5 tabular-nums">
                    {formatEventDate(date).day}
                  </span>
                </div>

                {/* 16:9 Thumbnail Preview */}
                <div className="w-20 aspect-video rounded-lg overflow-hidden bg-neutral-100 border border-[#E5E7EB] shrink-0 relative">
                  {coverImageUrl ? (
                    <img src={coverImageUrl} alt="Banner" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-neutral-400">
                      <ImageIcon className="w-4 h-4" />
                    </div>
                  )}
                </div>

                <div className="space-y-1 min-w-0 flex-1">
                  <h4 className="font-semibold text-xs text-[#0A0A0A] truncate">
                    {title || 'Untitled Event Title'}
                  </h4>
                  <p className="text-[11px] text-[#6B7280] truncate">
                    {formatEventDateTimeRange(startsAt, endsAt)} · {mode === 'online' ? 'Online' : (activeVenue?.name || customLocation || 'VIT Wadala')}
                  </p>
                  <p className="text-[11px] text-[#0A0A0A] font-medium truncate">
                    Speaker: {speakers.map(s => s.name).filter(Boolean).join(', ') || 'Featured Speaker'}
                  </p>
                </div>
              </div>
            </div>

            {/* Preview 2: Event Detail Overview */}
            <div className="p-4 bg-white border border-[#E5E7EB] rounded-xl space-y-3 shadow-2xs">
              <span className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider block">
                Session Detail Header
              </span>

              {coverImageUrl && (
                <div className="w-full h-32 rounded-lg overflow-hidden bg-[#FAFAFA] border border-[#E5E7EB]">
                  <img src={coverImageUrl} alt="Banner" className="w-full h-full object-cover" />
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="px-2 py-0.5 bg-[#F3F4F6] text-[#0A0A0A] rounded text-[10px] font-semibold">
                    {category}
                  </span>
                  <span className="px-2 py-0.5 bg-white border border-[#E5E7EB] text-[#6B7280] rounded text-[10px] font-medium capitalize">
                    {mode.replace('_', ' ')}
                  </span>
                </div>

                <h3 className="font-bold text-sm text-[#0A0A0A]">
                  {title || 'Untitled Event'}
                </h3>
                <p className="text-xs text-[#374151] leading-relaxed line-clamp-3">
                  {description || 'Event description will appear here...'}
                </p>

                <div className="pt-2 border-t border-[#E5E7EB] flex items-center justify-between text-xs">
                  <span className="text-[#6B7280]">Capacity: 0 of {capacity}</span>
                  <span className="font-semibold text-[#0A0A0A]">Registration Open</span>
                </div>
              </div>
            </div>
          </div>

        </div>

      {/* Mobile Preview Sheet (<1280px) */}
      {mobilePreviewOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl max-w-lg w-full p-5 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
              <h3 className="font-bold text-sm text-[#0A0A0A]">Live Event Preview</h3>
              <button
                type="button"
                onClick={() => setMobilePreviewOpen(false)}
                className="p-1 rounded-lg text-[#6B7280] hover:text-[#0A0A0A]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <h4 className="font-bold text-base text-[#0A0A0A]">{title || 'Untitled Event'}</h4>
              <p className="text-xs text-[#6B7280]">
                {formatEventDateTimeRange(startsAt, endsAt)} · {mode === 'online' ? 'Online' : (activeVenue?.name || 'VIT Wadala')}
              </p>
              <p className="text-xs text-[#374151] leading-relaxed whitespace-pre-line">{description}</p>
            </div>

            <div className="pt-3 border-t border-[#E5E7EB]">
              <button
                type="button"
                onClick={() => setMobilePreviewOpen(false)}
                className="w-full py-2 bg-[#0A0A0A] text-white rounded-xl text-xs font-semibold"
              >
                Continue editing
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

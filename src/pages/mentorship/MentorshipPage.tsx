/**
 * NexaLink — Mentorship Hub (Phase 3 Redesign)
 *
 * Implements Open Canvas design system:
 * - H1 "Mentorship" with subtitle (no icon in H1)
 * - Flush layout without boxed form container
 * - Underline filter tabs: Find a mentor / Requests / My mentors (Student) or Requests / Mentees (Mentor)
 * - Recommended top 3 mentors + search chips (All / Alumni / Faculty)
 * - 3-step empty state when search finds zero results
 * - Requests list with Amber Pending, Emerald Accepted, Neutral Declined
 * - Request withdrawal (status -> Withdrawn) and 3-request pending cap
 * - Shared RequestMentorshipSheet integration
 * - Add to calendar (.ics) and Complete mentorship with 1-5 star rating
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import type { AlumniProfile, FacultyProfile, StudentProfile, MentorshipRequest, MentorshipGuidancePurpose } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';
import { MemberProfilePanel } from '../../components/directory/MemberProfilePanel';
import {
  MessageSquare,
  Check,
  UserCheck,
  Star,
  Clock,
  Send,
  Lock,
  AlertCircle,
  X,
  Search,
  Calendar,
  Download,
  Plus,
  Minus,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Trash2,
  SlidersHorizontal
} from 'lucide-react';
import { Avatar } from '../../utils/avatarHelper';
import { Badge, Button, Modal, ToastNotice } from '../../components/common/UIComponents';
import { RequestMentorshipSheet, type TargetMentorInfo } from '../../components/directory/RequestMentorshipSheet';
import { useStudentInvitations } from '../../features/outreach/useOutreach';

const StudentInvitationsPanel = React.lazy(() => import('../../features/outreach/StudentInvitationsPanel').then(m => ({ default: m.StudentInvitationsPanel })));
const DiscoverStudentsPanel = React.lazy(() => import('../../features/outreach/DiscoverStudentsPanel').then(m => ({ default: m.DiscoverStudentsPanel })));

interface MentorshipPageProps {
  selectedMentorForBooking?: AlumniProfile | FacultyProfile | any | null;
  initialSubTab?: 'find' | 'requests' | 'my-mentors' | 'mentees' | 'my-sent' | 'incoming' | 'invitations' | 'discover';
  setActiveTab: (tab: string, subTab?: string) => void;
}

// ─── ADMIN MENTORSHIP GUARD ──────────────────────────────────────────────────

const AdminMentorshipGuardView: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300 font-sans text-xs p-6 sm:p-8">
      <div className="border-b border-[#E5E7EB] pb-4">
        <h1 className="text-xl sm:text-2xl font-bold text-[#0A0A0A] tracking-tight">
          Mentorship
        </h1>
        <p className="text-xs text-[#6B7280] font-medium mt-1">
          Peer-to-peer mentorship and research advisory relationships.
        </p>
      </div>

      <div className="bg-[#FAFAFA] text-[#0A0A0A] border border-[#E5E7EB] rounded-2xl p-6 flex items-start gap-4">
        <div className="p-2.5 bg-[#F3F4F6] border border-[#E5E7EB] rounded-xl shrink-0">
          <Lock className="w-4 h-4 text-[#0A0A0A]" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-xs font-semibold text-[#0A0A0A]">
            Admin Role: Mentorship Access Restricted
          </h2>
          <p className="text-xs text-[#6B7280] leading-relaxed">
            Administrator accounts do not participate in or inspect peer mentorship requests directly. This is a deliberate
            institutional privacy constraint — 1-on-1 mentorship interactions between Students, Alumni, and Faculty are strictly private.
          </p>
          <p className="text-xs text-[#0A0A0A] font-medium pt-1">
            Institutional guidance performance metrics are accessible in <strong>Verification & Governance → Analytics</strong>.
          </p>
        </div>
      </div>
    </div>
  );
};

// ─── CALENDAR ICS GENERATOR ──────────────────────────────────────────────────

function downloadCalendarInvite(title: string, description: string, slotStr?: string) {
  const now = new Date();
  const startTime = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);

  const formatICSDate = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  const icsLines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//NexaLink//Mentorship Session//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:nexalink-${Date.now()}@vit.edu.in`,
    `DTSTAMP:${formatICSDate(now)}`,
    `DTSTART:${formatICSDate(startTime)}`,
    `DTEND:${formatICSDate(endTime)}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${(description + (slotStr ? `\\nSelected slot: ${slotStr}` : '')).replace(/\n/g, '\\n')}`,
    'LOCATION:Google Meet / Campus CMPN Dept',
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR'
  ];

  const blob = new Blob([icsLines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${title.replace(/[^a-zA-Z0-9]/g, '_')}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── STANDARD MENTORSHIP PAGE ────────────────────────────────────────────────

const StandardMentorshipPage: React.FC<MentorshipPageProps> = ({
  selectedMentorForBooking,
  initialSubTab,
  setActiveTab
}) => {
  const {
    alumniList,
    facultyList,
    studentList,
    mentorshipRequests,
    updateMentorshipStatus,
    withdrawMentorshipRequest,
    completeMentorship,
    markMentorshipSeen,
    setPendingChatUserId,
    updateUserProfile
  } = useData();

  const { currentUser, currentRole } = useAuth();
  const isStudent = currentRole === 'student';
  const isMentor = currentRole === 'alumni' || currentRole === 'faculty' || currentRole === 'teacher';

  // Subtabs
  const [studentTab, setStudentTab] = useState<'find' | 'requests' | 'my-mentors' | 'invitations'>(
    initialSubTab === 'requests' || initialSubTab === 'my-sent' ? 'requests' : initialSubTab === 'my-mentors' ? 'my-mentors' : initialSubTab === 'invitations' ? 'invitations' : 'find'
  );
  const [mentorTab, setMentorTab] = useState<'requests' | 'mentees' | 'discover'>(
    initialSubTab === 'mentees' ? 'mentees' : initialSubTab === 'discover' ? 'discover' : 'requests'
  );

  const { pendingCount: pendingInvitationsCount } = useStudentInvitations(isStudent ? currentUser?.id : undefined);

  // Search & Filter state for Find a mentor
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'alumni' | 'faculty'>('all');

  // Shared Sheet state
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [sheetTargetMentor, setSheetTargetMentor] = useState<TargetMentorInfo | null>(null);

  // Notifications
  const [notice, setNotice] = useState<string | null>(null);

  // Modals
  const [declineModalReq, setDeclineModalReq] = useState<MentorshipRequest | null>(null);
  const [declineReason, setDeclineReason] = useState('At capacity right now');
  const [customDeclineNote, setCustomDeclineNote] = useState('');

  const [completeModalReq, setCompleteModalReq] = useState<MentorshipRequest | null>(null);
  const [rating, setRating] = useState(5);
  const [feedbackNotes, setFeedbackNotes] = useState('');

  // Selected student profile drawer
  const [selectedStudentProfile, setSelectedStudentProfile] = useState<StudentProfile | null>(null);
  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({});

  const handleOpenStudentProfile = (req: MentorshipRequest | any) => {
    const studentId = req.studentId || req.id;
    const studentEmail = req.studentEmail || req.email;
    const matched = studentList.find(s => s.id === studentId || s.email === studentEmail);
    if (matched) {
      setSelectedStudentProfile(matched);
      return;
    }
    const fallback: StudentProfile = {
      id: studentId,
      name: req.studentName || req.name || 'Student',
      email: studentEmail || 'student@vit.edu.in',
      avatar: '',
      role: 'student',
      department: req.studentDepartment || 'CMPN',
      enrollmentNo: req.studentEnrollmentNo || 'N/A',
      prn: req.studentEnrollmentNo || 'N/A',
      currentYear: (req.studentYear as any) || 'BE',
      semester: 'BE',
      cgpa: 8.5,
      skills: ['Distributed Systems', 'Software Engineering', 'System Architecture'],
      areasOfInterest: [req.topic || req.purposeOfRequest || 'Software Engineering'],
      careerGoal: req.purposeOfRequest || 'Engineering Guidance & Career Preparation',
      preferredIndustry: 'Technology',
      preferredHigherStudies: 'None',
      certifications: [],
      projects: [],
      targetCompanies: [],
      isVerified: true,
      verificationStatus: 'Verified',
      bio: `Student at Vidyalankar Institute of Technology, ${req.studentDepartment || 'CMPN'} Department. Seeking mentorship on ${req.topic || req.purposeOfRequest || 'Career guidance'}.`,
      createdAt: new Date().toISOString()
    };
    setSelectedStudentProfile(fallback);
  };

  // Auto-open sheet if selectedMentorForBooking passed
  useEffect(() => {
    if (selectedMentorForBooking) {
      const target: TargetMentorInfo = {
        id: selectedMentorForBooking.id,
        name: selectedMentorForBooking.name,
        userType: selectedMentorForBooking.userType || ('graduationYear' in selectedMentorForBooking ? 'alumni' : 'faculty'),
        role: selectedMentorForBooking.designation || 'Mentor',
        company: selectedMentorForBooking.company || selectedMentorForBooking.department || 'VIT',
        department: selectedMentorForBooking.department,
        avatarUrl: selectedMentorForBooking.avatar
      };
      setSheetTargetMentor(target);
      setIsSheetOpen(true);
    }
  }, [selectedMentorForBooking]);

  // Mark unseen requests when student opens "Requests" tab
  useEffect(() => {
    if (isStudent && studentTab === 'requests') {
      const unreadStatuses = mentorshipRequests.filter(
        r => r.studentId === currentUser.id && (r.status === 'Accepted' || r.status === 'Declined') && !r.seenAt
      );
      unreadStatuses.forEach(r => markMentorshipSeen(r.id));
    }
  }, [isStudent, studentTab, mentorshipRequests, currentUser.id, markMentorshipSeen]);

  // Available mentors list
  const allMentors: TargetMentorInfo[] = useMemo(() => {
    const alumni = alumniList
      .filter(a => a.id !== currentUser.id && a.isMentoringAvailable)
      .map(a => ({
        id: a.id,
        name: a.name,
        userType: 'alumni',
        role: a.designation || 'Software Engineer',
        company: a.company || 'Tech Alumni',
        department: a.department || 'CMPN',
        avatarUrl: a.avatar || '',
        availableSlots: (a as any).mentorshipSlots || 3,
        skills: a.skills || []
      }));

    const faculty = facultyList
      .filter(f => f.id !== currentUser.id)
      .map(f => ({
        id: f.id,
        name: f.name,
        userType: 'faculty',
        role: f.designation || 'Professor',
        company: 'Vidyalankar Institute of Technology',
        department: f.department || 'CMPN',
        avatarUrl: f.avatar || '',
        availableSlots: 4,
        skills: f.researchAreas || ['Academic Advising']
      }));

    return [...alumni, ...faculty];
  }, [alumniList, facultyList, currentUser.id]);

  // Top 3 Recommended mentors
  const recommendedMentors = useMemo(() => {
    return allMentors.slice(0, 3);
  }, [allMentors]);

  // Filtered mentors list
  const filteredMentors = useMemo(() => {
    return allMentors.filter(m => {
      if (roleFilter === 'alumni' && m.userType !== 'alumni') return false;
      if (roleFilter === 'faculty' && m.userType !== 'faculty') return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        m.name.toLowerCase().includes(q) ||
        (m.company && m.company.toLowerCase().includes(q)) ||
        (m.department && m.department.toLowerCase().includes(q)) ||
        (m.role && m.role.toLowerCase().includes(q)) ||
        ((m as any).skills && (m as any).skills.some((s: string) => s.toLowerCase().includes(q)))
      );
    });
  }, [allMentors, roleFilter, searchQuery]);

  // Student requests
  const studentRequests = useMemo(() => {
    return mentorshipRequests.filter(
      r => r.studentId === currentUser.id && r.status !== 'Withdrawn'
    ).sort((a, b) => new Date(b.requestedDate || 0).getTime() - new Date(a.requestedDate || 0).getTime());
  }, [mentorshipRequests, currentUser.id]);

  const studentPendingCount = studentRequests.filter(r => r.status === 'Pending').length;
  const studentAcceptedRequests = studentRequests.filter(r => r.status === 'Accepted');
  const studentPendingRequests = studentRequests.filter(r => r.status === 'Pending');
  const studentDeclinedRequests = studentRequests.filter(r => r.status === 'Declined');
  const studentCompletedRequests = studentRequests.filter(r => r.status === 'Completed');

  // Student active relationships (My Mentors)
  const myActiveMentors = useMemo(() => {
    return mentorshipRequests.filter(
      r => r.studentId === currentUser.id && r.status === 'Accepted'
    );
  }, [mentorshipRequests, currentUser.id]);

  // Mentor incoming requests
  const incomingMentorRequests = useMemo(() => {
    return mentorshipRequests.filter(
      r => r.mentorId === currentUser.id && r.status === 'Pending'
    ).sort((a, b) => new Date(b.requestedDate || 0).getTime() - new Date(a.requestedDate || 0).getTime());
  }, [mentorshipRequests, currentUser.id]);

  // Mentor active mentees
  const activeMentees = useMemo(() => {
    return mentorshipRequests.filter(
      r => r.mentorId === currentUser.id && r.status === 'Accepted'
    );
  }, [mentorshipRequests, currentUser.id]);

  // Current mentor profile and bandwidth settings
  const currentMentorProfile = useMemo(() => {
    if (!currentUser?.id) return null;
    return alumniList.find(a => a.id === currentUser.id) || facultyList.find(f => f.id === currentUser.id);
  }, [currentUser, alumniList, facultyList]);

  const [acceptingMentees, setAcceptingMentees] = useState(() => {
    return currentMentorProfile?.isMentoringAvailable ?? (currentUser as any)?.isMentoringAvailable ?? true;
  });
  const [maxMentees, setMaxMentees] = useState<number>(() => {
    return currentMentorProfile?.maxMentees ?? (currentUser as any)?.maxMentees ?? 3;
  });
  const [draftCapacity, setDraftCapacity] = useState<string>(() => String(maxMentees));

  useEffect(() => {
    if (currentMentorProfile) {
      if (currentMentorProfile.isMentoringAvailable !== undefined) {
        setAcceptingMentees(currentMentorProfile.isMentoringAvailable);
      }
      if (currentMentorProfile.maxMentees !== undefined) {
        setMaxMentees(currentMentorProfile.maxMentees);
        setDraftCapacity(String(currentMentorProfile.maxMentees));
      }
    }
  }, [currentMentorProfile?.isMentoringAvailable, currentMentorProfile?.maxMentees]);

  const activeCount = activeMentees.length;

  const handleToggleAccepting = () => {
    if (!currentUser?.id) return;
    const nextAccepting = !acceptingMentees;
    let nextMax = maxMentees;
    if (nextAccepting && maxMentees === 0) {
      nextMax = Math.max(1, activeCount);
      setMaxMentees(nextMax);
      setDraftCapacity(String(nextMax));
    }
    setAcceptingMentees(nextAccepting);
    updateUserProfile(currentUser.id, {
      isMentoringAvailable: nextAccepting,
      maxMentees: nextMax
    });
    setNotice(nextAccepting ? 'Mentorship availability enabled: Accepting student asks.' : 'Mentorship paused: Set to busy.');
    setTimeout(() => setNotice(null), 3000);
  };

  const handleStepCapacity = (delta: number) => {
    if (!currentUser?.id) return;
    const target = maxMentees + delta;
    const minLimit = Math.max(0, activeCount);
    if (target < minLimit || target > 20) return;

    setMaxMentees(target);
    setDraftCapacity(String(target));

    const nextAccepting = target === 0 ? false : acceptingMentees;
    if (target === 0 && acceptingMentees) {
      setAcceptingMentees(false);
    }
    updateUserProfile(currentUser.id, {
      maxMentees: target,
      isMentoringAvailable: nextAccepting
    });
    setNotice(`Mentee capacity updated to ${target}.`);
    setTimeout(() => setNotice(null), 3000);
  };

  const commitDraftCapacity = () => {
    if (!currentUser?.id) return;
    const trimmed = draftCapacity.trim();
    if (trimmed === '') {
      setDraftCapacity(String(maxMentees));
      return;
    }

    const parsed = parseInt(trimmed, 10);
    if (isNaN(parsed)) {
      setDraftCapacity(String(maxMentees));
      return;
    }

    const minFloor = activeCount;
    if (parsed < minFloor) {
      setDraftCapacity(String(maxMentees));
      setNotice(`You currently have ${minFloor} active ${minFloor === 1 ? 'mentee' : 'mentees'}, so capacity can't be lower than ${minFloor}.`);
      setTimeout(() => setNotice(null), 3500);
      return;
    }

    const clamped = Math.min(20, Math.max(0, parsed));
    setMaxMentees(clamped);
    setDraftCapacity(String(clamped));

    const nextAccepting = clamped === 0 ? false : acceptingMentees;
    if (clamped === 0 && acceptingMentees) {
      setAcceptingMentees(false);
    }
    updateUserProfile(currentUser.id, {
      maxMentees: clamped,
      isMentoringAvailable: nextAccepting
    });
    setNotice(`Mentee capacity updated to ${clamped}.`);
    setTimeout(() => setNotice(null), 3000);
  };

  const handleOpenSheetForMentor = (mentor?: TargetMentorInfo) => {
    setSheetTargetMentor(mentor || null);
    setIsSheetOpen(true);
  };

  const handleWithdraw = (requestId: string) => {
    withdrawMentorshipRequest(requestId);
    setNotice('Request withdrawn successfully');
    setTimeout(() => setNotice(null), 3000);
  };

  const handleMessageUser = (targetUserId: string) => {
    setPendingChatUserId(targetUserId);
    setActiveTab('messaging');
  };

  const handleAcceptRequest = (req: MentorshipRequest, slot?: string) => {
    updateMentorshipStatus(req.id, 'Accepted', slot);
    setNotice(`Accepted mentorship request from ${req.studentName}`);
    setTimeout(() => setNotice(null), 3000);
  };

  const handleDeclineSubmit = () => {
    if (!declineModalReq) return;
    const finalReason = customDeclineNote.trim()
      ? `${declineReason}: ${customDeclineNote.trim()}`
      : declineReason;
    updateMentorshipStatus(declineModalReq.id, 'Declined', undefined, finalReason);
    setDeclineModalReq(null);
    setCustomDeclineNote('');
    setNotice('Mentorship request declined politely');
    setTimeout(() => setNotice(null), 3000);
  };

  const handleCompleteSubmit = () => {
    if (!completeModalReq) return;
    completeMentorship(completeModalReq.id, rating, feedbackNotes.trim());
    setCompleteModalReq(null);
    setFeedbackNotes('');
    setNotice('Mentorship completed. Thank you for your feedback!');
    setTimeout(() => setNotice(null), 3000);
  };

  return (
    <div className="font-sans text-xs bg-white min-h-[calc(100svh-64px)] pb-16">
      {/* Toast Notice */}
      <ToastNotice
        message={notice}
        onClose={() => setNotice(null)}
        variant="success"
        className="fixed top-20 right-6 z-50"
      />

      {/* Main Container */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 space-y-6">

        {/* ─── PAGE HEADER ───────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#E5E7EB] pb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#0A0A0A] tracking-tight">
              Mentorship
            </h1>
            <p className="text-xs text-[#6B7280] font-normal mt-1 max-w-2xl leading-relaxed">
              Connect with alumni and faculty for career advice, research collaboration, and portfolio feedback.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {isStudent && (
              <Button
                variant="primary"
                size="md"
                onClick={() => handleOpenSheetForMentor()}
                className="cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                <span>Request mentorship</span>
              </Button>
            )}

            {isMentor && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-3.5 py-2.5">
                <div className="flex items-center justify-between sm:justify-start gap-2.5">
                  <span className="text-xs font-medium text-[#0A0A0A]">Accepting mentees</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={acceptingMentees}
                    aria-label="Toggle accepting mentees"
                    onClick={handleToggleAccepting}
                    className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                      acceptingMentees ? 'bg-[#0A0A0A]' : 'bg-[#E5E7EB]'
                    }`}
                  >
                    <span
                      className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-transform ${
                        acceptingMentees ? 'left-4.5' : 'left-0.5'
                      }`}
                    />
                  </button>
                </div>
                <div className="hidden sm:block h-6 w-px bg-[#E5E7EB]" />
                <div className="flex items-center justify-between sm:justify-start gap-3">
                  <div>
                    <span className="text-xs font-medium text-[#0A0A0A] block">Mentee capacity</span>
                    <span className="text-[11px] text-[#6B7280] block">
                      {activeCount} of {maxMentees} in use
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      aria-label="Decrease mentee capacity"
                      disabled={maxMentees <= Math.max(0, activeCount)}
                      onClick={() => handleStepCapacity(-1)}
                      className="min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 sm:w-7 sm:h-7 flex items-center justify-center rounded-lg sm:rounded-md border border-[#E5E7EB] bg-white hover:bg-[#F3F4F6] text-[#0A0A0A] disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      aria-label="Mentee capacity value"
                      value={draftCapacity}
                      onChange={e => setDraftCapacity(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.currentTarget.blur();
                        }
                      }}
                      onBlur={commitDraftCapacity}
                      className="w-11 h-11 sm:w-9 sm:h-7 text-center font-semibold bg-white border border-[#E5E7EB] rounded-lg sm:rounded text-xs text-[#0A0A0A] focus:outline-none focus:border-[#0A0A0A] focus-visible:outline-2 focus-visible:outline-[#0A0A0A]"
                    />
                    <button
                      type="button"
                      aria-label="Increase mentee capacity"
                      disabled={maxMentees >= 20}
                      onClick={() => handleStepCapacity(1)}
                      className="min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 sm:w-7 sm:h-7 flex items-center justify-center rounded-lg sm:rounded-md border border-[#E5E7EB] bg-white hover:bg-[#F3F4F6] text-[#0A0A0A] disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ─── UNDERLINE TABS ────────────────────────────────────────────── */}
        <div className="flex items-center border-b border-[#E5E7EB] space-x-6 overflow-x-auto">
          {isStudent ? (
            <>
              <button
                type="button"
                onClick={() => setStudentTab('find')}
                className={`py-3 text-xs transition-colors relative cursor-pointer shrink-0 ${
                  studentTab === 'find'
                    ? 'font-semibold text-[#0A0A0A] border-b-2 border-[#0A0A0A]'
                    : 'font-medium text-[#6B7280] hover:text-[#0A0A0A] border-b-2 border-transparent'
                }`}
              >
                Find a mentor
              </button>
              <button
                type="button"
                onClick={() => setStudentTab('requests')}
                className={`py-3 text-xs transition-colors relative cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  studentTab === 'requests'
                    ? 'font-semibold text-[#0A0A0A] border-b-2 border-[#0A0A0A]'
                    : 'font-medium text-[#6B7280] hover:text-[#0A0A0A] border-b-2 border-transparent'
                }`}
              >
                <span>Requests</span>
                {studentPendingCount > 0 && (
                  <span className="px-1.5 py-0.2 bg-[#FEF3C7] text-[#92400E] text-[10px] font-bold rounded-full border border-[#FDE68A]">
                    {studentPendingCount}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setStudentTab('my-mentors')}
                className={`py-3 text-xs transition-colors relative cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  studentTab === 'my-mentors'
                    ? 'font-semibold text-[#0A0A0A] border-b-2 border-[#0A0A0A]'
                    : 'font-medium text-[#6B7280] hover:text-[#0A0A0A] border-b-2 border-transparent'
                }`}
              >
                <span>My mentors</span>
                {myActiveMentors.length > 0 && (
                  <span className="px-1.5 py-0.2 bg-[#F3F4F6] text-[#0A0A0A] text-[10px] font-bold rounded-full border border-[#E5E7EB]">
                    {myActiveMentors.length}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setStudentTab('invitations')}
                className={`py-3 text-xs transition-colors relative cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  studentTab === 'invitations'
                    ? 'font-semibold text-[#0A0A0A] border-b-2 border-[#0A0A0A]'
                    : 'font-medium text-[#6B7280] hover:text-[#0A0A0A] border-b-2 border-transparent'
                }`}
              >
                <span>Invitations</span>
                {pendingInvitationsCount > 0 && (
                  <span className="px-1.5 py-0.2 bg-[#FEF3C7] text-[#92400E] text-[10px] font-bold rounded-full border border-[#FDE68A]">
                    {pendingInvitationsCount}
                  </span>
                )}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setMentorTab('requests')}
                className={`py-3 text-xs transition-colors relative cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  mentorTab === 'requests'
                    ? 'font-semibold text-[#0A0A0A] border-b-2 border-[#0A0A0A]'
                    : 'font-medium text-[#6B7280] hover:text-[#0A0A0A] border-b-2 border-transparent'
                }`}
              >
                <span>Requests</span>
                {incomingMentorRequests.length > 0 && (
                  <span className="px-1.5 py-0.2 bg-[#FEF3C7] text-[#92400E] text-[10px] font-bold rounded-full border border-[#FDE68A]">
                    {incomingMentorRequests.length}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setMentorTab('mentees')}
                className={`py-3 text-xs transition-colors relative cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  mentorTab === 'mentees'
                    ? 'font-semibold text-[#0A0A0A] border-b-2 border-[#0A0A0A]'
                    : 'font-medium text-[#6B7280] hover:text-[#0A0A0A] border-b-2 border-transparent'
                }`}
              >
                <span>Mentees</span>
                {activeMentees.length > 0 && (
                  <span className="px-1.5 py-0.2 bg-[#F3F4F6] text-[#0A0A0A] text-[10px] font-bold rounded-full border border-[#E5E7EB]">
                    {activeMentees.length}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setMentorTab('discover')}
                className={`py-3 text-xs transition-colors relative cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  mentorTab === 'discover'
                    ? 'font-semibold text-[#0A0A0A] border-b-2 border-[#0A0A0A]'
                    : 'font-medium text-[#6B7280] hover:text-[#0A0A0A] border-b-2 border-transparent'
                }`}
              >
                <span>Discover students</span>
              </button>
            </>
          )}
        </div>

        {/* ─── TAB CONTENT: STUDENT -> FIND A MENTOR ─────────────────────── */}
        {isStudent && studentTab === 'find' && (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* Top 3 Recommended Mentors */}
            {recommendedMentors.length > 0 && !searchQuery.trim() && roleFilter === 'all' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-bold text-[#0A0A0A] uppercase tracking-wider">
                    Recommended mentors
                  </h2>
                  <span className="text-[11px] text-[#6B7280]">Based on CMPN department & verified alumni network</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {recommendedMentors.map(mentor => (
                    <div
                      key={mentor.id}
                      className="bg-white border border-[#E5E7EB] hover:border-[#0A0A0A] rounded-2xl p-4 transition-all duration-150 flex flex-col justify-between space-y-3"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <Avatar src={mentor.avatarUrl} name={mentor.name} size={44} className="border border-[#E5E7EB]" />
                          <span className="px-2 py-0.5 bg-[#F3F4F6] text-[#0A0A0A] text-[10px] font-semibold rounded-full border border-[#E5E7EB] capitalize">
                            {mentor.userType}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h3 className="font-semibold text-xs text-[#0A0A0A] truncate">{mentor.name}</h3>
                            <ShieldCheck className="w-3.5 h-3.5 text-[#0A0A0A] shrink-0" />
                          </div>
                          <p className="text-[11px] text-[#6B7280] truncate mt-0.5">
                            {mentor.role} {mentor.company ? `· ${mentor.company}` : ''}
                          </p>
                        </div>

                        {/* Skills / Domains */}
                        {(mentor as any).skills && (mentor as any).skills.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {((mentor as any).skills as string[]).slice(0, 3).map((skill, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 bg-[#F9FAFB] border border-[#E5E7EB] text-[#4B5563] text-[10px] rounded-md"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="pt-2 border-t border-[#E5E7EB] flex items-center justify-between">
                        <span className="text-[11px] text-[#6B7280] font-medium">
                          {mentor.availableSlots} open slots
                        </span>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleOpenSheetForMentor(mentor)}
                          className="cursor-pointer"
                        >
                          Request
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Search & Filter Toolbar */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-[#6B7280] absolute left-3.5 top-3 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search by mentor name, company, or domain..."
                    className="w-full h-10 pl-10 pr-8 bg-[#F3F4F6] border-0 rounded-xl text-xs text-[#0A0A0A] placeholder:text-[#6B7280] focus:ring-1 focus:ring-[#0A0A0A] focus:outline-none"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-3 text-[#6B7280] hover:text-[#0A0A0A]"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Chips */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {(['all', 'alumni', 'faculty'] as const).map(tab => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setRoleFilter(tab)}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer capitalize ${
                        roleFilter === tab
                          ? 'bg-[#0A0A0A] text-white'
                          : 'bg-white text-[#6B7280] border border-[#E5E7EB] hover:text-[#0A0A0A]'
                      }`}
                    >
                      {tab === 'all' ? `All (${allMentors.length})` : tab}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mentors Grid / Empty state */}
              {filteredMentors.length === 0 ? (
                /* 3-Step Empty State */
                <div className="border border-[#E5E7EB] rounded-2xl p-8 sm:p-12 text-center max-w-lg mx-auto space-y-4 my-8">
                  <div className="w-12 h-12 rounded-full bg-[#F3F4F6] flex items-center justify-center mx-auto text-[#0A0A0A]">
                    <Search className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-[#0A0A0A]">No mentors found</h3>
                    <p className="text-xs text-[#6B7280] mt-1">
                      No verified alumni or faculty mentors matched your current filter criteria.
                    </p>
                  </div>

                  <div className="text-left bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl p-4 space-y-2 text-xs text-[#4B5563]">
                    <p className="font-semibold text-[#0A0A0A]">Suggested next steps:</p>
                    <ol className="list-decimal list-inside space-y-1 text-[11px] text-[#6B7280]">
                      <li>Clear search query or switch back to the "All" filter.</li>
                      <li>Explore the full Directory to browse alumni in specific organizations.</li>
                      <li>Check back regularly as mentors open new weekly slots.</li>
                    </ol>
                  </div>

                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setSearchQuery('');
                      setRoleFilter('all');
                    }}
                  >
                    Reset filters
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                  {filteredMentors.map(mentor => (
                    <div
                      key={mentor.id}
                      className="bg-white border border-[#E5E7EB] hover:border-[#0A0A0A] rounded-2xl p-4 transition-all duration-150 flex flex-col justify-between space-y-3"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <Avatar src={mentor.avatarUrl} name={mentor.name} size={40} className="border border-[#E5E7EB]" />
                          <span className="px-2 py-0.5 bg-[#F3F4F6] text-[#6B7280] text-[10px] font-semibold rounded-full border border-[#E5E7EB] capitalize">
                            {mentor.userType}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-xs text-[#0A0A0A] truncate">{mentor.name}</h3>
                          <p className="text-[11px] text-[#6B7280] truncate mt-0.5">
                            {mentor.role} {mentor.company ? `· ${mentor.company}` : ''}
                          </p>
                        </div>

                        {(mentor as any).skills && (mentor as any).skills.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {((mentor as any).skills as string[]).slice(0, 3).map((skill, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 bg-[#F9FAFB] border border-[#E5E7EB] text-[#4B5563] text-[10px] rounded-md"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="pt-2 border-t border-[#E5E7EB] flex items-center justify-between">
                        <span className="text-[11px] text-[#6B7280] font-medium">
                          {mentor.availableSlots} open slots
                        </span>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleOpenSheetForMentor(mentor)}
                          className="cursor-pointer"
                        >
                          Request
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── TAB CONTENT: STUDENT -> REQUESTS ──────────────────────────── */}
        {isStudent && studentTab === 'requests' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* 3-request pending limit banner */}
            {studentPendingCount >= 3 && (
              <div className="p-3.5 bg-[#FEF3C7] border border-[#FDE68A] text-[#92400E] rounded-2xl flex items-start gap-3">
                <AlertCircle className="w-4 h-4 shrink-0 text-[#B45309] mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-semibold text-xs">Maximum pending requests reached (3/3)</p>
                  <p className="text-[11px] leading-relaxed">
                    You have 3 active pending requests. Wait for mentors to respond or withdraw an older request before contacting another mentor.
                  </p>
                </div>
              </div>
            )}

            {studentPendingRequests.length === 0 && studentAcceptedRequests.length === 0 && studentDeclinedRequests.length === 0 && studentCompletedRequests.length === 0 ? (
              <div className="border border-[#E5E7EB] rounded-2xl p-12 text-center max-w-md mx-auto space-y-3">
                <Clock className="w-8 h-8 text-[#9CA3AF] mx-auto opacity-50" />
                <h3 className="font-bold text-sm text-[#0A0A0A]">No mentorship requests yet</h3>
                <p className="text-xs text-[#6B7280]">
                  When you send a mentorship request to an alumni or faculty member, its progress will appear here.
                </p>
                <div className="pt-2">
                  <Button variant="primary" size="sm" onClick={() => setStudentTab('find')}>
                    Browse mentors
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Pending Section */}
                {studentPendingRequests.length > 0 && (
                  <div className="space-y-3">
                    <h2 className="text-xs font-bold text-[#0A0A0A] uppercase tracking-wider flex items-center gap-2">
                      <span>Pending review</span>
                      <span className="px-2 py-0.5 bg-[#FEF3C7] text-[#92400E] text-[10px] font-bold rounded-full border border-[#FDE68A]">
                        {studentPendingRequests.length}
                      </span>
                    </h2>

                    <div className="divide-y divide-[#E5E7EB] border border-[#E5E7EB] rounded-2xl bg-white overflow-hidden">
                      {studentPendingRequests.map(req => (
                        <div key={req.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="space-y-1.5 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-xs text-[#0A0A0A]">{req.mentorName}</span>
                              <span className="px-2 py-0.5 bg-[#FEF3C7] text-[#92400E] text-[10px] font-semibold rounded-full border border-[#FDE68A]">
                                Pending
                              </span>
                            </div>
                            <p className="text-xs font-medium text-[#0A0A0A]">{req.topic || req.purposeOfRequest}</p>
                            <div>
                              <p className={`text-[11px] text-[#6B7280] leading-relaxed whitespace-pre-line break-words ${expandedNotes[req.id] || req.message.length <= 140 ? '' : 'line-clamp-2'}`}>
                                {req.message}
                              </p>
                              {req.message.length > 140 && (
                                <button
                                  type="button"
                                  onClick={() => setExpandedNotes(prev => ({ ...prev, [req.id]: !prev[req.id] }))}
                                  className="text-[10px] text-[#2563EB] hover:underline font-medium mt-0.5 cursor-pointer"
                                >
                                  {expandedNotes[req.id] ? 'Show less' : 'Show full note'}
                                </button>
                              )}
                            </div>
                            <p className="text-[10px] text-[#9CA3AF] pt-1">
                              Requested {new Date(req.requestedDate || Date.now()).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleWithdraw(req.id)}
                              className="text-[#991B1B] hover:text-[#7F1D1D] hover:bg-[#FEE2E2]"
                            >
                              Withdraw request
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Accepted Section */}
                {studentAcceptedRequests.length > 0 && (
                  <div className="space-y-3">
                    <h2 className="text-xs font-bold text-[#0A0A0A] uppercase tracking-wider flex items-center gap-2">
                      <span>Accepted</span>
                      <span className="px-2 py-0.5 bg-[#ECFDF5] text-[#065F46] text-[10px] font-bold rounded-full border border-[#A7F3D0]">
                        {studentAcceptedRequests.length}
                      </span>
                    </h2>

                    <div className="divide-y divide-[#E5E7EB] border border-[#E5E7EB] rounded-2xl bg-white overflow-hidden">
                      {studentAcceptedRequests.map(req => (
                        <div key={req.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="space-y-1.5 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-xs text-[#0A0A0A]">{req.mentorName}</span>
                              <span className="px-2 py-0.5 bg-[#ECFDF5] text-[#065F46] text-[10px] font-semibold rounded-full border border-[#A7F3D0]">
                                Accepted
                              </span>
                            </div>
                            <p className="text-xs font-medium text-[#0A0A0A]">{req.topic || req.purposeOfRequest}</p>
                            <p className="text-[11px] text-[#6B7280] leading-relaxed">
                              Mentor accepted your request. Reach out via Messages to coordinate your discussion.
                            </p>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => downloadCalendarInvite(`Mentorship Session with ${req.mentorName}`, req.topic || 'Mentorship')}
                              className="cursor-pointer"
                            >
                              <Calendar className="w-3.5 h-3.5 mr-1 text-[#6B7280]" />
                              <span>Add to calendar (.ics)</span>
                            </Button>
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleMessageUser(req.mentorId)}
                              className="cursor-pointer"
                            >
                              <MessageSquare className="w-3.5 h-3.5 mr-1" />
                              <span>Message</span>
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Declined Section */}
                {studentDeclinedRequests.length > 0 && (
                  <div className="space-y-3">
                    <h2 className="text-xs font-bold text-[#0A0A0A] uppercase tracking-wider flex items-center gap-2">
                      <span>Declined</span>
                      <span className="px-2 py-0.5 bg-[#F3F4F6] text-[#6B7280] text-[10px] font-bold rounded-full border border-[#E5E7EB]">
                        {studentDeclinedRequests.length}
                      </span>
                    </h2>

                    <div className="divide-y divide-[#E5E7EB] border border-[#E5E7EB] rounded-2xl bg-white overflow-hidden">
                      {studentDeclinedRequests.map(req => (
                        <div key={req.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="space-y-1.5 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-xs text-[#0A0A0A]">{req.mentorName}</span>
                              <span className="px-2 py-0.5 bg-[#F3F4F6] text-[#6B7280] text-[10px] font-semibold rounded-full border border-[#E5E7EB]">
                                Declined
                              </span>
                            </div>
                            <p className="text-xs text-[#6B7280]">{req.topic || req.purposeOfRequest}</p>
                            {(req.declineReason || req.feedback) && (
                              <p className="text-[11px] text-[#4B5563] bg-[#F9FAFB] p-2 rounded-lg border border-[#E5E7EB]">
                                <strong>Mentor note:</strong> {req.declineReason || (typeof req.feedback === 'string' ? req.feedback : req.feedback?.review || (req as any).feedback?.comment)}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => setStudentTab('find')}
                            >
                              Find another mentor
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Completed Section */}
                {studentCompletedRequests.length > 0 && (
                  <div className="space-y-3">
                    <h2 className="text-xs font-bold text-[#0A0A0A] uppercase tracking-wider flex items-center gap-2">
                      <span>Completed sessions</span>
                      <span className="px-2 py-0.5 bg-[#ECFDF5] text-[#065F46] text-[10px] font-bold rounded-full border border-[#A7F3D0]">
                        {studentCompletedRequests.length}
                      </span>
                    </h2>

                    <div className="divide-y divide-[#E5E7EB] border border-[#E5E7EB] rounded-2xl bg-white overflow-hidden">
                      {studentCompletedRequests.map(req => (
                        <div key={req.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="space-y-1.5 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-xs text-[#0A0A0A]">{req.mentorName}</span>
                              <span className="px-2 py-0.5 bg-[#ECFDF5] text-[#065F46] text-[10px] font-semibold rounded-full border border-[#A7F3D0]">
                                Completed
                              </span>
                              {req.feedback && typeof req.feedback === 'object' && req.feedback.rating && (
                                <span className="text-[11px] text-[#D97706] font-semibold flex items-center gap-0.5">
                                  ★ {req.feedback.rating}/5
                                </span>
                              )}
                            </div>
                            <p className="text-xs font-medium text-[#0A0A0A]">{req.topic || req.purposeOfRequest}</p>
                            {req.feedback && typeof req.feedback === 'object' && req.feedback.review && (
                              <p className="text-[11px] text-[#6B7280]">
                                Your feedback: "{req.feedback.review}"
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleMessageUser(req.mentorId)}
                              className="cursor-pointer"
                            >
                              <MessageSquare className="w-3.5 h-3.5 mr-1" />
                              <span>Message</span>
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ─── TAB CONTENT: STUDENT -> MY MENTORS ────────────────────────── */}
        {isStudent && studentTab === 'my-mentors' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {myActiveMentors.length === 0 ? (
              <div className="border border-[#E5E7EB] rounded-2xl p-12 text-center max-w-md mx-auto space-y-3">
                <UserCheck className="w-8 h-8 text-[#9CA3AF] mx-auto opacity-50" />
                <h3 className="font-bold text-sm text-[#0A0A0A]">No active mentors yet</h3>
                <p className="text-xs text-[#6B7280]">
                  Once a mentor accepts your request, your active 1-on-1 mentorship relationship will appear here.
                </p>
                <div className="pt-2">
                  <Button variant="primary" size="sm" onClick={() => setStudentTab('find')}>
                    Find a mentor
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {myActiveMentors.map(rel => (
                  <div
                    key={rel.id}
                    className="border border-[#E5E7EB] rounded-2xl p-5 bg-white space-y-4 flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-bold text-sm text-[#0A0A0A]">{rel.mentorName}</h3>
                          <p className="text-xs text-[#6B7280]">{rel.mentorCompanyOrDept || 'Vidyalankar Institute of Technology'}</p>
                        </div>
                        <span className="px-2 py-0.5 bg-[#ECFDF5] text-[#065F46] text-[10px] font-semibold rounded-full border border-[#A7F3D0]">
                          Active Mentorship
                        </span>
                      </div>

                      <div className="p-3 bg-[#F9FAFB] rounded-xl border border-[#E5E7EB] text-xs space-y-1">
                        <p className="font-semibold text-[#0A0A0A]">Topic: {rel.topic || rel.purposeOfRequest}</p>
                        <p className="text-[#6B7280] text-[11px]">Purpose: {rel.purposeOfRequest}</p>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[#E5E7EB] flex items-center justify-between gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setCompleteModalReq(rel)}
                        className="cursor-pointer"
                      >
                        Complete session
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleMessageUser(rel.mentorId)}
                        className="cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5 mr-1" />
                        <span>Message</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── TAB CONTENT: MENTOR -> REQUESTS ───────────────────────────── */}
        {isMentor && mentorTab === 'requests' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {incomingMentorRequests.length === 0 ? (
              <div className="border border-[#E5E7EB] rounded-2xl p-12 text-center max-w-md mx-auto space-y-3">
                <Clock className="w-8 h-8 text-[#9CA3AF] mx-auto opacity-50" />
                <h3 className="font-bold text-sm text-[#0A0A0A]">No incoming requests</h3>
                <p className="text-xs text-[#6B7280]">
                  When students request career guidance or research advice, their inquiries will appear here for your review.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[#E5E7EB] border border-[#E5E7EB] rounded-2xl bg-white overflow-hidden">
                {incomingMentorRequests.map(req => (
                  <div key={req.id} className="p-5 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-xs text-[#0A0A0A]">{req.studentName}</h3>
                          <span className="px-2 py-0.5 bg-[#F3F4F6] text-[#4B5563] text-[10px] rounded font-medium">
                            {req.studentDepartment || 'CMPN'} · {req.studentYear || 'BE'}
                          </span>
                        </div>
                        <p className="text-xs font-medium text-[#0A0A0A] mt-0.5">
                          {req.topic || req.purposeOfRequest}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setDeclineModalReq(req);
                            setDeclineReason('At capacity right now');
                            setCustomDeclineNote('');
                          }}
                          className="text-[#991B1B] hover:text-[#7F1D1D] hover:bg-[#FEE2E2]"
                        >
                          Decline
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleAcceptRequest(req)}
                        >
                          Accept
                        </Button>
                      </div>
                    </div>

                    <div className="bg-[#F9FAFB] p-3 rounded-xl border border-[#E5E7EB]">
                      <p className={`text-xs text-[#4B5563] leading-relaxed whitespace-pre-line break-words ${expandedNotes[req.id] || req.message.length <= 180 ? '' : 'line-clamp-2'}`}>
                        {req.message}
                      </p>
                      {req.message.length > 180 && (
                        <button
                          type="button"
                          onClick={() => setExpandedNotes(prev => ({ ...prev, [req.id]: !prev[req.id] }))}
                          className="text-[11px] text-[#2563EB] hover:underline font-medium mt-1 cursor-pointer"
                        >
                          {expandedNotes[req.id] ? 'Show less' : 'Show full note'}
                        </button>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-[#6B7280] pt-1">
                      <span>Submitted on {new Date(req.requestedDate || Date.now()).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                      <button
                        type="button"
                        onClick={() => handleOpenStudentProfile(req)}
                        className="underline hover:text-[#0A0A0A] flex items-center gap-1 cursor-pointer bg-transparent border-0 p-0 text-[11px] text-[#6B7280]"
                      >
                        <span>View student profile</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── TAB CONTENT: MENTOR -> MENTEES ────────────────────────────── */}
        {isMentor && mentorTab === 'mentees' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {activeMentees.length === 0 ? (
              <div className="border border-[#E5E7EB] rounded-2xl p-12 text-center max-w-md mx-auto space-y-3">
                <UserCheck className="w-8 h-8 text-[#9CA3AF] mx-auto opacity-50" />
                <h3 className="font-bold text-sm text-[#0A0A0A]">No active mentees yet</h3>
                <p className="text-xs text-[#6B7280]">
                  When you accept student mentorship inquiries, their profiles and communications will show up here.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {activeMentees.map(mentee => (
                  <div
                    key={mentee.id}
                    className="border border-[#E5E7EB] rounded-2xl p-5 bg-white space-y-4 flex flex-col justify-between"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-bold text-sm text-[#0A0A0A]">{mentee.studentName}</h3>
                          <p className="text-xs text-[#6B7280]">
                            {mentee.studentDepartment || 'CMPN'} · {mentee.studentYear || 'BE'}
                          </p>
                        </div>
                        <span className="px-2 py-0.5 bg-[#ECFDF5] text-[#065F46] text-[10px] font-semibold rounded-full border border-[#A7F3D0]">
                          Active Mentee
                        </span>
                      </div>

                      <div className="p-3 bg-[#F9FAFB] rounded-xl border border-[#E5E7EB] text-xs space-y-1">
                        <p className="font-semibold text-[#0A0A0A]">Topic: {mentee.topic || mentee.purposeOfRequest}</p>
                        <p className="text-[#6B7280] text-[11px] truncate">Email: {mentee.studentEmail}</p>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[#E5E7EB] flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => handleOpenStudentProfile(mentee)}
                        className="text-xs text-[#6B7280] hover:text-[#0A0A0A] underline cursor-pointer bg-transparent border-0 p-0"
                      >
                        Profile
                      </button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleMessageUser(mentee.studentId)}
                        className="cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5 mr-1" />
                        <span>Message</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── TAB CONTENT: STUDENT -> INVITATIONS ───────────────────────── */}
        {isStudent && studentTab === 'invitations' && (
          <React.Suspense fallback={<div className="p-8 text-center text-xs text-[#6B7280]">Loading invitations...</div>}>
            <StudentInvitationsPanel onOpenChat={handleMessageUser} />
          </React.Suspense>
        )}

        {/* ─── TAB CONTENT: MENTOR -> DISCOVER STUDENTS ─────────────────── */}
        {isMentor && mentorTab === 'discover' && (
          <React.Suspense fallback={<div className="p-8 text-center text-xs text-[#6B7280]">Loading discoverable students...</div>}>
            <DiscoverStudentsPanel role={currentRole === 'faculty' || currentRole === 'teacher' ? 'faculty' : 'alumni'} />
          </React.Suspense>
        )}

      </div>

      {/* ─── DECLINE REQUEST MODAL ─────────────────────────────────────── */}
      <Modal
        isOpen={!!declineModalReq}
        onClose={() => setDeclineModalReq(null)}
        title="Decline mentorship request"
        subtitle={`Politely notify ${declineModalReq?.studentName || 'the student'} why you cannot mentor them currently.`}
        maxWidth="md"
      >
        <div className="space-y-4 text-xs font-sans">
          <div>
            <label className="block text-xs font-semibold text-[#0A0A0A] mb-1.5">
              Reason
            </label>
            <div className="space-y-2">
              {[
                'At capacity right now',
                'Not my area of technical expertise',
                'Scheduling conflicts during proposed times',
                'Other'
              ].map(reason => (
                <label
                  key={reason}
                  className="flex items-center gap-2 p-2.5 rounded-lg border border-[#E5E7EB] hover:bg-[#F9FAFB] cursor-pointer"
                >
                  <input
                    type="radio"
                    name="declineReason"
                    value={reason}
                    checked={declineReason === reason}
                    onChange={() => setDeclineReason(reason)}
                    className="w-3.5 h-3.5 text-[#0A0A0A]"
                  />
                  <span className="text-xs text-[#0A0A0A]">{reason}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#0A0A0A] mb-1.5">
              Optional encouraging note
            </label>
            <textarea
              rows={3}
              value={customDeclineNote}
              onChange={e => setCustomDeclineNote(e.target.value)}
              placeholder="e.g. Recommend reaching out to Professor Sharma who leads CMPN AI research..."
              className="w-full p-2.5 rounded-lg border border-[#E5E7EB] text-xs text-[#0A0A0A] placeholder-[#9CA3AF] focus:outline-none focus:border-[#0A0A0A] resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E5E7EB]">
            <Button variant="secondary" size="md" onClick={() => setDeclineModalReq(null)}>
              Cancel
            </Button>
            <Button variant="primary" size="md" onClick={handleDeclineSubmit}>
              Submit decline
            </Button>
          </div>
        </div>
      </Modal>

      {/* ─── COMPLETE MENTORSHIP MODAL ──────────────────────────────────── */}
      <Modal
        isOpen={!!completeModalReq}
        onClose={() => setCompleteModalReq(null)}
        title="Complete mentorship session"
        subtitle={`Rate your experience with ${completeModalReq?.mentorName || 'your mentor'}.`}
        maxWidth="md"
      >
        <div className="space-y-4 text-xs font-sans">
          <div>
            <label className="block text-xs font-semibold text-[#0A0A0A] mb-2">
              Overall rating
            </label>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map(starVal => (
                <button
                  key={starVal}
                  type="button"
                  onClick={() => setRating(starVal)}
                  className="p-1 text-[#6B7280] hover:text-[#0A0A0A] transition-colors cursor-pointer"
                >
                  <Star
                    className={`w-6 h-6 ${starVal <= rating ? 'fill-[#0A0A0A] text-[#0A0A0A]' : 'text-[#D1D5DB]'}`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#0A0A0A] mb-1.5">
              Feedback / Key takeaways
            </label>
            <textarea
              rows={3}
              value={feedbackNotes}
              onChange={e => setFeedbackNotes(e.target.value)}
              placeholder="Share what was helpful or how the session contributed to your career goals..."
              className="w-full p-2.5 rounded-lg border border-[#E5E7EB] text-xs text-[#0A0A0A] placeholder-[#9CA3AF] focus:outline-none focus:border-[#0A0A0A] resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E5E7EB]">
            <Button variant="secondary" size="md" onClick={() => setCompleteModalReq(null)}>
              Cancel
            </Button>
            <Button variant="primary" size="md" onClick={handleCompleteSubmit}>
              Complete & submit
            </Button>
          </div>
        </div>
      </Modal>

      {/* ─── SHARED REQUEST MENTORSHIP SHEET ────────────────────────────── */}
      <RequestMentorshipSheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        targetUser={sheetTargetMentor}
        onSuccess={() => {
          setNotice('Mentorship request transmitted successfully');
          setTimeout(() => setNotice(null), 3000);
          setStudentTab('requests');
        }}
      />

      {/* Student Profile Drawer */}
      <AnimatePresence>
        {selectedStudentProfile && (
          <div className="fixed inset-0 z-50 flex items-center justify-end bg-[#0A0A0A]/40 backdrop-blur-xs p-0 sm:p-4">
            <div className="fixed inset-0" onClick={() => setSelectedStudentProfile(null)} />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative z-10 w-full max-w-lg h-full sm:h-[90vh] bg-white sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            >
              <MemberProfilePanel
                user={selectedStudentProfile}
                onClose={() => setSelectedStudentProfile(null)}
                onRequestMentorship={() => {}}
                onMessage={(u) => {
                  setSelectedStudentProfile(null);
                  handleMessageUser(u.id);
                }}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const MentorshipPage: React.FC<MentorshipPageProps> = props => {
  const { currentRole } = useAuth();
  if (currentRole === 'admin') {
    return <AdminMentorshipGuardView />;
  }
  return <StandardMentorshipPage {...props} />;
};
export default MentorshipPage;

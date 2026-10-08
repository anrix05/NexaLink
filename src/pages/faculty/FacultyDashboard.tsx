import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { announcementsService } from '../../services/announcementsService';
import { auditService } from '../../services/auditService';
import type { FacultyProfile, Announcement, StudentProfile } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';
import { MemberProfilePanel } from '../../components/directory/MemberProfilePanel';
import {
  BookOpen,
  GraduationCap,
  Users,
  Calendar,
  Briefcase,
  Star,
  FileSpreadsheet,
  Plus,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Radio,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import {
  PageHeader,
  Section,
  ListRow,
  RightRail,
  StatusBadge,
  CapacityMeter,
  Switch,
  EmptyState
} from '../../components/ui';
import { Button, Modal } from '../../components/common/UIComponents';
import { NoticeBoard } from '../../components/notices/NoticeBoard';
import { getGreetingName } from '../../utils/validators';

const SuggestedStudentsCard = React.lazy(() => import('../../features/outreach/SuggestedStudentsCard').then(m => ({ default: m.SuggestedStudentsCard })));

interface FacultyDashboardProps {
  setActiveTab: (tab: string, subTab?: string) => void;
}

const FacultyDashboardContent: React.FC<FacultyDashboardProps & { faculty: FacultyProfile }> = ({
  setActiveTab,
  faculty
}) => {
  const {
    alumniList,
    studentList,
    mentorshipRequests,
    eventsList,
    jobsList,
    updateMentorshipStatus,
    updateUserProfile,
    announcements,
    addAnnouncement,
    updateAnnouncement,
    retractAnnouncement,
    setPendingChatUserId
  } = useData();

  const [notice, setNotice] = useState<string | null>(null);
  const [isMentoringAvailable, setIsMentoringAvailable] = useState<boolean>(
    faculty.isMentoringAvailable ?? true
  );
  const [avatarError, setAvatarError] = useState(false);

  // Student Profile Drawer State
  const [selectedStudentProfile, setSelectedStudentProfile] = useState<StudentProfile | null>(null);
  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({});

  const handleOpenStudentProfile = (req: any) => {
    const studentId = req.studentId || req.id;
    const studentEmail = req.studentEmail || req.email;
    const matched = studentList.find(s => s.id === studentId || s.email === studentEmail);
    if (matched) {
      setSelectedStudentProfile(matched);
      return;
    }
    const fallback: StudentProfile = {
      id: studentId,
      name: req.studentName || 'Student',
      email: studentEmail || 'student@vit.edu.in',
      avatar: '',
      role: 'student',
      department: req.studentDepartment || faculty.department || 'CMPN',
      enrollmentNo: req.studentEnrollmentNo || 'N/A',
      prn: req.studentEnrollmentNo || 'N/A',
      currentYear: (req.studentYear as any) || 'BE',
      semester: 'BE',
      cgpa: 8.5,
      skills: ['Academic Research', 'Engineering Projects'],
      areasOfInterest: [req.purposeOfRequest || req.topic || 'Academic Guidance'],
      careerGoal: req.purposeOfRequest || 'Academic Mentorship',
      preferredIndustry: 'Higher Education',
      preferredHigherStudies: 'None',
      certifications: [],
      projects: [],
      targetCompanies: [],
      isVerified: true,
      verificationStatus: 'Verified',
      bio: `Student at Vidyalankar Institute of Technology, ${req.studentDepartment || faculty.department} Department. Seeking mentorship on ${req.purposeOfRequest || req.topic || 'Academic Advisory'}.`,
      createdAt: new Date().toISOString()
    };
    setSelectedStudentProfile(fallback);
  };

  const facultyInitials = (faculty.name || 'Faculty')
    .split(' ')
    .filter(Boolean)
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const showToast = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 3500);
  };

  const handleToggleMentoring = (nextVal: boolean) => {
    setIsMentoringAvailable(nextVal);
    updateUserProfile(faculty.id, { isMentoringAvailable: nextVal });
    showToast(nextVal ? 'Mentorship availability enabled: Accepting student asks.' : 'Mentorship paused: Set to busy.');
  };

  // 1. Department Live Counts
  const deptStudents = studentList.filter(s => s.department === faculty.department);
  const deptAlumni = alumniList.filter(
    a => a.department === faculty.department && (a.isVerified || a.verificationStatus === 'Verified')
  );

  // 2. Mentee Capacity & Advisory Requests
  const myFacultyRequests = mentorshipRequests.filter(
    r =>
      r.mentorId === faculty.id ||
      r.mentorName?.includes(faculty.name) ||
      (r.mentorRole === 'faculty' && r.mentorCompanyOrDept === faculty.department)
  );
  const pendingRequests = myFacultyRequests.filter(r => r.status === 'Pending');
  const activeMentees = myFacultyRequests.filter(r => r.status === 'Accepted');
  const activeMenteesCount = activeMentees.length;
  const maxCapacity = faculty.maxMentees || 5;

  // 3. Opportunities / Research Projects Posted
  const myPostedJobs = jobsList.filter(
    j => j.postedByAlumniId === faculty.id || j.postedByAlumniName?.includes(faculty.name)
  );

  // 4. Rating & Reviews from completed sessions
  const ratedRequests = myFacultyRequests.filter(r => r.feedback && r.feedback.rating && r.feedback.rating > 0);
  const totalReviewsCount = ratedRequests.length;
  const avgRating =
    totalReviewsCount > 0
      ? (ratedRequests.reduce((sum, r) => sum + (r.feedback?.rating || 0), 0) / totalReviewsCount).toFixed(1)
      : null;

  // 5. Hosted Events
  const upcomingHosted = eventsList.filter(e => e.speakerName?.includes(faculty.name) || (e.department && e.department === faculty.department));

  // 6. Announcements State (Restricted Faculty Mode)
  const [showAncModal, setShowAncModal] = useState(false);
  const [editingAncId, setEditingAncId] = useState<string | null>(null);
  const [ancTitle, setAncTitle] = useState('');
  const [ancContent, setAncContent] = useState('');
  const [ancCategory, setAncCategory] = useState<'General' | 'Academic' | 'Placement' | 'Alumni'>('General');
  const [ancTargetAudience, setAncTargetAudience] = useState<'Students' | 'Alumni' | 'Faculty'>('Students');
  const [ancIsImportant, setAncIsImportant] = useState(false);
  const [ancHasExpiry, setAncHasExpiry] = useState(false);
  const [ancExpiresAt, setAncExpiresAt] = useState('');
  const [ancFilterStatus, setAncFilterStatus] = useState<'Active' | 'Expired' | 'Retracted' | 'All'>('Active');
  const [isSubmittingAnc, setIsSubmittingAnc] = useState(false);
  const [ancFormError, setAncFormError] = useState<string | null>(null);

  const handleOpenNewAnnouncement = () => {
    setEditingAncId(null);
    setAncTitle('');
    setAncContent('');
    setAncCategory('General');
    setAncTargetAudience('Students');
    setAncIsImportant(false);
    setAncHasExpiry(false);
    setAncExpiresAt('');
    setAncFormError(null);
    setShowAncModal(true);
  };

  const handleOpenEditAnnouncement = (anc: Announcement) => {
    setEditingAncId(anc.id);
    setAncTitle(anc.title);
    setAncContent(anc.content);
    setAncCategory((anc.category as any) || 'General');
    setAncTargetAudience((anc.targetAudience as any) || 'Students');
    setAncIsImportant(Boolean(anc.isImportant || anc.severity === 'governance'));
    setAncHasExpiry(Boolean(anc.expiresAt));
    setAncExpiresAt(anc.expiresAt ? anc.expiresAt.split('T')[0] : '');
    setAncFormError(null);
    setShowAncModal(true);
  };

  const handleSubmitAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ancTitle.trim() || !ancContent.trim()) return;
    setIsSubmittingAnc(true);
    setAncFormError(null);

    const trimmedTitle = ancTitle.trim().slice(0, 120);
    const trimmedContent = ancContent.trim().slice(0, 1000);
    const expiresAt = ancHasExpiry && ancExpiresAt ? new Date(ancExpiresAt + 'T23:59:59').toISOString() : undefined;

    const payload = {
      title: trimmedTitle,
      category: ancCategory,
      author: faculty.name || 'Faculty Member',
      authorId: faculty.id,
      content: trimmedContent,
      isImportant: ancIsImportant,
      targetAudience: ancTargetAudience,
      severity: ancIsImportant ? ('governance' as const) : ('standard' as const),
      expiresAt,
      isPinned: false
    };

    try {
      if (editingAncId) {
        const saved = await announcementsService.updateAnnouncement(editingAncId, payload);
        if (!saved || !saved.id) throw new Error('Failed to update announcement.');
        await updateAnnouncement(editingAncId, payload);
        await auditService.appendLog({
          id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : undefined as any,
          action: 'EDIT_ANNOUNCEMENT',
          performedBy: faculty.name || 'Faculty Member',
          targetUserOrItem: editingAncId,
          timestamp: new Date().toISOString(),
          details: `Faculty updated announcement: "${trimmedTitle}"`
        });
        showToast(`Announcement updated: "${payload.title}"`);
        setShowAncModal(false);
      } else {
        const saved = await announcementsService.createAnnouncement(payload);
        if (!saved || !saved.id) throw new Error('Failed to publish announcement.');
        await addAnnouncement({ ...payload, id: saved.id, authorId: saved.authorId || faculty.id } as any);
        await auditService.appendLog({
          id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : undefined as any,
          action: 'PUBLISH_ANNOUNCEMENT',
          performedBy: faculty.name || 'Faculty Member',
          targetUserOrItem: trimmedTitle,
          timestamp: new Date().toISOString(),
          details: `Faculty published announcement "${trimmedTitle}" for ${payload.targetAudience}`
        });
        showToast(`Announcement published: "${payload.title}"`);
        setShowAncModal(false);
      }
    } catch (err: any) {
      setAncFormError(err.message || 'Failed to save announcement. Please check your inputs and try again.');
    } finally {
      setIsSubmittingAnc(false);
    }
  };

  const handleRetractAnnouncement = async (anc: Announcement) => {
    try {
      await announcementsService.retractAnnouncement(anc.id);
      retractAnnouncement(anc.id);
      await auditService.appendLog({
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : undefined as any,
        action: 'RETRACT_ANNOUNCEMENT',
        performedBy: faculty.name || 'Faculty Member',
        targetUserOrItem: anc.id,
        timestamp: new Date().toISOString(),
        details: `Faculty retracted announcement: "${anc.title}"`
      });
      showToast(`Announcement "${anc.title}" retracted.`);
    } catch (err: any) {
      showToast(err.message || 'Failed to retract announcement.');
    }
  };

  const myAnnouncements = announcements.filter(
    a => a.authorId === faculty.id || (a.author && a.author === faculty.name)
  );

  const filteredMyAnnouncements = myAnnouncements.filter(a => {
    const now = Date.now();
    const isExp = a.expiresAt ? new Date(a.expiresAt).getTime() <= now : false;
    if (ancFilterStatus === 'Active') return !a.isRetracted && !isExp;
    if (ancFilterStatus === 'Expired') return !a.isRetracted && isExp;
    if (ancFilterStatus === 'Retracted') return a.isRetracted;
    return true;
  });

  return (
    <div className="space-y-8">
      {/* Toast Notification */}
      {notice && (
        <div className="fixed top-20 right-6 z-50 bg-[#0A0A0A] text-white px-4 py-2.5 rounded-lg text-xs font-medium shadow-md transition-opacity">
          {notice}
        </div>
      )}

      {/* 1. Header (Open Canvas PageHeader primitive) */}
      <PageHeader
        eyebrow={faculty.isHod ? 'Department head' : 'Faculty advisor'}
        title={`Welcome back, ${getGreetingName(faculty.name)}`}
        subtitle={
          <div className="flex items-center gap-2 flex-wrap text-xs text-[#6B7280]">
            <span className="text-[#0A0A0A] font-medium">
              {faculty.designation?.toLowerCase().includes('head of department')
                ? `Department of ${faculty.department}`
                : `${faculty.designation || 'Faculty'} · Department of ${faculty.department}`}
            </span>
            <span>·</span>
            <span>
              Employee ID: <span className="font-mono text-[#0A0A0A]">{faculty.employeeId || 'EMP-FAC-014'}</span>
            </span>
            {faculty.specialization && (
              <>
                <span>·</span>
                <span>Specialization: {faculty.specialization}</span>
              </>
            )}
          </div>
        }
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleOpenNewAnnouncement}
              className="inline-flex items-center gap-1.5 px-3 py-2 border border-[#6B7280] hover:bg-[#FAFAFA] text-[#0A0A0A] text-xs font-medium rounded-lg transition-colors cursor-pointer"
            >
              <Radio className="w-3.5 h-3.5 text-[#0A0A0A]" />
              <span>Post announcement</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('reports')}
              className="inline-flex items-center gap-1.5 px-3 py-2 border border-[#6B7280] hover:bg-[#FAFAFA] text-[#0A0A0A] text-xs font-medium rounded-lg transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-[#0A0A0A]" />
              <span>Dept analytics</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('events')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#0A0A0A] hover:bg-[#262626] text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Host seminar</span>
            </button>
          </div>
        }
      />

      {/* Important Notices (Top placement below 1280px) */}
      <NoticeBoard variant="top" role="faculty" setActiveTab={setActiveTab} onNavigate={(tab) => setActiveTab(tab)} />

      {/* Two-Column Responsive Layout: Primary Canvas + Quiet Right Rail */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 items-start">
        {/* Main Canvas Content */}
        <div className="space-y-8 min-w-0">
          {/* Section 1: Advisory Requests */}
          <Section
            title="Advisory requests"
            count={pendingRequests.length}
            description="Undergraduate and postgraduate students seeking your academic guidance, project advisory, or research collaboration."
            noTopHairline
          >
            {pendingRequests.length === 0 ? (
              <EmptyState
                icon={<BookOpen className="w-5 h-5 text-[#0A0A0A]" />}
                title="No pending academic advisory requests"
                sentence={`When students submit mentorship or thesis guidance requests for faculty in ${faculty.department}, they will appear here with instant review actions.`}
              />
            ) : (
              <div className="divide-y divide-[#E5E7EB] border-t border-b border-[#E5E7EB]">
                {pendingRequests.map((req, index) => (
                  <ListRow
                    key={req.id}
                    isFirst={index === 0}
                    leading={
                      <div className="w-10 h-10 rounded-full bg-[#F3F4F6] text-[#0A0A0A] flex items-center justify-center font-semibold text-xs shrink-0">
                        {req.studentName.slice(0, 2).toUpperCase()}
                      </div>
                    }
                    title={
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-[#0A0A0A]">{req.studentName}</span>
                        <StatusBadge tone="indigo" label={req.studentDepartment || faculty.department} />
                        <span className="text-xs text-[#6B7280]">Year: {req.studentYear}</span>
                      </div>
                    }
                    subtitle={
                      <div className="space-y-1 mt-1">
                        <div className="text-xs text-[#6B7280]">
                          PRN: <span className="font-mono text-[#0A0A0A]">{req.studentEnrollmentNo || 'N/A'}</span> · {req.studentEmail}
                        </div>
                        <div className="p-2.5 bg-[#FAFAFA] rounded-md text-xs text-[#0A0A0A]">
                          <strong>Topic: {req.purposeOfRequest || req.topic}</strong>
                          {req.message && (
                            <div className="mt-1">
                              <p className="text-[#6B7280] italic leading-relaxed whitespace-pre-line break-words">
                                "{expandedNotes[req.id] || req.message.length <= 160 ? req.message : `${req.message.slice(0, 160)}...`}"
                              </p>
                              {req.message.length > 160 && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setExpandedNotes(prev => ({ ...prev, [req.id]: !prev[req.id] }));
                                  }}
                                  className="text-[11px] text-[#2563EB] hover:underline font-medium mt-0.5 cursor-pointer"
                                >
                                  {expandedNotes[req.id] ? 'Show less' : 'Show full message'}
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="pt-0.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenStudentProfile(req);
                            }}
                            className="inline-flex items-center gap-1.5 text-xs text-[#0A0A0A] hover:underline cursor-pointer"
                          >
                            <ExternalLink className="w-3.5 h-3.5 text-[#6B7280]" />
                            <span>View student profile ↗</span>
                          </button>
                        </div>
                      </div>
                    }
                    meta={
                      req.requestedDate ? (
                        <span className="text-xs text-[#6B7280] tabular-nums">
                          {new Date(req.requestedDate).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </span>
                      ) : undefined
                    }
                    trailing={
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            updateMentorshipStatus(req.id, 'Declined', 'Declined due to academic bandwidth.', 'faculty');
                            showToast(`Advisory request from ${req.studentName} declined.`);
                          }}
                          className="px-3 py-1.5 border border-[#6B7280] hover:bg-[#FAFAFA] text-[#0A0A0A] text-xs font-medium rounded-lg transition-colors cursor-pointer"
                        >
                          Decline
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            updateMentorshipStatus(req.id, 'Accepted', 'Accepted by faculty advisor.', 'faculty');
                            showToast(`Advisory request from ${req.studentName} accepted!`);
                          }}
                          className="px-3 py-1.5 bg-[#0A0A0A] hover:bg-[#262626] text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
                        >
                          Accept advisory
                        </button>
                      </div>
                    }
                  />
                ))}
              </div>
            )}
          </Section>

          {/* Section: Faculty Announcements */}
          <Section
            title="My announcements"
            count={filteredMyAnnouncements.length}
            description="Broadcast notices to students, alumni, and faculty feeds. Pinned notices and 'Everyone' targeting are restricted to Administrators."
            action={
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center rounded-lg border border-[#E5E7EB] bg-[#FAFAFA] p-0.5 text-xs">
                  {(['Active', 'Expired', 'Retracted', 'All'] as const).map(tab => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setAncFilterStatus(tab)}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                        ancFilterStatus === tab
                          ? 'bg-white text-[#0A0A0A] shadow-sm'
                          : 'text-[#6B7280] hover:text-[#0A0A0A]'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={handleOpenNewAnnouncement}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[#6B7280] hover:bg-[#FAFAFA] text-[#0A0A0A] text-xs font-medium rounded-lg transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New announcement</span>
                </button>
              </div>
            }
          >
            {filteredMyAnnouncements.length === 0 ? (
              <EmptyState
                icon={<Radio className="w-5 h-5 text-[#0A0A0A]" />}
                title={`No ${ancFilterStatus.toLowerCase()} announcements`}
                sentence="Publish departmental updates, academic advisories, or placement notifications."
                action={
                  <button
                    type="button"
                    onClick={handleOpenNewAnnouncement}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[#6B7280] hover:bg-[#FAFAFA] text-[#0A0A0A] text-xs font-medium rounded-lg transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create notice</span>
                  </button>
                }
              />
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredMyAnnouncements.map(anc => {
                  const isExpired = anc.expiresAt ? Date.now() > new Date(anc.expiresAt).getTime() : false;
                  const severity = anc.severity || (anc.isImportant ? 'governance' : 'standard');

                  return (
                    <div
                      key={anc.id}
                      className={`p-4 border border-[#E5E7EB] rounded-xl flex flex-col justify-between gap-3 ${
                        anc.isRetracted ? 'bg-[#FAFAFA] opacity-75' : 'bg-white'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {anc.isRetracted ? (
                              <StatusBadge tone="neutral" label="Retracted" />
                            ) : isExpired ? (
                              <StatusBadge tone="rose" label="Expired" />
                            ) : (
                              <StatusBadge tone="emerald" label="Active" />
                            )}

                            {anc.isImportant && !anc.isRetracted && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                                Important
                              </span>
                            )}

                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-[#F3F4F6] text-[#4B5563] border border-[#E5E7EB]">
                              {anc.category}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-xs text-[#6B7280]">
                            {anc.expiresAt ? (
                              <span>Exp: {new Date(anc.expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                            ) : (
                              <span>Permanent</span>
                            )}
                            <span>·</span>
                            <span>{anc.date ? new Date(anc.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}</span>
                          </div>
                        </div>

                        <h4 className="font-semibold text-[#0A0A0A] text-sm leading-snug">
                          {anc.title}
                        </h4>
                        <p className="text-xs text-[#374151] line-clamp-3 leading-relaxed whitespace-pre-line">
                          {anc.content}
                        </p>
                      </div>

                      <div className="pt-2.5 border-t border-[#E5E7EB] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2 text-[#6B7280]">
                          <span>Audience:</span>
                          <span className="font-medium text-[#0A0A0A] bg-[#FAFAFA] border border-[#E5E7EB] px-1.5 py-0.5 rounded text-[11px]">
                            {anc.targetAudience}
                          </span>
                        </div>

                        {!anc.isRetracted && (
                          <div className="flex items-center gap-1.5 self-end sm:self-auto">
                            <button
                              type="button"
                              onClick={() => handleOpenEditAnnouncement(anc)}
                              className="px-2.5 py-1 border border-[#E5E7EB] hover:bg-[#FAFAFA] text-[#0A0A0A] text-xs font-medium rounded-md transition-colors cursor-pointer"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRetractAnnouncement(anc)}
                              className="px-2.5 py-1 border border-rose-200 hover:bg-rose-50 text-[#991B1B] text-xs font-medium rounded-md transition-colors cursor-pointer"
                            >
                              Retract
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Section>

          {/* Section 2: Opportunities & Research Openings Posted */}
          <Section
            title="Opportunities you've posted"
            count={myPostedJobs.length}
            description="Research assistantships, lab internships, and departmental vacancies published by you for student applications."
            action={
              <button
                type="button"
                onClick={() => setActiveTab('jobs')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[#6B7280] hover:bg-[#FAFAFA] text-[#0A0A0A] text-xs font-medium rounded-lg transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Post opportunity</span>
              </button>
            }
          >
            {myPostedJobs.length === 0 ? (
              <EmptyState
                icon={<Briefcase className="w-5 h-5 text-[#0A0A0A]" />}
                title="No opportunities posted yet"
                sentence={`You haven't posted any research openings or internships yet. Click below to publish opportunities for ${faculty.department} students to apply.`}
                action={
                  <button
                    type="button"
                    onClick={() => setActiveTab('jobs')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#0A0A0A] hover:bg-[#262626] text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Post first opportunity</span>
                  </button>
                }
              />
            ) : (
              <div className="divide-y divide-[#E5E7EB] border-t border-b border-[#E5E7EB]">
                {myPostedJobs.map((job, index) => (
                  <ListRow
                    key={job.id}
                    isFirst={index === 0}
                    leading={
                      <div className="w-9 h-9 rounded-lg bg-[#F3F4F6] text-[#0A0A0A] flex items-center justify-center shrink-0">
                        <Briefcase className="w-4 h-4 text-[#0A0A0A]" />
                      </div>
                    }
                    title={job.title}
                    subtitle={`${job.company} · ${job.location} · ${job.stipendOrSalary || 'Honorarium / Academic Credit'}`}
                    meta={
                      <span className="text-xs text-[#6B7280] tabular-nums">
                        {job.applicantsCount || 0} applicants · Deadline: {job.applicationDeadline || 'Rolling'}
                      </span>
                    }
                    trailing={
                      <StatusBadge
                        tone={job.status === 'Active' ? 'emerald' : 'neutral'}
                        label={job.status}
                      />
                    }
                  />
                ))}
              </div>
            )}
          </Section>

          {/* Section 3: Upcoming Hosted Events */}
          <Section
            title="Upcoming events hosted"
            count={upcomingHosted.length}
            description={`Guest lectures, technical workshops, and departmental seminars scheduled under ${faculty.department}.`}
            action={
              <button
                type="button"
                onClick={() => setActiveTab('events')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[#6B7280] hover:bg-[#FAFAFA] text-[#0A0A0A] text-xs font-medium rounded-lg transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Host event</span>
              </button>
            }
          >
            {upcomingHosted.length === 0 ? (
              <EmptyState
                icon={<Calendar className="w-5 h-5 text-[#0A0A0A]" />}
                title="No upcoming events scheduled"
                sentence="Organize technical masterclasses, alumni guest lectures, or academic seminars for students."
                action={
                  <button
                    type="button"
                    onClick={() => setActiveTab('events')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[#6B7280] hover:bg-[#FAFAFA] text-[#0A0A0A] text-xs font-medium rounded-lg transition-colors cursor-pointer"
                  >
                    <span>Schedule event</span>
                  </button>
                }
              />
            ) : (
              <div className="divide-y divide-[#E5E7EB] border-t border-b border-[#E5E7EB]">
                {upcomingHosted.map((event, index) => (
                  <ListRow
                    key={event.id}
                    isFirst={index === 0}
                    leading={
                      <div className="w-9 h-9 rounded-lg bg-[#F3F4F6] text-[#0A0A0A] flex items-center justify-center shrink-0">
                        <Calendar className="w-4 h-4 text-[#0A0A0A]" />
                      </div>
                    }
                    title={event.title}
                    subtitle={`Speaker: ${event.speakerName} (${event.speakerDesignation})`}
                    meta={
                      <span className="text-xs text-[#6B7280] tabular-nums">
                        {event.date} · {event.time} · {event.rsvpsCount || event.registeredUserIds?.length || 0} RSVPs
                      </span>
                    }
                    trailing={<StatusBadge tone="indigo" label={event.type} />}
                  />
                ))}
              </div>
            )}
          </Section>

          {/* Section 4: Review & Rating History */}
          <Section
            title="Review & rating history"
            count={totalReviewsCount}
            description="Verified student evaluations and feedback from completed advisory sessions."
          >
            {totalReviewsCount === 0 ? (
              <EmptyState
                icon={<Star className="w-5 h-5 text-[#0A0A0A]" />}
                title="No reviews yet"
                sentence="Student reviews and ratings will automatically appear here once guidance and advisory sessions are completed."
              />
            ) : (
              <div className="divide-y divide-[#E5E7EB] border-t border-b border-[#E5E7EB]">
                {ratedRequests.map((r, index) => (
                  <ListRow
                    key={r.id}
                    isFirst={index === 0}
                    leading={
                      <div className="w-9 h-9 rounded-full bg-[#F3F4F6] text-[#0A0A0A] flex items-center justify-center text-xs font-semibold shrink-0">
                        {r.studentName.slice(0, 2).toUpperCase()}
                      </div>
                    }
                    title={
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-[#0A0A0A]">{r.studentName}</span>
                        <div className="flex items-center gap-0.5 text-[#0A0A0A]">
                          {Array.from({ length: r.feedback?.rating || 5 }).map((_, i) => (
                            <Star key={i} className="w-3.5 h-3.5 fill-[#0A0A0A] text-[#0A0A0A]" />
                          ))}
                        </div>
                      </div>
                    }
                    subtitle={
                      r.feedback?.review ? (
                        <p className="text-xs text-[#0A0A0A] italic mt-1 leading-relaxed">
                          "{r.feedback.review}"
                        </p>
                      ) : undefined
                    }
                    meta={
                      r.feedback?.date ? (
                        <span className="text-xs text-[#6B7280] tabular-nums">
                          {new Date(r.feedback.date).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </span>
                      ) : (
                        'Verified session'
                      )
                    }
                  />
                ))}
              </div>
            )}
          </Section>

          {/* Section 5: Institutional Accreditation Footer */}
          <div className="pt-6 border-t border-[#E5E7EB] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-[#FAFAFA] border border-[#E5E7EB] shrink-0">
                <FileSpreadsheet className="w-4 h-4 text-[#0A0A0A]" />
              </div>
              <div>
                <h4 className="font-semibold text-xs text-[#0A0A0A]">
                  NAAC / NIRF Institutional Accreditation Exports
                </h4>
                <p className="text-xs text-[#6B7280] mt-0.5">
                  Export verified departmental mentorship records, student interactions, and faculty guidance archives.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('reports')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[#6B7280] hover:bg-[#FAFAFA] text-[#0A0A0A] text-xs font-medium rounded-lg transition-colors cursor-pointer shrink-0"
            >
              <span>Accreditation reports</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Section: Suggested Students */}
          <React.Suspense fallback={null}>
            <SuggestedStudentsCard onNavigateToDiscovery={() => setActiveTab('mentorship', 'discover')} />
          </React.Suspense>
        </div>

        {/* Quiet Right Rail (≥1280px / lg) */}
        <RightRail className="space-y-6">
          {/* Mentee Capacity & Switch */}
          <div className="space-y-4 pb-6 border-b border-[#E5E7EB]">
            <h3 className="text-xs font-semibold text-[#0A0A0A]">
              Advisory status
            </h3>

            <CapacityMeter
              activeCount={activeMenteesCount}
              maxCount={maxCapacity}
              mode="stepper"
              label="Active advisories"
            />

            <Switch
              checked={isMentoringAvailable}
              onChange={handleToggleMentoring}
              label={isMentoringAvailable ? 'Accepting advisories' : 'Advisories paused'}
              description="Students can request research & project guidance"
              variant="emerald"
            />
          </div>

          {/* Department Overview */}
          <div className="space-y-3 pb-6 border-b border-[#E5E7EB]">
            <h3 className="text-xs font-semibold text-[#0A0A0A]">
              Department snapshot · {faculty.department}
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#6B7280]">Registered students</span>
                <span className="font-semibold text-[#0A0A0A] tabular-nums">{deptStudents.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#6B7280]">Verified alumni</span>
                <span className="font-semibold text-[#0A0A0A] tabular-nums">{deptAlumni.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#6B7280]">Advisory rating</span>
                <span className="font-semibold text-[#0A0A0A] tabular-nums flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-[#0A0A0A] text-[#0A0A0A]" />
                  {avgRating ? `${avgRating} / 5.0` : 'No ratings yet'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-[#0A0A0A]">Quick actions</h3>
            <div className="flex flex-col gap-1.5">
              <button
                type="button"
                onClick={handleOpenNewAnnouncement}
                className="text-left text-xs text-[#6B7280] hover:text-[#0A0A0A] py-1 transition-colors"
              >
                Post announcement →
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('directory')}
                className="text-left text-xs text-[#6B7280] hover:text-[#0A0A0A] py-1 transition-colors"
              >
                Browse departmental alumni →
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('reports')}
                className="text-left text-xs text-[#6B7280] hover:text-[#0A0A0A] py-1 transition-colors"
              >
                View department accreditation data →
              </button>
            </div>
          </div>

          {/* Real Important Notices in RightRail (≥1280px) */}
          <NoticeBoard variant="rail" role="faculty" setActiveTab={setActiveTab} onNavigate={(tab) => setActiveTab(tab)} />
        </RightRail>
      </div>

      {/* RESTRICTED FACULTY ANNOUNCEMENT COMPOSER MODAL */}
      <Modal
        isOpen={showAncModal}
        onClose={() => setShowAncModal(false)}
        title={editingAncId ? 'Edit Announcement' : 'Compose Announcement'}
        subtitle="Broadcast notices to students, alumni, and faculty feeds."
        maxWidth="2xl"
      >
        <form onSubmit={handleSubmitAnnouncement} className="space-y-4 font-sans text-xs">
          {ancFormError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{ancFormError}</span>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-[#0A0A0A]">
                Title (max 120 chars) <span className="text-rose-600">*</span>
              </label>
              <span className={`text-[11px] tabular-nums ${ancTitle.length >= 120 ? 'text-rose-600 font-semibold' : 'text-[#6B7280]'}`}>
                {ancTitle.length}/120
              </span>
            </div>
            <input
              type="text"
              required
              maxLength={120}
              value={ancTitle}
              onChange={e => setAncTitle(e.target.value)}
              placeholder="e.g. Guest lecture on Distributed Systems scheduled for Friday"
              className="w-full border border-[#6B7280] rounded-lg bg-[#FAFAFA] text-xs p-2.5 text-[#0A0A0A] focus:outline-none focus:ring-1 focus:ring-[#0A0A0A]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#0A0A0A] mb-1.5">
                Category
              </label>
              <select
                value={ancCategory}
                onChange={e => setAncCategory(e.target.value as any)}
                className="w-full border border-[#6B7280] rounded-lg bg-[#FAFAFA] text-xs p-2.5 text-[#0A0A0A] focus:outline-none"
              >
                <option value="General">General</option>
                <option value="Academic">Academic</option>
                <option value="Placement">Placement</option>
                <option value="Alumni">Alumni</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0A0A0A] mb-1.5">
                Audience
              </label>
              <select
                value={ancTargetAudience}
                onChange={e => setAncTargetAudience(e.target.value as any)}
                className="w-full border border-[#6B7280] rounded-lg bg-[#FAFAFA] text-xs p-2.5 text-[#0A0A0A] focus:outline-none"
              >
                <option value="Students">Students</option>
                <option value="Alumni">Alumni</option>
                <option value="Faculty">Faculty</option>
              </select>
              <p className="text-[11px] text-[#6B7280] mt-1 leading-normal">
                Visible to: {ancTargetAudience}. You will only see this on your own notices board if you include your own role.
              </p>
            </div>
          </div>

          {/* Author Display (Server-side logged in faculty, read-only) */}
          <div className="bg-[#FAFAFA] border border-[#E5E7EB] rounded-lg p-2.5 flex items-center justify-between text-xs">
            <span className="text-[#6B7280]">Author:</span>
            <span className="font-semibold text-[#0A0A0A]">{faculty.name}</span>
          </div>

          {/* Message Content */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-[#0A0A0A]">
                Message (max 1000 chars) <span className="text-rose-600">*</span>
              </label>
              <span className={`text-[11px] tabular-nums ${ancContent.length >= 1000 ? 'text-rose-600 font-semibold' : 'text-[#6B7280]'}`}>
                {ancContent.length}/1000
              </span>
            </div>
            <textarea
              rows={4}
              required
              maxLength={1000}
              value={ancContent}
              onChange={e => setAncContent(e.target.value)}
              placeholder="Provide notice instructions, deadlines, or meeting links..."
              className="w-full border border-[#6B7280] rounded-lg bg-[#FAFAFA] text-xs p-3 text-[#0A0A0A] focus:outline-none focus:ring-1 focus:ring-[#0A0A0A]"
            />
          </div>

          {/* Toggles: Important, Expiry (Pin is omitted for Faculty) */}
          <div className="p-3.5 bg-[#FAFAFA] border border-[#E5E7EB] rounded-xl space-y-3">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={ancIsImportant}
                onChange={e => setAncIsImportant(e.target.checked)}
                className="w-4 h-4 rounded text-[#0A0A0A] border-[#6B7280] focus:ring-[#0A0A0A]"
              />
              <span className="font-medium text-xs text-[#0A0A0A]">Mark as Important notice</span>
            </label>

            <div className="border-t border-[#E5E7EB] pt-2.5">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={ancHasExpiry}
                  onChange={e => {
                    setAncHasExpiry(e.target.checked);
                    if (!e.target.checked) setAncExpiresAt('');
                  }}
                  className="w-4 h-4 rounded text-[#0A0A0A] border-[#6B7280] focus:ring-[#0A0A0A]"
                />
                <span className="font-medium text-xs text-[#0A0A0A]">Optional expiry date</span>
              </label>

              {ancHasExpiry && (
                <div className="mt-2 pl-6">
                  <input
                    type="date"
                    required={ancHasExpiry}
                    value={ancExpiresAt}
                    onChange={e => setAncExpiresAt(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="text-xs border border-[#6B7280] rounded-lg bg-white px-3 py-1.5 text-[#0A0A0A]"
                  />
                </div>
              )}
            </div>
          </div>

          {/* LIVE PREVIEW CONTAINER */}
          <div className="border border-[#E5E7EB] rounded-xl p-4 bg-white space-y-2">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#6B7280]">Live preview</span>
            <div className="border-l-2 border-[#0A0A0A] pl-3 py-1 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                {ancIsImportant && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                    Important
                  </span>
                )}
                <span className="text-[11px] text-[#6B7280]">{ancCategory}</span>
              </div>
              <h4 className="text-xs font-semibold text-[#0A0A0A] line-clamp-1">
                {ancTitle || 'Notice title will appear here'}
              </h4>
              <p className="text-xs text-[#4B5563] line-clamp-2 leading-relaxed">
                {ancContent || 'Notice preview description will appear here as you type...'}
              </p>
              <div className="text-[11px] text-[#9CA3AF] pt-1">
                Posted by {faculty.name} · Just now
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E5E7EB]">
            <button
              type="button"
              disabled={isSubmittingAnc}
              onClick={() => setShowAncModal(false)}
              className="px-3.5 py-2 border border-[#6B7280] hover:bg-[#FAFAFA] text-[#0A0A0A] text-xs font-medium rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmittingAnc}
              className="px-4 py-2 bg-[#0A0A0A] hover:bg-[#262626] text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
            >
              {isSubmittingAnc ? 'Saving...' : editingAncId ? 'Save changes' : 'Publish notice'}
            </button>
          </div>
        </form>
      </Modal>

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
                  setPendingChatUserId(u.id);
                  setActiveTab('messaging');
                }}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const FacultyDashboard: React.FC<FacultyDashboardProps> = props => {
  const { currentUser } = useAuth();
  if (!currentUser) return null;
  return <FacultyDashboardContent {...props} faculty={currentUser as FacultyProfile} />;
};

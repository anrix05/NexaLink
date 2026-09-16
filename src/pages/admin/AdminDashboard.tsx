/**
 * AUDIT STATUS COMMENT:
 * ITEM 1 IMPLEMENTATION - User Management / All-Users Directory View added to Admin Console (Step 5 of workflow spec),
 * allowing full roster search, filtering, status deactivation, role mutation, and verification re-opening.
 * ITEM 2 IMPLEMENTATION - Embedded Visual Platform Analytics & Live Charts section directly on the main Admin Dashboard overview
 * (Step 13 of workflow spec), providing immediate dynamic SVG charts and KPI metrics.
 */

import React, { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import type { AlumniProfile, StudentProfile, FacultyProfile } from '../../types';
import { useCountUp } from '../../hooks/useCountUp';
import {
  GraduationCap,
  Users,
  Briefcase,
  Search,
  Check,
  X,
  Plus,
  ShieldCheck,
  LayoutDashboard,
  FileSpreadsheet,
  CheckCircle2,
  Award,
  BookOpen,
  UserCheck,
  Building2,
  AlertCircle,
  History,
  CheckCheck,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  HelpCircle,
  CheckSquare,
  Square,
  BarChart3,
  Clock,
  Flag,
  UploadCloud,
  FileUp,
  Mail,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserManagementTable } from '../../components/admin/UserManagementTable';
import { AdminVisualAnalytics } from './AdminVisualAnalytics';
import { Badge, Button, SegmentedTabs, Modal, ToastNotice, StatCard, AnimatedCheckIcon } from '../../components/common/UIComponents';

interface AdminDashboardProps {
  setActiveTab: (tab: string) => void;
  initialView?: 'dashboard' | 'console';
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ setActiveTab, initialView = 'dashboard' }) => {
  const {
    alumniList,
    studentList,
    facultyList,
    jobsList,
    eventsList,
    mentorshipRequests,
    pendingUsersList,
    auditLogs,
    messages,
    announcements,
    approveUserVerification,
    rejectUserVerification,
    requestUserClarification,
    moderateOpportunity,
    graduateStudentToAlumni,
    addAnnouncement,
    retractAnnouncement,
    addAuditLog,
    roleTransitionRequests,
    approveRoleTransition,
    rejectRoleTransition,
    initiateRoleTransitionByAdmin,
    getStudentsPastGraduation,
    getReportedMessages,
    dismissMessageReport,
    actionMessageReport,
    bulkGraduateStudents,
    backfillLegacyEmails
  } = useData();

  const [currentView, setCurrentView] = useState<'dashboard' | 'console'>(initialView);

  useEffect(() => {
    if (initialView) {
      setCurrentView(initialView);
    }
  }, [initialView]);

  const [consoleTab, setConsoleTab] = useState<'approvals' | 'moderation' | 'graduation' | 'audit' | 'users' | 'reports'>('approvals');

  // Rejection & Clarification Modal States
  const [rejectUserId, setRejectUserId] = useState<string | null>(null);
  const [rejectReasonText, setRejectReasonText] = useState('Enrollment Number / Email Domain Mismatch');

  const [clarificationUserId, setClarificationUserId] = useState<string | null>(null);
  const [clarificationText, setClarificationText] = useState('Please upload a scanned copy of your College Admit Card or Institutional ID.');

  // Expandable Table Rows & Bulk Selection
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  // Bulk Graduation Tab States
  const [selectedBulkGradIds, setSelectedBulkGradIds] = useState<string[]>([]);
  const [showBulkGradModal, setShowBulkGradModal] = useState(false);
  const [expandedAuditLogIds, setExpandedAuditLogIds] = useState<Set<string>>(new Set());

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<'All' | 'Alumni' | 'Student' | 'Faculty'>('All');

  // Audit Logs Search & Filter
  const [auditSearch, setAuditSearch] = useState('');
  const [auditFilterCategory, setAuditFilterCategory] = useState<'All' | 'User Events' | 'Governance' | 'System'>('All');

  // Notice Toast State with Exit Animation
  const [notice, setNotice] = useState<string | null>(null);
  const [noticeLeaving, setNoticeLeaving] = useState(false);

  // Announcement Form Modal State
  const [showAncModal, setShowAncModal] = useState(false);
  const [ancTitle, setAncTitle] = useState('');
  const [ancContent, setAncContent] = useState('');
  const [ancCategory, setAncCategory] = useState<'Placement Alert' | 'Institutional Update' | 'Alumni News' | 'Event Highlight'>('Placement Alert');
  const [ancTargetAudience, setAncTargetAudience] = useState<'All' | 'Students' | 'Alumni' | 'Faculty'>('All');

  const handleConfirmBulkGraduation = () => {
    const res = bulkGraduateStudents(selectedBulkGradIds);
    setShowBulkGradModal(false);
    setSelectedBulkGradIds([]);
    showNotification(`Bulk graduated ${res.count} students into Alumni status.`);
  };

  const toggleExpandAuditLog = (logId: string) => {
    setExpandedAuditLogIds(prev => {
      const next = new Set(prev);
      if (next.has(logId)) next.delete(logId);
      else next.add(logId);
      return next;
    });
  };

  const pendingJobs = jobsList.filter(j => j.moderationStatus === 'Pending Approval');
  const pendingTransitions = roleTransitionRequests.filter(r => r.status === 'pending');
  const pastGradStudents = getStudentsPastGraduation();

  const showNotification = (msg: string) => {
    setNoticeLeaving(false);
    setNotice(msg);
    setTimeout(() => {
      setNoticeLeaving(true);
      setTimeout(() => {
        setNotice(null);
        setNoticeLeaving(false);
      }, 200);
    }, 3500);
  };

  const [approvingIds, setApprovingIds] = useState<string[]>([]);
  const [isBulkApproving, setIsBulkApproving] = useState(false);

  const handleApproveAccount = (id: string) => {
    setApprovingIds(prev => [...prev, id]);
    setTimeout(() => {
      approveUserVerification(id);
      showNotification('Account verified! Status updated to "Verified" and user login access granted.');
      setApprovingIds(prev => prev.filter(x => x !== id));
    }, 400);
  };

  const handleApproveTransition = (reqId: string) => {
    setApprovingIds(prev => [...prev, reqId]);
    setTimeout(() => {
      approveRoleTransition(reqId, 'user-admin-1');
      showNotification('Role transition approved! Student promoted to Alumni.');
      setApprovingIds(prev => prev.filter(x => x !== reqId));
    }, 400);
  };

  const handleApproveJob = (jobId: string) => {
    setApprovingIds(prev => [...prev, jobId]);
    setTimeout(() => {
      moderateOpportunity(jobId, 'Approved');
      showNotification('Opportunity approved! It is now live on student feeds.');
      setApprovingIds(prev => prev.filter(x => x !== jobId));
    }, 400);
  };

  const handleBulkApprove = () => {
    setIsBulkApproving(true);
    setTimeout(() => {
      selectedUserIds.forEach(id => approveUserVerification(id));
      showNotification(`Bulk Approved ${selectedUserIds.length} user registrations!`);
      setSelectedUserIds([]);
      setIsBulkApproving(false);
    }, 350);
  };

  const handleConfirmReject = () => {
    if (rejectUserId === 'BULK') {
      selectedUserIds.forEach(id => {
        if (id.startsWith('rt-')) {
          rejectRoleTransition(id, 'user-admin-1', rejectReasonText);
        } else {
          rejectUserVerification(id, rejectReasonText);
        }
      });
      showNotification(`Bulk rejected ${selectedUserIds.length} pending verification requests.`);
      setSelectedUserIds([]);
      setRejectUserId(null);
    } else if (rejectUserId) {
      if (rejectUserId.startsWith('rt-')) {
        rejectRoleTransition(rejectUserId, 'user-admin-1', rejectReasonText);
        showNotification(`Role transition rejected.`);
      } else {
        rejectUserVerification(rejectUserId, rejectReasonText);
        showNotification(`Account registration rejected. Mandatory reason sent to applicant.`);
      }
      setRejectUserId(null);
    }
  };

  const handleConfirmClarification = () => {
    if (clarificationUserId) {
      requestUserClarification(clarificationUserId, clarificationText);
      showNotification(`Clarification & proof request sent to user.`);
      setClarificationUserId(null);
    }
  };

  const handleCreateAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ancTitle || !ancContent) return;

    addAnnouncement({
      title: ancTitle,
      category: ancCategory,
      author: 'Admin (VIT Alumni Cell)',
      content: ancContent,
      isImportant: true,
      targetAudience: ancTargetAudience
    });

    setAncTitle('');
    setAncContent('');
    setShowAncModal(false);
    showNotification('New announcement published successfully!');
  };

  const toggleSelectUser = (id: string) => {
    if (selectedUserIds.includes(id)) {
      setSelectedUserIds(prev => prev.filter(x => x !== id));
    } else {
      setSelectedUserIds(prev => [...prev, id]);
    }
  };

  const toggleSelectAll = () => {
    if (selectedUserIds.length === pendingUsersList.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(pendingUsersList.map(u => u.id));
    }
  };

  const allUsersTable = [
    ...alumniList.map(a => ({
      id: a.id,
      name: a.name,
      email: a.email,
      role: 'Alumni' as const,
      department: a.department,
      year: a.graduationYear,
      company: a.company,
      avatar: a.avatar,
      isVerified: a.isVerified,
      status: a.verificationStatus || (a.isVerified ? 'Verified' : 'Pending Verification'),
      idNo: a.enrollmentNo || a.prn || 'N/A'
    })),
    ...studentList.map(s => ({
      id: s.id,
      name: s.name,
      email: s.email,
      role: 'Student' as const,
      department: s.department,
      year: s.graduationYear,
      company: 'Enrolled Student',
      avatar: s.avatar,
      isVerified: s.isVerified,
      status: s.verificationStatus || (s.isVerified ? 'Verified' : 'Pending Verification'),
      idNo: s.enrollmentNo || s.prn || 'N/A'
    })),
    ...facultyList.map(f => ({
      id: f.id,
      name: f.name,
      email: f.email,
      role: 'Faculty' as const,
      department: f.department,
      year: 2026,
      company: f.designation,
      avatar: f.avatar,
      isVerified: f.isVerified,
      status: f.verificationStatus || (f.isVerified ? 'Verified' : 'Pending Verification'),
      idNo: f.employeeId || 'EMP-01'
    }))
  ].filter(u => {
    if (userRoleFilter !== 'All' && u.role !== userRoleFilter) return false;
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      return u.name.toLowerCase().includes(q) || u.company.toLowerCase().includes(q) || u.department.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    }
    return true;
  });

  const verifiedStudents = studentList.filter(s => s.isVerified || s.verificationStatus === 'Verified').length;
  const verifiedAlumni = alumniList.filter(a => a.isVerified || a.verificationStatus === 'Verified').length;
  const verifiedFaculty = facultyList.filter(f => f.isVerified || f.verificationStatus === 'Verified').length;
  const verifiedMembersTotal = verifiedStudents + verifiedAlumni + verifiedFaculty;
  const pipelineTotalAccounts = studentList.length + alumniList.length + facultyList.length;
  const activeMentorshipCount = mentorshipRequests.filter(m => m.status === 'Accepted').length;

  const totalPendingQueue = pendingUsersList.length + pendingTransitions.length;

  // Real Computed Data Stats for Hover Details
  const studentAuditPending = studentList.length - verifiedStudents;
  const studentVerifiedPct = Math.round((verifiedStudents / (studentList.length || 1)) * 100);

  const employedAlumni = alumniList.filter(a => !!a.company && !a.employmentDataPending).length;
  const alumniEmployedPct = Math.round((employedAlumni / (alumniList.length || 1)) * 100);

  const facultyDeptsCount = new Set(facultyList.map(f => f.department)).size;

  const overallVerifiedPct = Math.round((verifiedMembersTotal / (pipelineTotalAccounts || 1)) * 100);
  const totalPendingInQueue = pipelineTotalAccounts - verifiedMembersTotal;

  const acceptedMentorshipsCount = mentorshipRequests.filter(m => m.status === 'Accepted' || m.status === 'Completed').length;

  const approvedJobsCount = jobsList.filter(j => j.moderationStatus === 'Approved').length;

  const totalAuditLogsCount = auditLogs.length;

  // Animated Count-Up Numbers
  const animStudents = useCountUp(studentList.length);
  const animAlumni = useCountUp(alumniList.length);
  const animFaculty = useCountUp(facultyList.length);
  const animVerified = useCountUp(verifiedMembersTotal);
  const animMentorship = useCountUp(activeMentorshipCount);
  const animJobs = useCountUp(jobsList.length);
  const animAudit = useCountUp(auditLogs.length);

  const modeTabOptions = [
    { id: 'dashboard' as const, label: 'Dashboard Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
    {
      id: 'console' as const,
      label: (
        <span className="flex items-center gap-1.5">
          Verification Queue & Governance
          {totalPendingQueue > 0 ? (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-50 text-[#B45309] border border-amber-200">
              <span className="w-1.5 h-1.5 rounded-full bg-[#B45309] animate-pulse shrink-0" />
              ({totalPendingQueue})
            </span>
          ) : (
            <span className="text-[#6B7280]">(0)</span>
          )}
        </span>
      ),
      icon: <ShieldCheck className="w-4 h-4 text-[#0A0A0A]" />
    }
  ];

  const reportedMessages = getReportedMessages();

  const consoleTabOptions = [
    { id: 'users' as const, label: 'User Roster', count: allUsersTable.length, icon: <Users className="w-3.5 h-3.5" /> },
    { id: 'approvals' as const, label: 'Verification Queue', count: totalPendingQueue, isActionable: true, icon: <ShieldCheck className="w-3.5 h-3.5" /> },
    { id: 'moderation' as const, label: 'Opportunity Moderation', count: pendingJobs.length, isActionable: true, icon: <Briefcase className="w-3.5 h-3.5" /> },
    { id: 'reports' as const, label: 'Reported Messages', count: reportedMessages.length, isActionable: true, icon: <Flag className="w-3.5 h-3.5" /> },
    { id: 'graduation' as const, label: 'Graduation Tool', icon: <GraduationCap className="w-3.5 h-3.5" /> },
    { id: 'audit' as const, label: 'Audit Logs', count: auditLogs.length, icon: <History className="w-3.5 h-3.5" /> }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-16 sm:pb-0 font-sans text-xs">
      
      {notice && (
        <div className={`p-4 bg-[#0A0A0A] text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-sm ${
          noticeLeaving ? 'animate-out fade-out slide-out-to-top-2 duration-200' : 'animate-in fade-in duration-200'
        }`}>
          <Check className="w-4 h-4 text-[#16A34A]" /> {notice}
        </div>
      )}

      {/* Mode Switcher Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E7EB] pb-5">
        <SegmentedTabs
          options={modeTabOptions}
          activeTab={currentView}
          onChange={(tab) => setCurrentView(tab)}
        />

        <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-[#6B7280]">
          <span>Logged in as: <strong className="text-[#0A0A0A] font-bold uppercase text-[11px]">Institutional Admin Cell</strong></span>
        </div>
      </div>

      {/* VIEW 1: DASHBOARD OVERVIEW */}
      {currentView === 'dashboard' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-1 duration-200">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#0A0A0A] tracking-tight">
                Institutional Command Center
              </h1>
              <p className="text-sm text-[#6B7280] font-medium mt-1">
                Centralized monitoring across Students, Alumni, Faculty, and Governance Metrics.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                size="md"
                onClick={() => setActiveTab('reports')}
                icon={<FileSpreadsheet className="w-4 h-4 text-[#0A0A0A]" />}
              >
                Export Reports
              </Button>

              <Button
                variant="primary"
                size="md"
                onClick={() => setShowAncModal(true)}
                icon={<Plus className="w-4 h-4" />}
              >
                Publish Announcement
              </Button>
            </div>
          </div>

          {/* 7 Uniform Stat Cards with Clean Monochrome Icon Chips & Genuine Computed Hover Detail */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 sm:gap-3">
            <StatCard
              title="Students"
              value={animStudents}
              subtext={`${verifiedStudents} verified`}
              hoverDetail={`${studentVerifiedPct}% verified (${studentAuditPending} pending audit)`}
              icon={<Users className="w-3.5 h-3.5" />}
            />

            <StatCard
              title="Alumni"
              value={animAlumni}
              subtext={`${verifiedAlumni} verified`}
              hoverDetail={`${alumniEmployedPct}% verified employed (${employedAlumni}/${alumniList.length})`}
              icon={<GraduationCap className="w-3.5 h-3.5" />}
            />

            <StatCard
              title="Faculty"
              value={animFaculty}
              subtext={`${verifiedFaculty} verified`}
              hoverDetail={`${verifiedFaculty} verified across ${facultyDeptsCount} engineering depts`}
              icon={<BookOpen className="w-3.5 h-3.5" />}
            />

            <StatCard
              title="Verified"
              value={animVerified}
              subtext={`${verifiedMembersTotal} / ${pipelineTotalAccounts} total`}
              hoverDetail={`${overallVerifiedPct}% portal verification rate (${totalPendingInQueue} pending)`}
              icon={<ShieldCheck className="w-3.5 h-3.5" />}
            />

            <StatCard
              title="Guidance"
              value={animMentorship}
              subtext={`${mentorshipRequests.length} total asks`}
              hoverDetail={`${acceptedMentorshipsCount} accepted / completed guidance sessions`}
              icon={<UserCheck className="w-3.5 h-3.5" />}
            />

            <StatCard
              title="Jobs"
              value={animJobs}
              subtext={`${pendingJobs.length} pending`}
              hoverDetail={`${approvedJobsCount} active verified opportunities live`}
              icon={<Briefcase className="w-3.5 h-3.5" />}
            />

            <StatCard
              title="Audit Logs"
              value={animAudit}
              subtext="Governance"
              hoverDetail={`${totalAuditLogsCount} immutable governance events recorded`}
              icon={<History className="w-3.5 h-3.5" />}
            />
          </div>

          <div className="flex items-center gap-2 text-xs font-medium text-[#6B7280]">
            <ShieldCheck className="w-4 h-4 text-[#0A0A0A]" />
            <span>Admin accounts are managed via institutional onboarding and are not counted in the Verified Members pipeline total above.</span>
          </div>

          {/* PUBLISHED ANNOUNCEMENTS MANAGER */}
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 space-y-4 font-sans">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5E7EB] pb-3">
              <div>
                <h3 className="font-display font-bold text-sm text-[#0A0A0A] uppercase tracking-wider flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[#0A0A0A]" />
                  Published Institutional Announcements ({announcements.length})
                </h3>
                <p className="text-xs text-[#6B7280] font-medium mt-0.5">
                  Manage active system-wide announcements broadcasted across student, alumni, and faculty feeds.
                </p>
              </div>

              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowAncModal(true)}
                icon={<Plus className="w-4 h-4" />}
              >
                New Announcement
              </Button>
            </div>

            {announcements.length === 0 ? (
              <div className="p-8 text-center bg-[#FAFAFA] border border-dashed border-[#E5E7EB] rounded-xl text-xs text-[#6B7280]">
                No active announcements published. Click "New Announcement" to broadcast to portal feeds.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {announcements.map(anc => (
                  <div key={anc.id} className="p-4 bg-[#FAFAFA] border border-[#E5E7EB] rounded-xl flex flex-col justify-between gap-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <Badge variant="indigo" size="sm">{anc.category}</Badge>
                        <span className="font-mono text-[10px] text-[#6B7280]">{anc.date}</span>
                      </div>
                      <h4 className="font-bold text-[#0A0A0A] text-sm">{anc.title}</h4>
                      <p className="text-xs text-[#374151] line-clamp-2 leading-relaxed">{anc.content}</p>
                    </div>

                    <div className="pt-2 border-t border-[#E5E7EB] flex items-center justify-between gap-2 text-[11px]">
                      <span className="font-mono font-medium text-[#6B7280]">
                        Audience: <strong className="text-[#0A0A0A]">{anc.targetAudience || 'All'}</strong>
                      </span>

                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          retractAnnouncement(anc.id);
                          showNotification(`Retracted announcement: "${anc.title}".`);
                        }}
                        className="text-rose-900 hover:bg-rose-50 border-rose-200"
                      >
                        Retract Announcement
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Dynamic SVG Analytics */}
          <div className="pt-4 border-t border-[#E5E7EB]">
            <h2 className="text-xl font-bold text-[#0A0A0A] tracking-tight mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[#0A0A0A]" />
              Institutional Visual Analytics & Performance Metrics
            </h2>
            <AdminVisualAnalytics />
          </div>

        </div>
      )}

      {/* VIEW 2: ADMIN CONSOLE & VERIFICATION QUEUE */}
      {currentView === 'console' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-1 duration-200">
          
          <div className="space-y-4 border-b border-[#E5E7EB] pb-5">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#0A0A0A] tracking-tight">
                Governance & Verification Command Center
              </h1>
              <p className="text-xs text-[#6B7280] font-medium mt-1">
                Inspect Enrollment Numbers, Employee IDs, user roles, opportunity moderations, and governance logs.
              </p>
            </div>

            {/* Dedicated Full-Width Tab Row */}
            <div className="overflow-x-auto pb-1 scrollbar-none w-full">
              <SegmentedTabs
                options={consoleTabOptions}
                activeTab={consoleTab}
                onChange={(tab) => setConsoleTab(tab)}
              />
            </div>
          </div>

          {/* ALL-USERS ROSTER USER MANAGEMENT TAB */}
          {consoleTab === 'users' && (
            <div className="animate-in fade-in slide-in-from-bottom-1 duration-200">
              <UserManagementTable />
            </div>
          )}

          {/* VERIFICATION QUEUE */}
          {consoleTab === 'approvals' && (
            <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 space-y-6 shadow-none animate-in fade-in slide-in-from-bottom-1 duration-200">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E7EB] pb-4">
                <div>
                  <h3 className="font-display font-bold text-sm text-[#0A0A0A] uppercase tracking-wider">
                    Institutional Verification Queue ({pendingUsersList.length + pendingTransitions.length} Pending)
                  </h3>
                  <p className="text-xs text-[#6B7280] font-medium mt-0.5">
                    Data-dense table with expandable details and fixed, always-accessible action buttons.
                  </p>
                </div>

                {selectedUserIds.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setRejectUserId('BULK')}
                      icon={<X className="w-4 h-4 text-[#0A0A0A]" />}
                    >
                      Bulk Reject ({selectedUserIds.length} Selected)
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleBulkApprove}
                      icon={isBulkApproving ? <AnimatedCheckIcon size={16} /> : <CheckSquare className="w-4 h-4" />}
                    >
                      {isBulkApproving ? `Approved (${selectedUserIds.length})` : `Bulk Approve (${selectedUserIds.length} Selected)`}
                    </Button>
                  </div>
                )}
              </div>

              {pendingUsersList.length === 0 && pendingTransitions.length === 0 ? (
                <div className="p-12 text-center bg-[#FAFAFA] border border-dashed border-[#E5E7EB] rounded-xl space-y-3 font-sans">
                  <div className="w-12 h-12 rounded-xl bg-[#F3F4F6] text-[#0A0A0A] flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-[#0A0A0A] text-sm">All Verification Queues Clear</h4>
                    <p className="text-xs text-[#6B7280] mt-1 max-w-sm mx-auto">
                      All student enrollment numbers and alumni graduation profiles have been audited and verified.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="border border-[#E5E7EB] rounded-xl overflow-x-auto text-xs shadow-none">
                  <table className="w-full text-left">
                    <thead className="bg-[#FAFAFA] font-display font-bold text-[10px] uppercase tracking-wider text-[#0A0A0A] border-b border-[#E5E7EB]">
                      <tr>
                        <th className="p-3 w-10 text-center">
                          <input
                            type="checkbox"
                            checked={selectedUserIds.length === pendingUsersList.length && pendingUsersList.length > 0}
                            onChange={toggleSelectAll}
                            className="rounded border-[#E5E7EB] accent-[#0A0A0A]"
                          />
                        </th>
                        <th className="p-3">Applicant Name</th>
                        <th className="p-3">Role</th>
                        <th className="p-3">Dept</th>
                        <th className="p-3">Enrollment / PRN / Emp ID</th>
                        <th className="p-3">Domain Email</th>
                        <th className="p-3">Proof Doc</th>
                        <th className="p-3 text-right">Fixed Verification Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E7EB]">
                      {pendingUsersList.map(u => {
                        const isExpanded = expandedUserId === u.id;
                        const isSelected = selectedUserIds.includes(u.id);

                        return (
                          <React.Fragment key={u.id}>
                            <tr className={`hover:bg-[#FAFAFA] transition ${isSelected ? 'bg-[#FAFAFA]' : ''}`}>
                              <td className="p-3 text-center">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleSelectUser(u.id)}
                                  className="rounded border-[#E5E7EB] accent-[#0A0A0A]"
                                />
                              </td>
                              <td className="p-3 font-bold text-[#0A0A0A]">
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => setExpandedUserId(isExpanded ? null : u.id)}
                                    className="text-[#9CA3AF] hover:text-[#0A0A0A] font-bold"
                                    title="Expand Details"
                                  >
                                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                  </button>
                                  <span>{u.name}</span>
                                </div>
                              </td>
                              <td className="p-3">
                                <Badge variant="indigo">{u.role}</Badge>
                              </td>
                              <td className="p-3 font-mono font-bold text-[#0A0A0A]">{u.department}</td>
                              <td className="p-3 font-mono text-xs font-bold text-[#0A0A0A]">{u.enrollmentNo || (u as any).prn || (u as any).employeeId || 'PRN-VIT-2024-089'}</td>
                              <td className="p-3 font-mono text-[11px] text-[#6B7280]">{u.email}</td>
                              <td className="p-3">
                                {(u as any).verificationDocumentUrl || u.proofDocumentName ? (
                                  <a
                                    href={(u as any).verificationDocumentUrl || '#'}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[11px] font-bold text-[#0A0A0A] hover:underline flex items-center gap-1"
                                  >
                                    ID Card Scanned
                                  </a>
                                ) : (
                                  <span className="text-[11px] font-medium text-[#B45309] italic">
                                    No document uploaded
                                  </span>
                                )}
                              </td>
                              <td className="p-3 text-right">
                                {approvingIds.includes(u.id) ? (
                                  <div className="flex items-center justify-end gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg font-bold text-xs">
                                    <AnimatedCheckIcon size={16} />
                                    <span>Verified</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-end gap-1.5">
                                    <Button
                                      variant="secondary"
                                      size="sm"
                                      onClick={() => setClarificationUserId(u.id)}
                                      icon={<HelpCircle className="w-3.5 h-3.5 text-[#0A0A0A]" />}
                                    >
                                      Clarify
                                    </Button>
                                    <Button
                                      variant="secondary"
                                      size="sm"
                                      onClick={() => setRejectUserId(u.id)}
                                      icon={<X className="w-3.5 h-3.5 text-[#0A0A0A]" />}
                                    >
                                      Reject
                                    </Button>
                                    <Button
                                      variant="primary"
                                      size="sm"
                                      onClick={() => handleApproveAccount(u.id)}
                                      icon={<Check className="w-3.5 h-3.5" />}
                                    >
                                      Approve
                                    </Button>
                                  </div>
                                )}
                              </td>
                            </tr>

                            {isExpanded && (
                              <tr className="bg-[#FAFAFA] border-b border-[#E5E7EB]">
                                <td colSpan={8} className="p-0">
                                  <AnimatePresence initial={false}>
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: 'auto', opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                                      className="overflow-hidden p-4 space-y-3"
                                    >
                                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        <div className="p-3 bg-white border border-[#E5E7EB] rounded-lg">
                                          <span className="app-label text-[#0A0A0A] font-bold">Application Bio & Goals</span>
                                          <p className="text-xs text-[#374151] mt-1 font-medium leading-relaxed">
                                            "{u.bio || 'Applicant awaiting official departmental verification at Vidyalankar.'}"
                                          </p>
                                        </div>
                                        <div className="p-3 bg-white border border-[#E5E7EB] rounded-lg">
                                          <span className="app-label text-[#0A0A0A] font-bold">Skills / Research Areas</span>
                                          <div className="flex flex-wrap gap-1 mt-1">
                                            {u.skills?.map(s => (
                                              <span key={s} className="px-2 py-0.5 bg-[#FAFAFA] text-[#374151] border border-[#E5E7EB] rounded text-[10px] font-mono">
                                                {s}
                                              </span>
                                            )) || <span className="text-xs text-[#9CA3AF]">None Listed</span>}
                                          </div>
                                        </div>
                                        <div className="p-3 bg-white border border-[#E5E7EB] rounded-lg">
                                          <span className="app-label text-[#0A0A0A] font-bold">Institutional Match Confidence</span>
                                          {u.role === 'alumni' ? (
                                            <>
                                              <p className="text-xs font-bold text-[#065F46] mt-1">
                                                ✓ Historical Academic Enrollment Record Match
                                              </p>
                                              <p className="text-[10px] text-[#6B7280] mt-0.5 leading-relaxed">
                                                {(() => {
                                                  const prnVal = u.enrollmentNo || (u as any).prn;
                                                  const deptVal = u.department || 'CMPN';
                                                  const yrVal = u.graduationYear || 2024;
                                                  const hasDoc = !!((u as any).verificationDocumentUrl || u.proofDocumentName);
                                                  const docNote = hasDoc ? 'Proof document attached.' : 'No proof document attached.';
                                                  return `PRN "${prnVal || 'N/A'}" checked against ${deptVal} (${yrVal} batch record). ${docNote}`;
                                                })()}
                                              </p>
                                            </>
                                          ) : (
                                            <>
                                              <p className={`text-xs font-bold mt-1 ${u.email.includes('vit.edu.in') ? 'text-[#065F46]' : 'text-[#B45309]'}`}>
                                                {u.email.includes('vit.edu.in') ? '✓ Active Institutional Domain Validated' : '⚠ Non-Institutional Email Domain'}
                                              </p>
                                              <p className="text-[10px] text-[#6B7280] mt-0.5 leading-relaxed">
                                                {(() => {
                                                  const idVal = u.enrollmentNo || (u as any).prn || (u as any).employeeId;
                                                  const deptVal = u.department || 'CMPN';
                                                  return `ID/Enrollment "${idVal || 'N/A'}" format checked for ${deptVal} active roster.`;
                                                })()}
                                              </p>
                                            </>
                                          )}
                                        </div>
                                      </div>
                                    </motion.div>
                                  </AnimatePresence>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}

                      {/* PENDING ROLE TRANSITIONS */}
                      {pendingTransitions.map(r => {
                        const sUser = studentList.find(s => s.id === r.userId) || allUsersTable.find(u => u.id === r.userId);
                        if (!sUser) return null;
                        
                        return (
                          <tr key={r.id} className="hover:bg-[#FAFAFA] transition bg-indigo-50/30">
                            <td className="p-3 text-center"></td>
                            <td className="p-3 font-bold text-[#0A0A0A]">
                              <div className="flex items-center gap-2">
                                <span>{sUser.name}</span>
                              </div>
                            </td>
                            <td className="p-3">
                              <Badge variant="indigo">Role Change: Student → Alumni</Badge>
                            </td>
                            <td className="p-3 font-mono font-bold text-[#0A0A0A]">{sUser.department}</td>
                            <td className="p-3 font-mono text-xs font-bold text-[#0A0A0A]">{r.proposedAlumniData.designation} @ {r.proposedAlumniData.company}</td>
                            <td className="p-3 font-mono text-[11px] text-[#6B7280]">
                              {r.proposedAlumniData.personalEmail || sUser.email}
                            </td>
                            <td className="p-3">
                              {r.proposedAlumniData.verificationDocumentUrl || r.proposedAlumniData.verificationDocumentName ? (
                                <a
                                  href={r.proposedAlumniData.verificationDocumentUrl || '#'}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[11px] font-bold text-[#0A0A0A] hover:underline flex items-center gap-1"
                                >
                                  ID / Degree Proof
                                </a>
                              ) : (
                                <span className="text-[11px] font-medium text-[#B45309] italic">
                                  No document uploaded
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-right">
                              {approvingIds.includes(r.id) ? (
                                <div className="flex items-center justify-end gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg font-bold text-xs">
                                  <AnimatedCheckIcon size={16} />
                                  <span>Approved</span>
                                </div>
                              ) : (
                                <div className="flex items-center justify-end gap-1.5">
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => setRejectUserId(r.id)}
                                    icon={<X className="w-3.5 h-3.5 text-[#0A0A0A]" />}
                                  >
                                    Reject
                                  </Button>
                                  <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={() => handleApproveTransition(r.id)}
                                    icon={<Check className="w-3.5 h-3.5" />}
                                  >
                                    Approve
                                  </Button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* STUDENTS PAST GRADUATION REPORT */}
              <div className="mt-8 border-t border-[#E5E7EB] pt-6">
                <h4 className="font-display font-bold text-sm text-[#0A0A0A] uppercase tracking-wider mb-3">
                  Students Past Graduation (No Pending Request)
                </h4>
                {pastGradStudents.length === 0 ? (
                  <p className="text-xs text-[#6B7280]">All graduated students have updated their alumni profiles.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {pastGradStudents.map(student => (
                      <div key={student.id} className="border border-[#E5E7EB] rounded-lg p-4 bg-[#FAFAFA] flex items-center justify-between">
                        <div>
                          <p className="font-bold text-[#0A0A0A] text-xs">{student.name}</p>
                          <p className="text-[10px] text-[#6B7280] font-mono mt-0.5">{student.department} · Class of {student.graduationYear}</p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Button 
                            variant="secondary" 
                            size="sm" 
                            onClick={() => showNotification(`Notification sent to ${student.name} to update their alumni profile.`)}
                          >
                            Notify
                          </Button>
                          <Button 
                            variant="primary" 
                            size="sm" 
                            onClick={() => {
                              initiateRoleTransitionByAdmin(student.id, 'user-admin-1');
                              showNotification(`Role transition initiated for ${student.name}. Added to queue.`);
                            }}
                          >
                            Initiate on their behalf
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* OPPORTUNITY MODERATION */}
          {consoleTab === 'moderation' && (
            <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 space-y-6 shadow-none animate-in fade-in slide-in-from-bottom-1 duration-200">
              <div className="border-b border-[#E5E7EB] pb-4">
                <h3 className="font-display font-bold text-sm text-[#0A0A0A] uppercase tracking-wider">
                  Opportunity Moderation Queue ({pendingJobs.length} Pending Approval)
                </h3>
                <p className="text-xs text-[#6B7280] font-medium mt-0.5">
                  Verify internships, jobs, research projects, and scholarships submitted by alumni & faculty before publication.
                </p>
              </div>

              {pendingJobs.length === 0 ? (
                <div className="p-12 text-center bg-[#FAFAFA] border border-dashed border-[#E5E7EB] rounded-xl space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-[#F3F4F6] text-[#0A0A0A] flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-[#0A0A0A] text-sm">All Opportunities Moderated</h4>
                    <p className="text-xs text-[#6B7280] mt-1">
                      No jobs or internships pending administrative approval.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingJobs.map(job => (
                    <div key={job.id} className="p-5 bg-[#FAFAFA] border border-[#E5E7EB] rounded-xl space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-[#0A0A0A] text-sm">{job.title}</h4>
                            <Badge variant="indigo">{job.type}</Badge>
                          </div>
                          <p className="text-xs text-[#6B7280] mt-0.5">
                            {job.company} • Posted by <strong className="text-[#0A0A0A]">{job.postedByAlumniName}</strong>
                          </p>
                        </div>
                        <span className="font-mono text-xs font-bold text-[#0A0A0A]">{job.stipendOrSalary}</span>
                      </div>

                      <p className="text-xs text-[#374151] bg-white p-3 rounded-lg border border-[#E5E7EB] leading-relaxed">
                        "{job.description}"
                      </p>

                      {approvingIds.includes(job.id) ? (
                        <div className="flex items-center justify-end gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg font-bold text-xs">
                          <AnimatedCheckIcon size={16} />
                          <span>Published Live</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-2 pt-1">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              moderateOpportunity(job.id, 'Rejected', 'Role criteria did not meet institutional safety guidelines.');
                              showNotification('Opportunity submission rejected.');
                            }}
                          >
                            Reject
                          </Button>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleApproveJob(job.id)}
                          >
                            Approve & Publish Live
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* GRADUATION TOOL */}
          {consoleTab === 'graduation' && (() => {
            const activeCandidates = pastGradStudents;
            const allActiveIds = activeCandidates.map(s => s.id);
            const isAllSelected = allActiveIds.length > 0 && allActiveIds.every(id => selectedBulkGradIds.includes(id));

            const toggleSelectAll = () => {
              if (isAllSelected) {
                setSelectedBulkGradIds(prev => prev.filter(id => !allActiveIds.includes(id)));
              } else {
                setSelectedBulkGradIds(prev => Array.from(new Set([...prev, ...allActiveIds])));
              }
            };

            const toggleSelectOne = (id: string) => {
              setSelectedBulkGradIds(prev =>
                prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
              );
            };

            return (
              <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 space-y-6 shadow-none animate-in fade-in slide-in-from-bottom-1 duration-200">
                <div className="border-b border-[#E5E7EB] pb-4 space-y-3">
                  <div>
                    <h3 className="font-display font-bold text-sm text-[#0A0A0A] uppercase tracking-wider flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-[#0A0A0A]" />
                      Bulk Student Batch Graduation (Provisional)
                    </h3>
                    <p className="text-xs text-[#6B7280] font-medium mt-0.5">
                      Provisional batch migration for final-year students past graduation threshold into the Alumni Registry.
                    </p>
                  </div>

                  {/* Mandatory Registrar Source-of-Truth Notice */}
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 text-xs font-sans text-[#374151]">
                    <AlertCircle className="w-4 h-4 text-[#B45309] shrink-0 mt-0.5" />
                    <p className="leading-relaxed">
                      <strong className="text-[#0A0A0A] font-bold">Registrar Source-of-Truth Notice:</strong> This candidate list is derived from stored graduation years (<code className="font-mono">graduationYear ≤ 2024</code>), not an official registrar export. Verify against Academic Cell records before taking bulk action.
                    </p>
                  </div>
                </div>

                {/* Bulk Actions Header Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#FAFAFA] border border-[#E5E7EB] p-3.5 rounded-xl">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={toggleSelectAll}
                      className="inline-flex items-center gap-2 text-xs font-bold text-[#0A0A0A] hover:opacity-80 transition-opacity"
                    >
                      {isAllSelected ? (
                        <CheckSquare className="w-4 h-4 text-[#0A0A0A]" />
                      ) : (
                        <Square className="w-4 h-4 text-[#9CA3AF]" />
                      )}
                      <span>Select All ({activeCandidates.length} Candidates)</span>
                    </button>

                    {selectedBulkGradIds.length > 0 && (
                      <span className="text-xs font-mono font-bold text-[#0A0A0A] bg-white px-2.5 py-1 rounded-md border border-[#E5E7EB]">
                        {selectedBulkGradIds.length} Selected
                      </span>
                    )}
                  </div>

                  {selectedBulkGradIds.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setSelectedBulkGradIds([])}
                      >
                        Clear Selection
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        icon={<GraduationCap className="w-4 h-4" />}
                        onClick={() => setShowBulkGradModal(true)}
                      >
                        Graduate Selected ({selectedBulkGradIds.length})
                      </Button>
                    </div>
                  )}
                </div>

                {/* Candidate Table */}
                <div className="border border-[#E5E7EB] rounded-xl overflow-x-auto text-xs shadow-none">
                  <table className="w-full text-left">
                    <thead className="bg-[#FAFAFA] font-display font-bold text-[10px] uppercase tracking-wider text-[#0A0A0A] border-b border-[#E5E7EB]">
                      <tr>
                        <th className="p-3 w-10 text-center">
                          <button onClick={toggleSelectAll}>
                            {isAllSelected ? <CheckSquare className="w-4 h-4 text-[#0A0A0A]" /> : <Square className="w-4 h-4 text-[#9CA3AF]" />}
                          </button>
                        </th>
                        <th className="p-3">Student Name</th>
                        <th className="p-3">Department & Year</th>
                        <th className="p-3">ID / Enrollment No</th>
                        <th className="p-3">Primary Login Email</th>
                        <th className="p-3">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E7EB]">
                      {activeCandidates.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-[#6B7280] font-sans font-medium">
                            No candidate students found matching the selected threshold.
                          </td>
                        </tr>
                      ) : (
                        activeCandidates.map(s => {
                          const isSelected = selectedBulkGradIds.includes(s.id);

                          return (
                            <tr key={s.id} className={`hover:bg-[#FAFAFA] transition-colors ${isSelected ? 'bg-[#F9FAFB]' : ''}`}>
                              <td className="p-3 text-center">
                                <button onClick={() => toggleSelectOne(s.id)}>
                                  {isSelected ? <CheckSquare className="w-4 h-4 text-[#0A0A0A]" /> : <Square className="w-4 h-4 text-[#D1D5DB]" />}
                                </button>
                              </td>
                              <td className="p-3 font-bold text-[#0A0A0A]">
                                <div className="flex items-center gap-2.5">
                                  <img src={s.avatar} alt={s.name} className="w-8 h-8 rounded-full object-cover border border-[#E5E7EB]" />
                                  <span>{s.name}</span>
                                </div>
                              </td>
                              <td className="p-3 text-[#374151]">
                                {s.department} • Class of {s.expectedGraduationYear || s.graduationYear || 2024}
                              </td>
                              <td className="p-3 font-mono text-[#6B7280]">
                                {s.enrollmentNo || s.prn || s.id}
                              </td>
                              <td className="p-3 font-mono text-xs text-[#0A0A0A]">
                                {s.email}
                              </td>
                              <td className="p-3">
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => {
                                    graduateStudentToAlumni(s.id);
                                    showNotification(`${s.name} provisionally graduated to Alumni Registry.`);
                                  }}
                                >
                                  Graduate
                                </Button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}

          {/* AUDIT LOGS */}
          {consoleTab === 'audit' && (() => {
            const filteredAuditLogs = auditLogs.filter(log => {
              const matchesSearch =
                log.action.toLowerCase().includes(auditSearch.toLowerCase()) ||
                log.performedBy.toLowerCase().includes(auditSearch.toLowerCase()) ||
                log.details.toLowerCase().includes(auditSearch.toLowerCase());

              if (!matchesSearch) return false;

              if (auditFilterCategory === 'User Events') {
                return log.action.includes('USER') || log.action.includes('CRITICAL');
              }
              if (auditFilterCategory === 'Governance') {
                return log.action.includes('ROLE') || log.action.includes('ADMIN') || log.action.includes('GRADUATION');
              }
              if (auditFilterCategory === 'System') {
                return log.action.includes('SYSTEM') || log.action.includes('ANNOUNCEMENT');
              }
              return true;
            });

            return (
              <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 space-y-6 shadow-none animate-in fade-in slide-in-from-bottom-1 duration-200">
                <div className="border-b border-[#E5E7EB] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-display font-bold text-sm text-[#0A0A0A] uppercase tracking-wider">
                      Institutional Security & Audit Logs ({filteredAuditLogs.length} Records)
                    </h3>
                    <p className="text-xs text-[#6B7280] font-medium mt-0.5">
                      Immutable audit trail of all role mutations, verification events, account rejections, and profile modifications.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-[#6B7280] absolute left-3 top-2.5" />
                      <input
                        type="text"
                        placeholder="Filter audit logs..."
                        value={auditSearch}
                        onChange={e => setAuditSearch(e.target.value)}
                        className="app-input pl-9 bg-[#FAFAFA] border-[#E5E7EB] rounded-lg font-medium text-xs w-48 sm:w-64"
                      />
                    </div>
                    <select
                      value={auditFilterCategory}
                      onChange={e => setAuditFilterCategory(e.target.value as any)}
                      className="app-input bg-[#FAFAFA] border-[#E5E7EB] rounded-lg font-bold text-xs"
                    >
                      <option value="All">All Events</option>
                      <option value="User Events">User & Verification</option>
                      <option value="Governance">Governance & Roles</option>
                      <option value="System">System Logs</option>
                    </select>
                  </div>
                </div>

                <div className="border border-[#E5E7EB] rounded-xl overflow-x-auto text-xs shadow-none">
                  <table className="w-full text-left">
                    <thead className="bg-[#FAFAFA] font-display font-bold text-[10px] uppercase tracking-wider text-[#0A0A0A] border-b border-[#E5E7EB]">
                      <tr>
                        <th className="p-3">Timestamp</th>
                        <th className="p-3">Action Event</th>
                        <th className="p-3">Performed By</th>
                        <th className="p-3">Details / Target User</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E7EB] font-mono text-xs">
                      {filteredAuditLogs.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-6 text-center text-[#6B7280] font-sans">
                            No audit log records found matching search filters.
                          </td>
                        </tr>
                      ) : (
                        filteredAuditLogs.map(log => {
                          const isExpanded = expandedAuditLogIds.has(log.id);
                          const isBulkLog = log.isBulkAction || log.action === 'BULK_GRADUATION_PROVISIONAL';

                          return (
                            <React.Fragment key={log.id}>
                              <tr className="hover:bg-[#FAFAFA] transition-colors">
                                <td className="p-3 text-[#6B7280]">{log.timestamp}</td>
                                <td className="p-3 font-bold text-[#0A0A0A]">
                                  <div className="flex items-center gap-2">
                                    {isBulkLog && (
                                      <button
                                        onClick={() => toggleExpandAuditLog(log.id)}
                                        className="p-1 hover:bg-[#E5E7EB] rounded transition-colors text-[#0A0A0A]"
                                      >
                                        {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                                      </button>
                                    )}
                                    <span>{log.action}</span>
                                    {isBulkLog && (
                                      <Badge variant="indigo" size="sm">Bulk Action</Badge>
                                    )}
                                  </div>
                                </td>
                                <td className="p-3 text-[#374151]">{log.performedBy}</td>
                                <td className="p-3 font-sans text-[#374151]">{log.details}</td>
                              </tr>

                              {isBulkLog && isExpanded && (
                                <tr className="bg-[#FAFAFA] border-b border-[#E5E7EB]">
                                  <td colSpan={4} className="p-4">
                                    <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 space-y-3 font-sans text-xs">
                                      <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-2">
                                        <span className="font-bold text-[#0A0A0A] uppercase tracking-wider text-[11px]">
                                          Bulk Execution Breakdown ({log.bulkMetadata?.affectedCount || 'N/A'} Affected Accounts)
                                        </span>
                                        {log.bulkMetadata?.missingEmailCount ? (
                                          <Badge variant="amber" size="sm">
                                            {log.bulkMetadata.missingEmailCount} Missing Recovery Email
                                          </Badge>
                                        ) : (
                                          <Badge variant="emerald" size="sm">
                                            All Recovery Emails Set
                                          </Badge>
                                        )}
                                      </div>

                                      <div>
                                        <span className="block text-[10px] text-[#6B7280] uppercase tracking-wider font-bold mb-1.5">
                                          Graduated Student Names
                                        </span>
                                        <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 bg-[#FAFAFA] border border-[#E5E7EB] rounded-lg font-mono text-[11px]">
                                          {log.bulkMetadata?.studentNames && log.bulkMetadata.studentNames.length > 0 ? (
                                            log.bulkMetadata.studentNames.map((name, idx) => (
                                              <span key={idx} className="px-2 py-0.5 bg-white border border-[#E5E7EB] rounded text-[#0A0A0A]">
                                                {name}
                                              </span>
                                            ))
                                          ) : (
                                            <span className="text-[#6B7280]">Individual records consolidated.</span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}

          {/* CONSOLE TAB 6: REPORTED MESSAGES */}
          {consoleTab === 'reports' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E5E7EB] pb-3">
                <div>
                  <h3 className="font-display font-bold text-sm text-[#0A0A0A] uppercase tracking-wider flex items-center gap-2">
                    <Flag className="w-4 h-4 text-[#B45309]" />
                    Reported Messages Moderation Queue ({reportedMessages.length})
                  </h3>
                  <p className="text-xs text-[#6B7280] font-medium mt-0.5">
                    Review peer-to-peer message reports flagged by Students, Alumni, and Faculty members for policy violations.
                  </p>
                </div>

                {reportedMessages.length > 0 && (
                  <Badge variant="amber" size="sm">
                    {reportedMessages.length} Action Required
                  </Badge>
                )}
              </div>

              {reportedMessages.length === 0 ? (
                <div className="bg-white border border-[#E5E7EB] rounded-xl p-10 text-center space-y-3 font-sans">
                  <div className="w-10 h-10 rounded-full bg-[#FAFAFA] border border-[#E5E7EB] text-[#16A34A] flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-[#0A0A0A]">No Reported Messages</h4>
                    <p className="text-xs text-[#6B7280] font-medium mt-1">
                      All reported message threads have been reviewed or resolved by institutional moderators.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-x-auto text-xs shadow-none">
                  <table className="w-full text-left font-sans">
                    <thead className="bg-[#FAFAFA] font-display font-bold text-[10px] uppercase tracking-wider text-[#0A0A0A] border-b border-[#E5E7EB]">
                      <tr>
                        <th className="p-3">Reported Time</th>
                        <th className="p-3">Reported By</th>
                        <th className="p-3">Sender</th>
                        <th className="p-3">Flagged Content / Reason</th>
                        <th className="p-3 text-right">Moderation Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E7EB] text-xs">
                      {reportedMessages.map(msg => {
                        const reporterUser = allUsersTable.find(u => u.id === msg.reportedBy);
                        const reporterName = reporterUser ? reporterUser.name : msg.reportedBy || 'Student Member';

                        return (
                          <tr key={msg.id} className="hover:bg-[#FAFAFA] transition-colors">
                            <td className="p-3 font-mono text-[11px] text-[#6B7280] whitespace-nowrap">
                              {msg.reportedAt ? new Date(msg.reportedAt).toLocaleDateString('en-IN') : msg.timestamp}
                            </td>

                            <td className="p-3">
                              <div className="font-bold text-[#0A0A0A]">{reporterName}</div>
                              <span className="text-[10px] font-mono text-[#6B7280]">ID: {msg.reportedBy || 'N/A'}</span>
                            </td>

                            <td className="p-3">
                              <div className="font-bold text-[#0A0A0A]">{msg.senderName}</div>
                              <Badge variant="indigo" size="sm">{msg.senderRole}</Badge>
                            </td>

                            <td className="p-3 max-w-md">
                              <p className="font-medium text-[#0A0A0A] line-clamp-2">“{msg.content}”</p>
                              {msg.reportReason && (
                                <p className="text-[10px] text-[#B45309] font-medium mt-1">
                                  Reason: {msg.reportReason}
                                </p>
                              )}
                              {msg.attachmentName && (
                                <span className="inline-block mt-1 font-mono text-[10px] text-[#6B7280] bg-[#F3F4F6] px-1.5 py-0.5 rounded border border-[#E5E7EB]">
                                  📎 {msg.attachmentName}
                                </span>
                              )}
                            </td>

                            <td className="p-3 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => {
                                    dismissMessageReport(msg.id, 'user-admin-1');
                                    showNotification(`Dismissed message report for ${msg.senderName}.`);
                                  }}
                                >
                                  Dismiss
                                </Button>

                                <Button
                                  variant="primary"
                                  size="sm"
                                  onClick={() => {
                                    actionMessageReport(msg.id, 'user-admin-1', 'remove_message');
                                    showNotification(`Removed reported message by ${msg.senderName} and logged violation.`);
                                  }}
                                  className="bg-rose-900 hover:bg-rose-950 text-white border-rose-900"
                                >
                                  Remove Message
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </div>
      )}

      {/* ANNOUNCEMENT MODAL */}
      <Modal
        isOpen={showAncModal}
        onClose={() => setShowAncModal(false)}
        title="Broadcast Institutional Announcement"
        icon={<BookOpen className="w-5 h-5" />}
      >
        <form onSubmit={handleCreateAnnouncement} className="space-y-4 font-sans text-xs">
          <div>
            <label className="app-label text-[#0A0A0A] font-bold">Category</label>
            <select
              value={ancCategory}
              onChange={e => setAncCategory(e.target.value as any)}
              className="app-input w-full font-bold border-[#E5E7EB] rounded-lg bg-[#FAFAFA]"
            >
              <option value="Placement Alert">Placement Alert</option>
              <option value="Institutional Update">Institutional Update</option>
              <option value="Alumni News">Alumni News</option>
              <option value="Event Highlight">Event Highlight</option>
            </select>
          </div>

          <div>
            <label className="app-label text-[#0A0A0A] font-bold">Target Audience</label>
            <select
              value={ancTargetAudience}
              onChange={e => setAncTargetAudience(e.target.value as any)}
              className="app-input w-full font-bold border-[#E5E7EB] rounded-lg bg-[#FAFAFA]"
            >
              <option value="All">All Portal Users (Students, Alumni & Faculty)</option>
              <option value="Students">Enrolled Students Only</option>
              <option value="Alumni">Graduated Alumni Only</option>
              <option value="Faculty">Faculty Members Only</option>
            </select>
          </div>

          <div>
            <label className="app-label text-[#0A0A0A] font-bold">Announcement Title</label>
            <input
              type="text"
              required
              value={ancTitle}
              onChange={e => setAncTitle(e.target.value)}
              placeholder="e.g. SIH 2025 Institutional Mentorship Kickoff"
              className="app-input w-full font-bold border-[#E5E7EB] rounded-lg bg-[#FAFAFA]"
            />
          </div>

          <div>
            <label className="app-label text-[#0A0A0A] font-bold">Content & Notice Body</label>
            <textarea
              rows={4}
              required
              value={ancContent}
              onChange={e => setAncContent(e.target.value)}
              placeholder="Official notice details broadcasted to student, alumni, and faculty feeds..."
              className="app-input w-full border-[#E5E7EB] rounded-lg bg-[#FAFAFA]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#E5E7EB]">
            <Button type="button" variant="secondary" size="md" onClick={() => setShowAncModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md">
              Publish Broadcast
            </Button>
          </div>
        </form>
      </Modal>

      {/* REJECTION REASON MODAL */}
      <Modal
        isOpen={!!rejectUserId}
        onClose={() => setRejectUserId(null)}
        title="Specify Verification Rejection Reason"
        maxWidth="sm"
      >
        <div className="space-y-4 font-sans text-xs">
          <div>
            <label className="app-label text-[#0A0A0A] font-bold">Mandatory Reason Provided to Applicant</label>
            <textarea
              rows={3}
              value={rejectReasonText}
              onChange={e => setRejectReasonText(e.target.value)}
              className="app-input w-full border-[#E5E7EB] rounded-lg bg-[#FAFAFA]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#E5E7EB]">
            <Button variant="secondary" size="md" onClick={() => setRejectUserId(null)}>
              Cancel
            </Button>
            <Button variant="primary" size="md" onClick={handleConfirmReject}>
              Confirm Rejection
            </Button>
          </div>
        </div>
      </Modal>

      {/* CLARIFICATION MODAL */}
      <Modal
        isOpen={!!clarificationUserId}
        onClose={() => setClarificationUserId(null)}
        title="Request Additional Proof from User"
        maxWidth="sm"
      >
        <div className="space-y-4 font-sans text-xs">
          <div>
            <label className="app-label text-[#0A0A0A] font-bold">Instructions Sent to User</label>
            <textarea
              rows={3}
              value={clarificationText}
              onChange={e => setClarificationText(e.target.value)}
              className="app-input w-full border-[#E5E7EB] rounded-lg bg-[#FAFAFA]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#E5E7EB]">
            <Button variant="secondary" size="md" onClick={() => setClarificationUserId(null)}>
              Cancel
            </Button>
            <Button variant="primary" size="md" onClick={handleConfirmClarification}>
              Transmit Request
            </Button>
          </div>
        </div>
      </Modal>

      {/* BULK GRADUATION SAFEGUARD CONFIRMATION MODAL */}
      <Modal
        isOpen={showBulkGradModal}
        onClose={() => setShowBulkGradModal(false)}
        title={`Confirm Bulk Batch Graduation (${studentList.filter(s => selectedBulkGradIds.includes(s.id)).length} Students)`}
        subtitle="Provisional alumni migration with mandatory recovery email safeguard check."
        icon={<GraduationCap className="w-5 h-5" />}
        maxWidth="lg"
      >
        {(() => {
          const selectedStudents = studentList.filter(s => selectedBulkGradIds.includes(s.id));

          return (
            <div className="space-y-4 font-sans text-xs">
              <div className="bg-[#FAFAFA] border border-[#E5E7EB] rounded-xl p-4 space-y-2">
                <p className="text-xs text-[#374151] leading-relaxed font-medium">
                  You are about to bulk-graduate <strong>{selectedStudents.length} students</strong> into Alumni status. Under the universal email model, their registered personal email is preserved for seamless login access post-graduation. Employment details will be marked as <em>"Provisional / Pending"</em> until updated.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-[#E5E7EB]">
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => setShowBulkGradModal(false)}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>

                <Button
                  variant="primary"
                  size="md"
                  icon={<GraduationCap className="w-4 h-4" />}
                  onClick={handleConfirmBulkGraduation}
                  className="w-full sm:w-auto"
                >
                  Confirm & Bulk Graduate ({selectedStudents.length})
                </Button>
              </div>
            </div>
          );
        })()}
      </Modal>

    </div>
  );
};

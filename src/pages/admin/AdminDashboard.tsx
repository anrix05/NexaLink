import React, { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import type { AlumniProfile, StudentProfile, FacultyProfile, Announcement, AnnouncementSeverity } from '../../types';
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
  FileSpreadsheet,
  CheckCircle2,
  BookOpen,
  UserCheck,
  Building2,
  AlertCircle,
  History,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  HelpCircle,
  CheckSquare,
  Square,
  BarChart3,
  Clock,
  Flag,
  Pin,
  Edit3,
  Trash2,
  ArrowRight
} from 'lucide-react';
import { UserManagementTable } from '../../components/admin/UserManagementTable';
import { VerificationQueueMasterDetail, type VerificationItem } from '../../components/admin/VerificationQueueMasterDetail';
import { AdminVisualAnalytics } from './AdminVisualAnalytics';
import { AdminModerationQueue } from '../../components/admin/AdminModerationQueue';
import {
  PageHeader,
  FocusPanel,
  StatStrip,
  Section,
  UnderlineTabs,
  StatusBadge,
  EmptyState
} from '../../components/ui';
import { Badge, Button, Modal, AnimatedCheckIcon } from '../../components/common/UIComponents';

export type AdminTab = 'overview' | 'approvals' | 'users' | 'moderation' | 'announcements' | 'reports' | 'graduation' | 'audit';

export interface AdminDashboardProps {
  setActiveTab: (tab: string, subTab?: string) => void;
  initialView?: 'dashboard' | 'console';
  initialTab?: AdminTab;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ setActiveTab, initialView = 'dashboard', initialTab }) => {
  const {
    alumniList,
    studentList,
    facultyList,
    jobsList,
    eventsList,
    reviewEvent,
    reviewOpportunity,
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
    updateAnnouncement,
    deleteAnnouncement,
    togglePinAnnouncement,
    roleTransitionRequests,
    approveRoleTransition,
    rejectRoleTransition,
    initiateRoleTransitionByAdmin,
    getStudentsPastGraduation,
    getReportedMessages,
    dismissMessageReport,
    actionMessageReport,
    bulkGraduateStudents,
    isDataLoading
  } = useData();

  const [activeAdminTab, setActiveAdminTab] = useState<AdminTab>(() => {
    if (initialTab) return initialTab;
    if (initialView === 'console') return 'approvals';
    return 'overview';
  });

  useEffect(() => {
    if (initialTab) {
      setActiveAdminTab(initialTab);
    } else if (initialView === 'console') {
      setActiveAdminTab('approvals');
    }
  }, [initialTab, initialView]);

  // Rejection & Clarification Modal States
  const [rejectUserId, setRejectUserId] = useState<string | null>(null);
  const [rejectReasonText, setRejectReasonText] = useState('Enrollment Number / Email Domain Mismatch');

  const [clarificationUserId, setClarificationUserId] = useState<string | null>(null);
  const [clarificationText, setClarificationText] = useState('Please upload a scanned copy of your College Admit Card or Institutional ID.');

  // Bulk Graduation Tab States
  const [selectedBulkGradIds, setSelectedBulkGradIds] = useState<string[]>([]);
  const [showBulkGradModal, setShowBulkGradModal] = useState(false);
  const [expandedAuditLogIds, setExpandedAuditLogIds] = useState<Set<string>>(new Set());

  // Search & Filter
  const [auditSearch, setAuditSearch] = useState('');
  const [auditFilterCategory, setAuditFilterCategory] = useState<'All' | 'User Events' | 'Governance' | 'System'>('All');

  // Notice Toast State
  const [notice, setNotice] = useState<string | null>(null);

  // Announcement Form Modal State
  const [showAncModal, setShowAncModal] = useState(false);
  const [editingAncId, setEditingAncId] = useState<string | null>(null);
  const [ancTitle, setAncTitle] = useState('');
  const [ancContent, setAncContent] = useState('');
  const [ancCategory, setAncCategory] = useState<string>('Placement Alert');
  const [ancTargetAudience, setAncTargetAudience] = useState<string>('All');
  const [ancSeverity, setAncSeverity] = useState<AnnouncementSeverity>('standard');
  const [ancHasExpiry, setAncHasExpiry] = useState(false);
  const [ancExpiresAt, setAncExpiresAt] = useState('');
  const [ancIsPinned, setAncIsPinned] = useState(false);
  const [isSubmittingAnc, setIsSubmittingAnc] = useState(false);

  const pendingJobs = jobsList.filter(j => j.moderationStatus === 'Pending Approval' || j.lifecycleStatus === 'pending_review' || j.lifecycleStatus === 'changes_requested');
  const pendingEvents = eventsList.filter(e => e.lifecycleStatus === 'pending_review' || e.lifecycleStatus === 'changes_requested');
  const pendingTransitions = roleTransitionRequests.filter(r => r.status === 'pending');
  const pastGradStudents = getStudentsPastGraduation();
  const reportedMessages = getReportedMessages();
  const totalModerationCount = pendingEvents.length + pendingJobs.length + reportedMessages.length;

  const showNotification = (msg: string) => {
    setNotice(msg);
    setTimeout(() => {
      setNotice(null);
    }, 3500);
  };

  const [approvingIds, setApprovingIds] = useState<string[]>([]);

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

  const handleConfirmReject = () => {
    if (rejectUserId) {
      if (rejectUserId.startsWith('rt-')) {
        rejectRoleTransition(rejectUserId, 'user-admin-1', rejectReasonText);
        showNotification('Role transition rejected.');
      } else {
        rejectUserVerification(rejectUserId, rejectReasonText);
        showNotification('Account registration rejected. Mandatory reason sent to applicant.');
      }
      setRejectUserId(null);
    }
  };

  const handleConfirmClarification = () => {
    if (clarificationUserId) {
      requestUserClarification(clarificationUserId, clarificationText);
      showNotification('Clarification & proof request sent to user.');
      setClarificationUserId(null);
    }
  };

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

  const handleOpenNewAnnouncement = () => {
    setEditingAncId(null);
    setAncTitle('');
    setAncContent('');
    setAncCategory('Placement Alert');
    setAncTargetAudience('All');
    setAncSeverity('standard');
    setAncHasExpiry(false);
    setAncExpiresAt('');
    setAncIsPinned(false);
    setShowAncModal(true);
  };

  const handleOpenEditAnnouncement = (anc: Announcement) => {
    setEditingAncId(anc.id);
    setAncTitle(anc.title);
    setAncContent(anc.content);
    setAncCategory(anc.category);
    setAncTargetAudience(anc.targetAudience);
    setAncSeverity(anc.severity || (anc.isImportant ? 'governance' : 'standard'));
    setAncHasExpiry(!!anc.expiresAt);
    setAncExpiresAt(anc.expiresAt ? anc.expiresAt.split('T')[0] : '');
    setAncIsPinned(!!anc.isPinned);
    setShowAncModal(true);
  };

  const handleSubmitAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ancTitle.trim() || !ancContent.trim()) return;

    setIsSubmittingAnc(true);
    try {
      const payload = {
        title: ancTitle.trim(),
        category: ancCategory,
        author: 'Institutional Admin Cell',
        content: ancContent.trim(),
        isImportant: ancSeverity === 'governance',
        targetAudience: ancTargetAudience,
        severity: ancSeverity,
        expiresAt: ancHasExpiry && ancExpiresAt ? new Date(ancExpiresAt + 'T23:59:59').toISOString() : undefined,
        isPinned: ancIsPinned
      };

      if (editingAncId) {
        await updateAnnouncement(editingAncId, payload);
        showNotification(`Updated announcement: "${payload.title}"`);
      } else {
        await addAnnouncement(payload);
        showNotification(`Broadcast announcement published: "${payload.title}"`);
      }
      setShowAncModal(false);
    } catch (err: any) {
      console.error(err);
      showNotification('Failed to save announcement.');
    } finally {
      setIsSubmittingAnc(false);
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
  ];

  const verifiedStudents = studentList.filter(s => s.isVerified || s.verificationStatus === 'Verified').length;
  const verifiedAlumni = alumniList.filter(a => a.isVerified || a.verificationStatus === 'Verified').length;
  const verifiedFaculty = facultyList.filter(f => f.isVerified || f.verificationStatus === 'Verified').length;
  const verifiedMembersTotal = verifiedStudents + verifiedAlumni + verifiedFaculty;
  const pipelineTotalAccounts = studentList.length + alumniList.length + facultyList.length;
  const overallVerifiedPct = Math.round((verifiedMembersTotal / (pipelineTotalAccounts || 1)) * 100);
  const totalPendingQueue = pendingUsersList.length + pendingTransitions.length;

  const totalAuditLogsCount = auditLogs.length;

  // Build Verification Queue Items for MasterDetail
  const verificationQueueItems: VerificationItem[] = [
    ...pendingUsersList.map(u => ({
      id: u.id,
      type: 'registration' as const,
      name: u.name,
      email: u.email,
      role: u.role,
      department: u.department,
      idNo: u.enrollmentNo || (u as any).prn || (u as any).employeeId || 'PRN-VIT-2024-089',
      submittedAt: (u as any).createdAt,
      documentUrl: (u as any).verificationDocumentUrl || u.proofDocumentName,
      documentName: u.proofDocumentName || 'Scanned_ID_Proof.pdf',
      bio: u.bio,
      skills: u.skills,
      confidence: u.email.includes('vit.edu.in') ? ('high' as const) : ('medium' as const),
      confidenceReason: u.email.includes('vit.edu.in')
        ? 'Active institutional email domain validated'
        : 'Personal email domain used; document proof review advised',
      raw: u
    })),
    ...pendingTransitions.map(r => {
      const sUser = studentList.find(s => s.id === r.userId) || allUsersTable.find(u => u.id === r.userId);
      return {
        id: r.id,
        type: 'role_transition' as const,
        name: sUser?.name || 'Graduating Student',
        email: r.proposedAlumniData?.personalEmail || sUser?.email || '',
        role: 'Student → Alumni',
        department: sUser?.department || 'CMPN',
        idNo: (sUser as any)?.enrollmentNo || (sUser as any)?.prn || 'PRN-VIT-2024',
        submittedAt: r.requestedAt,
        documentUrl: r.proposedAlumniData?.verificationDocumentUrl || r.proposedAlumniData?.verificationDocumentName,
        documentName: r.proposedAlumniData?.verificationDocumentName || 'Degree_Certificate.pdf',
        bio: (sUser as any)?.bio,
        skills: (sUser as any)?.skills,
        proposedData: {
          company: r.proposedAlumniData?.company,
          designation: r.proposedAlumniData?.designation,
          personalEmail: r.proposedAlumniData?.personalEmail,
          documentUrl: r.proposedAlumniData?.verificationDocumentUrl
        },
        confidence: 'high' as const,
        confidenceReason: 'Academic completion criteria met; transitioning to verified alumni status',
        raw: r
      };
    })
  ];

  return (
    <div className="space-y-8">
      {/* Toast Notice */}
      {notice && (
        <div className="fixed top-20 right-6 z-50 bg-[#0A0A0A] text-white px-4 py-2.5 rounded-lg text-xs font-medium shadow-md transition-opacity">
          {notice}
        </div>
      )}

      {/* Unified Tab Bar (Single Navigation Row with UnderlineTabs) */}
      <UnderlineTabs
        tabs={[
          { id: 'overview', label: 'Command center' },
          { id: 'approvals', label: 'Verification queue', count: totalPendingQueue },
          { id: 'users', label: 'User roster', count: allUsersTable.length },
          { id: 'moderation', label: 'Moderation queue', count: totalModerationCount },
          { id: 'announcements', label: 'Announcements', count: announcements.filter(a => !a.isRetracted).length },
          { id: 'reports', label: 'Reported messages', count: reportedMessages.length },
          { id: 'graduation', label: 'Graduation tool' },
          { id: 'audit', label: 'Audit logs', count: auditLogs.length }
        ]}
        activeTab={activeAdminTab}
        onChange={id => setActiveAdminTab(id as AdminTab)}
      />

      {/* VIEW 1: OVERVIEW */}
      {activeAdminTab === 'overview' && (
        <div className="space-y-8">
          {/* Header */}
          <PageHeader
            eyebrow="Administration"
            title="Command center"
            subtitle="Centralized monitoring across students, alumni, faculty, and governance metrics."
            actions={
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveAdminTab('approvals')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#0A0A0A] hover:bg-[#262626] text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Review queue {totalPendingQueue > 0 ? `(${totalPendingQueue})` : ''}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('reports', 'exporter')}
                  className="inline-flex items-center gap-1.5 px-3 py-2 border border-[#6B7280] hover:bg-[#FAFAFA] text-[#0A0A0A] text-xs font-medium rounded-lg transition-colors cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-[#0A0A0A]" />
                  <span>Export reports</span>
                </button>
                <button
                  type="button"
                  onClick={handleOpenNewAnnouncement}
                  className="inline-flex items-center gap-1.5 px-3 py-2 border border-[#6B7280] hover:bg-[#FAFAFA] text-[#0A0A0A] text-xs font-medium rounded-lg transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Publish notice</span>
                </button>
              </div>
            }
          />

          {/* FocusPanel: Single Emphasis Surface per Viewport ("Needs attention" / "All clear") */}
          {totalPendingQueue > 0 ? (
            <FocusPanel
              eyebrow="Needs attention"
              title={`${totalPendingQueue} institutional verification${totalPendingQueue > 1 ? 's' : ''} pending review`}
              action={
                <button
                  type="button"
                  onClick={() => setActiveAdminTab('approvals')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#0A0A0A] hover:bg-[#262626] text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
                >
                  <span>Review queue</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              }
            >
              <p className="text-xs text-[#6B7280] max-w-2xl leading-relaxed">
                Student enrollment PRNs and alumni transition credentials are awaiting administrative audit. Unverified applicants remain restricted from portal access until confirmed.
              </p>
            </FocusPanel>
          ) : (
            <FocusPanel
              eyebrow="Status"
              title="All verification queues clear"
              action={
                <button
                  type="button"
                  onClick={() => setActiveAdminTab('audit')}
                  className="inline-flex items-center gap-1.5 px-3 py-2 border border-[#6B7280] hover:bg-[#FAFAFA] text-[#0A0A0A] text-xs font-medium rounded-lg transition-colors cursor-pointer"
                >
                  <span>View audit logs</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              }
            >
              <p className="text-xs text-[#6B7280] max-w-2xl leading-relaxed">
                All student enrollment numbers and alumni graduation profiles have been audited and verified. Incoming submissions will appear here automatically.
              </p>
            </FocusPanel>
          )}

          {/* StatStrip: Core Platform Metrics */}
          <StatStrip
            items={[
              {
                label: 'Enrolled students',
                value: studentList.length,
                subtext: `${verifiedStudents} verified`
              },
              {
                label: 'Graduated alumni',
                value: alumniList.length,
                subtext: `${verifiedAlumni} verified`
              },
              {
                label: 'Faculty advisors',
                value: facultyList.length,
                subtext: `${verifiedFaculty} verified`
              },
              {
                label: 'Verification rate',
                value: `${overallVerifiedPct}%`,
                subtext: `${verifiedMembersTotal} of ${pipelineTotalAccounts} members`
              }
            ]}
          />

          {/* Published Announcements Manager */}
          <Section
            title="Published announcements"
            count={announcements.filter(a => !a.isRetracted).length}
            description="Live broadcast notices synchronized across student, alumni, and faculty portal feeds with audience targeting."
            action={
              <button
                type="button"
                onClick={handleOpenNewAnnouncement}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[#6B7280] hover:bg-[#FAFAFA] text-[#0A0A0A] text-xs font-medium rounded-lg transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New announcement</span>
              </button>
            }
          >
            {announcements.filter(a => !a.isRetracted).length === 0 ? (
              <EmptyState
                icon={<BookOpen className="w-5 h-5 text-[#0A0A0A]" />}
                title="No active announcements"
                sentence="Click 'New announcement' to broadcast a notice to students, faculty, or alumni."
              />
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {announcements.filter(a => !a.isRetracted).map(anc => {
                  const isExpired = anc.expiresAt ? Date.now() > new Date(anc.expiresAt).getTime() : false;
                  const severity = anc.severity || (anc.isImportant ? 'governance' : 'standard');

                  return (
                    <div
                      key={anc.id}
                      className="p-4 border border-[#E5E7EB] rounded-xl flex flex-col justify-between gap-3 bg-white"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {anc.isPinned && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-[#0A0A0A] text-white">
                                <Pin className="w-3 h-3 fill-white" />
                                Pinned
                              </span>
                            )}
                            <StatusBadge
                              tone={
                                severity === 'governance'
                                  ? 'rose'
                                  : severity === 'actionable'
                                  ? 'amber'
                                  : severity === 'academic'
                                  ? 'indigo'
                                  : 'neutral'
                              }
                              label={anc.category}
                            />
                          </div>

                          <div className="flex items-center gap-2 text-xs text-[#6B7280]">
                            {isExpired ? (
                              <span className="text-[#991B1B] font-medium">Expired</span>
                            ) : anc.expiresAt ? (
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
                            {anc.targetAudience || 'All'}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 self-end sm:self-auto">
                          <button
                            type="button"
                            onClick={() => togglePinAnnouncement(anc.id)}
                            className="px-2.5 py-1 border border-[#E5E7EB] hover:bg-[#FAFAFA] text-[#0A0A0A] text-xs font-medium rounded-md transition-colors"
                          >
                            {anc.isPinned ? 'Unpin' : 'Pin'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEditAnnouncement(anc)}
                            className="px-2.5 py-1 border border-[#E5E7EB] hover:bg-[#FAFAFA] text-[#0A0A0A] text-xs font-medium rounded-md transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              deleteAnnouncement(anc.id);
                              showNotification(`Announcement "${anc.title}" deleted.`);
                            }}
                            className="px-2.5 py-1 border border-rose-200 hover:bg-rose-50 text-[#991B1B] text-xs font-medium rounded-md transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Section>

          {/* Section: Institutional Visual Analytics */}
          <Section
            title="Institutional visual analytics"
            description="Live interactive performance metrics and departmental demographics."
          >
            <AdminVisualAnalytics />
          </Section>
        </div>
      )}

      {/* VIEW: ANNOUNCEMENTS */}
      {activeAdminTab === 'announcements' && (
        <div className="space-y-4">
          <Section
            title="Published announcements"
            count={announcements.filter(a => !a.isRetracted).length}
            description="Live broadcast notices synchronized across student, alumni, and faculty portal feeds with audience targeting."
            noTopHairline
            action={
              <button
                type="button"
                onClick={handleOpenNewAnnouncement}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[#6B7280] hover:bg-[#FAFAFA] text-[#0A0A0A] text-xs font-medium rounded-lg transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New announcement</span>
              </button>
            }
          >
            {announcements.filter(a => !a.isRetracted).length === 0 ? (
              <EmptyState
                icon={<BookOpen className="w-5 h-5 text-[#0A0A0A]" />}
                title="No active announcements"
                sentence="Click 'New announcement' to broadcast a notice to students, faculty, or alumni."
              />
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {announcements.filter(a => !a.isRetracted).map(anc => {
                  const isExpired = anc.expiresAt ? Date.now() > new Date(anc.expiresAt).getTime() : false;
                  const severity = anc.severity || (anc.isImportant ? 'governance' : 'standard');

                  return (
                    <div
                      key={anc.id}
                      className="p-4 border border-[#E5E7EB] rounded-xl flex flex-col justify-between gap-3 bg-white"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {anc.isPinned && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-[#0A0A0A] text-white">
                                <Pin className="w-3 h-3 fill-white" />
                                Pinned
                              </span>
                            )}
                            <StatusBadge
                              tone={
                                severity === 'governance'
                                  ? 'rose'
                                  : severity === 'actionable'
                                  ? 'amber'
                                  : severity === 'academic'
                                  ? 'indigo'
                                  : 'neutral'
                              }
                              label={anc.category}
                            />
                          </div>

                          <div className="flex items-center gap-2 text-xs text-[#6B7280]">
                            {isExpired ? (
                              <span className="text-[#991B1B] font-medium">Expired</span>
                            ) : anc.expiresAt ? (
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
                            {anc.targetAudience || 'All'}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 self-end sm:self-auto">
                          <button
                            type="button"
                            onClick={() => togglePinAnnouncement(anc.id)}
                            className="px-2.5 py-1 border border-[#E5E7EB] hover:bg-[#FAFAFA] text-[#0A0A0A] text-xs font-medium rounded-md transition-colors"
                          >
                            {anc.isPinned ? 'Unpin' : 'Pin'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEditAnnouncement(anc)}
                            className="px-2.5 py-1 border border-[#E5E7EB] hover:bg-[#FAFAFA] text-[#0A0A0A] text-xs font-medium rounded-md transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              deleteAnnouncement(anc.id);
                              showNotification(`Announcement "${anc.title}" deleted.`);
                            }}
                            className="px-2.5 py-1 border border-rose-200 hover:bg-rose-50 text-[#991B1B] text-xs font-medium rounded-md transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Section>
        </div>
      )}

      {/* VIEW 2: VERIFICATION QUEUE (MasterDetail) */}
      {activeAdminTab === 'approvals' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
            <div>
              <h2 className="text-lg font-semibold text-[#0A0A0A] tracking-tight">
                Institutional verification queue
              </h2>
              <p className="text-xs text-[#6B7280] mt-0.5">
                Inspect enrollment PRNs, verify credential proofs, and audit applicant submissions using keyboard shortcuts.
              </p>
            </div>
          </div>

          <VerificationQueueMasterDetail
            items={verificationQueueItems}
            onApprove={(id, type) => {
              if (type === 'role_transition') {
                handleApproveTransition(id);
              } else {
                handleApproveAccount(id);
              }
            }}
            onReject={(id) => setRejectUserId(id)}
            onClarify={(id) => setClarificationUserId(id)}
            approvingIds={approvingIds}
          />

          {/* Students Past Graduation Table */}
          {pastGradStudents.length > 0 && (
            <Section
              title="Students past graduation threshold"
              count={pastGradStudents.length}
              description="Final-year students whose scheduled graduation batch has passed without a submitted alumni transition."
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {pastGradStudents.map(student => (
                  <div
                    key={student.id}
                    className="border border-[#E5E7EB] rounded-lg p-4 bg-white flex items-center justify-between"
                  >
                    <div>
                      <p className="font-semibold text-[#0A0A0A] text-xs">{student.name}</p>
                      <p className="text-xs text-[#6B7280] mt-0.5">
                        {student.department} · Class of <span className="tabular-nums">{student.graduationYear}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => showNotification(`Reminder sent to ${student.name}.`)}
                        className="px-2.5 py-1 text-xs border border-[#6B7280] hover:bg-[#FAFAFA] text-[#0A0A0A] rounded-md transition-colors"
                      >
                        Notify
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          initiateRoleTransitionByAdmin(student.id, 'user-admin-1');
                          showNotification(`Role transition initiated for ${student.name}. Added to queue.`);
                        }}
                        className="px-2.5 py-1 text-xs bg-[#0A0A0A] hover:bg-[#262626] text-white rounded-md transition-colors"
                      >
                        Initiate
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}
        </div>
      )}

      {/* VIEW 3: USER ROSTER */}
      {activeAdminTab === 'users' && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-[#0A0A0A] tracking-tight">
              Platform user roster
            </h2>
            <p className="text-xs text-[#6B7280] mt-0.5">
              Comprehensive registry across students, alumni, faculty, and administrative staff accounts.
            </p>
          </div>
          <UserManagementTable />
        </div>
      )}

      {/* VIEW 4: UNIFIED MODERATION QUEUE (EVENTS, OPPORTUNITIES, REPORTED MESSAGES) */}
      {activeAdminTab === 'moderation' && (
        <div className="space-y-6">
          <PageHeader
            eyebrow="Governance"
            title="Moderation queue"
            subtitle="Central review queue for institutional events, career opportunities, and reported communications."
          />
          <AdminModerationQueue
            pendingEvents={pendingEvents}
            pendingJobs={pendingJobs}
            reportedMessages={reportedMessages}
            allEvents={eventsList}
            onApproveEvent={(id) => {
              reviewEvent(id, 'approve');
              showNotification('Event approved and published live to institutional calendars.');
            }}
            onRequestEventChanges={(id, note) => {
              reviewEvent(id, 'request_changes', note);
              showNotification('Feedback and change request sent to event host.');
            }}
            onRejectEvent={(id, reason) => {
              reviewEvent(id, 'reject', reason);
              showNotification('Event submission rejected.');
            }}
            onApproveJob={(id) => {
              reviewOpportunity(id, 'approve');
              showNotification('Opportunity approved and published live.');
            }}
            onRequestJobChanges={(id, note) => {
              reviewOpportunity(id, 'request_changes', note);
              showNotification('Feedback and change request sent to poster.');
            }}
            onRejectJob={(id, reason) => {
              reviewOpportunity(id, 'reject', reason);
              showNotification('Opportunity rejected.');
            }}
            onDismissReport={(id) => {
              dismissMessageReport(id, 'user-admin-1');
              showNotification('Report dismissed.');
            }}
            onActionReport={(id) => {
              actionMessageReport(id, 'user-admin-1', 'warn_user');
              showNotification('Message violation actioned.');
            }}
          />
        </div>
      )}

      {/* VIEW 5: REPORTED MESSAGES */}
      {activeAdminTab === 'reports' && (
        <div className="space-y-4">
          <Section
            title="Reported messages queue"
            count={reportedMessages.length}
            description="Review peer-to-peer message reports flagged by students, alumni, and faculty members for safety violations."
            noTopHairline
          >
            {reportedMessages.length === 0 ? (
              <EmptyState
                icon={<Flag className="w-5 h-5 text-[#0A0A0A]" />}
                title="No reported messages"
                sentence="All member communications are clean and free of outstanding user reports."
              />
            ) : (
              <div className="space-y-4">
                {reportedMessages.map(report => (
                  <div key={report.id} className="p-4 border border-[#E5E7EB] rounded-xl bg-white space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-[#0A0A0A]">
                            Reported by: {report.reportedBy || 'Verified Member'}
                          </span>
                          <StatusBadge tone="rose" label="Flagged" />
                        </div>
                        <p className="text-xs text-[#6B7280] mt-0.5">
                          Sender: {report.senderName} · Reason: {report.reportReason || 'Policy Violation'}
                        </p>
                      </div>
                      <span className="text-xs text-[#6B7280] tabular-nums">
                        {new Date(report.reportedAt || report.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>

                    <div className="p-3 bg-[#FAFAFA] border border-[#E5E7EB] rounded-lg text-xs text-[#374151]">
                      <strong>Flagged content:</strong>
                      <p className="mt-1 italic">"{report.content}"</p>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1 border-t border-[#E5E7EB]">
                      <button
                        type="button"
                        onClick={() => {
                          dismissMessageReport(report.id, 'user-admin-1');
                          showNotification('Message report dismissed.');
                        }}
                        className="px-3 py-1.5 border border-[#6B7280] hover:bg-[#FAFAFA] text-[#0A0A0A] text-xs font-medium rounded-lg transition-colors cursor-pointer"
                      >
                        Dismiss report
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          actionMessageReport(report.id, 'user-admin-1', 'warn_user');
                          showNotification(`Warning issued to ${report.senderName}.`);
                        }}
                        className="px-3.5 py-1.5 bg-[#0A0A0A] hover:bg-[#262626] text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
                      >
                        Issue policy warning
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>
        </div>
      )}

      {/* VIEW 6: GRADUATION TOOL */}
      {activeAdminTab === 'graduation' && (() => {
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
          <div className="space-y-6">
            <Section
              title="Bulk student batch graduation"
              count={activeCandidates.length}
              description="Provisional batch migration for final-year students past graduation threshold into the Alumni Registry."
              noTopHairline
            >
              {/* Registrar Source of Truth Notice */}
              <div className="p-4 bg-[#FAFAFA] border border-[#E5E7EB] rounded-xl flex items-start gap-3 text-xs text-[#374151]">
                <AlertCircle className="w-4 h-4 text-[#B45309] shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong className="text-[#0A0A0A]">Registrar source-of-truth notice:</strong> This candidate list is derived from stored graduation years (graduationYear ≤ 2024), not an official registrar export. Verify against Academic Cell records before taking bulk action.
                </p>
              </div>

              {/* Bulk Actions Header Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#FAFAFA] border border-[#E5E7EB] p-3.5 rounded-xl">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    className="inline-flex items-center gap-2 text-xs font-semibold text-[#0A0A0A] hover:opacity-80 transition-opacity cursor-pointer"
                  >
                    {isAllSelected ? (
                      <CheckSquare className="w-4 h-4 text-[#0A0A0A]" />
                    ) : (
                      <Square className="w-4 h-4 text-[#6B7280]" />
                    )}
                    <span>Select all ({activeCandidates.length} candidates)</span>
                  </button>

                  {selectedBulkGradIds.length > 0 && (
                    <span className="text-xs font-semibold text-[#0A0A0A] bg-white px-2.5 py-1 rounded-md border border-[#E5E7EB] tabular-nums">
                      {selectedBulkGradIds.length} selected
                    </span>
                  )}
                </div>

                {selectedBulkGradIds.length > 0 && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedBulkGradIds([])}
                      className="px-3 py-1.5 border border-[#6B7280] hover:bg-white text-[#0A0A0A] text-xs font-medium rounded-lg transition-colors cursor-pointer"
                    >
                      Clear selection
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowBulkGradModal(true)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0A0A0A] hover:bg-[#262626] text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
                    >
                      <GraduationCap className="w-3.5 h-3.5" />
                      <span>Graduate selected ({selectedBulkGradIds.length})</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Candidate Table */}
              <div className="border border-[#E5E7EB] rounded-xl overflow-x-auto text-xs bg-white">
                <table className="w-full text-left">
                  <thead className="bg-[#FAFAFA] font-medium text-xs text-[#0A0A0A] border-b border-[#E5E7EB]">
                    <tr>
                      <th className="p-3 w-10 text-center">
                        <button type="button" onClick={toggleSelectAll}>
                          {isAllSelected ? <CheckSquare className="w-4 h-4 text-[#0A0A0A]" /> : <Square className="w-4 h-4 text-[#6B7280]" />}
                        </button>
                      </th>
                      <th className="p-3">Student name</th>
                      <th className="p-3">Department & year</th>
                      <th className="p-3">ID / enrollment no</th>
                      <th className="p-3">Primary login email</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E7EB]">
                    {activeCandidates.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-[#6B7280]">
                          No candidate students found matching the graduation threshold.
                        </td>
                      </tr>
                    ) : (
                      activeCandidates.map(s => {
                        const isSelected = selectedBulkGradIds.includes(s.id);

                        return (
                          <tr key={s.id} className={`hover:bg-[#FAFAFA] transition-colors ${isSelected ? 'bg-[#F9FAFB]' : ''}`}>
                            <td className="p-3 text-center">
                              <button type="button" onClick={() => toggleSelectOne(s.id)}>
                                {isSelected ? <CheckSquare className="w-4 h-4 text-[#0A0A0A]" /> : <Square className="w-4 h-4 text-[#6B7280]" />}
                              </button>
                            </td>
                            <td className="p-3 font-semibold text-[#0A0A0A]">
                              <div className="flex items-center gap-2.5">
                                <img src={s.avatar} alt={s.name} className="w-8 h-8 rounded-full object-cover border border-[#E5E7EB]" />
                                <span>{s.name}</span>
                              </div>
                            </td>
                            <td className="p-3 text-[#374151]">
                              {s.department} · Class of <span className="tabular-nums">{s.expectedGraduationYear || s.graduationYear || 2024}</span>
                            </td>
                            <td className="p-3 font-mono text-[#0A0A0A]">
                              {s.enrollmentNo || s.prn || s.id}
                            </td>
                            <td className="p-3 text-[#0A0A0A]">
                              {s.email}
                            </td>
                            <td className="p-3 text-right">
                              <button
                                type="button"
                                onClick={() => {
                                  graduateStudentToAlumni(s.id);
                                  showNotification(`${s.name} provisionally graduated to Alumni Registry.`);
                                }}
                                className="px-3 py-1 border border-[#6B7280] hover:bg-[#FAFAFA] text-[#0A0A0A] text-xs font-medium rounded-md transition-colors cursor-pointer"
                              >
                                Graduate
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </Section>
          </div>
        );
      })()}

      {/* VIEW 7: AUDIT LOGS */}
      {activeAdminTab === 'audit' && (() => {
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
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E7EB] pb-4">
              <div>
                <h2 className="text-lg font-semibold text-[#0A0A0A] tracking-tight">
                  Institutional security & audit logs ({filteredAuditLogs.length} records)
                </h2>
                <p className="text-xs text-[#6B7280] mt-0.5">
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
                    className="pl-9 pr-3 py-1.5 bg-[#FAFAFA] border border-[#6B7280] rounded-lg text-xs w-48 sm:w-64 text-[#0A0A0A] focus:outline-none focus:ring-1 focus:ring-[#0A0A0A]"
                  />
                </div>
                <select
                  value={auditFilterCategory}
                  onChange={e => setAuditFilterCategory(e.target.value as any)}
                  className="bg-[#FAFAFA] border border-[#6B7280] rounded-lg px-2.5 py-1.5 text-xs text-[#0A0A0A] focus:outline-none"
                >
                  <option value="All">All events</option>
                  <option value="User Events">User & verification</option>
                  <option value="Governance">Governance & roles</option>
                  <option value="System">System logs</option>
                </select>
              </div>
            </div>

            <div className="border border-[#E5E7EB] rounded-xl overflow-x-auto text-xs bg-white">
              <table className="w-full text-left">
                <thead className="bg-[#FAFAFA] font-medium text-xs text-[#0A0A0A] border-b border-[#E5E7EB]">
                  <tr>
                    <th className="p-3">Timestamp</th>
                    <th className="p-3">Action event</th>
                    <th className="p-3">Performed by</th>
                    <th className="p-3">Details / target user</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB] text-xs">
                  {filteredAuditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-6 text-center text-[#6B7280]">
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
                            <td className="p-3 text-[#6B7280] tabular-nums">{log.timestamp}</td>
                            <td className="p-3 font-semibold text-[#0A0A0A]">
                              <div className="flex items-center gap-2">
                                {isBulkLog && (
                                  <button
                                    type="button"
                                    onClick={() => toggleExpandAuditLog(log.id)}
                                    className="p-1 hover:bg-[#E5E7EB] rounded transition-colors text-[#0A0A0A]"
                                  >
                                    {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                                  </button>
                                )}
                                <span>{log.action}</span>
                                {isBulkLog && (
                                  <StatusBadge tone="indigo" label="Bulk Action" />
                                )}
                              </div>
                            </td>
                            <td className="p-3 text-[#374151]">{log.performedBy}</td>
                            <td className="p-3 text-[#374151]">{log.details}</td>
                          </tr>

                          {isBulkLog && isExpanded && (
                            <tr className="bg-[#FAFAFA] border-b border-[#E5E7EB]">
                              <td colSpan={4} className="p-4">
                                <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 space-y-3 text-xs">
                                  <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-2">
                                    <span className="font-semibold text-[#0A0A0A]">
                                      Bulk Execution Breakdown ({log.bulkMetadata?.affectedCount || 'N/A'} Affected Accounts)
                                    </span>
                                    {log.bulkMetadata?.missingEmailCount ? (
                                      <StatusBadge tone="amber" label={`${log.bulkMetadata.missingEmailCount} Missing recovery email`} />
                                    ) : (
                                      <StatusBadge tone="emerald" label="All recovery emails set" />
                                    )}
                                  </div>

                                  <div>
                                    <span className="block text-xs text-[#6B7280] font-medium mb-1.5">
                                      Graduated student names
                                    </span>
                                    <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 bg-[#FAFAFA] border border-[#E5E7EB] rounded-lg text-xs">
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

      {/* ANNOUNCEMENT MODAL */}
      <Modal
        isOpen={showAncModal}
        onClose={() => setShowAncModal(false)}
        title={editingAncId ? 'Edit Announcement' : 'Publish Institutional Announcement'}
        subtitle="Broadcast urgent updates, placement drives, and governance notifications."
        maxWidth="lg"
      >
        <form onSubmit={handleSubmitAnnouncement} className="space-y-4 font-sans text-xs">
          <div>
            <label className="block text-xs font-semibold text-[#0A0A0A] mb-1.5">
              Notice title <span className="text-rose-600">*</span>
            </label>
            <input
              type="text"
              required
              value={ancTitle}
              onChange={e => setAncTitle(e.target.value)}
              placeholder="e.g. Campus Placement Drive — Batch 2025"
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
                onChange={e => setAncCategory(e.target.value)}
                className="w-full border border-[#6B7280] rounded-lg bg-[#FAFAFA] text-xs p-2.5 text-[#0A0A0A] focus:outline-none"
              >
                <option value="Placement Alert">Placement alert</option>
                <option value="Academic Governance">Academic governance</option>
                <option value="Alumni Homecoming">Alumni homecoming</option>
                <option value="Research & Grants">Research & grants</option>
                <option value="Campus Safety">Campus safety</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0A0A0A] mb-1.5">
                Target audience
              </label>
              <select
                value={ancTargetAudience}
                onChange={e => setAncTargetAudience(e.target.value)}
                className="w-full border border-[#6B7280] rounded-lg bg-[#FAFAFA] text-xs p-2.5 text-[#0A0A0A] focus:outline-none"
              >
                <option value="All">All campus members</option>
                <option value="Students Only">Students only</option>
                <option value="Alumni Only">Alumni only</option>
                <option value="Faculty Only">Faculty only</option>
              </select>
            </div>
          </div>

          {/* Severity */}
          <div>
            <label className="block text-xs font-semibold text-[#0A0A0A] mb-1.5">
              Notice severity tier
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['standard', 'actionable', 'governance', 'academic'] as const).map(sev => (
                <button
                  key={sev}
                  type="button"
                  onClick={() => setAncSeverity(sev)}
                  className={`text-left p-3 rounded-xl border transition-all text-xs flex items-center justify-between cursor-pointer ${
                    ancSeverity === sev
                      ? 'border-[#0A0A0A] bg-[#FAFAFA]'
                      : 'border-[#E5E7EB] bg-white hover:border-[#6B7280]'
                  }`}
                >
                  <span className="capitalize font-medium text-[#0A0A0A]">{sev}</span>
                  {ancSeverity === sev && <Check className="w-3.5 h-3.5 text-[#0A0A0A]" />}
                </button>
              ))}
            </div>
          </div>

          {/* Content Body */}
          <div>
            <label className="block text-xs font-semibold text-[#0A0A0A] mb-1.5">
              Notice content <span className="text-rose-600">*</span>
            </label>
            <textarea
              rows={4}
              required
              value={ancContent}
              onChange={e => setAncContent(e.target.value)}
              placeholder="Provide complete announcement details, instructions, or links..."
              className="w-full border border-[#6B7280] rounded-lg bg-[#FAFAFA] text-xs p-3 text-[#0A0A0A] focus:outline-none focus:ring-1 focus:ring-[#0A0A0A]"
            />
          </div>

          {/* Controls: Pinning & Expiry */}
          <div className="p-3.5 bg-[#FAFAFA] border border-[#E5E7EB] rounded-xl space-y-3">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={ancIsPinned}
                onChange={e => setAncIsPinned(e.target.checked)}
                className="w-4 h-4 rounded text-[#0A0A0A] border-[#6B7280] focus:ring-[#0A0A0A]"
              />
              <span className="font-medium text-xs text-[#0A0A0A]">Pin announcement to top of feeds</span>
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
                <span className="font-medium text-xs text-[#0A0A0A]">Set auto-expiry date</span>
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

      {/* REJECTION REASON MODAL */}
      <Modal
        isOpen={!!rejectUserId}
        onClose={() => setRejectUserId(null)}
        title="Specify Verification Rejection Reason"
        maxWidth="sm"
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block text-xs font-semibold text-[#0A0A0A] mb-1.5">
              Reason provided to applicant
            </label>
            <textarea
              rows={3}
              value={rejectReasonText}
              onChange={e => setRejectReasonText(e.target.value)}
              className="w-full border border-[#6B7280] rounded-lg bg-[#FAFAFA] p-2.5 text-xs text-[#0A0A0A]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#E5E7EB]">
            <button
              type="button"
              onClick={() => setRejectUserId(null)}
              className="px-3 py-1.5 border border-[#6B7280] hover:bg-[#FAFAFA] text-[#0A0A0A] text-xs font-medium rounded-lg"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmReject}
              className="px-3.5 py-1.5 bg-[#991B1B] hover:bg-rose-700 text-white text-xs font-medium rounded-lg"
            >
              Confirm rejection
            </button>
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
        <div className="space-y-4 text-xs">
          <div>
            <label className="block text-xs font-semibold text-[#0A0A0A] mb-1.5">
              Instructions sent to applicant
            </label>
            <textarea
              rows={3}
              value={clarificationText}
              onChange={e => setClarificationText(e.target.value)}
              className="w-full border border-[#6B7280] rounded-lg bg-[#FAFAFA] p-2.5 text-xs text-[#0A0A0A]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#E5E7EB]">
            <button
              type="button"
              onClick={() => setClarificationUserId(null)}
              className="px-3 py-1.5 border border-[#6B7280] hover:bg-[#FAFAFA] text-[#0A0A0A] text-xs font-medium rounded-lg"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmClarification}
              className="px-3.5 py-1.5 bg-[#0A0A0A] hover:bg-[#262626] text-white text-xs font-medium rounded-lg"
            >
              Transmit request
            </button>
          </div>
        </div>
      </Modal>

      {/* BULK GRADUATION SAFEGUARD MODAL */}
      <Modal
        isOpen={showBulkGradModal}
        onClose={() => setShowBulkGradModal(false)}
        title={`Confirm Bulk Batch Graduation (${studentList.filter(s => selectedBulkGradIds.includes(s.id)).length} Students)`}
        subtitle="Provisional alumni migration with universal email safeguard check."
        maxWidth="lg"
      >
        <div className="space-y-4 text-xs">
          <div className="bg-[#FAFAFA] border border-[#E5E7EB] rounded-xl p-4 space-y-2">
            <p className="text-xs text-[#374151] leading-relaxed">
              You are about to bulk-graduate <strong>{studentList.filter(s => selectedBulkGradIds.includes(s.id)).length} students</strong> into Alumni status. Under the universal email model, their registered personal email is preserved for seamless login access post-graduation.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E5E7EB]">
            <button
              type="button"
              onClick={() => setShowBulkGradModal(false)}
              className="px-3.5 py-2 border border-[#6B7280] hover:bg-[#FAFAFA] text-[#0A0A0A] text-xs font-medium rounded-lg"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmBulkGraduation}
              className="px-4 py-2 bg-[#0A0A0A] hover:bg-[#262626] text-white text-xs font-medium rounded-lg"
            >
              Confirm & bulk graduate ({selectedBulkGradIds.length})
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

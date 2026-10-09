import React, { useState, useMemo, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { jobsService } from '../../services/jobsService';
import { Modal, Button, TextArea } from '../../components/common/UIComponents';
import { exportCsvBlob } from '../../utils/chunkedExporter';
import { formatDate } from '../../utils/formatters';
import type {
  JobListing,
  OpportunityApplication,
  OpportunityApplicationStatus
} from '../../types';
import {
  ArrowLeft,
  Briefcase,
  Users,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  Download,
  Mail,
  Edit3,
  Calendar,
  Sparkles,
  Search,
  ExternalLink,
  Ban,
  FileSpreadsheet,
  FileText,
  Lock,
  Loader2
} from 'lucide-react';

interface OpportunityManageConsoleProps {
  jobId: string;
  onBack: () => void;
  onEdit: (jobId: string) => void;
}

export const OpportunityManageConsole: React.FC<OpportunityManageConsoleProps> = ({
  jobId,
  onBack,
  onEdit
}) => {
  const {
    jobsList,
    opportunityApplications,
    updateApplicationStatus,
    closeOpportunity,
    allUsers,
    setPendingChatUserId
  } = useData();
  const { currentUser, currentRole } = useAuth();

  const job = useMemo(() => {
    return jobsList.find(j => j.id === jobId);
  }, [jobsList, jobId]);

  const [activeTab, setActiveTab] = useState<'applicants' | 'overview' | 'details'>('applicants');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [noticeMsg, setNoticeMsg] = useState<string | null>(null);

  // Applicant review drawer / modal state
  const [selectedApplicant, setSelectedApplicant] = useState<OpportunityApplication | null>(null);
  const [activePosterNote, setActivePosterNote] = useState<string>('');
  const [loadingResumeId, setLoadingResumeId] = useState<string | null>(null);
  const [isSavingNote, setIsSavingNote] = useState(false);

  if (!job) {
    return (
      <div className="py-20 text-center space-y-4">
        <p className="text-sm font-semibold text-[#0A0A0A]">Opportunity not found.</p>
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 bg-[#0A0A0A] text-white rounded-xl text-xs font-semibold"
        >
          Return to Opportunities
        </button>
      </div>
    );
  }

  // Get applications for this opportunity
  const currentApplications: OpportunityApplication[] = useMemo(() => {
    return opportunityApplications.filter(a => a.opportunityId === jobId);
  }, [opportunityApplications, jobId]);

  // Filtered applicants
  const filteredApplicants = useMemo(() => {
    return currentApplications.filter(app => {
      if (statusFilter !== 'all' && app.status !== statusFilter) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchName = app.applicantName.toLowerCase().includes(q);
        const matchDept = app.applicantDepartment.toLowerCase().includes(q);
        return matchName || matchDept;
      }
      return true;
    });
  }, [currentApplications, statusFilter, searchTerm]);

  const [applicantPage, setApplicantPage] = useState(1);
  const APPLICANT_PAGE_SIZE = 20;

  useEffect(() => {
    setApplicantPage(1);
  }, [statusFilter, searchTerm]);

  const totalApplicants = filteredApplicants.length;
  const totalApplicantPages = Math.max(1, Math.ceil(totalApplicants / APPLICANT_PAGE_SIZE));
  const paginatedApplicants = useMemo(() => {
    const start = (applicantPage - 1) * APPLICANT_PAGE_SIZE;
    return filteredApplicants.slice(start, start + APPLICANT_PAGE_SIZE);
  }, [filteredApplicants, applicantPage]);

  // Statistics
  const totalApps = currentApplications.length;
  const shortlistedApps = currentApplications.filter(a => a.status === 'shortlisted').length;
  const viewedApps = currentApplications.filter(a => a.status === 'viewed').length;
  const conversionRate = totalApps > 0 ? Math.round((shortlistedApps / totalApps) * 100) : 0;

  // Deadline calculation
  const daysRemaining = useMemo(() => {
    if (!job.applicationDeadline) return 0;
    const diff = new Date(job.applicationDeadline).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }, [job.applicationDeadline]);

  // Export CSV
  const handleExportCsv = async () => {
    const headers = ['Applicant Name', 'Email', 'Department', 'Grad Year', 'CGPA', 'Match %', 'Status', 'Applied At'];
    const rows = currentApplications.map(a => [
      a.applicantName,
      a.applicantEmail,
      a.applicantDepartment,
      a.applicantYear,
      '-',
      `${a.matchScore || 0}%`,
      a.status,
      new Date(a.appliedAt).toLocaleDateString('en-IN')
    ]);

    await exportCsvBlob(`${job.title.replace(/[^a-zA-Z0-9]/g, '_')}_Applicants.csv`, headers, rows);
  };

  const handleStatusChange = async (appId: string, nextStatus: OpportunityApplicationStatus) => {
    const targetApp = currentApplications.find(a => a.id === appId);
    await updateApplicationStatus(appId, nextStatus, targetApp?.posterNote);
    setNoticeMsg(`Applicant status updated to ${nextStatus}. Applicant has been notified.`);
    setTimeout(() => setNoticeMsg(null), 3000);
  };

  const handleOpenApplicant = (app: OpportunityApplication) => {
    setSelectedApplicant(app);
    setActivePosterNote(app.posterNote || '');
    if (app.status === 'submitted') {
      updateApplicationStatus(app.id, 'viewed', app.posterNote);
      setNoticeMsg(`Application for ${app.applicantName} marked as Viewed.`);
      setTimeout(() => setNoticeMsg(null), 3000);
    }
  };

  const handleViewResume = async (app: OpportunityApplication) => {
    if (!app.resumePath) return;
    setLoadingResumeId(app.id);
    try {
      const signedUrl = await jobsService.getSignedResumeUrl(app.resumePath);
      if (signedUrl) {
        window.open(signedUrl, '_blank', 'noopener,noreferrer');
      } else {
        alert('Could not generate signed URL for resume. The file may no longer exist or you may lack permissions.');
      }
    } catch (err) {
      console.error('Failed to open resume', err);
      alert('Error fetching resume file.');
    } finally {
      setLoadingResumeId(null);
    }
  };

  const handleSavePosterNote = async () => {
    if (!selectedApplicant) return;
    setIsSavingNote(true);
    try {
      await updateApplicationStatus(selectedApplicant.id, selectedApplicant.status, activePosterNote.trim() || undefined);
      setSelectedApplicant(prev => prev ? { ...prev, posterNote: activePosterNote.trim() || undefined } : null);
      setNoticeMsg('Private poster note saved.');
      setTimeout(() => setNoticeMsg(null), 3000);
    } finally {
      setIsSavingNote(false);
    }
  };

  const handleModalStatusChange = async (nextStatus: OpportunityApplicationStatus) => {
    if (!selectedApplicant) return;
    await updateApplicationStatus(selectedApplicant.id, nextStatus, activePosterNote.trim() || selectedApplicant.posterNote);
    setSelectedApplicant(prev => prev ? { ...prev, status: nextStatus } : null);
    setNoticeMsg(`Status updated to ${nextStatus}. Candidate has been notified.`);
    setTimeout(() => setNoticeMsg(null), 3500);
  };

  const handleMessageApplicant = (applicantId: string, applicantName: string) => {
    if (setPendingChatUserId) {
      setPendingChatUserId(applicantId);
    }
    // Direct link or push state
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', 'messaging');
      url.searchParams.set('chatUser', applicantId);
      window.history.pushState({}, '', url.toString());
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  const handleCloseJob = () => {
    if (window.confirm('Are you sure you want to close this posting? It will no longer receive new applications.')) {
      closeOpportunity(job.id, 'Closed by host');
      setNoticeMsg('Posting closed.');
      setTimeout(() => setNoticeMsg(null), 3000);
    }
  };

  return (
    <div className="space-y-6 font-sans antialiased text-[#0A0A0A] pb-20">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5E7EB]">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-1.5 text-[#6B7280] hover:text-[#0A0A0A] rounded-lg transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-100 text-[#0A0A0A] font-semibold">
                {job.type}
              </span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                  job.status === 'Active'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-neutral-100 text-[#6B7280]'
                }`}
              >
                {job.status === 'Active' ? 'Active & Published' : job.status}
              </span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-[#0A0A0A] font-outfit">
              {job.title}
            </h1>
            <p className="text-xs text-[#6B7280]">
              {job.company} • {job.location} • Closes {job.applicationDeadline ? formatDate(job.applicationDeadline) : '—'} ({daysRemaining} days left)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => onEdit(job.id)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[#6B7280] text-[#0A0A0A] rounded-xl text-xs font-semibold hover:border-[#0A0A0A] cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit Posting</span>
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[#6B7280] text-[#0A0A0A] rounded-xl text-xs font-semibold hover:border-[#0A0A0A] cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          {job.status === 'Active' && (
            <button
              type="button"
              onClick={handleCloseJob}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-rose-200 text-rose-700 hover:bg-rose-50 rounded-xl text-xs font-semibold cursor-pointer"
            >
              <Ban className="w-3.5 h-3.5" />
              <span>Close Posting</span>
            </button>
          )}
        </div>
      </div>

      {noticeMsg && (
        <div className="p-3 bg-neutral-900 text-white rounded-xl text-xs flex items-center justify-between">
          <span>{noticeMsg}</span>
          <button type="button" onClick={() => setNoticeMsg(null)} className="text-neutral-400 hover:text-white">
            ×
          </button>
        </div>
      )}

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white border border-[#E5E7EB] rounded-2xl space-y-1">
          <span className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">
            Total Applicants
          </span>
          <p className="text-2xl font-bold text-[#0A0A0A] font-mono">{totalApps}</p>
          <span className="text-[11px] text-[#6B7280]">Direct via NexaLink</span>
        </div>

        <div className="p-4 bg-white border border-[#E5E7EB] rounded-2xl space-y-1">
          <span className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">
            Shortlisted
          </span>
          <p className="text-2xl font-bold text-[#0A0A0A] font-mono">{shortlistedApps}</p>
          <span className="text-[11px] text-emerald-600 font-semibold">{conversionRate}% conversion</span>
        </div>

        <div className="p-4 bg-white border border-[#E5E7EB] rounded-2xl space-y-1">
          <span className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">
            Under Review
          </span>
          <p className="text-2xl font-bold text-[#0A0A0A] font-mono">{viewedApps}</p>
          <span className="text-[11px] text-[#6B7280]">Awaiting decision</span>
        </div>

        <div className="p-4 bg-white border border-[#E5E7EB] rounded-2xl space-y-1">
          <span className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">
            Deadline
          </span>
          <p className="text-2xl font-bold text-[#0A0A0A] font-mono">{daysRemaining}d</p>
          <span className="text-[11px] text-[#6B7280]">{job.applicationDeadline ? formatDate(job.applicationDeadline) : '—'}</span>
        </div>
      </div>

      {/* Tabs Row */}
      <div className="flex items-center gap-2 border-b border-[#E5E7EB]">
        {[
          { id: 'applicants', label: `Applicants (${totalApps})` },
          { id: 'details', label: 'Role & Eligibility Criteria' }
        ].map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as any)}
            className={`pb-2.5 px-3 text-xs font-semibold cursor-pointer border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-[#0A0A0A] text-[#0A0A0A]'
                : 'border-transparent text-[#6B7280] hover:text-[#0A0A0A]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Applicants */}
      {activeTab === 'applicants' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280]" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search applicants by name or dept..."
                className="w-full h-9 pl-9 pr-3 bg-white border border-[#6B7280] rounded-xl text-xs text-[#0A0A0A] placeholder-[#9CA3AF] focus:outline-none focus:border-[#0A0A0A]"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {[
                { id: 'all', label: 'All' },
                { id: 'submitted', label: 'Submitted' },
                { id: 'viewed', label: 'Viewed' },
                { id: 'shortlisted', label: 'Shortlisted' },
                { id: 'not_selected', label: 'Not selected' }
              ].map(st => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setStatusFilter(st.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                    statusFilter === st.id
                      ? 'bg-[#0A0A0A] text-white'
                      : 'border border-[#E5E7EB] bg-white text-[#6B7280] hover:text-[#0A0A0A]'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* Applicants Table */}
          <div className="bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden shadow-sm">
            {filteredApplicants.length === 0 ? (
              <div className="py-16 text-center text-xs text-[#6B7280]">
                No applicants found matching your filter criteria.
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAFAFA] border-b border-[#E5E7EB] text-[#6B7280] text-[11px] uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="py-3 px-4">Candidate</th>
                      <th className="py-3 px-4">Academic Details</th>
                      <th className="py-3 px-4">Match Score</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E7EB]">
                    {paginatedApplicants.map(app => (
                      <tr
                        key={app.id}
                        onClick={() => handleOpenApplicant(app)}
                        className="hover:bg-neutral-50/50 transition-colors cursor-pointer"
                      >
                        <td className="py-3.5 px-4">
                          <p className="font-bold text-[#0A0A0A]">{app.applicantName}</p>
                          <p className="text-[11px] text-[#6B7280]">{app.applicantEmail}</p>
                          {app.studentNote && (
                            <p className="text-[11px] text-[#0A0A0A] mt-1 italic line-clamp-1">
                              "{app.studentNote}"
                            </p>
                          )}
                          {app.posterNote && (
                            <p className="text-[10px] text-amber-900 mt-1 flex items-center gap-1 font-medium bg-amber-50 px-2 py-0.5 rounded border border-amber-200/60 inline-flex">
                              <Lock className="w-2.5 h-2.5" />
                              <span className="line-clamp-1">Note: {app.posterNote}</span>
                            </p>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-[#6B7280]">
                          <span className="font-semibold text-[#0A0A0A]">{app.applicantDepartment}</span>
                          <span> • Batch {app.applicantYear}</span>
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold font-mono ${
                              (app.matchScore || 0) >= 80
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : (app.matchScore || 0) >= 60
                                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                  : 'bg-neutral-100 text-[#6B7280]'
                            }`}
                          >
                            <Sparkles className="w-3 h-3" />
                            <span>{app.matchScore || 75}%</span>
                          </span>
                        </td>

                        <td className="py-3.5 px-4" onClick={e => e.stopPropagation()}>
                          <select
                            value={app.status}
                            onChange={e => handleStatusChange(app.id, e.target.value as OpportunityApplicationStatus)}
                            className="h-8 px-2 bg-white border border-[#6B7280] rounded-lg text-xs font-semibold text-[#0A0A0A] focus:outline-none focus:border-[#0A0A0A] cursor-pointer"
                          >
                            <option value="submitted">Submitted</option>
                            <option value="viewed">Viewed</option>
                            <option value="shortlisted">Shortlisted ✓</option>
                            <option value="not_selected">Not selected</option>
                          </select>
                        </td>

                        <td className="py-3.5 px-4 text-right space-x-2" onClick={e => e.stopPropagation()}>
                          {app.resumePath && (
                            <button
                              type="button"
                              onClick={() => handleViewResume(app)}
                              disabled={loadingResumeId === app.id}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-[#6B7280] text-[#0A0A0A] rounded-lg text-xs font-semibold hover:border-[#0A0A0A] cursor-pointer disabled:opacity-50"
                              title="Open candidate resume with verified signed URL"
                            >
                              {loadingResumeId === app.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <span>CV</span>
                              )}
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleOpenApplicant(app)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-[#0A0A0A] text-[#0A0A0A] rounded-lg text-xs font-semibold hover:bg-neutral-50 cursor-pointer"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Review</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleMessageApplicant(app.applicantId, app.applicantName)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#0A0A0A] text-white rounded-lg text-xs font-semibold hover:bg-neutral-800 cursor-pointer"
                          >
                            <Mail className="w-3 h-3" />
                            <span>Message</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls Bar */}
              <div className="p-3.5 border-t border-[#E5E7EB] bg-[#FAFAFA] flex items-center justify-between text-xs text-[#4B5563]">
                <span>
                  Showing {Math.min(paginatedApplicants.length, APPLICANT_PAGE_SIZE)} of {totalApplicants} applicants (Page {applicantPage} of {totalApplicantPages})
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={applicantPage <= 1}
                    onClick={() => setApplicantPage(p => Math.max(1, p - 1))}
                    className="px-3 py-1.5 rounded-lg border border-[#E5E7EB] bg-white hover:bg-[#F3F4F6] disabled:opacity-40 disabled:cursor-not-allowed font-medium text-xs transition"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={applicantPage >= totalApplicantPages}
                    onClick={() => setApplicantPage(p => Math.min(totalApplicantPages, p + 1))}
                    className="px-3 py-1.5 rounded-lg border border-[#E5E7EB] bg-white hover:bg-[#F3F4F6] disabled:opacity-40 disabled:cursor-not-allowed font-medium text-xs transition"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
          </div>
        </div>
      )}

      {/* Tab: Role & Eligibility */}
      {activeTab === 'details' && (
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <span className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider block mb-1">
                Compensation & Work Mode
              </span>
              <p className="text-base font-bold text-[#0A0A0A] font-sans tabular-nums">{job.stipendOrSalary}</p>
              <p className="text-xs text-[#6B7280] mt-0.5">
                {job.location} ({job.workMode || 'hybrid'})
              </p>
            </div>

            <div>
              <span className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider block mb-1">
                Application Deadline
              </span>
              <p className="text-base font-bold text-[#0A0A0A] font-mono">{job.applicationDeadline}</p>
              <p className="text-xs text-[#6B7280] mt-0.5">
                {daysRemaining > 0 ? `${daysRemaining} days remaining for submissions` : 'Deadline passed'}
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-[#E5E7EB] space-y-2">
            <span className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider block">
              Required Technical Stack
            </span>
            <div className="flex flex-wrap gap-2">
              {(job.skillsRequired || []).map(s => (
                <span key={s} className="px-3 py-1 bg-neutral-100 text-[#0A0A0A] rounded-lg text-xs font-semibold">
                  {s}
                </span>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-[#E5E7EB] space-y-2">
            <span className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider block">
              Role Description
            </span>
            <p className="text-xs text-[#0A0A0A] leading-relaxed whitespace-pre-line">
              {job.description}
            </p>
          </div>

          <div className="pt-4 border-t border-[#E5E7EB] space-y-2">
            <span className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider block">
              Requirements
            </span>
            <ul className="space-y-1.5 text-xs text-[#0A0A0A]">
              {(job.requirements || []).map((r, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-[#6B7280]">•</span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Candidate Review Modal */}
      {selectedApplicant && (
        <Modal
          isOpen={!!selectedApplicant}
          onClose={() => setSelectedApplicant(null)}
          title={`Candidate Application: ${selectedApplicant.applicantName}`}
          subtitle={`${job.title} at ${job.company}`}
          maxWidth="lg"
        >
          <div className="space-y-4 font-sans text-xs">
            {/* Top metadata */}
            <div className="p-3.5 bg-neutral-50 border border-neutral-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="font-bold text-sm text-[#0A0A0A]">{selectedApplicant.applicantName}</p>
                <p className="text-[#6B7280]">{selectedApplicant.applicantEmail}</p>
                <div className="flex items-center gap-2 mt-1 text-[11px] text-[#6B7280]">
                  <span>Dept: <strong className="text-[#0A0A0A] font-semibold">{selectedApplicant.applicantDepartment}</strong></span>
                  <span>•</span>
                  <span>Batch: <strong className="text-[#0A0A0A] font-semibold">{selectedApplicant.applicantYear}</strong></span>
                  <span>•</span>
                  <span>Applied: {new Date(selectedApplicant.appliedAt).toLocaleDateString('en-IN')}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {selectedApplicant.resumePath ? (
                  <button
                    type="button"
                    onClick={() => handleViewResume(selectedApplicant)}
                    disabled={loadingResumeId === selectedApplicant.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0A0A0A] text-white rounded-xl text-xs font-semibold hover:bg-neutral-800 cursor-pointer disabled:opacity-50"
                  >
                    {loadingResumeId === selectedApplicant.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <FileText className="w-3.5 h-3.5" />
                    )}
                    <span>View Resume (PDF)</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                ) : (
                  <span className="text-[11px] text-[#6B7280] italic">No resume on file</span>
                )}

                <button
                  type="button"
                  onClick={() => {
                    handleMessageApplicant(selectedApplicant.applicantId, selectedApplicant.applicantName);
                    setSelectedApplicant(null);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[#6B7280] text-[#0A0A0A] rounded-xl text-xs font-semibold hover:border-[#0A0A0A] cursor-pointer"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Message</span>
                </button>
              </div>
            </div>

            {/* Candidate Cover Note */}
            <div>
              <span className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider block mb-1.5">
                Cover Note from Candidate
              </span>
              <div className="p-3 bg-white border border-[#E5E7EB] rounded-xl text-xs text-[#0A0A0A] leading-relaxed whitespace-pre-line min-h-[60px]">
                {selectedApplicant.studentNote || (
                  <span className="text-[#9CA3AF] italic">The candidate did not provide an optional cover note.</span>
                )}
              </div>
            </div>

            {/* Review Status Selector */}
            <div>
              <span className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider block mb-1.5">
                Candidate Review Status
              </span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'viewed', label: 'Viewed · Under Review', icon: Eye, color: 'text-blue-700 bg-blue-50 border-blue-200' },
                  { id: 'shortlisted', label: 'Shortlisted', icon: CheckCircle2, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
                  { id: 'not_selected', label: 'Not Selected', icon: XCircle, color: 'text-rose-700 bg-rose-50 border-rose-200' }
                ].map(opt => {
                  const isCurrent = selectedApplicant.status === opt.id;
                  const Icon = opt.icon;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleModalStatusChange(opt.id as any)}
                      className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                        isCurrent
                          ? `${opt.color} ring-1 ring-black/10`
                          : 'border-[#E5E7EB] bg-white text-[#6B7280] hover:text-[#0A0A0A] hover:border-[#6B7280]'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <span>{opt.label}</span>
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-[#6B7280] mt-1.5">
                Updating review status automatically notifies the applicant in their portal and Opportunities feed.
              </p>
            </div>

            {/* Private Poster Note */}
            <div className="space-y-1.5 pt-2 border-t border-[#E5E7EB]">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider flex items-center gap-1">
                  <Lock className="w-3 h-3 text-[#6B7280]" />
                  <span>Private Poster Note</span>
                </span>
                <span className="text-[10px] text-[#9CA3AF]">
                  Only visible to you and institutional administrators
                </span>
              </div>
              <TextArea
                placeholder="Add evaluation comments, interview feedback, or next steps (e.g. Schedule round 2 interview on Tuesday)..."
                value={activePosterNote}
                onChange={e => setActivePosterNote(e.target.value)}
                rows={3}
              />
              <div className="flex justify-end pt-1">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSavePosterNote}
                  disabled={isSavingNote}
                >
                  {isSavingNote ? 'Saving note…' : 'Save private note'}
                </Button>
              </div>
            </div>

            <div className="pt-3 border-t border-[#E5E7EB] flex items-center justify-end">
              <Button
                variant="secondary"
                size="md"
                onClick={() => setSelectedApplicant(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
};

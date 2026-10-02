import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
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
  FileSpreadsheet
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
    const list = opportunityApplications.filter(a => a.opportunityId === jobId);
    if (list.length > 0) return list;
    // Fallback: If no application records in mock, provide simulated applicants matching candidates
    return [
      {
        id: `app-demo-1`,
        opportunityId: jobId,
        applicantId: 'user-student-1',
        applicantName: 'Aanya Sharma',
        applicantEmail: 'aanya.sharma@vit.edu.in',
        applicantDepartment: 'CMPN' as const,
        applicantYear: '2026',
        matchScore: 94,
        resumePath: 'https://nexalink.vit.edu.in/resumes/aanya-sharma.pdf',
        studentNote: 'I have hands-on experience building distributed systems in Go and TypeScript with Docker and Redis.',
        status: 'shortlisted',
        appliedAt: '2026-03-12T10:30:00Z'
      },
      {
        id: `app-demo-2`,
        opportunityId: jobId,
        applicantId: 'user-student-2',
        applicantName: 'Rohan Mehta',
        applicantEmail: 'rohan.mehta@vit.edu.in',
        applicantDepartment: 'INFT' as const,
        applicantYear: '2025',
        matchScore: 82,
        resumePath: 'https://nexalink.vit.edu.in/resumes/rohan-mehta.pdf',
        studentNote: 'Strong background in cloud infrastructure, AWS lambda, and full-stack web applications.',
        status: 'submitted',
        appliedAt: '2026-03-14T14:15:00Z'
      }
    ];
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
  const handleExportCsv = () => {
    const rows = [
      ['Opportunity', job.title],
      ['Company', job.company],
      ['Deadline', job.applicationDeadline],
      [],
      ['Applicant Name', 'Email', 'Department', 'Grad Year', 'CGPA', 'Match %', 'Status', 'Applied At']
    ];

    currentApplications.forEach(a => {
      rows.push([
        a.applicantName,
        a.applicantEmail,
        a.applicantDepartment,
        a.applicantYear,
        '-',
        `${a.matchScore || 0}%`,
        a.status,
        new Date(a.appliedAt).toLocaleDateString('en-IN')
      ]);
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${job.title.replace(/[^a-zA-Z0-9]/g, '_')}_Applicants.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleStatusChange = (appId: string, nextStatus: OpportunityApplicationStatus) => {
    updateApplicationStatus(appId, nextStatus);
    setNoticeMsg(`Applicant status updated to ${nextStatus}.`);
    setTimeout(() => setNoticeMsg(null), 3000);
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
              {job.company} • {job.location} • Closes {job.applicationDeadline} ({daysRemaining} days left)
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
          <span className="text-[11px] text-[#6B7280]">{job.applicationDeadline}</span>
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
              {['all', 'submitted', 'viewed', 'shortlisted', 'rejected'].map(st => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize whitespace-nowrap cursor-pointer transition-colors ${
                    statusFilter === st
                      ? 'bg-[#0A0A0A] text-white'
                      : 'border border-[#E5E7EB] bg-white text-[#6B7280] hover:text-[#0A0A0A]'
                  }`}
                >
                  {st}
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
                    {filteredApplicants.map(app => (
                      <tr key={app.id} className="hover:bg-neutral-50/50 transition-colors">
                        <td className="py-3.5 px-4">
                          <p className="font-bold text-[#0A0A0A]">{app.applicantName}</p>
                          <p className="text-[11px] text-[#6B7280]">{app.applicantEmail}</p>
                          {app.studentNote && (
                            <p className="text-[11px] text-[#0A0A0A] mt-1 italic line-clamp-1">
                              "{app.studentNote}"
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

                        <td className="py-3.5 px-4">
                          <select
                            value={app.status}
                            onChange={e => handleStatusChange(app.id, e.target.value as OpportunityApplicationStatus)}
                            className="h-8 px-2 bg-white border border-[#6B7280] rounded-lg text-xs font-semibold text-[#0A0A0A] focus:outline-none focus:border-[#0A0A0A] cursor-pointer"
                          >
                            <option value="submitted">Submitted</option>
                            <option value="viewed">Under Review</option>
                            <option value="shortlisted">Shortlisted ✓</option>
                            <option value="rejected">Not Selected</option>
                          </select>
                        </td>

                        <td className="py-3.5 px-4 text-right space-x-2">
                          {app.resumePath && (
                            <a
                              href={app.resumePath}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-[#6B7280] text-[#0A0A0A] rounded-lg text-xs font-semibold hover:border-[#0A0A0A] cursor-pointer"
                            >
                              <span>CV</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}

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
              <p className="text-base font-bold text-[#0A0A0A] font-mono">{job.stipendOrSalary}</p>
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
    </div>
  );
};

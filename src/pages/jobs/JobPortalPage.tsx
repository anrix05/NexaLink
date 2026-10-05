import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { RoleGate } from '../../components/common/RoleGate';
import type { JobListing, OpportunityType, StudentProfile, OpportunityApplication } from '../../types';
import { calculateOpportunityMatch } from '../../utils/recommendationEngine';
import { normalizeOpportunityType, OPPORTUNITY_TAXONOMY, type CanonicalOpportunityType } from '../../constants/taxonomy';
import { OpportunityRow } from '../../components/opportunities/OpportunityRow';
import { OpportunityDetailPanel } from '../../components/opportunities/OpportunityDetailPanel';
import { ApplyOpportunitySheet } from '../../components/opportunities/ApplyOpportunitySheet';
import { OpportunityComposerPage } from '../opportunities/OpportunityComposerPage';
import { OpportunityManageConsole } from '../opportunities/OpportunityManageConsole';
import {
  Search,
  Plus,
  Briefcase,
  RefreshCw,
  Sparkles,
  Bookmark,
  MapPin,
  X,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  FileText,
  ExternalLink,
  SlidersHorizontal
} from 'lucide-react';
import {
  Button,
  Modal,
  TextField,
  SelectField,
  TextArea,
  EmptyState
} from '../../components/common/UIComponents';

interface JobPortalPageProps {
  setActiveTab?: (tab: string) => void;
}

export const JobPortalPage: React.FC<JobPortalPageProps> = ({ setActiveTab }) => {
  const { jobsList, addJob, applyForJob, opportunityApplications, isDataLoading, setPendingChatUserId, savedOpportunityIds, toggleSaveOpportunity } = useData();
  const { currentUser, currentRole } = useAuth();

  const isHostRole = currentRole === 'alumni' || currentRole === 'faculty' || currentRole === 'admin';

  // Sub-view management: list, composer (new/edit), manage
  const [currentView, setCurrentView] = useState<'list' | 'composer' | 'manage'>(() => {
    if (typeof window === 'undefined') return 'list';
    const v = new URLSearchParams(window.location.search).get('view');
    if (v === 'new' || v === 'edit') return 'composer';
    if (v === 'manage') return 'manage';
    return 'list';
  });
  const [activeJobId, setActiveJobId] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return new URLSearchParams(window.location.search).get('jobId');
  });
  const [activePortalTab, setActivePortalTab] = useState<'all' | 'my_applications' | 'postings'>('all');

  const [activeTaxonomy, setActiveTaxonomy] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<string>('All');
  const [onlyMatchingSkills, setOnlyMatchingSkills] = useState(false);
  const [onlySaved, setOnlySaved] = useState(false);
  const [showMobileFiltersSheet, setShowMobileFiltersSheet] = useState(false);

  const activeFilterCount = useMemo(() => {
    return (selectedLocation !== 'All' ? 1 : 0) + (onlyMatchingSkills ? 1 : 0) + (onlySaved ? 1 : 0);
  }, [selectedLocation, onlyMatchingSkills, onlySaved]);

  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [showPostJobModal, setShowPostJobModal] = useState(false);
  const savedJobIds = savedOpportunityIds;

  // Apply modal & feedback states
  const [applyingJob, setApplyingJob] = useState<JobListing | null>(null);
  const [applySuccessMsg, setApplySuccessMsg] = useState<string | null>(null);
  const [toastWarningMsg, setToastWarningMsg] = useState<string | null>(null);

  const showToastWarning = (msg: string) => {
    setToastWarningMsg(msg);
    setTimeout(() => setToastWarningMsg(null), 4000);
  };

  // Map of job_id -> application submitted by the logged-in student
  const appliedJobMap = useMemo(() => {
    const map = new Map<string, OpportunityApplication>();
    if (currentUser?.id) {
      opportunityApplications
        .filter(a => a.applicantId === currentUser.id)
        .forEach(a => map.set(a.opportunityId, a));
    }
    return map;
  }, [opportunityApplications, currentUser?.id]);

  // List of all applications submitted by current user
  const myApplications = useMemo(() => {
    if (!currentUser?.id) return [];
    return opportunityApplications.filter(a => a.applicantId === currentUser.id);
  }, [opportunityApplications, currentUser?.id]);

  const [isMobileScreen, setIsMobileScreen] = useState<boolean>(
    () => typeof window !== 'undefined' && window.innerWidth < 1024
  );
  const [isCompactDesktop, setIsCompactDesktop] = useState<boolean>(
    () => typeof window !== 'undefined' && window.innerWidth >= 1024 && window.innerWidth < 1280
  );

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Resize handler for responsive master-detail layout
  useEffect(() => {
    const handleResize = () => {
      if (typeof window === 'undefined') return;
      setIsMobileScreen(window.innerWidth < 1024);
      setIsCompactDesktop(window.innerWidth >= 1024 && window.innerWidth < 1280);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // URL state synchronization: ?tab=opportunities&job=<id> and ?view=new|manage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const jobParam = params.get('job');
    const viewParam = params.get('view');
    const jobIdParam = params.get('jobId');
    const subtabParam = params.get('subtab');

    if (viewParam === 'new') {
      setCurrentView('composer');
      setActiveJobId(null);
    } else if (viewParam === 'edit' && jobIdParam) {
      setCurrentView('composer');
      setActiveJobId(jobIdParam);
    } else if (viewParam === 'manage' && jobIdParam) {
      setCurrentView('manage');
      setActiveJobId(jobIdParam);
    } else if (subtabParam === 'postings' && isHostRole) {
      setActivePortalTab('postings');
    } else if (jobParam) {
      setSelectedJobId(jobParam);
    }

    const handlePopState = () => {
      const p = new URLSearchParams(window.location.search);
      const v = p.get('view');
      const j = p.get('jobId');
      if (v === 'new') {
        setCurrentView('composer');
        setActiveJobId(null);
      } else if (v === 'edit' && j) {
        setCurrentView('composer');
        setActiveJobId(j);
      } else if (v === 'manage' && j) {
        setCurrentView('manage');
        setActiveJobId(j);
      } else {
        setCurrentView('list');
        setActiveJobId(null);
        setSelectedJobId(p.get('job'));
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isHostRole]);

  const handleSelectJob = (id: string) => {
    setSelectedJobId(id);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('job', id);
      window.history.pushState({}, '', url.toString());
    }
  };

  const handleClosePanel = () => {
    setSelectedJobId(null);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('job');
      window.history.pushState({}, '', url.toString());
    }
  };

  const handleOpenComposer = (jobId?: string) => {
    setActiveJobId(jobId || null);
    setCurrentView('composer');
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('view', jobId ? 'edit' : 'new');
      if (jobId) url.searchParams.set('jobId', jobId);
      else url.searchParams.delete('jobId');
      window.history.pushState({}, '', url.toString());
    }
  };

  const handleOpenManage = (jobId: string) => {
    setActiveJobId(jobId);
    setCurrentView('manage');
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('view', 'manage');
      url.searchParams.set('jobId', jobId);
      window.history.pushState({}, '', url.toString());
    }
  };

  // New Opportunity Form State
  const [newTitle, setNewTitle] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newType, setNewType] = useState<OpportunityType>('Job Vacancy');
  const [newSalary, setNewSalary] = useState('');
  const [newDeadline, setNewDeadline] = useState('2026-11-30');
  const [newDescription, setNewDescription] = useState('');

  const isStudent = currentUser?.role === 'student';
  const studentProfile = currentUser as StudentProfile;

  const publishedJobs = useMemo(() => {
    return jobsList.filter(
      j => j.status !== 'Closed' &&
        (!j.moderationStatus || j.moderationStatus === 'Approved' || j.postedByRole === 'admin' || currentRole === 'admin')
    );
  }, [jobsList, currentRole]);

  // Extract distinct locations for dropdown filter
  const locationsList = useMemo(() => {
    const locSet = new Set<string>();
    publishedJobs.forEach(j => {
      if (j.location) {
        const city = j.location.split('/')[0].split(',')[0].trim();
        if (city) locSet.add(city);
      }
    });
    return Array.from(locSet).sort();
  }, [publishedJobs]);

  // Match scores map for students
  const matchScoresMap = useMemo(() => {
    const map = new Map<string, number>();
    if (!isStudent || !studentProfile) return map;
    publishedJobs.forEach(job => {
      const res = calculateOpportunityMatch(studentProfile, job);
      map.set(job.id, res.score);
    });
    return map;
  }, [publishedJobs, isStudent, studentProfile]);

  // Filtered jobs
  const filteredJobs = useMemo(() => {
    return publishedJobs.filter(job => {
      // 1. Taxonomy pill filter
      if (activeTaxonomy !== 'All') {
        const norm = normalizeOpportunityType(job.type).toLowerCase();
        if (norm !== activeTaxonomy.toLowerCase()) return false;
      }

      // 2. Location filter
      if (selectedLocation !== 'All') {
        if (!job.location.toLowerCase().includes(selectedLocation.toLowerCase())) {
          return false;
        }
      }

      // 3. "Matches my skills" toggle (only >= 60%)
      if (onlyMatchingSkills) {
        const score = matchScoresMap.get(job.id) || 0;
        if (score < 60) return false;
      }

      // 4. Saved filter
      if (onlySaved && !savedJobIds.includes(job.id)) {
        return false;
      }

      // 5. Search query
      if (searchTerm.trim() !== '') {
        const q = searchTerm.toLowerCase();
        const matchTitle = job.title.toLowerCase().includes(q);
        const matchCompany = job.company.toLowerCase().includes(q);
        const matchLocation = job.location.toLowerCase().includes(q);
        const matchSkills = job.skillsRequired?.some(s => s.toLowerCase().includes(q));
        return matchTitle || matchCompany || matchLocation || matchSkills;
      }

      return true;
    });
  }, [
    publishedJobs,
    activeTaxonomy,
    selectedLocation,
    onlyMatchingSkills,
    onlySaved,
    savedJobIds,
    matchScoresMap,
    searchTerm
  ]);

  const selectedJob = useMemo(() => {
    if (!selectedJobId) return null;
    return publishedJobs.find(j => j.id === selectedJobId) || null;
  }, [publishedJobs, selectedJobId]);

  const handleApply = (jobId: string) => {
    const targetJob = jobsList.find(j => j.id === jobId);
    if (!targetJob) return;

    if (!currentUser?.id) {
      showToastWarning('Please log in to apply for opportunities.');
      return;
    }

    if (!currentUser.isVerified) {
      showToastWarning('Only verified institutional members may apply for opportunities. Please complete your profile verification.');
      return;
    }

    if (targetJob.postedByAlumniId === currentUser.id) {
      showToastWarning('You cannot apply to an opportunity you published.');
      return;
    }

    if (targetJob.status === 'Closed' || targetJob.lifecycleStatus === 'closed') {
      showToastWarning('This opportunity is closed and no longer accepting applications.');
      return;
    }

    if (targetJob.applicationDeadline) {
      const deadline = new Date(targetJob.applicationDeadline);
      deadline.setHours(23, 59, 59, 999);
      if (Date.now() > deadline.getTime()) {
        showToastWarning('The application deadline for this opportunity has passed.');
        return;
      }
    }

    if (appliedJobMap.has(jobId)) {
      showToastWarning('You have already submitted an application for this opportunity.');
      return;
    }

    setApplyingJob(targetJob);
  };

  const handleToggleSaveJob = (e: React.MouseEvent, jobId: string) => {
    e.stopPropagation();
    toggleSaveOpportunity(jobId);
  };

  const handleMessagePoster = (posterId?: string) => {
    if (!posterId) return;
    setPendingChatUserId(posterId);
    if (setActiveTab) {
      setActiveTab('messaging');
    }
  };

  const handlePostJobSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newCompany) return;

    const isAdmin = currentRole === 'admin';

    const res = addJob({
      title: newTitle,
      company: newCompany,
      companyLogo: 'https://images.unsplash.com/photo-1549923746-c502d488b3ea?w=100&auto=format&fit=crop&q=80',
      location: newLocation || 'Mumbai / Remote',
      type: newType,
      stipendOrSalary: newSalary || 'Stipend / Salary provided',
      department: ['CMPN', 'INFT', 'EXTC'],
      skillsRequired: ['Problem Solving', 'Technical Skills'],
      postedByAlumniId: currentUser.id,
      postedByAlumniName: `${currentUser.name} (${currentUser.role})`,
      postedByRole: currentUser.role as any,
      applicationDeadline: newDeadline || '2026-11-30',
      description: newDescription || 'Opportunity published by institutional member.',
      requirements: ['Enrolled student or alumni of VIT Wadala'],
      referralProvided: true
    }, currentRole);

    if (!res.success) {
      alert(`Role error: ${res.error}`);
      return;
    }

    setShowPostJobModal(false);
    setNewTitle('');
    setNewCompany('');
    setNewLocation('');
    setNewSalary('');
    setNewDescription('');

    if (isAdmin) {
      setApplySuccessMsg('Opportunity published directly to institutional feeds.');
    } else {
      setApplySuccessMsg('Opportunity submitted to admin queue for moderation.');
    }
    setTimeout(() => setApplySuccessMsg(null), 4500);
  };

  const hostJobs = useMemo(() => {
    return jobsList.filter(
      j => j.postedByAlumniId === currentUser?.id || currentRole === 'admin'
    );
  }, [jobsList, currentUser?.id, currentRole]);

  if (currentView === 'composer') {
    return (
      <OpportunityComposerPage
        opportunityId={activeJobId}
        onBack={() => {
          setCurrentView('list');
          setActiveJobId(null);
          if (typeof window !== 'undefined') {
            const url = new URL(window.location.href);
            url.searchParams.delete('view');
            url.searchParams.delete('jobId');
            window.history.pushState({}, '', url.toString());
          }
        }}
        onSuccess={(job) => {
          setCurrentView('list');
          setActiveJobId(null);
          setApplySuccessMsg(`Opportunity "${job.title}" saved successfully.`);
          setTimeout(() => setApplySuccessMsg(null), 4500);
          if (typeof window !== 'undefined') {
            const url = new URL(window.location.href);
            url.searchParams.delete('view');
            url.searchParams.delete('jobId');
            window.history.pushState({}, '', url.toString());
          }
        }}
      />
    );
  }

  if (currentView === 'manage' && activeJobId) {
    return (
      <OpportunityManageConsole
        jobId={activeJobId}
        onBack={() => {
          setCurrentView('list');
          setActiveJobId(null);
          if (typeof window !== 'undefined') {
            const url = new URL(window.location.href);
            url.searchParams.delete('view');
            url.searchParams.delete('jobId');
            window.history.pushState({}, '', url.toString());
          }
        }}
        onEdit={(id) => handleOpenComposer(id)}
      />
    );
  }

  const taxonomyOptions = [
    { id: 'All', label: 'All opportunities' },
    { id: 'Full-time', label: 'Full-time' },
    { id: 'Internship', label: 'Internship' },
    { id: 'Referral', label: 'Referral' },
    { id: 'Research', label: 'Research' }
  ];

  return (
    <div className="space-y-6 font-sans text-xs">

      {/* Header Bar: Title, Description, and Post Opportunity */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0A0A0A] tracking-tight">
            Opportunities
          </h1>
          <p className="text-xs text-[#6B7280] mt-1">
            Explore career referrals, internships, and research opportunities published by alumni and faculty.
          </p>
        </div>

        <RoleGate allow={['alumni', 'faculty', 'admin']}>
          <Button
            variant="primary"
            size="md"
            onClick={() => handleOpenComposer()}
            icon={<Plus className="w-4 h-4" />}
            className="self-start sm:self-auto shrink-0"
          >
            Post opportunity
          </Button>
        </RoleGate>
      </div>

      {/* Opportunities Sub-tabs: All opportunities, My applications (count), Your postings (for host/admin) */}
      <div className="flex items-center gap-2 border-b border-[#E5E7EB]">
        <button
          type="button"
          onClick={() => setActivePortalTab('all')}
          className={`pb-2.5 px-3 text-xs font-semibold cursor-pointer border-b-2 transition-colors ${
            activePortalTab === 'all'
              ? 'border-[#0A0A0A] text-[#0A0A0A]'
              : 'border-transparent text-[#6B7280] hover:text-[#0A0A0A]'
          }`}
        >
          All opportunities
        </button>
        <button
          type="button"
          onClick={() => setActivePortalTab('my_applications')}
          className={`pb-2.5 px-3 text-xs font-semibold cursor-pointer border-b-2 transition-colors flex items-center gap-1.5 ${
            activePortalTab === 'my_applications'
              ? 'border-[#0A0A0A] text-[#0A0A0A]'
              : 'border-transparent text-[#6B7280] hover:text-[#0A0A0A]'
          }`}
        >
          <span>My applications</span>
          {myApplications.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-neutral-100 text-[#0A0A0A] font-mono">
              {myApplications.length}
            </span>
          )}
        </button>
        {isHostRole && (
          <button
            type="button"
            onClick={() => setActivePortalTab('postings')}
            className={`pb-2.5 px-3 text-xs font-semibold cursor-pointer border-b-2 transition-colors flex items-center gap-1.5 ${
              activePortalTab === 'postings'
                ? 'border-[#0A0A0A] text-[#0A0A0A]'
                : 'border-transparent text-[#6B7280] hover:text-[#0A0A0A]'
            }`}
          >
            <span>Your postings</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-neutral-100 text-[#0A0A0A] font-mono">
              {hostJobs.length}
            </span>
          </button>
        )}
      </div>

      {toastWarningMsg && (
        <div className="p-3.5 bg-amber-50 border border-amber-200 text-amber-950 text-xs font-medium rounded-xl flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
            <span>{toastWarningMsg}</span>
          </div>
          <button onClick={() => setToastWarningMsg(null)} className="text-amber-800 hover:text-amber-950 p-1">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {applySuccessMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs font-medium rounded-xl flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#065F46] shrink-0" />
            <span>{applySuccessMsg}</span>
          </div>
          <button onClick={() => setApplySuccessMsg(null)} className="text-emerald-800 hover:text-emerald-950 p-1">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {activePortalTab === 'my_applications' ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-[#6B7280]">
              Showing <strong className="text-[#0A0A0A] font-semibold">{myApplications.length}</strong> applications submitted by you.
            </p>
          </div>

          {myApplications.length === 0 ? (
            <div className="bg-white border border-[#E5E7EB] rounded-2xl p-12 text-center space-y-3">
              <FileText className="w-8 h-8 text-[#9CA3AF] mx-auto opacity-50" />
              <h3 className="text-sm font-bold text-[#0A0A0A]">No applications yet</h3>
              <p className="text-xs text-[#6B7280] max-w-sm mx-auto">
                Explore full-time roles, internships, or research opportunities published by alumni and faculty.
              </p>
              <Button
                variant="primary"
                size="md"
                onClick={() => setActivePortalTab('all')}
              >
                Explore opportunities
              </Button>
            </div>
          ) : (
            <div className="bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden shadow-none divide-y divide-[#E5E7EB]">
              {myApplications.map((app) => {
                const targetJob = jobsList.find(j => j.id === app.opportunityId);
                const appliedDateStr = new Date(app.appliedAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                });

                const statusBadge = (() => {
                  switch (app.status) {
                    case 'viewed':
                      return (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                          <Clock className="w-3 h-3" />
                          Viewed · Under review
                        </span>
                      );
                    case 'shortlisted':
                      return (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          Shortlisted
                        </span>
                      );
                    case 'not_selected':
                      return (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                          Not selected
                        </span>
                      );
                    case 'submitted':
                    default:
                      return (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-neutral-100 text-[#0A0A0A] border border-[#E5E7EB]">
                          Submitted
                        </span>
                      );
                  }
                })();

                return (
                  <div key={app.id} className="p-4 sm:p-5 flex flex-col gap-3 hover:bg-neutral-50/50 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-[#0A0A0A]">
                            {targetJob?.title || 'Opportunity'}
                          </span>
                          {targetJob?.company && (
                            <span className="text-xs font-medium text-[#6B7280]">
                              at {targetJob.company}
                            </span>
                          )}
                          {statusBadge}
                        </div>

                        <div className="flex items-center gap-3 text-[11px] text-[#6B7280] flex-wrap">
                          {targetJob?.location && <span>{targetJob.location}</span>}
                          {targetJob?.type && <span>• {targetJob.type}</span>}
                          <span>• Applied {appliedDateStr}</span>
                          {targetJob?.postedByAlumniName && (
                            <span>• Posted by {targetJob.postedByAlumniName}</span>
                          )}
                        </div>
                      </div>

                      {targetJob && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setActivePortalTab('all');
                            setSelectedJobId(targetJob.id);
                          }}
                          className="self-start shrink-0"
                        >
                          View opportunity
                        </Button>
                      )}
                    </div>

                    {app.studentNote && (
                      <div className="text-xs text-[#4B5563] bg-neutral-50 border border-neutral-100 rounded-lg p-2.5">
                        <span className="font-semibold text-[#0A0A0A]">Cover note: </span>
                        <span>"{app.studentNote}"</span>
                      </div>
                    )}

                    {app.posterNote && (
                      <div className="text-xs bg-amber-50/70 border border-amber-200 text-amber-950 rounded-lg p-3 space-y-1">
                        <div className="flex items-center gap-1.5 font-semibold text-amber-900">
                          <FileText className="w-3.5 h-3.5" />
                          <span>Note from publisher</span>
                        </div>
                        <p className="text-amber-950">{app.posterNote}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : activePortalTab === 'postings' ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-[#6B7280]">
              Showing <strong className="text-[#0A0A0A] font-semibold">{hostJobs.length}</strong> postings authored by you or managed under institutional administration.
            </p>
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleOpenComposer()}
              icon={<Plus className="w-3.5 h-3.5" />}
            >
              Post opportunity
            </Button>
          </div>

          {hostJobs.length === 0 ? (
            <div className="bg-white border border-[#E5E7EB] rounded-2xl p-12 text-center space-y-3">
              <Briefcase className="w-8 h-8 text-[#6B7280] mx-auto opacity-50" />
              <h3 className="text-sm font-bold text-[#0A0A0A]">No postings yet</h3>
              <p className="text-xs text-[#6B7280] max-w-sm mx-auto">
                Share full-time roles, internships, or faculty research openings with verified VIT students.
              </p>
              <Button
                variant="primary"
                size="md"
                onClick={() => handleOpenComposer()}
                icon={<Plus className="w-4 h-4" />}
              >
                Post opportunity
              </Button>
            </div>
          ) : (
            <div className="bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden shadow-none divide-y divide-[#E5E7EB]">
              {hostJobs.map(j => {
                const isLive = j.status === 'Active';
                const isUnderReview = j.status === 'Pending Approval' || j.moderationStatus === 'Pending Approval';
                const isDraft = j.lifecycleStatus === 'draft';

                return (
                  <div key={j.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-neutral-50/50 transition-colors">
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-100 text-[#0A0A0A] font-semibold">
                          {j.type}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                            isLive
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : isUnderReview
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : isDraft
                                  ? 'bg-neutral-100 text-[#6B7280]'
                                  : 'bg-neutral-100 text-neutral-500'
                          }`}
                        >
                          {isLive ? 'Active & Published' : isUnderReview ? 'Under Review' : isDraft ? 'Draft' : 'Closed'}
                        </span>
                        {j.referralProvided && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200">
                            Referral
                          </span>
                        )}
                      </div>

                      <h3 className="text-sm font-bold text-[#0A0A0A] tracking-tight truncate">
                        {j.title}
                      </h3>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-[#6B7280]">
                        <span className="font-semibold text-[#0A0A0A]">{j.company}</span>
                        <span>•</span>
                        <span>{j.location}</span>
                        <span>•</span>
                        <span className="font-mono text-[#0A0A0A]">{j.stipendOrSalary}</span>
                        <span>•</span>
                        <span>Closes {j.applicationDeadline}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
                      <div className="text-right mr-2 hidden sm:block">
                        <span className="text-xs font-bold text-[#0A0A0A] font-mono">{j.applicantsCount || 0}</span>
                        <span className="text-[11px] text-[#6B7280] block">applicants</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleOpenManage(j.id)}
                        className="px-3.5 py-1.5 bg-[#0A0A0A] text-white rounded-xl text-xs font-semibold hover:bg-neutral-800 transition-colors cursor-pointer"
                      >
                        Manage
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenComposer(j.id)}
                        className="px-3 py-1.5 border border-[#6B7280] text-[#0A0A0A] rounded-xl text-xs font-semibold hover:border-[#0A0A0A] transition-colors cursor-pointer"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Mobile Filter Area (Unboxed, single scrollable chip row, filters button) */}
          <div className="space-y-3 sm:hidden">
            {/* Search Field */}
            <div className="relative w-full">
              <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3.5 top-3 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search roles or companies"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-10 pl-9 pr-9 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl text-xs font-normal text-[#0A0A0A] focus:outline-none focus:border-[#0A0A0A] transition-colors placeholder:text-[#9CA3AF]"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    searchInputRef.current?.focus();
                  }}
                  className="absolute right-3 top-3 text-[#9CA3AF] hover:text-[#0A0A0A]"
                  title="Clear search"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Horizontal Snap-Scroll Type Chips + Single "Filters" Button */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1 min-w-0 overflow-hidden">
                <div className="flex items-center gap-1.5 overflow-x-auto snap-x snap-mandatory py-0.5 no-scrollbar scroll-smooth">
                  {taxonomyOptions.map((opt) => {
                    const isSelected = activeTaxonomy === opt.id;
                    const labelText = opt.id === 'All' ? 'All' : opt.label;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setActiveTaxonomy(opt.id)}
                        className={`snap-start shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer touch-target-44 select-none ${
                          isSelected
                            ? 'bg-[#0A0A0A] text-white shadow-2xs font-semibold'
                            : 'bg-[#F3F4F6] text-[#6B7280] hover:text-[#0A0A0A] hover:bg-[#E5E7EB]'
                        }`}
                      >
                        {labelText}
                      </button>
                    );
                  })}
                </div>
                {/* Edge fade */}
                <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-white to-transparent" />
              </div>

              {/* Single "Filters" Button with Active Count Badge */}
              <button
                type="button"
                onClick={() => setShowMobileFiltersSheet(true)}
                className={`shrink-0 h-9 px-3 rounded-full border text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer touch-target-44 ${
                  activeFilterCount > 0
                    ? 'bg-[#0A0A0A] text-white border-[#0A0A0A]'
                    : 'bg-white text-[#0A0A0A] border-[#E5E7EB] hover:bg-[#F9FAFB]'
                }`}
                aria-label="Open filter settings"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Filters</span>
                {activeFilterCount > 0 && (
                  <span className="min-w-[16px] h-4 px-1 rounded-full bg-white text-[#0A0A0A] text-[10px] font-bold flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Desktop Single-Row Control Bar: Search + Taxonomy Pills + Location + Skill Matches + Saved */}
          <div className="hidden sm:flex bg-white border border-[#E5E7EB] rounded-2xl p-3 px-4 flex-col md:flex-row md:items-center justify-between gap-3 shadow-none">
        
            {/* Left: Search input */}
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3.5 top-2.5 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search by title, company, location, or skill..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-9 pl-9 pr-8 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl text-xs font-normal text-[#0A0A0A] focus:outline-none focus:border-[#0A0A0A] transition-colors placeholder:text-[#9CA3AF]"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    searchInputRef.current?.focus();
                  }}
                  className="absolute right-2.5 top-2.5 text-[#9CA3AF] hover:text-[#0A0A0A]"
                  title="Clear search"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Right: Taxonomy Pills + Location + Toggles */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Taxonomy Pills */}
              <div className="flex items-center border border-[#E5E7EB] rounded-xl p-0.5 bg-[#F9FAFB]">
                {taxonomyOptions.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setActiveTaxonomy(opt.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      activeTaxonomy === opt.id
                        ? 'bg-[#0A0A0A] text-white shadow-2xs'
                        : 'text-[#6B7280] hover:text-[#0A0A0A]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* Location Select Dropdown */}
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="h-9 px-3 bg-white border border-[#E5E7EB] rounded-xl text-xs font-medium text-[#0A0A0A] focus:outline-none focus:border-[#0A0A0A] cursor-pointer"
              >
                <option value="All">All locations</option>
                {locationsList.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>

              {/* "Matches my skills" Toggle (Student only) */}
              {isStudent && (
                <button
                  type="button"
                  onClick={() => setOnlyMatchingSkills((prev) => !prev)}
                  className={`h-9 px-3 rounded-xl border text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                    onlyMatchingSkills
                      ? 'bg-[#0A0A0A] text-white border-[#0A0A0A]'
                      : 'bg-white text-[#6B7280] border-[#E5E7EB] hover:text-[#0A0A0A] hover:bg-[#F9FAFB]'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Matching skills</span>
                </button>
              )}

              {/* "Saved" Filter Toggle */}
              <button
                type="button"
                onClick={() => setOnlySaved((prev) => !prev)}
                className={`h-9 px-3 rounded-xl border text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                  onlySaved
                    ? 'bg-[#0A0A0A] text-white border-[#0A0A0A]'
                    : 'bg-white text-[#6B7280] border-[#E5E7EB] hover:text-[#0A0A0A] hover:bg-[#F9FAFB]'
                }`}
              >
                <Bookmark className={`w-3.5 h-3.5 ${onlySaved ? 'fill-current' : ''}`} />
                <span>Saved ({savedJobIds.length})</span>
              </button>
            </div>

          </div>

          {/* Mobile Filters Bottom Sheet */}
          {showMobileFiltersSheet && (
            <div
              role="dialog"
              aria-modal="true"
              className="fixed inset-0 z-50 bg-[#0A0A0A]/40 backdrop-blur-xs flex flex-col justify-end"
              onClick={() => setShowMobileFiltersSheet(false)}
            >
              <div
                onClick={(e) => e.stopPropagation()}
                className="bg-white w-full rounded-t-2xl border-t border-[#E5E7EB] shadow-2xl p-5 space-y-4 animate-in slide-in-from-bottom duration-200 pb-[max(1.25rem,env(safe-area-inset-bottom))]"
              >
                {/* Drag handle */}
                <div className="w-12 h-1 bg-neutral-300 rounded-full mx-auto" />

                <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
                  <h3 className="font-bold text-sm text-[#0A0A0A]">Filter opportunities</h3>
                  <button
                    type="button"
                    onClick={() => setShowMobileFiltersSheet(false)}
                    className="p-1 rounded-lg text-[#6B7280] hover:text-[#0A0A0A]"
                    aria-label="Close filters"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Location Dropdown */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#0A0A0A] block">Location</label>
                    <select
                      value={selectedLocation}
                      onChange={(e) => setSelectedLocation(e.target.value)}
                      className="w-full h-10 px-3 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl text-xs font-medium text-[#0A0A0A] focus:outline-none focus:border-[#0A0A0A]"
                    >
                      <option value="All">All locations</option>
                      {locationsList.map((loc) => (
                        <option key={loc} value={loc}>
                          {loc}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Matching Skills Toggle (Student only) */}
                  {isStudent && (
                    <div className="flex items-center justify-between p-3 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB]">
                      <div className="space-y-0.5">
                        <span className="text-xs font-semibold text-[#0A0A0A] block">Matching skills</span>
                        <span className="text-[11px] text-[#6B7280] block">Show opportunities with &ge;60% match</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setOnlyMatchingSkills(prev => !prev)}
                        className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                          onlyMatchingSkills ? 'bg-[#0A0A0A]' : 'bg-neutral-300'
                        }`}
                        aria-pressed={onlyMatchingSkills}
                      >
                        <span
                          className={`block w-5 h-5 rounded-full bg-white transition-transform ${
                            onlyMatchingSkills ? 'translate-x-5' : 'translate-x-0.5'
                          }`}
                        />
                      </button>
                    </div>
                  )}

                  {/* Saved Jobs Toggle */}
                  <div className="flex items-center justify-between p-3 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB]">
                    <div className="space-y-0.5">
                      <span className="text-xs font-semibold text-[#0A0A0A] block">Saved only</span>
                      <span className="text-[11px] text-[#6B7280] block">Show bookmarked jobs ({savedJobIds.length})</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setOnlySaved(prev => !prev)}
                      className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                        onlySaved ? 'bg-[#0A0A0A]' : 'bg-neutral-300'
                      }`}
                      aria-pressed={onlySaved}
                    >
                      <span
                        className={`block w-5 h-5 rounded-full bg-white transition-transform ${
                          onlySaved ? 'translate-x-5' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Action Footer */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedLocation('All');
                      setOnlyMatchingSkills(false);
                      setOnlySaved(false);
                    }}
                    className="py-2.5 px-4 rounded-xl border border-[#E5E7EB] text-xs font-medium text-[#6B7280] hover:text-[#0A0A0A] transition-colors"
                  >
                    Reset
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowMobileFiltersSheet(false)}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-[#0A0A0A] text-white text-xs font-semibold hover:bg-neutral-800 transition-colors"
                  >
                    Show {filteredJobs.length} opportunities
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Main Master-Detail Area */}
          <div className="flex items-start gap-6 relative min-h-[500px]">
            {/* Left Column: Hairline Opportunity Rows (Unboxed on mobile, safe bottom padding) */}
            <div className="flex-1 bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden shadow-none pb-[calc(var(--bottomnav-h,56px)+env(safe-area-inset-bottom,0px)+32px)] sm:pb-0">
          <div className="p-3.5 px-5 border-b border-[#E5E7EB] flex items-center justify-between text-xs text-[#6B7280] bg-white">
            <span>
              Showing <strong className="text-[#0A0A0A] font-semibold">{filteredJobs.length}</strong> opportunities
            </span>
            {(activeTaxonomy !== 'All' || selectedLocation !== 'All' || onlyMatchingSkills || onlySaved || searchTerm) && (
              <button
                onClick={() => {
                  setActiveTaxonomy('All');
                  setSelectedLocation('All');
                  setOnlyMatchingSkills(false);
                  setOnlySaved(false);
                  setSearchTerm('');
                }}
                className="text-xs text-[#0A0A0A] font-medium hover:underline flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Reset filters</span>
              </button>
            )}
          </div>

          {isDataLoading ? (
            <div className="py-20 flex flex-col items-center justify-center text-center space-y-3">
              <div className="animate-spin rounded-full h-7 w-7 border-2 border-[#0A0A0A] border-t-transparent" />
              <p className="text-xs text-[#6B7280]">Loading opportunities…</p>
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="py-16 text-center text-[#6B7280] p-6 space-y-2">
              <Briefcase className="w-8 h-8 text-[#9CA3AF] mx-auto mb-2 opacity-50" />
              <h3 className="font-semibold text-sm text-[#0A0A0A]">
                No matching opportunities found
              </h3>
              <p className="text-xs text-[#6B7280] max-w-sm mx-auto">
                Try adjusting your search criteria, clearing the category filter, or resetting the location filter.
              </p>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setActiveTaxonomy('All');
                  setSelectedLocation('All');
                  setOnlyMatchingSkills(false);
                  setOnlySaved(false);
                  setSearchTerm('');
                }}
                className="mt-3"
              >
                Clear all filters
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-[#E5E7EB]">
              {filteredJobs.map((job) => {
                const isSelected = job.id === selectedJobId;
                const isSaved = savedJobIds.includes(job.id);
                const isApplied = appliedJobMap.has(job.id);
                const application = appliedJobMap.get(job.id);
                const matchScore = matchScoresMap.get(job.id);

                return (
                  <OpportunityRow
                    key={job.id}
                    job={job}
                    isSelected={isSelected}
                    isSaved={isSaved}
                    isApplied={isApplied}
                    applicationStatus={application?.status}
                    matchScore={matchScore}
                    onSelect={() => handleSelectJob(job.id)}
                    onToggleSave={(e) => handleToggleSaveJob(e, job.id)}
                    onApply={() => handleApply(job.id)}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Opportunity Detail Side Panel (>=1280px rail, or drawer/bottom sheet) */}
        {selectedJob && (
          <OpportunityDetailPanel
            job={selectedJob}
            currentUser={currentUser}
            isSaved={savedJobIds.includes(selectedJob.id)}
            isApplied={appliedJobMap.has(selectedJob.id)}
            applicationStatus={appliedJobMap.get(selectedJob.id)?.status}
            onClose={handleClosePanel}
            onToggleSave={(e) => handleToggleSaveJob(e, selectedJob.id)}
            onApply={(id) => handleApply(id)}
            onMessagePoster={handleMessagePoster}
            isMobileScreen={isMobileScreen}
          />
        )}
      </div>
      </>
      )}

      {/* Post Opportunity Modal */}
      <Modal
        isOpen={showPostJobModal}
        onClose={() => setShowPostJobModal(false)}
        title="Post an opportunity"
        subtitle="Share job openings, internships, or research roles with verified students and alumni."
        maxWidth="lg"
      >
        <form onSubmit={handlePostJobSubmit} className="space-y-4 font-sans text-xs">
          <TextField
            label="Role title"
            placeholder="e.g. Graduate Software Engineer, Product Management Intern"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TextField
              label="Company or organization"
              placeholder="e.g. Google, Microsoft, Morgan Stanley"
              value={newCompany}
              onChange={(e) => setNewCompany(e.target.value)}
              required
            />

            <TextField
              label="Location"
              placeholder="e.g. Mumbai, Bengaluru, or Remote"
              value={newLocation}
              onChange={(e) => setNewLocation(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SelectField
              label="Opportunity type"
              value={newType}
              onChange={(e) => setNewType(e.target.value as any)}
              options={[
                { value: 'Job Vacancy', label: 'Full-time job' },
                { value: 'Internship Opportunity', label: 'Internship' },
                { value: 'Research Project', label: 'Research project' },
                { value: 'Industrial Training', label: 'Industrial training' }
              ]}
            />

            <TextField
              label="Stipend or annual package"
              placeholder="e.g. ₹18,00,000 / year or ₹50,000 / month"
              value={newSalary}
              onChange={(e) => setNewSalary(e.target.value)}
            />
          </div>

          <TextField
            label="Application deadline"
            type="date"
            value={newDeadline}
            onChange={(e) => setNewDeadline(e.target.value)}
          />

          <TextArea
            label="Description & key responsibilities"
            placeholder="Describe the opportunity, expected projects, team structure, and eligibility..."
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            rows={4}
          />

          <div className="pt-3 border-t border-[#E5E7EB] flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={() => setShowPostJobModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
            >
              Submit listing
            </Button>
          </div>
        </form>
      </Modal>

      {/* Apply to Opportunity Sheet / Modal */}
      {applyingJob && currentUser && (
        <ApplyOpportunitySheet
          job={applyingJob}
          currentUser={currentUser}
          isOpen={!!applyingJob}
          onClose={() => setApplyingJob(null)}
          onSubmit={async ({ resumeUrl, coverNote }) => {
            const res = await applyForJob(applyingJob.id, { resumeUrl, coverNote });
            if (res.success) {
              setApplySuccessMsg(`Application sent for ${applyingJob.title} at ${applyingJob.company}. You can track it under My applications.`);
              setTimeout(() => setApplySuccessMsg(null), 5000);
            }
            return res;
          }}
        />
      )}

    </div>
  );
};

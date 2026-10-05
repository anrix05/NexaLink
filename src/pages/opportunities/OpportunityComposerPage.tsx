import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useMobileChrome } from '../../context/MobileChromeContext';
import type {
  JobListing,
  OpportunityType,
  OpportunityLifecycleStatus,
  OpportunityWorkMode,
  CompensationPeriod,
  DepartmentCode
} from '../../types';
import { DEPARTMENT_TAXONOMY, type DepartmentInfo } from '../../constants/taxonomy';
import { formatCompensation } from '../../utils/eventTimeUtils';
import {
  ArrowLeft,
  Building2,
  Briefcase,
  MapPin,
  Clock,
  DollarSign,
  GraduationCap,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Save,
  Send,
  Eye,
  Plus,
  Trash2,
  ExternalLink,
  Info,
  Check
} from 'lucide-react';

interface OpportunityComposerPageProps {
  opportunityId?: string | null;
  onBack: () => void;
  onSuccess?: (job: JobListing) => void;
}

const COMMON_SKILL_SUGGESTIONS = [
  'React',
  'TypeScript',
  'Node.js',
  'Python',
  'System Design',
  'SQL',
  'Docker',
  'AWS',
  'Machine Learning',
  'Go',
  'Data Structures'
];

export const OpportunityComposerPage: React.FC<OpportunityComposerPageProps> = ({
  opportunityId,
  onBack,
  onSuccess
}) => {
  const { jobsList, saveOpportunityDraft, submitOpportunityForReview } = useData();
  const { currentUser, currentRole } = useAuth();
  const { setHideMobileChrome } = useMobileChrome();

  useEffect(() => {
    setHideMobileChrome(true);
    return () => setHideMobileChrome(false);
  }, [setHideMobileChrome]);

  const isEditing = !!opportunityId;
  const existingJob = useMemo(() => {
    return opportunityId ? jobsList.find(j => j.id === opportunityId) : null;
  }, [jobsList, opportunityId]);

  // Form State
  const [title, setTitle] = useState(existingJob?.title || '');
  const [type, setType] = useState<OpportunityType>((existingJob?.type as OpportunityType) || 'Job Vacancy');
  const [company, setCompany] = useState(existingJob?.company || '');
  const [companyLogo, setCompanyLogo] = useState(existingJob?.companyLogo || '');
  const [workMode, setWorkMode] = useState<OpportunityWorkMode>(existingJob?.workMode || 'Hybrid');
  const [location, setLocation] = useState(existingJob?.location || '');
  const [openings, setOpenings] = useState<number>(existingJob?.openings || 1);

  // Compensation State
  const [compensationMode, setCompensationMode] = useState<'paid' | 'unpaid' | 'not_disclosed'>(
    existingJob?.compensationDisclosed === false
      ? 'not_disclosed'
      : (existingJob?.compensationMin || 0) > 0 || (existingJob?.compensationMax || 0) > 0
        ? 'paid'
        : 'paid'
  );
  const [compMin, setCompMin] = useState<string>(existingJob?.compensationMin ? String(existingJob.compensationMin) : '12');
  const [compMax, setCompMax] = useState<string>(existingJob?.compensationMax ? String(existingJob.compensationMax) : '18');
  const [compPeriod, setCompPeriod] = useState<CompensationPeriod>(existingJob?.compensationPeriod || 'per_year');
  const [compCurrency, setCompCurrency] = useState('INR');

  // Eligibility Matrix
  const [selectedDepts, setSelectedDepts] = useState<DepartmentCode[]>(
    existingJob?.eligibility?.departments || (existingJob?.department as DepartmentCode[]) || ['CMPN', 'INFT']
  );
  const [selectedGradYears, setSelectedGradYears] = useState<number[]>(
    existingJob?.eligibility?.gradYears || [2025, 2026]
  );
  const [minCgpa, setMinCgpa] = useState<string>(
    existingJob?.eligibility?.minCgpa ? String(existingJob.eligibility.minCgpa) : '7.0'
  );
  const [strictEligibility, setStrictEligibility] = useState<boolean>(
    existingJob?.eligibility?.strict ?? true
  );

  // Skills
  const [skills, setSkills] = useState<string[]>(
    existingJob?.skillsRequired || ['React', 'TypeScript', 'Node.js']
  );
  const [skillInput, setSkillInput] = useState('');

  // Application Method
  const [applyMethod, setApplyMethod] = useState<'nexalink' | 'external'>(
    existingJob?.applyMethod || 'nexalink'
  );
  const [externalUrl, setExternalUrl] = useState(existingJob?.externalUrl || '');
  const [referralProvided, setReferralProvided] = useState<boolean>(
    existingJob?.referralProvided ?? true
  );
  const [deadline, setDeadline] = useState(
    existingJob?.applicationDeadline ||
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );

  // Details & Requirements
  const [description, setDescription] = useState(
    existingJob?.description ||
      'We are looking for passionate engineers from VIT Wadala to join our engineering organization. You will collaborate with senior architects to build scalable distributed systems.'
  );
  const [requirements, setRequirements] = useState<string[]>(
    existingJob?.requirements && existingJob.requirements.length > 0
      ? existingJob.requirements
      : [
          'Enrolled student or alumni of Vidyalankar Institute of Technology',
          'Solid understanding of data structures, algorithms, and system design',
          'Hands-on experience with modern web stacks and relational databases'
        ]
  );
  const [reqInput, setReqInput] = useState('');

  // Status & Feedback
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [noticeMsg, setNoticeMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [showMobilePreview, setShowMobilePreview] = useState(false);

  // Computed compensation display string
  const formattedCompString = useMemo(() => {
    if (compensationMode === 'not_disclosed') return 'Compensation not disclosed';
    if (compensationMode === 'unpaid') return 'Unpaid (Academic credit / Experience)';
    const minN = parseFloat(compMin) || 0;
    const maxN = parseFloat(compMax) || 0;
    return formatCompensation({
      compensationDisclosed: true,
      compensationMin: minN,
      compensationMax: maxN,
      compensationPeriod: compPeriod,
      compensationCurrency: compCurrency
    });
  }, [compensationMode, compMin, compMax, compPeriod, compCurrency]);

  // Duplicate Check: Same title & company in past 30 days
  const duplicateWarning = useMemo(() => {
    if (!title.trim() || !company.trim()) return null;
    const cleanT = title.trim().toLowerCase();
    const cleanC = company.trim().toLowerCase();
    const clash = jobsList.find(
      j =>
        j.id !== (opportunityId || '') &&
        j.title.toLowerCase() === cleanT &&
        j.company.toLowerCase() === cleanC &&
        j.postedByAlumniId === currentUser.id
    );
    if (clash) {
      return `You already have an existing posting for "${clash.title}" at "${clash.company}".`;
    }
    return null;
  }, [title, company, jobsList, opportunityId, currentUser.id]);

  // Autosave Draft
  const handleAutosave = () => {
    if (!title.trim() && !company.trim()) return;
    const minN = parseFloat(compMin) || undefined;
    const maxN = parseFloat(compMax) || undefined;
    const cgpaN = parseFloat(minCgpa) || undefined;

    const draftData: Partial<JobListing> = {
      id: opportunityId || undefined,
      title: title.trim() || 'Untitled Opportunity Draft',
      company: company.trim() || 'Pending Organization',
      companyLogo: companyLogo.trim() || undefined,
      location: workMode === 'Remote' ? (location.trim() || 'Remote') : location.trim(),
      type,
      workMode,
      openings,
      compensationDisclosed: compensationMode !== 'not_disclosed',
      compensationMin: compensationMode === 'paid' ? minN : 0,
      compensationMax: compensationMode === 'paid' ? maxN : 0,
      compensationPeriod: compPeriod,
      compensationCurrency: compCurrency,
      stipendOrSalary: formattedCompString,
      department: selectedDepts,
      skillsRequired: skills,
      eligibility: {
        departments: selectedDepts,
        gradYears: selectedGradYears,
        minCgpa: cgpaN,
        strict: strictEligibility
      },
      applyMethod,
      externalUrl: applyMethod === 'external' ? externalUrl.trim() : undefined,
      referralProvided,
      applicationDeadline: deadline,
      description,
      requirements,
      postedByAlumniId: currentUser.id,
      postedByAlumniName: currentUser.name,
      postedByRole: currentRole as any
    };

    saveOpportunityDraft(draftData);
    setLastSavedTime(
      new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
    );
  };

  // 10s Autosave timer
  useEffect(() => {
    const timer = setInterval(() => {
      handleAutosave();
    }, 10000);
    return () => clearInterval(timer);
  }, [
    title,
    company,
    type,
    workMode,
    location,
    compensationMode,
    compMin,
    compMax,
    compPeriod,
    selectedDepts,
    selectedGradYears,
    minCgpa,
    skills,
    applyMethod,
    externalUrl,
    description,
    requirements
  ]);

  // Validation
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!title.trim() || title.trim().length < 4) {
      errors.title = 'Title must be at least 4 characters long.';
    }
    if (!company.trim()) {
      errors.company = 'Company or organization name is required.';
    }
    if (workMode !== 'Remote' && !location.trim()) {
      errors.location = 'Location is required for hybrid and on-site opportunities.';
    }
    if (selectedDepts.length === 0) {
      errors.depts = 'Select at least one eligible academic department.';
    }
    if (skills.length === 0) {
      errors.skills = 'Add at least one required skill tag.';
    }
    if (applyMethod === 'external') {
      if (!externalUrl.trim().startsWith('http')) {
        errors.externalUrl = 'Provide a valid URL starting with http:// or https://';
      }
    }
    if (new Date(deadline).getTime() < Date.now()) {
      errors.deadline = 'Application deadline must be a future date.';
    }
    if (!description.trim() || description.trim().length < 30) {
      errors.description = 'Please provide a descriptive overview (at least 30 characters).';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit Handler
  const handleSubmit = (isDraft: boolean = false) => {
    if (isDraft) {
      handleAutosave();
      setNoticeMsg({ type: 'success', text: 'Draft saved successfully.' });
      setTimeout(() => setNoticeMsg(null), 3000);
      return;
    }

    if (!validateForm()) {
      setNoticeMsg({ type: 'error', text: 'Please complete all required fields.' });
      return;
    }

    const minN = parseFloat(compMin) || undefined;
    const maxN = parseFloat(compMax) || undefined;
    const cgpaN = parseFloat(minCgpa) || undefined;

    const payload: Partial<JobListing> = {
      id: opportunityId || undefined,
      title: title.trim(),
      company: company.trim(),
      companyLogo: companyLogo.trim() || undefined,
      location: workMode === 'Remote' ? (location.trim() || 'Remote') : location.trim(),
      type,
      workMode,
      openings,
      compensationDisclosed: compensationMode !== 'not_disclosed',
      compensationMin: compensationMode === 'paid' ? minN : 0,
      compensationMax: compensationMode === 'paid' ? maxN : 0,
      compensationPeriod: compPeriod,
      compensationCurrency: compCurrency,
      stipendOrSalary: formattedCompString,
      department: selectedDepts,
      skillsRequired: skills,
      eligibility: {
        departments: selectedDepts,
        gradYears: selectedGradYears,
        minCgpa: cgpaN,
        strict: strictEligibility
      },
      applyMethod,
      externalUrl: applyMethod === 'external' ? externalUrl.trim() : undefined,
      referralProvided,
      applicationDeadline: deadline,
      description: description.trim(),
      requirements,
      postedByAlumniId: currentUser.id,
      postedByAlumniName: currentUser.name,
      postedByRole: currentRole as any
    };

    const res = submitOpportunityForReview(payload, currentRole);
    if (res.success && res.job) {
      if (onSuccess) {
        onSuccess(res.job);
      } else {
        onBack();
      }
    } else {
      setNoticeMsg({ type: 'error', text: res.message || 'Error publishing opportunity.' });
    }
  };

  // Department Toggle Helper
  const toggleDept = (code: DepartmentCode) => {
    if (selectedDepts.includes(code)) {
      setSelectedDepts(selectedDepts.filter(c => c !== code));
    } else {
      setSelectedDepts([...selectedDepts, code]);
    }
  };

  // Grad Year Toggle Helper
  const toggleGradYear = (yr: number) => {
    if (selectedGradYears.includes(yr)) {
      setSelectedGradYears(selectedGradYears.filter(y => y !== yr));
    } else {
      setSelectedGradYears([...selectedGradYears, yr]);
    }
  };

  // Skills Helper
  const handleAddSkill = (skillToAdd: string) => {
    const trimmed = skillToAdd.trim();
    if (!trimmed || skills.includes(trimmed)) return;
    if (skills.length >= 10) return;
    setSkills([...skills, trimmed]);
    setSkillInput('');
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter(s => s !== skillToRemove));
  };

  // Requirements Helper
  const handleAddRequirement = () => {
    const trimmed = reqInput.trim();
    if (!trimmed) return;
    setRequirements([...requirements, trimmed]);
    setReqInput('');
  };

  const handleRemoveRequirement = (idx: number) => {
    setRequirements(requirements.filter((_, i) => i !== idx));
  };

  const isAutoPublishRole = currentRole === 'admin' || currentRole === 'faculty';

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans antialiased text-[#0A0A0A] pb-36 sm:pb-24">
      {/* Top Fixed Bar */}
      <div className="bg-white border-b border-[#E5E7EB] sticky top-0 z-30 px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <button
              type="button"
              onClick={onBack}
              className="p-2 text-[#6B7280] hover:text-[#0A0A0A] rounded-lg transition-colors cursor-pointer touch-target-44 shrink-0 -ml-1"
              aria-label="Back to opportunities"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="min-w-0 flex-1">
              <h1 className="text-base font-bold text-[#0A0A0A] tracking-tight font-display truncate">
                {isEditing ? 'Edit opportunity' : 'Post an opportunity'}
              </h1>
              <div className="flex items-center gap-2 text-[11px] text-[#6B7280] truncate font-sans">
                <span className="truncate">{company || 'New posting'}</span>
                <span>•</span>
                <span className="shrink-0">
                  {lastSavedTime ? `Saved on this device ${lastSavedTime}` : 'Autosave active'}
                </span>
              </div>
            </div>
          </div>

          {/* Desktop Actions in Header - Hidden on mobile to prevent overflow */}
          <div className="hidden md:flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowMobilePreview(!showMobilePreview)}
              className="xl:hidden inline-flex items-center gap-1.5 px-3 py-1.5 border border-[#6B7280] text-[#0A0A0A] rounded-xl text-xs font-semibold cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Preview</span>
            </button>

            <button
              type="button"
              onClick={() => handleSubmit(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 border border-[#6B7280] text-[#0A0A0A] rounded-xl text-xs font-semibold hover:border-[#0A0A0A] transition-colors cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save draft</span>
            </button>

            <button
              type="button"
              onClick={() => handleSubmit(false)}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-[#0A0A0A] text-white rounded-xl text-xs font-semibold hover:bg-neutral-800 transition-colors cursor-pointer shadow-sm"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isAutoPublishRole ? 'Publish opportunity' : 'Submit for review'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        {/* Notice Message */}
        {noticeMsg && (
          <div
            className={`mb-6 p-3.5 rounded-xl border text-xs font-medium flex items-center gap-2 ${
              noticeMsg.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            {noticeMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
            )}
            <span>{noticeMsg.text}</span>
          </div>
        )}

        {/* Duplicate Warning */}
        {duplicateWarning && (
          <div className="mb-6 p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Potential Duplicate Listing</p>
              <p className="text-[11px] text-amber-800 mt-0.5">{duplicateWarning}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
          {/* Form Column (max-w-[680px]) */}
          <div className="xl:col-span-7 space-y-6">
            {/* 1. Basics Card */}
            <section className="bg-white border border-[#E5E7EB] rounded-2xl p-5 sm:p-6 space-y-4">
              <div className="border-b border-[#E5E7EB] pb-3">
                <h2 className="text-sm font-bold text-[#0A0A0A]">1. Role Overview</h2>
                <p className="text-xs text-[#6B7280]">Key details about the position and hiring organization.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0A0A0A] mb-1">
                  Opportunity title <span className="text-[#6B7280] text-xs font-normal" aria-hidden="true">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  onBlur={handleAutosave}
                  placeholder="e.g. Backend engineer"
                  className={`w-full min-h-[48px] h-12 px-3 bg-white border ${
                    validationErrors.title ? 'border-[#DC2626]' : 'border-[#6B7280]'
                  } rounded-xl text-base sm:text-xs text-[#0A0A0A] placeholder-[#9CA3AF] focus:outline-none focus:border-[#0A0A0A]`}
                />
                {validationErrors.title && (
                  <p className="text-[11px] text-[#DC2626] mt-1">{validationErrors.title}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#0A0A0A] mb-1">
                    Opportunity type <span className="text-[#6B7280] text-xs font-normal" aria-hidden="true">*</span>
                  </label>
                  <select
                    value={type}
                    onChange={e => setType(e.target.value as OpportunityType)}
                    className="w-full min-h-[48px] h-12 px-3 bg-white border border-[#6B7280] rounded-xl text-base sm:text-xs text-[#0A0A0A] focus:outline-none focus:border-[#0A0A0A] cursor-pointer"
                  >
                    <option value="Job Vacancy">Full-time</option>
                    <option value="Internship">Internship</option>
                    <option value="Referral">Alumni referral</option>
                    <option value="Research">Faculty research</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0A0A0A] mb-1">
                    Company or organization <span className="text-[#6B7280] text-xs font-normal" aria-hidden="true">*</span>
                  </label>
                  <input
                    type="text"
                    value={company}
                    onChange={e => setCompany(e.target.value)}
                    onBlur={handleAutosave}
                    placeholder="e.g. Morgan Stanley or VIT Lab"
                    className={`w-full min-h-[48px] h-12 px-3 bg-white border ${
                      validationErrors.company ? 'border-[#DC2626]' : 'border-[#6B7280]'
                    } rounded-xl text-base sm:text-xs text-[#0A0A0A] placeholder-[#9CA3AF] focus:outline-none focus:border-[#0A0A0A]`}
                  />
                  {validationErrors.company && (
                    <p className="text-[11px] text-[#DC2626] mt-1">{validationErrors.company}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#0A0A0A] mb-1">Work mode</label>
                  <select
                    value={workMode}
                    onChange={e => setWorkMode(e.target.value as OpportunityWorkMode)}
                    className="w-full min-h-[48px] h-12 px-3 bg-white border border-[#6B7280] rounded-xl text-base sm:text-xs text-[#0A0A0A] focus:outline-none focus:border-[#0A0A0A] cursor-pointer"
                  >
                    <option value="Hybrid">Hybrid</option>
                    <option value="Remote">Remote</option>
                    <option value="On-site">On-site</option>
                  </select>
                </div>

                {workMode !== 'Remote' && (
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-[#0A0A0A] mb-1">
                      Location <span className="text-[#6B7280] text-xs font-normal" aria-hidden="true">*</span>
                    </label>
                    <input
                      type="text"
                      value={location}
                      onChange={e => setLocation(e.target.value)}
                      onBlur={handleAutosave}
                      placeholder="e.g. Mumbai"
                      className={`w-full min-h-[48px] h-12 px-3 bg-white border ${
                        validationErrors.location ? 'border-[#DC2626]' : 'border-[#6B7280]'
                      } rounded-xl text-base sm:text-xs text-[#0A0A0A] placeholder-[#9CA3AF] focus:outline-none focus:border-[#0A0A0A]`}
                    />
                    {validationErrors.location && (
                      <p className="text-[11px] text-[#DC2626] mt-1">{validationErrors.location}</p>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#0A0A0A] mb-1">Number of Openings</label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={openings}
                    onChange={e => setOpenings(parseInt(e.target.value, 10) || 1)}
                    className="w-full h-10 px-3 bg-white border border-[#6B7280] rounded-xl text-xs text-[#0A0A0A] focus:outline-none focus:border-[#0A0A0A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0A0A0A] mb-1">
                    Application Deadline <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="date"
                    value={deadline}
                    onChange={e => setDeadline(e.target.value)}
                    className={`w-full h-10 px-3 bg-white border ${
                      validationErrors.deadline ? 'border-rose-500' : 'border-[#6B7280]'
                    } rounded-xl text-xs text-[#0A0A0A] focus:outline-none focus:border-[#0A0A0A]`}
                  />
                  {validationErrors.deadline && (
                    <p className="text-[11px] text-rose-600 mt-1">{validationErrors.deadline}</p>
                  )}
                </div>
              </div>
            </section>

            {/* 2. Structured Compensation */}
            <section className="bg-white border border-[#E5E7EB] rounded-2xl p-5 sm:p-6 space-y-4">
              <div className="border-b border-[#E5E7EB] pb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-[#0A0A0A]">2. Compensation & Package</h2>
                  <p className="text-xs text-[#6B7280]">Transparent compensation increases candidate response rates.</p>
                </div>
                <span className="text-xs font-mono font-semibold px-2.5 py-1 bg-neutral-100 text-[#0A0A0A] rounded-lg">
                  {formattedCompString}
                </span>
              </div>

              {/* Mode Selector */}
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'paid', label: 'Paid Compensation' },
                  { id: 'unpaid', label: 'Unpaid / Academic Credit' },
                  { id: 'not_disclosed', label: 'Do not disclose' }
                ].map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setCompensationMode(opt.id as any)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
                      compensationMode === opt.id
                        ? 'bg-[#0A0A0A] text-white'
                        : 'border border-[#6B7280] text-[#0A0A0A] hover:border-[#0A0A0A]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {compensationMode === 'paid' && (
                <div className="p-4 bg-[#FAFAFA] border border-[#E5E7EB] rounded-xl space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-[#6B7280] mb-1">Period</label>
                      <select
                        value={compPeriod}
                        onChange={e => setCompPeriod(e.target.value as CompensationPeriod)}
                        className="w-full h-9 px-2.5 bg-white border border-[#6B7280] rounded-lg text-xs text-[#0A0A0A] focus:outline-none focus:border-[#0A0A0A] cursor-pointer"
                      >
                        <option value="per_year">LPA (₹ / year)</option>
                        <option value="per_month">Stipend (₹ / month)</option>
                        <option value="one_time">One-time Grant</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-[#6B7280] mb-1">
                        Minimum ({compPeriod === 'per_year' ? 'LPA' : '₹'})
                      </label>
                      <input
                        type="number"
                        step={compPeriod === 'per_year' ? '0.5' : '1000'}
                        value={compMin}
                        onChange={e => setCompMin(e.target.value)}
                        placeholder={compPeriod === 'per_year' ? '12' : '25000'}
                        className="w-full h-9 px-2.5 bg-white border border-[#6B7280] rounded-lg text-xs font-mono text-[#0A0A0A] focus:outline-none focus:border-[#0A0A0A]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-[#6B7280] mb-1">
                        Maximum ({compPeriod === 'per_year' ? 'LPA' : '₹'})
                      </label>
                      <input
                        type="number"
                        step={compPeriod === 'per_year' ? '0.5' : '1000'}
                        value={compMax}
                        onChange={e => setCompMax(e.target.value)}
                        placeholder={compPeriod === 'per_year' ? '18' : '40000'}
                        className="w-full h-9 px-2.5 bg-white border border-[#6B7280] rounded-lg text-xs font-mono text-[#0A0A0A] focus:outline-none focus:border-[#0A0A0A]"
                      />
                    </div>
                  </div>
                  <p className="text-[11px] text-[#6B7280]">
                    Example: For full-time 12 to 18 LPA, enter 12 and 18. For internships, enter 25000 and 40000 per month.
                  </p>
                </div>
              )}
            </section>

            {/* 3. Eligibility Matrix */}
            <section className="bg-white border border-[#E5E7EB] rounded-2xl p-5 sm:p-6 space-y-4">
              <div className="border-b border-[#E5E7EB] pb-3">
                <h2 className="text-sm font-bold text-[#0A0A0A]">3. Eligibility Criteria</h2>
                <p className="text-xs text-[#6B7280]">Filter candidate pool by department, graduation batch, and CGPA.</p>
              </div>

              {/* Department Checkboxes */}
              <div>
                <label className="block text-xs font-semibold text-[#0A0A0A] mb-2">
                  Eligible Academic Departments <span className="text-rose-600">*</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {DEPARTMENT_TAXONOMY.map(d => {
                    const selected = selectedDepts.includes(d.code as DepartmentCode);
                    return (
                      <button
                        key={d.code}
                        type="button"
                        onClick={() => toggleDept(d.code as DepartmentCode)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
                          selected
                            ? 'bg-[#0A0A0A] text-white'
                            : 'border border-[#6B7280] text-[#0A0A0A] hover:border-[#0A0A0A]'
                        }`}
                      >
                        {d.code} – {d.name}
                      </button>
                    );
                  })}
                </div>
                {validationErrors.depts && (
                  <p className="text-[11px] text-rose-600 mt-1">{validationErrors.depts}</p>
                )}
              </div>

              {/* Grad Batches & CGPA */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-[#0A0A0A] mb-2">Eligible Batches</label>
                  <div className="flex flex-wrap gap-2">
                    {[2024, 2025, 2026, 2027].map(yr => {
                      const selected = selectedGradYears.includes(yr);
                      return (
                        <button
                          key={yr}
                          type="button"
                          onClick={() => toggleGradYear(yr)}
                          className={`px-3 py-1 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
                            selected
                              ? 'bg-[#0A0A0A] text-white'
                              : 'border border-[#6B7280] text-[#0A0A0A] hover:border-[#0A0A0A]'
                          }`}
                        >
                          {yr}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0A0A0A] mb-1">
                    Minimum CGPA Cutoff (0 to 10)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    value={minCgpa}
                    onChange={e => setMinCgpa(e.target.value)}
                    placeholder="7.0 (or 0 for no cutoff)"
                    className="w-full h-10 px-3 bg-white border border-[#6B7280] rounded-xl text-xs font-mono text-[#0A0A0A] focus:outline-none focus:border-[#0A0A0A]"
                  />
                </div>
              </div>

              {/* Strict Filter Toggle */}
              <div className="p-3.5 bg-[#FAFAFA] border border-[#E5E7EB] rounded-xl flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold text-[#0A0A0A]">Enforce strict eligibility filter</p>
                  <p className="text-[11px] text-[#6B7280]">
                    Only students matching department, batch, and CGPA will be allowed to submit direct applications.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={strictEligibility}
                  onChange={e => setStrictEligibility(e.target.checked)}
                  className="w-4 h-4 accent-[#0A0A0A] rounded cursor-pointer"
                />
              </div>
            </section>

            {/* 4. Skills Tags */}
            <section className="bg-white border border-[#E5E7EB] rounded-2xl p-5 sm:p-6 space-y-4">
              <div className="border-b border-[#E5E7EB] pb-3">
                <h2 className="text-sm font-bold text-[#0A0A0A]">4. Required Skills & Stack</h2>
                <p className="text-xs text-[#6B7280]">
                  Skills are matched against student profiles for institutional recommendation scoring.
                </p>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="text"
                    value={skillInput}
                    onChange={e => setSkillInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSkill(skillInput);
                      }
                    }}
                    placeholder="Type skill and press Enter (e.g. Docker, GraphQL)"
                    className="flex-1 h-9 px-3 bg-white border border-[#6B7280] rounded-xl text-xs text-[#0A0A0A] placeholder-[#9CA3AF] focus:outline-none focus:border-[#0A0A0A]"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddSkill(skillInput)}
                    className="h-9 px-3.5 bg-[#0A0A0A] text-white rounded-xl text-xs font-semibold hover:bg-neutral-800 transition-colors cursor-pointer"
                  >
                    Add
                  </button>
                </div>

                {/* Selected Skills Chips */}
                <div className="flex flex-wrap gap-2 min-h-[36px] p-2 bg-[#FAFAFA] border border-[#E5E7EB] rounded-xl items-center">
                  {skills.length === 0 ? (
                    <span className="text-[11px] text-[#6B7280] italic">No skills added yet.</span>
                  ) : (
                    skills.map(s => (
                      <span
                        key={s}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-[#E5E7EB] rounded-lg text-xs font-semibold text-[#0A0A0A]"
                      >
                        <span>{s}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(s)}
                          className="hover:text-rose-600 cursor-pointer"
                        >
                          ×
                        </button>
                      </span>
                    ))
                  )}
                </div>
                {validationErrors.skills && (
                  <p className="text-[11px] text-rose-600 mt-1">{validationErrors.skills}</p>
                )}

                {/* Quick suggestions */}
                <div className="flex flex-wrap items-center gap-1.5 pt-2">
                  <span className="text-[11px] text-[#6B7280] font-semibold">Suggested:</span>
                  {COMMON_SKILL_SUGGESTIONS.filter(s => !skills.includes(s))
                    .slice(0, 6)
                    .map(s => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => handleAddSkill(s)}
                        className="text-[11px] px-2 py-0.5 bg-neutral-100 hover:bg-neutral-200 text-[#0A0A0A] rounded-md font-medium cursor-pointer transition-colors"
                      >
                        + {s}
                      </button>
                    ))}
                </div>
              </div>
            </section>

            {/* 5. How to Apply */}
            <section className="bg-white border border-[#E5E7EB] rounded-2xl p-5 sm:p-6 space-y-4">
              <div className="border-b border-[#E5E7EB] pb-3">
                <h2 className="text-sm font-bold text-[#0A0A0A]">5. Application Method</h2>
                <p className="text-xs text-[#6B7280]">Select how candidates should submit their application.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setApplyMethod('nexalink')}
                  className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
                    applyMethod === 'nexalink'
                      ? 'border-[#0A0A0A] bg-neutral-50 shadow-sm'
                      : 'border-[#E5E7EB] bg-white hover:border-[#6B7280]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-[#0A0A0A]">Apply on NexaLink</span>
                    {applyMethod === 'nexalink' && <Check className="w-4 h-4 text-[#0A0A0A]" />}
                  </div>
                  <p className="text-[11px] text-[#6B7280]">
                    Collect resume PDF and candidate notes directly inside your host management dashboard.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setApplyMethod('external')}
                  className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
                    applyMethod === 'external'
                      ? 'border-[#0A0A0A] bg-neutral-50 shadow-sm'
                      : 'border-[#E5E7EB] bg-white hover:border-[#6B7280]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-[#0A0A0A]">External Link / Careers Portal</span>
                    {applyMethod === 'external' && <Check className="w-4 h-4 text-[#0A0A0A]" />}
                  </div>
                  <p className="text-[11px] text-[#6B7280]">
                    Redirect candidates to your company's ATS or Google Form.
                  </p>
                </button>
              </div>

              {applyMethod === 'external' && (
                <div>
                  <label className="block text-xs font-semibold text-[#0A0A0A] mb-1">
                    External Careers URL <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="url"
                    value={externalUrl}
                    onChange={e => setExternalUrl(e.target.value)}
                    placeholder="https://careers.company.com/job/12345"
                    className={`w-full h-10 px-3 bg-white border ${
                      validationErrors.externalUrl ? 'border-rose-500' : 'border-[#6B7280]'
                    } rounded-xl text-xs text-[#0A0A0A] focus:outline-none focus:border-[#0A0A0A]`}
                  />
                  {validationErrors.externalUrl && (
                    <p className="text-[11px] text-rose-600 mt-1">{validationErrors.externalUrl}</p>
                  )}
                </div>
              )}

              {/* Referral Pledge */}
              <div className="p-3.5 bg-[#FAFAFA] border border-[#E5E7EB] rounded-xl flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold text-[#0A0A0A]">Internal Employee Referral Pledge</p>
                  <p className="text-[11px] text-[#6B7280]">
                    Marking this active badges your posting as an "Alumni Referral" and prioritizes it in student feeds.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={referralProvided}
                  onChange={e => setReferralProvided(e.target.checked)}
                  className="w-4 h-4 accent-[#0A0A0A] rounded cursor-pointer"
                />
              </div>
            </section>

            {/* 6. Description & Requirements */}
            <section className="bg-white border border-[#E5E7EB] rounded-2xl p-5 sm:p-6 space-y-4">
              <div className="border-b border-[#E5E7EB] pb-3">
                <h2 className="text-sm font-bold text-[#0A0A0A]">6. Role Details & Requirements</h2>
                <p className="text-xs text-[#6B7280]">Provide comprehensive expectations for the role.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0A0A0A] mb-1">
                  Role Description <span className="text-rose-600">*</span>
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  onBlur={handleAutosave}
                  placeholder="Outline responsibilities, team scope, and typical projects..."
                  className={`w-full p-3 bg-white border ${
                    validationErrors.description ? 'border-rose-500' : 'border-[#6B7280]'
                  } rounded-xl text-xs text-[#0A0A0A] placeholder-[#9CA3AF] focus:outline-none focus:border-[#0A0A0A]`}
                />
                {validationErrors.description && (
                  <p className="text-[11px] text-rose-600 mt-1">{validationErrors.description}</p>
                )}
              </div>

              {/* Requirements List */}
              <div>
                <label className="block text-xs font-semibold text-[#0A0A0A] mb-2">Key Qualifications</label>
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="text"
                    value={reqInput}
                    onChange={e => setReqInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddRequirement();
                      }
                    }}
                    placeholder="Add qualification bullet point..."
                    className="flex-1 h-9 px-3 bg-white border border-[#6B7280] rounded-xl text-xs text-[#0A0A0A] placeholder-[#9CA3AF] focus:outline-none focus:border-[#0A0A0A]"
                  />
                  <button
                    type="button"
                    onClick={handleAddRequirement}
                    className="h-9 px-3.5 bg-[#0A0A0A] text-white rounded-xl text-xs font-semibold hover:bg-neutral-800 transition-colors cursor-pointer"
                  >
                    Add
                  </button>
                </div>

                <ul className="space-y-2">
                  {requirements.map((req, idx) => (
                    <li
                      key={idx}
                      className="flex items-start justify-between gap-2 p-2.5 bg-[#FAFAFA] border border-[#E5E7EB] rounded-xl text-xs text-[#0A0A0A]"
                    >
                      <span className="leading-snug">• {req}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveRequirement(idx)}
                        className="text-[#6B7280] hover:text-rose-600 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            {/* Policy & Submission Footer */}
            <div className="p-4 bg-white border border-[#E5E7EB] rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <Info className="w-4 h-4 text-[#6B7280] shrink-0 mt-0.5" />
                <p className="text-[11px] text-[#6B7280] leading-relaxed">
                  {isAutoPublishRole
                    ? 'As faculty/admin, your posting will be published immediately to institutional feeds.'
                    : 'Alumni postings are reviewed by an administrator within 2 business days under academic moderation policies.'}
                </p>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                <button
                  type="button"
                  onClick={() => handleSubmit(true)}
                  className="px-4 py-2 border border-[#6B7280] text-[#0A0A0A] rounded-xl text-xs font-semibold hover:border-[#0A0A0A] cursor-pointer"
                >
                  Save Draft
                </button>
                <button
                  type="button"
                  onClick={() => handleSubmit(false)}
                  className="px-5 py-2 bg-[#0A0A0A] text-white rounded-xl text-xs font-semibold hover:bg-neutral-800 cursor-pointer shadow-sm"
                >
                  {isAutoPublishRole ? 'Publish Opportunity' : 'Submit for Review'}
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Sticky Live Preview (xl:col-span-5) */}
          <div className="hidden xl:block xl:col-span-5 sticky top-20 space-y-4">
            <div className="flex items-center justify-between text-xs text-[#6B7280]">
              <span className="font-semibold uppercase tracking-wider text-[11px]">Live Preview</span>
              <span>As seen by students</span>
            </div>

            {/* Preview Card */}
            <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 space-y-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-100 text-[#0A0A0A] font-semibold">
                      {type}
                    </span>
                    {referralProvided && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200">
                        Alumni Referral
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-bold text-[#0A0A0A] leading-snug">
                    {title || 'Role Title Preview'}
                  </h3>
                  <p className="text-xs text-[#6B7280] mt-0.5">
                    {company || 'Company Name'} • {location} ({workMode})
                  </p>
                </div>
              </div>

              {/* Compensation & Openings Banner */}
              <div className="p-3 bg-[#FAFAFA] border border-[#E5E7EB] rounded-xl flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-[#6B7280] uppercase tracking-wider block">Package</span>
                  <span className="font-bold text-[#0A0A0A] font-mono">{formattedCompString}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-[#6B7280] uppercase tracking-wider block">Openings</span>
                  <span className="font-bold text-[#0A0A0A]">{openings} position{openings > 1 ? 's' : ''}</span>
                </div>
              </div>

              {/* Skills */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-[#6B7280]">Required Skills</span>
                <div className="flex flex-wrap gap-1.5">
                  {skills.length === 0 ? (
                    <span className="text-[11px] text-[#6B7280]">Add skills to see badges</span>
                  ) : (
                    skills.map(s => (
                      <span key={s} className="text-[11px] px-2.5 py-0.5 bg-neutral-100 text-[#0A0A0A] rounded-md font-medium">
                        {s}
                      </span>
                    ))
                  )}
                </div>
              </div>

              {/* Eligibility Preview */}
              <div className="space-y-1.5 pt-2 border-t border-[#E5E7EB] text-xs">
                <span className="text-[11px] font-semibold text-[#6B7280]">Eligible Batches & Departments</span>
                <p className="text-xs text-[#0A0A0A]">
                  Depts: {selectedDepts.join(', ') || 'None selected'}
                </p>
                <p className="text-xs text-[#6B7280]">
                  Graduating {selectedGradYears.join(', ')} • Min CGPA: {minCgpa || 'None'}
                </p>
              </div>

              {/* Description Preview */}
              <div className="space-y-1 pt-2 border-t border-[#E5E7EB]">
                <span className="text-[11px] font-semibold text-[#6B7280]">Description Snippet</span>
                <p className="text-xs text-[#0A0A0A] line-clamp-3 leading-relaxed">
                  {description}
                </p>
              </div>

              {/* Action Preview */}
              <div className="pt-2 border-t border-[#E5E7EB]">
                <button
                  type="button"
                  disabled
                  className="w-full py-2 bg-[#0A0A0A] text-white rounded-xl text-xs font-semibold opacity-90 cursor-not-allowed text-center"
                >
                  {applyMethod === 'external' ? 'Apply on External Site' : 'Apply on NexaLink'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Action Bar (Mobile Only, <768px) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#E5E7EB] p-3 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-lg">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 max-w-lg mx-auto">
          <button
            type="button"
            onClick={() => handleSubmit(true)}
            className="text-xs font-semibold text-[#6B7280] hover:text-[#0A0A0A] py-1 text-center cursor-pointer order-2 sm:order-1"
          >
            Save draft
          </button>
          <div className="flex items-center gap-2 order-1 sm:order-2">
            <button
              type="button"
              onClick={() => setShowMobilePreview(!showMobilePreview)}
              className="flex-1 min-h-[44px] py-2.5 px-3 border border-[#E5E7EB] hover:border-[#0A0A0A] text-[#0A0A0A] rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer touch-target-44"
            >
              <Eye className="w-4 h-4" />
              <span>Preview</span>
            </button>
            <button
              type="button"
              onClick={() => handleSubmit(false)}
              className="flex-1 min-h-[44px] py-2.5 px-4 bg-[#0A0A0A] hover:bg-[#262626] text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer touch-target-44 shadow-sm"
            >
              <Send className="w-4 h-4" />
              <span className="truncate">{isAutoPublishRole ? 'Publish' : 'Submit for review'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

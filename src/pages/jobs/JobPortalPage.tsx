import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { RoleGate } from '../../components/common/RoleGate';
import type { JobListing, OpportunityType, StudentProfile } from '../../types';
import { calculateOpportunityMatch } from '../../utils/recommendationEngine';
import {
  Search,
  Plus,
  CheckCircle2,
  X,
  Send,
  Building2,
  Bookmark,
  Sparkles,
  ShieldAlert,
  Briefcase,
  Calendar,
  MapPin,
  RefreshCw
} from 'lucide-react';
import { Badge, Button, SegmentedTabs, Modal, ToastNotice } from '../../components/common/UIComponents';

export const JobPortalPage: React.FC = () => {
  const { jobsList, addJob, applyForJob } = useData();
  const { currentUser, currentRole } = useAuth();

  const [activeTypeFilter, setActiveTypeFilter] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedJobModal, setSelectedJobModal] = useState<JobListing | null>(null);
  const [showPostJobModal, setShowPostJobModal] = useState(false);
  const [appliedJobIds, setAppliedJobIds] = useState<string[]>([]);
  const [savedJobIds, setSavedJobIds] = useState<string[]>(['job-1']);
  const [applySuccessMsg, setApplySuccessMsg] = useState<string | null>(null);

  // New Opportunity Form State
  const [newTitle, setNewTitle] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newType, setNewType] = useState<OpportunityType>('Job Vacancy');
  const [newSalary, setNewSalary] = useState('');
  const [newDeadline, setNewDeadline] = useState('2026-08-31');
  const [newDescription, setNewDescription] = useState('');

  const isStudent = currentUser.role === 'student';
  const studentProfile = currentUser as StudentProfile;

  const opportunityTypes: OpportunityType[] = [
    'Internship Opportunity',
    'Job Vacancy',
    'Research Project',
    'Scholarship',
    'Industrial Training',
    'Workshop'
  ];

  const publishedJobs = jobsList.filter(j => j.status !== 'Closed' && (j.moderationStatus === 'Approved' || j.postedByRole === 'admin' || currentRole === 'admin'));

  const filteredJobs = publishedJobs.filter(job => {
    if (activeTypeFilter !== 'All' && job.type !== activeTypeFilter) return false;
    if (searchTerm.trim() !== '') {
      const q = searchTerm.toLowerCase();
      const matchTitle = job.title.toLowerCase().includes(q);
      const matchCompany = job.company.toLowerCase().includes(q);
      const matchLocation = job.location.toLowerCase().includes(q);
      const matchSkills = job.skillsRequired.some(s => s.toLowerCase().includes(q));
      return matchTitle || matchCompany || matchLocation || matchSkills;
    }
    return true;
  });

  const handleApply = (jobId: string) => {
    applyForJob(jobId);
    setAppliedJobIds(prev => [...prev, jobId]);
    setApplySuccessMsg('Application & verified student profile transmitted to publisher!');
    setTimeout(() => setApplySuccessMsg(null), 4000);
    setSelectedJobModal(null);
  };

  const handleToggleSaveJob = (e: React.MouseEvent, jobId: string) => {
    e.stopPropagation();
    const isSaved = savedJobIds.includes(jobId);
    if (isSaved) {
      setSavedJobIds(prev => prev.filter(id => id !== jobId));
    } else {
      setSavedJobIds(prev => [...prev, jobId]);
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
      stipendOrSalary: newSalary || 'Stipend / Salary Provided',
      department: ['CMPN', 'INFT', 'EXTC'],
      skillsRequired: ['Problem Solving', 'Technical Skills'],
      postedByAlumniId: currentUser.id,
      postedByAlumniName: `${currentUser.name} (${currentUser.role.toUpperCase()})`,
      postedByRole: currentUser.role as any,
      applicationDeadline: newDeadline || '2026-08-31',
      description: newDescription || 'Opportunity published by institutional member.',
      requirements: ['Enrolled Student or Alumni of VIT Wadala'],
      referralProvided: true
    }, currentRole);

    if (!res.success) {
      alert(`Role Error: ${res.error}`);
      return;
    }

    setShowPostJobModal(false);
    setNewTitle('');
    setNewCompany('');

    if (isAdmin) {
      setApplySuccessMsg('Opportunity published immediately to institutional feeds!');
    } else {
      setApplySuccessMsg('Opportunity submitted! It is currently in the Admin Moderation Queue before appearing on student feeds.');
    }
    setTimeout(() => setApplySuccessMsg(null), 4500);
  };

  const categoryTabOptions = [
    { id: 'All', label: 'All Opportunities', count: publishedJobs.length },
    ...opportunityTypes.map(t => ({ id: t, label: t, count: publishedJobs.filter(j => j.type === t).length }))
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-16 sm:pb-0 font-sans text-xs">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E7EB] pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0A0A0A] tracking-tight flex items-center gap-2">
            <Briefcase className="w-7 h-7 text-[#0A0A0A]" />
            Opportunity Sharing Portal
          </h1>
          <p className="text-sm text-[#6B7280] font-medium mt-1">
            Alumni & Faculty publishing Internships, Jobs, Research Projects, Scholarships, Training & Workshops.
          </p>
        </div>

        <RoleGate allow={['alumni', 'faculty', 'admin']}>
          <Button
            variant="primary"
            size="md"
            onClick={() => setShowPostJobModal(true)}
            icon={<Plus className="w-4 h-4" />}
            className="self-start sm:self-auto"
          >
            Publish Opportunity
          </Button>
        </RoleGate>
      </div>

      {applySuccessMsg && (
        <div className="p-4 bg-[#0A0A0A] text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-sm animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
          {applySuccessMsg}
        </div>
      )}

      {/* Horizontally Scrollable Category Tabs */}
      <div className="overflow-x-auto pb-1 scrollbar-none">
        <SegmentedTabs
          options={categoryTabOptions}
          activeTab={activeTypeFilter}
          onChange={(type) => setActiveTypeFilter(type)}
        />
      </div>

      {/* Search Input Bar */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 shadow-none">
        <div className="relative">
          <Search className="w-4 h-4 text-[#9CA3AF] absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search opportunities by title, company, location, or required skill..."
            className="app-input w-full pl-11 border-[#E5E7EB] rounded-lg bg-[#FAFAFA]"
          />
        </div>
      </div>

      {/* Toast Notice */}
      <ToastNotice
        message={applySuccessMsg}
        onClose={() => setApplySuccessMsg(null)}
        className="mb-4"
      />

      {/* Opportunities List or Clean Empty State */}
      {filteredJobs.length === 0 ? (
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-12 text-center space-y-4 shadow-none font-sans">
          <div className="w-12 h-12 rounded-xl bg-[#F3F4F6] border border-[#E5E7EB] flex items-center justify-center text-[#0A0A0A] mx-auto">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-[#0A0A0A] text-base">No Opportunities Found</h3>
            <p className="text-xs text-[#6B7280] font-medium mt-1 max-w-md mx-auto">
              No active listings match your selected category filter or search terms. Try resetting filters or check back soon for new postings.
            </p>
          </div>
          <Button
            variant="secondary"
            size="md"
            onClick={() => { setActiveTypeFilter('All'); setSearchTerm(''); }}
            icon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Reset Search Filters
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredJobs.map((job, index) => {
            const isApplied = appliedJobIds.includes(job.id);
            const isSaved = savedJobIds.includes(job.id);
            const matchResult = isStudent ? calculateOpportunityMatch(studentProfile, job) : null;

            return (
              <motion.div
                key={job.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: Math.min(index * 0.03, 0.35) }}
                whileHover={{ y: -2, borderColor: '#9CA3AF' }}
                className="bg-white border border-[#E5E7EB] rounded-xl p-6 space-y-4 shadow-none transition-colors duration-150"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#F3F4F6] border border-[#E5E7EB] flex items-center justify-center text-[#0A0A0A] font-bold shrink-0">
                      <Building2 className="w-6 h-6" />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 flex-wrap text-xs">
                        <Badge variant="indigo">{job.type}</Badge>
                        {matchResult && (
                          <Badge variant="emerald" icon={<Sparkles className="w-3 h-3 text-[#065F46]" />}>
                            {matchResult.score}% Smart Match
                          </Badge>
                        )}
                      </div>

                      <h3 className="text-base font-bold text-[#0A0A0A]">
                        {job.title}
                      </h3>
                      <p className="text-xs text-[#6B7280] font-medium">
                        {job.company} • Posted by <strong className="text-[#0A0A0A]">{job.postedByAlumniName}</strong>
                      </p>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#6B7280] font-medium">
                        <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-[#9CA3AF]" /> {job.location}</span>
                        <span>•</span>
                        <span className="font-mono font-bold text-[#0A0A0A]">💰 {job.stipendOrSalary}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-[#9CA3AF]" /> Deadline: {job.applicationDeadline}</span>
                      </div>

                      {matchResult && matchResult.matchReasons.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {matchResult.matchReasons.map(r => (
                            <span key={r} className="px-2.5 py-0.5 bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0] rounded-full text-[10px] font-bold">
                              ✓ {r}
                            </span>
                          ))}
                        </div>
                      )}

                      <p className="text-xs text-[#374151] leading-relaxed line-clamp-2 font-medium">
                        {job.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start shrink-0">
                    <button
                      onClick={e => handleToggleSaveJob(e, job.id)}
                      className={`p-2.5 rounded-lg border transition-all cursor-pointer ${
                        isSaved ? 'bg-[#FAFAFA] border-[#0A0A0A] text-[#0A0A0A]' : 'bg-white border-[#E5E7EB] text-[#9CA3AF] hover:text-[#0A0A0A]'
                      }`}
                      title={isSaved ? 'Saved Opportunity' : 'Save Opportunity'}
                    >
                      <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-[#0A0A0A]' : ''}`} />
                    </button>

                    <Button
                      variant={isApplied ? 'secondary' : 'primary'}
                      size="md"
                      onClick={() => setSelectedJobModal(job)}
                    >
                      {isApplied ? 'Applied' : 'View & Apply'}
                    </Button>
                  </div>

                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      <Modal
        isOpen={!!selectedJobModal}
        onClose={() => setSelectedJobModal(null)}
        title={selectedJobModal?.title}
        subtitle={`${selectedJobModal?.company} • ${selectedJobModal?.location}`}
      >
        {selectedJobModal && (
          <div className="space-y-4 font-sans text-xs">
            <div>
              <Badge variant="indigo">{selectedJobModal.type}</Badge>
            </div>

            <div className="p-4 bg-[#FAFAFA] border border-[#E5E7EB] rounded-lg space-y-2">
              <span className="app-label text-[#0A0A0A] font-bold">Opportunity Overview</span>
              <p className="text-xs text-[#374151] leading-relaxed font-medium">{selectedJobModal.description}</p>
            </div>

            <div className="pt-3 border-t border-[#E5E7EB] flex items-center justify-between">
              <div>
                <span className="app-label text-[#0A0A0A] font-bold">Stipend / Package</span>
                <span className="font-mono font-bold text-[#0A0A0A] text-sm block">{selectedJobModal.stipendOrSalary}</span>
              </div>

              <Button
                variant="primary"
                size="md"
                onClick={() => handleApply(selectedJobModal.id)}
                disabled={appliedJobIds.includes(selectedJobModal.id)}
                icon={<Send className="w-4 h-4" />}
              >
                {appliedJobIds.includes(selectedJobModal.id) ? 'Application Submitted' : 'Submit Application'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Publish Modal */}
      <Modal
        isOpen={showPostJobModal}
        onClose={() => setShowPostJobModal(false)}
        title="Publish Professional Opportunity"
        subtitle="Postings undergo lightweight Admin Moderation before appearing on student feeds."
        icon={<Briefcase className="w-5 h-5" />}
      >
        <form onSubmit={handlePostJobSubmit} className="space-y-3 font-sans text-xs">
          <div>
            <label className="app-label text-[#0A0A0A] font-bold">Opportunity Type</label>
            <select
              value={newType}
              onChange={e => setNewType(e.target.value as OpportunityType)}
              className="app-input w-full font-bold border-[#E5E7EB] rounded-lg bg-[#FAFAFA]"
            >
              {opportunityTypes.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="app-label text-[#0A0A0A] font-bold">Opportunity Title</label>
            <input
              type="text"
              required
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              placeholder="e.g. Cloud Systems & DevOps Intern"
              className="app-input w-full font-bold border-[#E5E7EB] rounded-lg bg-[#FAFAFA]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="app-label text-[#0A0A0A] font-bold">Organization / Dept</label>
              <input
                type="text"
                required
                value={newCompany}
                onChange={e => setNewCompany(e.target.value)}
                placeholder="e.g. Google India / CMPN Lab"
                className="app-input w-full border-[#E5E7EB] rounded-lg bg-[#FAFAFA]"
              />
            </div>

            <div>
              <label className="app-label text-[#0A0A0A] font-bold">Location</label>
              <input
                type="text"
                value={newLocation}
                onChange={e => setNewLocation(e.target.value)}
                placeholder="e.g. Mumbai / Hybrid"
                className="app-input w-full border-[#E5E7EB] rounded-lg bg-[#FAFAFA]"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#E5E7EB] font-display text-xs">
            <Button type="button" variant="secondary" size="md" onClick={() => setShowPostJobModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md">
              Submit for Moderation
            </Button>
          </div>
        </form>
      </Modal>

    </div>
  );
};

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
  Building2,
  Bookmark,
  Sparkles,
  Briefcase,
  Calendar,
  MapPin,
  RefreshCw,
  Send,
  Filter
} from 'lucide-react';
import {
  Badge,
  Button,
  SegmentedTabs,
  Modal,
  TextField,
  SelectField,
  TextArea,
  EmptyState
} from '../../components/common/UIComponents';

export const JobPortalPage: React.FC = () => {
  const { jobsList, addJob, applyForJob, isDataLoading } = useData();
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
    setApplySuccessMsg('Application and verified student profile transmitted to publisher.');
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
      stipendOrSalary: newSalary || 'Stipend / Salary provided',
      department: ['CMPN', 'INFT', 'EXTC'],
      skillsRequired: ['Problem Solving', 'Technical Skills'],
      postedByAlumniId: currentUser.id,
      postedByAlumniName: `${currentUser.name} (${currentUser.role})`,
      postedByRole: currentUser.role as any,
      applicationDeadline: newDeadline || '2026-08-31',
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
      setApplySuccessMsg('Opportunity published to institutional feeds.');
    } else {
      setApplySuccessMsg('Opportunity submitted. It is now in the admin moderation queue before appearing on student feeds.');
    }
    setTimeout(() => setApplySuccessMsg(null), 4500);
  };

  const categoryTabOptions = [
    { id: 'All', label: 'All opportunities', count: publishedJobs.length },
    ...opportunityTypes.map(t => ({ id: t, label: t, count: publishedJobs.filter(j => j.type === t).length }))
  ];

  return (
    <div className="space-y-5 font-sans text-xs">
      
      {/* Action Bar: Title, Context and Post Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-[#0A0A0A]">
            Jobs & internships
          </h2>
          <p className="text-xs text-[#6B7280]">
            Explore career referrals, internships, and research opportunities published by alumni and faculty.
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
            Post an opportunity
          </Button>
        </RoleGate>
      </div>

      {applySuccessMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs font-medium rounded-lg flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>{applySuccessMsg}</span>
        </div>
      )}

      {/* B6: Category Tabs with Horizontal Scroll & Gradient Edge Fade */}
      <div className="relative w-full">
        <div className="overflow-x-auto pb-1 scrollbar-none flex">
          <SegmentedTabs
            options={categoryTabOptions}
            activeTab={activeTypeFilter}
            onChange={(type) => setActiveTypeFilter(type)}
          />
        </div>
        <div className="pointer-events-none absolute right-0 top-0 bottom-1 w-8 bg-gradient-to-l from-white to-transparent hidden sm:block" />
      </div>

      {/* Search Input Bar */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-3">
        <TextField
          placeholder="Search opportunities by title, company, location, or skill..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          leadingIcon={<Search className="w-4 h-4" />}
        />
      </div>

      {/* Opportunities List or Empty State (P2: Dual empty state) */}
      {isDataLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#0A0A0A] border-t-transparent"></div>
          <p className="text-[#6B7280] text-xs">Loading opportunities...</p>
        </div>
      ) : filteredJobs.length === 0 ? (
        publishedJobs.length === 0 ? (
          <EmptyState
            icon={<Briefcase className="w-8 h-8 text-[#0A0A0A]" />}
            title="No opportunities posted yet"
            description="Verified alumni and faculty have not posted any active listings yet. Check back soon or post an opening."
            action={
              (currentRole === 'alumni' || currentRole === 'faculty' || currentRole === 'admin') ? (
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => setShowPostJobModal(true)}
                  icon={<Plus className="w-4 h-4" />}
                >
                  Post an opportunity
                </Button>
              ) : undefined
            }
          />
        ) : (
          <EmptyState
            icon={<Filter className="w-8 h-8 text-[#6B7280]" />}
            title="No results match your filters"
            description="No active listings match your selected category filter or search terms."
            action={
              <Button
                variant="secondary"
                size="md"
                onClick={() => { setActiveTypeFilter('All'); setSearchTerm(''); }}
                icon={<RefreshCw className="w-3.5 h-3.5" />}
              >
                Clear filters
              </Button>
            }
          />
        )
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
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18, delay: Math.min(index * 0.02, 0.2) }}
                className="bg-white border border-[#E5E7EB] rounded-xl p-5 sm:p-6 space-y-4 hover:border-[#0A0A0A] transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-lg bg-[#FAFAFA] border border-[#E5E7EB] flex items-center justify-center text-[#0A0A0A] font-medium shrink-0">
                      <Building2 className="w-5 h-5 text-[#0A0A0A]" />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap text-xs">
                        <Badge variant="indigo">{job.type}</Badge>
                        {matchResult && (
                          <Badge variant="emerald" icon={<Sparkles className="w-3 h-3 text-[#065F46]" />}>
                            {matchResult.score}% match
                          </Badge>
                        )}
                      </div>

                      <h3 className="text-base font-semibold text-[#0A0A0A]">
                        {job.title}
                      </h3>
                      <p className="text-xs text-[#6B7280]">
                        {job.company} · Posted by <strong className="text-[#0A0A0A] font-medium">{job.postedByAlumniName}</strong>
                      </p>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#6B7280]">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-[#6B7280]" />
                          {job.location}
                        </span>
                        <span>·</span>
                        <span className="font-medium text-[#0A0A0A]">{job.stipendOrSalary}</span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-[#6B7280]" />
                          Deadline: {job.applicationDeadline}
                        </span>
                      </div>

                      {matchResult && matchResult.matchReasons.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {matchResult.matchReasons.map(r => (
                            <span key={r} className="px-2 py-0.5 bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0] rounded-md text-[11px] font-medium">
                              ✓ {r}
                            </span>
                          ))}
                        </div>
                      )}

                      <p className="text-xs text-[#374151] leading-relaxed line-clamp-2">
                        {job.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start shrink-0">
                    <button
                      type="button"
                      onClick={e => handleToggleSaveJob(e, job.id)}
                      className={`p-2 rounded-lg border transition-colors cursor-pointer touch-target-44 ${
                        isSaved ? 'bg-[#FAFAFA] border-[#0A0A0A] text-[#0A0A0A]' : 'bg-white border-[#E5E7EB] text-[#6B7280] hover:text-[#0A0A0A]'
                      }`}
                      title={isSaved ? 'Saved opportunity' : 'Save opportunity'}
                    >
                      <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-[#0A0A0A]' : ''}`} />
                    </button>

                    <Button
                      variant={isApplied ? 'secondary' : 'primary'}
                      size="md"
                      onClick={() => setSelectedJobModal(job)}
                    >
                      {isApplied ? 'Applied' : 'View & apply'}
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
        subtitle={`${selectedJobModal?.company} · ${selectedJobModal?.location}`}
      >
        {selectedJobModal && (
          <div className="space-y-4 font-sans text-xs">
            <div>
              <Badge variant="indigo">{selectedJobModal.type}</Badge>
            </div>

            <div className="p-3.5 bg-[#FAFAFA] border border-[#E5E7EB] rounded-lg space-y-1.5">
              <span className="app-label text-[#0A0A0A]">Opportunity overview</span>
              <p className="text-xs text-[#374151] leading-relaxed">{selectedJobModal.description}</p>
            </div>

            <div className="pt-3 border-t border-[#E5E7EB] flex items-center justify-between">
              <div>
                <span className="app-label text-[#0A0A0A]">Stipend / package</span>
                <span className="font-medium text-[#0A0A0A] text-sm block">{selectedJobModal.stipendOrSalary}</span>
              </div>

              <Button
                variant="primary"
                size="md"
                onClick={() => handleApply(selectedJobModal.id)}
                disabled={appliedJobIds.includes(selectedJobModal.id)}
                icon={<Send className="w-3.5 h-3.5" />}
              >
                {appliedJobIds.includes(selectedJobModal.id) ? 'Application submitted' : 'Submit application'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Post Opportunity Modal */}
      <Modal
        isOpen={showPostJobModal}
        onClose={() => setShowPostJobModal(false)}
        title="Post an opportunity"
        subtitle="Opportunities undergo administrative moderation before appearing on student feeds."
        icon={<Briefcase className="w-5 h-5 text-[#0A0A0A]" />}
      >
        <form onSubmit={handlePostJobSubmit} className="space-y-3 font-sans text-xs">
          <SelectField
            label="Opportunity type"
            value={newType}
            onChange={e => setNewType(e.target.value as OpportunityType)}
            options={opportunityTypes.map(t => ({ value: t, label: t }))}
          />

          <TextField
            label="Opportunity title"
            required
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            placeholder="e.g. Cloud Systems & DevOps Intern"
          />

          <div className="grid grid-cols-2 gap-3">
            <TextField
              label="Organization / department"
              required
              value={newCompany}
              onChange={e => setNewCompany(e.target.value)}
              placeholder="e.g. Google India / CMPN Lab"
            />

            <TextField
              label="Location"
              value={newLocation}
              onChange={e => setNewLocation(e.target.value)}
              placeholder="e.g. Mumbai / Hybrid"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <TextField
              label="Stipend / package"
              value={newSalary}
              onChange={e => setNewSalary(e.target.value)}
              placeholder="e.g. ₹25,000 / month"
            />

            <TextField
              label="Application deadline"
              type="date"
              value={newDeadline}
              onChange={e => setNewDeadline(e.target.value)}
            />
          </div>

          <TextArea
            label="Description"
            rows={3}
            value={newDescription}
            onChange={e => setNewDescription(e.target.value)}
            placeholder="Detail the opportunity responsibilities and candidate qualifications..."
          />

          <div className="flex justify-end gap-2 pt-2 border-t border-[#E5E7EB]">
            <Button type="button" variant="secondary" size="md" onClick={() => setShowPostJobModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md">
              Submit for moderation
            </Button>
          </div>
        </form>
      </Modal>

    </div>
  );
};

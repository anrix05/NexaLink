import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import type { AlumniProfile, JobListing } from '../../types';
import {
  Briefcase,
  BookOpen,
  Calendar,
  MessageSquare,
  Star,
  Plus,
  Edit3,
  RotateCcw,
  FileText,
  AlertCircle
} from 'lucide-react';
import {
  PageHeader,
  Section,
  StatStrip,
  ListRow,
  RightRail,
  StatusBadge,
  CapacityMeter,
  Switch,
  EmptyState
} from '../../components/ui';
import { Modal, TextField, SelectField, TextArea } from '../../components/common/UIComponents';
import { NoticeBoard } from '../../components/notices/NoticeBoard';
import { getGreetingName } from '../../utils/validators';

const SuggestedStudentsCard = React.lazy(() => import('../../features/outreach/SuggestedStudentsCard').then(m => ({ default: m.SuggestedStudentsCard })));

interface AlumniDashboardProps {
  setActiveTab: (tab: string, subTab?: string) => void;
}

const AlumniDashboardContent: React.FC<AlumniDashboardProps & { alumni: AlumniProfile }> = ({
  setActiveTab,
  alumni
}) => {
  const {
    jobsList,
    mentorshipRequests,
    announcements,
    updateMentorshipStatus,
    studentList,
    updateUserProfile,
    updateJobListing,
    toggleJobStatus
  } = useData();

  const [isMentoring, setIsMentoring] = useState<boolean>(alumni?.isMentoringAvailable ?? true);
  const [maxMentees, setMaxMentees] = useState<number>(alumni.maxMentees || 5);

  // Profile Edit Modal State
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [company, setCompany] = useState(alumni.company || 'Google');
  const [designation, setDesignation] = useState(alumni.designation || 'Staff Software Engineer');
  const [location, setLocation] = useState(alumni.location || 'Sunnyvale, CA');
  const [skillsText, setSkillsText] = useState((alumni.skills || ['Distributed Systems', 'Go', 'Kubernetes', 'Cloud AI']).join(', '));
  const [bio, setBio] = useState(alumni.bio || 'VIT provided the best platform and infrastructure through its digitally equipped campus.');

  // Edit Job Listing Modal State
  const [editingJob, setEditingJob] = useState<JobListing | null>(null);
  const [editJobTitle, setEditJobTitle] = useState('');
  const [editJobCompany, setEditJobCompany] = useState('');
  const [editJobStipend, setEditJobStipend] = useState('');
  const [editJobType, setEditJobType] = useState<JobListing['type']>('Full-Time');
  const [editJobLocation, setEditJobLocation] = useState('');
  const [editJobDeadline, setEditJobDeadline] = useState('');
  const [editJobDescription, setEditJobDescription] = useState('');

  const [notice, setNotice] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 3500);
  };

  const handleToggleMentoring = (nextVal: boolean) => {
    setIsMentoring(nextVal);
    updateUserProfile(alumni.id, { isMentoringAvailable: nextVal });
    showToast(nextVal ? 'Mentorship availability enabled: Accepting student asks.' : 'Mentorship paused: Set to busy.');
  };

  const handleCapacityChange = (newVal: number) => {
    setMaxMentees(newVal);
    updateUserProfile(alumni.id, { maxMentees: newVal });
    showToast(`Mentee capacity updated to ${newVal}.`);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile(alumni.id, {
      company,
      designation,
      location,
      skills: skillsText.split(',').map(s => s.trim()).filter(Boolean),
      bio
    });
    setShowProfileModal(false);
    showToast('Alumni profile details updated successfully!');
  };

  const handleSaveJobEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingJob) return;
    updateJobListing(editingJob.id, {
      title: editJobTitle,
      company: editJobCompany,
      stipendOrSalary: editJobStipend,
      type: editJobType,
      location: editJobLocation,
      applicationDeadline: editJobDeadline,
      description: editJobDescription
    });
    setEditingJob(null);
    showToast(`Opportunity "${editJobTitle}" updated successfully.`);
  };

  // Central data deductions
  const myPostedJobs = jobsList.filter(
    j => j.postedByAlumniId === alumni.id || j.postedByAlumniName.includes(alumni.name)
  );
  const myStudentRequests = mentorshipRequests.filter(
    r => r.mentorId === alumni.id || r.mentorName.includes(alumni.name)
  );

  const pendingRequests = myStudentRequests.filter(r => r.status === 'Pending');
  const studentsMentoredCount = myStudentRequests.filter(r => r.status === 'Accepted' || r.status === 'Completed').length;
  const activeMenteesCount = myStudentRequests.filter(r => r.status === 'Accepted').length;

  const ratedRequests = myStudentRequests.filter(r => r.feedback && r.feedback.rating);
  const totalReviewsCount = ratedRequests.length;
  const avgRating =
    totalReviewsCount > 0
      ? (ratedRequests.reduce((sum, r) => sum + (r.feedback?.rating || 0), 0) / totalReviewsCount).toFixed(1)
      : null;

  // Accreditation missing employment check
  const missingEmploymentFields = [];
  if (!alumni.company) missingEmploymentFields.push('Employer name');
  if (!alumni.designation) missingEmploymentFields.push('Current designation');
  if (!alumni.location) missingEmploymentFields.push('Work location');

  return (
    <div className="space-y-8">
      {/* Toast Notice */}
      {notice && (
        <div className="fixed top-20 right-6 z-50 bg-[#0A0A0A] text-white px-4 py-2.5 rounded-lg text-xs font-medium shadow-md transition-opacity">
          {notice}
        </div>
      )}

      {/* 1. Header (Open Canvas PageHeader primitive) */}
      <PageHeader
        eyebrow="Verified alumnus"
        title={`Welcome back, ${getGreetingName(alumni.name)}`}
        subtitle={
          <div className="flex items-center gap-2 flex-wrap text-xs text-[#6B7280]">
            <span className="text-[#0A0A0A] font-medium">
              {alumni.designation} at {alumni.company}
            </span>
            <span>·</span>
            <span>VIT {alumni.department}</span>
            <span>·</span>
            <span>Class of <span className="tabular-nums">{alumni.graduationYear}</span></span>
            {alumni.location && (
              <>
                <span>·</span>
                <span>{alumni.location}</span>
              </>
            )}
          </div>
        }
        actions={
          <button
            type="button"
            onClick={() => setShowProfileModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-[#6B7280] hover:bg-[#FAFAFA] text-[#0A0A0A] text-xs font-medium rounded-lg transition-colors cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit profile</span>
          </button>
        }
      />

      {/* Important Notices (Top placement below 1280px) */}
      <NoticeBoard variant="top" role="alumni" setActiveTab={setActiveTab} onNavigate={(tab) => setActiveTab(tab)} />

      {/* Accreditation Employment Banner (if data incomplete) */}
      {missingEmploymentFields.length > 0 && (
        <div className="bg-[#FAFAFA] border border-[#E5E7EB] p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-[#B45309] shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-xs text-[#0A0A0A]">
                Employment information incomplete for NIRF accreditation
              </h4>
              <p className="text-xs text-[#6B7280] mt-0.5">
                VIT Wadala tracks institutional graduate outcomes for national accreditation rankings. Missing:{' '}
                <span className="text-[#B45309] font-medium">{missingEmploymentFields.join(', ')}</span>.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowProfileModal(true)}
            className="px-3 py-1.5 bg-[#0A0A0A] hover:bg-[#262626] text-white text-xs font-medium rounded-lg transition-colors cursor-pointer shrink-0"
          >
            Confirm employer data
          </button>
        </div>
      )}

      {/* Two-Column Responsive Layout: Main Canvas + Quiet Right Rail */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 items-start">
        {/* Main Canvas Content */}
        <div className="space-y-8 min-w-0">
          {/* Section 1: Your Impact (Replaces solid black card with standard StatStrip) */}
          <Section
            title="Your impact"
            description="Verified student evaluations, active mentorships, and published referrals."
            noTopHairline
          >
            <StatStrip
              items={[
                {
                  label: 'Students mentored',
                  value: studentsMentoredCount,
                  subtext: 'Active & completed sessions'
                },
                {
                  label: 'Opportunities posted',
                  value: myPostedJobs.length,
                  subtext: 'Active referrals published'
                },
                {
                  label: 'Average rating',
                  value: avgRating ? `${avgRating} / 5.0` : '—',
                  subtext: avgRating
                    ? `From ${totalReviewsCount} ${totalReviewsCount === 1 ? 'review' : 'reviews'}`
                    : 'No ratings yet'
                },
                {
                  label: 'Active mentees',
                  value: `${activeMenteesCount} / ${maxMentees}`,
                  subtext: activeMenteesCount >= maxMentees ? 'Capacity full' : `${maxMentees - activeMenteesCount} slots open`
                }
              ]}
            />
          </Section>

          {/* Section 2: Requests Waiting for Your Response */}
          <Section
            title="Requests waiting for your response"
            count={pendingRequests.length}
            description="Student mentorship requests pending your approval or decline."
          >
            {pendingRequests.length === 0 ? (
              <EmptyState
                icon={<BookOpen className="w-5 h-5 text-[#0A0A0A]" />}
                title="No pending guidance requests"
                sentence="You have responded to all incoming mentorship asks. Active sessions can be managed in the Mentorship workspace."
              />
            ) : (
              <div className="divide-y divide-[#E5E7EB] border-t border-b border-[#E5E7EB]">
                {pendingRequests.map((req, index) => {
                  const matchedStudent = studentList.find(s => s.id === req.studentId || s.email === req.studentEmail);
                  const studentResumeUrl = matchedStudent?.resumeUrl || (req as any).studentResumeUrl || null;

                  return (
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
                          <StatusBadge tone="indigo" label={req.studentDepartment || alumni.department} />
                          <span className="text-xs text-[#6B7280]">Year: {req.studentYear}</span>
                        </div>
                      }
                      subtitle={
                        <div className="space-y-1.5 mt-1">
                          <div className="text-xs text-[#6B7280]">
                            PRN: <span className="font-mono text-[#0A0A0A]">{req.studentEnrollmentNo || 'N/A'}</span> · {req.studentEmail}
                          </div>
                          <div className="p-2.5 bg-[#FAFAFA] rounded-md text-xs text-[#0A0A0A]">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <strong>Topic: {req.purposeOfRequest || req.topic}</strong>
                              {(req.proposedDate || req.proposedTimeSlot) && (
                                <span className="text-[11px] text-[#6B7280] flex items-center gap-1">
                                  <Calendar className="w-3 h-3 text-[#6B7280]" />
                                  Proposed: {req.proposedDate || 'Flexible'} ({req.proposedTimeSlot || 'Anytime'})
                                </span>
                              )}
                            </div>
                            {req.message && (
                              <p className="mt-1 text-[#6B7280] italic leading-relaxed">"{req.message}"</p>
                            )}
                          </div>
                          {studentResumeUrl && (
                            <div>
                              {studentResumeUrl.startsWith('http://') || studentResumeUrl.startsWith('https://') ? (
                                <a
                                  href={studentResumeUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 text-xs text-[#0A0A0A] hover:underline"
                                >
                                  <FileText className="w-3.5 h-3.5 text-[#6B7280]" />
                                  <span>View student resume →</span>
                                </a>
                              ) : (
                                <span className="text-xs text-[#6B7280]">Resume: {studentResumeUrl}</span>
                              )}
                            </div>
                          )}
                        </div>
                      }
                      meta={
                        req.requestedDate ? (
                          <span className="text-xs text-[#6B7280] tabular-nums">
                            {req.requestedDate}
                          </span>
                        ) : undefined
                      }
                      trailing={
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              updateMentorshipStatus(req.id, 'Declined', 'Declined due to mentorship bandwidth.', 'alumni');
                              showToast(`Mentorship request from ${req.studentName} declined.`);
                            }}
                            className="px-3 py-1.5 border border-[#6B7280] hover:bg-[#FAFAFA] text-[#0A0A0A] text-xs font-medium rounded-lg transition-colors cursor-pointer"
                          >
                            Decline
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              updateMentorshipStatus(req.id, 'Accepted', 'Accepted by alumni mentor.', 'alumni');
                              showToast(`Mentorship request from ${req.studentName} accepted!`);
                            }}
                            className="px-3 py-1.5 bg-[#0A0A0A] hover:bg-[#262626] text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
                          >
                            Accept mentorship
                          </button>
                        </div>
                      }
                    />
                  );
                })}
              </div>
            )}
          </Section>

          {/* Section 3: Opportunities You've Posted */}
          <Section
            title="Opportunities you've posted"
            count={myPostedJobs.length}
            description="Manage your active referral postings, edit descriptions, or close filled positions."
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
                sentence="Share job vacancies, internships, or referral opportunities directly with VIT students and alumni."
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
                {myPostedJobs.map((job, index) => {
                  const isClosed = job.status === 'Closed';
                  const isPending = job.moderationStatus === 'Pending Approval';

                  return (
                    <ListRow
                      key={job.id}
                      isFirst={index === 0}
                      leading={
                        <div className="w-9 h-9 rounded-lg bg-[#F3F4F6] text-[#0A0A0A] flex items-center justify-center shrink-0">
                          <Briefcase className="w-4 h-4 text-[#0A0A0A]" />
                        </div>
                      }
                      title={job.title}
                      subtitle={
                        <div>
                          <span>{job.company} · {job.location} · <strong className="text-[#0A0A0A]">{job.stipendOrSalary}</strong></span>
                          {job.description && (
                            <p className="text-xs text-[#6B7280] line-clamp-1 mt-0.5">"{job.description}"</p>
                          )}
                        </div>
                      }
                      meta={
                        <span className="text-xs text-[#6B7280] tabular-nums">
                          {job.applicantsCount || 0} applicants · Deadline: {job.applicationDeadline || 'Rolling'}
                        </span>
                      }
                      trailing={
                        <div className="flex items-center gap-2">
                          <StatusBadge
                            tone={isClosed ? 'neutral' : isPending ? 'amber' : 'emerald'}
                            label={isClosed ? 'Closed' : isPending ? 'Pending Moderation' : 'Active'}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              toggleJobStatus(job.id);
                              showToast(`Position "${job.title}" marked as ${isClosed ? 'Active' : 'Closed'}.`);
                            }}
                            className="px-2.5 py-1 text-xs text-[#6B7280] hover:text-[#0A0A0A] border border-[#E5E7EB] rounded-md transition-colors"
                          >
                            {isClosed ? 'Reopen' : 'Close'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingJob(job);
                              setEditJobTitle(job.title);
                              setEditJobCompany(job.company);
                              setEditJobStipend(job.stipendOrSalary);
                              setEditJobType(job.type);
                              setEditJobLocation(job.location);
                              setEditJobDeadline(job.applicationDeadline);
                              setEditJobDescription(job.description);
                            }}
                            className="px-2.5 py-1 text-xs text-[#0A0A0A] bg-[#FAFAFA] hover:bg-[#F3F4F6] border border-[#E5E7EB] rounded-md transition-colors"
                          >
                            Edit
                          </button>
                        </div>
                      }
                    />
                  );
                })}
              </div>
            )}
          </Section>

          {/* Section: Suggested Students */}
          <React.Suspense fallback={null}>
            <SuggestedStudentsCard onNavigateToDiscovery={() => setActiveTab('mentorship', 'discover')} />
          </React.Suspense>
        </div>

        {/* Quiet Right Rail (≥1280px / lg) */}
        <RightRail className="space-y-6">
          {/* Mentorship Capacity Stepper & Availability */}
          <div className="space-y-4 pb-6 border-b border-[#E5E7EB]">
            <h3 className="text-xs font-semibold text-[#0A0A0A]">
              Mentorship bandwidth
            </h3>

            <CapacityMeter
              activeCount={activeMenteesCount}
              maxCount={maxMentees}
              onMaxChange={handleCapacityChange}
              minLimit={1}
              maxLimit={10}
              mode="stepper"
              label="Mentoring capacity"
            />

            <Switch
              checked={isMentoring}
              onChange={handleToggleMentoring}
              label={isMentoring ? 'Accepting mentees' : 'Mentoring paused'}
              description="Students can send you 1-on-1 guidance requests"
              variant="emerald"
            />
          </div>

          {/* Quick Actions */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-[#0A0A0A]">Quick actions</h3>
            <div className="flex flex-col gap-1.5">
              <button
                type="button"
                onClick={() => setActiveTab('jobs')}
                className="text-left text-xs text-[#6B7280] hover:text-[#0A0A0A] py-1 transition-colors"
              >
                Post new job opportunity →
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('messaging')}
                className="text-left text-xs text-[#6B7280] hover:text-[#0A0A0A] py-1 transition-colors"
              >
                Open messages & chats →
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('directory')}
                className="text-left text-xs text-[#6B7280] hover:text-[#0A0A0A] py-1 transition-colors"
              >
                Search alumni directory →
              </button>
            </div>
          </div>

          {/* Real Important Notices in RightRail (≥1280px) */}
          <NoticeBoard variant="rail" role="alumni" setActiveTab={setActiveTab} onNavigate={(tab) => setActiveTab(tab)} />
        </RightRail>
      </div>

      {/* Profile Edit Modal */}
      <Modal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        title="Edit Alumni Profile"
        subtitle="Update your organization, designation, and expertise."
        maxWidth="md"
      >
        <form onSubmit={handleSaveProfile} className="space-y-3 font-sans text-xs">
          <TextField
            label="Company or employer"
            type="text"
            value={company}
            onChange={e => setCompany(e.target.value)}
          />

          <TextField
            label="Designation or role"
            type="text"
            value={designation}
            onChange={e => setDesignation(e.target.value)}
          />

          <TextField
            label="Current location"
            type="text"
            value={location}
            onChange={e => setLocation(e.target.value)}
          />

          <TextField
            label="Technical skills (comma separated)"
            type="text"
            value={skillsText}
            onChange={e => setSkillsText(e.target.value)}
          />

          <TextArea
            label="Professional summary / Bio"
            value={bio}
            onChange={e => setBio(e.target.value)}
            rows={3}
          />

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E5E7EB]">
            <button
              type="button"
              onClick={() => setShowProfileModal(false)}
              className="px-3.5 py-2 border border-[#6B7280] hover:bg-[#FAFAFA] text-[#0A0A0A] text-xs font-medium rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#0A0A0A] hover:bg-[#262626] text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
            >
              Save profile
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Job Modal */}
      {editingJob && (
        <Modal
          isOpen={true}
          onClose={() => setEditingJob(null)}
          title="Edit Job Listing"
          subtitle={`Editing listing for ${editingJob.title}`}
          maxWidth="lg"
        >
          <form onSubmit={handleSaveJobEdit} className="space-y-3 font-sans text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <TextField
                label="Job title"
                type="text"
                value={editJobTitle}
                onChange={e => setEditJobTitle(e.target.value)}
                required
              />
              <TextField
                label="Company"
                type="text"
                value={editJobCompany}
                onChange={e => setEditJobCompany(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <TextField
                label="Stipend or salary"
                type="text"
                value={editJobStipend}
                onChange={e => setEditJobStipend(e.target.value)}
              />
              <SelectField
                label="Employment type"
                value={editJobType}
                onChange={e => setEditJobType(e.target.value as JobListing['type'])}
                options={[
                  { label: 'Full-Time', value: 'Full-Time' },
                  { label: 'Internship', value: 'Internship' },
                  { label: 'Part-Time', value: 'Part-Time' },
                  { label: 'Referral Only', value: 'Referral' }
                ]}
              />
              <TextField
                label="Location"
                type="text"
                value={editJobLocation}
                onChange={e => setEditJobLocation(e.target.value)}
              />
            </div>

            <TextField
              label="Application deadline"
              type="text"
              value={editJobDeadline}
              onChange={e => setEditJobDeadline(e.target.value)}
            />

            <TextArea
              label="Job description"
              value={editJobDescription}
              onChange={e => setEditJobDescription(e.target.value)}
              rows={4}
            />

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E5E7EB]">
              <button
                type="button"
                onClick={() => setEditingJob(null)}
                className="px-3.5 py-2 border border-[#6B7280] hover:bg-[#FAFAFA] text-[#0A0A0A] text-xs font-medium rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#0A0A0A] hover:bg-[#262626] text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
              >
                Update listing
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export const AlumniDashboard: React.FC<AlumniDashboardProps> = props => {
  const { currentUser } = useAuth();
  if (!currentUser) return null;
  return <AlumniDashboardContent {...props} alumni={currentUser as AlumniProfile} />;
};

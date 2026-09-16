import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import type { AlumniProfile } from '../../types';
import {
  Briefcase,
  BookOpen,
  CheckCircle2,
  Plus,
  Users,
  Calendar,
  MessageSquare,
  Bell,
  Check,
  User,
  Sparkles,
  Star,
  Award,
  Sliders,
  X,
  ShieldCheck,
  ChevronRight,
  FileText,
  Edit3,
  Clock,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import { Badge, Button, StatCard } from '../../components/common/UIComponents';
import type { JobListing } from '../../types';

interface AlumniDashboardProps {
  setActiveTab: (tab: string) => void;
}

const AlumniDashboardContent: React.FC<AlumniDashboardProps & { alumni: AlumniProfile }> = ({ setActiveTab, alumni }) => {
  const {
    jobsList,
    mentorshipRequests,
    eventsList,
    announcements,
    updateMentorshipStatus,
    studentList,
    allUsers,
    updateJobListing,
    toggleJobStatus
  } = useData();

  const [isMentoring, setIsMentoring] = useState<boolean>(alumni?.isMentoringAvailable ?? true);

  // Profile Edit Modal State
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [company, setCompany] = useState(alumni.company || 'Google');
  const [designation, setDesignation] = useState(alumni.designation || 'Senior Software Engineer');
  const [location, setLocation] = useState(alumni.location || 'Sunnyvale, CA');
  const [skillsText, setSkillsText] = useState((alumni.skills || ['Distributed Systems', 'Go', 'Kubernetes', 'Cloud AI']).join(', '));
  const [bio, setBio] = useState(alumni.bio || "VIT provided the best platform and infrastructure through its digitally equipped campus.");

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

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setShowProfileModal(false);
    showToast('Alumni profile details updated successfully!');
  };

  // Central mock data deduction
  const myPostedJobs = jobsList.filter(j => j.postedByAlumniId === alumni.id || j.postedByAlumniName.includes(alumni.name));
  const myStudentRequests = mentorshipRequests.filter(r => r.mentorId === alumni.id || r.mentorName.includes(alumni.name));

  const pendingRequests = myStudentRequests.filter(r => r.status === 'Pending');
  const studentsMentoredCount = myStudentRequests.filter(r => r.status === 'Accepted' || r.status === 'Completed').length;
  const activeMenteesCount = myStudentRequests.filter(r => r.status === 'Accepted').length;
  const maxLimit = alumni.maxMentees || 5;

  const ratedRequests = myStudentRequests.filter(r => r.feedback && r.feedback.rating);
  const totalReviewsCount = ratedRequests.length;
  const avgRating = totalReviewsCount > 0
    ? (ratedRequests.reduce((sum, r) => sum + (r.feedback?.rating || 0), 0) / totalReviewsCount).toFixed(1)
    : null;

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-16 sm:pb-0 font-sans text-xs">
      
      {notice && (
        <div className="p-4 bg-[#0A0A0A] text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-sm animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-[#16A34A]" /> {notice}
        </div>
      )}

      {/* 1. Refined Profile Header Banner */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 shadow-none space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <img
              src={alumni.avatar}
              alt={alumni.name}
              className="w-14 h-14 rounded-full object-cover border border-[#E5E7EB] shrink-0"
            />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-display font-black text-[#0A0A0A] tracking-tight">{alumni.name}</h1>
                <Badge variant="emerald" size="sm" icon={<CheckCircle2 className="w-3.5 h-3.5" />}>
                  Verified Alum
                </Badge>
              </div>
              <p className="text-xs text-[#0A0A0A] font-bold mt-0.5">
                {designation} at <strong className="text-[#0A0A0A]">{company}</strong>
              </p>
              <p className="text-xs text-[#6B7280] font-mono mt-0.5">
                VIT {alumni.department} • Class of {alumni.graduationYear || 2018} • {location}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              size="md"
              onClick={() => setShowProfileModal(true)}
              icon={<User className="w-3.5 h-3.5" />}
            >
              Edit Profile
            </Button>

            <div className="p-1.5 bg-[#FAFAFA] rounded-xl border border-[#E5E7EB] flex items-center gap-2">
              <span className="font-display font-bold text-[#6B7280] text-[10px] uppercase tracking-wider pl-1">Mentorship:</span>
              <button
                onClick={() => {
                  setIsMentoring(!isMentoring);
                  showToast(`Student mentorship status set to ${!isMentoring ? 'Active' : 'Paused'}.`);
                }}
                className={`px-3 py-1 text-xs font-display font-bold uppercase transition rounded-lg ${
                  isMentoring ? 'bg-[#0A0A0A] text-white shadow-xs' : 'bg-[#E5E7EB] text-[#374151]'
                }`}
              >
                {isMentoring ? 'Accepting Mentees' : 'Paused'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Impact Metrics Card — Solid Black #0A0A0A */}
      <div className="bg-[#0A0A0A] text-white p-6 rounded-xl border border-[#222222] space-y-4 shadow-none">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#222222] pb-4">
          <div className="flex items-center gap-2.5">
            <Award className="w-4 h-4 text-white" />
            <h2 className="font-display font-bold text-xs uppercase tracking-widest text-white">
              Institutional Impact & Mentorship Metrics
            </h2>
          </div>
          <span className="font-mono text-xs font-bold text-neutral-300 bg-white/10 px-3 py-0.5 rounded-full border border-white/20 self-start sm:self-auto">
            {avgRating ? `★ ${avgRating} / 5.0 Rating (${totalReviewsCount} ${totalReviewsCount === 1 ? 'Review' : 'Reviews'})` : 'No Ratings Received Yet'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="p-4 bg-white/5 border border-white/10 rounded-lg space-y-1 hover:bg-white/10 transition-all">
            <span className="text-[10px] font-mono uppercase font-bold tracking-widest text-neutral-400 block">Students Mentored</span>
            <span className="font-mono text-3xl font-bold text-white block mt-1">{studentsMentoredCount}</span>
            <span className="text-xs text-neutral-300 font-medium block">Active & Completed Sessions</span>
          </div>

          <div className="p-4 bg-white/5 border border-white/10 rounded-lg space-y-1 hover:bg-white/10 transition-all">
            <span className="text-[10px] font-mono uppercase font-bold tracking-widest text-neutral-400 block">Opportunities Posted</span>
            <span className="font-mono text-3xl font-bold text-white block mt-1">{myPostedJobs.length}</span>
            <span className="text-xs text-neutral-300 font-medium block">Active Referrals Published</span>
          </div>

          <div className="p-4 bg-white/5 border border-white/10 rounded-lg space-y-1 hover:bg-white/10 transition-all">
            <span className="text-[10px] font-mono uppercase font-bold tracking-widest text-neutral-400 block">Average Feedback Rating</span>
            <div className="flex items-center gap-1.5 text-white font-mono text-2xl font-bold mt-1">
              {avgRating ? (
                <>
                  <Star className="w-4 h-4 fill-white" /> {avgRating} / 5.0
                </>
              ) : (
                <span className="text-neutral-400 text-xs font-normal">No ratings yet</span>
              )}
            </div>
            <span className="text-xs text-neutral-400 font-medium block">Derived from student reviews</span>
          </div>
        </div>
      </div>

      {/* 3. Pending Mentorship Requests Waiting for Response */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 space-y-5 shadow-none">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5E7EB] pb-4">
          <div>
            <h3 className="font-display font-bold text-xs uppercase tracking-wider text-[#0A0A0A] flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#0A0A0A]" />
              Requests Waiting for Your Response ({pendingRequests.length} Pending)
            </h3>
            <p className="text-[#6B7280] font-medium text-xs mt-0.5">
              Student guidance requests pending your approval or decline.
            </p>
          </div>

          <Badge variant="indigo" size="md" icon={<Sliders className="w-3.5 h-3.5" />}>
            Capacity: Mentoring {activeMenteesCount}/{maxLimit} Students
          </Badge>
        </div>

        {pendingRequests.length === 0 ? (
          <div className="p-8 bg-[#FAFAFA] rounded-xl border border-dashed border-[#E5E7EB] text-center font-medium text-xs text-[#6B7280]">
            No pending guidance requests waiting. You can browse active mentorships in the Mentorship workspace.
          </div>
        ) : (
          <div className="space-y-3">
            {pendingRequests.map(req => {
              const matchedStudent = studentList.find(s => s.id === req.studentId || s.email === req.studentEmail);
              const studentResumeUrl = matchedStudent?.resumeUrl || (req as any).studentResumeUrl || null;

              return (
                <div key={req.id} className="p-4 bg-[#FAFAFA] border border-[#E5E7EB] rounded-xl space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#0A0A0A] text-sm">{req.studentName}</span>
                        <Badge variant="indigo">{req.studentDepartment}</Badge>
                        <span className="text-xs text-[#6B7280]">Year: {req.studentYear}</span>
                      </div>
                      <p className="text-xs text-[#6B7280] mt-0.5">
                        PRN: {req.studentEnrollmentNo} • Email: {req.studentEmail}
                      </p>
                    </div>

                    <span className="text-[10px] font-mono text-[#9CA3AF] self-start sm:self-auto">
                      {req.requestedDate}
                    </span>
                  </div>

                  <div className="p-3 bg-white border border-[#E5E7EB] rounded-lg text-xs text-[#374151] space-y-1.5">
                    <div className="flex items-center justify-between">
                      <strong>Topic: {req.purposeOfRequest}</strong>
                      {(req.proposedDate || req.proposedTimeSlot) && (
                        <span className="font-mono text-[11px] font-bold text-[#0A0A0A] bg-[#F3F4F6] px-2 py-0.5 rounded border border-[#E5E7EB] flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-[#6B7280]" />
                          Proposed: {req.proposedDate || 'Flexible'} ({req.proposedTimeSlot || 'Anytime'})
                        </span>
                      )}
                    </div>
                    <p className="leading-relaxed">"{req.message}"</p>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <div>
                      {studentResumeUrl ? (
                        studentResumeUrl.startsWith('http://') || studentResumeUrl.startsWith('https://') ? (
                          <a
                            href={studentResumeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-[#0A0A0A] bg-white border border-[#E5E7EB] rounded hover:bg-[#F3F4F6] transition-colors"
                          >
                            <FileText className="w-3.5 h-3.5 text-[#6B7280]" />
                            <span>Resume Link</span>
                          </a>
                        ) : (
                          <span className="text-[11px] font-mono text-[#6B7280]">Resume: {studentResumeUrl}</span>
                        )
                      ) : (
                        <span className="text-[11px] font-mono text-[#6B7280]">No resume uploaded</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          updateMentorshipStatus(req.id, 'Declined', 'Declined due to mentorship bandwidth.', 'alumni');
                          showToast(`Mentorship request from ${req.studentName} declined.`);
                        }}
                      >
                        Decline
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          updateMentorshipStatus(req.id, 'Accepted', 'Accepted by alumni mentor.', 'alumni');
                          showToast(`Mentorship request from ${req.studentName} accepted for proposed time!`);
                        }}
                      >
                        Accept Mentorship
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3.5 Posted Opportunities Management Section */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 space-y-4 shadow-none">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5E7EB] pb-3">
          <div>
            <h3 className="font-display font-bold text-xs uppercase tracking-wider text-[#0A0A0A] flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-[#0A0A0A]" />
              Job Listings Posted by You ({myPostedJobs.length})
            </h3>
            <p className="text-[#6B7280] font-medium text-xs mt-0.5">
              Manage your active referral postings, edit descriptions, or close filled positions.
            </p>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setActiveTab('jobs')}
            icon={<Plus className="w-3.5 h-3.5" />}
          >
            Post New Opportunity
          </Button>
        </div>

        {myPostedJobs.length === 0 ? (
          <div className="p-8 bg-[#FAFAFA] rounded-xl border border-dashed border-[#E5E7EB] text-center text-xs text-[#6B7280] font-medium">
            You have not posted any job listings yet. Click "Post New Opportunity" to share a referral.
          </div>
        ) : (
          <div className="space-y-3">
            {myPostedJobs.map(job => {
              const isClosed = job.status === 'Closed';
              const isPending = job.moderationStatus === 'Pending Approval';

              return (
                <div key={job.id} className="p-4 bg-[#FAFAFA] border border-[#E5E7EB] rounded-xl space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-[#0A0A0A] text-sm">{job.title}</h4>
                        <Badge variant={isClosed ? 'slate' : isPending ? 'amber' : 'emerald'}>
                          {isClosed ? 'Closed' : isPending ? 'Pending Moderation' : 'Active'}
                        </Badge>
                      </div>
                      <p className="text-xs text-[#6B7280] mt-0.5">
                        {job.company} • {job.location} • Posted: {job.postedDate}
                      </p>
                    </div>

                    <span className="font-mono text-xs font-bold text-[#0A0A0A] self-start sm:self-auto">
                      {job.stipendOrSalary}
                    </span>
                  </div>

                  <p className="text-xs text-[#374151] line-clamp-2 bg-white p-3 rounded-lg border border-[#E5E7EB]">
                    "{job.description}"
                  </p>

                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#E5E7EB]">
                    <span className="text-[11px] text-[#6B7280] font-mono">
                      Applicants: <strong>{job.applicantsCount || 0}</strong>
                    </span>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={<RotateCcw className="w-3.5 h-3.5" />}
                        onClick={() => {
                          toggleJobStatus(job.id);
                          showToast(`Position "${job.title}" marked as ${isClosed ? 'Active' : 'Closed'}.`);
                        }}
                      >
                        {isClosed ? 'Reopen Position' : 'Close Position'}
                      </Button>

                      <Button
                        variant="primary"
                        size="sm"
                        icon={<Edit3 className="w-3.5 h-3.5" />}
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
                      >
                        Edit Listing
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Quick Action Grid for Alumni */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 space-y-3">
          <div className="flex items-center gap-2 text-[#0A0A0A]">
            <Briefcase className="w-4 h-4 text-[#0A0A0A]" />
            <h3 className="font-bold text-xs uppercase tracking-wider">Post / Share Opportunity</h3>
          </div>
          <p className="text-xs text-[#6B7280]">
            Share job vacancies, internships, or referral opportunities directly with VIT students and fellow alumni.
          </p>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setActiveTab('jobs')}
            icon={<Plus className="w-3.5 h-3.5" />}
          >
            Post Opportunity
          </Button>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 space-y-3">
          <div className="flex items-center gap-2 text-[#0A0A0A]">
            <MessageSquare className="w-4 h-4 text-[#0A0A0A]" />
            <h3 className="font-bold text-xs uppercase tracking-wider">NexaChats</h3>
          </div>
          <p className="text-xs text-[#6B7280]">
            Connect 1-on-1 with accepted student mentees and network with fellow faculty and alumni peers.
          </p>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setActiveTab('messaging')}
            icon={<MessageSquare className="w-3.5 h-3.5" />}
          >
            Open Messages
          </Button>
        </div>
      </div>

      {/* Profile Edit Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E5E7EB] rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
              <h3 className="font-bold text-xs uppercase tracking-wider text-[#0A0A0A]">
                Edit Alumni Profile
              </h3>
              <button
                onClick={() => setShowProfileModal(false)}
                className="p-1 text-[#9CA3AF] hover:text-[#0A0A0A]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-3">
              <div>
                <label className="app-label text-[#0A0A0A] font-bold">Company / Employer</label>
                <input
                  type="text"
                  value={company}
                  onChange={e => setCompany(e.target.value)}
                  className="app-input w-full border-[#E5E7EB] rounded-lg"
                />
              </div>

              <div>
                <label className="app-label text-[#0A0A0A] font-bold">Designation / Role</label>
                <input
                  type="text"
                  value={designation}
                  onChange={e => setDesignation(e.target.value)}
                  className="app-input w-full border-[#E5E7EB] rounded-lg"
                />
              </div>

              <div>
                <label className="app-label text-[#0A0A0A] font-bold">Current Location</label>
                <input
                  type="text"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  className="app-input w-full border-[#E5E7EB] rounded-lg"
                />
              </div>

              <div>
                <label className="app-label text-[#0A0A0A] font-bold">Technical Skills (comma-separated)</label>
                <input
                  type="text"
                  value={skillsText}
                  onChange={e => setSkillsText(e.target.value)}
                  className="app-input w-full border-[#E5E7EB] rounded-lg"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E5E7EB]">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowProfileModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                >
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT JOB MODAL */}
      {editingJob && (() => {
        const isSubstantiveChange =
          editJobTitle !== editingJob.title ||
          editJobCompany !== editingJob.company ||
          editJobStipend !== editingJob.stipendOrSalary ||
          editJobType !== editingJob.type;

        return (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200 font-sans text-xs">
            <div className="bg-white border border-[#E5E7EB] rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
                <div className="flex items-center gap-2.5">
                  <Edit3 className="w-5 h-5 text-[#0A0A0A]" />
                  <h3 className="font-display font-bold text-sm text-[#0A0A0A]">
                    Edit Job Listing — {editingJob.title}
                  </h3>
                </div>
                <button onClick={() => setEditingJob(null)} className="p-1 text-[#9CA3AF] hover:text-[#0A0A0A]">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {isSubstantiveChange && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-[#78350F]">
                  <AlertTriangle className="w-4 h-4 text-[#B45309] shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    <strong className="text-[#B45309] font-bold">Re-moderation Notice:</strong> Modifying title, company, salary/stipend, or job type will reset this listing to <em>"Pending Approval"</em> for admin review, temporarily hiding it from students until re-approved.
                  </p>
                </div>
              )}

              <form
                onSubmit={e => {
                  e.preventDefault();
                  const res = updateJobListing(editingJob.id, {
                    title: editJobTitle,
                    company: editJobCompany,
                    stipendOrSalary: editJobStipend,
                    type: editJobType,
                    location: editJobLocation,
                    applicationDeadline: editJobDeadline,
                    description: editJobDescription
                  });

                  setEditingJob(null);
                  showToast(
                    res.isReModerationRequired
                      ? 'Listing updated & sent to Admin for re-approval!'
                      : 'Job listing updated successfully.'
                  );
                }}
                className="space-y-3"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="app-label text-[#0A0A0A] font-bold">Position Title</label>
                    <input
                      type="text"
                      required
                      value={editJobTitle}
                      onChange={e => setEditJobTitle(e.target.value)}
                      className="app-input w-full border-[#E5E7EB] rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="app-label text-[#0A0A0A] font-bold">Company</label>
                    <input
                      type="text"
                      required
                      value={editJobCompany}
                      onChange={e => setEditJobCompany(e.target.value)}
                      className="app-input w-full border-[#E5E7EB] rounded-lg"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="app-label text-[#0A0A0A] font-bold">Opportunity Type</label>
                    <select
                      value={editJobType}
                      onChange={e => setEditJobType(e.target.value as any)}
                      className="app-input w-full font-bold border-[#E5E7EB] rounded-lg bg-[#FAFAFA]"
                    >
                      <option value="Full-Time">Full-Time</option>
                      <option value="Internship">Internship</option>
                      <option value="Contract">Contract</option>
                      <option value="Remote">Remote</option>
                    </select>
                  </div>

                  <div>
                    <label className="app-label text-[#0A0A0A] font-bold">Stipend / Salary</label>
                    <input
                      type="text"
                      required
                      value={editJobStipend}
                      onChange={e => setEditJobStipend(e.target.value)}
                      className="app-input w-full font-mono text-xs border-[#E5E7EB] rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="app-label text-[#0A0A0A] font-bold">Location</label>
                    <input
                      type="text"
                      required
                      value={editJobLocation}
                      onChange={e => setEditJobLocation(e.target.value)}
                      className="app-input w-full border-[#E5E7EB] rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="app-label text-[#0A0A0A] font-bold">Description & Referral Guidelines</label>
                  <textarea
                    rows={3}
                    required
                    value={editJobDescription}
                    onChange={e => setEditJobDescription(e.target.value)}
                    className="app-input w-full border-[#E5E7EB] rounded-lg"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E5E7EB]">
                  <Button type="button" variant="secondary" size="sm" onClick={() => setEditingJob(null)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" size="sm">
                    Save Listing Changes
                  </Button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}    </div>
  );
};

export const AlumniDashboard: React.FC<AlumniDashboardProps> = (props) => {
  const { currentUser } = useAuth();
  if (!currentUser) return null;
  return <AlumniDashboardContent {...props} alumni={currentUser as AlumniProfile} />;
};

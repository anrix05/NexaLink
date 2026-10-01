import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import type { FacultyProfile } from '../../types';
import {
  BookOpen,
  GraduationCap,
  Users,
  Calendar,
  Sparkles,
  Award,
  CheckCircle2,
  Building2,
  FileSpreadsheet,
  Plus,
  Check,
  Briefcase,
  ChevronRight,
  ShieldCheck,
  Star,
  UserCheck,
  Clock,
  ArrowUpRight,
  AlertCircle,
  MapPin,
  ExternalLink,
  MessageSquare
} from 'lucide-react';
import { Badge, Button, StatCard } from '../../components/common/UIComponents';
import { InstitutionalAnnouncementFeed } from '../../components/common/InstitutionalAnnouncementFeed';

interface FacultyDashboardProps {
  setActiveTab: (tab: string) => void;
}

const FacultyDashboardContent: React.FC<FacultyDashboardProps & { faculty: FacultyProfile }> = ({ setActiveTab, faculty }) => {
  const {
    alumniList,
    studentList,
    mentorshipRequests,
    eventsList,
    jobsList,
    updateMentorshipStatus,
    updateUserProfile,
    announcements
  } = useData();

  const [notice, setNotice] = useState<string | null>(null);
  const [isMentoringAvailable, setIsMentoringAvailable] = useState<boolean>(
    faculty.isMentoringAvailable ?? true
  );
  const [avatarError, setAvatarError] = useState(false);

  const facultyInitials = (faculty.name || 'Faculty')
    .split(' ')
    .filter(Boolean)
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const showToast = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 3500);
  };

  const handleToggleMentoring = () => {
    const nextVal = !isMentoringAvailable;
    setIsMentoringAvailable(nextVal);
    updateUserProfile(faculty.id, { isMentoringAvailable: nextVal });
    showToast(nextVal ? 'Mentorship availability enabled: Accepting student asks.' : 'Mentorship paused: Set to busy.');
  };

  // 1. Department Live Counts (Zero placeholders, genuine live computation)
  const deptStudents = studentList.filter(s => s.department === faculty.department);
  const deptAlumni = alumniList.filter(a => a.department === faculty.department && (a.isVerified || a.verificationStatus === 'Verified'));

  // 2. Mentee Capacity & Advisory Requests
  const myFacultyRequests = mentorshipRequests.filter(
    r => r.mentorId === faculty.id || r.mentorName?.includes(faculty.name) || (r.mentorRole === 'faculty' && r.mentorCompanyOrDept === faculty.department)
  );
  const pendingRequests = myFacultyRequests.filter(r => r.status === 'Pending');
  const activeMentees = myFacultyRequests.filter(r => r.status === 'Accepted');
  const activeMenteesCount = activeMentees.length;
  const maxCapacity = faculty.maxMentees || 5;

  // 3. Opportunities / Research Projects Posted
  const myPostedJobs = jobsList.filter(
    j => j.postedByAlumniId === faculty.id || j.postedByAlumniName?.includes(faculty.name)
  );

  // 4. Rating & Reviews from completed sessions
  const ratedRequests = myFacultyRequests.filter(r => r.feedback && r.feedback.rating && r.feedback.rating > 0);
  const totalReviewsCount = ratedRequests.length;
  const avgRating = totalReviewsCount > 0
    ? (ratedRequests.reduce((sum, r) => sum + (r.feedback?.rating || 0), 0) / totalReviewsCount).toFixed(1)
    : null;

  // 5. Hosted Events from eventsList
  const myHostedEvents = eventsList.filter(e =>
    e.speakerName?.toLowerCase().includes(faculty.name.toLowerCase()) ||
    (e.department && e.department === faculty.department)
  );
  const upcomingHosted = myHostedEvents.filter(e => e.status === 'Upcoming');

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-16 sm:pb-0 font-sans text-xs">
      
      {notice && (
        <div className="p-4 bg-[#0A0A0A] text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-sm animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-[#16A34A]" /> {notice}
        </div>
      )}

      {/* 1. Header Profile Banner */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 shadow-none space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            {faculty.avatar && !avatarError ? (
              <img
                src={faculty.avatar}
                alt={faculty.name}
                onError={() => setAvatarError(true)}
                className="w-14 h-14 rounded-full object-cover border border-[#E5E7EB] shrink-0"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-[#0A0A0A] text-white flex items-center justify-center font-display font-black text-lg tracking-wider border border-[#E5E7EB] shrink-0 shadow-xs">
                {facultyInitials || 'EH'}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-display font-bold text-[#0A0A0A] tracking-tight">{faculty.name}</h1>
                <Badge variant="indigo" size="sm" icon={<ShieldCheck className="w-3.5 h-3.5" />}>
                  {faculty.isHod ? 'Head of department' : 'Faculty advisor'}
                </Badge>
              </div>
              <p className="text-xs text-[#0A0A0A] font-semibold mt-0.5">
                {faculty.designation} • Department of {faculty.department}
              </p>
              <p className="text-xs text-[#6B7280] mt-0.5">
                Employee ID: <span className="font-mono">{faculty.employeeId || 'EMP-FAC-014'}</span> • Specialization: {faculty.specialization || 'Computer Engineering'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              size="md"
              onClick={() => setActiveTab('reports')}
              icon={<FileSpreadsheet className="w-3.5 h-3.5 text-[#0A0A0A]" />}
            >
              Dept analytics
            </Button>

            <Button
              variant="primary"
              size="md"
              onClick={() => setActiveTab('events')}
              icon={<Plus className="w-3.5 h-3.5" />}
            >
              Host seminar
            </Button>
          </div>
        </div>
      </div>

      {/* Institutional Broadcast Announcements Feed */}
      <InstitutionalAnnouncementFeed announcements={announcements} userRole="faculty" />

      {/* 2. Live Department & Faculty Operational Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Metric 1: Mentee Capacity */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 flex flex-col justify-between gap-2 shadow-none">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#6B7280]">
              Mentee capacity
            </span>
            <UserCheck className="w-3.5 h-3.5 text-[#0A0A0A]" />
          </div>
          <div>
            <div className="tabular-nums text-2xl font-bold text-[#0A0A0A]">
              {activeMenteesCount} <span className="text-xs text-[#6B7280] font-normal">/ {maxCapacity}</span>
            </div>
            <p className="text-xs text-[#6B7280] mt-0.5">
              {maxCapacity - activeMenteesCount > 0
                ? `${maxCapacity - activeMenteesCount} slots open`
                : 'Capacity full'}
            </p>
          </div>
          <div className="pt-2 border-t border-[#F3F4F6] flex items-center justify-between">
            <button
              onClick={handleToggleMentoring}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                isMentoringAvailable
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                  : 'bg-neutral-100 text-neutral-600 border border-neutral-300 hover:bg-neutral-200'
              }`}
              title="Click to toggle mentoring availability"
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isMentoringAvailable ? 'bg-emerald-600 animate-pulse' : 'bg-neutral-400'}`} />
              {isMentoringAvailable ? 'Accepting mentees' : 'Mentoring paused'}
            </button>
          </div>
        </div>

        {/* Metric 2: Department Students */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 flex flex-col justify-between gap-2 shadow-none">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#6B7280]">
              Dept students
            </span>
            <Users className="w-3.5 h-3.5 text-[#0A0A0A]" />
          </div>
          <div>
            <div className="tabular-nums text-2xl font-bold text-[#0A0A0A]">
              {deptStudents.length}
            </div>
            <p className="text-xs text-[#6B7280] mt-0.5">
              Enrolled under {faculty.department}
            </p>
          </div>
          <div className="pt-2 border-t border-[#F3F4F6] text-xs text-[#6B7280]">
            {deptStudents.length > 0 ? `${deptStudents.length} active registered` : 'No students registered'}
          </div>
        </div>

        {/* Metric 3: Department Alumni */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 flex flex-col justify-between gap-2 shadow-none">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#6B7280]">
              Dept alumni
            </span>
            <GraduationCap className="w-3.5 h-3.5 text-[#0A0A0A]" />
          </div>
          <div>
            <div className="tabular-nums text-2xl font-bold text-[#0A0A0A]">
              {deptAlumni.length}
            </div>
            <p className="text-xs text-[#6B7280] mt-0.5">
              Verified graduated cohort
            </p>
          </div>
          <div className="pt-2 border-t border-[#F3F4F6] text-xs text-[#6B7280]">
            {deptAlumni.length > 0 ? `${deptAlumni.length} verified in ${faculty.department}` : 'Awaiting alumni verification'}
          </div>
        </div>

        {/* Metric 4: Advisory Review Rating */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 flex flex-col justify-between gap-2 shadow-none">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#6B7280]">
              Advisory rating
            </span>
            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
          </div>
          <div>
            <div className="tabular-nums text-2xl font-bold text-[#0A0A0A] flex items-baseline gap-1">
              {avgRating ? (
                <>
                  {avgRating} <span className="text-xs text-[#6B7280] font-normal">/ 5.0</span>
                </>
              ) : (
                <span className="text-xs text-[#6B7280] font-normal">No ratings yet</span>
              )}
            </div>
            <p className="text-xs text-[#6B7280] mt-0.5">
              {totalReviewsCount > 0 ? `From ${totalReviewsCount} session reviews` : 'Awaiting feedback'}
            </p>
          </div>
          <div className="pt-2 border-t border-[#F3F4F6] text-xs text-[#6B7280]">
            {avgRating ? 'Verified student evaluations' : 'No ratings recorded'}
          </div>
        </div>
      </div>

      {/* 3. PROMOTED: Research & Guidance Asks (High Visual Priority) */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 space-y-4 shadow-none">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5E7EB] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-xs text-[#0A0A0A] flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#0A0A0A]" />
                Research & guidance asks ({pendingRequests.length} pending)
              </h3>
              {pendingRequests.length > 0 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-[#B45309] border border-amber-300">
                  Action required
                </span>
              )}
            </div>
            <p className="text-[#6B7280] font-medium text-xs mt-0.5">
              Undergraduate and postgraduate students seeking your academic guidance, project advisory, or research collaboration.
            </p>
          </div>

          <div className="text-right text-xs text-[#6B7280] hidden sm:block">
            <span>Active advisories: <strong className="text-[#0A0A0A] font-bold tabular-nums">{activeMenteesCount}</strong></span>
          </div>
        </div>

        {pendingRequests.length === 0 ? (
          <div className="p-8 bg-[#FAFAFA] rounded-xl border border-dashed border-[#E5E7EB] text-center space-y-1 text-xs text-[#6B7280]">
            <p className="font-bold text-[#0A0A0A]">No pending academic advisory requests</p>
            <p className="text-[11px]">When students submit mentorship or thesis guidance requests for faculty in {faculty.department}, they will appear here with instant review actions.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingRequests.map(req => (
              <div key={req.id} className="p-4 bg-[#FAFAFA] border border-[#E5E7EB] rounded-xl space-y-3 hover:border-[#D1D5DB] transition-all">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-[#0A0A0A] text-sm">{req.studentName}</span>
                      <Badge variant="indigo">{req.studentDepartment}</Badge>
                      <span className="text-xs text-[#6B7280]">Year: {req.studentYear}</span>
                    </div>
                    <p className="text-xs text-[#6B7280] mt-0.5">
                      PRN: {req.studentEnrollmentNo || 'N/A'} • Email: {req.studentEmail}
                    </p>
                  </div>

                  <span className="text-[10px] font-mono text-[#9CA3AF] self-start sm:self-auto">
                    {req.requestedDate ? new Date(req.requestedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                  </span>
                </div>

                <div className="p-3 bg-white border border-[#E5E7EB] rounded-lg text-xs text-[#374151]">
                  <strong>Topic: {req.purposeOfRequest || req.topic}</strong>
                  <p className="mt-1 leading-relaxed whitespace-pre-line">"{req.message}"</p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      updateMentorshipStatus(req.id, 'Declined', 'Declined due to academic bandwidth.', 'faculty');
                      showToast(`Advisory request from ${req.studentName} declined.`);
                    }}
                  >
                    Decline
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      updateMentorshipStatus(req.id, 'Accepted', 'Accepted by faculty advisor.', 'faculty');
                      showToast(`Advisory request from ${req.studentName} accepted!`);
                    }}
                  >
                    Accept Advisory
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. Opportunities & Research Openings Posted */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 space-y-4 shadow-none">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5E7EB] pb-4">
          <div>
            <h3 className="font-display font-bold text-xs uppercase tracking-wider text-[#0A0A0A] flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-[#0A0A0A]" />
              Faculty Opportunities & Research Openings ({myPostedJobs.length})
            </h3>
            <p className="text-[#6B7280] font-medium text-xs mt-0.5">
              Research assistantships, lab internships, and departmental vacancies published by you for student applications.
            </p>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setActiveTab('jobs')}
            icon={<Plus className="w-3.5 h-3.5" />}
          >
            Post Opportunity
          </Button>
        </div>

        {myPostedJobs.length === 0 ? (
          <div className="p-8 bg-[#FAFAFA] rounded-xl border border-dashed border-[#E5E7EB] text-center space-y-2 text-xs text-[#6B7280]">
            <p className="font-bold text-[#0A0A0A]">No opportunities posted yet</p>
            <p className="text-[11px] max-w-md mx-auto">
              You haven't posted any research openings or internships yet. Click below to publish opportunities for {faculty.department} students to apply.
            </p>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setActiveTab('jobs')}
              icon={<Plus className="w-3.5 h-3.5" />}
              className="mt-2"
            >
              Post First Opportunity
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {myPostedJobs.map(job => (
              <div key={job.id} className="p-4 border border-[#E5E7EB] rounded-xl bg-[#FAFAFA] space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-[#0A0A0A] text-sm leading-tight">{job.title}</span>
                  <Badge variant={job.status === 'Active' ? 'emerald' : 'slate'} size="sm">
                    {job.status}
                  </Badge>
                </div>
                <p className="text-xs text-[#6B7280]">
                  {job.company} • {job.location} • <strong className="text-[#0A0A0A]">{job.stipendOrSalary || 'Honorarium / Academic Credit'}</strong>
                </p>
                <div className="flex items-center justify-between text-[11px] font-mono text-[#6B7280] pt-2 border-t border-[#E5E7EB]">
                  <span>{job.applicantsCount || 0} Applicants</span>
                  <span>Deadline: {job.applicationDeadline || 'Rolling'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5. Two-Column Row: Upcoming Events Hosted & Mentorship Review History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left: Upcoming Events Hosted */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 space-y-4 shadow-none flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
              <div>
                <h3 className="font-display font-bold text-xs uppercase tracking-wider text-[#0A0A0A] flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#0A0A0A]" />
                  Upcoming Events Hosted ({upcomingHosted.length})
                </h3>
                <p className="text-[11px] text-[#6B7280] mt-0.5">
                  Guest lectures and workshops scheduled under {faculty.department}.
                </p>
              </div>

              <Button
                variant="secondary"
                size="sm"
                onClick={() => setActiveTab('events')}
                icon={<Plus className="w-3.5 h-3.5" />}
              >
                Host
              </Button>
            </div>

            {upcomingHosted.length === 0 ? (
              <div className="p-8 bg-[#FAFAFA] rounded-xl border border-dashed border-[#E5E7EB] text-center space-y-2 text-xs text-[#6B7280]">
                <p className="font-bold text-[#0A0A0A]">No upcoming events scheduled</p>
                <p className="text-[11px]">
                  Organize technical masterclasses, alumni guest lectures, or academic seminars.
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setActiveTab('events')}
                  icon={<Plus className="w-3.5 h-3.5" />}
                  className="mt-1"
                >
                  Schedule Event
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingHosted.map(event => (
                  <div key={event.id} className="p-3.5 border border-[#E5E7EB] rounded-xl bg-[#FAFAFA] space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-[#0A0A0A] text-xs leading-snug">{event.title}</h4>
                        <p className="text-[11px] text-[#6B7280] mt-0.5">
                          Speaker: {event.speakerName} ({event.speakerDesignation})
                        </p>
                      </div>
                      <Badge variant="indigo" size="sm">{event.type}</Badge>
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-mono text-[#6B7280] pt-2 border-t border-[#E5E7EB]">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {event.date} • {event.time}
                      </span>
                      <span>{event.rsvpsCount || event.registeredUserIds?.length || 0} RSVPs</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Review & Rating History */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 space-y-4 shadow-none flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
              <div>
                <h3 className="font-display font-bold text-xs uppercase tracking-wider text-[#0A0A0A] flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  Review & Rating History ({totalReviewsCount})
                </h3>
                <p className="text-[11px] text-[#6B7280] mt-0.5">
                  Verified student ratings and feedback from completed advisory sessions.
                </p>
              </div>

              {avgRating && (
                <div className="flex items-center gap-1 font-mono font-bold text-xs bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 rounded-md">
                  <span>★ {avgRating}</span>
                  <span className="text-[10px] text-amber-700 font-normal">/ 5.0</span>
                </div>
              )}
            </div>

            {totalReviewsCount === 0 ? (
              <div className="p-8 bg-[#FAFAFA] rounded-xl border border-dashed border-[#E5E7EB] text-center space-y-1 text-xs text-[#6B7280]">
                <p className="font-bold text-[#0A0A0A]">No reviews yet</p>
                <p className="text-[11px]">
                  Student reviews and ratings will automatically appear here once guidance and advisory sessions are completed.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {ratedRequests.map(r => (
                  <div key={r.id} className="p-3.5 border border-[#E5E7EB] rounded-xl bg-[#FAFAFA] space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#0A0A0A] text-xs">{r.studentName}</span>
                      <div className="flex items-center gap-0.5 text-amber-500 text-xs">
                        {Array.from({ length: r.feedback?.rating || 5 }).map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-amber-500 text-amber-500" />
                        ))}
                      </div>
                    </div>
                    {r.feedback?.review && (
                      <p className="text-xs text-[#374151] italic leading-relaxed">
                        "{r.feedback.review}"
                      </p>
                    )}
                    <div className="text-[10px] font-mono text-[#9CA3AF] pt-1">
                      {r.feedback?.date ? new Date(r.feedback.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Verified Feedback'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* 6. Accreditation Compliance & Reports Footer Card */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#FAFAFA] rounded-xl border border-[#E5E7EB] shrink-0">
            <FileSpreadsheet className="w-5 h-5 text-[#0A0A0A]" />
          </div>
          <div>
            <h4 className="font-bold text-xs text-[#0A0A0A] uppercase tracking-wider">
              NAAC / NIRF Institutional Accreditation Exports
            </h4>
            <p className="text-xs text-[#6B7280] mt-0.5">
              Export verified departmental mentorship records, student interactions, and faculty guidance archives for regulatory accreditation.
            </p>
          </div>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => setActiveTab('reports')}
          icon={<ArrowUpRight className="w-3.5 h-3.5" />}
          className="shrink-0"
        >
          View Accreditation Reports
        </Button>
      </div>

    </div>
  );
};

export const FacultyDashboard: React.FC<FacultyDashboardProps> = (props) => {
  const { currentUser } = useAuth();
  if (!currentUser) return null;
  return <FacultyDashboardContent {...props} faculty={currentUser as FacultyProfile} />;
};

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import type { FacultyProfile } from '../../types';
import {
  BookOpen,
  GraduationCap,
  Users,
  Calendar,
  Briefcase,
  Star,
  FileSpreadsheet,
  Plus,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  MessageSquare
} from 'lucide-react';
import {
  PageHeader,
  Section,
  ListRow,
  RightRail,
  StatusBadge,
  CapacityMeter,
  Switch,
  EmptyState
} from '../../components/ui';
import { Button } from '../../components/common/UIComponents';
import { InstitutionalAnnouncementFeed } from '../../components/common/InstitutionalAnnouncementFeed';
import { getGreetingName } from '../../utils/validators';

interface FacultyDashboardProps {
  setActiveTab: (tab: string, subTab?: string) => void;
}

const FacultyDashboardContent: React.FC<FacultyDashboardProps & { faculty: FacultyProfile }> = ({
  setActiveTab,
  faculty
}) => {
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

  const handleToggleMentoring = (nextVal: boolean) => {
    setIsMentoringAvailable(nextVal);
    updateUserProfile(faculty.id, { isMentoringAvailable: nextVal });
    showToast(nextVal ? 'Mentorship availability enabled: Accepting student asks.' : 'Mentorship paused: Set to busy.');
  };

  // 1. Department Live Counts
  const deptStudents = studentList.filter(s => s.department === faculty.department);
  const deptAlumni = alumniList.filter(
    a => a.department === faculty.department && (a.isVerified || a.verificationStatus === 'Verified')
  );

  // 2. Mentee Capacity & Advisory Requests
  const myFacultyRequests = mentorshipRequests.filter(
    r =>
      r.mentorId === faculty.id ||
      r.mentorName?.includes(faculty.name) ||
      (r.mentorRole === 'faculty' && r.mentorCompanyOrDept === faculty.department)
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
  const avgRating =
    totalReviewsCount > 0
      ? (ratedRequests.reduce((sum, r) => sum + (r.feedback?.rating || 0), 0) / totalReviewsCount).toFixed(1)
      : null;

  // 5. Hosted Events
  const upcomingHosted = eventsList.filter(e => e.speakerName?.includes(faculty.name) || (e.department && e.department === faculty.department));

  return (
    <div className="space-y-8">
      {/* Toast Notification */}
      {notice && (
        <div className="fixed top-20 right-6 z-50 bg-[#0A0A0A] text-white px-4 py-2.5 rounded-lg text-xs font-medium shadow-md transition-opacity">
          {notice}
        </div>
      )}

      {/* 1. Header (Open Canvas PageHeader primitive) */}
      <PageHeader
        eyebrow={faculty.isHod ? 'Department head' : 'Faculty advisor'}
        title={`Welcome back, ${getGreetingName(faculty.name)}`}
        subtitle={
          <div className="flex items-center gap-2 flex-wrap text-xs text-[#6B7280]">
            <span className="text-[#0A0A0A] font-medium">
              {faculty.designation?.toLowerCase().includes('head of department')
                ? `Department of ${faculty.department}`
                : `${faculty.designation || 'Faculty'} · Department of ${faculty.department}`}
            </span>
            <span>·</span>
            <span>
              Employee ID: <span className="font-mono text-[#0A0A0A]">{faculty.employeeId || 'EMP-FAC-014'}</span>
            </span>
            {faculty.specialization && (
              <>
                <span>·</span>
                <span>Specialization: {faculty.specialization}</span>
              </>
            )}
          </div>
        }
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('reports')}
              className="inline-flex items-center gap-1.5 px-3 py-2 border border-[#6B7280] hover:bg-[#FAFAFA] text-[#0A0A0A] text-xs font-medium rounded-lg transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-[#0A0A0A]" />
              <span>Dept analytics</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('events')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#0A0A0A] hover:bg-[#262626] text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Host seminar</span>
            </button>
          </div>
        }
      />

      {/* Institutional Broadcast Announcements Feed */}
      <InstitutionalAnnouncementFeed announcements={announcements} userRole="faculty" />

      {/* Two-Column Responsive Layout: Primary Canvas + Quiet Right Rail */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 items-start">
        {/* Main Canvas Content */}
        <div className="space-y-8 min-w-0">
          {/* Section 1: Advisory Requests */}
          <Section
            title="Advisory requests"
            count={pendingRequests.length}
            description="Undergraduate and postgraduate students seeking your academic guidance, project advisory, or research collaboration."
            noTopHairline
          >
            {pendingRequests.length === 0 ? (
              <EmptyState
                icon={<BookOpen className="w-5 h-5 text-[#0A0A0A]" />}
                title="No pending academic advisory requests"
                sentence={`When students submit mentorship or thesis guidance requests for faculty in ${faculty.department}, they will appear here with instant review actions.`}
              />
            ) : (
              <div className="divide-y divide-[#E5E7EB] border-t border-b border-[#E5E7EB]">
                {pendingRequests.map((req, index) => (
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
                        <StatusBadge tone="indigo" label={req.studentDepartment || faculty.department} />
                        <span className="text-xs text-[#6B7280]">Year: {req.studentYear}</span>
                      </div>
                    }
                    subtitle={
                      <div className="space-y-1 mt-1">
                        <div className="text-xs text-[#6B7280]">
                          PRN: <span className="font-mono text-[#0A0A0A]">{req.studentEnrollmentNo || 'N/A'}</span> · {req.studentEmail}
                        </div>
                        <div className="p-2.5 bg-[#FAFAFA] rounded-md text-xs text-[#0A0A0A]">
                          <strong>Topic: {req.purposeOfRequest || req.topic}</strong>
                          {req.message && <p className="mt-0.5 text-[#6B7280] italic leading-relaxed">"{req.message}"</p>}
                        </div>
                      </div>
                    }
                    meta={
                      req.requestedDate ? (
                        <span className="text-xs text-[#6B7280] tabular-nums">
                          {new Date(req.requestedDate).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </span>
                      ) : undefined
                    }
                    trailing={
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            updateMentorshipStatus(req.id, 'Declined', 'Declined due to academic bandwidth.', 'faculty');
                            showToast(`Advisory request from ${req.studentName} declined.`);
                          }}
                          className="px-3 py-1.5 border border-[#6B7280] hover:bg-[#FAFAFA] text-[#0A0A0A] text-xs font-medium rounded-lg transition-colors cursor-pointer"
                        >
                          Decline
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            updateMentorshipStatus(req.id, 'Accepted', 'Accepted by faculty advisor.', 'faculty');
                            showToast(`Advisory request from ${req.studentName} accepted!`);
                          }}
                          className="px-3 py-1.5 bg-[#0A0A0A] hover:bg-[#262626] text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
                        >
                          Accept advisory
                        </button>
                      </div>
                    }
                  />
                ))}
              </div>
            )}
          </Section>

          {/* Section 2: Opportunities & Research Openings Posted */}
          <Section
            title="Opportunities you've posted"
            count={myPostedJobs.length}
            description="Research assistantships, lab internships, and departmental vacancies published by you for student applications."
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
                sentence={`You haven't posted any research openings or internships yet. Click below to publish opportunities for ${faculty.department} students to apply.`}
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
                {myPostedJobs.map((job, index) => (
                  <ListRow
                    key={job.id}
                    isFirst={index === 0}
                    leading={
                      <div className="w-9 h-9 rounded-lg bg-[#F3F4F6] text-[#0A0A0A] flex items-center justify-center shrink-0">
                        <Briefcase className="w-4 h-4 text-[#0A0A0A]" />
                      </div>
                    }
                    title={job.title}
                    subtitle={`${job.company} · ${job.location} · ${job.stipendOrSalary || 'Honorarium / Academic Credit'}`}
                    meta={
                      <span className="text-xs text-[#6B7280] tabular-nums">
                        {job.applicantsCount || 0} applicants · Deadline: {job.applicationDeadline || 'Rolling'}
                      </span>
                    }
                    trailing={
                      <StatusBadge
                        tone={job.status === 'Active' ? 'emerald' : 'neutral'}
                        label={job.status}
                      />
                    }
                  />
                ))}
              </div>
            )}
          </Section>

          {/* Section 3: Upcoming Hosted Events */}
          <Section
            title="Upcoming events hosted"
            count={upcomingHosted.length}
            description={`Guest lectures, technical workshops, and departmental seminars scheduled under ${faculty.department}.`}
            action={
              <button
                type="button"
                onClick={() => setActiveTab('events')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[#6B7280] hover:bg-[#FAFAFA] text-[#0A0A0A] text-xs font-medium rounded-lg transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Host event</span>
              </button>
            }
          >
            {upcomingHosted.length === 0 ? (
              <EmptyState
                icon={<Calendar className="w-5 h-5 text-[#0A0A0A]" />}
                title="No upcoming events scheduled"
                sentence="Organize technical masterclasses, alumni guest lectures, or academic seminars for students."
                action={
                  <button
                    type="button"
                    onClick={() => setActiveTab('events')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[#6B7280] hover:bg-[#FAFAFA] text-[#0A0A0A] text-xs font-medium rounded-lg transition-colors cursor-pointer"
                  >
                    <span>Schedule event</span>
                  </button>
                }
              />
            ) : (
              <div className="divide-y divide-[#E5E7EB] border-t border-b border-[#E5E7EB]">
                {upcomingHosted.map((event, index) => (
                  <ListRow
                    key={event.id}
                    isFirst={index === 0}
                    leading={
                      <div className="w-9 h-9 rounded-lg bg-[#F3F4F6] text-[#0A0A0A] flex items-center justify-center shrink-0">
                        <Calendar className="w-4 h-4 text-[#0A0A0A]" />
                      </div>
                    }
                    title={event.title}
                    subtitle={`Speaker: ${event.speakerName} (${event.speakerDesignation})`}
                    meta={
                      <span className="text-xs text-[#6B7280] tabular-nums">
                        {event.date} · {event.time} · {event.rsvpsCount || event.registeredUserIds?.length || 0} RSVPs
                      </span>
                    }
                    trailing={<StatusBadge tone="indigo" label={event.type} />}
                  />
                ))}
              </div>
            )}
          </Section>

          {/* Section 4: Review & Rating History */}
          <Section
            title="Review & rating history"
            count={totalReviewsCount}
            description="Verified student evaluations and feedback from completed advisory sessions."
          >
            {totalReviewsCount === 0 ? (
              <EmptyState
                icon={<Star className="w-5 h-5 text-[#0A0A0A]" />}
                title="No reviews yet"
                sentence="Student reviews and ratings will automatically appear here once guidance and advisory sessions are completed."
              />
            ) : (
              <div className="divide-y divide-[#E5E7EB] border-t border-b border-[#E5E7EB]">
                {ratedRequests.map((r, index) => (
                  <ListRow
                    key={r.id}
                    isFirst={index === 0}
                    leading={
                      <div className="w-9 h-9 rounded-full bg-[#F3F4F6] text-[#0A0A0A] flex items-center justify-center text-xs font-semibold shrink-0">
                        {r.studentName.slice(0, 2).toUpperCase()}
                      </div>
                    }
                    title={
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-[#0A0A0A]">{r.studentName}</span>
                        <div className="flex items-center gap-0.5 text-[#0A0A0A]">
                          {Array.from({ length: r.feedback?.rating || 5 }).map((_, i) => (
                            <Star key={i} className="w-3.5 h-3.5 fill-[#0A0A0A] text-[#0A0A0A]" />
                          ))}
                        </div>
                      </div>
                    }
                    subtitle={
                      r.feedback?.review ? (
                        <p className="text-xs text-[#0A0A0A] italic mt-1 leading-relaxed">
                          "{r.feedback.review}"
                        </p>
                      ) : undefined
                    }
                    meta={
                      r.feedback?.date ? (
                        <span className="text-xs text-[#6B7280] tabular-nums">
                          {new Date(r.feedback.date).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </span>
                      ) : (
                        'Verified session'
                      )
                    }
                  />
                ))}
              </div>
            )}
          </Section>

          {/* Section 5: Institutional Accreditation Footer */}
          <div className="pt-6 border-t border-[#E5E7EB] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-[#FAFAFA] border border-[#E5E7EB] shrink-0">
                <FileSpreadsheet className="w-4 h-4 text-[#0A0A0A]" />
              </div>
              <div>
                <h4 className="font-semibold text-xs text-[#0A0A0A]">
                  NAAC / NIRF Institutional Accreditation Exports
                </h4>
                <p className="text-xs text-[#6B7280] mt-0.5">
                  Export verified departmental mentorship records, student interactions, and faculty guidance archives.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('reports')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[#6B7280] hover:bg-[#FAFAFA] text-[#0A0A0A] text-xs font-medium rounded-lg transition-colors cursor-pointer shrink-0"
            >
              <span>Accreditation reports</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Quiet Right Rail (≥1280px / lg) */}
        <RightRail className="space-y-6">
          {/* Mentee Capacity & Switch */}
          <div className="space-y-4 pb-6 border-b border-[#E5E7EB]">
            <h3 className="text-xs font-semibold text-[#0A0A0A]">
              Advisory status
            </h3>

            <CapacityMeter
              activeCount={activeMenteesCount}
              maxCount={maxCapacity}
              mode="stepper"
              label="Active advisories"
            />

            <Switch
              checked={isMentoringAvailable}
              onChange={handleToggleMentoring}
              label={isMentoringAvailable ? 'Accepting advisories' : 'Advisories paused'}
              description="Students can request research & project guidance"
              variant="emerald"
            />
          </div>

          {/* Department Overview */}
          <div className="space-y-3 pb-6 border-b border-[#E5E7EB]">
            <h3 className="text-xs font-semibold text-[#0A0A0A]">
              Department snapshot · {faculty.department}
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#6B7280]">Registered students</span>
                <span className="font-semibold text-[#0A0A0A] tabular-nums">{deptStudents.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#6B7280]">Verified alumni</span>
                <span className="font-semibold text-[#0A0A0A] tabular-nums">{deptAlumni.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#6B7280]">Advisory rating</span>
                <span className="font-semibold text-[#0A0A0A] tabular-nums flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-[#0A0A0A] text-[#0A0A0A]" />
                  {avgRating ? `${avgRating} / 5.0` : 'No ratings yet'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-[#0A0A0A]">Quick actions</h3>
            <div className="flex flex-col gap-1.5">
              <button
                type="button"
                onClick={() => setActiveTab('directory')}
                className="text-left text-xs text-[#6B7280] hover:text-[#0A0A0A] py-1 transition-colors"
              >
                Browse departmental alumni →
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('reports')}
                className="text-left text-xs text-[#6B7280] hover:text-[#0A0A0A] py-1 transition-colors"
              >
                View department accreditation data →
              </button>
            </div>
          </div>
        </RightRail>
      </div>
    </div>
  );
};

export const FacultyDashboard: React.FC<FacultyDashboardProps> = props => {
  const { currentUser } = useAuth();
  if (!currentUser) return null;
  return <FacultyDashboardContent {...props} faculty={currentUser as FacultyProfile} />;
};

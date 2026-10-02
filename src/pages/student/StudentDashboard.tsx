import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import type { StudentProfile } from '../../types';
import {
  getRecommendedAlumniMentors,
  getRecommendedFacultyMentors,
  getRecommendedOpportunities
} from '../../utils/recommendationEngine';
import {
  Calendar,
  GraduationCap,
  CheckCircle2,
  ArrowRight,
  Briefcase,
  AlertCircle,
  Upload,
  FileText,
  Clock,
  Sparkles,
  X
} from 'lucide-react';
import {
  PageHeader,
  Section,
  StatStrip,
  ListRow,
  FocusPanel,
  RightRail,
  StatusBadge
} from '../../components/ui';
import { Button, TextField, Modal } from '../../components/common/UIComponents';
import { uploadProofDocument } from '../../lib/storage';
import { InstitutionalAnnouncementFeed } from '../../components/common/InstitutionalAnnouncementFeed';
import { getGreetingName } from '../../utils/validators';

interface StudentDashboardProps {
  setActiveTab: (tab: string, subTab?: string) => void;
}

const StudentDashboardContent: React.FC<StudentDashboardProps & { studentProfile: StudentProfile }> = ({ setActiveTab, studentProfile }) => {
  const currentUser = studentProfile;
  const {
    alumniList,
    facultyList,
    jobsList,
    eventsList,
    mentorshipRequests,
    roleTransitionRequests,
    submitRoleTransitionRequest,
    resubmitUserVerification,
    announcements
  } = useData();

  // Run Smart Recommendation Engine
  const recommendedAlumniMatches = getRecommendedAlumniMentors(studentProfile, alumniList);
  const recommendedFacultyMatches = getRecommendedFacultyMentors(studentProfile, facultyList);
  const recommendedJobMatches = getRecommendedOpportunities(studentProfile, jobsList);

  // Role Transition State
  const gradYear = studentProfile.expectedGraduationYear || studentProfile.graduationYear || 0;
  const isFinalSemester = studentProfile.semester === 'Semester 8' || studentProfile.semester === 'BE';
  const isPastGraduation = gradYear > 2000 && gradYear <= new Date().getFullYear() && isFinalSemester;
  
  const pendingOrApprovedRequest = roleTransitionRequests.find(
    r => r.userId === studentProfile.id && (r.status === 'pending' || r.status === 'approved')
  );
  const rejectedRequest = roleTransitionRequests.find(
    r => r.userId === studentProfile.id && r.status === 'rejected'
  );
  
  const [hideBannerSession, setHideBannerSession] = useState(() => sessionStorage.getItem('grad_banner_dismissed') === 'true');
  const [showTransitionModal, setShowTransitionModal] = useState(false);
  const [transPathType, setTransPathType] = useState<'employed' | 'higher_studies'>('employed');
  const [transCompany, setTransCompany] = useState('');
  const [transDesignation, setTransDesignation] = useState('');
  const [transUniversity, setTransUniversity] = useState('');
  const [transDegree, setTransDegree] = useState('M.S. in Computer Science');
  const [transDept] = useState(studentProfile.department || 'CMPN');
  const [transMentoring, setTransMentoring] = useState(true);
  const [isSubmittingTransition, setIsSubmittingTransition] = useState(false);

  // Personal email & document upload states
  const [transPersonalEmail, setTransPersonalEmail] = useState(
    studentProfile.email ? studentProfile.email.replace('@student.vit.edu.in', '@gmail.com') : ''
  );
  const [transDocName, setTransDocName] = useState('');
  const [transDocUrl, setTransDocUrl] = useState('');

  // Clarification resubmission states
  const [resubmitDocName, setResubmitDocName] = useState('');
  const [resubmitDocUrl, setResubmitDocUrl] = useState('');

  const handleDismissBanner = () => {
    sessionStorage.setItem('grad_banner_dismissed', 'true');
    setHideBannerSession(true);
  };

  const handleTransitionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingTransition(true);
    const isHigher = transPathType === 'higher_studies';
    
    try {
      await submitRoleTransitionRequest(studentProfile.id, {
        company: isHigher ? transUniversity : transCompany,
        designation: isHigher ? `${transDegree} Scholar` : transDesignation,
        department: transDept,
        openToMentoring: transMentoring,
        personalEmail: transPersonalEmail,
        pathType: transPathType,
        higherEducationInstitute: isHigher ? transUniversity : undefined,
        degree: isHigher ? transDegree : undefined,
        verificationDocumentUrl: transDocUrl || undefined,
        verificationDocumentName: transDocName || undefined
      });
    } finally {
      setIsSubmittingTransition(false);
      setShowTransitionModal(false);
    }
  };

  // Calculate Profile Completion Percentage
  const calculateProfileCompletion = () => {
    let completed = 40;
    if (studentProfile.skills && studentProfile.skills.length > 0) completed += 15;
    if (studentProfile.areasOfInterest && studentProfile.areasOfInterest.length > 0) completed += 15;
    if (studentProfile.careerGoal) completed += 15;
    if (studentProfile.resumeUrl) completed += 15;
    return Math.min(100, completed);
  };

  const profileCompletionPct = calculateProfileCompletion();

  // Metrics for Stat Strip
  const myStudentRequests = mentorshipRequests.filter(r => r.studentId === studentProfile.id);
  const activeStudentRequests = myStudentRequests.filter(r => r.status === 'Pending' || r.status === 'Accepted');
  const totalSmartMatches = recommendedAlumniMatches.length + recommendedFacultyMatches.length;
  const publishedJobs = jobsList.filter(
    j => j.status !== 'Closed' && (j.moderationStatus === 'Approved' || j.postedByRole === 'admin')
  );
  const upcomingEvents = eventsList.filter(e => {
    const eventTime = new Date(`${e.date} ${e.time || '00:00'}`).getTime();
    return !isNaN(eventTime) ? eventTime >= Date.now() - 86400000 : true;
  });

  // Next Step Action Resolution (Section 5.2 rules)
  const getNextStep = () => {
    if (profileCompletionPct < 100) {
      return {
        title: 'Complete your profile',
        sentence: 'Add your technical skills and resume to receive smart match recommendations with verified alumni.',
        buttonLabel: 'Edit profile',
        action: () => setActiveTab('settings')
      };
    }
    if (myStudentRequests.length === 0) {
      return {
        title: 'Request your first mentor',
        sentence: 'Connect with verified alumni in your domain for 1:1 project guidance, mock interviews, and career advice.',
        buttonLabel: 'Find a mentor',
        action: () => setActiveTab('mentorship')
      };
    }
    if (publishedJobs.length > 0) {
      return {
        title: 'Explore corporate referrals',
        sentence: 'Verified alumni have published open internship and job referral listings matching your department.',
        buttonLabel: 'Browse opportunities',
        action: () => setActiveTab('opportunities')
      };
    }
    return {
      title: 'RSVP to an upcoming campus event',
      sentence: 'Attend upcoming alumni masterclasses, technical webinars, and departmental career panels.',
      buttonLabel: 'View events',
      action: () => setActiveTab('events')
    };
  };

  const nextStep = getNextStep();

  return (
    <div className="space-y-10 animate-in fade-in duration-300 font-sans text-xs">
      
      {/* Clarification Required Callout */}
      {(studentProfile.clarificationRequested || studentProfile.verificationStatus === 'Needs Clarification') && (
        <div className="bg-[#FEF3C7] border border-[#FDE68A] p-4 rounded-xl space-y-3 font-sans">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0">
              <AlertCircle className="w-4 h-4 text-[#B45309]" />
            </div>
            <div>
              <h4 className="font-semibold text-[#0A0A0A] text-sm">Action required: Verification clarification</h4>
              <p className="text-[#6B7280] text-xs mt-1 leading-relaxed">
                {studentProfile.clarificationRequested?.text || studentProfile.clarificationRequest || 'Please upload a scanned copy of your College Admit Card or Institutional ID for verification.'}
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-[#FDE68A] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <input
                type="file"
                accept="image/*,.pdf"
                id="student-clarification-upload"
                className="hidden"
                onChange={async e => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setResubmitDocName(file.name);
                    try {
                      const res = await uploadProofDocument(file, studentProfile.id);
                      setResubmitDocUrl(res.url);
                    } catch {
                      const objUrl = URL.createObjectURL(file);
                      setResubmitDocUrl(objUrl);
                    }
                  }
                }}
              />
              <label
                htmlFor="student-clarification-upload"
                className="px-3 py-1.5 bg-white border border-[#E5E7EB] hover:bg-[#FAFAFA] rounded-lg cursor-pointer text-xs font-medium text-[#0A0A0A] flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5 text-[#0A0A0A]" />
                {resubmitDocName ? resubmitDocName : 'Choose proof document (ID / Fee receipt)'}
              </label>
              {resubmitDocName && <span className="text-[11px] text-[#065F46] font-medium">✓ Attached: {resubmitDocName}</span>}
            </div>

            {resubmitDocName && (
              <button
                type="button"
                onClick={() => {
                  resubmitUserVerification(studentProfile.id, resubmitDocName, resubmitDocUrl);
                  setResubmitDocName('');
                  setResubmitDocUrl('');
                }}
                className="px-3.5 py-1.5 bg-[#0A0A0A] hover:bg-[#262626] text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
              >
                Submit updated proof
              </button>
            )}
          </div>
        </div>
      )}

      {/* Graduation Transition Banner */}
      {isPastGraduation && !pendingOrApprovedRequest && !hideBannerSession && (
        <div className="bg-[#EEF2FF] border border-[#C7D2FE] p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0">
              <GraduationCap className="w-4 h-4 text-[#3730A3]" />
            </div>
            <div>
              <h4 className="font-semibold text-[#0A0A0A] text-sm">Graduation milestone reached</h4>
              <p className="text-[#6B7280] text-xs mt-0.5">
                Transition your account to verified alumni status to continue accessing alumni networking and mentoring.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleDismissBanner}
              className="px-3 py-1.5 text-xs text-[#6B7280] hover:text-[#0A0A0A] font-medium rounded-lg transition-colors"
            >
              Remind me later
            </button>
            <button
              onClick={() => setShowTransitionModal(true)}
              className="px-3.5 py-1.5 bg-[#0A0A0A] hover:bg-[#262626] text-white text-xs font-medium rounded-lg transition-colors"
            >
              Update to alumni
            </button>
          </div>
        </div>
      )}

      {/* Pending transition note */}
      {pendingOrApprovedRequest?.status === 'pending' && (
        <div className="bg-[#FAFAFA] border border-[#E5E7EB] p-3 rounded-xl flex items-center gap-2 text-xs text-[#6B7280]">
          <Clock className="w-4 h-4 text-[#6B7280]" />
          <span>Alumni status transition is currently under review by the administration.</span>
        </div>
      )}

      {/* 1. Header (No outer box, PageHeader primitive) */}
      <PageHeader
        eyebrow="Student"
        title={`Welcome back, ${getGreetingName(currentUser.name)}`}
        subtitle={
          <div className="flex items-center gap-2 flex-wrap">
            <span>PRN: <span className="font-mono text-[#0A0A0A]">{studentProfile.enrollmentNo || studentProfile.prn || '23101A0042'}</span></span>
            <span>·</span>
            <span>VIT {studentProfile.department}</span>
            <span>·</span>
            <span>{studentProfile.semester || 'Semester 6'}</span>
            {profileCompletionPct === 100 && (
              <span className="inline-flex items-center gap-1 text-[11px] text-[#065F46] font-medium ml-2">
                <CheckCircle2 className="w-3.5 h-3.5" /> Profile complete
              </span>
            )}
          </div>
        }
        actions={
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className="px-3.5 py-2 border border-[#E5E7EB] hover:bg-[#FAFAFA] text-[#0A0A0A] text-xs font-medium rounded-lg transition-colors cursor-pointer"
          >
            Edit profile
          </button>
        }
      >
        {/* Slim 2px profile completion line under header (only while profile < 100%) */}
        {profileCompletionPct < 100 && (
          <div className="pt-2">
            <div className="flex items-center justify-between text-[11px] text-[#6B7280] mb-1">
              <span>Profile completion: <strong className="text-[#0A0A0A] tabular-nums">{profileCompletionPct}%</strong></span>
              <button
                onClick={() => setActiveTab('settings')}
                className="text-[#0A0A0A] hover:underline"
              >
                Add resume & skills →
              </button>
            </div>
            <div className="h-0.5 bg-[#E5E7EB] w-full rounded-full overflow-hidden">
              <div
                className="h-full bg-[#0A0A0A] transition-all duration-300"
                style={{ width: `${profileCompletionPct}%` }}
              />
            </div>
          </div>
        )}
      </PageHeader>

      {/* 2. FocusPanel: Single Emphasis Surface per Viewport ("Your next step") */}
      <FocusPanel
        eyebrow="Next action"
        title={nextStep.title}
        action={
          <button
            type="button"
            onClick={nextStep.action}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#0A0A0A] hover:bg-[#262626] text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
          >
            <span>{nextStep.buttonLabel}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        }
      >
        <p className="text-xs sm:text-sm text-[#6B7280] leading-relaxed">
          {nextStep.sentence}
        </p>
      </FocusPanel>

      {/* 3. Stat Strip (One row, 4 figures, vertical hairlines, tabular-nums) */}
      <StatStrip
        hideIfAllZero
        items={[
          {
            label: 'Active requests',
            value: activeStudentRequests.length,
            subtext: activeStudentRequests.length > 0 ? 'Mentorship & research' : 'No requests yet',
            onClick: () => setActiveTab('mentorship', 'requests'),
            trend: activeStudentRequests.length > 0 ? { value: `${activeStudentRequests.length} active`, positive: true } : undefined
          },
          {
            label: 'Mentor matches',
            value: totalSmartMatches,
            subtext: totalSmartMatches > 0 ? 'Alumni & faculty' : 'Compiling',
            onClick: () => setActiveTab('mentorship', 'find')
          },
          {
            label: 'Job openings',
            value: publishedJobs.length,
            subtext: publishedJobs.length > 0 ? 'Corporate referrals' : 'No listings',
            onClick: () => setActiveTab('opportunities')
          },
          {
            label: 'Campus events',
            value: upcomingEvents.length,
            subtext: upcomingEvents.length > 0 ? 'Masterclasses & talks' : 'None scheduled',
            onClick: () => setActiveTab('events')
          }
        ]}
        zeroFallback={
          <div className="py-6 border-y border-[#E5E7EB] space-y-3">
            <h4 className="text-xs font-semibold text-[#0A0A0A]">Getting started checklist</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div
                onClick={() => setActiveTab('settings')}
                className="p-3 bg-[#FAFAFA] rounded-lg flex items-center justify-between cursor-pointer hover:bg-[#F3F4F6]"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className={`w-4 h-4 ${studentProfile.skills?.length ? 'text-[#065F46]' : 'text-[#6B7280]'}`} />
                  <span>1. Add technical skills & interests</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-[#6B7280]" />
              </div>
              <div
                onClick={() => setActiveTab('settings')}
                className="p-3 bg-[#FAFAFA] rounded-lg flex items-center justify-between cursor-pointer hover:bg-[#F3F4F6]"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className={`w-4 h-4 ${studentProfile.resumeUrl ? 'text-[#065F46]' : 'text-[#6B7280]'}`} />
                  <span>2. Upload verified resume</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-[#6B7280]" />
              </div>
            </div>
          </div>
        }
      />

      {/* 4. Main Two-Column Layout (Main Content + Quiet Right Rail) */}
      <div className="flex flex-col xl:flex-row gap-10 items-start">
        
        {/* Main Column */}
        <div className="flex-1 min-w-0 space-y-10 w-full">
          
          {/* Institutional Announcements Feed */}
          <InstitutionalAnnouncementFeed announcements={announcements} userRole="student" />

          {/* Recommended Mentors Section (Rendered as ListRow rows, not cards) */}
          <Section
            title="Recommended mentors"
            description={`Based on your goal: ${studentProfile.careerGoal || 'SDE-1, product companies'}`}
            action={
              <button
                type="button"
                onClick={() => setActiveTab('mentorship', 'find')}
                className="text-xs font-medium text-[#0A0A0A] hover:underline flex items-center gap-1"
              >
                <span>See all mentors</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            }
          >
            {recommendedAlumniMatches.length === 0 ? (
              <p className="text-xs text-[#6B7280] py-6">
                No matching mentors found. Try updating your career goal in settings.
              </p>
            ) : (
              <div className="divide-y divide-[#E5E7EB] border-y border-[#E5E7EB]">
                {recommendedAlumniMatches.slice(0, 3).map((match, idx) => (
                  <ListRow
                    key={match.item.id}
                    isFirst={idx === 0}
                    leading={
                      <img
                        src={match.item.avatar}
                        alt={match.item.name}
                        className="w-10 h-10 rounded-full object-cover border border-[#E5E7EB]"
                      />
                    }
                    title={match.item.name}
                    meta={
                      <StatusBadge
                        label={`${match.score}% match`}
                        tone="indigo"
                        size="sm"
                      />
                    }
                    subtitle={`${match.item.designation} at ${match.item.company} · VIT ${match.item.department} '${match.item.graduationYear || 2020}`}
                    trailing={
                      <button
                        type="button"
                        onClick={() => setActiveTab('mentorship', 'find')}
                        className="px-3 py-1.5 bg-white border border-[#E5E7EB] hover:bg-[#FAFAFA] text-[#0A0A0A] text-xs font-medium rounded-lg transition-colors cursor-pointer"
                      >
                        Request
                      </button>
                    }
                  />
                ))}
              </div>
            )}
          </Section>

          {/* Departmental Opportunities Section */}
          <Section
            title="Opportunities & referrals"
            description="Active corporate openings and research projects from alumni and faculty"
            action={
              <button
                type="button"
                onClick={() => setActiveTab('opportunities')}
                className="text-xs font-medium text-[#0A0A0A] hover:underline flex items-center gap-1"
              >
                <span>View all openings</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            }
          >
            {publishedJobs.length === 0 ? (
              <p className="text-xs text-[#6B7280] py-6">
                No current job openings in your department.
              </p>
            ) : (
              <div className="divide-y divide-[#E5E7EB] border-y border-[#E5E7EB]">
                {publishedJobs.slice(0, 3).map((job, idx) => (
                  <ListRow
                    key={job.id}
                    isFirst={idx === 0}
                    leading={
                      <div className="w-10 h-10 rounded-lg bg-[#F3F4F6] text-[#0A0A0A] flex items-center justify-center font-bold text-xs">
                        {job.company.slice(0, 2).toUpperCase()}
                      </div>
                    }
                    title={job.title}
                    meta={<span className="text-xs font-mono text-[#0A0A0A]">{job.stipendOrSalary}</span>}
                    subtitle={`${job.company} · ${job.location} · Posted: ${job.postedDate}`}
                    trailing={
                      <button
                        type="button"
                        onClick={() => setActiveTab('opportunities')}
                        className="px-3 py-1.5 bg-white border border-[#E5E7EB] hover:bg-[#FAFAFA] text-[#0A0A0A] text-xs font-medium rounded-lg transition-colors cursor-pointer"
                      >
                        View
                      </button>
                    }
                  />
                ))}
              </div>
            )}
          </Section>

        </div>

        {/* Quiet Right Rail (Secondary Information) */}
        <RightRail>
          {/* Upcoming Events */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#0A0A0A]">Upcoming events</h3>
              <button
                onClick={() => setActiveTab('events')}
                className="text-xs text-[#6B7280] hover:text-[#0A0A0A]"
              >
                All events →
              </button>
            </div>

            {upcomingEvents.length === 0 ? (
              <p className="text-xs text-[#6B7280]">No upcoming events scheduled.</p>
            ) : (
              <div className="space-y-3">
                {upcomingEvents.slice(0, 3).map(event => {
                  const isRsvpd = event.registeredUserIds?.includes(studentProfile.id);
                  return (
                    <div
                      key={event.id}
                      onClick={() => setActiveTab('events')}
                      className="p-3 rounded-lg border border-[#E5E7EB] hover:bg-[#FAFAFA] transition-colors cursor-pointer space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-[11px] text-[#6B7280]">
                        <span className="font-mono">{event.date}</span>
                        {isRsvpd && (
                          <StatusBadge label="RSVP'd" tone="emerald" size="sm" />
                        )}
                      </div>
                      <h4 className="text-xs font-semibold text-[#0A0A0A] line-clamp-1">
                        {event.title}
                      </h4>
                      <p className="text-[11px] text-[#6B7280] line-clamp-1">
                        {event.speakerName} · {event.speakerCompany}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Academic Deadlines / Notices */}
          <div className="space-y-3 pt-6 border-t border-[#E5E7EB]">
            <h3 className="text-sm font-semibold text-[#0A0A0A]">Important notices</h3>
            <div className="space-y-2 text-xs text-[#6B7280] leading-relaxed">
              <p>• Final semester project review submissions due by next Friday.</p>
              <p>• Placement cell campus recruitment registration window open for Batch 2025.</p>
            </div>
          </div>
        </RightRail>

      </div>

      {/* Role Transition Request Modal */}
      <Modal
        isOpen={showTransitionModal}
        onClose={() => setShowTransitionModal(false)}
        title="Update to Alumni Status"
        subtitle="Please provide your current professional details."
        maxWidth="md"
      >
        <form onSubmit={handleTransitionSubmit} className="space-y-4 text-xs font-sans">
          <div>
            <label className="block text-[#0A0A0A] font-semibold text-xs mb-1.5">Current primary path</label>
            <div className="grid grid-cols-2 gap-2 bg-[#F3F4F6] p-1 rounded-xl border border-[#E5E7EB]">
              <button
                type="button"
                onClick={() => setTransPathType('employed')}
                className={`py-1.5 px-3 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  transPathType === 'employed'
                    ? 'bg-white text-[#0A0A0A] border border-[#E5E7EB]'
                    : 'text-[#6B7280] hover:text-[#0A0A0A]'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5" /> Employed
              </button>
              <button
                type="button"
                onClick={() => setTransPathType('higher_studies')}
                className={`py-1.5 px-3 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  transPathType === 'higher_studies'
                    ? 'bg-white text-[#0A0A0A] border border-[#E5E7EB]'
                    : 'text-[#6B7280] hover:text-[#0A0A0A]'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" /> Higher studies
              </button>
            </div>
          </div>

          {transPathType === 'employed' ? (
            <>
              <TextField
                label="Company or organization"
                type="text"
                required
                value={transCompany}
                onChange={e => setTransCompany(e.target.value)}
                placeholder="e.g. Google India"
              />
              <TextField
                label="Current designation"
                type="text"
                required
                value={transDesignation}
                onChange={e => setTransDesignation(e.target.value)}
                placeholder="e.g. Software Engineer"
              />
            </>
          ) : (
            <>
              <TextField
                label="University or institution name"
                type="text"
                required
                value={transUniversity}
                onChange={e => setTransUniversity(e.target.value)}
                placeholder="e.g. Carnegie Mellon University / IIT Bombay"
              />
              <TextField
                label="Degree & field of study"
                type="text"
                required
                value={transDegree}
                onChange={e => setTransDegree(e.target.value)}
                placeholder="e.g. M.S. in Computer Science / MBA"
              />
            </>
          )}

          <TextField
            label="Personal login email (post-graduation)"
            type="email"
            required
            value={transPersonalEmail}
            onChange={e => setTransPersonalEmail(e.target.value)}
            placeholder="e.g. yourname@gmail.com"
          />

          <div>
            <label className="block text-[#0A0A0A] font-semibold text-xs mb-1">
              Verification proof document (degree certificate / offer letter scan)
            </label>
            <input 
              type="file" 
              accept="image/*,.pdf" 
              onChange={async e => {
                const file = e.target.files?.[0];
                if (file) {
                  setTransDocName(file.name);
                  try {
                    const res = await uploadProofDocument(file, studentProfile.id);
                    setTransDocUrl(res.url);
                  } catch {
                    const objUrl = URL.createObjectURL(file);
                    setTransDocUrl(objUrl);
                  }
                }
              }} 
              className="w-full bg-[#FAFAFA] border border-[#E5E7EB] px-3 py-2 text-xs rounded-lg focus:outline-none focus:border-[#0A0A0A] cursor-pointer" 
            />
            {transDocName && (
              <p className="text-[10px] text-[#065F46] font-semibold mt-1">✓ Attached: {transDocName}</p>
            )}
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input 
              type="checkbox" 
              id="openToMentoring" 
              checked={transMentoring} 
              onChange={e => setTransMentoring(e.target.checked)} 
              className="w-4 h-4 text-[#0A0A0A] border-[#E5E7EB] rounded focus:ring-[#0A0A0A]" 
            />
            <label htmlFor="openToMentoring" className="text-xs text-[#0A0A0A] font-medium">I am open to mentoring current students</label>
          </div>
          
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E5E7EB]">
            <Button variant="secondary" size="sm" type="button" onClick={() => setShowTransitionModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" disabled={isSubmittingTransition}>
              {isSubmittingTransition ? 'Submitting...' : 'Submit request'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export const StudentDashboard: React.FC<StudentDashboardProps> = (props) => {
  const { currentUser } = useAuth();
  if (!currentUser) return null;
  return <StudentDashboardContent {...props} studentProfile={currentUser as StudentProfile} />;
};

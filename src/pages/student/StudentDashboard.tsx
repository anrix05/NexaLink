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
  Users,
  Bookmark,
  Calendar,
  Sparkles,
  Building2,
  ChevronRight,
  GraduationCap,
  CheckCircle2,
  ArrowRight,
  Briefcase,
  Check,
  ShieldCheck,
  Lightbulb,
  ExternalLink,
  GraduationCap as GradCapIcon,
  X,
  Clock,
  AlertCircle,
  Upload,
  FileText
} from 'lucide-react';
import { Badge, Button, StatCard } from '../../components/common/UIComponents';
import { uploadProofDocument } from '../../lib/storage';

interface StudentDashboardProps {
  setActiveTab: (tab: string, subTab?: string) => void;
}

const StudentDashboardContent: React.FC<StudentDashboardProps & { studentProfile: StudentProfile }> = ({ setActiveTab, studentProfile }) => {
  const currentUser = studentProfile;
  const { alumniList, facultyList, jobsList, eventsList, mentorshipRequests, roleTransitionRequests, submitRoleTransitionRequest, resubmitUserVerification } = useData();

  // Run Smart Recommendation Engine
  const recommendedAlumniMatches = getRecommendedAlumniMentors(studentProfile, alumniList);
  const recommendedFacultyMatches = getRecommendedFacultyMentors(studentProfile, facultyList);
  const recommendedJobMatches = getRecommendedOpportunities(studentProfile, jobsList);

  // Role Transition State
  const gradYear = studentProfile.expectedGraduationYear || studentProfile.graduationYear || 0;
  const isPastGraduation = gradYear > 2000 && gradYear <= new Date().getFullYear();
  
  const pendingOrApprovedRequest = roleTransitionRequests.find(r => r.userId === studentProfile.id && (r.status === 'pending' || r.status === 'approved'));
  const rejectedRequest = roleTransitionRequests.find(r => r.userId === studentProfile.id && r.status === 'rejected');
  
  const [hideBannerSession, setHideBannerSession] = useState(() => sessionStorage.getItem('grad_banner_dismissed') === 'true');
  const [showTransitionModal, setShowTransitionModal] = useState(false);
  const [transPathType, setTransPathType] = useState<'employed' | 'higher_studies'>('employed');
  const [transCompany, setTransCompany] = useState('');
  const [transDesignation, setTransDesignation] = useState('');
  const [transUniversity, setTransUniversity] = useState('');
  const [transDegree, setTransDegree] = useState('M.S. in Computer Science');
  const [transDept, setTransDept] = useState(studentProfile.department || 'CMPN');
  const [transMentoring, setTransMentoring] = useState(true);

  // New personal email & document upload states
  const [transPersonalEmail, setTransPersonalEmail] = useState(studentProfile.email ? studentProfile.email.replace('@student.vit.edu.in', '@gmail.com') : '');
  const [transDocName, setTransDocName] = useState('');
  const [transDocUrl, setTransDocUrl] = useState('');

  // Clarification resubmission states
  const [resubmitDocName, setResubmitDocName] = useState('');
  const [resubmitDocUrl, setResubmitDocUrl] = useState('');

  const handleDismissBanner = () => {
    sessionStorage.setItem('grad_banner_dismissed', 'true');
    setHideBannerSession(true);
  };

  const handleTransitionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const isHigher = transPathType === 'higher_studies';
    submitRoleTransitionRequest(studentProfile.id, {
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
    setShowTransitionModal(false);
  };

  // Calculate Profile Completion Percentage
  const calculateProfileCompletion = () => {
    let completed = 40; // Base details
    if (studentProfile.skills && studentProfile.skills.length > 0) completed += 15;
    if (studentProfile.areasOfInterest && studentProfile.areasOfInterest.length > 0) completed += 15;
    if (studentProfile.careerGoal) completed += 15;
    if (studentProfile.resumeUrl) completed += 15;
    return Math.min(100, completed);
  };

  const profileCompletionPct = calculateProfileCompletion();

  // Metric Calculations for 4 Stat Cards
  const myStudentRequests = mentorshipRequests.filter(
    r => r.studentId === studentProfile.id
  );
  const activeStudentRequests = myStudentRequests.filter(r => r.status === 'Pending' || r.status === 'Accepted');
  const activePct = myStudentRequests.length > 0
    ? Math.round((activeStudentRequests.length / myStudentRequests.length) * 100)
    : 100;

  const totalSmartMatches = recommendedAlumniMatches.length + recommendedFacultyMatches.length;
  const topMatchScore = Math.max(
    ...recommendedAlumniMatches.map(m => m.score),
    ...recommendedFacultyMatches.map(m => m.score),
    0
  );

  const publishedJobs = jobsList.filter(
    j => j.status !== 'Closed' && (j.moderationStatus === 'Approved' || j.postedByRole === 'admin')
  );
  const recentJobsCount = publishedJobs.filter(j => {
    const postTime = new Date(j.postedDate).getTime();
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    return !isNaN(postTime) ? postTime >= thirtyDaysAgo : true;
  }).length;
  const validNewJobsBadgeCount = Math.min(recentJobsCount, publishedJobs.length);

  const upcomingEvents = eventsList.filter(
    e => e.status === 'Upcoming' || (e.date && new Date(e.date).getTime() >= new Date('2026-08-01').getTime())
  );
  const rsvpdEventsCount = upcomingEvents.filter(e => e.registeredUserIds?.includes(studentProfile.id)).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-16 sm:pb-0 font-sans text-xs">

      {/* Clarification Required Callout */}
      {(studentProfile.clarificationRequested || studentProfile.verificationStatus === 'Needs Clarification') && (
        <div className="bg-amber-50 border border-amber-300 p-4 rounded-xl space-y-3 font-sans shadow-2xs">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
              <AlertCircle className="w-4 h-4 text-[#B45309]" />
            </div>
            <div>
              <h4 className="font-bold text-[#0A0A0A] text-sm">Action Required: Verification Clarification Request</h4>
              <p className="text-[#374151] text-xs mt-1 font-medium leading-relaxed">
                {studentProfile.clarificationRequested?.text || studentProfile.clarificationRequest || 'Please upload a scanned copy of your College Admit Card or Institutional ID for verification.'}
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
                className="px-3 py-1.5 bg-white border border-[#E5E7EB] hover:bg-[#FAFAFA] rounded-lg cursor-pointer text-xs font-bold text-[#0A0A0A] flex items-center gap-1.5 shadow-2xs"
              >
                <Upload className="w-3.5 h-3.5 text-[#0A0A0A]" />
                {resubmitDocName ? resubmitDocName : 'Choose Proof File (ID Card / Admit Card)'}
              </label>
              {resubmitDocName && <span className="text-[10px] text-emerald-700 font-bold">✓ Attached: {resubmitDocName}</span>}
            </div>

            {resubmitDocName && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  resubmitUserVerification(studentProfile.id, resubmitDocName, resubmitDocUrl);
                  setResubmitDocName('');
                  setResubmitDocUrl('');
                }}
              >
                Submit Updated Proof to Admin
              </Button>
            )}
          </div>
        </div>
      )}

      {/* 0. Role Transition Banner */}
      {isPastGraduation && !pendingOrApprovedRequest && !hideBannerSession && (
        <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
              <GradCapIcon className="w-4 h-4 text-indigo-700" />
            </div>
            <div>
              <h4 className="font-bold text-indigo-950 text-sm">Looks like you've graduated</h4>
              <p className="text-indigo-800 text-xs mt-0.5">Update your profile to Alumni status to access alumni networking & mentorship features?</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={handleDismissBanner} className="px-3 py-1.5 text-indigo-700 hover:bg-indigo-100 font-medium rounded-lg transition-colors">
              Remind me later
            </button>
            <Button variant="primary" size="sm" onClick={() => setShowTransitionModal(true)}>
              Update to Alumni
            </Button>
          </div>
        </div>
      )}

      {rejectedRequest && !pendingOrApprovedRequest && (
        <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
              <X className="w-4 h-4 text-rose-700" />
            </div>
            <div>
              <h4 className="font-bold text-rose-950 text-sm">Alumni Transition Request Rejected</h4>
              <p className="text-rose-800 text-xs mt-0.5">Reason: "{rejectedRequest.rejectionReason || 'Details mismatch'}". You may update your information and submit a new request.</p>
            </div>
          </div>
          <div className="shrink-0">
            <Button variant="primary" size="sm" onClick={() => setShowTransitionModal(true)}>
              Submit New Request
            </Button>
          </div>
        </div>
      )}

      {pendingOrApprovedRequest?.status === 'pending' && (
        <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl flex items-center gap-2 text-amber-800 font-medium text-xs">
          <Clock className="w-4 h-4" />
          Alumni status update pending admin verification.
        </div>
      )}

      {/* 1. Header Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E7EB] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="indigo" size="sm">Student Workspace</Badge>
            <span className="text-[11px] font-mono text-[#6B7280]">PRN: {studentProfile.enrollmentNo || studentProfile.prn || '23101A0042'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-black text-[#0A0A0A] tracking-tight mt-1 flex items-center gap-2">
            Welcome back, {currentUser.name.split(' ')[0]} <span className="text-xl">👋</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#6B7280] font-medium mt-1">
            Personalized guidance matches and career roadmaps powered by central Vidyalankar data.
          </p>
        </div>

        {profileCompletionPct < 100 && (
          <Button
            variant="primary"
            size="md"
            onClick={() => setActiveTab('settings')}
            icon={<Sparkles className="w-3.5 h-3.5" />}
          >
            Complete Profile ({profileCompletionPct}%)
          </Button>
        )}
      </div>

      {/* 2. Profile Completion Status Card with Embedded Resume (Single Source of Truth) */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 sm:p-6 shadow-none space-y-3.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-display font-bold text-[#0A0A0A] uppercase tracking-wider flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
            Profile Completion Status: {profileCompletionPct}% Complete
          </span>
          {profileCompletionPct < 100 ? (
            <button
              onClick={() => setActiveTab('settings')}
              className="text-xs font-display font-bold text-[#0A0A0A] hover:underline flex items-center gap-1 transition uppercase tracking-wider"
            >
              Add Skills & Resume <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <span className="text-[11px] font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
              Full Access Active
            </span>
          )}
        </div>

        <div className="w-full h-2 bg-[#F3F4F6] rounded-full overflow-hidden p-0.5 border border-[#E5E7EB]">
          <div
            className="h-full bg-[#0A0A0A] rounded-full transition-all duration-500"
            style={{ width: `${profileCompletionPct}%` }}
          />
        </div>

        {/* Embedded Resume Row */}
        {studentProfile.resumeUrl ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2.5 border-t border-[#E5E7EB] text-xs">
            <div className="flex items-center gap-2 text-[#374151] font-medium min-w-0">
              <FileText className="w-3.5 h-3.5 text-[#0A0A0A] shrink-0" />
              <span className="truncate">
                Resume: <strong className="font-mono text-[#0A0A0A]">{studentProfile.resumeUrl.split('/').pop() || 'aanya_patel_vit.pdf'}</strong>
              </span>
              <span className="text-emerald-700 font-bold font-mono text-[10px]">✓ On File</span>
            </div>
            {studentProfile.resumeUrl.startsWith('http') && (
              <a
                href={studentProfile.resumeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-display font-bold text-[#0A0A0A] hover:underline flex items-center gap-1 shrink-0 self-start sm:self-auto"
              >
                View Document <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between pt-2.5 border-t border-[#E5E7EB] text-xs">
            <span className="text-[#6B7280] font-medium">No resume document uploaded</span>
            <button
              onClick={() => setActiveTab('settings')}
              className="text-xs font-display font-bold text-[#0A0A0A] hover:underline flex items-center gap-1"
            >
              Upload in Settings <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* 3. Top Metric Cards — Compact 2x2 Grid with Interactive Deep Links */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="Active Requests"
          value={activeStudentRequests.length}
          subtext="Guidance & Research"
          icon={<GraduationCap className="w-4 h-4 text-[#0A0A0A]" />}
          trend={{ value: `${activePct}% Active`, positive: true }}
          onClick={() => setActiveTab('mentorship', 'my-sent')}
        />

        <StatCard
          title="Smart Matches"
          value={totalSmartMatches}
          subtext="Alumni & Faculty"
          icon={<Sparkles className="w-4 h-4 text-[#0A0A0A]" />}
          trend={{ value: topMatchScore > 0 ? `${topMatchScore}% Top Match` : 'Curated', positive: true }}
          onClick={() => setActiveTab('mentorship', 'find')}
        />

        <StatCard
          title="Job Openings"
          value={publishedJobs.length}
          subtext="Corporate Referrals"
          icon={<Briefcase className="w-4 h-4 text-[#0A0A0A]" />}
          trend={{ value: `${validNewJobsBadgeCount} New`, positive: true }}
          onClick={() => setActiveTab('jobs')}
        />

        <StatCard
          title="Campus Events"
          value={upcomingEvents.length}
          subtext="Masterclasses & Talks"
          icon={<Calendar className="w-4 h-4 text-[#0A0A0A]" />}
          trend={{ value: rsvpdEventsCount > 0 ? `${rsvpdEventsCount} RSVP'd` : 'Upcoming', positive: true }}
          onClick={() => setActiveTab('events')}
        />
      </div>

      {/* 4. Alumni by Organization Hub — Single Row Horizontally Scrollable */}
      <div className="bg-[#0A0A0A] text-white p-5 sm:p-6 rounded-xl border border-[#222222] space-y-3.5 shadow-none">
        <div className="flex items-center justify-between border-b border-[#222222] pb-3">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-white" />
            <h2 className="font-display font-bold text-xs uppercase tracking-widest text-white">
              Alumni by Organization
            </h2>
          </div>

          <button
            onClick={() => setActiveTab('directory')}
            className="group inline-flex items-center gap-1 text-xs font-display font-bold uppercase tracking-wider text-neutral-300 hover:text-white transition-all"
          >
            <span>Open Reverse Search</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        <p className="text-xs text-neutral-400 font-medium">
          Targeting top companies or higher studies? Search any organization to find verified VIT alumni.
        </p>

        {/* Horizontally Scrollable Compact Organization Chips */}
        <div className="flex gap-2.5 overflow-x-auto custom-scrollbar momentum-scroll pt-1 pb-1 select-none">
          {[
            {
              name: 'Google',
              count: 142,
              logo: (
                <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
              )
            },
            {
              name: 'Microsoft',
              count: 118,
              logo: (
                <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 23 23">
                  <path fill="#f35325" d="M1 1h10v10H1z"/>
                  <path fill="#81bc06" d="M12 1h10v10H12z"/>
                  <path fill="#05a6f0" d="M1 12h10v10H1z"/>
                  <path fill="#ffba08" d="M12 12h10v10H12z"/>
                </svg>
              )
            },
            {
              name: 'Morgan Stanley',
              count: 94,
              logo: <span className="text-[11px] font-mono font-black text-white shrink-0">MS</span>
            },
            {
              name: 'TCS Digital',
              count: 240,
              logo: <span className="text-[11px] font-mono font-black text-white shrink-0">TCS</span>
            },
            {
              name: 'Carnegie Mellon',
              count: 32,
              logo: <span className="text-xs shrink-0">🎓</span>
            },
            {
              name: 'IIT Bombay',
              count: 45,
              logo: <span className="text-xs shrink-0">🏛️</span>
            }
          ].map(w => (
            <button
              key={w.name}
              onClick={() => setActiveTab('directory')}
              className="px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 hover:border-white/20 transition-all text-neutral-200 group flex items-center gap-2.5 shrink-0"
            >
              {w.logo}
              <div className="text-left">
                <span className="text-xs font-bold text-neutral-200 group-hover:text-white block leading-tight">{w.name}</span>
                <span className="font-mono text-[10px] font-bold text-neutral-400 group-hover:text-white transition-colors">
                  {w.count} Grads
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 5. Top Matches Preview Row (Replaces Full Inline Engine) */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 sm:p-6 space-y-4 shadow-none">
        <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#0A0A0A]" />
            <div>
              <h2 className="font-display font-bold text-xs uppercase tracking-wider text-[#0A0A0A]">
                Top Recommended Matches
              </h2>
              <p className="text-[11px] text-[#6B7280] font-medium">
                Curated for {studentProfile.careerGoal || 'Software Engineering'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('mentorship')}
            className="text-xs font-display font-bold text-[#0A0A0A] hover:underline flex items-center gap-1 uppercase tracking-wider transition"
          >
            View All Mentors <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Horizontally Scrollable Preview Cards */}
        <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar momentum-scroll snap-x snap-mandatory">
          {recommendedAlumniMatches.slice(0, 3).map(match => (
            <div
              key={match.item.id}
              onClick={() => setActiveTab('mentorship')}
              className="min-w-[240px] sm:min-w-[260px] max-w-[280px] p-4 bg-[#FAFAFA] border border-[#E5E7EB] rounded-xl hover:border-[#0A0A0A] hover:bg-white transition-all duration-150 cursor-pointer snap-start flex flex-col justify-between shrink-0 space-y-3"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-1.5">
                  <Badge variant="indigo" size="sm">
                    {match.score}% Match
                  </Badge>
                  <Badge variant="emerald" size="sm" icon={<Check className="w-3 h-3" />}>
                    Verified Alum
                  </Badge>
                </div>

                <div className="flex items-center gap-2.5">
                  <img
                    src={match.item.avatar}
                    alt={match.item.name}
                    className="w-10 h-10 rounded-full object-cover border border-[#E5E7EB] shrink-0"
                  />
                  <div className="min-w-0">
                    <h4 className="font-display font-bold text-[#0A0A0A] text-xs truncate">{match.item.name}</h4>
                    <p className="text-[11px] text-[#6B7280] font-medium truncate">
                      {match.item.designation} at <strong className="text-[#0A0A0A]">{match.item.company}</strong>
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-[#E5E7EB] flex items-center justify-between text-[11px] font-display font-bold text-[#0A0A0A]">
                <span>Request Guidance</span>
                <ArrowRight className="w-3 h-3 text-[#6B7280]" />
              </div>
            </div>
          ))}

          {/* End 'View All' Card */}
          <div
            onClick={() => setActiveTab('mentorship')}
            className="min-w-[150px] p-4 bg-[#FAFAFA] border border-dashed border-[#E5E7EB] rounded-xl hover:border-[#0A0A0A] hover:bg-white transition-all duration-150 flex flex-col items-center justify-center text-center cursor-pointer shrink-0 snap-start space-y-2"
          >
            <div className="w-8 h-8 rounded-full bg-white border border-[#E5E7EB] flex items-center justify-center text-[#0A0A0A]">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-display font-bold text-[#0A0A0A]">View All</p>
              <p className="text-[10px] text-[#6B7280] font-medium">Alumni & Faculty</p>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-[#0A0A0A]" />
          </div>
        </div>
      </div>


      {/* Role Transition Modal */}
      {showTransitionModal && (
        <div className="fixed inset-0 bg-[#0A0A0A]/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-[#E5E7EB]">
            <div className="p-5 border-b border-[#E5E7EB] flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-[#0A0A0A] uppercase tracking-wider text-sm">Update to Alumni Status</h3>
                <p className="text-[#6B7280] text-[11px] mt-0.5">Please provide your current professional details.</p>
              </div>
              <button onClick={() => setShowTransitionModal(false)} className="text-[#6B7280] hover:text-[#0A0A0A]">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleTransitionSubmit} className="p-5 space-y-4">
              {/* Path Type Selector */}
              <div>
                <label className="block text-[#0A0A0A] font-bold text-[10px] uppercase tracking-wider mb-1.5">Current Primary Path</label>
                <div className="grid grid-cols-2 gap-2 bg-[#F3F4F6] p-1 rounded-xl border border-[#E5E7EB]">
                  <button
                    type="button"
                    onClick={() => setTransPathType('employed')}
                    className={`py-1.5 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                      transPathType === 'employed'
                        ? 'bg-white text-[#0A0A0A] shadow-sm border border-[#E5E7EB]'
                        : 'text-[#6B7280] hover:text-[#0A0A0A]'
                    }`}
                  >
                    <Briefcase className="w-3.5 h-3.5" /> Employed
                  </button>
                  <button
                    type="button"
                    onClick={() => setTransPathType('higher_studies')}
                    className={`py-1.5 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                      transPathType === 'higher_studies'
                        ? 'bg-white text-[#0A0A0A] shadow-sm border border-[#E5E7EB]'
                        : 'text-[#6B7280] hover:text-[#0A0A0A]'
                    }`}
                  >
                    <GradCapIcon className="w-3.5 h-3.5" /> Higher Studies
                  </button>
                </div>
              </div>

              {transPathType === 'employed' ? (
                <>
                  <div>
                    <label className="block text-[#0A0A0A] font-bold text-[10px] uppercase tracking-wider mb-1">Company / Organization</label>
                    <input 
                      type="text" 
                      required 
                      value={transCompany} 
                      onChange={e => setTransCompany(e.target.value)} 
                      placeholder="e.g. Google India" 
                      className="w-full bg-[#F9FAFB] border border-[#E5E7EB] px-3 py-2 text-xs rounded-lg focus:outline-none focus:border-[#0A0A0A]" 
                    />
                  </div>
                  
                  <div>
                    <label className="block text-[#0A0A0A] font-bold text-[10px] uppercase tracking-wider mb-1">Current Designation</label>
                    <input 
                      type="text" 
                      required 
                      value={transDesignation} 
                      onChange={e => setTransDesignation(e.target.value)} 
                      placeholder="e.g. Software Engineer" 
                      className="w-full bg-[#F9FAFB] border border-[#E5E7EB] px-3 py-2 text-xs rounded-lg focus:outline-none focus:border-[#0A0A0A]" 
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-[#0A0A0A] font-bold text-[10px] uppercase tracking-wider mb-1">University / Institution Name</label>
                    <input 
                      type="text" 
                      required 
                      value={transUniversity} 
                      onChange={e => setTransUniversity(e.target.value)} 
                      placeholder="e.g. Carnegie Mellon University / IIT Bombay" 
                      className="w-full bg-[#F9FAFB] border border-[#E5E7EB] px-3 py-2 text-xs rounded-lg focus:outline-none focus:border-[#0A0A0A]" 
                    />
                  </div>
                  
                  <div>
                    <label className="block text-[#0A0A0A] font-bold text-[10px] uppercase tracking-wider mb-1">Degree & Field of Study</label>
                    <input 
                      type="text" 
                      required 
                      value={transDegree} 
                      onChange={e => setTransDegree(e.target.value)} 
                      placeholder="e.g. M.S. in Computer Science / MBA" 
                      className="w-full bg-[#F9FAFB] border border-[#E5E7EB] px-3 py-2 text-xs rounded-lg focus:outline-none focus:border-[#0A0A0A]" 
                    />
                  </div>
                </>
              )}
              
              <div>
                <label className="block text-[#0A0A0A] font-bold text-[10px] uppercase tracking-wider mb-1">
                  Personal Login Email (Post-Graduation)
                </label>
                <input 
                  type="email" 
                  required 
                  value={transPersonalEmail} 
                  onChange={e => setTransPersonalEmail(e.target.value)} 
                  placeholder="e.g. yourname@gmail.com" 
                  className="w-full bg-[#F9FAFB] border border-[#E5E7EB] px-3 py-2 text-xs rounded-lg focus:outline-none focus:border-[#0A0A0A]" 
                />
              </div>

              <div>
                <label className="block text-[#0A0A0A] font-bold text-[10px] uppercase tracking-wider mb-1">
                  Verification Proof Document (Degree Certificate / Offer Letter Scan)
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
                  className="w-full bg-[#F9FAFB] border border-[#E5E7EB] px-3 py-2 text-xs rounded-lg focus:outline-none focus:border-[#0A0A0A] cursor-pointer" 
                />
                {transDocName && (
                  <p className="text-[10px] text-emerald-700 font-bold mt-1">✓ Attached: {transDocName}</p>
                )}
              </div>

              <div>
                <label className="block text-[#0A0A0A] font-bold text-[10px] uppercase tracking-wider mb-1">VIT Department</label>
                <input 
                  type="text" 
                  disabled 
                  value={transDept} 
                  className="w-full bg-[#F3F4F6] border border-[#E5E7EB] px-3 py-2 text-xs rounded-lg text-[#6B7280] cursor-not-allowed" 
                />
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
                <button type="button" onClick={() => setShowTransitionModal(false)} className="text-xs font-bold text-[#6B7280] hover:text-[#0A0A0A]">
                  Cancel
                </button>
                <Button variant="primary" size="sm" type="submit">
                  Submit Request
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export const StudentDashboard: React.FC<StudentDashboardProps> = (props) => {
  const { currentUser } = useAuth();
  if (!currentUser) return null;
  return <StudentDashboardContent {...props} studentProfile={currentUser as StudentProfile} />;
};

import React, { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import type { AlumniProfile, FacultyProfile, MentorshipGuidancePurpose } from '../../types';
import { getRequestTypeConfig } from '../../utils/relationshipHelper';
import {
  BookOpen,
  MessageSquare,
  Check,
  UserCheck,
  Sparkles,
  GraduationCap,
  Star,
  Clock,
  Sliders,
  CheckCheck,
  Send,
  Inbox,
  Lock,
  RefreshCw,
  AlertCircle,
  X
} from 'lucide-react';
import { Badge, Button, SegmentedTabs, Modal, ToastNotice } from '../../components/common/UIComponents';

interface MentorshipPageProps {
  selectedMentorForBooking?: AlumniProfile | FacultyProfile | any | null;
  initialSubTab?: 'find' | 'my-sent' | 'incoming' | 'requests';
  setActiveTab: (tab: string, subTab?: string) => void;
}

const AdminMentorshipGuardView: React.FC = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-300 font-sans text-xs">
      <div className="border-b border-[#E5E7EB] pb-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#0A0A0A] tracking-tight">
          Mentorship & Guidance Portal
        </h1>
        <p className="text-sm text-[#6B7280] font-medium mt-1">
          Peer-to-peer mentorship and research advisory relationships.
        </p>
      </div>

      <div className="bg-[#FAFAFA] text-[#0A0A0A] border border-[#E5E7EB] rounded-xl p-6 flex items-start gap-4">
        <div className="p-2.5 bg-[#F3F4F6] border border-[#E5E7EB] rounded-lg shrink-0">
          <Lock className="w-4 h-4 text-[#0A0A0A]" />
        </div>
        <div>
          <h2 className="font-bold text-xs uppercase tracking-wider text-[#0A0A0A] mb-1">
            Admin Role: Guidance & Advisory Access Restricted
          </h2>
          <p className="text-xs text-[#6B7280] font-medium leading-relaxed">
            Administrator accounts do not participate in or inspect peer mentorship requests directly. This is a deliberate
            institutional privacy constraint — 1-on-1 mentorship interactions between Students, Alumni, and Faculty are strictly private.
          </p>
          <p className="text-xs text-[#0A0A0A] font-medium mt-2 leading-relaxed">
            Institutional guidance performance metrics and conversion analytics are accessible in the{' '}
            <strong>Verification & Governance Console → Analytics</strong> tab.
          </p>
        </div>
      </div>
    </div>
  );
};

const StandardMentorshipPage: React.FC<MentorshipPageProps> = ({ selectedMentorForBooking, initialSubTab, setActiveTab }) => {
  const {
    alumniList,
    facultyList,
    mentorshipRequests,
    sendMentorshipRequest,
    updateMentorshipStatus,
    submitMentorshipFeedback
  } = useData();

  const { currentUser, currentRole } = useAuth();

  const isStudent = currentRole === 'student';
  const isFaculty = currentRole === 'faculty' || currentRole === 'teacher';
  const isAlumni = currentRole === 'alumni';

  const [activeSubTab, setActiveSubTab] = useState<'find' | 'my-sent' | 'incoming' | 'requests'>(
    initialSubTab || (selectedMentorForBooking ? 'find' : (isStudent ? 'find' : 'incoming'))
  );

  useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  const availableAlumniMentors = alumniList.filter(a => a.isMentoringAvailable && a.id !== currentUser.id);
  const availableFacultyMentors = facultyList.filter(f => f.id !== currentUser.id);

  const [selectedTargetUser, setSelectedTargetUser] = useState<AlumniProfile | FacultyProfile | any | null>(
    selectedMentorForBooking || null
  );

  const initialTargetRole = selectedMentorForBooking
    ? (selectedMentorForBooking.userType || ('graduationYear' in selectedMentorForBooking ? 'alumni' : 'faculty'))
    : 'alumni';

  const [mentorType, setMentorType] = useState<'alumni' | 'faculty'>(initialTargetRole);
  const [selectedMentorId, setSelectedMentorId] = useState<string>(
    selectedMentorForBooking ? selectedMentorForBooking.id : availableAlumniMentors[0]?.id || ''
  );
  const [isTargetLocked, setIsTargetLocked] = useState<boolean>(!!selectedMentorForBooking);

  useEffect(() => {
    if (selectedMentorForBooking) {
      setSelectedTargetUser(selectedMentorForBooking);
      const role = selectedMentorForBooking.userType || ('graduationYear' in selectedMentorForBooking ? 'alumni' : 'faculty');
      setMentorType(role);
      setSelectedMentorId(selectedMentorForBooking.id);
      setIsTargetLocked(true);
      setActiveSubTab('find');
    }
  }, [selectedMentorForBooking]);

  const requestConfig = getRequestTypeConfig(currentRole, mentorType);

  const [purposeOfRequest, setPurposeOfRequest] = useState<MentorshipGuidancePurpose>(
    requestConfig.purposeOptions[0] as MentorshipGuidancePurpose
  );
  const [areaOfGuidance, setAreaOfGuidance] = useState('');
  const [message, setMessage] = useState('');
  const [proposedDate, setProposedDate] = useState('');
  const [proposedTimeSlot, setProposedTimeSlot] = useState('');
  const [bookingSuccessMsg, setBookingSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (requestConfig.purposeOptions.length > 0 && !requestConfig.purposeOptions.includes(purposeOfRequest)) {
      setPurposeOfRequest(requestConfig.purposeOptions[0] as MentorshipGuidancePurpose);
    }
  }, [mentorType, requestConfig]);

  // Softened Decline Modal State
  const [declineModalReq, setDeclineModalReq] = useState<any | null>(null);
  const [declineReasonChip, setDeclineReasonChip] = useState<string>('Not available right now');
  const [customDeclineNote, setCustomDeclineNote] = useState<string>('');

  const selectedAlumniMentor = alumniList.find(a => a.id === selectedMentorId) || availableAlumniMentors[0];
  const selectedFacultyMentor = facultyList.find(f => f.id === selectedMentorId) || availableFacultyMentors[0];

  const handleSendRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetMember = isTargetLocked && selectedTargetUser
      ? selectedTargetUser
      : (mentorType === 'alumni' ? selectedAlumniMentor : selectedFacultyMentor);

    const targetMentorName = targetMember?.name || 'Selected Target Member';
    const targetMentorOrg = targetMember?.company || targetMember?.department || 'VIT Wadala';
    const targetMentorId = targetMember?.id || selectedMentorId;

    const isImmediateConnection =
      requestConfig.requestType === 'NETWORKING' ||
      requestConfig.requestType === 'COLLABORATION' ||
      currentRole !== 'student';

    sendMentorshipRequest({
      studentId: currentUser.id,
      studentName: currentUser.name,
      studentEmail: currentUser.email,
      studentDepartment: currentUser.department,
      studentYear: (currentUser as any).currentYear || 'BE',
      studentRole: currentUser.role,
      studentEnrollmentNo: (currentUser as any).enrollmentNo || (currentUser as any).prn || '22102A0042',
      mentorId: targetMentorId,
      mentorName: targetMentorName,
      mentorRole: mentorType,
      mentorCompanyOrDept: targetMentorOrg,
      purposeOfRequest,
      topic: areaOfGuidance || purposeOfRequest,
      areaOfGuidance: areaOfGuidance || `${requestConfig.requestType} request submitted via portal`,
      message: message || `Hello ${targetMentorName}, I would appreciate your guidance regarding ${purposeOfRequest}.`,
      requestType: requestConfig.requestType,
      proposedDate: proposedDate || undefined,
      proposedTimeSlot: proposedTimeSlot || undefined
    });

    setBookingSuccessMsg(
      isImmediateConnection
        ? `Direct Connection established with ${targetMentorName}! Messaging channel unlocked.`
        : `Guidance request transmitted to ${targetMentorName}! You will be notified upon confirmation.`
    );
    setTimeout(() => setBookingSuccessMsg(null), 4500);

    setMessage('');
    setAreaOfGuidance('');
    setProposedDate('');
    setProposedTimeSlot('');
    setIsTargetLocked(false);
    setSelectedTargetUser(null);
  };

  const handleDeclineWithNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!declineModalReq) return;

    const note = declineReasonChip === 'Custom note...'
      ? customDeclineNote || 'Declined by mentor.'
      : declineReasonChip;

    const res = updateMentorshipStatus(declineModalReq.id, 'Declined', note, currentRole);
    if (res.success) {
      setBookingSuccessMsg(`Mentorship request from ${declineModalReq.studentName} has been declined with note.`);
      setTimeout(() => setBookingSuccessMsg(null), 3500);
    } else {
      alert(`Role Error: ${res.error}`);
    }

    setDeclineModalReq(null);
    setCustomDeclineNote('');
  };

  const activeEstablishedConnections = mentorshipRequests.filter(
    r => (r.studentId === currentUser.id || r.mentorId === currentUser.id || r.studentName.includes(currentUser.name) || r.mentorName.includes(currentUser.name)) &&
         (r.status === 'Accepted' || r.status === 'Completed')
  );

  const mySentRequests = mentorshipRequests.filter(
    r => r.studentId === currentUser.id || r.studentName.toLowerCase().includes(currentUser.name.toLowerCase())
  );

  const myIncomingRequests = mentorshipRequests.filter(
    r => r.mentorId === currentUser.id || r.mentorName.toLowerCase().includes(currentUser.name.toLowerCase())
  );

  const pendingIncomingRequests = myIncomingRequests.filter(r => r.status === 'Pending');

  const subTabOptions = isStudent
    ? [
        { id: 'find' as const, label: 'Request Guidance', icon: <Send className="w-3.5 h-3.5" /> },
        { id: 'my-sent' as const, label: 'My Requests', count: mySentRequests.length, icon: <Inbox className="w-3.5 h-3.5" /> },
        { id: 'requests' as const, label: 'My Mentors', count: activeEstablishedConnections.length, icon: <UserCheck className="w-3.5 h-3.5" /> }
      ]
    : [
        { id: 'incoming' as const, label: 'Requests for You', count: pendingIncomingRequests.length, icon: <Sparkles className="w-3.5 h-3.5" /> },
        { id: 'requests' as const, label: 'My Mentees', count: activeEstablishedConnections.length, icon: <UserCheck className="w-3.5 h-3.5" /> },
        { id: 'find' as const, label: 'Offer to Mentor', icon: <Send className="w-3.5 h-3.5" /> },
        { id: 'my-sent' as const, label: 'My Outreach', count: mySentRequests.length, icon: <Inbox className="w-3.5 h-3.5" /> }
      ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-16 sm:pb-0 font-sans text-xs">
      
      {/* Header Banner */}
      <div className="border-b border-[#E5E7EB] pb-5">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#0A0A0A] tracking-tight flex items-center gap-2">
          <GraduationCap className="w-7 h-7 text-[#0A0A0A]" />
          {isStudent
            ? 'Find a Mentor'
            : 'Guidance & Mentorship'}
        </h1>
        <p className="text-sm text-[#6B7280] font-medium mt-1">
          {isStudent
            ? 'Connect with alumni and faculty for 1-on-1 guidance and professional introductions.'
            : isFaculty
            ? 'Review requests from students and manage your advisees and research collaborations.'
            : 'Review requests from students and manage the mentees you\'re guiding.'}
        </p>
      </div>

      <ToastNotice
        message={bookingSuccessMsg}
        onClose={() => setBookingSuccessMsg(null)}
        className="mb-4"
      />

      {/* Sub-Navigation Segmented Tabs */}
      <SegmentedTabs
        options={subTabOptions}
        activeTab={activeSubTab}
        onChange={(tab) => setActiveSubTab(tab)}
      />

      {/* TAB 1: REQUEST / OFFER GUIDANCE FORM */}
      {activeSubTab === 'find' && (
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 space-y-6 shadow-none">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E7EB] pb-4">
            <div>
              <h2 className="text-base font-bold text-[#0A0A0A]">
                {isStudent ? requestConfig.label : 'Offer Guidance & Mentorship'}
              </h2>
              <p className="text-xs text-[#6B7280] font-medium mt-0.5">
                {isStudent
                  ? requestConfig.description
                  : 'Proactively reach out to offer mentorship, research collaboration, or professional guidance.'}
              </p>
            </div>

            {!isTargetLocked && (
              <SegmentedTabs
                options={[
                  { id: 'alumni', label: 'Alumni Member' },
                  { id: 'faculty', label: 'Faculty Member' }
                ]}
                activeTab={mentorType}
                onChange={(t) => {
                  setMentorType(t as any);
                  if (t === 'alumni' && availableAlumniMentors[0]) setSelectedMentorId(availableAlumniMentors[0].id);
                  if (t === 'faculty' && availableFacultyMentors[0]) setSelectedMentorId(availableFacultyMentors[0].id);
                }}
              />
            )}
          </div>

          <form onSubmit={handleSendRequestSubmit} className="space-y-4">
            {isTargetLocked && selectedTargetUser ? (
              <div className="p-4 bg-[#FAFAFA] border border-[#E5E7EB] rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img src={selectedTargetUser.avatar} alt={selectedTargetUser.name} className="w-10 h-10 rounded-full object-cover border border-[#E5E7EB]" />
                  <div>
                    <Badge variant="indigo">TARGET MEMBER LOCKED</Badge>
                    <h3 className="font-bold text-[#0A0A0A] text-sm mt-0.5">{selectedTargetUser.name}</h3>
                    <p className="text-xs text-[#6B7280] font-medium">
                      {selectedTargetUser.company || selectedTargetUser.department}
                    </p>
                  </div>
                </div>
                <Button variant="secondary" size="sm" onClick={() => setIsTargetLocked(false)}>
                  Change Member
                </Button>
              </div>
            ) : (
              <div>
                <label className="app-label text-[#0A0A0A] font-bold">
                  Select Target {mentorType === 'alumni' ? 'Alumni' : 'Faculty'} Member
                </label>
                <select
                  value={selectedMentorId}
                  onChange={e => setSelectedMentorId(e.target.value)}
                  className="app-input w-full font-bold border-[#E5E7EB] rounded-lg bg-[#FAFAFA]"
                >
                  {mentorType === 'alumni'
                    ? availableAlumniMentors.map(a => (
                        <option key={a.id} value={a.id}>
                          {a.name} — {a.company} ({a.designation}) [{a.department}]
                        </option>
                      ))
                    : availableFacultyMentors.map(f => (
                        <option key={f.id} value={f.id}>
                          {f.name} — {f.designation} [{f.department}]
                        </option>
                      ))
                  }
                </select>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="app-label text-[#0A0A0A] font-bold">Primary Engagement Purpose</label>
                <select
                  value={purposeOfRequest}
                  onChange={e => setPurposeOfRequest(e.target.value as MentorshipGuidancePurpose)}
                  className="app-input w-full font-bold border-[#E5E7EB] rounded-lg bg-[#FAFAFA]"
                >
                  {requestConfig.purposeOptions.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="app-label text-[#0A0A0A] font-bold">Specific Domain / Topic</label>
                <input
                  type="text"
                  value={areaOfGuidance}
                  onChange={e => setAreaOfGuidance(e.target.value)}
                  placeholder="e.g. Distributed Consensus, Resume Review, Higher Ed Applications"
                  className="app-input w-full border-[#E5E7EB] rounded-lg bg-[#FAFAFA]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="app-label text-[#0A0A0A] font-bold">Proposed Meeting Date (Optional)</label>
                <input
                  type="date"
                  value={proposedDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={e => setProposedDate(e.target.value)}
                  className="app-input w-full border-[#E5E7EB] rounded-lg bg-[#FAFAFA]"
                />
              </div>

              <div>
                <label className="app-label text-[#0A0A0A] font-bold">Preferred Time Slot (Optional)</label>
                <select
                  value={proposedTimeSlot}
                  onChange={e => setProposedTimeSlot(e.target.value)}
                  className="app-input w-full font-bold border-[#E5E7EB] rounded-lg bg-[#FAFAFA]"
                >
                  <option value="">Flexible / Anytime</option>
                  <option value="Morning (9:00 AM - 12:00 PM)">Morning (9:00 AM - 12:00 PM)</option>
                  <option value="Afternoon (12:00 PM - 4:00 PM)">Afternoon (12:00 PM - 4:00 PM)</option>
                  <option value="Evening (4:00 PM - 8:00 PM)">Evening (4:00 PM - 8:00 PM)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="app-label text-[#0A0A0A] font-bold">Personal Message & Background Context</label>
              <textarea
                rows={4}
                required
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Introduce yourself, mention your branch, year, and specific questions..."
                className="app-input w-full border-[#E5E7EB] rounded-lg bg-[#FAFAFA]"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              icon={<Send className="w-4 h-4" />}
            >
              {isStudent ? requestConfig.label : 'Send Guidance Offer'}
            </Button>
          </form>
        </div>
      )}

      {/* TAB 2: SENT REQUESTS / OUTREACH */}
      {activeSubTab === 'my-sent' && (
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 space-y-4 shadow-none">
          <h2 className="font-bold text-[#0A0A0A] text-base">{isStudent ? 'My Requests' : 'My Sent Outreach'}</h2>
          <p className="text-xs text-[#6B7280] font-medium">
            {isStudent
              ? 'Track the status of your outgoing mentorship and guidance requests.'
              : 'History of outgoing mentorship offers and collaboration outreach.'}
          </p>

          {mySentRequests.length === 0 ? (
            <p className="text-[#9CA3AF] font-medium py-6 italic text-center">
              {isStudent ? 'No requests sent yet.' : 'No sent outreach yet.'}
            </p>
          ) : (
            <div className="space-y-3">
              {mySentRequests.map(req => (
                <div key={req.id} className="p-4 bg-[#FAFAFA] border border-[#E5E7EB] rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <Badge variant={req.status === 'Accepted' ? 'emerald' : req.status === 'Declined' ? 'rose' : 'indigo'}>
                        {req.status}
                      </Badge>
                      <h3 className="font-bold text-[#0A0A0A] text-sm mt-1">To: {req.mentorName}</h3>
                    </div>
                    <span className="font-mono text-[#9CA3AF] text-[10px]">{req.requestedDate}</span>
                  </div>

                  {(req.proposedDate || req.proposedTimeSlot) && (
                    <p className="text-xs font-mono font-bold text-[#0A0A0A]">
                      Proposed Time: {req.proposedDate || 'Flexible'} ({req.proposedTimeSlot || 'Anytime'})
                    </p>
                  )}

                  <p className="text-xs text-[#374151] font-medium">"{req.message}"</p>

                  {req.status === 'Declined' && (
                    <div className="pt-2 border-t border-[#E5E7EB] flex items-center justify-between">
                      <span className="text-xs text-rose-700 font-medium">
                        Decline note: {req.declineReason || 'Bandwidth constraints'}
                      </span>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          setSelectedMentorId(req.mentorId);
                          setPurposeOfRequest(req.purposeOfRequest);
                          setAreaOfGuidance(req.areaOfGuidance || '');
                          setMessage(`Resubmitting request with updated timing proposal to ${req.mentorName}.`);
                          setActiveSubTab('find');
                        }}
                      >
                        Re-propose Date/Time
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: INCOMING REQUESTS FOR YOU */}
      {activeSubTab === 'incoming' && (
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 space-y-4 shadow-none">
          <h2 className="font-bold text-[#0A0A0A] text-base">Requests for You</h2>
          <p className="text-xs text-[#6B7280] font-medium">Review and respond to incoming guidance and mentorship requests from students or peers.</p>

          {pendingIncomingRequests.length === 0 ? (
            <p className="text-[#9CA3AF] font-medium py-6 italic text-center">No pending requests for you at this time.</p>
          ) : (
            <div className="space-y-3">
              {pendingIncomingRequests.map(req => (
                <div key={req.id} className="p-5 bg-[#FAFAFA] border border-[#E5E7EB] rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Badge variant="indigo">{req.purposeOfRequest}</Badge>
                      <h3 className="font-bold text-[#0A0A0A] text-sm mt-1">From: {req.studentName} ({req.studentDepartment})</h3>
                      <p className="text-xs text-[#6B7280] font-medium">{req.studentEmail} • PRN: {req.studentEnrollmentNo}</p>
                    </div>
                    <Badge variant="indigo">14-day Auto Expiry</Badge>
                  </div>
                  <p className="text-xs text-[#374151] bg-white p-3 rounded-lg border border-[#E5E7EB] font-medium">
                    "{req.message}"
                  </p>
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setDeclineModalReq(req)}
                    >
                      Decline Request
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        updateMentorshipStatus(req.id, 'Accepted', 'Accepted by mentor.', currentRole);
                        setBookingSuccessMsg(`Request accepted! NexaChats unlocked with ${req.studentName}.`);
                        setTimeout(() => setBookingSuccessMsg(null), 3500);
                      }}
                    >
                      Accept Guidance Request
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: ESTABLISHED CONNECTIONS (MY MENTORS / MY MENTEES) */}
      {activeSubTab === 'requests' && (
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 space-y-4 shadow-none">
          <h2 className="font-bold text-[#0A0A0A] text-base">{isStudent ? 'My Mentors' : 'My Mentees & Connections'}</h2>
          <p className="text-xs text-[#6B7280] font-medium">
            {isStudent
              ? 'Active mentorship connections with alumni and faculty advisors.'
              : 'Active mentees and guidance relationships.'}
          </p>

          {activeEstablishedConnections.length === 0 ? (
            <p className="text-[#9CA3AF] font-medium py-6 italic text-center">
              {isStudent ? 'No active mentor connections established yet.' : 'No active mentee connections established yet.'}
            </p>
          ) : (
            <div className="space-y-3">
              {activeEstablishedConnections.map(req => (
                <div key={req.id} className="p-4 bg-[#FAFAFA] border border-[#E5E7EB] rounded-xl flex items-center justify-between">
                  <div>
                    <Badge variant="emerald">{req.status}</Badge>
                    <h3 className="font-bold text-[#0A0A0A] text-sm mt-1">{req.studentName} ↔ {req.mentorName}</h3>
                    <p className="text-xs text-[#6B7280] font-medium">Topic: {req.purposeOfRequest}</p>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setActiveTab('messaging')}
                  >
                    Open NexaChats
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Decline Reason Modal */}
      <Modal
        isOpen={!!declineModalReq}
        onClose={() => setDeclineModalReq(null)}
        title="Decline Guidance Request"
        maxWidth="sm"
      >
        {declineModalReq && (
          <div className="space-y-4 font-sans text-xs">
            <p className="text-xs text-[#6B7280]">
              Provide a brief respectful note to <strong>{declineModalReq.studentName}</strong>:
            </p>

            <div className="space-y-2">
              {[
                'Not available right now',
                'Outside my domain of expertise',
                'Maximum mentorship bandwidth reached',
                'Custom note...'
              ].map(reason => (
                <button
                  key={reason}
                  type="button"
                  onClick={() => setDeclineReasonChip(reason)}
                  className={`w-full p-2.5 rounded-lg text-left text-xs font-medium border transition-colors cursor-pointer ${
                    declineReasonChip === reason
                      ? 'bg-[#0A0A0A] text-white border-[#0A0A0A]'
                      : 'bg-[#FAFAFA] text-[#374151] border-[#E5E7EB] hover:bg-[#F3F4F6]'
                  }`}
                >
                  {reason}
                </button>
              ))}

              {declineReasonChip === 'Custom note...' && (
                <textarea
                  rows={3}
                  value={customDeclineNote}
                  onChange={e => setCustomDeclineNote(e.target.value)}
                  placeholder="Enter a brief note..."
                  className="app-input w-full text-xs mt-2 border-[#E5E7EB] rounded-lg"
                />
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E5E7EB]">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setDeclineModalReq(null)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleDeclineWithNote}
              >
                Confirm Decline
              </Button>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
};

export const MentorshipPage: React.FC<MentorshipPageProps> = (props) => {
  const { currentRole } = useAuth();
  if (currentRole === 'admin') {
    return <AdminMentorshipGuardView />;
  }
  return <StandardMentorshipPage {...props} />;
};

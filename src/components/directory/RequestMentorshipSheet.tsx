import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Clock, FileText, CheckCircle2, AlertCircle, Search, UserCheck, Plus, Trash2, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { Avatar } from '../../utils/avatarHelper';
import { AnimatedCheckIcon, Button } from '../common/UIComponents';
import type { MentorshipGuidancePurpose, StudentProfile } from '../../types';

export interface TargetMentorInfo {
  id: string;
  name: string;
  userType?: string;
  role?: string;
  company?: string;
  department?: string;
  avatarUrl?: string;
  availableSlots?: number;
}

export interface RequestMentorshipSheetProps {
  isOpen: boolean;
  onClose: () => void;
  targetUser?: TargetMentorInfo | null;
  onSuccess?: () => void;
}

const PURPOSES: MentorshipGuidancePurpose[] = [
  'Career Guidance',
  'Higher Education',
  'Placement Preparation',
  'Research Collaboration',
  'Industry Interaction',
  'Technical Discussions',
  'Project Guidance'
];

export const RequestMentorshipSheet: React.FC<RequestMentorshipSheetProps> = ({
  isOpen,
  onClose,
  targetUser: initialTargetUser,
  onSuccess,
}) => {
  const { currentUser } = useAuth();
  const { sendMentorshipRequest, mentorshipRequests, alumniList, facultyList } = useData();
  const student = currentUser as StudentProfile;

  const [selectedMentor, setSelectedMentor] = useState<TargetMentorInfo | null>(initialTargetUser || null);
  const [step, setStep] = useState<1 | 2>(initialTargetUser ? 2 : 1);
  const [mentorSearch, setMentorSearch] = useState('');

  const [purpose, setPurpose] = useState<MentorshipGuidancePurpose>('Career Guidance');
  const [topic, setTopic] = useState('');
  const [notes, setNotes] = useState('');
  const [slots, setSlots] = useState<string[]>([
    'Weekday evening (6:00 PM – 8:00 PM IST)',
    'Weekend morning (10:00 AM – 12:00 PM IST)'
  ]);
  const [shareProfile, setShareProfile] = useState(true);
  const [includeResume, setIncludeResume] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (initialTargetUser) {
      setSelectedMentor(initialTargetUser);
      setStep(2);
    } else {
      setSelectedMentor(null);
      setStep(1);
    }
    setErrorMsg(null);
  }, [initialTargetUser, isOpen]);

  // Candidate mentors with open slots
  const allMentors: TargetMentorInfo[] = React.useMemo(() => {
    const alumniMentors: TargetMentorInfo[] = alumniList
      .filter(a => a.id !== currentUser.id && a.isMentoringAvailable)
      .map(a => ({
        id: a.id,
        name: a.name,
        userType: 'alumni',
        role: a.designation || 'Alumni Mentor',
        company: a.company || 'Alumni',
        department: a.department || 'Engineering',
        avatarUrl: a.avatar || '',
        availableSlots: (a as any).mentorshipSlots || 3
      }));

    const facultyMentors: TargetMentorInfo[] = facultyList
      .filter(f => f.id !== currentUser.id)
      .map(f => ({
        id: f.id,
        name: f.name,
        userType: 'faculty',
        role: f.designation || 'Faculty Mentor',
        company: 'Vidyalankar Institute of Technology',
        department: f.department || 'CMPN',
        avatarUrl: f.avatar || '',
        availableSlots: 4
      }));

    return [...alumniMentors, ...facultyMentors];
  }, [alumniList, facultyList, currentUser.id]);

  const filteredMentors = React.useMemo(() => {
    if (!mentorSearch.trim()) return allMentors;
    const q = mentorSearch.toLowerCase();
    return allMentors.filter(
      m => m.name.toLowerCase().includes(q) ||
           (m.company && m.company.toLowerCase().includes(q)) ||
           (m.department && m.department.toLowerCase().includes(q)) ||
           (m.role && m.role.toLowerCase().includes(q))
    );
  }, [allMentors, mentorSearch]);

  // Check pending requests limit (Max 3)
  const myPendingRequests = mentorshipRequests.filter(
    r => r.studentId === currentUser.id && r.status === 'Pending'
  );
  const hasReachedPendingLimit = myPendingRequests.length >= 3;

  // Check if a request already exists with the selected mentor
  const existingPendingWithSelected = selectedMentor
    ? mentorshipRequests.find(
        r => r.mentorId === selectedMentor.id &&
             r.studentId === currentUser.id &&
             (r.status === 'Pending' || r.status === 'Accepted')
      )
    : null;

  const handleAddSlot = () => {
    if (slots.length < 3) {
      setSlots([...slots, 'Weekday afternoon (2:00 PM – 4:00 PM IST)']);
    }
  };

  const handleRemoveSlot = (index: number) => {
    if (slots.length > 1) {
      setSlots(slots.filter((_, i) => i !== index));
    }
  };

  const handleSlotChange = (index: number, value: string) => {
    const updated = [...slots];
    updated[index] = value;
    setSlots(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMentor) {
      setErrorMsg('Please select a mentor.');
      return;
    }
    if (hasReachedPendingLimit) {
      setErrorMsg('You have 3 pending requests. Wait for a response before requesting another mentor.');
      return;
    }
    if (existingPendingWithSelected) {
      setErrorMsg('You already have an active or pending mentorship request with this mentor.');
      return;
    }
    if (!topic.trim()) {
      setErrorMsg('Please provide a specific topic or objective.');
      return;
    }
    if (notes.trim().length < 40) {
      setErrorMsg('Please write at least 40 characters explaining what you hope to learn.');
      return;
    }
    const validSlots = slots.map(s => s.trim()).filter(Boolean);
    if (validSlots.length === 0) {
      setErrorMsg('Please propose at least one preferred time slot.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const messageBody = `${notes.trim()}\n\nProposed timeslots:\n${validSlots.map((s, idx) => `${idx + 1}. ${s}`).join('\n')}${
        includeResume && student?.resumeUrl ? '\n\nResume attached from student profile.' : ''
      }`;

      sendMentorshipRequest({
        studentId: currentUser.id,
        studentName: currentUser.name,
        studentEmail: currentUser.email,
        studentDepartment: currentUser.department,
        studentYear: student?.currentYear || 'BE',
        studentEnrollmentNo: student?.prn || '2026VIT001',
        mentorId: selectedMentor.id,
        mentorName: selectedMentor.name,
        mentorRole: (selectedMentor.userType || selectedMentor.role || 'alumni') as any,
        mentorCompanyOrDept: selectedMentor.company || selectedMentor.department || 'VIT Wadala',
        purposeOfRequest: purpose,
        areaOfGuidance: topic || purpose,
        topic: topic.slice(0, 80) || purpose,
        message: messageBody,
        slots: validSlots.map(s => ({ date: 'Proposed', timeSlot: s }))
      });

      setIsSubmitting(false);
      setIsSuccess(true);
      if (onSuccess) onSuccess();

      setTimeout(() => {
        setIsSuccess(false);
        onClose();
        setTopic('');
        setNotes('');
        setStep(initialTargetUser ? 2 : 1);
      }, 1600);
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMsg(err?.message || 'Failed to submit mentorship request. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#0A0A0A]/40 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="bg-white w-full max-w-lg rounded-t-2xl sm:rounded-2xl border border-[#E5E7EB] shadow-xl overflow-hidden flex flex-col max-h-[90vh]"
          role="dialog"
          aria-labelledby="request-mentorship-title"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-[#E5E7EB] flex items-center justify-between shrink-0 bg-white">
            <div className="flex items-center gap-2">
              {step === 2 && !initialTargetUser && (
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="p-1 -ml-1 text-[#6B7280] hover:text-[#0A0A0A] rounded-lg transition-colors cursor-pointer"
                  title="Back to mentor selection"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
              )}
              <div>
                <h2 id="request-mentorship-title" className="text-sm font-bold text-[#0A0A0A]">
                  Request mentorship
                </h2>
                <p className="text-[11px] text-[#6B7280] mt-0.5">
                  {step === 1
                    ? 'Step 1 of 2: Choose a mentor'
                    : selectedMentor
                    ? `Step 2 of 2: Details for ${selectedMentor.name}`
                    : 'Step 2 of 2: Provide request details'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#6B7280] hover:text-[#0A0A0A] hover:bg-[#F3F4F6] transition-colors cursor-pointer"
              aria-label="Close dialog"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form / Content */}
          {isSuccess ? (
            <div className="p-8 text-center space-y-3 flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-[#ECFDF5] border border-[#A7F3D0] flex items-center justify-center text-[#065F46]">
                <AnimatedCheckIcon size={24} />
              </div>
              <h3 className="text-sm font-bold text-[#0A0A0A]">Request transmitted</h3>
              <p className="text-xs text-[#6B7280] max-w-sm">
                {selectedMentor?.name || 'Your mentor'} usually responds within a few days. You will receive an in-app and email notification when approved.
              </p>
            </div>
          ) : step === 1 ? (
            /* STEP 1: CHOOSE A MENTOR */
            <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
              <div className="relative">
                <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search mentors by name, company, or domain..."
                  value={mentorSearch}
                  onChange={e => setMentorSearch(e.target.value)}
                  className="w-full h-9 pl-9 pr-3 text-xs bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg text-[#0A0A0A] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#0A0A0A]"
                />
              </div>

              <div className="space-y-2 divide-y divide-[#E5E7EB]">
                {filteredMentors.length === 0 ? (
                  <div className="py-8 text-center text-[#6B7280]">
                    <p className="font-medium text-xs text-[#0A0A0A]">No mentors found</p>
                    <p className="text-[11px] mt-1">Try a different search keyword or browse the full Directory.</p>
                  </div>
                ) : (
                  filteredMentors.map(m => (
                    <div
                      key={m.id}
                      onClick={() => {
                        setSelectedMentor(m);
                        setStep(2);
                      }}
                      className="pt-2.5 first:pt-0 pb-2.5 flex items-center justify-between gap-3 group hover:bg-[#F9FAFB] p-2 rounded-xl cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar src={m.avatarUrl} name={m.name} size={36} className="border border-[#E5E7EB] shrink-0" />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h4 className="font-semibold text-xs text-[#0A0A0A] truncate">{m.name}</h4>
                            <span className="px-1.5 py-0.2 bg-[#F3F4F6] text-[#6B7280] text-[10px] rounded font-medium capitalize">
                              {m.userType}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#6B7280] truncate mt-0.5">
                            {m.role} {m.company ? `· ${m.company}` : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[11px] text-[#6B7280] font-medium hidden sm:inline">
                          {m.availableSlots} open slots
                        </span>
                        <Button variant="secondary" size="sm">Select</Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            /* STEP 2: REQUEST DETAILS */
            <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1 text-xs custom-scrollbar">
              {/* Limit banner */}
              {hasReachedPendingLimit && (
                <div className="p-3 bg-[#FEF3C7] border border-[#FDE68A] text-[#92400E] rounded-xl flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#B45309]" />
                  <div>
                    <p className="font-semibold text-xs">Pending request limit reached</p>
                    <p className="text-[11px] mt-0.5 leading-relaxed">
                      You currently have 3 pending requests. Please wait for a response or withdraw an older request before contacting another mentor.
                    </p>
                  </div>
                </div>
              )}

              {/* Selected Mentor Chip */}
              {selectedMentor && (
                <div className="p-3 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Avatar src={selectedMentor.avatarUrl} name={selectedMentor.name} size={32} className="border border-[#E5E7EB] shrink-0" />
                    <div className="min-w-0">
                      <p className="font-semibold text-xs text-[#0A0A0A] truncate">{selectedMentor.name}</p>
                      <p className="text-[11px] text-[#6B7280] truncate">{selectedMentor.role} · {selectedMentor.company || selectedMentor.department}</p>
                    </div>
                  </div>
                  {!initialTargetUser && (
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="text-[11px] text-[#6B7280] hover:text-[#0A0A0A] font-medium underline shrink-0 cursor-pointer"
                    >
                      Change
                    </button>
                  )}
                </div>
              )}

              {errorMsg && (
                <div className="p-3 bg-[#FEE2E2] border border-[#FECACA] text-[#991B1B] rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-[#991B1B]" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Purpose Selection */}
              <div>
                <label className="block text-xs font-semibold text-[#0A0A0A] mb-1.5">
                  Mentorship purpose
                </label>
                <select
                  value={purpose}
                  onChange={e => setPurpose(e.target.value as MentorshipGuidancePurpose)}
                  className="w-full h-9 px-3 rounded-lg border border-[#E5E7EB] bg-white text-xs font-medium text-[#0A0A0A] focus:outline-none focus:border-[#0A0A0A]"
                >
                  {PURPOSES.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              {/* Topic / Objective (max 80) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-[#0A0A0A]">
                    Topic or specific goal
                  </label>
                  <span className="text-[10px] text-[#6B7280] tabular-nums">
                    {topic.length}/80
                  </span>
                </div>
                <input
                  type="text"
                  maxLength={80}
                  placeholder="e.g., Transitioning to Product Management or System Design interview tips"
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-[#E5E7EB] text-xs text-[#0A0A0A] placeholder-[#9CA3AF] focus:outline-none focus:border-[#0A0A0A]"
                />
              </div>

              {/* Message / Introduction (40 - 500) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-[#0A0A0A]">
                    Message & context (min 40 characters)
                  </label>
                  <span className={`text-[10px] tabular-nums ${notes.length < 40 && notes.length > 0 ? 'text-[#991B1B] font-semibold' : 'text-[#6B7280]'}`}>
                    {notes.length}/500 {notes.length < 40 && notes.length > 0 ? `(${40 - notes.length} more needed)` : ''}
                  </span>
                </div>
                <textarea
                  rows={3}
                  maxLength={500}
                  placeholder="Introduce yourself, your academic background, and what specific guidance you are hoping to receive..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-[#E5E7EB] text-xs text-[#0A0A0A] placeholder-[#9CA3AF] focus:outline-none focus:border-[#0A0A0A] resize-none leading-relaxed"
                  required
                />
              </div>

              {/* Proposed Time Slots (1-3) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[#0A0A0A]">
                    Proposed availability in IST (up to 3 options)
                  </label>
                  {slots.length < 3 && (
                    <button
                      type="button"
                      onClick={handleAddSlot}
                      className="text-[11px] text-[#0A0A0A] hover:underline font-medium flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add slot</span>
                    </button>
                  )}
                </div>

                <div className="space-y-1.5">
                  {slots.map((slot, index) => (
                    <div key={index} className="flex items-center gap-2 border border-[#E5E7EB] rounded-lg px-3 py-1.5 bg-[#F9FAFB]">
                      <Clock className="w-3.5 h-3.5 text-[#6B7280] shrink-0" />
                      <input
                        type="text"
                        value={slot}
                        onChange={e => handleSlotChange(index, e.target.value)}
                        className="bg-transparent w-full text-xs text-[#0A0A0A] focus:outline-none"
                        placeholder={`Slot ${index + 1} (e.g. Saturday 11:00 AM IST)`}
                      />
                      {slots.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveSlot(index)}
                          className="p-1 text-[#9CA3AF] hover:text-[#991B1B] rounded cursor-pointer"
                          title="Remove option"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-2 pt-1 border-t border-[#E5E7EB]">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={shareProfile}
                    onChange={e => setShareProfile(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-[#E5E7EB] text-[#0A0A0A] focus:ring-0 cursor-pointer"
                  />
                  <span className="text-xs text-[#0A0A0A]">
                    Share my verified NexaLink student profile
                  </span>
                </label>

                {student?.resumeUrl && (
                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={includeResume}
                      onChange={e => setIncludeResume(e.target.checked)}
                      className="w-3.5 h-3.5 rounded border-[#E5E7EB] text-[#0A0A0A] focus:ring-0 cursor-pointer"
                    />
                    <span className="text-xs text-[#0A0A0A] flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-[#6B7280]" />
                      Attach profile resume ({student.name}_Resume.pdf)
                    </span>
                  </label>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E5E7EB]">
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={isSubmitting || hasReachedPendingLimit || !!existingPendingWithSelected || notes.trim().length < 40}
                >
                  {isSubmitting ? 'Sending...' : 'Send request'}
                </Button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

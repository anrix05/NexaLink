import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  X,
  CheckCircle2,
  MessageSquare,
  GraduationCap,
  Clock,
  Mail,
  Copy,
  Check,
  ChevronDown,
  Sparkles,
  Edit3,
} from 'lucide-react';
import { Avatar } from '../../utils/avatarHelper';
import { StatusBadge } from '../ui/StatusBadge';
import { Button } from '../common/UIComponents';
import { getRoleSpecificFields } from '../../utils/roleProfileHelper';
import { calculateAlumniMatch, calculateFacultyMatch } from '../../utils/recommendationEngine';
import { redactUserPrivacyFields } from '../../utils/privacyGuard';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import type { AlumniProfile, FacultyProfile, StudentProfile } from '../../types';
import { getUserEmails } from '../../utils/userEmails';

export interface MemberProfilePanelProps {
  user: AlumniProfile | FacultyProfile | any;
  onClose: () => void;
  onRequestMentorship: (user: any) => void;
  onMessage: (user: any) => void;
  onEditProfile?: () => void;
}

export const MemberProfilePanel: React.FC<MemberProfilePanelProps> = ({
  user,
  onClose,
  onRequestMentorship,
  onMessage,
  onEditProfile,
}) => {
  const { currentUser, currentRole } = useAuth();
  const { mentorshipRequests } = useData();
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [showAllSkills, setShowAllSkills] = useState(false);

  // Redact privacy fields per user settings
  const safeUser = redactUserPrivacyFields(user, currentUser) as any;
  const role = safeUser.userType || safeUser.role || 'alumni';
  const isOwnProfile = currentUser && currentUser.id === safeUser.id;

  // Check mentorship request state
  const pendingRequest = mentorshipRequests.find(
    r => r.mentorId === safeUser.id && (r.studentId === currentUser?.id || r.studentName === currentUser?.name) && r.status === 'Pending'
  );
  const acceptedRequest = mentorshipRequests.find(
    r => r.mentorId === safeUser.id && (r.studentId === currentUser?.id || r.studentName === currentUser?.name) && r.status === 'Accepted'
  );

  const isAcceptingMentees = safeUser.isMentoringAvailable !== false;
  const activeSlots = safeUser.activeMenteesCount || 1;
  const maxSlots = safeUser.maxMentees || 4;

  // Role-specific fields
  const fields = getRoleSpecificFields(safeUser);

  // Match reasons (for student viewers)
  let matchReasons: string[] = [];
  if (currentRole === 'student' && currentUser) {
    if (role === 'alumni') {
      const match = calculateAlumniMatch(currentUser as StudentProfile, safeUser as AlumniProfile);
      matchReasons = match.matchReasons;
    } else if (role === 'faculty') {
      const match = calculateFacultyMatch(currentUser as StudentProfile, safeUser as FacultyProfile);
      matchReasons = match.matchReasons;
    }
  }

  // Real bio filter (ignore automated filler)
  const rawBio = safeUser.bio?.trim() || '';
  const isFillerBio = rawBio.toLowerCase().includes('distinguished member of the') || rawBio.length === 0;

  // Handle email copy
  const handleCopyEmail = (emailStr: string) => {
    navigator.clipboard.writeText(emailStr);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const userEmails = getUserEmails(safeUser);
  const visibleEmail = userEmails.displayEmail;
  const showEmail = safeUser.privacySettings?.email !== 'private' && visibleEmail && !visibleEmail.includes('@private.hidden');

  return (
    <div className="flex flex-col h-full bg-white text-[#0A0A0A] font-sans">
      {/* Sticky Top Header */}
      <div className="p-6 border-b border-[#E5E7EB] flex items-start justify-between gap-4 shrink-0 bg-white">
        <div className="flex items-start gap-4 min-w-0">
          <Avatar
            src={safeUser.avatar}
            name={safeUser.name}
            size={72}
            className="w-[72px] h-[72px] shrink-0"
          />
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold font-display text-[#0A0A0A] tracking-tight truncate">
                {safeUser.name}
              </h2>
              <StatusBadge
                label={role === 'faculty' ? 'Faculty' : role === 'alumni' ? 'Alumni' : 'Student'}
                tone="indigo"
                size="sm"
              />
            </div>

            <p className="text-xs text-[#6B7280] font-normal truncate">
              {safeUser.designation
                ? `${safeUser.designation} · ${safeUser.company || safeUser.department}`
                : safeUser.company || safeUser.department}
            </p>

            <div className="inline-flex items-center gap-1.5 text-xs text-[#065F46] font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>Verified member</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-lg text-[#6B7280] hover:text-[#0A0A0A] hover:bg-[#F3F4F6] transition-colors cursor-pointer shrink-0"
          aria-label="Close panel"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Scrollable Content Canvas */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6 text-xs">
        {/* 1. About / Bio (Real bio only; hidden if empty or filler) */}
        {!isFillerBio && (
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-[#0A0A0A] uppercase tracking-wider text-[11px] text-[#6B7280]">
              About
            </h3>
            <p className="text-xs leading-relaxed text-[#374151]">
              {rawBio}
            </p>
          </div>
        )}

        {/* 2. Role-specific Information (Clean Definition List) */}
        {fields.length > 0 && (
          <div className="space-y-3 pt-2 border-t border-[#E5E7EB]">
            <h3 className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">
              {role === 'faculty' ? 'Academic & research profile' : role === 'alumni' ? 'Professional background' : 'Academic profile'}
            </h3>
            <dl className="grid grid-cols-1 gap-2.5">
              {fields.map(item => (
                <div key={item.label} className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 py-1 border-b border-[#F3F4F6]">
                  <dt className="text-xs text-[#6B7280] font-normal">{item.label}</dt>
                  <dd className="text-xs font-semibold text-[#0A0A0A] text-left sm:text-right">{item.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}

        {/* 3. Skills and Expertise (Inter font, hairline pills, no mono) */}
        {safeUser.skills && safeUser.skills.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-[#E5E7EB]">
            <div className="flex items-center justify-between">
              <h3 className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">
                Skills & expertise
              </h3>
              {safeUser.skills.length > 8 && (
                <button
                  type="button"
                  onClick={() => setShowAllSkills(!showAllSkills)}
                  className="text-[11px] text-[#6B7280] hover:text-[#0A0A0A] font-medium"
                >
                  {showAllSkills ? 'Show fewer' : `+${safeUser.skills.length - 8} more`}
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {(showAllSkills ? safeUser.skills : safeUser.skills.slice(0, 8)).map((s: string) => (
                <span
                  key={s}
                  className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-[#FAFAFA] text-[#0A0A0A] border border-[#E5E7EB]"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 4. Mentorship Status (Neutral capacity meter) */}
        {(role === 'alumni' || role === 'faculty') && (
          <div className="space-y-2 pt-2 border-t border-[#E5E7EB]">
            <h3 className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">
              Mentorship availability
            </h3>
            <div className="p-3.5 bg-[#FAFAFA] border border-[#E5E7EB] rounded-xl flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-[#0A0A0A]">
                  {isAcceptingMentees ? 'Accepting mentees' : 'Not accepting mentees right now'}
                </p>
                <p className="text-[11px] text-[#6B7280] mt-0.5">
                  {isAcceptingMentees
                    ? `${activeSlots} of ${maxSlots} slots filled`
                    : 'Currently at full capacity for the semester'}
                </p>
              </div>
              <div className="flex items-center gap-1">
                {Array.from({ length: maxSlots }).map((_, idx) => (
                  <span
                    key={idx}
                    className={`w-2 h-4 rounded-xs ${
                      idx < activeSlots ? 'bg-[#0A0A0A]' : 'bg-[#E5E7EB]'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 5. Why You Might Connect (Students only, genuine reasons) */}
        {matchReasons.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-[#E5E7EB]">
            <h3 className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#0A0A0A]" />
              Why you might connect
            </h3>
            <div className="space-y-1.5">
              {matchReasons.map(r => (
                <div key={r} className="flex items-center gap-2 text-xs text-[#0A0A0A]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0A0A0A] shrink-0" />
                  <span>{r}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 6. Contact Information (Server-filtered) */}
        <div className="space-y-2 pt-2 border-t border-[#E5E7EB]">
          <h3 className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">
            Contact
          </h3>
          <p className="text-xs text-[#6B7280]">
            Direct messaging on NexaLink is the preferred contact channel.
          </p>

          {showEmail && (
            <div className="flex items-center justify-between p-3 bg-[#FAFAFA] border border-[#E5E7EB] rounded-lg mt-2">
              <div className="flex items-center gap-2 truncate">
                <Mail className="w-3.5 h-3.5 text-[#6B7280] shrink-0" />
                <span className="text-xs text-[#0A0A0A] truncate">{visibleEmail}</span>
              </div>
              <button
                type="button"
                onClick={() => handleCopyEmail(visibleEmail)}
                className="p-1 text-[#6B7280] hover:text-[#0A0A0A] transition-colors"
                title="Copy email"
              >
                {copiedEmail ? <Check className="w-3.5 h-3.5 text-[#065F46]" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Sticky Bottom Action Bar Matrix */}
      <div className="p-4 border-t border-[#E5E7EB] bg-white shrink-0 flex items-center gap-3">
        {isOwnProfile ? (
          <Button
            variant="primary"
            size="md"
            className="w-full"
            onClick={onEditProfile}
            icon={<Edit3 className="w-4 h-4" />}
          >
            Edit profile
          </Button>
        ) : currentRole === 'student' && (role === 'alumni' || role === 'faculty') ? (
          acceptedRequest ? (
            <>
              <Button
                variant="primary"
                size="md"
                className="flex-1"
                onClick={() => onMessage(safeUser)}
                icon={<MessageSquare className="w-4 h-4" />}
              >
                Open conversation
              </Button>
              <Button
                variant="secondary"
                size="md"
                onClick={() => onRequestMentorship(safeUser)}
                icon={<GraduationCap className="w-4 h-4" />}
              >
                View mentorship
              </Button>
            </>
          ) : pendingRequest ? (
            <>
              <button
                type="button"
                disabled
                className="flex-1 h-10 px-4 rounded-lg bg-[#FEF3C7] border border-[#FDE68A] text-[#B45309] font-medium text-xs flex items-center justify-center gap-2 cursor-not-allowed"
              >
                <Clock className="w-4 h-4" />
                <span>Request pending</span>
              </button>
              <Button
                variant="secondary"
                size="md"
                onClick={() => onMessage(safeUser)}
                icon={<MessageSquare className="w-4 h-4" />}
              >
                Message
              </Button>
            </>
          ) : isAcceptingMentees ? (
            <>
              <Button
                variant="primary"
                size="md"
                className="flex-1"
                onClick={() => onRequestMentorship(safeUser)}
                icon={<GraduationCap className="w-4 h-4" />}
              >
                Request mentorship
              </Button>
              <Button
                variant="secondary"
                size="md"
                onClick={() => onMessage(safeUser)}
                icon={<MessageSquare className="w-4 h-4" />}
              >
                Message
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="primary"
                size="md"
                className="flex-1"
                onClick={() => onMessage(safeUser)}
                icon={<MessageSquare className="w-4 h-4" />}
              >
                Message
              </Button>
              <span className="text-[11px] text-[#6B7280] italic px-2">
                Not accepting mentees
              </span>
            </>
          )
        ) : (
          <Button
            variant="primary"
            size="md"
            className="w-full"
            onClick={() => onMessage(safeUser)}
            icon={<MessageSquare className="w-4 h-4" />}
          >
            Message
          </Button>
        )}
      </div>
    </div>
  );
};

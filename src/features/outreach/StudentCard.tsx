// ============================================================================
// NEXALINK V2.8: Student Card Component
// ============================================================================

import React, { useMemo } from 'react';
import { UserCheck, Clock, Check } from 'lucide-react';
import type { DiscoverableStudent } from './types';

interface StudentCardProps {
  student: DiscoverableStudent;
  viewerRole: string;
  viewerDept: string;
  onInvite: (student: DiscoverableStudent) => void;
  onCardClick?: (student: DiscoverableStudent) => void;
}

export const StudentCard: React.FC<StudentCardProps> = ({
  student,
  viewerRole,
  viewerDept,
  onInvite,
  onCardClick
}) => {
  const isFacultyOwnDept = (viewerRole === 'faculty' || viewerRole === 'teacher') && student.department === viewerDept;

  // Initials generation for privacy-safe initials avatar
  const initials = useMemo(() => {
    const parts = student.name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return student.name.slice(0, 2).toUpperCase();
  }, [student.name]);

  // Skill chips: max 2 lines with +N indicator
  const visibleSkills = useMemo(() => {
    return student.skills.slice(0, 4);
  }, [student.skills]);
  const hiddenSkillsCount = Math.max(0, student.skills.length - 4);

  const isPending = student.invitationStatus === 'pending';
  const isAccepted = student.invitationStatus === 'accepted';

  return (
    <div
      onClick={() => onCardClick?.(student)}
      className="bg-white border border-[#E5E7EB] rounded-2xl p-4 sm:p-5 flex flex-col justify-between min-h-[300px] transition-colors focus-within:border-[#0A0A0A] [@media(hover:hover)]:hover:border-[#0A0A0A]"
    >
      <div className="space-y-4 min-w-0">
        {/* Header: Avatar, Name, Department & Academic Year */}
        <div className="flex items-start gap-3 min-w-0">
          {/* Avatar: Photo ONLY for own-department faculty. Otherwise initials avatar */}
          {isFacultyOwnDept && student.avatarUrl ? (
            <img
              src={student.avatarUrl}
              alt={student.name}
              className="w-11 h-11 rounded-full object-cover border border-[#E5E7EB] shrink-0"
              loading="lazy"
            />
          ) : (
            <div
              className="w-11 h-11 rounded-full bg-[#F3F4F6] text-[#0A0A0A] font-bold text-xs flex items-center justify-center shrink-0 border border-[#E5E7EB]"
              aria-label={`${student.name}'s initials`}
            >
              {initials}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-bold text-[#0A0A0A] line-clamp-2 leading-snug">
              {student.name}
            </h3>
            <p className="text-xs text-[#6B7280] mt-0.5 truncate">
              {student.department} · {student.currentYear} ({student.semester})
            </p>
            {isFacultyOwnDept && student.prn && (
              <p className="text-[11px] font-mono text-[#6B7280] mt-0.5">
                PRN: {student.prn}
              </p>
            )}
          </div>
        </div>

        {/* Skills Section */}
        {student.skills.length > 0 && (
          <div className="min-w-0">
            <span className="block text-[11px] font-mono uppercase text-[#6B7280] mb-1.5 tracking-wider">
              Skills
            </span>
            <div className="flex flex-wrap gap-1.5 max-h-[56px] overflow-hidden">
              {visibleSkills.map((skill, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-[#F3F4F6] text-[#0A0A0A] border border-[#E5E7EB]"
                >
                  {skill}
                </span>
              ))}
              {hiddenSkillsCount > 0 && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[11px] font-medium text-[#6B7280] bg-[#FAFAFA] border border-[#E5E7EB]">
                  +{hiddenSkillsCount}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Career Goal */}
        {student.careerGoal && (
          <div className="min-w-0">
            <span className="block text-[11px] font-mono uppercase text-[#6B7280] mb-1 tracking-wider">
              Career goal
            </span>
            <p className="text-xs text-[#0A0A0A] line-clamp-2 leading-relaxed">
              {student.careerGoal}
            </p>
          </div>
        )}
      </div>

      {/* Action Button: Full width, min 44px height */}
      <div className="pt-4 mt-auto">
        {isPending ? (
          <button
            type="button"
            disabled
            className="w-full min-h-[44px] px-4 py-2.5 rounded-xl border border-[#FDE68A] bg-[#FEF3C7] text-[#92400E] text-xs font-semibold flex items-center justify-center gap-2 cursor-not-allowed"
          >
            <Clock className="w-4 h-4" />
            <span>Invitation pending</span>
          </button>
        ) : isAccepted ? (
          <button
            type="button"
            disabled
            className="w-full min-h-[44px] px-4 py-2.5 rounded-xl border border-[#A7F3D0] bg-[#ECFDF5] text-[#065F46] text-xs font-semibold flex items-center justify-center gap-2 cursor-not-allowed"
          >
            <Check className="w-4 h-4" />
            <span>Connected</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onInvite(student);
            }}
            className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-[#0A0A0A] text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer [@media(hover:hover)]:hover:bg-[#262626] active:scale-[0.98]"
          >
            <UserCheck className="w-4 h-4" />
            <span>Invite to connect</span>
          </button>
        )}
      </div>
    </div>
  );
};

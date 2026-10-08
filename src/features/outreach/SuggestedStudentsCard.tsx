// ============================================================================
// NEXALINK V2.8: Suggested Students Card (Dashboards)
// Top 3 matched students with match reasons (never percentage scores)
// ============================================================================

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSuggestedStudents, useSentInvitations } from './useOutreach';
import { InviteSheet } from './InviteSheet';
import { SuggestedStudentCardSkeleton } from './OutreachSkeletons';
import type { SuggestedStudent, DiscoverableStudent } from './types';
import { Sparkles, UserCheck, ArrowRight } from 'lucide-react';

interface SuggestedStudentsCardProps {
  onNavigateToDiscovery?: () => void;
}

export const SuggestedStudentsCard: React.FC<SuggestedStudentsCardProps> = ({
  onNavigateToDiscovery
}) => {
  const { currentUser } = useAuth();
  const { suggested, isLoading } = useSuggestedStudents(currentUser?.id, currentUser?.department);
  const { remainingQuota, send } = useSentInvitations(currentUser?.id);

  const [selectedStudent, setSelectedStudent] = useState<DiscoverableStudent | null>(null);

  if (isLoading) {
    return (
      <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 sm:p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#0A0A0A]" />
          <h3 className="text-xs font-bold text-[#0A0A0A] uppercase tracking-wider">
            Suggested students for mentorship
          </h3>
        </div>
        <div className="flex lg:grid lg:grid-cols-3 gap-4 overflow-x-auto pb-2 lg:pb-0">
          <SuggestedStudentCardSkeleton />
          <SuggestedStudentCardSkeleton />
          <SuggestedStudentCardSkeleton />
        </div>
      </div>
    );
  }

  if (suggested.length === 0) {
    return null; // Silent if no matched students
  }

  const handleOpenInvite = (s: SuggestedStudent) => {
    setSelectedStudent({
      id: s.id,
      name: s.name,
      department: s.department,
      currentYear: s.currentYear,
      semester: s.semester,
      skills: s.skills,
      careerGoal: s.careerGoal,
      areasOfInterest: [],
      avatarUrl: s.avatarUrl,
      hasResume: true
    });
  };

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 sm:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#0A0A0A]" />
          <div>
            <h3 className="text-xs font-bold text-[#0A0A0A] uppercase tracking-wider">
              Suggested students
            </h3>
            <p className="text-[11px] text-[#6B7280]">
              Opted-in students matched to your expertise and department
            </p>
          </div>
        </div>

        {onNavigateToDiscovery && (
          <button
            type="button"
            onClick={onNavigateToDiscovery}
            className="text-xs font-semibold text-[#0A0A0A] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>View all</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Snap row below 1024px, 3-column grid from 1024px */}
      <div
        className="flex lg:grid lg:grid-cols-3 gap-4 overflow-x-auto pb-2 lg:pb-0 scroll-smooth snap-x snap-mandatory"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {suggested.map(student => {
          const initials = student.name
            .split(' ')
            .map(n => n[0])
            .join('')
            .slice(0, 2)
            .toUpperCase();

          return (
            <div
              key={student.id}
              className="w-[min(82vw,300px)] lg:w-auto shrink-0 snap-start bg-[#FAFAFA] border border-[#E5E7EB] rounded-2xl p-4 flex flex-col justify-between space-y-3 min-h-[220px]"
            >
              <div className="space-y-3 min-w-0">
                {/* Header: Avatar + Info */}
                <div className="flex items-start gap-3 min-w-0">
                  {student.avatarUrl ? (
                    <img
                      src={student.avatarUrl}
                      alt={student.name}
                      className="w-10 h-10 rounded-full object-cover border border-[#E5E7EB] shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-white text-[#0A0A0A] font-bold text-xs flex items-center justify-center shrink-0 border border-[#E5E7EB]">
                      {initials}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-[#0A0A0A] truncate">
                      {student.name}
                    </h4>
                    <p className="text-[11px] text-[#6B7280] truncate">
                      {student.department} · {student.currentYear}
                    </p>
                  </div>
                </div>

                {/* Match Reasons (Sentence case, max 2 lines, no percentage) */}
                <div className="min-w-0">
                  <span className="block text-[10px] font-mono uppercase text-[#6B7280] mb-1 tracking-wider">
                    Why matched
                  </span>
                  <div className="space-y-1">
                    {student.matchReasons.slice(0, 2).map((reason, idx) => (
                      <p key={idx} className="text-xs font-medium text-[#0A0A0A] line-clamp-1 leading-snug">
                        • {reason}
                      </p>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Button (Min 44px height) */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => handleOpenInvite(student)}
                  className="w-full min-h-[44px] px-3 py-2 bg-white hover:bg-[#F3F4F6] border border-[#D1D5DB] text-[#0A0A0A] text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Invite to connect</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Invite Sheet / Dialog */}
      <InviteSheet
        isOpen={Boolean(selectedStudent)}
        onClose={() => setSelectedStudent(null)}
        student={selectedStudent}
        remainingQuota={remainingQuota}
        onSend={async (studentId, reason) => {
          return send(studentId, reason);
        }}
      />
    </div>
  );
};

import React from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Sparkles, ChevronRight } from 'lucide-react';
import { Avatar } from '../../utils/avatarHelper';
import { StatusBadge } from '../ui/StatusBadge';
import { calculateAlumniMatch, calculateFacultyMatch } from '../../utils/recommendationEngine';
import { useAuth } from '../../context/AuthContext';
import type { AlumniProfile, FacultyProfile, StudentProfile } from '../../types';

export interface DirectoryRowProps {
  user: AlumniProfile | FacultyProfile | any;
  isSelected?: boolean;
  onSelect: (user: any) => void;
  onMessageClick: (e: React.MouseEvent, user: any) => void;
}

export const DirectoryRow: React.FC<DirectoryRowProps> = ({
  user,
  isSelected = false,
  onSelect,
  onMessageClick,
}) => {
  const { currentUser, currentRole } = useAuth();
  const role = user.userType || user.role || 'alumni';

  // Calculate match score if viewer is a student
  let matchScore = 0;
  if (currentRole === 'student' && currentUser) {
    if (role === 'alumni') {
      const match = calculateAlumniMatch(currentUser as StudentProfile, user as AlumniProfile);
      matchScore = match.score;
    } else if (role === 'faculty') {
      const match = calculateFacultyMatch(currentUser as StudentProfile, user as FacultyProfile);
      matchScore = match.score;
    }
  }

  // Skills preview: up to 3 items separated by " · "
  const skillsPreview = user.skills && user.skills.length > 0
    ? user.skills.slice(0, 3).join(' · ')
    : '';

  const metaString = [
    user.designation || (role === 'alumni' ? 'Alumni' : 'Faculty'),
    user.company || user.department,
    user.location || 'Mumbai, India',
  ].filter(Boolean).join(' · ');

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(user)}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(user);
        }
      }}
      className={`relative w-full p-4 sm:p-5 flex items-center justify-between gap-4 border-b border-[#E5E7EB] cursor-pointer transition-colors text-left focus:outline-none focus-visible:bg-[#FAFAFA] ${
        isSelected ? 'bg-[#F3F4F6]' : 'bg-white hover:bg-[#FAFAFA]'
      }`}
    >
      {/* 2px Selected indicator bar on left */}
      {isSelected && (
        <motion.div
          layoutId="activeDirectoryRowIndicator"
          className="absolute left-0 top-3 bottom-3 w-[2px] bg-[#0A0A0A] rounded-r"
        />
      )}

      {/* Leading Avatar & Details */}
      <div className="flex items-center gap-4 min-w-0 flex-1">
        <Avatar
          src={user.avatar}
          name={user.name}
          size={48}
          className="w-12 h-12 shrink-0"
        />

        <div className="space-y-1 min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-semibold text-[#0A0A0A] truncate">
              {user.name}
            </h3>
            <StatusBadge
              label={role === 'faculty' ? 'Faculty' : role === 'alumni' ? 'Alumni' : 'Student'}
              tone="indigo"
              size="sm"
            />
            {matchScore >= 60 && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#0A0A0A] bg-[#F3F4F6] border border-[#E5E7EB] px-2 py-0.5 rounded-full">
                <Sparkles className="w-3 h-3 text-[#0A0A0A]" />
                <span>{matchScore}% match</span>
              </span>
            )}
          </div>

          <p className="text-xs text-[#6B7280] truncate">
            {metaString}
          </p>

          {skillsPreview && (
            <p className="text-[11px] text-[#6B7280] truncate font-normal">
              {skillsPreview}
            </p>
          )}
        </div>
      </div>

      {/* Trailing Actions */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={e => onMessageClick(e, user)}
          className="p-2 rounded-lg text-[#6B7280] hover:text-[#0A0A0A] hover:bg-[#E5E7EB] transition-colors cursor-pointer"
          title={`Send message to ${user.name}`}
          aria-label={`Send message to ${user.name}`}
        >
          <MessageSquare className="w-4 h-4" />
        </button>
        <ChevronRight className="w-4 h-4 text-[#D1D5DB] hidden sm:block" />
      </div>
    </div>
  );
};

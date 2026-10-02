import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { JobListing, StudentProfile } from '../../types';
import { normalizeOpportunityType } from '../../constants/taxonomy';
import { formatCompensation } from '../../utils/compensationFormatter';
import { formatDeadline } from '../../utils/formatters';
import { calculateOpportunityMatch } from '../../utils/recommendationEngine';
import {
  X,
  Building2,
  MapPin,
  Calendar,
  Bookmark,
  Send,
  MessageSquare,
  Sparkles,
  CheckCircle2,
  ExternalLink,
  Briefcase
} from 'lucide-react';

interface OpportunityDetailPanelProps {
  job: JobListing | null;
  currentUser: any;
  isSaved: boolean;
  isApplied: boolean;
  onClose: () => void;
  onToggleSave: (e: React.MouseEvent) => void;
  onApply: (jobId: string) => void;
  onMessagePoster?: (posterId?: string) => void;
  isMobileScreen?: boolean;
}

export const OpportunityDetailPanel: React.FC<OpportunityDetailPanelProps> = ({
  job,
  currentUser,
  isSaved,
  isApplied,
  onClose,
  onToggleSave,
  onApply,
  onMessagePoster,
  isMobileScreen = false,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!job) return null;

  const deadlineStatus = formatDeadline(job.applicationDeadline);
  const normalizedType = normalizeOpportunityType(job.type);
  const formattedComp = formatCompensation(job.stipendOrSalary);

  const isStudent = currentUser?.role === 'student';
  const matchResult = isStudent
    ? calculateOpportunityMatch(currentUser as StudentProfile, job)
    : null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-40 lg:relative lg:inset-auto lg:z-0 flex">
        {/* Backdrop on mobile & compact desktop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={onClose}
          className="fixed inset-0 bg-[#0A0A0A]/30 backdrop-blur-xs lg:hidden z-40"
        />

        {/* Panel Container: Side rail on >=1280px, Drawer on 1024-1279px, Bottom Sheet on <1024px */}
        <motion.aside
          ref={panelRef}
          initial={
            isMobileScreen
              ? { y: '100%', opacity: 1 }
              : { x: 30, opacity: 0 }
          }
          animate={
            isMobileScreen
              ? { y: 0, opacity: 1 }
              : { x: 0, opacity: 1 }
          }
          exit={
            isMobileScreen
              ? { y: '100%', opacity: 0.9 }
              : { x: 30, opacity: 0 }
          }
          transition={{ type: 'spring', damping: 28, stiffness: 280 }}
          className={`bg-white border-[#E5E7EB] flex flex-col z-50 text-xs font-sans ${
            isMobileScreen
              ? 'fixed inset-x-0 bottom-0 max-h-[85vh] rounded-t-2xl border-t shadow-xl overflow-hidden'
              : 'w-[440px] shrink-0 border-l h-full overflow-hidden'
          }`}
          aria-label="Opportunity details"
        >
          {/* Header */}
          <div className="p-5 px-6 border-b border-[#E5E7EB] flex items-start justify-between gap-4 bg-white shrink-0">
            <div className="flex items-start gap-3.5 min-w-0">
              <div className="w-12 h-12 rounded-xl bg-white border border-[#E5E7EB] flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
                {job.companyLogo ? (
                  <img
                    src={job.companyLogo}
                    alt={job.company}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <Building2 className="w-6 h-6 text-[#6B7280]" />
                )}
              </div>

              <div className="min-w-0">
                <h2 className="font-bold text-base text-[#0A0A0A] tracking-tight leading-snug truncate">
                  {job.title}
                </h2>
                <div className="flex items-center gap-1.5 text-xs text-[#6B7280] mt-0.5 truncate">
                  <span className="font-medium text-[#0A0A0A]">{job.company}</span>
                  <span>·</span>
                  <span>{job.location}</span>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg border border-[#E5E7EB] text-[#6B7280] hover:text-[#0A0A0A] hover:bg-[#F9FAFB] transition-colors shrink-0"
              title="Close panel (Esc)"
              aria-label="Close panel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Scrollable Content Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">

            {/* Overview Metric Cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl space-y-1">
                <span className="text-[11px] text-[#6B7280] font-medium block">
                  Compensation
                </span>
                <span className="font-semibold text-sm text-[#0A0A0A] block">
                  {formattedComp}
                </span>
              </div>

              <div className="p-3.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl space-y-1">
                <span className="text-[11px] text-[#6B7280] font-medium block">
                  Opportunity type
                </span>
                <span className="font-semibold text-sm text-[#0A0A0A] block">
                  {normalizedType}
                </span>
              </div>
            </div>

            {/* Deadline Banner */}
            <div
              className={`p-3 px-4 rounded-xl border flex items-center justify-between gap-3 text-xs ${
                deadlineStatus.isUrgent
                  ? 'bg-[#FEF3C7] border-[#FDE68A] text-[#B45309]'
                  : 'bg-[#F9FAFB] border-[#E5E7EB] text-[#6B7280]'
              }`}
            >
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 shrink-0" />
                <span className="font-medium">
                  {deadlineStatus.label}
                </span>
              </div>
              <span className="text-[11px]">
                Deadline: {deadlineStatus.formattedDate}
              </span>
            </div>

            {/* Student Match Breakdown (if student and match calculated) */}
            {matchResult && matchResult.score >= 60 && (
              <div className="p-4 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-[#0A0A0A] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#0A0A0A]" />
                    <span>Skills alignment ({matchResult.score}%)</span>
                  </span>
                  <span className="text-[11px] text-[#6B7280]">
                    Profile match
                  </span>
                </div>

                {matchResult.matchReasons.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {matchResult.matchReasons.map((r, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 bg-white border border-[#E5E7EB] text-[#0A0A0A] text-[11px] font-medium rounded-md"
                      >
                        ✓ {r}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Required Skills */}
            {job.skillsRequired && job.skillsRequired.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-xs text-[#0A0A0A]">
                  Required skills & competencies
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {job.skillsRequired.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 bg-white border border-[#E5E7EB] rounded-lg text-[#0A0A0A] text-xs font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            <div className="space-y-2">
              <h4 className="font-semibold text-xs text-[#0A0A0A]">
                About the role
              </h4>
              <p className="text-xs text-[#4B5563] leading-relaxed whitespace-pre-line">
                {job.description}
              </p>
            </div>

            {/* Requirements */}
            {job.requirements && job.requirements.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-xs text-[#0A0A0A]">
                  Candidate requirements
                </h4>
                <ul className="space-y-1.5 text-xs text-[#4B5563]">
                  {job.requirements.map((req, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-[#0A0A0A] font-bold">·</span>
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Publisher Attribution */}
            {job.postedByAlumniName && (
              <div className="p-4 bg-white border border-[#E5E7EB] rounded-xl flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <span className="text-[11px] text-[#6B7280] block">Published by</span>
                  <span className="font-semibold text-xs text-[#0A0A0A] truncate block mt-0.5">
                    {job.postedByAlumniName}
                  </span>
                </div>

                {onMessagePoster && (
                  <button
                    onClick={() => onMessagePoster(job.postedByAlumniId)}
                    className="p-2 px-3 border border-[#E5E7EB] rounded-lg hover:bg-[#F9FAFB] text-xs font-medium text-[#0A0A0A] flex items-center gap-1.5 transition-colors shrink-0"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Message</span>
                  </button>
                )}
              </div>
            )}

          </div>

          {/* Sticky Action Footer */}
          <div className="p-4 px-6 border-t border-[#E5E7EB] bg-white flex items-center justify-between gap-3 shrink-0">
            <button
              type="button"
              onClick={onToggleSave}
              className={`p-2.5 rounded-xl border transition-colors flex items-center justify-center shrink-0 ${
                isSaved
                  ? 'bg-[#F3F4F6] border-[#0A0A0A] text-[#0A0A0A]'
                  : 'bg-white border-[#E5E7EB] text-[#6B7280] hover:text-[#0A0A0A] hover:bg-[#F9FAFB]'
              }`}
              title={isSaved ? 'Saved opportunity' : 'Save opportunity'}
            >
              <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-[#0A0A0A]' : ''}`} />
            </button>

            <button
              type="button"
              disabled={isApplied || deadlineStatus.isClosed}
              onClick={() => onApply(job.id)}
              className={`flex-1 py-2.5 px-5 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition-colors ${
                isApplied
                  ? 'bg-[#F3F4F6] text-[#6B7280] border border-[#E5E7EB] cursor-not-allowed'
                  : deadlineStatus.isClosed
                  ? 'bg-[#F3F4F6] text-[#9CA3AF] cursor-not-allowed'
                  : 'bg-[#0A0A0A] text-white hover:bg-[#222222]'
              }`}
            >
              {isApplied ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-[#065F46]" />
                  <span>Applied</span>
                </>
              ) : deadlineStatus.isClosed ? (
                <span>Applications closed</span>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit application</span>
                </>
              )}
            </button>
          </div>
        </motion.aside>
      </div>
    </AnimatePresence>
  );
};

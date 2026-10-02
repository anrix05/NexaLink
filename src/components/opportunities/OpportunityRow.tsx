import React from 'react';
import type { JobListing } from '../../types';
import { normalizeOpportunityType } from '../../constants/taxonomy';
import { formatCompensation } from '../../utils/compensationFormatter';
import { formatDeadline } from '../../utils/formatters';
import { Building2, Bookmark, Sparkles, MapPin, ChevronRight, Check } from 'lucide-react';

interface OpportunityRowProps {
  job: JobListing;
  isSelected: boolean;
  isSaved: boolean;
  isApplied: boolean;
  matchScore?: number | null;
  onSelect: () => void;
  onToggleSave: (e: React.MouseEvent) => void;
  onApply: (e: React.MouseEvent) => void;
}

export const OpportunityRow: React.FC<OpportunityRowProps> = ({
  job,
  isSelected,
  isSaved,
  isApplied,
  matchScore,
  onSelect,
  onToggleSave,
  onApply,
}) => {
  const deadlineStatus = formatDeadline(job.applicationDeadline);
  const normalizedType = normalizeOpportunityType(job.type);
  const formattedComp = formatCompensation(job.stipendOrSalary);
  const showMatchScore = typeof matchScore === 'number' && matchScore >= 60;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
      className={`relative w-full border-b border-[#E5E7EB] transition-colors duration-150 cursor-pointer text-left select-none outline-none focus-visible:ring-1 focus-visible:ring-[#0A0A0A] ${
        isSelected
          ? 'bg-[#F9FAFB] border-l-2 border-[#0A0A0A]'
          : 'hover:bg-[#FAFAFA] border-l-2 border-transparent'
      }`}
    >
      <div className="p-4 sm:p-5 flex items-start gap-4">
        {/* Company Logo / Fallback */}
        <div className="w-11 h-11 rounded-xl bg-white border border-[#E5E7EB] flex items-center justify-center shrink-0 overflow-hidden shadow-2xs mt-0.5">
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
            <Building2 className="w-5 h-5 text-[#6B7280]" />
          )}
        </div>

        {/* Content Column */}
        <div className="min-w-0 flex-1">
          {/* Top Line: Title + Match Badge */}
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-sm text-[#0A0A0A] truncate">
              {job.title}
            </h3>

            {/* Match score meter - ONLY shown if >= 60% */}
            {showMatchScore && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#F3F4F6] text-[#0A0A0A] border border-[#E5E7EB] text-[11px] font-medium rounded-full shrink-0">
                <Sparkles className="w-3 h-3 text-[#0A0A0A]" />
                <span>{matchScore}% match</span>
              </span>
            )}

            {isApplied && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0] text-[11px] font-medium rounded-full shrink-0">
                <Check className="w-3 h-3 text-[#065F46]" />
                <span>Applied</span>
              </span>
            )}
          </div>

          {/* Subtitle Line: Company · Location · Plain Text Type */}
          <div className="flex items-center gap-1.5 text-xs text-[#6B7280] mt-1 flex-wrap">
            <span className="font-medium text-[#0A0A0A]">{job.company}</span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-[#6B7280]" />
              <span>{job.location}</span>
            </span>
            <span>·</span>
            <span>{normalizedType}</span>
          </div>

          {/* Bottom Line: Compensation + Deadline */}
          <div className="flex items-center gap-3 text-xs mt-2.5 flex-wrap">
            <span className="font-medium text-[#0A0A0A]">
              {formattedComp}
            </span>
            <span>·</span>
            <span
              className={
                deadlineStatus.isUrgent
                  ? 'text-[#B45309] font-medium'
                  : 'text-[#6B7280]'
              }
            >
              {deadlineStatus.label}
            </span>
            {job.postedByAlumniName && (
              <>
                <span className="hidden sm:inline">·</span>
                <span className="hidden sm:inline text-[#6B7280]">
                  Posted by {job.postedByAlumniName}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Quiet Actions */}
        <div className="flex items-center gap-2 shrink-0 self-center">
          <button
            type="button"
            onClick={onToggleSave}
            className={`p-2 rounded-lg border transition-colors ${
              isSaved
                ? 'bg-[#F3F4F6] border-[#0A0A0A] text-[#0A0A0A]'
                : 'bg-white border-[#E5E7EB] text-[#6B7280] hover:text-[#0A0A0A] hover:bg-[#F9FAFB]'
            }`}
            title={isSaved ? 'Saved opportunity' : 'Save opportunity'}
            aria-label={isSaved ? 'Saved opportunity' : 'Save opportunity'}
          >
            <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-[#0A0A0A]' : ''}`} />
          </button>

          <ChevronRight className="w-4 h-4 text-[#9CA3AF] hidden sm:block" />
        </div>
      </div>
    </div>
  );
};

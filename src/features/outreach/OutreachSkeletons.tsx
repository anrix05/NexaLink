// ============================================================================
// NEXALINK V2.8: Outreach Skeletons (CLS = 0 sizing matching loaded UI)
// ============================================================================

import React from 'react';

export const StudentCardSkeleton: React.FC = () => {
  return (
    <div
      className="bg-white border border-[#E5E7EB] rounded-2xl p-4 sm:p-5 flex flex-col justify-between min-h-[300px] animate-pulse"
      aria-hidden="true"
    >
      <div className="space-y-4">
        {/* Header: Avatar + Name + Dept */}
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-full bg-[#F3F4F6] shrink-0" />
          <div className="space-y-2 flex-1 min-w-0">
            <div className="h-4 bg-[#F3F4F6] rounded-md w-3/4" />
            <div className="h-3 bg-[#F3F4F6] rounded-md w-1/2" />
          </div>
        </div>

        {/* Skills */}
        <div className="space-y-1.5 pt-1">
          <div className="h-2.5 bg-[#F3F4F6] rounded-md w-1/4" />
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            <div className="h-6 w-16 bg-[#F3F4F6] rounded-md" />
            <div className="h-6 w-20 bg-[#F3F4F6] rounded-md" />
            <div className="h-6 w-14 bg-[#F3F4F6] rounded-md" />
          </div>
        </div>

        {/* Career Goal */}
        <div className="space-y-1.5 pt-1">
          <div className="h-2.5 bg-[#F3F4F6] rounded-md w-1/3" />
          <div className="h-3.5 bg-[#F3F4F6] rounded-md w-full" />
          <div className="h-3.5 bg-[#F3F4F6] rounded-md w-4/5" />
        </div>
      </div>

      {/* Button */}
      <div className="pt-4 mt-auto">
        <div className="h-11 w-full bg-[#F3F4F6] rounded-xl" />
      </div>
    </div>
  );
};

export const StudentGridSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => {
  return (
    <div
      className="grid gap-4"
      style={{
        gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))'
      }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <StudentCardSkeleton key={i} />
      ))}
    </div>
  );
};

export const SuggestedStudentCardSkeleton: React.FC = () => {
  return (
    <div className="w-[min(82vw,300px)] lg:w-auto shrink-0 bg-white border border-[#E5E7EB] rounded-2xl p-4 sm:p-5 flex flex-col justify-between min-h-[220px] animate-pulse">
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#F3F4F6] shrink-0" />
          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="h-4 bg-[#F3F4F6] rounded-md w-3/4" />
            <div className="h-3 bg-[#F3F4F6] rounded-md w-1/2" />
          </div>
        </div>
        <div className="space-y-1.5 pt-2">
          <div className="h-3 bg-[#F3F4F6] rounded-md w-full" />
          <div className="h-3 bg-[#F3F4F6] rounded-md w-4/5" />
        </div>
      </div>
      <div className="pt-3">
        <div className="h-9 w-full bg-[#F3F4F6] rounded-lg" />
      </div>
    </div>
  );
};

export const InvitationRowSkeleton: React.FC = () => {
  return (
    <div className="p-4 sm:p-5 bg-white border border-[#E5E7EB] rounded-xl space-y-3 animate-pulse">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1.5 flex-1 min-w-0">
          <div className="h-4 bg-[#F3F4F6] rounded-md w-2/5" />
          <div className="h-3 bg-[#F3F4F6] rounded-md w-1/4" />
        </div>
        <div className="h-6 w-16 bg-[#F3F4F6] rounded-full shrink-0" />
      </div>
      <div className="space-y-1 py-1">
        <div className="h-3.5 bg-[#F3F4F6] rounded-md w-full" />
        <div className="h-3.5 bg-[#F3F4F6] rounded-md w-3/4" />
      </div>
      <div className="flex gap-2 pt-1">
        <div className="h-9 w-24 bg-[#F3F4F6] rounded-lg" />
        <div className="h-9 w-24 bg-[#F3F4F6] rounded-lg" />
      </div>
    </div>
  );
};

export const ProfileViewRowSkeleton: React.FC = () => {
  return (
    <div className="py-3 flex items-center justify-between gap-3 animate-pulse">
      <div className="space-y-1 flex-1 min-w-0">
        <div className="h-3.5 bg-[#F3F4F6] rounded-md w-1/3" />
        <div className="h-3 bg-[#F3F4F6] rounded-md w-1/4" />
      </div>
      <div className="h-3 bg-[#F3F4F6] rounded-md w-16 shrink-0" />
    </div>
  );
};

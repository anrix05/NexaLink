// ============================================================================
// NEXALINK V2.8: Discover Students Panel (Alumni & Faculty)
// ============================================================================

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useDiscoverStudents, useSentInvitations } from './useOutreach';
import { StudentCard } from './StudentCard';
import { InviteSheet } from './InviteSheet';
import { FilterSheet } from './FilterSheet';
import { StudentGridSkeleton } from './OutreachSkeletons';
import { outreachApi } from './api';
import type { DiscoverableStudent, DiscoverStudentsFilter } from './types';
import { Search, Filter, RefreshCw, RotateCcw, UserX } from 'lucide-react';

interface DiscoverStudentsPanelProps {
  role: 'alumni' | 'faculty';
}

const DEPARTMENTS = ['All', 'CMPN', 'INFT', 'EXTC', 'EXCS', 'BIOM'];
const YEARS = [
  { label: 'All years', value: undefined },
  { label: 'First Year (FE)', value: 1 },
  { label: 'Second Year (SE)', value: 2 },
  { label: 'Third Year (TE)', value: 3 },
  { label: 'Final Year (BE)', value: 4 }
];

export const DiscoverStudentsPanel: React.FC<DiscoverStudentsPanelProps> = ({ role }) => {
  const { currentUser } = useAuth();
  const [filters, setFilters] = useState<DiscoverStudentsFilter>({
    query: '',
    department: 'All',
    year: undefined,
    skill: ''
  });

  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [selectedStudentForInvite, setSelectedStudentForInvite] = useState<DiscoverableStudent | null>(null);

  const {
    students,
    totalCount,
    isLoading,
    isLoadingMore,
    hasMore,
    loadMore,
    refetch
  } = useDiscoverStudents(currentUser?.id, role, currentUser?.department, filters);

  const {
    sentInvitations,
    remainingQuota,
    send,
    withdraw
  } = useSentInvitations(currentUser?.id);

  // Active filter count for mobile badge
  const activeFiltersCount = (
    (filters.department && filters.department !== 'All' ? 1 : 0) +
    (filters.year !== undefined ? 1 : 0) +
    (filters.skill?.trim() ? 1 : 0)
  );

  const isFilteringApplied = activeFiltersCount > 0 || Boolean(filters.query?.trim());

  const handleResetFilters = () => {
    setFilters({ query: '', department: 'All', year: undefined, skill: '' });
  };

  const handleCardClick = (student: DiscoverableStudent) => {
    // Record profile view once per day
    if (currentUser?.id) {
      outreachApi.recordProfileView(currentUser.id, student.id, currentUser.name, currentUser.role);
    }
  };

  const handleOpenInvite = (student: DiscoverableStudent) => {
    handleCardClick(student);
    setSelectedStudentForInvite(student);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* ─── SEARCH & FILTER CONTROLS ────────────────────────────────────── */}
      <div className="space-y-3">
        {/* Mobile controls (<640px) */}
        <div className="flex sm:hidden items-center gap-2">
          <div className="relative flex-1 min-w-0">
            <Search className="w-4 h-4 text-[#6B7280] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={filters.query || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, query: e.target.value }))}
              placeholder="Search by name or skill..."
              className="w-full min-h-[44px] pl-9 pr-3 text-base text-[#0A0A0A] bg-white border-2 border-[#D1D5DB] focus:border-[#0A0A0A] rounded-xl placeholder-[#9CA3AF]"
            />
          </div>
          <button
            type="button"
            onClick={() => setIsFilterSheetOpen(true)}
            className="min-h-[44px] px-3.5 py-2.5 rounded-xl border border-[#D1D5DB] bg-white text-xs font-semibold text-[#0A0A0A] flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
            {activeFiltersCount > 0 && (
              <span className="px-1.5 py-0.2 bg-[#0A0A0A] text-white text-[10px] font-bold rounded-full">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>

        {/* Tablet wrapping & Desktop inline controls (>=640px) */}
        <div className="hidden sm:flex flex-wrap lg:flex-nowrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-[#6B7280] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={filters.query || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, query: e.target.value }))}
              placeholder="Search by name or skill..."
              className="w-full min-h-[44px] pl-9 pr-3 text-xs text-[#0A0A0A] bg-white border border-[#D1D5DB] focus:border-[#0A0A0A] rounded-xl placeholder-[#9CA3AF]"
            />
          </div>

          <select
            value={filters.department || 'All'}
            onChange={(e) => setFilters(prev => ({ ...prev, department: e.target.value }))}
            className="min-h-[44px] text-xs text-[#0A0A0A] bg-white border border-[#D1D5DB] focus:border-[#0A0A0A] rounded-xl px-3 appearance-none cursor-pointer"
          >
            {DEPARTMENTS.map(d => (
              <option key={d} value={d}>
                {d === 'All' ? 'All departments' : d}
              </option>
            ))}
          </select>

          <select
            value={filters.year !== undefined ? String(filters.year) : ''}
            onChange={(e) => setFilters(prev => ({ ...prev, year: e.target.value ? Number(e.target.value) : undefined }))}
            className="min-h-[44px] text-xs text-[#0A0A0A] bg-white border border-[#D1D5DB] focus:border-[#0A0A0A] rounded-xl px-3 appearance-none cursor-pointer"
          >
            {YEARS.map((y, idx) => (
              <option key={idx} value={y.value !== undefined ? String(y.value) : ''}>
                {y.label}
              </option>
            ))}
          </select>

          {isFilteringApplied && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="min-h-[44px] px-3 py-2 text-xs text-[#6B7280] hover:text-[#0A0A0A] flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* Count Announcement */}
        <div className="flex items-center justify-between text-xs text-[#6B7280]">
          <span>
            {isLoading ? 'Searching students...' : `${totalCount} ${totalCount === 1 ? 'student' : 'students'}`}
          </span>
          <span className="font-mono text-[11px]">
            {remainingQuota} of 5 invitations left this week
          </span>
        </div>
      </div>

      {/* ─── STUDENT RESULT GRID ─────────────────────────────────────────── */}
      {isLoading ? (
        <StudentGridSkeleton count={6} />
      ) : students.length === 0 ? (
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-8 sm:p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-[#F3F4F6] text-[#0A0A0A] mx-auto flex items-center justify-center">
            <UserX className="w-6 h-6" />
          </div>
          {isFilteringApplied ? (
            <>
              <h3 className="text-sm font-bold text-[#0A0A0A]">
                No students match these filters.
              </h3>
              <p className="text-xs text-[#6B7280] max-w-sm mx-auto">
                Try widening your search terms or clearing department and academic year filters.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="min-h-[44px] px-4 py-2 bg-[#0A0A0A] text-white text-xs font-semibold rounded-xl hover:bg-[#262626] transition-colors cursor-pointer"
                >
                  Reset filters
                </button>
              </div>
            </>
          ) : (
            <>
              <h3 className="text-sm font-bold text-[#0A0A0A]">
                No students are open to outreach yet. Check back as more students join.
              </h3>
              <p className="text-xs text-[#6B7280] max-w-sm mx-auto">
                Students opt in to outreach from their Field Privacy settings. Check back soon.
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div
            className="grid gap-4"
            style={{
              gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))'
            }}
          >
            {students.map(student => (
              <StudentCard
                key={student.id}
                student={student}
                viewerRole={role}
                viewerDept={currentUser?.department || 'CMPN'}
                onInvite={handleOpenInvite}
                onCardClick={handleCardClick}
              />
            ))}
          </div>

          {/* Centered Load More button */}
          {hasMore && (
            <div className="flex justify-center pt-4">
              <button
                type="button"
                disabled={isLoadingMore}
                onClick={loadMore}
                className="min-h-[44px] px-6 py-2.5 rounded-xl border border-[#D1D5DB] bg-white hover:bg-[#F3F4F6] text-xs font-semibold text-[#0A0A0A] flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
              >
                {isLoadingMore ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Loading more students...</span>
                  </>
                ) : (
                  <span>Load more</span>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ─── SENT INVITATIONS SECTION ───────────────────────────────────── */}
      {sentInvitations.length > 0 && (
        <div className="space-y-4 pt-8 border-t border-[#E5E7EB]">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-[#0A0A0A] uppercase tracking-wider">
              Sent invitations
            </h2>
            <span className="text-[11px] text-[#6B7280]">
              {sentInvitations.length} total
            </span>
          </div>

          {/* Mobile cards (<768px) */}
          <div className="md:hidden space-y-3">
            {sentInvitations.map(inv => {
              const isPending = inv.status === 'pending';
              return (
                <div
                  key={inv.id}
                  className="bg-white border border-[#E5E7EB] rounded-xl p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-bold text-[#0A0A0A]">
                        {inv.studentName}
                      </h4>
                      <p className="text-[11px] text-[#6B7280] mt-0.5">
                        {inv.studentDepartment} · Sent {new Date(inv.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      isPending ? 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]' :
                      inv.status === 'accepted' ? 'bg-[#ECFDF5] text-[#065F46] border-[#A7F3D0]' :
                      inv.status === 'declined' ? 'bg-[#F3F4F6] text-[#374151] border-[#E5E7EB]' :
                      'bg-[#FAFAFA] text-[#6B7280] border-[#E5E7EB]'
                    }`}>
                      {inv.status}
                    </span>
                  </div>

                  <p className="text-xs text-[#6B7280] line-clamp-2 bg-[#FAFAFA] p-2.5 rounded-lg border border-[#E5E7EB]">
                    "{inv.reason}"
                  </p>

                  {isPending && (
                    <button
                      type="button"
                      onClick={() => withdraw(inv.id)}
                      className="min-h-[44px] w-full px-3 py-2 rounded-lg border border-[#D1D5DB] text-xs font-semibold text-[#0A0A0A] hover:bg-[#F3F4F6] transition-colors cursor-pointer"
                    >
                      Withdraw
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Desktop grid rows (>=768px) */}
          <div className="hidden md:block border border-[#E5E7EB] rounded-2xl bg-white overflow-hidden divide-y divide-[#E5E7EB]">
            {sentInvitations.map(inv => {
              const isPending = inv.status === 'pending';
              return (
                <div
                  key={inv.id}
                  className="p-4 grid grid-cols-[1.5fr_2fr_1fr_auto] items-center gap-4 text-xs"
                >
                  <div className="min-w-0">
                    <span className="font-semibold text-[#0A0A0A] block truncate">
                      {inv.studentName}
                    </span>
                    <span className="text-[11px] text-[#6B7280]">
                      {inv.studentDepartment} · {new Date(inv.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <p className="text-[#6B7280] truncate min-w-0">
                    "{inv.reason}"
                  </p>

                  <div>
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      isPending ? 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]' :
                      inv.status === 'accepted' ? 'bg-[#ECFDF5] text-[#065F46] border-[#A7F3D0]' :
                      inv.status === 'declined' ? 'bg-[#F3F4F6] text-[#374151] border-[#E5E7EB]' :
                      'bg-[#FAFAFA] text-[#6B7280] border-[#E5E7EB]'
                    }`}>
                      {inv.status}
                    </span>
                  </div>

                  <div>
                    {isPending ? (
                      <button
                        type="button"
                        onClick={() => withdraw(inv.id)}
                        className="px-3 py-1.5 rounded-lg border border-[#D1D5DB] hover:bg-[#F3F4F6] text-[#0A0A0A] font-medium text-xs transition-colors cursor-pointer"
                      >
                        Withdraw
                      </button>
                    ) : (
                      <span className="text-[#9CA3AF] text-xs">—</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Mobile Filter Sheet (<640px) */}
      <FilterSheet
        isOpen={isFilterSheetOpen}
        onClose={() => setIsFilterSheetOpen(false)}
        filters={filters}
        onApply={(newFilters) => setFilters(newFilters)}
        onReset={handleResetFilters}
      />

      {/* Invite Sheet / Dialog */}
      <InviteSheet
        isOpen={Boolean(selectedStudentForInvite)}
        onClose={() => setSelectedStudentForInvite(null)}
        student={selectedStudentForInvite}
        remainingQuota={remainingQuota}
        onSend={async (studentId, reason) => {
          const res = await send(studentId, reason);
          if (res.success) {
            refetch();
          }
          return res;
        }}
      />
    </div>
  );
};

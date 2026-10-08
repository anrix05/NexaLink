// ============================================================================
// NEXALINK V2.8: Outreach Filter Sheet (Mobile bottom sheet below 640px)
// ============================================================================

import React, { useState, useEffect } from 'react';
import { BaseSheet } from './BaseSheet';
import type { DiscoverStudentsFilter } from './types';

interface FilterSheetProps {
  isOpen: boolean;
  onClose: () => void;
  filters: DiscoverStudentsFilter;
  onApply: (newFilters: DiscoverStudentsFilter) => void;
  onReset: () => void;
}

const DEPARTMENTS = ['All', 'CMPN', 'INFT', 'EXTC', 'EXCS', 'BIOM'];
const YEARS = [
  { label: 'All years', value: undefined },
  { label: 'First Year (FE)', value: 1 },
  { label: 'Second Year (SE)', value: 2 },
  { label: 'Third Year (TE)', value: 3 },
  { label: 'Final Year (BE)', value: 4 }
];

export const FilterSheet: React.FC<FilterSheetProps> = ({
  isOpen,
  onClose,
  filters,
  onApply,
  onReset
}) => {
  const [department, setDepartment] = useState(filters.department || 'All');
  const [year, setYear] = useState<number | undefined>(filters.year);
  const [skill, setSkill] = useState(filters.skill || '');

  useEffect(() => {
    if (isOpen) {
      setDepartment(filters.department || 'All');
      setYear(filters.year);
      setSkill(filters.skill || '');
    }
  }, [isOpen, filters]);

  const handleApply = () => {
    onApply({
      ...filters,
      department: department === 'All' ? undefined : department,
      year,
      skill: skill.trim() || undefined
    });
    onClose();
  };

  const handleReset = () => {
    setDepartment('All');
    setYear(undefined);
    setSkill('');
    onReset();
    onClose();
  };

  return (
    <BaseSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Filter discoverable students"
      ariaLabelledBy="outreach-filter-title"
      footer={
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={handleReset}
            className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-[#D1D5DB] text-[#0A0A0A] font-semibold text-xs hover:bg-[#F3F4F6] transition-colors cursor-pointer"
          >
            Reset filters
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-[#0A0A0A] text-white font-semibold text-xs hover:bg-[#262626] transition-colors cursor-pointer"
          >
            Apply filters
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Department Filter */}
        <div>
          <label className="block text-xs font-semibold text-[#0A0A0A] mb-1.5">
            Department
          </label>
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="w-full min-h-[44px] text-base lg:text-xs text-[#0A0A0A] bg-white border-2 border-[#D1D5DB] focus:border-[#0A0A0A] rounded-xl px-3 appearance-none cursor-pointer"
          >
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>
                {d === 'All' ? 'All departments' : d}
              </option>
            ))}
          </select>
        </div>

        {/* Academic Year Filter */}
        <div>
          <label className="block text-xs font-semibold text-[#0A0A0A] mb-1.5">
            Academic year
          </label>
          <select
            value={year !== undefined ? String(year) : ''}
            onChange={(e) => setYear(e.target.value ? Number(e.target.value) : undefined)}
            className="w-full min-h-[44px] text-base lg:text-xs text-[#0A0A0A] bg-white border-2 border-[#D1D5DB] focus:border-[#0A0A0A] rounded-xl px-3 appearance-none cursor-pointer"
          >
            {YEARS.map((y, idx) => (
              <option key={idx} value={y.value !== undefined ? String(y.value) : ''}>
                {y.label}
              </option>
            ))}
          </select>
        </div>

        {/* Specific Skill Filter */}
        <div>
          <label className="block text-xs font-semibold text-[#0A0A0A] mb-1.5">
            Skill or technology
          </label>
          <input
            type="text"
            value={skill}
            onChange={(e) => setSkill(e.target.value)}
            placeholder="e.g. React, Python, Cloud"
            className="w-full min-h-[44px] text-base lg:text-xs text-[#0A0A0A] bg-white border-2 border-[#D1D5DB] focus:border-[#0A0A0A] rounded-xl px-3 placeholder-[#9CA3AF]"
          />
        </div>
      </div>
    </BaseSheet>
  );
};

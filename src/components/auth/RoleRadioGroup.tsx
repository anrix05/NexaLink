import React from 'react';
import { GraduationCap, Briefcase, Award } from 'lucide-react';
import type { UserRole } from '../../types';

export interface RoleOption {
  role: 'student' | 'alumni' | 'faculty';
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const ROLES: RoleOption[] = [
  {
    role: 'student',
    title: 'Student',
    description: "Currently enrolled at VIT Wadala. You'll need your PRN.",
    icon: GraduationCap
  },
  {
    role: 'alumni',
    title: 'Alumni',
    description: 'Graduated from VIT Wadala.',
    icon: Award
  },
  {
    role: 'faculty',
    title: 'Faculty',
    description: 'Teaching or research staff at VIT Wadala.',
    icon: Briefcase
  }
];

export interface RoleRadioGroupProps {
  value: 'student' | 'alumni' | 'faculty';
  onChange: (role: 'student' | 'alumni' | 'faculty') => void;
  className?: string;
}

export const RoleRadioGroup: React.FC<RoleRadioGroupProps> = ({
  value,
  onChange,
  className = ''
}) => {
  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      e.preventDefault();
      const nextIndex = (index + 1) % ROLES.length;
      onChange(ROLES[nextIndex].role);
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const prevIndex = (index - 1 + ROLES.length) % ROLES.length;
      onChange(ROLES[prevIndex].role);
    }
  };

  return (
    <div
      role="radiogroup"
      aria-label="Select your role at VIT Wadala"
      className={`flex flex-col gap-2.5 ${className}`}
    >
      {ROLES.map((item, index) => {
        const isSelected = value === item.role;
        const Icon = item.icon;

        return (
          <div
            key={item.role}
            role="radio"
            aria-checked={isSelected}
            tabIndex={isSelected ? 0 : -1}
            onClick={() => onChange(item.role)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={`min-h-[56px] px-3.5 py-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between gap-3 text-left outline-none
              ${
                isSelected
                  ? 'border-[#0A0A0A] bg-[#FAFAFA] ring-2 ring-[#0A0A0A] ring-offset-1'
                  : 'border-[#E5E7EB] bg-[#FFFFFF] hover:border-[#6B7280]'
              }
            `}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-md flex items-center justify-center shrink-0 border transition-colors ${
                  isSelected
                    ? 'border-[#0A0A0A] bg-[#0A0A0A] text-[#FFFFFF]'
                    : 'border-[#E5E7EB] bg-[#FAFAFA] text-[#6B7280]'
                }`}
                aria-hidden="true"
              >
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-[#0A0A0A] leading-tight">
                  {item.title}
                </span>
                <span className="text-xs text-[#6B7280] leading-normal mt-0.5">
                  {item.description}
                </span>
              </div>
            </div>

            {/* Custom radio ring indicator */}
            <div
              className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                isSelected
                  ? 'border-[#0A0A0A] bg-[#FFFFFF]'
                  : 'border-[#6B7280] bg-[#FFFFFF]'
              }`}
              aria-hidden="true"
            >
              {isSelected && <div className="w-2 h-2 rounded-full bg-[#0A0A0A]" />}
            </div>
          </div>
        );
      })}
    </div>
  );
};

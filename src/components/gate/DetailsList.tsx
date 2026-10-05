import React, { useState } from 'react';
import { Copy, Check, Pencil } from 'lucide-react';
import type { User, DepartmentCode } from '../../types';
import { DEPARTMENTS } from '../../data/constants';
import { getUserEmails } from '../../utils/userEmails';

export interface DetailsListProps {
  user: User;
  canEdit?: boolean;
  onEditClick: () => void;
  className?: string;
}

export const DetailsList: React.FC<DetailsListProps> = ({
  user,
  canEdit = true,
  onEditClick,
  className = ''
}) => {
  const [copiedRef, setCopiedRef] = useState(false);

  // Generate or use user ID as Ref ID (uppercase mono)
  const refId = `NEXA-${(user.id || 'REF001').slice(-6).toUpperCase()}`;

  const copyRefId = async () => {
    try {
      await navigator.clipboard.writeText(refId);
      setCopiedRef(true);
      setTimeout(() => setCopiedRef(false), 2000);
    } catch {
      // fallback
    }
  };

  // Find department full name
  const deptInfo = DEPARTMENTS.find((d) => d.code === user.department);
  const deptName = deptInfo ? deptInfo.name : user.department || 'Not specified';
  const roleName = user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1).toLowerCase() : 'Member';

  return (
    <div className={`w-full flex flex-col gap-3 ${className}`}>
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-[#0A0A0A]">
          Your details
        </h2>
        {canEdit && (
          <button
            type="button"
            onClick={onEditClick}
            className="text-xs text-[#0A0A0A] hover:underline font-medium inline-flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-[#0A0A0A] rounded px-1.5 py-0.5"
          >
            <Pencil className="w-3 h-3 text-[#6B7280]" aria-hidden="true" />
            <span>Edit details</span>
          </button>
        )}
      </div>

      {/* Details Box */}
      <div className="rounded-lg border border-[#E5E7EB] bg-[#FFFFFF] divide-y divide-[#E5E7EB] text-sm overflow-hidden">
        {/* Ref ID Row */}
        <div className="p-3.5 flex items-center justify-between">
          <span className="text-xs text-[#6B7280]">Reference ID</span>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-medium text-[#0A0A0A] tracking-wider">
              {refId}
            </span>
            <button
              type="button"
              onClick={copyRefId}
              aria-label="Copy reference ID"
              className="p-1 rounded text-[#6B7280] hover:text-[#0A0A0A] hover:bg-[#FAFAFA] transition-colors focus:outline-none focus:ring-2 focus:ring-[#0A0A0A]"
            >
              {copiedRef ? (
                <Check className="w-3.5 h-3.5 text-[#059669]" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* Full Name */}
        <div className="p-3.5 flex items-center justify-between">
          <span className="text-xs text-[#6B7280]">Full name</span>
          <span className="text-xs font-medium text-[#0A0A0A] font-sans">
            {user.name || 'Not provided'}
          </span>
        </div>

        {/* Role */}
        <div className="p-3.5 flex items-center justify-between">
          <span className="text-xs text-[#6B7280]">Role</span>
          <span className="text-[11px] px-2 py-0.5 rounded-full border border-[#E5E7EB] bg-[#FAFAFA] text-[#0A0A0A] font-medium font-sans">
            {roleName}
          </span>
        </div>

        {/* Department */}
        <div className="p-3.5 flex items-center justify-between gap-4">
          <span className="text-xs text-[#6B7280] shrink-0">Department</span>
          <div className="flex items-center gap-1.5 truncate justify-end">
            <span className="text-xs font-medium text-[#0A0A0A] font-sans truncate">
              {deptName}
            </span>
            {user.department && (
              <span className="font-mono text-[11px] text-[#6B7280] bg-[#FAFAFA] px-1.5 py-0.5 rounded border border-[#E5E7EB] shrink-0">
                {user.department}
              </span>
            )}
          </div>
        </div>

        {/* Institutional / Primary Email (Inter font, NOT mono) */}
        <div className="p-3.5 flex items-center justify-between gap-4">
          <span className="text-xs text-[#6B7280] shrink-0">Email address</span>
          <span className="text-xs font-medium text-[#0A0A0A] font-sans truncate text-right">
            {getUserEmails(user).displayEmail || <span className="text-[#9CA3AF] italic">Not provided</span>}
          </span>
        </div>

        {/* PRN or Employee ID (mono font) */}
        {(user.enrollmentNo || user.employeeId || user.role === 'student' || user.role === 'faculty') && (
          <div className="p-3.5 flex items-center justify-between">
            <span className="text-xs text-[#6B7280]">
              {user.role === 'faculty' ? 'Employee ID' : 'PRN'}
            </span>
            <span className="font-mono text-xs font-medium text-[#0A0A0A]">
              {user.enrollmentNo || user.employeeId || 'Not provided'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

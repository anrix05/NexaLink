import React from 'react';
import { CheckCircle2, Circle, Clock, Lock } from 'lucide-react';

export type ChecklistRowStatus = 'done' | 'active' | 'todo' | 'locked';

export interface ChecklistRowProps {
  status: ChecklistRowStatus;
  title: string;
  subtitle: string | React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export const ChecklistRow: React.FC<ChecklistRowProps> = ({
  status,
  title,
  subtitle,
  action,
  className = ''
}) => {
  return (
    <div
      className={`min-h-[52px] py-3.5 px-0.5 border-b border-[#E5E7EB] last:border-b-0 bg-transparent flex items-center justify-between gap-3 text-left transition-colors ${className}`}
    >
      <div className="flex items-start sm:items-center gap-3 min-w-0">
        {/* Status Icon */}
        <div className="shrink-0 mt-0.5 sm:mt-0" aria-hidden="true">
          {status === 'done' && (
            <CheckCircle2 className="w-4 h-4 text-[#059669]" />
          )}
          {status === 'active' && (
            <div className="w-4 h-4 rounded-full border-2 border-[#B45309] bg-[#FEF3C7] flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-[#B45309]" />
            </div>
          )}
          {status === 'todo' && (
            <Circle className="w-4 h-4 text-[#6B7280]" />
          )}
          {status === 'locked' && (
            <Lock className="w-4 h-4 text-[#6B7280]" />
          )}
        </div>

        {/* Content */}
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-medium text-[#0A0A0A] truncate">
            {title}
          </span>
          <div className="text-xs text-[#6B7280] leading-normal truncate">
            {subtitle}
          </div>
        </div>
      </div>

      {/* Right action */}
      {action && (
        <div className="shrink-0">
          {action}
        </div>
      )}
    </div>
  );
};

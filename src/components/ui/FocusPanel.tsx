import React from 'react';
import { Eyebrow } from '../common/Eyebrow';

export interface FocusPanelProps {
  eyebrow?: string;
  title?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const FocusPanel: React.FC<FocusPanelProps> = ({
  eyebrow,
  title,
  action,
  children,
  className = '',
}) => {
  return (
    <div
      className={`w-full bg-[#FAFAFA] rounded-xl p-5 sm:p-6 transition-all duration-150 ${className}`}
    >
      {(eyebrow || title || action) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-[#E5E7EB]">
          <div>
            {eyebrow && <Eyebrow className="mb-1">{eyebrow}</Eyebrow>}
            {title && (
              <h3 className="text-base font-semibold text-[#0A0A0A] tracking-tight">
                {title}
              </h3>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}

      <div>{children}</div>
    </div>
  );
};

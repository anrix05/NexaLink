import React from 'react';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title?: string;
  sentence: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  sentence,
  action,
  className = '',
}) => {
  return (
    <div className={`py-8 sm:py-10 text-left space-y-3 ${className}`}>
      {icon && (
        <div className="w-10 h-10 rounded-lg bg-[#F3F4F6] text-[#0A0A0A] flex items-center justify-center">
          {icon}
        </div>
      )}
      <div className="space-y-1 max-w-lg">
        {title && (
          <h4 className="text-sm font-semibold text-[#0A0A0A]">
            {title}
          </h4>
        )}
        <p className="text-xs sm:text-sm text-[#6B7280] leading-relaxed">
          {sentence}
        </p>
      </div>
      {action && <div className="pt-1">{action}</div>}
    </div>
  );
};

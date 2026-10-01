import React from 'react';

export interface SectionProps {
  title: string;
  count?: number;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  noTopHairline?: boolean;
  className?: string;
}

export const Section: React.FC<SectionProps> = ({
  title,
  count,
  description,
  action,
  children,
  noTopHairline = false,
  className = '',
}) => {
  return (
    <section className={`space-y-4 ${noTopHairline ? '' : 'pt-6 border-t border-[#E5E7EB]'} pb-6 ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-[#0A0A0A] tracking-tight">
              {title}
            </h2>
            {count !== undefined && (
              <span className="text-xs font-semibold text-[#6B7280] tabular-nums">
                ({count})
              </span>
            )}
          </div>
          {description && (
            <p className="text-xs text-[#6B7280] font-normal mt-0.5">
              {description}
            </p>
          )}
        </div>

        {action && (
          <div className="shrink-0 flex items-center">
            {action}
          </div>
        )}
      </div>

      <div>{children}</div>
    </section>
  );
};

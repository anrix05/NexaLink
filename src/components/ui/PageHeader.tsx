import React from 'react';
import { Eyebrow } from '../common/Eyebrow';

export interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  eyebrow,
  title,
  subtitle,
  actions,
  children,
  className = '',
}) => {
  return (
    <div className={`space-y-3 pb-2 ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1">
          {eyebrow && <Eyebrow className="mb-1">{eyebrow}</Eyebrow>}
          <h1 className="text-3xl sm:text-4xl font-display font-bold tracking-[-0.02em] text-[#0A0A0A] leading-tight">
            {title}
          </h1>
          {subtitle && (
            <div className="text-xs sm:text-sm text-[#6B7280] font-normal leading-relaxed">
              {subtitle}
            </div>
          )}
        </div>

        {actions && (
          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            {actions}
          </div>
        )}
      </div>

      {children && <div className="pt-1">{children}</div>}
    </div>
  );
};

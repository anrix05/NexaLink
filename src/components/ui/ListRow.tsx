import React from 'react';

export interface ListRowProps {
  leading?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  meta?: React.ReactNode;
  trailing?: React.ReactNode;
  children?: React.ReactNode;
  onClick?: () => void;
  className?: string;
  isFirst?: boolean;
}

export const ListRow: React.FC<ListRowProps> = ({
  leading,
  title,
  subtitle,
  meta,
  trailing,
  children,
  onClick,
  className = '',
  isFirst = false,
}) => {
  const isInteractive = Boolean(onClick);

  return (
    <div
      onClick={onClick}
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      onKeyDown={e => {
        if (isInteractive && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick?.();
        }
      }}
      className={`min-h-[56px] sm:min-h-[64px] py-3.5 px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5E7EB] transition-colors duration-150 ${
        isFirst ? 'border-t border-[#E5E7EB]' : ''
      } ${
        isInteractive
          ? 'cursor-pointer hover:bg-[#FAFAFA] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0A0A0A] focus-visible:ring-offset-1 select-none'
          : ''
      } ${className}`}
    >
      <div className="flex items-center gap-3.5 min-w-0 flex-1">
        {leading && <div className="shrink-0">{leading}</div>}

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-[#0A0A0A] truncate">
              {title}
            </span>
            {meta && <span className="text-xs text-[#6B7280]">{meta}</span>}
          </div>
          {subtitle && (
            <div className="text-xs text-[#6B7280] font-normal truncate mt-0.5">
              {subtitle}
            </div>
          )}
        </div>
      </div>

      {trailing && (
        <div className="shrink-0 flex items-center gap-2 self-start sm:self-auto">
          {trailing}
        </div>
      )}

      {children}
    </div>
  );
};

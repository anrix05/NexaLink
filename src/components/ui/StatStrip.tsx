import React from 'react';

export interface StatItemProps {
  label: string;
  value: number | string;
  subtext?: string;
  onClick?: () => void;
  trend?: { value: string; positive?: boolean };
}

export const StatItem: React.FC<StatItemProps & { isLast?: boolean }> = ({
  label,
  value,
  subtext,
  onClick,
  trend,
}) => {
  const content = (
    <div
      onClick={onClick}
      className={`p-4 sm:p-5 flex flex-col justify-between transition-colors ${
        onClick ? 'cursor-pointer hover:bg-[#FAFAFA]' : ''
      }`}
    >
      <div className="flex items-center justify-between gap-1 mb-1">
        <span className="text-xs font-medium text-[#6B7280] truncate">{label}</span>
        {trend && (
          <span
            className={`text-[10px] font-semibold tabular-nums px-1.5 py-0.5 rounded ${
              trend.positive ? 'text-[#065F46] bg-[#ECFDF5]' : 'text-[#6B7280] bg-[#F3F4F6]'
            }`}
          >
            {trend.value}
          </span>
        )}
      </div>

      <div className="text-2xl sm:text-3xl font-bold font-sans tracking-tight text-[#0A0A0A] tabular-nums">
        {value}
      </div>

      {subtext && (
        <span className="text-[11px] text-[#6B7280] truncate mt-1">{subtext}</span>
      )}
    </div>
  );

  return content;
};

export interface StatStripProps {
  items: StatItemProps[];
  hideIfAllZero?: boolean;
  zeroFallback?: React.ReactNode;
  className?: string;
}

export const StatStrip: React.FC<StatStripProps> = ({
  items,
  hideIfAllZero = false,
  zeroFallback,
  className = '',
}) => {
  const isAllZero = items.every(
    item => item.value === 0 || item.value === '0' || item.value === ''
  );

  if (hideIfAllZero && isAllZero) {
    return zeroFallback ? <>{zeroFallback}</> : null;
  }

  return (
    <div
      className={`grid grid-cols-2 lg:grid-cols-4 divide-y divide-x sm:divide-y-0 divide-[#E5E7EB] border-y border-[#E5E7EB] bg-white ${className}`}
    >
      {items.map((item, index) => (
        <StatItem key={index} {...item} isLast={index === items.length - 1} />
      ))}
    </div>
  );
};

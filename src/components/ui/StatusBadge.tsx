import React from 'react';

export type StatusTone = 'emerald' | 'amber' | 'rose' | 'indigo' | 'neutral';

export interface StatusBadgeProps {
  label: string;
  icon?: React.ReactNode;
  tone?: StatusTone;
  size?: 'sm' | 'md';
  className?: string;
  title?: string;
}

const TONE_STYLES: Record<StatusTone, string> = {
  emerald: 'bg-[#ECFDF5] text-[#065F46] border-[#A7F3D0]',
  amber: 'bg-[#FEF3C7] text-[#B45309] border-[#FDE68A]',
  rose: 'bg-[#FEE2E2] text-[#991B1B] border-[#FECDD3]',
  indigo: 'bg-[#EEF2FF] text-[#3730A3] border-[#C7D2FE]',
  neutral: 'bg-[#F3F4F6] text-[#374151] border-[#E5E7EB]',
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  label,
  icon,
  tone = 'neutral',
  size = 'md',
  className = '',
  title
}) => {
  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      title={title}
      className={`inline-flex items-center gap-1.5 rounded-full border font-sans font-medium transition-colors ${TONE_STYLES[tone]} ${sizeClass} ${className}`}
    >
      {icon && <span className="shrink-0 flex items-center">{icon}</span>}
      <span className="truncate">{label}</span>
    </span>
  );
};

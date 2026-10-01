import React from 'react';

interface EyebrowProps {
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
}

/**
 * Standard Eyebrow component:
 * Inter 12/16, weight 600, uppercase, tracking 0.06em, maximum 3 words, no mono.
 */
export const Eyebrow: React.FC<EyebrowProps> = ({ children, className = '', dot = false }) => {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[12px] leading-[16px] font-semibold uppercase tracking-[0.06em] text-[#6B7280] font-sans ${className}`}
    >
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-[#0A0A0A]/40" aria-hidden="true" />}
      {children}
    </span>
  );
};

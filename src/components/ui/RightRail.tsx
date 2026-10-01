import React from 'react';

export interface RightRailProps {
  children: React.ReactNode;
  className?: string;
}

export const RightRail: React.FC<RightRailProps> = ({ children, className = '' }) => {
  return (
    <aside
      className={`w-full xl:w-80 shrink-0 space-y-6 pt-6 xl:pt-0 xl:border-l xl:border-[#E5E7EB] xl:pl-6 ${className}`}
    >
      {children}
    </aside>
  );
};

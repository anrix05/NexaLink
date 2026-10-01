import React from 'react';
import { PhotoPanel } from './PhotoPanel';

export interface AuthLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  className = ''
}) => {
  return (
    <div
      className={`w-full min-h-[calc(100svh-64px)] bg-[#FFFFFF] flex flex-col justify-center ${className}`}
    >
      <div className="w-full max-w-[1440px] mx-auto min-h-[calc(100svh-64px)] flex">
        {/* Left column (>= 1024px): 5/12 Photo Panel */}
        <div className="hidden lg:block lg:w-5/12 p-4 shrink-0">
          <PhotoPanel />
        </div>

        {/* Right column (>= 1024px: 7/12) / Centered column (< 1024px) */}
        <div className="w-full lg:w-7/12 flex items-center justify-center px-4 py-8 sm:px-6 md:px-8">
          <div className="w-full max-w-[420px] my-auto">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

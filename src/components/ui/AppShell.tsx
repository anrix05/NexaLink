import React from 'react';
import { TopBar } from './TopBar';
import { SidebarNav } from './SidebarNav';
import { BottomNav } from '../common/BottomNav';

export interface AppShellProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  children: React.ReactNode;
  className?: string;
}

export const AppShell: React.FC<AppShellProps> = ({
  activeTab,
  setActiveTab,
  children,
  className = '',
}) => {
  return (
    <div className="min-h-screen bg-white text-[#0A0A0A] font-sans antialiased flex flex-col">
      {/* Top Bar (64px, hairline bottom, no box) */}
      <TopBar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Workspace Frame with identical Sidebar Geometry for all roles */}
      <div className="flex-1 flex w-full max-w-[1600px] mx-auto items-stretch">
        {/* Sticky Desktop Sidebar (240px wide, single right hairline) */}
        <SidebarNav activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Open Canvas Main Content Area */}
        <main
          id="main-content"
          tabIndex={-1}
          className={`flex-1 min-w-0 ${
            activeTab === 'messaging'
              ? 'p-0 overflow-hidden'
              : 'px-4 sm:px-8 lg:px-10 py-6 sm:py-8 pb-24 lg:pb-12'
          } focus:outline-none ${className}`}
        >
          {children}
        </main>
      </div>

      {/* Mobile Fixed 5-Tab Bottom Navigation (<1024px) */}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
};

import React from 'react';
import { TopBar } from './TopBar';
import { SidebarNav } from './SidebarNav';
import { BottomNav } from '../common/BottomNav';
import { useMobileChrome } from '../../context/MobileChromeContext';

export interface AppShellProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  children: React.ReactNode;
  className?: string;
  hideChrome?: boolean;
}

export const AppShell: React.FC<AppShellProps> = ({
  activeTab,
  setActiveTab,
  children,
  className = '',
  hideChrome: propHideChrome = false,
}) => {
  const { hideMobileChrome } = useMobileChrome();
  const shouldHideMobileChrome = propHideChrome || hideMobileChrome;

  return (
    <div className="min-h-screen bg-white text-[#0A0A0A] font-sans antialiased flex flex-col">
      {/* Top Bar (64px, hairline bottom, no box) - Hidden on mobile for full-screen routes */}
      <div className={shouldHideMobileChrome ? 'hidden lg:block' : 'block'}>
        <TopBar activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>

      {/* Main Workspace Frame with identical Sidebar Geometry for all roles */}
      <div className="flex-1 flex w-full max-w-[1440px] mx-auto items-stretch">
        {/* Sticky Desktop Sidebar (240px wide, single right hairline) */}
        <SidebarNav activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Open Canvas Main Content Area */}
        <main
          id="main-content"
          tabIndex={-1}
          className={`flex-1 min-w-0 ${
            activeTab === 'messaging'
              ? 'p-0 overflow-hidden'
              : shouldHideMobileChrome
                ? 'p-0 sm:px-8 lg:px-10 py-0 sm:py-8 pb-0 lg:pb-12'
                : 'px-4 sm:px-8 lg:px-10 py-6 sm:py-8 pb-[calc(var(--bottomnav-h)+env(safe-area-inset-bottom,0px)+16px)] lg:pb-12'
          } focus:outline-none ${className}`}
        >
          {children}
        </main>
      </div>

      {/* Mobile Fixed 5-Tab Bottom Navigation (<1024px) */}
      {!shouldHideMobileChrome && (
        <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
      )}
    </div>
  );
};

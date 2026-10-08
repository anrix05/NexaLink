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
    <div className="min-h-screen bg-white text-[#0A0A0A] font-sans antialiased flex flex-col scroll-pt-14 lg:scroll-pt-16">
      {/* Top Bar (64px desktop / 56px+safe-area mobile, hairline bottom) */}
      <div className={shouldHideMobileChrome ? 'hidden lg:block' : 'block'}>
        <TopBar activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>

      {/* Full-bleed workspace: SidebarNav flush to left edge (240px, top: 64px, calc(100dvh-64px)) */}
      <div className="flex-1 flex w-full items-stretch min-w-0">
        {/* Sticky Desktop Sidebar */}
        <SidebarNav activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Main Column: centered max-width (1280px) inside remaining space */}
        <main
          id="main-content"
          tabIndex={-1}
          className={`flex-1 min-w-0 ${
            activeTab === 'messaging'
              ? 'p-0 overflow-hidden'
              : shouldHideMobileChrome
                ? 'p-0 sm:px-6 lg:px-8 py-0 sm:py-6 pb-0'
                : 'px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-[calc(64px+env(safe-area-inset-bottom,0px)+16px)] lg:pb-12'
          } focus:outline-none ${className}`}
        >
          <div className={activeTab === 'messaging' ? 'h-full w-full' : 'max-w-[1280px] mx-auto w-full'}>
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Fixed 5-Tab Bottom Navigation (<1024px) */}
      {!shouldHideMobileChrome && (
        <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
      )}
    </div>
  );
};

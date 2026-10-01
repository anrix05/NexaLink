import React from 'react';
import { motion } from 'framer-motion';

export interface TabItem {
  id: string;
  label: string;
  count?: number;
  badge?: React.ReactNode;
}

export interface UnderlineTabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  layoutId?: string;
  className?: string;
}

export const UnderlineTabs: React.FC<UnderlineTabsProps> = ({
  tabs,
  activeTab,
  onChange,
  layoutId = 'underlineTabIndicator',
  className = '',
}) => {
  return (
    <div
      role="tablist"
      className={`flex items-center gap-6 border-b border-[#E5E7EB] overflow-x-auto custom-scrollbar ${className}`}
    >
      {tabs.map(tab => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(tab.id)}
            className={`relative pb-3 pt-1 text-xs sm:text-sm font-medium transition-colors cursor-pointer whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0A0A0A] ${
              isActive ? 'text-[#0A0A0A] font-semibold' : 'text-[#6B7280] hover:text-[#0A0A0A]'
            }`}
          >
            <div className="flex items-center gap-2">
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`text-[10px] tabular-nums font-semibold px-1.5 py-0.2 rounded-full ${
                    isActive ? 'bg-[#0A0A0A] text-white' : 'bg-[#F3F4F6] text-[#6B7280]'
                  }`}
                >
                  {tab.count}
                </span>
              )}
              {tab.badge}
            </div>

            {isActive && (
              <motion.div
                layoutId={layoutId}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                className="absolute bottom-0 inset-x-0 h-[2px] bg-[#0A0A0A]"
              />
            )}
          </button>
        );
      })}
    </div>
  );
};

import React from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import {
  LayoutDashboard,
  UsersRound,
  Briefcase,
  Calendar,
  GraduationCap,
  MessageSquare,
  ShieldCheck,
  Flag,
  Radio,
  FileSpreadsheet,
  History,
  Settings,
  LogOut,
  CheckCircle2
} from 'lucide-react';

export interface SidebarNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  className?: string;
}

export const SidebarNav: React.FC<SidebarNavProps> = ({
  activeTab,
  setActiveTab,
  className = '',
}) => {
  const { currentRole, logout } = useAuth();
  const { messages, pendingUsersList, roleTransitionRequests, jobsList, mentorshipRequests } = useData();

  const unreadMessagesCount = messages.filter(m => !m.isRead).length;
  const pendingVerificationCount = pendingUsersList.length + roleTransitionRequests.filter(r => r.status === 'pending').length;
  const pendingJobsCount = jobsList.filter(j => j.moderationStatus === 'Pending Approval').length;
  const pendingRequestsCount = mentorshipRequests?.filter(r => r.status === 'Pending').length || 0;

  // Canonical Nav Items based on role
  interface NavItemDef {
    id: string;
    label: string;
    icon: React.ReactNode;
    count?: number;
  }

  const getNavItems = (): NavItemDef[] => {
    if (currentRole === 'admin') {
      return [
        { id: 'dashboard', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4 shrink-0" /> },
        { id: 'verification-queue', label: 'Verification', icon: <ShieldCheck className="w-4 h-4 shrink-0" />, count: pendingVerificationCount },
        { id: 'moderation', label: 'Moderation', icon: <Flag className="w-4 h-4 shrink-0" /> },
        { id: 'opportunities', label: 'Opportunities', icon: <Briefcase className="w-4 h-4 shrink-0" />, count: pendingJobsCount },
        { id: 'announcements', label: 'Announcements', icon: <Radio className="w-4 h-4 shrink-0" /> },
        { id: 'reports', label: 'Reports & accreditation', icon: <FileSpreadsheet className="w-4 h-4 shrink-0" /> },
        { id: 'audit-log', label: 'Audit log', icon: <History className="w-4 h-4 shrink-0" /> },
      ];
    }

    return [
      { id: 'dashboard', label: 'Home', icon: <LayoutDashboard className="w-4 h-4 shrink-0" /> },
      { id: 'directory', label: 'Directory', icon: <UsersRound className="w-4 h-4 shrink-0" /> },
      { id: 'opportunities', label: 'Opportunities', icon: <Briefcase className="w-4 h-4 shrink-0" /> },
      { id: 'events', label: 'Events', icon: <Calendar className="w-4 h-4 shrink-0" /> },
      { id: 'mentorship', label: 'Mentorship', icon: <GraduationCap className="w-4 h-4 shrink-0" />, count: pendingRequestsCount > 0 ? pendingRequestsCount : undefined },
      { id: 'messaging', label: 'Messages', icon: <MessageSquare className="w-4 h-4 shrink-0" />, count: unreadMessagesCount > 0 ? unreadMessagesCount : undefined },
    ];
  };

  const navItems = getNavItems();

  const isItemActive = (id: string) => {
    if (activeTab === id) return true;
    if (id === 'verification-queue' && (activeTab === 'verification' || activeTab === 'verification-queue')) return true;
    if (id === 'audit-log' && (activeTab === 'audit' || activeTab === 'audit-log')) return true;
    if (id === 'opportunities' && (activeTab === 'jobs')) return true;
    if (id === 'mentorship' && (activeTab === 'guidance')) return true;
    return false;
  };

  return (
    <aside
      className={`hidden lg:flex flex-col w-[240px] shrink-0 h-[calc(100vh-4rem)] sticky top-16 bg-white border-r border-[#E5E7EB] justify-between py-6 px-3 select-none ${className}`}
    >
      {/* Navigation Links */}
      <div className="space-y-1 overflow-y-auto custom-scrollbar flex-1 pr-1">
        {navItems.map(item => {
          const active = isItemActive(item.id);
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`relative w-full h-11 px-3 rounded-lg flex items-center justify-between text-xs font-medium transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0A0A0A] ${
                active
                  ? 'bg-[#F3F4F6] text-[#0A0A0A] font-semibold'
                  : 'text-[#6B7280] hover:bg-[#FAFAFA] hover:text-[#0A0A0A]'
              }`}
            >
              {/* Active left 2px bar */}
              {active && (
                <motion.div
                  layoutId="activeSidebarIndicator"
                  transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                  className="absolute left-0 top-2 bottom-2 w-[2px] bg-[#0A0A0A] rounded-r"
                />
              )}

              <div className="flex items-center gap-3">
                <span className={active ? 'text-[#0A0A0A]' : 'text-[#6B7280]'}>
                  {item.icon}
                </span>
                <span className="truncate">{item.label}</span>
              </div>

              {item.count !== undefined && item.count > 0 && (
                <span className="text-[10px] font-semibold tabular-nums px-1.5 py-0.2 rounded-full bg-[#0A0A0A] text-white">
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer Area: Settings, System Status, Log out */}
      <div className="pt-4 border-t border-[#E5E7EB] space-y-1">
        {/* System Status Indicator (for admin / institutional peace-of-mind) */}
        <div className="px-3 py-1.5 flex items-center gap-2 text-[11px] text-[#6B7280]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#065F46] inline-block shrink-0" />
          <span>All systems normal</span>
        </div>

        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          className={`w-full h-10 px-3 rounded-lg flex items-center gap-3 text-xs font-medium transition-colors cursor-pointer ${
            activeTab === 'settings'
              ? 'bg-[#F3F4F6] text-[#0A0A0A] font-semibold'
              : 'text-[#6B7280] hover:bg-[#FAFAFA] hover:text-[#0A0A0A]'
          }`}
        >
          <Settings className="w-4 h-4 shrink-0 text-[#6B7280]" />
          <span>Settings</span>
        </button>

        <button
          type="button"
          onClick={logout}
          className="w-full h-10 px-3 rounded-lg flex items-center gap-3 text-xs font-medium text-[#6B7280] hover:bg-[#FAFAFA] hover:text-[#991B1B] transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>Log out</span>
        </button>
      </div>
    </aside>
  );
};

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
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
} from 'lucide-react';

export interface SidebarNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  newOpportunitiesCount?: number;
  className?: string;
}

export const SidebarNav: React.FC<SidebarNavProps> = ({
  activeTab,
  setActiveTab,
  newOpportunitiesCount,
  className = '',
}) => {
  const { currentRole, currentUser, logout } = useAuth();
  const { messages, pendingUsersList, roleTransitionRequests, jobsList, mentorshipRequests } = useData();
  const shouldReduceMotion = useReducedMotion();

  // Unread badge counts only incoming unread messages intended for the current user
  const unreadMessagesCount = messages.filter(
    m => !m.isRead && currentUser && m.receiverId === currentUser.id
  ).length;
  const pendingVerificationCount = pendingUsersList.length + roleTransitionRequests.filter(r => r.status === 'pending').length;
  const pendingJobsCount = jobsList.filter(j => j.moderationStatus === 'Pending Approval').length;
  
  // Mentorship badge semantics:
  // - Student: requests whose status changed to Accepted or Declined and have not been seen
  // - Mentor (Alumni/Faculty): incoming requests in 'Pending' status
  const mentorshipBadgeCount = React.useMemo(() => {
    if (!currentUser) return 0;
    if (currentRole === 'student') {
      return (mentorshipRequests || []).filter(
        r => r.studentId === currentUser.id && (r.status === 'Accepted' || r.status === 'Declined') && !r.seenAt
      ).length;
    }
    if (currentRole === 'faculty' || currentRole === 'teacher' || currentRole === 'alumni') {
      return (mentorshipRequests || []).filter(
        r => r.mentorId === currentUser.id && r.status === 'Pending' && !r.seenAt
      ).length;
    }
    return 0;
  }, [currentUser, currentRole, mentorshipRequests]);

  // Canonical Nav Items based on role
  interface NavItemDef {
    id: string;
    label: string;
    icon: React.ReactNode;
    count?: number;
    countAriaLabel?: string;
  }

  const getNavItems = (): NavItemDef[] => {
    if (currentRole === 'admin') {
      return [
        { id: 'dashboard', label: 'Overview', icon: <LayoutDashboard className="w-5 h-5 shrink-0" /> },
        { id: 'verification-queue', label: 'Verification', icon: <ShieldCheck className="w-5 h-5 shrink-0" />, count: pendingVerificationCount },
        { id: 'moderation', label: 'Moderation', icon: <Flag className="w-5 h-5 shrink-0" /> },
        { id: 'opportunities', label: 'Opportunities', icon: <Briefcase className="w-5 h-5 shrink-0" />, count: pendingJobsCount },
        { id: 'announcements', label: 'Announcements', icon: <Radio className="w-5 h-5 shrink-0" /> },
        { id: 'reports', label: 'Reports & accreditation', icon: <FileSpreadsheet className="w-5 h-5 shrink-0" /> },
        { id: 'audit-log', label: 'Audit log', icon: <History className="w-5 h-5 shrink-0" /> },
      ];
    }

    return [
      { id: 'dashboard', label: 'Home', icon: <LayoutDashboard className="w-5 h-5 shrink-0" /> },
      { id: 'directory', label: 'Directory', icon: <UsersRound className="w-5 h-5 shrink-0" /> },
      {
        id: 'opportunities',
        label: 'Opportunities',
        icon: <Briefcase className="w-5 h-5 shrink-0" />,
        count: (newOpportunitiesCount && newOpportunitiesCount > 0) ? newOpportunitiesCount : undefined,
        countAriaLabel: `${newOpportunitiesCount} new opportunities`
      },
      { id: 'events', label: 'Events', icon: <Calendar className="w-5 h-5 shrink-0" /> },
      {
        id: 'mentorship',
        label: 'Mentorship',
        icon: <GraduationCap className="w-5 h-5 shrink-0" />,
        count: mentorshipBadgeCount > 0 ? mentorshipBadgeCount : undefined,
        countAriaLabel: `${mentorshipBadgeCount} pending mentorship items`
      },
      {
        id: 'messaging',
        label: 'Messages',
        icon: <MessageSquare className="w-5 h-5 shrink-0" />,
        count: unreadMessagesCount > 0 ? unreadMessagesCount : undefined,
        countAriaLabel: `${unreadMessagesCount} unread chats`
      },
    ];
  };

  const navItems = getNavItems();

  const isItemActive = (id: string) => {
    if (activeTab === id) return true;
    if (id === 'dashboard' && (activeTab === 'dashboard' || activeTab === 'home')) return true;
    if (id === 'verification-queue' && (activeTab === 'verification' || activeTab === 'verification-queue')) return true;
    if (id === 'audit-log' && (activeTab === 'audit' || activeTab === 'audit-log')) return true;
    if (id === 'opportunities' && (activeTab === 'jobs' || activeTab === 'opportunities')) return true;
    if (id === 'mentorship' && (activeTab === 'guidance' || activeTab === 'mentorship')) return true;
    if (id === 'messaging' && (activeTab === 'messages' || activeTab === 'chat' || activeTab === 'messaging')) return true;
    return false;
  };

  const isMessaging = isItemActive('messaging');

  const formatBadge = (num?: number) => {
    if (!num || num <= 0) return null;
    return num > 99 ? '99+' : String(num);
  };

  return (
    <aside
      className={`hidden lg:flex flex-col ${
        isMessaging ? 'w-[72px] xl:w-[240px] px-2 xl:px-3' : 'w-[240px] px-3'
      } shrink-0 h-[calc(100dvh-64px)] sticky top-16 bg-white border-r border-[#E5E7EB] justify-between py-4 select-none transition-all duration-200 overflow-y-auto ${className}`}
    >
      {/* Primary Group */}
      <div className="space-y-1 overflow-y-auto custom-scrollbar flex-1 pr-0.5">
        {navItems.map(item => {
          const active = isItemActive(item.id);
          const badgeText = formatBadge(item.count);

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              title={isMessaging ? item.label : undefined}
              aria-current={active ? 'page' : undefined}
              className={`relative w-full h-11 px-3 rounded-lg flex items-center justify-between text-sm font-medium transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0A0A0A] ${
                active
                  ? 'bg-[#FAFAFA] text-[#0A0A0A] font-semibold'
                  : 'text-[#6B7280] hover:bg-[#FAFAFA] hover:text-[#0A0A0A]'
              }`}
            >
              {/* Active left 3px bar #0A0A0A */}
              {active && (
                <motion.div
                  layoutId={shouldReduceMotion ? undefined : "activeSidebarIndicator"}
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  className="absolute left-0 top-1.5 bottom-1.5 w-[3px] bg-[#0A0A0A] rounded-r"
                />
              )}

              <div className={`flex items-center gap-3 ${isMessaging ? 'justify-center xl:justify-start w-full' : ''}`}>
                <span className={active ? 'text-[#0A0A0A]' : 'text-[#6B7280]'}>
                  {item.icon}
                </span>
                <span className={`truncate text-sm font-medium ${isMessaging ? 'hidden xl:inline' : ''}`}>
                  {item.label}
                </span>
              </div>

              {badgeText && (
                <span
                  aria-label={item.countAriaLabel || `${badgeText} updates`}
                  className={`text-[11px] font-semibold tabular-nums px-1.5 py-0.5 rounded-full bg-[#0A0A0A] text-white shrink-0 ${
                    isMessaging ? 'hidden xl:inline' : ''
                  }`}
                >
                  {badgeText}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom Group: Separated by a 1px hairline */}
      <div className="pt-3 border-t border-[#E5E7EB] space-y-1 shrink-0">
        {/* System Status Indicator (strictly admin only per Section 3.3) */}
        {currentRole === 'admin' && (
          <div className={`px-3 py-1.5 flex items-center gap-2 text-[11px] text-[#6B7280] ${isMessaging ? 'hidden xl:flex' : ''}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-[#065F46] inline-block shrink-0" />
            <span>All systems normal</span>
          </div>
        )}

        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          title={isMessaging ? 'Settings' : undefined}
          aria-current={activeTab === 'settings' ? 'page' : undefined}
          className={`relative w-full h-11 px-3 rounded-lg flex items-center gap-3 text-sm font-medium transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0A0A0A] ${
            activeTab === 'settings'
              ? 'bg-[#FAFAFA] text-[#0A0A0A] font-semibold'
              : 'text-[#6B7280] hover:bg-[#FAFAFA] hover:text-[#0A0A0A]'
          } ${isMessaging ? 'justify-center xl:justify-start' : ''}`}
        >
          {activeTab === 'settings' && (
            <motion.div
              layoutId={shouldReduceMotion ? undefined : "activeSidebarIndicator"}
              transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              className="absolute left-0 top-1.5 bottom-1.5 w-[3px] bg-[#0A0A0A] rounded-r"
            />
          )}
          <Settings className="w-5 h-5 shrink-0 text-[#6B7280]" />
          <span className={`truncate text-sm font-medium ${isMessaging ? 'hidden xl:inline' : ''}`}>Settings</span>
        </button>

        <button
          type="button"
          onClick={logout}
          title={isMessaging ? 'Sign out' : undefined}
          className={`w-full h-11 px-3 rounded-lg flex items-center gap-3 text-sm font-medium text-[#6B7280] hover:bg-[#FAFAFA] hover:text-[#DC2626] transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0A0A0A] ${
            isMessaging ? 'justify-center xl:justify-start' : ''
          }`}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          <span className={`truncate text-sm font-medium ${isMessaging ? 'hidden xl:inline' : ''}`}>Sign out</span>
        </button>
      </div>
    </aside>
  );
};

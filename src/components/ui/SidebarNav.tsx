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
  const { currentRole, currentUser, logout } = useAuth();
  const { messages, pendingUsersList, roleTransitionRequests, jobsList, mentorshipRequests } = useData();

  // Unread badge counts only incoming unread messages intended for the current user
  const unreadMessagesCount = messages.filter(
    m => !m.isRead && currentUser && m.receiverId === currentUser.id
  ).length;
  const pendingVerificationCount = pendingUsersList.length + roleTransitionRequests.filter(r => r.status === 'pending').length;
  const pendingJobsCount = jobsList.filter(j => j.moderationStatus === 'Pending Approval').length;
  
  // Mentorship badge semantics (Task D):
  // - Student: requests whose status changed to Accepted or Declined and have not been seen (seenAt is null/empty)
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
      {
        id: 'mentorship',
        label: 'Mentorship',
        icon: <GraduationCap className="w-4 h-4 shrink-0" />,
        count: mentorshipBadgeCount > 0 ? mentorshipBadgeCount : undefined,
        countAriaLabel: `${mentorshipBadgeCount} unread mentorship updates`
      },
      {
        id: 'messaging',
        label: 'Messages',
        icon: <MessageSquare className="w-4 h-4 shrink-0" />,
        count: unreadMessagesCount > 0 ? unreadMessagesCount : undefined,
        countAriaLabel: `${unreadMessagesCount} unread messages`
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

  return (
    <aside
      className={`hidden lg:flex flex-col ${
        isMessaging ? 'w-[72px] xl:w-[240px] px-2 xl:px-3' : 'w-[240px] px-3'
      } shrink-0 h-[calc(100vh-4rem)] sticky top-16 bg-white border-r border-[#E5E7EB] justify-between py-6 select-none transition-all duration-200 ${className}`}
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
              title={isMessaging ? item.label : undefined}
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

              <div className={`flex items-center gap-3 ${isMessaging ? 'justify-center xl:justify-start w-full' : ''}`}>
                <span className={active ? 'text-[#0A0A0A]' : 'text-[#6B7280]'}>
                  {item.icon}
                </span>
                <span className={`truncate ${isMessaging ? 'hidden xl:inline' : ''}`}>{item.label}</span>
              </div>

              {item.count !== undefined && item.count > 0 && (
                <span
                  aria-label={item.countAriaLabel || `${item.count} updates`}
                  className={`text-[10px] font-semibold tabular-nums px-1.5 py-0.5 rounded-full bg-[#0A0A0A] text-white ${
                    isMessaging ? 'hidden xl:inline' : ''
                  }`}
                >
                  {item.count > 9 ? '9+' : item.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer Area: Settings, System Status (Admin only), Sign out */}
      <div className="pt-4 border-t border-[#E5E7EB] space-y-1">
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
          className={`w-full h-10 px-3 rounded-lg flex items-center gap-3 text-xs font-medium transition-colors cursor-pointer ${
            activeTab === 'settings'
              ? 'bg-[#F3F4F6] text-[#0A0A0A] font-semibold'
              : 'text-[#6B7280] hover:bg-[#FAFAFA] hover:text-[#0A0A0A]'
          } ${isMessaging ? 'justify-center xl:justify-start' : ''}`}
        >
          <Settings className="w-4 h-4 shrink-0 text-[#6B7280]" />
          <span className={`truncate ${isMessaging ? 'hidden xl:inline' : ''}`}>Settings</span>
        </button>

        <button
          type="button"
          onClick={logout}
          title={isMessaging ? 'Sign out' : undefined}
          className={`w-full h-10 px-3 rounded-lg flex items-center gap-3 text-xs font-medium text-[#6B7280] hover:bg-[#FAFAFA] hover:text-[#991B1B] transition-colors cursor-pointer ${
            isMessaging ? 'justify-center xl:justify-start' : ''
          }`}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span className={`truncate ${isMessaging ? 'hidden xl:inline' : ''}`}>Sign out</span>
        </button>
      </div>
    </aside>
  );
};

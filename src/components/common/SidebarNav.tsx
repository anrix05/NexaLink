import React from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import {
  LayoutDashboard,
  UsersRound,
  MessageSquare,
  Briefcase,
  GraduationCap,
  ShieldCheck,
  FileSpreadsheet,
  ChevronRight
} from 'lucide-react';
import { Avatar } from './UIComponents';

interface SidebarNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const SidebarNav: React.FC<SidebarNavProps> = ({ activeTab, setActiveTab }) => {
  const { currentUser, currentRole } = useAuth();
  const { messages, pendingUsersList, roleTransitionRequests, jobsList, auditLogs } = useData();

  if (!currentUser) return null;

  const unreadMessagesCount = messages.filter(
    m => m.receiverId === currentUser.id && !m.isRead
  ).length;

  const pendingVerificationCount = pendingUsersList.length + roleTransitionRequests.filter(r => r.status === 'pending').length;
  const pendingJobsCount = jobsList.filter(j => j.moderationStatus === 'Pending Approval').length;
  
  const lastAuditLog = auditLogs.length > 0 ? auditLogs[auditLogs.length - 1] : null;
  const getRelativeAuditTime = () => {
    if (!lastAuditLog || !lastAuditLog.timestamp) return 'No recent activity';
    const diffMs = Date.now() - new Date(lastAuditLog.timestamp).getTime();
    const diffMinutes = Math.max(1, Math.floor(diffMs / 60000));
    if (diffMinutes < 60) return `Last activity ${diffMinutes} min ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `Last activity ${diffHours}h ago`;
    return `Last activity ${Math.floor(diffHours / 24)}d ago`;
  };

  const isOpportunitiesActive = activeTab === 'opportunities' || activeTab === 'jobs' || activeTab === 'events';

  const navItemClass = (isActive: boolean) => {
    return `relative w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg transition-colors duration-150 text-xs font-medium cursor-pointer ${
      isActive
        ? 'text-white'
        : 'text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#0A0A0A]'
    }`;
  };

  const iconClass = (isActive: boolean) => {
    return `w-4 h-4 transition-colors shrink-0 ${
      isActive ? 'text-white' : 'text-[#6B7280]'
    }`;
  };

  return (
    <aside className="hidden lg:flex flex-col w-full bg-white border border-[#E5E7EB] rounded-xl h-[calc(100vh-140px)] min-h-[580px] max-h-[860px] justify-between overflow-hidden">
      
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3">
        
        {/* Section Eyebrow */}
        <div className="px-2 pt-1 pb-3">
          <span className="text-xs font-semibold uppercase tracking-[0.06em] text-[#6B7280] block">
            Workspace
          </span>
          <span className="text-xs text-[#0A0A0A] block mt-0.5 capitalize font-medium">
            {currentRole}
          </span>
        </div>

        <nav className="space-y-1">
          
          {/* Canonical Nav 1: Home */}
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className={navItemClass(activeTab === 'dashboard')}
          >
            {activeTab === 'dashboard' && (
              <motion.div
                layoutId="activeSidebarTab"
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                className="absolute inset-0 bg-[#0A0A0A] rounded-lg z-0"
              />
            )}
            <div className="relative z-10 flex items-center gap-3">
              <LayoutDashboard className={iconClass(activeTab === 'dashboard')} />
              <span>Home</span>
            </div>
          </button>

          {/* Non-Admin Destinations */}
          {currentRole !== 'admin' && (
            <>
              {/* Canonical Nav 2: Directory */}
              <button
                type="button"
                onClick={() => setActiveTab('directory')}
                className={navItemClass(activeTab === 'directory')}
              >
                {activeTab === 'directory' && (
                  <motion.div
                    layoutId="activeSidebarTab"
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                    className="absolute inset-0 bg-[#0A0A0A] rounded-lg z-0"
                  />
                )}
                <div className="relative z-10 flex items-center gap-3">
                  <UsersRound className={iconClass(activeTab === 'directory')} />
                  <span>Directory</span>
                </div>
              </button>

              {/* Canonical Nav 3: Opportunities (Unified Hub: Jobs & Internships / Events & Talks) */}
              <button
                type="button"
                onClick={() => setActiveTab('opportunities')}
                className={navItemClass(isOpportunitiesActive)}
              >
                {isOpportunitiesActive && (
                  <motion.div
                    layoutId="activeSidebarTab"
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                    className="absolute inset-0 bg-[#0A0A0A] rounded-lg z-0"
                  />
                )}
                <div className="relative z-10 flex items-center gap-3">
                  <Briefcase className={iconClass(isOpportunitiesActive)} />
                  <span>Opportunities</span>
                </div>
              </button>

              {/* Canonical Nav 4: Guidance */}
              <button
                type="button"
                onClick={() => setActiveTab('mentorship')}
                className={navItemClass(activeTab === 'mentorship')}
              >
                {activeTab === 'mentorship' && (
                  <motion.div
                    layoutId="activeSidebarTab"
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                    className="absolute inset-0 bg-[#0A0A0A] rounded-lg z-0"
                  />
                )}
                <div className="relative z-10 flex items-center gap-3">
                  <GraduationCap className={iconClass(activeTab === 'mentorship')} />
                  <span>Guidance</span>
                </div>
              </button>

              {/* Canonical Nav 5: Chats */}
              <button
                type="button"
                onClick={() => setActiveTab('messaging')}
                className={navItemClass(activeTab === 'messaging')}
              >
                {activeTab === 'messaging' && (
                  <motion.div
                    layoutId="activeSidebarTab"
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                    className="absolute inset-0 bg-[#0A0A0A] rounded-lg z-0"
                  />
                )}
                <div className="relative z-10 flex items-center gap-3">
                  <MessageSquare className={iconClass(activeTab === 'messaging')} />
                  <span>Chats</span>
                </div>
                {unreadMessagesCount > 0 ? (
                  <span className={`relative z-10 px-2 py-0.5 rounded-full text-[11px] tabular-nums font-medium ${
                    activeTab === 'messaging'
                      ? 'bg-white text-[#0A0A0A]'
                      : 'bg-[#0A0A0A] text-white'
                  }`}>
                    {unreadMessagesCount}
                  </span>
                ) : null}
              </button>
            </>
          )}

          {/* Admin Governance Suite */}
          {currentRole === 'admin' && (
            <div className="pt-3 border-t border-[#E5E7EB] mt-2 space-y-1">
              <span className="text-xs font-semibold uppercase tracking-[0.06em] text-[#6B7280] px-2 block mb-2">
                Governance
              </span>

              <button
                type="button"
                onClick={() => setActiveTab('opportunities')}
                className={navItemClass(isOpportunitiesActive)}
              >
                {isOpportunitiesActive && (
                  <motion.div
                    layoutId="activeSidebarTab"
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                    className="absolute inset-0 bg-[#0A0A0A] rounded-lg z-0"
                  />
                )}
                <div className="relative z-10 flex items-center gap-3">
                  <Briefcase className={iconClass(isOpportunitiesActive)} />
                  <span>Opportunities</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('admin-console')}
                className={navItemClass(activeTab === 'admin-console')}
              >
                {activeTab === 'admin-console' && (
                  <motion.div
                    layoutId="activeSidebarTab"
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                    className="absolute inset-0 bg-[#0A0A0A] rounded-lg z-0"
                  />
                )}
                <div className="relative z-10 flex items-center gap-3">
                  <ShieldCheck className={iconClass(activeTab === 'admin-console')} />
                  <span>Audit & verification</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('reports')}
                className={navItemClass(activeTab === 'reports')}
              >
                {activeTab === 'reports' && (
                  <motion.div
                    layoutId="activeSidebarTab"
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                    className="absolute inset-0 bg-[#0A0A0A] rounded-lg z-0"
                  />
                )}
                <div className="relative z-10 flex items-center gap-3">
                  <FileSpreadsheet className={iconClass(activeTab === 'reports')} />
                  <span>Reports & accreditation</span>
                </div>
              </button>

              {/* Compact Admin System Status Panel */}
              <div className="mx-0.5 mt-4 p-3 bg-[#FAFAFA] border border-[#E5E7EB] rounded-lg space-y-2 font-sans">
                <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-1.5">
                  <span className="text-[11px] font-medium text-[#0A0A0A] flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#065F46]" />
                    System status
                  </span>
                  <span className="text-[10px] font-medium text-[#6B7280]">Healthy</span>
                </div>

                <div className="space-y-1 text-xs">
                  <div className="flex items-center justify-between text-[#374151]">
                    <span>Pending verifications</span>
                    <span className={`tabular-nums font-semibold ${pendingVerificationCount > 0 ? 'text-[#B45309]' : 'text-[#0A0A0A]'}`}>
                      {pendingVerificationCount}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[#374151]">
                    <span>Job moderations</span>
                    <span className={`tabular-nums font-semibold ${pendingJobsCount > 0 ? 'text-[#B45309]' : 'text-[#0A0A0A]'}`}>
                      {pendingJobsCount}
                    </span>
                  </div>

                  <div className="pt-1 border-t border-[#E5E7EB] text-[11px] text-[#6B7280]">
                    <span>{getRelativeAuditTime()}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

        </nav>
      </div>

      {/* User Identity Card at Bottom */}
      <div className="p-3 border-t border-[#E5E7EB]">
        <div
          onClick={() => setActiveTab('settings')}
          className="p-2 rounded-lg bg-white border border-[#E5E7EB] flex items-center justify-between cursor-pointer hover:bg-[#FAFAFA] transition-colors"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <Avatar name={currentUser.name} src={currentUser.avatar} size="sm" />
            <div className="min-w-0">
              <h4 className="font-medium text-xs text-[#0A0A0A] truncate">
                {currentUser.name}
              </h4>
              <p className="text-[11px] text-[#6B7280] truncate">
                {currentUser.email || `${currentUser.name.toLowerCase().replace(/\s+/g, '.')}@vit.edu.in`}
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[#6B7280] shrink-0" />
        </div>
      </div>

    </aside>
  );
};

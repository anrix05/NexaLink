import React from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import {
  LayoutDashboard,
  UsersRound,
  MessageSquare,
  Calendar,
  Briefcase,
  GraduationCap,
  ShieldCheck,
  FileSpreadsheet,
  User,
  ChevronRight
} from 'lucide-react';

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
  const lastAuditTime = lastAuditLog ? new Date(lastAuditLog.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Live';

  const navItemClass = (tabKey: string) => {
    const isActive = activeTab === tabKey;
    return `relative w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-colors duration-150 text-xs font-bold uppercase tracking-[0.08em] cursor-pointer ${
      isActive
        ? 'text-white'
        : 'text-[#6B6B6B] hover:bg-[#F5F5F5] hover:text-[#0A0A0A]'
    }`;
  };

  const iconClass = (tabKey: string) => {
    return `w-4 h-4 transition-colors ${
      activeTab === tabKey ? 'text-white' : 'text-[#6B6B6B]'
    }`;
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <>
      {/* DESKTOP SIDEBAR NAV — Smooth Rounded Corners */}
      <aside className="hidden lg:flex flex-col w-full bg-white border border-[#E5E5E5] rounded-2xl h-[calc(100vh-140px)] min-h-[580px] max-h-[860px] justify-between overflow-hidden shadow-2xs">
        
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3">
          
          {/* Header Caption */}
          <div className="px-2 pt-1 pb-3">
            <span className="text-[10px] font-mono font-bold uppercase tracking-[0.08em] text-[#9CA3AF] block">
              Workspace
            </span>
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#9CA3AF] block mt-0.5 font-semibold">
              {currentRole}
            </span>
          </div>

          <nav className="space-y-1">
            
            {/* Dashboard */}
            <button
              onClick={() => setActiveTab('dashboard')}
              className={navItemClass('dashboard')}
            >
              {activeTab === 'dashboard' && (
                <motion.div
                  layoutId="activeSidebarTab"
                  transition={{ type: 'spring', stiffness: 450, damping: 22 }}
                  className="absolute inset-0 bg-[#0A0A0A] rounded-xl z-0"
                />
              )}
              <div className="relative z-10 flex items-center gap-3">
                <LayoutDashboard className={iconClass('dashboard')} />
                <span>Dashboard</span>
              </div>
            </button>

            {/* My Profile */}
            <button
              onClick={() => setActiveTab('settings')}
              className={navItemClass('settings')}
            >
              {activeTab === 'settings' && (
                <motion.div
                  layoutId="activeSidebarTab"
                  transition={{ type: 'spring', stiffness: 450, damping: 22 }}
                  className="absolute inset-0 bg-[#0A0A0A] rounded-xl z-0"
                />
              )}
              <div className="relative z-10 flex items-center gap-3">
                <User className={iconClass('settings')} />
                <span>My Profile</span>
              </div>
            </button>

            {/* Directory */}
            {currentRole !== 'admin' && (
              <button
                onClick={() => setActiveTab('directory')}
                className={navItemClass('directory')}
              >
                {activeTab === 'directory' && (
                  <motion.div
                    layoutId="activeSidebarTab"
                    transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                    className="absolute inset-0 bg-[#0A0A0A] rounded-xl z-0"
                  />
                )}
                <div className="relative z-10 flex items-center gap-3">
                  <UsersRound className={iconClass('directory')} />
                  <span>{currentRole === 'faculty' ? 'Alumni Directory' : 'Alumni & Faculty'}</span>
                </div>
              </button>
            )}

            {/* Mentorship Requests */}
            {currentRole !== 'admin' && (
              <button
                onClick={() => setActiveTab('mentorship')}
                className={navItemClass('mentorship')}
              >
                {activeTab === 'mentorship' && (
                  <motion.div
                    layoutId="activeSidebarTab"
                    transition={{ type: 'spring', stiffness: 450, damping: 22 }}
                    className="absolute inset-0 bg-[#0A0A0A] rounded-xl z-0"
                  />
                )}
                <div className="relative z-10 flex items-center gap-3">
                  <GraduationCap className={iconClass('mentorship')} />
                  <span>
                    {currentRole === 'student'
                      ? 'Find a Mentor'
                      : 'Guidance & Mentees'}
                  </span>
                </div>
              </button>
            )}

            {/* Opportunities */}
            {currentRole !== 'admin' && (
              <button
                onClick={() => setActiveTab('jobs')}
                className={navItemClass('jobs')}
              >
                {activeTab === 'jobs' && (
                  <motion.div
                    layoutId="activeSidebarTab"
                    transition={{ type: 'spring', stiffness: 450, damping: 22 }}
                    className="absolute inset-0 bg-[#0A0A0A] rounded-xl z-0"
                  />
                )}
                <div className="relative z-10 flex items-center gap-3">
                  <Briefcase className={iconClass('jobs')} />
                  <span>
                    {currentRole === 'alumni' || currentRole === 'faculty'
                      ? 'Post / Share Job'
                      : 'Opportunities'}
                  </span>
                </div>
              </button>
            )}

            {/* Events & Talks */}
            <button
              onClick={() => setActiveTab('events')}
              className={navItemClass('events')}
            >
              {activeTab === 'events' && (
                <motion.div
                  layoutId="activeSidebarTab"
                  transition={{ type: 'spring', stiffness: 450, damping: 22 }}
                  className="absolute inset-0 bg-[#0A0A0A] rounded-xl z-0"
                />
              )}
              <div className="relative z-10 flex items-center gap-3">
                <Calendar className={iconClass('events')} />
                <span>Events & Talks</span>
              </div>
            </button>

            {/* NexaChats */}
            {currentRole !== 'admin' && (
              <button
                onClick={() => setActiveTab('messaging')}
                className={navItemClass('messaging')}
              >
                {activeTab === 'messaging' && (
                  <motion.div
                    layoutId="activeSidebarTab"
                    transition={{ type: 'spring', stiffness: 450, damping: 22 }}
                    className="absolute inset-0 bg-[#0A0A0A] rounded-xl z-0"
                  />
                )}
                <div className="relative z-10 flex items-center gap-3">
                  <MessageSquare className={iconClass('messaging')} />
                  <span>NexaChats</span>
                </div>
                {unreadMessagesCount > 0 ? (
                  <span className={`relative z-10 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                    activeTab === 'messaging'
                      ? 'bg-white text-[#0A0A0A]'
                      : 'bg-[#0A0A0A] text-white'
                  }`}>
                    {unreadMessagesCount}
                  </span>
                ) : null}
              </button>
            )}

            {/* Admin Governance Suite */}
            {currentRole === 'admin' && (
              <div className="pt-3 border-t border-[#E5E5E5] mt-2 space-y-1">
                <span className="text-[10px] font-mono font-bold uppercase tracking-[0.08em] text-[#9CA3AF] px-2 block mb-2">
                  Governance Suite
                </span>
                <button
                  onClick={() => setActiveTab('admin-console')}
                  className={navItemClass('admin-console')}
                >
                  {activeTab === 'admin-console' && (
                    <motion.div
                      layoutId="activeSidebarTab"
                      transition={{ type: 'spring', stiffness: 450, damping: 22 }}
                      className="absolute inset-0 bg-[#0A0A0A] rounded-xl z-0"
                    />
                  )}
                  <div className="relative z-10 flex items-center gap-3">
                    <ShieldCheck className={iconClass('admin-console')} />
                    <span>Audit & Verification</span>
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab('reports')}
                  className={navItemClass('reports')}
                >
                  {activeTab === 'reports' && (
                    <motion.div
                      layoutId="activeSidebarTab"
                      transition={{ type: 'spring', stiffness: 450, damping: 22 }}
                      className="absolute inset-0 bg-[#0A0A0A] rounded-xl z-0"
                    />
                  )}
                  <div className="relative z-10 flex items-center gap-3">
                    <FileSpreadsheet className={iconClass('reports')} />
                    <span>Reports & Accreditation</span>
                  </div>
                </button>

                {/* Compact Admin System Status Panel to fill sidebar dead space */}
                <div className="mx-0.5 mt-4 p-3 bg-[#FAFAFA] border border-[#E5E5E5] rounded-xl space-y-2 font-sans">
                  <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-1.5">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#0A0A0A] flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] animate-pulse" />
                      System Status
                    </span>
                    <span className="text-[9px] font-mono font-bold text-[#6B7280]">LIVE</span>
                  </div>

                  <div className="space-y-1 text-[11px] font-medium">
                    <div className="flex items-center justify-between text-[#374151]">
                      <span>Pending Verifications</span>
                      <span className={`font-mono font-bold ${pendingVerificationCount > 0 ? 'text-[#B45309]' : 'text-[#0A0A0A]'}`}>
                        {pendingVerificationCount}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[#374151]">
                      <span>Job Moderations</span>
                      <span className={`font-mono font-bold ${pendingJobsCount > 0 ? 'text-[#B45309]' : 'text-[#0A0A0A]'}`}>
                        {pendingJobsCount}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[#374151]">
                      <span>Last Audit Log</span>
                      <span className="font-mono text-[10px] text-[#6B7280]">
                        {lastAuditTime}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </nav>
        </div>

        {/* User Identity Card at Bottom — Rounded */}
        <div className="p-3 border-t border-[#E5E5E5]">
          <div
            onClick={() => setActiveTab('settings')}
            className="p-2.5 rounded-xl bg-white border border-[#E5E5E5] flex items-center justify-between cursor-pointer hover:bg-[#F8F8F8] transition-colors"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {currentUser.avatar && !currentUser.avatar.includes('default') ? (
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-9 h-9 rounded-full object-cover border border-[#E5E5E5] shrink-0"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-[#0A0A0A] text-white flex items-center justify-center font-bold text-xs shrink-0">
                  {getInitials(currentUser.name)}
                </div>
              )}
              <div className="min-w-0">
                <h4 className="font-bold text-xs text-[#0A0A0A] truncate">
                  {currentUser.name}
                </h4>
                <p className="text-[10px] font-mono text-[#9CA3AF] truncate">
                  {currentUser.email || `${currentUser.name.toLowerCase().replace(/\s+/g, '.')}@example.com`}
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#9CA3AF] shrink-0" />
          </div>
        </div>

      </aside>
    </>
  );
};

import React, { useState, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useMobileChrome } from '../../context/MobileChromeContext';
import {
  LayoutDashboard,
  UsersRound,
  Briefcase,
  GraduationCap,
  MessageSquare
} from 'lucide-react';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab }) => {
  const { currentRole, currentUser, isAuthenticated } = useAuth();
  const { messages, mentorshipRequests } = useData();
  const { hideMobileChrome } = useMobileChrome();
  const shouldReduceMotion = useReducedMotion();

  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  // Detect virtual keyboard via window.visualViewport
  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return;
    const handleViewportResize = () => {
      const vv = window.visualViewport;
      if (vv) {
        // When on-screen keyboard is open, visualViewport height shrinks significantly
        const isKeyboard = vv.height < window.innerHeight * 0.75;
        setIsKeyboardOpen(isKeyboard);
      }
    };
    window.visualViewport.addEventListener('resize', handleViewportResize);
    return () => window.visualViewport?.removeEventListener('resize', handleViewportResize);
  }, []);

  // Bottom navigation is strictly for non-admin roles and authenticated portal views
  if (
    !isAuthenticated ||
    !currentUser ||
    currentRole === 'admin' ||
    activeTab === 'landing' ||
    activeTab === 'auth' ||
    activeTab === 'reset-password' ||
    hideMobileChrome ||
    isKeyboardOpen
  ) {
    return null;
  }

  const unreadMessagesCount = messages.filter(
    m => m.receiverId === currentUser.id && !m.isRead
  ).length;

  const mentorshipBadgeCount = (() => {
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
  })();

  interface NavDestination {
    id: string;
    label: string;
    icon: React.ReactNode;
    badge?: number;
    ariaBadgeLabel?: string;
  }

  // 5 Canonical tabs: Home, Directory, Opportunities, Mentorship, Chats
  const destinations: NavDestination[] = [
    { id: 'dashboard', label: 'Home', icon: <LayoutDashboard className="w-6 h-6" /> },
    { id: 'directory', label: 'Directory', icon: <UsersRound className="w-6 h-6" /> },
    { id: 'opportunities', label: 'Opportunities', icon: <Briefcase className="w-6 h-6" /> },
    {
      id: 'mentorship',
      label: 'Mentorship',
      icon: <GraduationCap className="w-6 h-6" />,
      badge: mentorshipBadgeCount > 0 ? mentorshipBadgeCount : undefined,
      ariaBadgeLabel: `${mentorshipBadgeCount} pending mentorship items`
    },
    {
      id: 'messaging',
      label: 'Chats',
      icon: <MessageSquare className="w-6 h-6" />,
      badge: unreadMessagesCount > 0 ? unreadMessagesCount : undefined,
      ariaBadgeLabel: `${unreadMessagesCount} unread chats`
    }
  ];

  return (
    <nav
      aria-label="Primary"
      className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#E5E7EB] lg:hidden select-none h-16 pb-[env(safe-area-inset-bottom)] box-content"
    >
      <div className="max-w-md mx-auto px-1 h-16 grid grid-cols-5 items-stretch">
        {destinations.map((item) => {
          const isActive =
            activeTab === item.id ||
            (item.id === 'opportunities' && (activeTab === 'jobs' || activeTab === 'opportunities'));

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`relative flex flex-col items-center justify-center w-full h-full min-h-[48px] py-1 text-center cursor-pointer transition-colors duration-150 touch-target-44 min-w-0 ${
                isActive ? 'text-[#0A0A0A]' : 'text-[#6B7280] hover:text-[#0A0A0A]'
              }`}
            >
              {/* Active Tab Sliding 2px Top Indicator */}
              {isActive && (
                <motion.div
                  layoutId={shouldReduceMotion ? undefined : "bottomNavActiveIndicator"}
                  transition={{ type: 'spring', stiffness: 450, damping: 30 }}
                  className="absolute -top-[1px] inset-x-2 sm:inset-x-3 h-[2px] bg-[#0A0A0A] rounded-full"
                />
              )}

              <div className="relative">
                <span className={isActive ? 'text-[#0A0A0A]' : 'text-[#6B7280]'}>
                  {item.icon}
                </span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    aria-label={item.ariaBadgeLabel || `${item.badge} updates`}
                    className="absolute -top-1 -right-2.5 min-w-[16px] h-4 px-1 rounded-full bg-[#0A0A0A] text-white text-[10px] tabular-nums font-semibold flex items-center justify-center ring-2 ring-white"
                  >
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>

              <span
                className={`text-[11px] font-sans mt-0.5 transition-all block w-full px-0.5 truncate text-center ${
                  isActive ? 'font-semibold text-[#0A0A0A]' : 'font-medium text-[#6B7280]'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

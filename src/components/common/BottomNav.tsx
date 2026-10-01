import React from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
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
  const { messages } = useData();

  // Bottom navigation is strictly for non-admin roles and authenticated portal views
  if (!isAuthenticated || !currentUser || currentRole === 'admin' || activeTab === 'landing' || activeTab === 'auth' || activeTab === 'reset-password') {
    return null;
  }

  const unreadMessagesCount = messages.filter(
    m => m.receiverId === currentUser.id && !m.isRead
  ).length;

  interface NavDestination {
    id: string;
    label: string;
    icon: React.ReactNode;
    badge?: number;
  }

  // Nav labels identical for all roles that see them: Home, Directory, Opportunities, Guidance, Chats
  const destinations: NavDestination[] = [
    { id: 'dashboard', label: 'Home', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'directory', label: 'Directory', icon: <UsersRound className="w-5 h-5" /> },
    { id: 'opportunities', label: 'Opportunities', icon: <Briefcase className="w-5 h-5" /> },
    { id: 'mentorship', label: 'Guidance', icon: <GraduationCap className="w-5 h-5" /> },
    { id: 'messaging', label: 'Chats', icon: <MessageSquare className="w-5 h-5" />, badge: unreadMessagesCount }
  ];

  return (
    <nav
      aria-label="Mobile Bottom Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E5E7EB] lg:hidden pb-safe select-none"
    >
      <div className="max-w-md mx-auto px-1 h-14 grid grid-cols-5 items-center">
        {destinations.map((item) => {
          const isActive =
            activeTab === item.id ||
            (item.id === 'opportunities' && (activeTab === 'jobs' || activeTab === 'events' || activeTab === 'opportunities'));

          return (
            <motion.button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              whileTap={{ scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              className={`relative flex flex-col items-center justify-center w-full h-full py-1 text-center cursor-pointer transition-colors duration-150 touch-target-44 min-w-0 ${
                isActive ? 'text-[#0A0A0A]' : 'text-[#6B7280] hover:text-[#0A0A0A]'
              }`}
            >
              {/* Active Tab Sliding Pill Indicator */}
              {isActive && (
                <motion.div
                  layoutId="bottomNavActiveTab"
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  className="absolute -top-[1px] inset-x-2 sm:inset-x-3 h-[2px] bg-[#0A0A0A] rounded-full"
                />
              )}

              <div className="relative">
                {item.icon}
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-[#0A0A0A] text-white text-[10px] tabular-nums font-semibold flex items-center justify-center ring-2 ring-white">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>

              <span
                className={`text-[10px] font-sans mt-1 transition-all block w-full px-0.5 truncate text-center ${
                  isActive ? 'font-medium text-[#0A0A0A]' : 'font-normal text-[#6B7280]'
                }`}
              >
                {item.label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
};

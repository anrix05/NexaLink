import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  Briefcase,
  Calendar,
  Megaphone,
  UserCheck,
  ShieldCheck,
  ShieldAlert,
  X,
  ArrowRight
} from 'lucide-react';
import type { NotificationItem } from '../../types';
import { formatRelativeTime } from '../../utils/notificationHelpers';

interface NotificationToastProps {
  notification: NotificationItem | null;
  onDismiss: () => void;
  onClick: (notification: NotificationItem) => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  notification,
  onDismiss,
  onClick
}) => {
  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => {
      onDismiss();
    }, 6000);
    return () => clearTimeout(timer);
  }, [notification, onDismiss]);

  if (!notification) return null;

  const renderIcon = () => {
    const cat = notification.category?.toLowerCase() || '';
    const type = notification.type?.toLowerCase() || '';

    if (cat === 'opportunity' || type.includes('opportunity') || type.includes('job') || type.includes('internship')) {
      return <Briefcase className="w-4 h-4 text-emerald-600 shrink-0" />;
    }
    if (cat === 'event' || type.includes('event')) {
      return <Calendar className="w-4 h-4 text-indigo-600 shrink-0" />;
    }
    if (cat === 'announcement' || type.includes('announcement')) {
      return <Megaphone className="w-4 h-4 text-amber-600 shrink-0" />;
    }
    if (cat === 'mentorship' || type.includes('mentorship')) {
      return <UserCheck className="w-4 h-4 text-blue-600 shrink-0" />;
    }
    if (cat === 'verification' || type.includes('verification')) {
      return <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />;
    }
    if (cat === 'admin' || type.includes('admin')) {
      return <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />;
    }
    return <Bell className="w-4 h-4 text-[#0A0A0A] shrink-0" />;
  };

  return (
    <aside
      aria-label="Real-time Notification"
      className="fixed top-4 right-4 z-99999 flex flex-col max-w-sm w-full pointer-events-none px-4 sm:px-0"
    >
      <AnimatePresence>
        <motion.div
          key={notification.id}
          initial={{ opacity: 0, y: -16, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="pointer-events-auto bg-white border border-[#E5E7EB] rounded-xl p-3.5 shadow-lg shadow-black/5 hover:border-[#D1D5DB] transition cursor-pointer group"
          onClick={() => onClick(notification)}
        >
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB] flex items-center justify-center shrink-0 mt-0.5">
              {renderIcon()}
            </div>

            <div className="flex-1 min-w-0 pr-1">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-xs font-semibold text-[#0A0A0A] truncate">
                  {notification.title}
                </h4>
                <span className="text-[10px] text-[#9CA3AF] whitespace-nowrap">
                  {formatRelativeTime(notification.created_at)}
                </span>
              </div>
              <p className="text-xs text-[#4B5563] line-clamp-2 mt-0.5 leading-relaxed">
                {notification.body}
              </p>

              <div className="flex items-center gap-1 text-[11px] text-[#0A0A0A] font-medium mt-2 group-hover:translate-x-0.5 transition-transform">
                <span>View</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </div>

            <button
              type="button"
              aria-label="Dismiss notification"
              onClick={(e) => {
                e.stopPropagation();
                onDismiss();
              }}
              className="text-[#9CA3AF] hover:text-[#0A0A0A] p-1 rounded-md hover:bg-[#F3F4F6] transition shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </aside>
  );
};

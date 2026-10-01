import React from 'react';
import type { VerificationActivityItem } from '../../services/authService';
import { formatIstTimestamp } from '../../utils/dateUtils';
import { CheckCircle2, FileText, ArrowRight, AlertCircle } from 'lucide-react';

export interface ActivityListProps {
  activity: VerificationActivityItem[];
  className?: string;
}

export const ActivityList: React.FC<ActivityListProps> = ({
  activity,
  className = ''
}) => {
  if (!activity || activity.length === 0) return null;

  const getActivityIcon = (type: VerificationActivityItem['type']) => {
    switch (type) {
      case 'submitted':
      case 'decision':
        return <CheckCircle2 className="w-3.5 h-3.5 text-[#059669]" />;
      case 'document_received':
        return <FileText className="w-3.5 h-3.5 text-[#6B7280]" />;
      case 'clarification_requested':
        return <AlertCircle className="w-3.5 h-3.5 text-[#B45309]" />;
      case 'moved_to_review':
      case 'resubmitted':
      default:
        return <ArrowRight className="w-3.5 h-3.5 text-[#6B7280]" />;
    }
  };

  return (
    <div className={`w-full flex flex-col gap-3 ${className}`}>
      <h2 className="text-sm font-medium text-[#0A0A0A]">
        Activity
      </h2>

      <div className="rounded-lg border border-[#E5E7EB] bg-[#FFFFFF] p-4 flex flex-col gap-3">
        {activity.slice(0, 5).map((item, index) => {
          const isLast = index === Math.min(activity.length, 5) - 1;

          return (
            <div key={item.id || index} className="flex items-start gap-3 relative">
              {/* Connector line between dots */}
              {!isLast && (
                <div className="absolute left-[7px] top-[18px] bottom-[-12px] w-[1px] bg-[#E5E7EB] -z-0" />
              )}

              {/* Icon / Bullet */}
              <div className="shrink-0 mt-0.5 z-10 bg-[#FFFFFF]">
                {getActivityIcon(item.type)}
              </div>

              {/* Text & Timestamp */}
              <div className="flex-1 flex items-baseline justify-between gap-2 min-w-0">
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-medium text-[#0A0A0A] truncate">
                    {item.title}
                  </span>
                  {item.description && (
                    <span className="text-[11px] text-[#6B7280] truncate mt-0.5">
                      {item.description}
                    </span>
                  )}
                </div>

                <span className="text-[11px] text-[#6B7280] shrink-0 font-sans">
                  {formatIstTimestamp(item.timestamp)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

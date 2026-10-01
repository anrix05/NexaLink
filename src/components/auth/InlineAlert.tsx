import React from 'react';
import { AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';

export interface InlineAlertProps {
  tone: 'rose' | 'emerald';
  title?: string;
  message: string | React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export const InlineAlert: React.FC<InlineAlertProps> = ({
  tone,
  title,
  message,
  action,
  className = ''
}) => {
  const isError = tone === 'rose';

  return (
    <div
      role={isError ? 'alert' : 'status'}
      aria-live="polite"
      className={`w-full p-3.5 rounded-lg border text-sm flex items-start gap-3 transition-colors ${
        isError
          ? 'bg-[#FEF2F2] border-[#FECDD3] text-[#991B1B]'
          : 'bg-[#ECFDF5] border-[#A7F3D0] text-[#065F46]'
      } ${className}`}
    >
      <div className="shrink-0 mt-0.5" aria-hidden="true">
        {isError ? (
          <AlertCircle className="w-4 h-4 text-[#DC2626]" />
        ) : (
          <CheckCircle2 className="w-4 h-4 text-[#059669]" />
        )}
      </div>

      <div className="flex-1 flex flex-col gap-1 leading-snug">
        {title && <span className="font-medium text-inherit">{title}</span>}
        <div className="text-xs text-inherit opacity-95">{message}</div>
        {action && <div className="mt-1">{action}</div>}
      </div>
    </div>
  );
};

// ============================================================================
// NEXALINK V2.8: Invite to Connect Sheet / Dialog
// ============================================================================

import React, { useState, useEffect } from 'react';
import { BaseSheet } from './BaseSheet';
import type { DiscoverableStudent } from './types';
import { Send, AlertCircle, CheckCircle2 } from 'lucide-react';

interface InviteSheetProps {
  isOpen: boolean;
  onClose: () => void;
  student: DiscoverableStudent | null;
  remainingQuota: number;
  onSend: (studentId: string, reason: string) => Promise<{ success: boolean; remainingQuota: number; error?: string }>;
}

export const InviteSheet: React.FC<InviteSheetProps> = ({
  isOpen,
  onClose,
  student,
  remainingQuota,
  onSend
}) => {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setReason('');
      setErrorMessage(null);
      setIsSuccess(false);
    }
  }, [isOpen, student]);

  if (!student) return null;

  const firstName = student.name.split(' ')[0] || student.name;
  const trimmed = reason.trim();
  const charCount = trimmed.length;
  const isValidLength = charCount >= 20 && charCount <= 200;
  const isOutOfQuota = remainingQuota <= 0;

  const handleSend = async () => {
    if (!isValidLength || isSubmitting || isOutOfQuota) return;
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await onSend(student.id, trimmed);
      if (res.success) {
        setIsSuccess(true);
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setErrorMessage(res.error || 'Failed to send invitation. Please try again.');
      }
    } catch (e: any) {
      setErrorMessage(e?.message || 'Network error occurred while sending invitation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BaseSheet
      isOpen={isOpen}
      onClose={onClose}
      title={`Invite ${firstName} to connect`}
      ariaLabelledBy="invite-sheet-title"
      footer={
        <div className="space-y-2.5">
          {/* Character counter & Quota indicator in one line */}
          <div className="flex items-center justify-between text-xs text-[#6B7280]">
            <span className={charCount > 0 && !isValidLength ? 'text-[#B45309] font-medium' : ''}>
              {charCount}/200 {charCount < 20 ? '(min 20)' : ''}
            </span>
            <span className={isOutOfQuota ? 'text-[#B45309] font-medium' : 'font-medium text-[#0A0A0A]'}>
              {remainingQuota} of 5 invitations left this week
            </span>
          </div>

          {/* Primary Action Button */}
          <button
            type="button"
            disabled={!isValidLength || isSubmitting || isOutOfQuota || isSuccess}
            onClick={handleSend}
            className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-[#0A0A0A] text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed [@media(hover:hover)]:hover:bg-[#262626] active:scale-[0.98]"
          >
            {isSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Invitation sent</span>
              </>
            ) : isSubmitting ? (
              <span>Sending invitation...</span>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Send invitation</span>
              </>
            )}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Student Context Banner */}
        <div className="bg-[#FAFAFA] border border-[#E5E7EB] rounded-xl p-3.5 space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold text-xs text-[#0A0A0A]">{student.name}</span>
            <span className="text-[11px] text-[#6B7280]">
              {student.department} · {student.currentYear}
            </span>
          </div>
          {student.careerGoal && (
            <p className="text-xs text-[#6B7280] line-clamp-2">
              <span className="font-medium text-[#0A0A0A]">Goal: </span>
              {student.careerGoal}
            </p>
          )}
        </div>

        {/* Informational Guidance */}
        <p className="text-xs text-[#6B7280] leading-relaxed">
          Students stay in control. Conversations only open after the student accepts your invitation.
        </p>

        {/* Reason Textarea (16px on mobile to avoid iOS Safari zoom) */}
        <div>
          <label htmlFor="invite-reason" className="block text-xs font-semibold text-[#0A0A0A] mb-1.5">
            Reason for reaching out <span className="text-[#6B7280] font-normal">(required)</span>
          </label>
          <textarea
            id="invite-reason"
            rows={4}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Say why you're reaching out and how you can help."
            className="w-full text-base lg:text-xs text-[#0A0A0A] bg-white border-2 border-[#D1D5DB] focus:border-[#0A0A0A] rounded-xl p-3 resize-none transition-colors focus:outline-none placeholder-[#9CA3AF]"
          />
        </div>

        {/* Error notification */}
        {errorMessage && (
          <div className="p-3 bg-[#FEF2F2] border border-[#FCA5A5] rounded-xl flex items-start gap-2.5 text-xs text-[#991B1B]">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <p className="leading-relaxed">{errorMessage}</p>
          </div>
        )}
      </div>
    </BaseSheet>
  );
};

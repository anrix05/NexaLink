import React from 'react';
import { ChecklistRow } from './ChecklistRow';
import type { VerificationStatePayload } from '../../services/authService';
import { formatIstTimestamp, formatIstDate } from '../../utils/dateUtils';
import type { GateDerivedState } from './ReviewStatusHero';

export interface OnboardingChecklistProps {
  state: VerificationStatePayload;
  derivedState: GateDerivedState;
  onUploadClick?: () => void;
  onVerifyRecoveryClick: () => void;
  className?: string;
}

export const OnboardingChecklist: React.FC<OnboardingChecklistProps> = ({
  state,
  derivedState,
  onVerifyRecoveryClick,
  className = ''
}) => {
  const isPending = state.status === 'Pending Verification' || state.status === 'Needs Clarification';
  const emailVerified = state.recoveryEmailVerified;
  const maskedEmail = state.recoveryEmailMasked || 'personal email';

  // Format submission date & time
  const submittedStr = `Submitted ${formatIstTimestamp(state.submittedAt)}`;

  return (
    <div className={`w-full flex flex-col gap-2 ${className}`}>
      <div className="flex items-center justify-between pb-1">
        <h2 className="text-sm font-medium text-[#0A0A0A]">
          What happens next
        </h2>
        {state.queueAhead !== undefined && state.queueAhead > 0 && isPending && (
          <span className="text-xs text-[#6B7280]">
            {state.queueAhead} {state.queueAhead === 1 ? 'application' : 'applications'} ahead of you
          </span>
        )}
      </div>

      <div className="flex flex-col border-t border-[#E5E7EB]">
        {/* Row 1: Registration submitted */}
        <ChecklistRow
          status="done"
          title="Registration submitted"
          subtitle={submittedStr}
        />

        {/* Row 2: Recovery email verification */}
        <ChecklistRow
          status={emailVerified ? 'done' : 'active'}
          title="Recovery email"
          subtitle={
            emailVerified
              ? `Verified (${maskedEmail})`
              : `Code sent to ${maskedEmail}`
          }
          action={
            !emailVerified ? (
              <button
                type="button"
                onClick={onVerifyRecoveryClick}
                className="text-xs font-medium text-[#0A0A0A] hover:underline px-2 py-1 rounded focus:outline-none focus:ring-2 focus:ring-[#0A0A0A] min-h-[44px] flex items-center"
              >
                Enter code
              </button>
            ) : undefined
          }
        />

        {/* Row 3: Administrator review */}
        <ChecklistRow
          status={
            state.status === 'Verified'
              ? 'done'
              : derivedState === 'in_review' || (derivedState as any) === 'action_needed'
              ? 'active'
              : 'locked'
          }
          title="Administrator review"
          subtitle={
            state.status === 'Verified'
              ? 'Verification complete'
              : `Expected by ${state.etaAt}`
          }
        />
      </div>
    </div>
  );
};


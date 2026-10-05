import React from 'react';
import { useReducedMotion } from 'framer-motion';
import { Eyebrow } from '../common/Eyebrow';
import { StatusBadge } from '../ui/StatusBadge';
import {
  AlertCircle,
  Clock,
  XCircle,
  CheckCircle2,
  Lock,
  Check
} from 'lucide-react';
import { AnimatedCheckIcon } from '../common/UIComponents';

export type GateDerivedState =
  | 'in_review'
  | 'action_needed'
  | 'rejected'
  | 'verified'
  | 'needs_clarification'
  | 'needs_document'
  | 'needs_recovery_email';

export interface ReviewStatusHeroProps {
  state: GateDerivedState;
  hideStepper?: boolean;
  className?: string;
}

interface StateContent {
  h1: string;
  subtitle: string;
  badgeLabel: string;
  badgeTone: 'amber' | 'rose' | 'emerald';
  badgeIcon: React.ReactNode;
}

const STATE_CONFIG: Record<GateDerivedState, StateContent> = {
  in_review: {
    h1: "We're reviewing your account",
    subtitle: "Administrators are checking your details against institutional records. You'll get an email as soon as there's an update.",
    badgeLabel: 'In review',
    badgeTone: 'amber',
    badgeIcon: <Clock className="w-3.5 h-3.5" />
  },
  action_needed: {
    h1: 'The administrator needs one more thing',
    subtitle: 'Please provide the requested document to complete your verification.',
    badgeLabel: 'Action needed',
    badgeTone: 'amber',
    badgeIcon: <AlertCircle className="w-3.5 h-3.5" />
  },
  needs_clarification: {
    h1: 'The administrator needs one more thing',
    subtitle: 'Please provide the requested document to complete your verification.',
    badgeLabel: 'Action needed',
    badgeTone: 'amber',
    badgeIcon: <AlertCircle className="w-3.5 h-3.5" />
  },
  needs_document: {
    h1: "We're reviewing your account",
    subtitle: "Administrators are checking your details against institutional records. You'll get an email as soon as there's an update.",
    badgeLabel: 'In review',
    badgeTone: 'amber',
    badgeIcon: <Clock className="w-3.5 h-3.5" />
  },
  needs_recovery_email: {
    h1: "We're reviewing your account",
    subtitle: "Administrators are checking your details against institutional records. Confirm your recovery email to ensure access.",
    badgeLabel: 'In review',
    badgeTone: 'amber',
    badgeIcon: <Clock className="w-3.5 h-3.5" />
  },
  rejected: {
    h1: "We couldn't verify this registration",
    subtitle: 'Your details could not be matched against current institutional records.',
    badgeLabel: 'Declined',
    badgeTone: 'rose',
    badgeIcon: <XCircle className="w-3.5 h-3.5" />
  },
  verified: {
    h1: "You're verified",
    subtitle: 'Welcome to NexaLink. Your account is now fully approved.',
    badgeLabel: 'Verified',
    badgeTone: 'emerald',
    badgeIcon: <CheckCircle2 className="w-3.5 h-3.5" />
  }
};

export interface VerificationStepperProps {
  isVerified: boolean;
  isRejected: boolean;
  isAmber?: boolean;
  className?: string;
}

export const VerificationStepper: React.FC<VerificationStepperProps> = ({
  isVerified,
  isRejected,
  className = ''
}) => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className={`w-full pt-2 pb-4 ${className}`}>
      <div className="relative flex items-center justify-between w-full max-w-[520px]">
        {/* Connector Line 1 (Node 1 to Node 2) */}
        <div className="absolute left-[24px] right-[50%] top-4 -translate-y-1/2 h-[2px] bg-[#0A0A0A] -z-0" />

        {/* Connector Line 2 (Node 2 to Node 3) */}
        <div
          className={`absolute left-[50%] right-[24px] top-4 -translate-y-1/2 h-[2px] transition-colors duration-300 -z-0 ${
            isVerified ? 'bg-[#059669]' : 'bg-[#E5E7EB]'
          }`}
        />

        {/* Node 1: Registration (Always Done) */}
        <div className="flex flex-col items-center gap-2 z-10">
          <div className="w-8 h-8 rounded-full bg-[#0A0A0A] text-[#FFFFFF] flex items-center justify-center border-2 border-[#FFFFFF] shadow-sm">
            <Check className="w-4 h-4" />
          </div>
          <span className="text-xs font-medium text-[#0A0A0A]">
            Registration
          </span>
        </div>

        {/* Node 2: Verification (Active pulse or Verified check or Rejected X) */}
        <div className="flex flex-col items-center gap-2 z-10">
          <div className="relative flex items-center justify-center">
            {/* Active Aura Pulse (disabled under reduced motion) */}
            {!isVerified && !isRejected && !shouldReduceMotion && (
              <div className="absolute -inset-1 rounded-full bg-[#B45309]/20 animate-ping" />
            )}
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center border-2 border-[#FFFFFF] shadow-sm transition-colors ${
                isVerified
                  ? 'bg-[#059669] text-[#FFFFFF]'
                  : isRejected
                  ? 'bg-[#DC2626] text-[#FFFFFF]'
                  : 'bg-[#FEF3C7] text-[#B45309] border-[#FDE68A]'
              }`}
            >
              {isVerified ? (
                <AnimatedCheckIcon size={16} />
              ) : isRejected ? (
                <XCircle className="w-4 h-4" />
              ) : (
                <Clock className="w-4 h-4" />
              )}
            </div>
          </div>
          <span className={`text-xs font-medium ${isVerified ? 'text-[#059669]' : isRejected ? 'text-[#DC2626]' : 'text-[#0A0A0A]'}`}>
            {isVerified ? 'Verified' : isRejected ? 'Declined' : 'Verification'}
          </span>
        </div>

        {/* Node 3: Access portal (Locked or Unlocked) */}
        <div className="flex flex-col items-center gap-2 z-10">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center border-2 border-[#FFFFFF] shadow-sm transition-colors ${
              isVerified
                ? 'bg-[#0A0A0A] text-[#FFFFFF]'
                : 'bg-[#FAFAFA] text-[#6B7280] border-[#E5E7EB]'
            }`}
          >
            {isVerified ? (
              <Check className="w-4 h-4" />
            ) : (
              <Lock className="w-3.5 h-3.5" />
            )}
          </div>
          <span className={`text-xs ${isVerified ? 'font-medium text-[#0A0A0A]' : 'text-[#6B7280]'}`}>
            Access portal
          </span>
        </div>
      </div>
    </div>
  );
};

export const ReviewStatusHero: React.FC<ReviewStatusHeroProps> = ({
  state,
  hideStepper = false,
  className = ''
}) => {
  const config = STATE_CONFIG[state] || STATE_CONFIG.in_review;
  const isVerified = state === 'verified';
  const isRejected = state === 'rejected';

  return (
    <div className={`w-full flex flex-col gap-6 ${className}`}>
      {/* Eyebrow & Status Badge Row */}
      <div className="flex items-center justify-between">
        <Eyebrow>Account review</Eyebrow>
        <StatusBadge
          label={config.badgeLabel}
          icon={config.badgeIcon}
          tone={config.badgeTone}
          size="md"
        />
      </div>

      {/* Headings */}
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl sm:text-3xl font-serif font-normal text-[#0A0A0A] tracking-tight leading-snug">
          {config.h1}
        </h1>
        <p className="text-sm text-[#6B7280] leading-relaxed max-w-[560px]">
          {config.subtitle}
        </p>
      </div>

      {/* Connected 3-Node Stepper (can be hidden if rendered below FocusPanel) */}
      {!hideStepper && (
        <VerificationStepper
          isVerified={isVerified}
          isRejected={isRejected}
        />
      )}
    </div>
  );
};

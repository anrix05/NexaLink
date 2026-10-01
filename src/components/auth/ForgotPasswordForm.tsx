import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, RefreshCw, Mail, CheckCircle2 } from 'lucide-react';
import { FormField } from './FormField';
import { TextInput } from './TextInput';
import { InlineAlert } from './InlineAlert';
import { authService } from '../../services/authService';

export interface ForgotPasswordFormProps {
  onBackToSignIn: () => void;
  onProceedToReset?: () => void;
  className?: string;
}

export const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({
  onBackToSignIn,
  onProceedToReset,
  className = ''
}) => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError(null);

    const trimmed = email.trim();
    if (!trimmed) {
      setEmailError('Please enter your email address.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setEmailError('Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);
    try {
      await authService.requestPasswordReset(trimmed);
      // Always show neutral confirmation regardless of whether account exists
      setIsSubmitted(true);
    } catch {
      setIsSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`w-full flex flex-col gap-6 ${className}`}>
      {/* Back button */}
      <div>
        <button
          type="button"
          onClick={onBackToSignIn}
          className="text-xs text-[#6B7280] hover:text-[#0A0A0A] inline-flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-[#0A0A0A] rounded p-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to sign in</span>
        </button>
      </div>

      {/* Headings */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl sm:text-3xl font-serif font-normal text-[#0A0A0A] tracking-tight leading-tight">
          Reset password
        </h1>
        <p className="text-sm text-[#6B7280] leading-relaxed">
          Enter the email linked to your VIT Wadala account to receive password reset instructions.
        </p>
      </div>

      {/* Neutral Confirmation Screen */}
      {isSubmitted ? (
        <div className="flex flex-col gap-4">
          <InlineAlert
            tone="emerald"
            title="Check your inbox"
            message="If an account exists for that email, we've sent a reset link. Please check your institutional or personal inbox."
          />

          <div className="pt-2 flex flex-col gap-3">
            <button
              type="button"
              onClick={onBackToSignIn}
              className="w-full h-12 rounded-lg bg-[#0A0A0A] text-[#FFFFFF] text-sm font-medium hover:bg-[#262626] transition-colors inline-flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-[#0A0A0A]"
            >
              <span>Return to sign in</span>
            </button>

            {/* In DEV mode only, show a shortcut to test Set New Password screen */}
            {import.meta.env.DEV && onProceedToReset && (
              <button
                type="button"
                onClick={onProceedToReset}
                className="w-full h-10 rounded-lg border border-dashed border-[#E5E7EB] bg-[#FAFAFA] text-xs text-[#6B7280] hover:text-[#0A0A0A] hover:border-[#6B7280]"
              >
                [Dev Only] Preview "Set a new password" screen
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Email Request Form */
        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          <FormField
            id="reset-email"
            label="Email address"
            hint="We'll send a secure password recovery link."
            error={emailError}
            required
          >
            <TextInput
              id="reset-email"
              type="email"
              inputMode="email"
              autoComplete="username"
              placeholder="e.g. yourname@student.vit.edu.in"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailError) setEmailError(null);
              }}
              disabled={isSubmitting}
              isInvalid={Boolean(emailError)}
            />
          </FormField>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              aria-busy={isSubmitting}
              className="w-full h-12 rounded-lg bg-[#0A0A0A] text-[#FFFFFF] text-sm font-medium hover:bg-[#262626] transition-colors inline-flex items-center justify-center gap-2 whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-[#0A0A0A] focus:ring-offset-2 disabled:bg-[#FAFAFA] disabled:text-[#6B7280] disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin shrink-0" aria-hidden="true" />
                  <span>Sending reset link...</span>
                </>
              ) : (
                <>
                  <span>Send reset link</span>
                  <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

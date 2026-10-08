import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, RefreshCw, KeyRound, CheckCircle2 } from 'lucide-react';
import { FormField } from './FormField';
import { TextInput } from './TextInput';
import { PasswordField } from './PasswordField';
import { OtpInput } from './OtpInput';
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
  const [phase, setPhase] = useState<'email' | 'otp' | 'password'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Loading & error states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // 1. Send Recovery Email / OTP (Rule 1)
  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError(null);

    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      setEmailError('Please enter your registered email address.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setEmailError('Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await authService.requestPasswordReset(trimmed);
      if (!res.ok) {
        setEmailError(res.error || 'Unable to send recovery code.');
        setIsSubmitting(false);
        return;
      }
      setPhase('otp');
    } catch (err: any) {
      setEmailError(err.message || 'Unable to send recovery code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. Verify Recovery OTP (Rule 1 & Rule 2: Server checks OTP)
  const handleVerifyOtp = async (code: string) => {
    setIsVerifyingOtp(true);
    setOtpError(null);

    try {
      const res = await authService.verifyRecoveryOtp(email.trim().toLowerCase(), code);
      if (res.ok) {
        setOtpError(null);
        if (onProceedToReset) {
          onProceedToReset();
        } else {
          setPhase('password');
        }
      } else {
        setOtpError(res.error || 'Invalid or expired verification code.');
      }
    } catch (err: any) {
      setOtpError(err.message || 'Verification failed. Please try again.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // Resend recovery OTP with 60-second cooldown (Rule 1 & Rule 5)
  const handleResendOtp = async () => {
    setOtpError(null);
    try {
      const res = await authService.resendRecoveryOtp(email.trim().toLowerCase());
      if (!res.ok) {
        setOtpError(res.error || 'Failed to resend recovery code.');
      }
    } catch (err: any) {
      setOtpError(err.message || 'Failed to resend recovery code.');
    }
  };

  // 3. Update Password (Rule 1)
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (!password || password.length < 10) {
      setPasswordError('Password must be at least 10 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await authService.updatePassword(password);
      if (!res.ok) {
        setPasswordError(res.error || 'Failed to update password.');
        setIsSubmitting(false);
        return;
      }
      setIsSuccess(true);
      setTimeout(() => {
        onBackToSignIn();
      }, 1800);
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to update password.');
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
          onClick={() => {
            if (phase === 'otp') setPhase('email');
            else if (phase === 'password') setPhase('otp');
            else onBackToSignIn();
          }}
          className="text-xs text-[#6B7280] hover:text-[#0A0A0A] inline-flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-[#0A0A0A] rounded p-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{phase === 'email' ? 'Back to sign in' : 'Back'}</span>
        </button>
      </div>

      {/* Headings */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl sm:text-3xl font-serif font-normal text-[#0A0A0A] tracking-tight leading-tight">
          {phase === 'email'
            ? 'Reset password'
            : phase === 'otp'
            ? 'Verify recovery code'
            : 'Set a new password'}
        </h1>
        <p className="text-sm text-[#6B7280] leading-relaxed">
          {phase === 'email'
            ? 'Enter the email linked to your VIT Wadala account to receive a 6-digit recovery code.'
            : phase === 'otp'
            ? 'Enter the 6-digit recovery code sent to your email to verify account ownership.'
            : 'Create a secure new password with at least 10 characters.'}
        </p>
      </div>

      {/* Phase 1: Request Recovery Email */}
      {phase === 'email' && (
        <form onSubmit={handleRequestCode} className="flex flex-col gap-4" noValidate>
          <FormField
            id="reset-email"
            label="Email address"
            hint="We'll send a secure password recovery code."
            error={emailError}
            required
          >
            <TextInput
              id="reset-email"
              type="email"
              inputMode="email"
              autoComplete="username"
              placeholder="e.g. yourname@student.vit.edu.in or personal email"
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
                  <span>Sending code...</span>
                </>
              ) : (
                <>
                  <span>Send recovery code</span>
                  <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Phase 2: Enter and Verify Recovery OTP (Rule 1, Rule 2, Rule 5, Rule 6) */}
      {phase === 'otp' && (
        <div className="flex flex-col gap-4">
          <OtpInput
            value={otp}
            onChange={(val) => {
              setOtp(val);
              if (otpError) setOtpError(null);
            }}
            onComplete={handleVerifyOtp}
            onResend={handleResendOtp}
            error={otpError}
            emailDestination={email}
            disabled={isVerifyingOtp}
            resendCooldownSeconds={60}
          />

          <div className="pt-2">
            <button
              type="button"
              onClick={() => handleVerifyOtp(otp)}
              disabled={otp.length !== 6 || isVerifyingOtp}
              aria-busy={isVerifyingOtp}
              className="w-full h-12 rounded-lg bg-[#0A0A0A] text-[#FFFFFF] text-sm font-medium hover:bg-[#262626] transition-colors inline-flex items-center justify-center gap-2 whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-[#0A0A0A] focus:ring-offset-2 disabled:bg-[#FAFAFA] disabled:text-[#6B7280] disabled:cursor-not-allowed"
            >
              {isVerifyingOtp ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin shrink-0" aria-hidden="true" />
                  <span>Verifying code...</span>
                </>
              ) : (
                <>
                  <span>Verify and continue</span>
                  <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Phase 3: Update Password */}
      {phase === 'password' && (
        <>
          {isSuccess ? (
            <InlineAlert
              tone="emerald"
              title="Password updated"
              message="Your password has been successfully updated. Redirecting to sign in..."
            />
          ) : (
            <form onSubmit={handleUpdatePassword} className="flex flex-col gap-4" noValidate>
              {passwordError && (
                <InlineAlert
                  tone="rose"
                  message={passwordError}
                />
              )}

              <FormField
                id="new-password"
                label="New password"
                error={passwordError && password.length < 10 ? passwordError : undefined}
                required
              >
                <PasswordField
                  id="new-password"
                  autoComplete="new-password"
                  placeholder="Enter new password (min. 10 chars)"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (passwordError) setPasswordError(null);
                  }}
                  showStrength
                  disabled={isSubmitting}
                  isInvalid={Boolean(passwordError && password.length < 10)}
                />
              </FormField>

              <FormField
                id="confirm-new-password"
                label="Confirm new password"
                error={passwordError && password !== confirmPassword ? passwordError : undefined}
                required
              >
                <PasswordField
                  id="confirm-new-password"
                  autoComplete="new-password"
                  placeholder="Re-enter your new password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (passwordError) setPasswordError(null);
                  }}
                  disabled={isSubmitting}
                  isInvalid={Boolean(passwordError && password !== confirmPassword)}
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
                      <span>Updating password...</span>
                    </>
                  ) : (
                    <>
                      <span>Update password</span>
                      <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </>
      )}
    </div>
  );
};

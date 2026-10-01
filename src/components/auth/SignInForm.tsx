import React, { useState, useRef } from 'react';
import { ArrowRight, RefreshCw, GraduationCap, Briefcase, Award, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { FormField } from './FormField';
import { TextInput } from './TextInput';
import { PasswordField } from './PasswordField';
import { InlineAlert } from './InlineAlert';
import { useCountdown } from '../../hooks/useCountdown';
import { useAuth } from '../../context/AuthContext';

export interface SignInFormProps {
  onSwitchToRegister: () => void;
  onForgotPassword: () => void;
  className?: string;
}

export const SignInForm: React.FC<SignInFormProps> = ({
  onSwitchToRegister,
  onForgotPassword,
  className = ''
}) => {
  const { login, loginError, clearLoginError } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Server lockout state
  const [lockoutSeconds, setLockoutSeconds] = useState<number>(0);
  const lockoutTimer = useCountdown({
    initialSeconds: lockoutSeconds,
    autoStart: true,
    onFinish: () => setLockoutSeconds(0)
  });

  // Email not confirmed state
  const [emailUnconfirmed, setEmailUnconfirmed] = useState(false);
  const resendCooldown = useCountdown({ initialSeconds: 30, autoStart: false });

  const emailInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  // Compute live role hint based on typing pattern (icon + text, neutral tone)
  const getRoleHint = (val: string) => {
    const trimmed = val.trim().toLowerCase();
    if (!trimmed || !trimmed.includes('@')) return null;

    if (trimmed.endsWith('@student.vit.edu.in')) {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs text-[#6B7280]">
          <GraduationCap className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Student account</span>
        </span>
      );
    }

    if (trimmed.endsWith('@vit.edu.in')) {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs text-[#6B7280]">
          <Briefcase className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Faculty account</span>
        </span>
      );
    }

    // Any other domain format
    const basicRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (basicRegex.test(trimmed)) {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs text-[#6B7280]">
          <Award className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Alumni accounts sign in with their personal email.</span>
        </span>
      );
    }

    return null;
  };

  const roleHint = getRoleHint(email);

  const validate = () => {
    const errors: { email?: string; password?: string } = {};
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      errors.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      errors.email = 'Please enter a valid email address.';
    }

    if (!password) {
      errors.password = 'Password is required.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutTimer.isRunning) return;

    setGeneralError(null);
    clearLoginError();

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await login(email.trim(), password);

      if (res.success) {
        setIsSuccess(true);
      } else {
        // Check for server-driven lockout response
        if (res.message && (res.message.includes('Too many attempts') || res.message.includes('locked'))) {
          const match = res.message.match(/(\d+)\s*(?:seconds|s)/i);
          const seconds = match ? parseInt(match[1], 10) : 900; // default 15 mins
          setLockoutSeconds(seconds);
          lockoutTimer.reset(seconds);
        } else if (res.message && res.message.includes('Email not confirmed')) {
          setEmailUnconfirmed(true);
        } else {
          // One generic message: never reveal whether account exists
          setGeneralError("We couldn't sign you in. Check your email and password.");
        }
      }
    } catch {
      setGeneralError("We couldn't sign you in. Check your email and password.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendConfirmation = async () => {
    if (resendCooldown.isRunning) return;
    resendCooldown.reset(30);
    // Call server to resend confirmation
  };

  return (
    <div className={`w-full flex flex-col gap-6 ${className}`}>
      {/* Title & Subtitle */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl sm:text-3xl font-serif font-normal text-[#0A0A0A] tracking-tight leading-tight">
          Welcome back
        </h1>
        <p className="text-sm text-[#6B7280] leading-relaxed">
          Sign in with the email linked to your VIT Wadala profile.
        </p>
      </div>

      {/* Server Lockout Alert (aria-live) */}
      {lockoutTimer.isRunning && (
        <div aria-live="assertive">
          <InlineAlert
            tone="rose"
            title="Too many attempts"
            message={`Too many attempts. Try again in ${lockoutTimer.formatted}.`}
            action={
              <button
                type="button"
                onClick={onForgotPassword}
                className="text-xs text-[#991B1B] underline font-medium hover:text-[#0A0A0A] focus:outline-none"
              >
                Reset password
              </button>
            }
          />
        </div>
      )}

      {/* Email Unconfirmed State */}
      {emailUnconfirmed && (
        <InlineAlert
          tone="rose"
          title="Confirm your email to continue"
          message="We sent a verification link to your email address. Please click the link to activate your profile."
          action={
            <button
              type="button"
              onClick={handleResendConfirmation}
              disabled={resendCooldown.isRunning}
              className="text-xs text-[#991B1B] underline font-medium hover:text-[#0A0A0A] focus:outline-none disabled:opacity-50"
            >
              {resendCooldown.isRunning
                ? `Resend available in ${resendCooldown.secondsRemaining}s`
                : 'Resend confirmation email'}
            </button>
          }
        />
      )}

      {/* Generic Authentication Error Alert */}
      {generalError && !lockoutTimer.isRunning && !emailUnconfirmed && (
        <InlineAlert
          tone="rose"
          message={generalError}
        />
      )}

      {/* Sign-in Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        {/* Email Field */}
        <FormField
          id="signin-email"
          label="Email address"
          hint={roleHint}
          error={fieldErrors.email}
          required
        >
          <TextInput
            ref={emailInputRef}
            id="signin-email"
            type="email"
            inputMode="email"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck="false"
            placeholder="e.g. yourname@student.vit.edu.in"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (fieldErrors.email) {
                setFieldErrors((prev) => ({ ...prev, email: undefined }));
              }
              if (generalError) setGeneralError(null);
            }}
            onBlur={() => {
              if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
                setFieldErrors((prev) => ({ ...prev, email: 'Please enter a valid email address.' }));
              }
            }}
            disabled={isSubmitting || isSuccess || lockoutTimer.isRunning}
            isInvalid={Boolean(fieldErrors.email)}
          />
        </FormField>

        {/* Password Field */}
        <FormField
          id="signin-password"
          label="Password"
          error={fieldErrors.password}
          required
          cornerAction={
            <button
              type="button"
              onClick={onForgotPassword}
              className="text-xs text-[#6B7280] hover:text-[#0A0A0A] hover:underline focus:outline-none focus:ring-2 focus:ring-[#0A0A0A] rounded p-0.5"
            >
              Forgot password?
            </button>
          }
        >
          <PasswordField
            ref={passwordInputRef}
            id="signin-password"
            autoComplete="current-password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (fieldErrors.password) {
                setFieldErrors((prev) => ({ ...prev, password: undefined }));
              }
              if (generalError) setGeneralError(null);
            }}
            disabled={isSubmitting || isSuccess || lockoutTimer.isRunning}
            isInvalid={Boolean(fieldErrors.password)}
          />
        </FormField>

        {/* Submit Button (48-52px, label and icon always on one line) */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting || isSuccess || lockoutTimer.isRunning}
            aria-busy={isSubmitting}
            className="w-full h-12 rounded-lg bg-[#0A0A0A] text-[#FFFFFF] text-sm font-medium hover:bg-[#262626] transition-colors inline-flex items-center justify-center gap-2 whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-[#0A0A0A] focus:ring-offset-2 disabled:bg-[#FAFAFA] disabled:text-[#6B7280] disabled:border disabled:border-[#E5E7EB] disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin shrink-0" aria-hidden="true" />
                <span>Signing in...</span>
              </>
            ) : isSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-[#059669] shrink-0" aria-hidden="true" />
                <span>Verified</span>
              </>
            ) : (
              <>
                <span>Sign in</span>
                <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Switch to Registration Link */}
      <div className="text-center pt-2">
        <p className="text-xs text-[#6B7280]">
          New to NexaLink?{' '}
          <button
            type="button"
            onClick={onSwitchToRegister}
            className="text-[#0A0A0A] font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-[#0A0A0A] rounded p-0.5"
          >
            Create an account
          </button>
        </p>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, RefreshCw, CheckCircle2 } from 'lucide-react';
import { FormField } from './FormField';
import { PasswordField } from './PasswordField';
import { InlineAlert } from './InlineAlert';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

export interface ResetPasswordFormProps {
  onSuccess: () => void;
  onBackToSignIn: () => void;
  className?: string;
}

export const ResetPasswordForm: React.FC<ResetPasswordFormProps> = ({
  onSuccess,
  onBackToSignIn,
  className = ''
}) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ password?: string; confirmPassword?: string }>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  const validate = () => {
    const errors: { password?: string; confirmPassword?: string } = {};

    if (!password) {
      errors.password = 'New password is required.';
    } else if (password.length < 10) {
      errors.password = 'Password must be at least 10 characters.';
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Confirm your new password.';
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);

    if (!validate()) return;

    setIsSubmitting(true);

    try {
      if (isSupabaseConfigured()) {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) {
          setGeneralError(error.message || 'Failed to update password. Link may have expired.');
          setIsSubmitting(false);
          return;
        }
      }

      setIsSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 1800);
    } catch (err: any) {
      setGeneralError(err.message || 'Failed to reset password.');
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
          Set a new password
        </h1>
        <p className="text-sm text-[#6B7280] leading-relaxed">
          Create a secure password with at least 10 characters.
        </p>
      </div>

      {generalError && (
        <InlineAlert
          tone="rose"
          message={generalError}
        />
      )}

      {isSuccess ? (
        <InlineAlert
          tone="emerald"
          title="Password updated"
          message="Your password has been successfully updated. Redirecting to sign in..."
        />
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          {/* New Password */}
          <FormField
            id="new-password"
            label="New password"
            error={fieldErrors.password}
            required
          >
            <PasswordField
              id="new-password"
              autoComplete="new-password"
              placeholder="Enter new password (min. 10 chars)"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (fieldErrors.password) {
                  setFieldErrors((prev) => ({ ...prev, password: undefined }));
                }
              }}
              showStrength
              disabled={isSubmitting}
              isInvalid={Boolean(fieldErrors.password)}
            />
          </FormField>

          {/* Confirm Password */}
          <FormField
            id="confirm-new-password"
            label="Confirm new password"
            error={fieldErrors.confirmPassword}
            required
          >
            <PasswordField
              id="confirm-new-password"
              autoComplete="new-password"
              placeholder="Re-enter your new password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (fieldErrors.confirmPassword) {
                  setFieldErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                }
              }}
              disabled={isSubmitting}
              isInvalid={Boolean(fieldErrors.confirmPassword)}
            />
          </FormField>

          {/* Submit Button */}
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
    </div>
  );
};

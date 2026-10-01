import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { KeyRound, CheckCircle2, AlertCircle, ArrowLeft, Send } from 'lucide-react';
import { Button, TextField, PasswordField } from '../components/common/UIComponents';
import { LogoMark } from '../components/common/LogoMark';
import { useAuth } from '../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface ResetPasswordPageProps {
  setActiveTab: (tab: string) => void;
}

export const ResetPasswordPage: React.FC<ResetPasswordPageProps> = ({ setActiveTab }) => {
  const {
    completePasswordReset,
    requestPasswordReset,
    recoveryError,
    clearRecoveryMode,
    isRecoveryMode
  } = useAuth();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Link validity check state
  const [isCheckingLink, setIsCheckingLink] = useState(true);
  const [linkError, setLinkError] = useState<string | null>(recoveryError);

  // Inline "request new link" state if expired/invalid
  const [requestEmail, setRequestEmail] = useState('');
  const [isRequestingNewLink, setIsRequestingNewLink] = useState(false);
  const [requestNewLinkSuccess, setRequestNewLinkSuccess] = useState<string | null>(null);
  const [requestNewLinkError, setRequestNewLinkError] = useState<string | null>(null);

  // Check link validity and session on mount
  useEffect(() => {
    document.title = 'Set new password | NexaLink';

    if (recoveryError) {
      setLinkError(recoveryError);
      setIsCheckingLink(false);
      return;
    }

    if (typeof window !== 'undefined') {
      const hash = window.location.hash || '';
      const search = window.location.search || '';
      const params = new URLSearchParams(search);
      const hashParams = new URLSearchParams(hash.replace(/^#/, ''));

      const errorDesc = hashParams.get('error_description') || params.get('error_description') || hashParams.get('error') || params.get('error');
      const errorCode = hashParams.get('error_code') || params.get('error_code');

      if (errorCode === 'otp_expired' || errorDesc?.toLowerCase().includes('expired') || errorDesc?.toLowerCase().includes('invalid')) {
        setLinkError('This reset link is invalid or has expired — request a new one');
        setIsCheckingLink(false);
        return;
      }
    }

    if (isSupabaseConfigured()) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        const hash = typeof window !== 'undefined' ? window.location.hash : '';
        const search = typeof window !== 'undefined' ? window.location.search : '';
        const hasRecoveryToken = hash.includes('type=recovery') || search.includes('type=recovery');

        if (!session && !hasRecoveryToken && !isRecoveryMode) {
          setLinkError('This reset link is invalid or has expired — request a new one');
        }
        setIsCheckingLink(false);
      }).catch(() => {
        setIsCheckingLink(false);
      });
    } else {
      setIsCheckingLink(false);
    }
  }, [recoveryError, isRecoveryMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (newPassword.length < 6) {
      setFormError('Password must be at least 6 characters in length.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setFormError('Passwords do not match. Please verify both fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await completePasswordReset(newPassword);
      if (res.success) {
        setFormSuccess(res.message || 'Password successfully updated.');
        setTimeout(() => {
          setActiveTab('dashboard');
        }, 1200);
      } else {
        setFormError(res.message);
      }
    } catch (err: any) {
      setFormError(err.message || 'Failed to update password. Please request a new reset link.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestNewLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setRequestNewLinkError(null);
    setRequestNewLinkSuccess(null);

    const email = requestEmail.trim().toLowerCase();
    if (!email || !email.includes('@')) {
      setRequestNewLinkError('Please enter a valid email address.');
      return;
    }

    setIsRequestingNewLink(true);
    try {
      const res = await requestPasswordReset(email);
      if (res.success) {
        setRequestNewLinkSuccess(res.message || `Password reset instructions sent to ${email}.`);
      } else {
        setRequestNewLinkError(res.message);
      }
    } catch (err: any) {
      setRequestNewLinkError(err.message || 'Failed to send reset link. Please try again.');
    } finally {
      setIsRequestingNewLink(false);
    }
  };

  const handleReturnToSignIn = () => {
    clearRecoveryMode();
    if (typeof window !== 'undefined' && window.location.pathname === '/reset-password') {
      window.history.pushState({}, '', '/');
    }
    setActiveTab('auth');
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 bg-[#FAFAFA] font-sans antialiased text-[#0A0A0A]">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="w-full max-w-md bg-white border border-[#E5E7EB] rounded-xl p-6 sm:p-8 space-y-6"
      >
        {/* Header */}
        <div className="text-center space-y-1">
          <div className="w-10 h-10 mx-auto flex items-center justify-center">
            <LogoMark className="w-8 h-8 text-[#0A0A0A]" />
          </div>
          <h1 className="font-display font-bold text-xl text-[#0A0A0A]">
            Reset password
          </h1>
          <p className="text-xs text-[#6B7280]">
            Vidyalankar Institute of Technology, Wadala
          </p>
        </div>

        {/* State Content */}
        {isCheckingLink ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-3">
            <div className="w-6 h-6 border-2 border-[#0A0A0A] border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-[#6B7280]">Verifying reset link...</p>
          </div>
        ) : linkError ? (
          <div className="space-y-4">
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center mx-auto">
                <AlertCircle className="w-5 h-5 text-rose-700" />
              </div>
              <h2 className="text-xs font-semibold text-rose-900">
                Invalid or expired link
              </h2>
              <p className="text-xs text-rose-800 leading-relaxed max-w-xs mx-auto">
                {linkError}
              </p>
            </div>

            {/* Inline Request New Reset Link */}
            <div className="pt-2 border-t border-[#E5E7EB] space-y-3">
              <h3 className="text-xs font-semibold text-[#0A0A0A]">
                Request a new link
              </h3>
              <p className="text-xs text-[#6B7280]">
                Enter your registered institutional email below to receive a fresh password reset link.
              </p>

              {requestNewLinkSuccess ? (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                  <span>{requestNewLinkSuccess}</span>
                </div>
              ) : (
                <form onSubmit={handleRequestNewLink} className="space-y-3">
                  {requestNewLinkError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-900 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
                      <span>{requestNewLinkError}</span>
                    </div>
                  )}

                  <TextField
                    label="Account email"
                    type="email"
                    required
                    value={requestEmail}
                    onChange={e => setRequestEmail(e.target.value)}
                    placeholder="you@student.vit.edu.in"
                  />

                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    disabled={isRequestingNewLink}
                    loading={isRequestingNewLink}
                    className="w-full"
                  >
                    <Send className="w-3.5 h-3.5 mr-1.5" />
                    <span>Send new reset link</span>
                  </Button>
                </form>
              )}
            </div>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={handleReturnToSignIn}
                className="text-xs text-[#6B7280] hover:text-[#0A0A0A] font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer touch-target-44"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to sign in</span>
              </button>
            </div>
          </div>
        ) : (
          /* Valid Recovery State - Set New Password Form */
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-2 border-b border-[#E5E7EB] pb-3">
              <KeyRound className="w-4 h-4 text-[#0A0A0A]" />
              <h2 className="text-xs font-semibold text-[#0A0A0A]">
                Set new password
              </h2>
            </div>

            <p className="text-xs text-[#6B7280] leading-relaxed">
              Your recovery token has been verified. Choose a secure new password for your NexaLink account.
            </p>

            <AnimatePresence>
              {formError && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-900 flex items-start gap-2"
                >
                  <AlertCircle className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </motion.div>
              )}

              {formSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900 flex items-start gap-2"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">{formSuccess}</p>
                    <p className="text-[11px] text-emerald-800 mt-0.5">Redirecting to your dashboard...</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <PasswordField
              label="New password"
              required
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="Enter at least 6 characters"
              disabled={isSubmitting || !!formSuccess}
              error={newPassword.length > 0 && newPassword.length < 6 ? 'Password must be at least 6 characters' : undefined}
            />

            <PasswordField
              label="Confirm new password"
              required
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your new password"
              disabled={isSubmitting || !!formSuccess}
              error={confirmPassword.length > 0 && newPassword !== confirmPassword ? 'Passwords do not match' : undefined}
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={isSubmitting || !!formSuccess}
              loading={isSubmitting}
              className="w-full mt-2"
            >
              <span>Update password</span>
            </Button>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={handleReturnToSignIn}
                className="text-xs text-[#6B7280] hover:text-[#0A0A0A] font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer touch-target-44"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to sign in</span>
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
};

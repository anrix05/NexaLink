import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Lock,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  ArrowRight,
  LogOut,
  RefreshCw,
  Clock,
  XCircle,
  ShieldCheck,
  Mail
} from 'lucide-react';
import { Button } from '../../components/common/UIComponents';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { LogoMark } from '../../components/common/LogoMark';
import { adminInviteService } from '../../services/adminInviteService';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

interface AcceptAdminInvitePageProps {
  setActiveTab: (tab: string) => void;
}

type PageState =
  | 'loading'
  | 'outdated'
  | 'invalid_status'
  | 'valid_not_signed_in'
  | 'existing_account'
  | 'signed_in_matching'
  | 'signed_in_mismatch'
  | 'confirmation_pending'
  | 'success';

export const AcceptAdminInvitePage: React.FC<AcceptAdminInvitePageProps> = ({ setActiveTab }) => {
  const { currentUser, isAuthenticated, login, logout, updateCurrentUserState } = useAuth();
  const { acceptAdminInvite } = useData();

  // Page state machine
  const [pageState, setPageState] = useState<PageState>('loading');
  const [invalidReason, setInvalidReason] = useState<'expired' | 'used' | 'revoked' | 'not_found'>('not_found');
  const [isTimedOut, setIsTimedOut] = useState(false);

  // Invitation info
  const [token, setToken] = useState<string>('');
  const [invitedEmail, setInvitedEmail] = useState<string>('');

  // Form fields
  const [fullName, setFullName] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);

  // Submission & error tracking
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [userAlreadyCreated, setUserAlreadyCreated] = useState<boolean>(false);

  // Field refs for focus management
  const fullNameInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const confirmPasswordInputRef = useRef<HTMLInputElement>(null);
  const errorBannerRef = useRef<HTMLDivElement>(null);

  // Token initialization & address bar sanitisation
  useEffect(() => {
    let resolvedToken = '';
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token');

    if (urlToken && urlToken.trim()) {
      resolvedToken = urlToken.trim();
      try {
        sessionStorage.setItem('nexalink:admin-invite-token', resolvedToken);
        // Remove token from address bar cleanly once stored
        const cleanUrl = new URL(window.location.href);
        cleanUrl.searchParams.delete('token');
        window.history.replaceState({}, document.title, cleanUrl.pathname + cleanUrl.search);
      } catch {}
    } else {
      try {
        const stored = sessionStorage.getItem('nexalink:admin-invite-token');
        if (stored && stored.trim()) {
          resolvedToken = stored.trim();
        }
      } catch {}
    }

    if (!resolvedToken) {
      // Outdated link condition: has no token, or only has the old email param
      setPageState('outdated');
      return;
    }

    setToken(resolvedToken);
  }, []);

  // Verification caller
  const verifyToken = useCallback(async (tokenToVerify: string) => {
    if (!tokenToVerify) {
      setPageState('outdated');
      return;
    }

    setPageState('loading');
    setIsTimedOut(false);
    setErrorMessage(null);

    const timeoutTimer = window.setTimeout(() => {
      setIsTimedOut(true);
    }, 10000);

    try {
      const res = await adminInviteService.getAdminInvite(tokenToVerify);
      window.clearTimeout(timeoutTimer);

      if (res.status === 'valid' && res.invitedEmail) {
        setInvitedEmail(res.invitedEmail);

        // Determine view depending on current auth session
        if (isAuthenticated && currentUser?.email) {
          if (currentUser.email.toLowerCase() === res.invitedEmail.toLowerCase()) {
            setPageState('signed_in_matching');
          } else {
            setPageState('signed_in_mismatch');
          }
        } else {
          setPageState('valid_not_signed_in');
        }
      } else {
        // Clear stored token on terminal invalid status
        try {
          sessionStorage.removeItem('nexalink:admin-invite-token');
        } catch {}
        setInvalidReason(res.status === 'valid' ? 'not_found' : res.status);
        setPageState('invalid_status');
      }
    } catch {
      window.clearTimeout(timeoutTimer);
      setIsTimedOut(true);
    }
  }, [isAuthenticated, currentUser]);

  // Trigger verification when token is loaded
  useEffect(() => {
    if (token) {
      verifyToken(token);
    }
  }, [token, verifyToken]);

  // Keep state in sync if auth context changes while token is valid
  useEffect(() => {
    if (pageState !== 'loading' && pageState !== 'outdated' && pageState !== 'invalid_status' && pageState !== 'success' && pageState !== 'confirmation_pending') {
      if (invitedEmail) {
        if (isAuthenticated && currentUser?.email) {
          if (currentUser.email.toLowerCase() === invitedEmail.toLowerCase()) {
            setPageState('signed_in_matching');
          } else {
            setPageState('signed_in_mismatch');
          }
        } else if (pageState !== 'existing_account') {
          setPageState('valid_not_signed_in');
        }
      }
    }
  }, [isAuthenticated, currentUser, invitedEmail, pageState]);

  // Finalise activation and confirm admin role in profile
  const finalizeActivation = async (candidateToken: string, candidateName: string) => {
    const rpcRes = await acceptAdminInvite(candidateToken, candidateName);
    if (!rpcRes.success) {
      setErrorMessage(rpcRes.error || 'Failed to activate administrator privileges.');
      errorBannerRef.current?.focus();
      return false;
    }

    // Verify and re-fetch admin profile
    if (isSupabaseConfigured()) {
      try {
        const { data: userRow } = await supabase
          .from('users')
          .select('*')
          .eq('email', invitedEmail.toLowerCase())
          .maybeSingle();

        if (userRow && userRow.role === 'admin') {
          updateCurrentUserState(userRow);
        }
      } catch {}
    }

    // Success confirmed
    try {
      sessionStorage.removeItem('nexalink:admin-invite-token');
    } catch {}
    setPageState('success');
    return true;
  };

  // Submission handler for State 2 (Valid, not signed in)
  const handleSignUpAndAccept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setErrorMessage(null);

    // Validation
    const cleanName = fullName.trim();
    if (!cleanName) {
      setErrorMessage('Please enter your full name.');
      fullNameInputRef.current?.focus();
      return;
    }

    if (!userAlreadyCreated) {
      if (password.length < 10) {
        setErrorMessage('Password must be at least 10 characters in length.');
        passwordInputRef.current?.focus();
        return;
      }

      if (password !== confirmPassword) {
        setErrorMessage('Passwords do not match. Please re-enter.');
        confirmPasswordInputRef.current?.focus();
        return;
      }
    }

    setIsSubmitting(true);

    try {
      // If user already registered in previous attempt, jump straight to RPC
      if (userAlreadyCreated) {
        await finalizeActivation(token, cleanName);
        return;
      }

      // Step 1: Register credentials
      if (isSupabaseConfigured()) {
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email: invitedEmail,
          password,
          options: {
            data: {
              name: cleanName,
              role: 'admin'
            }
          }
        });

        if (signUpError) {
          const msg = signUpError.message.toLowerCase();
          if (msg.includes('already') || msg.includes('registered') || msg.includes('exists')) {
            // Account already exists: switch to State 5
            setPageState('existing_account');
            setErrorMessage('An account with this email already exists. Enter your current password to accept the invite.');
            setPassword('');
            setConfirmPassword('');
            passwordInputRef.current?.focus();
            return;
          }

          setErrorMessage(signUpError.message);
          errorBannerRef.current?.focus();
          return;
        }

        // Check if email confirmation is required (no active session returned)
        if (!authData.session && (!authData.user?.confirmed_at && !authData.user?.email_confirmed_at)) {
          setPageState('confirmation_pending');
          return;
        }

        // Credentials created and active session established
        setUserAlreadyCreated(true);
      } else {
        // Mock DEV mode registration
        await login(invitedEmail, 'admin', password);
        setUserAlreadyCreated(true);
      }

      // Step 2: Accept admin invite via SECURITY DEFINER RPC
      await finalizeActivation(token, cleanName);
    } catch (err: any) {
      setErrorMessage(err?.message || 'An unexpected error occurred while processing invitation.');
      errorBannerRef.current?.focus();
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submission handler for State 5 (Existing account)
  const handleExistingAccountSignInAndAccept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setErrorMessage(null);

    if (!password) {
      setErrorMessage('Please enter your password.');
      passwordInputRef.current?.focus();
      return;
    }

    setIsSubmitting(true);

    try {
      if (isSupabaseConfigured()) {
        const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
          email: invitedEmail,
          password
        });

        if (signInErr) {
          setErrorMessage(
            signInErr.message.includes('Invalid login credentials')
              ? 'Incorrect password. Enter your current password to accept the invite.'
              : signInErr.message
          );
          errorBannerRef.current?.focus();
          return;
        }

        const effectiveName = signInData.user?.user_metadata?.name || currentUser?.name || 'Administrator';
        await finalizeActivation(token, effectiveName);
      } else {
        // Mock mode login
        const res = await login(invitedEmail, 'admin', password);
        if (!res.success) {
          setErrorMessage(res.message || 'Incorrect credentials.');
          return;
        }
        await finalizeActivation(token, currentUser?.name || 'Administrator');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to authenticate and accept invitation.');
      errorBannerRef.current?.focus();
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submission handler for State 6 (Signed in as invited email)
  const handleSignedInAccept = async () => {
    if (isSubmitting) return;
    setErrorMessage(null);

    const effectiveName = (currentUser?.name || fullName).trim();
    if (!effectiveName && !currentUser?.name) {
      setErrorMessage('Please enter your name.');
      fullNameInputRef.current?.focus();
      return;
    }

    setIsSubmitting(true);
    try {
      await finalizeActivation(token, effectiveName || 'Administrator');
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to activate invitation.');
      errorBannerRef.current?.focus();
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler for State 7 (Sign out and continue)
  const handleSignOutAndContinue = async () => {
    setIsSubmitting(true);
    try {
      await logout();
      // Token was preserved in sessionStorage by AuthContext logout
      const currentSavedToken = sessionStorage.getItem('nexalink:admin-invite-token') || token;
      if (currentSavedToken) {
        verifyToken(currentSavedToken);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4 bg-[#FAFAFA]">
      <div className="w-full max-w-md bg-white border border-[#E5E7EB] rounded-[12px] p-6 sm:p-8 space-y-6">
        
        {/* Header: Centred, Logo links to landing page, clean title */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => setActiveTab('landing')}
              className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A0A0A] focus:ring-offset-2 transition-transform active:scale-95"
              aria-label="NexaLink Homepage"
            >
              <LogoMark className="w-8 h-8 text-[#0A0A0A]" />
            </button>
          </div>
          <div>
            <h1 className="font-semibold text-lg text-[#0A0A0A] tracking-tight">
              Accept your admin invitation
            </h1>
            <p className="text-xs text-[#6B7280] font-medium mt-1">
              Set up your administrator account for NexaLink.
            </p>
          </div>
        </div>

        {/* Global Error Banner (Governance Rose: #991B1B on #FEE2E2) */}
        {errorMessage && (
          <div
            ref={errorBannerRef}
            tabIndex={-1}
            role="alert"
            aria-live="assertive"
            className="p-3.5 bg-[#FEE2E2] border border-[#FECACA] rounded-lg text-xs text-[#991B1B] flex items-start gap-2.5 outline-none"
          >
            <AlertCircle className="w-4 h-4 shrink-0 text-[#991B1B] mt-0.5" aria-hidden="true" />
            <div className="flex-1 font-medium leading-relaxed">
              {errorMessage}
            </div>
          </div>
        )}

        {/* STATE 1: LOADING SKELETON */}
        {pageState === 'loading' && (
          <div className="space-y-4 py-2" aria-live="polite">
            {isTimedOut ? (
              <div className="p-4 bg-[#FEE2E2] border border-[#FECACA] rounded-lg text-center space-y-3">
                <AlertCircle className="w-6 h-6 text-[#991B1B] mx-auto" aria-hidden="true" />
                <p className="text-xs font-semibold text-[#991B1B]">
                  Could not check this invite.
                </p>
                <button
                  type="button"
                  onClick={() => verifyToken(token)}
                  className="inline-flex items-center justify-center min-h-[44px] px-4 py-2 text-xs font-semibold text-white bg-[#0A0A0A] rounded-lg hover:bg-[#262626] transition-colors focus:outline-none focus:ring-2 focus:ring-[#0A0A0A] focus:ring-offset-2"
                >
                  <RefreshCw className="w-3.5 h-3.5 mr-2" aria-hidden="true" />
                  Retry verification
                </button>
              </div>
            ) : (
              <div className="space-y-3 animate-pulse" aria-label="Checking invitation validity">
                <div className="h-4 bg-[#F3F4F6] rounded w-2/3 mx-auto" />
                <div className="h-10 bg-[#F3F4F6] rounded-lg" />
                <div className="h-10 bg-[#F3F4F6] rounded-lg" />
                <div className="h-10 bg-[#F3F4F6] rounded-lg" />
                <div className="h-11 bg-[#F3F4F6] rounded-lg" />
                <p className="text-center text-[11px] text-[#6B7280]">
                  Verifying invitation credentials...
                </p>
              </div>
            )}
          </div>
        )}

        {/* STATE 3: OUTDATED LINK (NO TOKEN OR OLD FORMAT) */}
        {pageState === 'outdated' && (
          <div className="space-y-5 text-center py-2" role="alert" aria-live="polite">
            <div className="w-12 h-12 bg-[#FEE2E2] border border-[#FECACA] rounded-full flex items-center justify-center mx-auto text-[#991B1B]">
              <Clock className="w-6 h-6" aria-hidden="true" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-sm font-semibold text-[#991B1B]">
                Invite link outdated
              </h2>
              <p className="text-xs text-[#6B7280] leading-relaxed max-w-xs mx-auto">
                This invite link is outdated. Ask the administrator who invited you for a new one.
              </p>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setActiveTab('auth')}
                className="w-full inline-flex items-center justify-center min-h-[44px] px-4 py-2.5 text-xs font-semibold text-[#0A0A0A] bg-white border border-[#E5E7EB] rounded-lg hover:bg-[#F9FAFB] transition-colors focus:outline-none focus:ring-2 focus:ring-[#0A0A0A] focus:ring-offset-2"
              >
                Back to sign in
              </button>
            </div>
          </div>
        )}

        {/* STATE 4: INVALID STATUS (NOT FOUND / EXPIRED / USED / REVOKED) */}
        {pageState === 'invalid_status' && (
          <div className="space-y-5 text-center py-2" role="alert" aria-live="polite">
            <div className="w-12 h-12 bg-[#FEE2E2] border border-[#FECACA] rounded-full flex items-center justify-center mx-auto text-[#991B1B]">
              <XCircle className="w-6 h-6" aria-hidden="true" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-sm font-semibold text-[#991B1B]">
                {invalidReason === 'expired' && 'This invitation link has expired.'}
                {invalidReason === 'used' && 'This invitation link has already been used.'}
                {invalidReason === 'revoked' && 'This invitation has been revoked by an administrator.'}
                {invalidReason === 'not_found' && 'Invitation not found or invalid.'}
              </h2>
              <p className="text-xs text-[#6B7280] leading-relaxed">
                Ask the administrator who invited you for a new link.
              </p>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setActiveTab('auth')}
                className="w-full inline-flex items-center justify-center min-h-[44px] px-4 py-2.5 text-xs font-semibold text-[#0A0A0A] bg-white border border-[#E5E7EB] rounded-lg hover:bg-[#F9FAFB] transition-colors focus:outline-none focus:ring-2 focus:ring-[#0A0A0A] focus:ring-offset-2"
              >
                Back to sign in
              </button>
            </div>
          </div>
        )}

        {/* STATE 8: EMAIL CONFIRMATION PENDING */}
        {pageState === 'confirmation_pending' && (
          <div className="space-y-5 text-center py-2" aria-live="polite">
            <div className="w-12 h-12 bg-[#EFF6FF] border border-[#BFDBFE] rounded-full flex items-center justify-center mx-auto text-[#1D4ED8]">
              <Mail className="w-6 h-6" aria-hidden="true" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-sm font-semibold text-[#0A0A0A]">
                Confirm your email address
              </h2>
              <p className="text-xs text-[#6B7280] leading-relaxed max-w-xs mx-auto">
                Check your inbox to confirm your email, then open this link again to finish.
              </p>
            </div>
            <div className="p-3 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg text-left">
              <p className="text-[11px] text-[#4B5563]">
                Your invitation token is preserved on this device. Once verified, return to activate your administrative privileges.
              </p>
            </div>
          </div>
        )}

        {/* STATE 7: SIGNED IN AS A DIFFERENT EMAIL */}
        {pageState === 'signed_in_mismatch' && (
          <div className="space-y-5 text-center py-2" aria-live="polite">
            <div className="w-12 h-12 bg-[#FEF3C7] border border-[#FDE68A] rounded-full flex items-center justify-center mx-auto text-[#92400E]">
              <LogOut className="w-6 h-6" aria-hidden="true" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-sm font-semibold text-[#0A0A0A]">
                Account mismatch
              </h2>
              <p className="text-xs text-[#6B7280] leading-relaxed max-w-sm mx-auto">
                You’re signed in as <span className="font-semibold text-[#0A0A0A]">{currentUser?.name || 'User'}</span> ({currentUser?.email}). Sign out to accept this invite.
              </p>
            </div>
            <div className="pt-2">
              <Button
                type="button"
                variant="primary"
                size="md"
                disabled={isSubmitting}
                onClick={handleSignOutAndContinue}
                className="w-full justify-center min-h-[44px]"
                icon={<LogOut className="w-4 h-4 mr-1.5" />}
              >
                {isSubmitting ? 'Signing out...' : 'Sign out and continue'}
              </Button>
            </div>
          </div>
        )}

        {/* STATE 6: SIGNED IN AS THE INVITED EMAIL */}
        {pageState === 'signed_in_matching' && (
          <div className="space-y-5 py-2">
            <div className="p-3.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg space-y-1">
              <p className="text-[11px] text-[#6B7280]">Active account</p>
              <p className="text-xs font-semibold text-[#0A0A0A]">
                You’re signed in as <span className="font-mono text-[#0A0A0A]">{invitedEmail}</span>
              </p>
            </div>

            {!currentUser?.name && (
              <div>
                <label htmlFor="matching-full-name" className="block text-xs font-medium text-[#0A0A0A] mb-1.5">
                  Full name <span className="text-[#991B1B]">*</span>
                </label>
                <input
                  id="matching-full-name"
                  ref={fullNameInputRef}
                  type="text"
                  required
                  autoComplete="name"
                  placeholder="e.g. Your full name"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2.5 text-base sm:text-xs bg-white border border-[#E5E7EB] rounded-lg text-[#0A0A0A] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#0A0A0A] focus:border-transparent transition-all"
                />
              </div>
            )}

            <Button
              type="button"
              variant="primary"
              size="md"
              disabled={isSubmitting}
              onClick={handleSignedInAccept}
              className="w-full justify-center min-h-[44px]"
              icon={<ShieldCheck className="w-4 h-4 mr-2" />}
            >
              {isSubmitting ? 'Activating account...' : 'Accept invitation'}
            </Button>
          </div>
        )}

        {/* STATE 5: EXISTING ACCOUNT (PASSWORD-ONLY RE-AUTH) */}
        {pageState === 'existing_account' && (
          <form onSubmit={handleExistingAccountSignInAndAccept} className="space-y-4 font-sans">
            <div className="p-3 bg-[#FEF3C7] border border-[#FDE68A] rounded-lg text-xs text-[#92400E] leading-relaxed">
              An account with this email already exists. Enter your current password to accept the invite.
            </div>

            <div>
              <label htmlFor="existing-email" className="block text-xs font-medium text-[#0A0A0A] mb-1.5">
                Invited email address
              </label>
              <div className="relative">
                <input
                  id="existing-email"
                  type="email"
                  readOnly
                  disabled
                  value={invitedEmail}
                  className="w-full min-h-[44px] px-3.5 py-2.5 pr-10 text-base sm:text-xs bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg text-[#6B7280] font-mono cursor-not-allowed"
                />
                <Lock className="w-4 h-4 text-[#9CA3AF] absolute right-3.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
              </div>
            </div>

            <div>
              <label htmlFor="existing-password" className="block text-xs font-medium text-[#0A0A0A] mb-1.5">
                Current password <span className="text-[#991B1B]">*</span>
              </label>
              <div className="relative">
                <input
                  id="existing-password"
                  ref={passwordInputRef}
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  placeholder="Enter your current password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2.5 pr-12 text-base sm:text-xs bg-white border border-[#E5E7EB] rounded-lg text-[#0A0A0A] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#0A0A0A] focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-1 top-1/2 -translate-y-1/2 min-h-[44px] min-w-[44px] flex items-center justify-center text-[#6B7280] hover:text-[#0A0A0A] transition-colors rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A0A0A]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={isSubmitting || !password}
                className="w-full justify-center min-h-[44px]"
                icon={<ArrowRight className="w-4 h-4 mr-2" />}
              >
                {isSubmitting ? 'Authenticating...' : 'Sign in and accept invitation'}
              </Button>
            </div>
          </form>
        )}

        {/* STATE 2: VALID, NOT SIGNED IN (REGISTRATION FORM) */}
        {pageState === 'valid_not_signed_in' && (
          <form onSubmit={handleSignUpAndAccept} className="space-y-4 font-sans">
            {/* Readonly Invited Email */}
            <div>
              <label htmlFor="invite-email" className="block text-xs font-medium text-[#0A0A0A] mb-1.5">
                Email address
              </label>
              <div className="relative">
                <input
                  id="invite-email"
                  type="email"
                  readOnly
                  disabled
                  value={invitedEmail}
                  className="w-full min-h-[44px] px-3.5 py-2.5 pr-10 text-base sm:text-xs bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg text-[#6B7280] font-mono cursor-not-allowed"
                />
                <Lock className="w-4 h-4 text-[#9CA3AF] absolute right-3.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
              </div>
              <p className="text-[11px] text-[#6B7280] mt-1">
                This is the address your invite was sent to.
              </p>
            </div>

            {/* Full Name */}
            <div>
              <label htmlFor="invite-name" className="block text-xs font-medium text-[#0A0A0A] mb-1.5">
                Full name <span className="text-[#991B1B]">*</span>
              </label>
              <input
                id="invite-name"
                ref={fullNameInputRef}
                type="text"
                required
                autoComplete="name"
                placeholder="e.g. Your full name"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                className="w-full min-h-[44px] px-3.5 py-2.5 text-base sm:text-xs bg-white border border-[#E5E7EB] rounded-lg text-[#0A0A0A] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#0A0A0A] focus:border-transparent transition-all"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="invite-password" className="block text-xs font-medium text-[#0A0A0A] mb-1.5">
                Create password <span className="text-[#991B1B]">*</span>
              </label>
              <div className="relative">
                <input
                  id="invite-password"
                  ref={passwordInputRef}
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  placeholder="At least 10 characters"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2.5 pr-12 text-base sm:text-xs bg-white border border-[#E5E7EB] rounded-lg text-[#0A0A0A] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#0A0A0A] focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-1 top-1/2 -translate-y-1/2 min-h-[44px] min-w-[44px] flex items-center justify-center text-[#6B7280] hover:text-[#0A0A0A] transition-colors rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A0A0A]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-[#6B7280] mt-1">
                Must be at least 10 characters in length.
              </p>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="invite-confirm-password" className="block text-xs font-medium text-[#0A0A0A] mb-1.5">
                Confirm password <span className="text-[#991B1B]">*</span>
              </label>
              <div className="relative">
                <input
                  id="invite-confirm-password"
                  ref={confirmPasswordInputRef}
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2.5 pr-12 text-base sm:text-xs bg-white border border-[#E5E7EB] rounded-lg text-[#0A0A0A] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#0A0A0A] focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? 'Hide confirmed password' : 'Show confirmed password'}
                  className="absolute right-1 top-1/2 -translate-y-1/2 min-h-[44px] min-w-[44px] flex items-center justify-center text-[#6B7280] hover:text-[#0A0A0A] transition-colors rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A0A0A]"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Primary Action Button */}
            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={isSubmitting || !fullName || !password || !confirmPassword}
                className="w-full justify-center min-h-[44px]"
                icon={<ShieldCheck className="w-4 h-4 mr-2" />}
              >
                {isSubmitting ? 'Activating account...' : 'Activate admin account'}
              </Button>
            </div>
          </form>
        )}

        {/* STATE 9: SUCCESS STATE */}
        {pageState === 'success' && (
          <div className="space-y-6 text-center py-3" aria-live="polite">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="w-14 h-14 bg-[#ECFDF5] border border-[#A7F3D0] rounded-full flex items-center justify-center mx-auto text-[#059669]"
            >
              <CheckCircle2 className="w-8 h-8" aria-hidden="true" />
            </motion.div>
            <div className="space-y-1.5">
              <h2 className="text-base font-semibold text-[#0A0A0A]">
                Admin account activated
              </h2>
              <p className="text-xs text-[#6B7280] leading-relaxed max-w-xs mx-auto">
                Your administrative privileges have been verified and granted.
              </p>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setActiveTab('dashboard')}
                className="w-full inline-flex items-center justify-center min-h-[44px] px-4 py-2.5 text-xs font-semibold text-white bg-[#0A0A0A] rounded-lg hover:bg-[#262626] transition-colors focus:outline-none focus:ring-2 focus:ring-[#0A0A0A] focus:ring-offset-2"
              >
                Go to admin dashboard
                <ArrowRight className="w-3.5 h-3.5 ml-2" aria-hidden="true" />
              </button>
            </div>
          </div>
        )}

        {/* Footer Back link (shown on form views) */}
        {(pageState === 'valid_not_signed_in' || pageState === 'existing_account') && (
          <div className="pt-3 border-t border-[#F3F4F6] text-center">
            <button
              type="button"
              onClick={() => setActiveTab('auth')}
              className="inline-flex items-center justify-center min-h-[44px] text-xs font-medium text-[#6B7280] hover:text-[#0A0A0A] transition-colors focus:outline-none focus:underline"
            >
              Back to sign in
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

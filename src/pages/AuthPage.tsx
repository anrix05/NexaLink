import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { AuthLayout } from '../components/auth/AuthLayout';
import { SignInForm } from '../components/auth/SignInForm';
import { RegistrationWizard } from '../components/auth/RegistrationWizard';
import { ForgotPasswordForm } from '../components/auth/ForgotPasswordForm';
import { ResetPasswordForm } from '../components/auth/ResetPasswordForm';
import { DevLoginPopover } from '../components/auth/DevLoginPopover';

export type AuthMode = 'signin' | 'register' | 'forgot_password' | 'reset_password';

export interface AuthPageProps {
  setActiveTab: (tab: string) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ setActiveTab }) => {
  const shouldReduceMotion = useReducedMotion();
  const [mode, setMode] = useState<AuthMode>('signin');
  const [direction, setDirection] = useState<number>(1);

  // Check URL parameters for deep-linking
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const modeParam = params.get('mode');
    if (modeParam === 'register') {
      setMode('register');
    } else if (modeParam === 'reset-password' || modeParam === 'reset_password') {
      setMode('reset_password');
    } else if (modeParam === 'forgot-password' || modeParam === 'forgot_password') {
      setMode('forgot_password');
    }
  }, []);

  // Update document title dynamically
  useEffect(() => {
    switch (mode) {
      case 'signin':
        document.title = 'Sign in | NexaLink';
        break;
      case 'register':
        document.title = 'Create your account | NexaLink';
        break;
      case 'forgot_password':
        document.title = 'Reset password | NexaLink';
        break;
      case 'reset_password':
        document.title = 'Set a new password | NexaLink';
        break;
    }
  }, [mode]);

  const switchMode = (newMode: AuthMode, dir: number) => {
    setDirection(dir);
    setMode(newMode);

    // Update query param without full page reload
    const url = new URL(window.location.href);
    if (newMode === 'register') {
      url.searchParams.set('mode', 'register');
    } else {
      url.searchParams.delete('mode');
    }
    window.history.replaceState({}, '', url.toString());
  };

  return (
    <AuthLayout>
      <div className="w-full">
        <AnimatePresence mode="wait" custom={direction}>
          {mode === 'signin' && (
            <motion.div
              key="auth-signin"
              custom={direction}
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, x: direction * 24 }}
              animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, x: 0 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: -direction * 24 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            >
              <SignInForm
                onSwitchToRegister={() => switchMode('register', 1)}
                onForgotPassword={() => switchMode('forgot_password', 1)}
              />
            </motion.div>
          )}

          {mode === 'register' && (
            <motion.div
              key="auth-register"
              custom={direction}
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, x: direction * 24 }}
              animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, x: 0 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: -direction * 24 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            >
              <RegistrationWizard
                onSwitchToSignIn={() => switchMode('signin', -1)}
                onRegistrationComplete={() => {
                  setActiveTab('verification-pending');
                }}
              />
            </motion.div>
          )}

          {mode === 'forgot_password' && (
            <motion.div
              key="auth-forgot-password"
              custom={direction}
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, x: direction * 24 }}
              animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, x: 0 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: -direction * 24 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            >
              <ForgotPasswordForm
                onBackToSignIn={() => switchMode('signin', -1)}
                onProceedToReset={() => switchMode('reset_password', 1)}
              />
            </motion.div>
          )}

          {mode === 'reset_password' && (
            <motion.div
              key="auth-reset-password"
              custom={direction}
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, x: direction * 24 }}
              animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, x: 0 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: -direction * 24 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            >
              <ResetPasswordForm
                onSuccess={() => switchMode('signin', -1)}
                onBackToSignIn={() => switchMode('signin', -1)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Dev-only Persona Quick Switcher */}
      <DevLoginPopover />
    </AuthLayout>
  );
};

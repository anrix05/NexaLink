import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { Navbar } from './components/common/Navbar';
import { AppShell } from './components/ui/AppShell';
import { Footer } from './components/common/Footer';
import { LandingPage } from './pages/LandingPage';
import { AlumniDirectoryPage } from './pages/directory/AlumniDirectoryPage';
import { MentorshipPage } from './pages/mentorship/MentorshipPage';
import { MessagingPage } from './pages/messaging/MessagingPage';
import { ReportsExportPage } from './pages/admin/ReportsExportPage';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AcceptAdminInvitePage } from './pages/admin/AcceptAdminInvitePage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { StudentDashboard } from './pages/student/StudentDashboard';
import { AlumniDashboard } from './pages/alumni/AlumniDashboard';
import { FacultyDashboard } from './pages/faculty/FacultyDashboard';
import { SettingsPage } from './pages/SettingsPage';
import { FeedbackPage } from './pages/student/FeedbackPage';
import { AuthPage } from './pages/AuthPage';
import { VerificationPendingPage } from './pages/VerificationPendingPage';
import { GateShell } from './components/gate/GateShell';
import { BottomNav } from './components/common/BottomNav';
import { AdminMobileInterstitial } from './components/admin/AdminMobileInterstitial';
import { OpportunitiesPage } from './pages/opportunities/OpportunitiesPage';
import { EventsPage } from './pages/events/EventsPage';
import { WelcomeReveal } from './components/common/WelcomeReveal';
import { NotFoundPage } from './pages/NotFoundPage';
import { PrivacyPolicyPage } from './pages/legal/PrivacyPolicyPage';
import { TermsOfServicePage } from './pages/legal/TermsOfServicePage';
import { DataGovernancePage } from './pages/legal/DataGovernancePage';
import { IntroOverlay } from './components/intro/IntroOverlay';
import { StyleguidePage } from './pages/dev/StyleguidePage';
import { PublicCertificateVerifyPage } from './pages/verify/PublicCertificateVerifyPage';
import { validateDataMode } from './lib/dataMode';
import { DataModeErrorBanner } from './components/common/DataModeErrorBanner';
import { GlobalErrorToaster } from './components/common/GlobalErrorToaster';
import { useData } from './context/DataContext';
import { NotificationToast } from './components/notifications/NotificationToast';
import type { AlumniProfile } from './types';


const getInitialActiveTab = (): string => {
  if (typeof window === 'undefined') return 'landing';
  if (window.location.pathname.startsWith('/verify')) return 'verify';
  if (window.location.pathname.startsWith('/reset-password')) return 'reset-password';
  if (window.location.pathname.startsWith('/dev/styleguide') || window.location.pathname.startsWith('/styleguide')) return 'styleguide';
  const params = new URLSearchParams(window.location.search);
  const tabParam = params.get('tab');
  if (tabParam) {
    if (tabParam === 'jobs' || tabParam === 'opportunities') return 'opportunities';
    if (tabParam === 'events') return 'events';
    if (tabParam === 'mentorship' || tabParam === 'guidance') return 'mentorship';
    if (tabParam === 'reports' || tabParam === 'analytics') return 'reports';
    if (tabParam === 'messages' || tabParam === 'chat' || tabParam === 'messaging') return 'messaging';
    if (tabParam === 'moderation') return 'moderation';
    return tabParam;
  }
  return 'landing';
};

const getInitialReportsSubTab = (): 'analytics' | 'export' => {
  if (typeof window === 'undefined') return 'analytics';
  const params = new URLSearchParams(window.location.search);
  const sub = params.get('subtab');
  if (sub === 'export' || sub === 'exporter') return 'export';
  return 'analytics';
};

const MainContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>(getInitialActiveTab);
  const [opportunitiesSubTab, setOpportunitiesSubTab] = useState<'jobs' | 'events'>('jobs');
  const [mentorshipSubTab, setMentorshipSubTab] = useState<'find' | 'my-sent' | 'incoming' | 'requests' | undefined>(undefined);
  const [reportsSubTab, setReportsSubTab] = useState<'analytics' | 'export'>(getInitialReportsSubTab);
  const [selectedMentorForBooking, setSelectedMentorForBooking] = useState<AlumniProfile | null>(null);
  const [isMobileScreen, setIsMobileScreen] = useState<boolean>(() => typeof window !== 'undefined' && window.innerWidth < 1024);
  const [adminBypassWarning, setAdminBypassWarning] = useState<boolean>(false);
  const { currentRole, currentUser, isAuthenticated, welcomeRevealName, clearWelcomeReveal, isCheckingSession, isRecoveryMode } = useAuth();
  const { latestIncomingNotification, dismissIncomingNotificationToast, markNotificationRead } = useData();
  const [isOffline, setIsOffline] = React.useState(() => typeof navigator !== 'undefined' && !navigator.onLine);

  React.useEffect(() => {
    const onOnline = () => setIsOffline(false);
    const onOffline = () => setIsOffline(true);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    const subtabParam = params.get('subtab');
    if (tabParam) {
      if (tabParam === 'styleguide' || tabParam === 'dev/styleguide') {
        setActiveTab('styleguide');
      } else if (tabParam === 'analytics' || tabParam === 'reports') {
        if (subtabParam === 'exporter' || subtabParam === 'export') {
          setReportsSubTab('export');
        } else if (subtabParam === 'analytics') {
          setReportsSubTab('analytics');
        }
        setActiveTab('reports');
      } else if (tabParam === 'guidance' || tabParam === 'mentorship') {
        if (subtabParam) {
          setMentorshipSubTab(subtabParam as any);
        }
        setActiveTab('mentorship');
      } else if (tabParam === 'messages' || tabParam === 'chat' || tabParam === 'messaging') {
        setActiveTab('messaging');
      } else {
        setActiveTab(tabParam);
      }
    } else if (typeof window !== 'undefined' && (window.location.pathname === '/reset-password' || window.location.pathname.startsWith('/reset-password'))) {
      setActiveTab('reset-password');
    } else if (typeof window !== 'undefined' && (window.location.pathname.startsWith('/verify'))) {
      setActiveTab('verify');
    } else if (typeof window !== 'undefined' && (window.location.pathname === '/dev/styleguide' || window.location.pathname === '/styleguide')) {
      setActiveTab('styleguide');
    }
  }, []);

  // When in Supabase password recovery mode, keep the user routed and gated on reset-password
  React.useEffect(() => {
    if (isRecoveryMode) {
      setActiveTab('reset-password');
    }
  }, [isRecoveryMode]);

  // ── URL ↔ State synchronisation (Back/Forward button support) ───────────────
  //
  // Tab-to-path mapping (public/private routes get pretty paths; internal
  // portal tabs use ?tab= params so we don't need server routing changes).
  const TAB_PATH_MAP: Record<string, string> = {
    landing: '/',
    auth: '/auth',
    'reset-password': '/reset-password',
    verify: '/verify',
    styleguide: '/dev/styleguide',
    'accept-admin-invite': '/accept-admin-invite',
    privacy: '/privacy',
    terms: '/terms',
    'data-governance': '/data-governance',
  };

  const tabToUrl = (tab: string, sub?: string): string => {
    if (TAB_PATH_MAP[tab]) return TAB_PATH_MAP[tab];
    const url = new URL(window.location.href);
    url.pathname = '/';
    url.search = '';
    url.searchParams.set('tab', tab);
    if (sub) url.searchParams.set('subtab', sub);
    return url.pathname + url.search;
  };

  // Push history entry whenever activeTab changes (driven by JS state, not popstate).
  const isPopstate = React.useRef(false);

  React.useEffect(() => {
    if (isPopstate.current) {
      isPopstate.current = false;
      return;
    }
    const newUrl = tabToUrl(activeTab);
    const currentUrl = window.location.pathname + window.location.search;
    if (newUrl !== currentUrl) {
      window.history.pushState({ tab: activeTab }, '', newUrl);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Listen for browser Back/Forward and restore state.
  React.useEffect(() => {
    const onPopState = () => {
      isPopstate.current = true;
      const path = window.location.pathname;
      const params = new URLSearchParams(window.location.search);
      if (path.startsWith('/verify')) { setActiveTab('verify'); return; }
      if (path.startsWith('/reset-password')) { setActiveTab('reset-password'); return; }
      if (path === '/dev/styleguide' || path === '/styleguide') { setActiveTab('styleguide'); return; }
      if (path === '/auth') { setActiveTab('auth'); return; }
      if (path === '/privacy') { setActiveTab('privacy'); return; }
      if (path === '/terms') { setActiveTab('terms'); return; }
      if (path === '/data-governance') { setActiveTab('data-governance'); return; }
      const tabParam = params.get('tab');
      if (tabParam) {
        const sub = params.get('subtab') ?? undefined;
        handleTabChange(tabParam, sub);
      } else {
        setActiveTab('landing');
      }
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // ── end URL sync ─────────────────────────────────────────────────────────────

  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeTab]);

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobileScreen(window.innerWidth < 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto-redirect authenticated users away from AuthPage back to dashboard (only when not in recovery mode)
  React.useEffect(() => {
    if (isAuthenticated && currentUser && !isRecoveryMode && activeTab === 'auth') {
      setActiveTab('dashboard');
    }
  }, [isAuthenticated, currentUser, activeTab, isRecoveryMode]);

  if (isCheckingSession) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#0A0A0A] mb-4"></div>
        <p className="text-[#6B7280] font-sans text-xs font-medium">Verifying session...</p>
      </div>
    );
  }

  const handleTabChange = (tab: string, subTab?: string) => {
    if (tab === 'jobs' || tab === 'opportunities') {
      setActiveTab('opportunities');
      return;
    }
    if (tab === 'events') {
      setActiveTab('events');
      return;
    }
    if (tab === 'mentorship' || tab === 'guidance') {
      if (subTab) {
        setMentorshipSubTab(subTab as any);
      }
      setActiveTab('mentorship');
      return;
    }
    if (tab === 'reports' || tab === 'analytics') {
      if (subTab === 'exporter' || subTab === 'export') {
        setReportsSubTab('export');
      } else if (subTab === 'analytics') {
        setReportsSubTab('analytics');
      }
      setActiveTab('reports');
      return;
    }
    if (tab === 'messages' || tab === 'messaging' || tab === 'chat') {
      setActiveTab('messaging');
      return;
    }
    setActiveTab(tab);
  };

  const isLoggedOut = !isAuthenticated || !currentUser;
  const isUnverified = !isLoggedOut && currentUser && (currentUser.isVerified === false || currentUser.verificationStatus === 'Pending Verification' || currentUser.verificationStatus === 'Needs Clarification');

  const renderActiveView = () => {
    if (activeTab === 'reset-password') {
      return <ResetPasswordPage setActiveTab={handleTabChange} />;
    }

    if (activeTab === 'privacy') {
      return <PrivacyPolicyPage setActiveTab={handleTabChange} />;
    }

    if (activeTab === 'terms') {
      return <TermsOfServicePage setActiveTab={handleTabChange} />;
    }

    if (activeTab === 'data-governance') {
      return <DataGovernancePage setActiveTab={handleTabChange} />;
    }

    if (activeTab === 'styleguide') {
      return <StyleguidePage setActiveTab={handleTabChange} />;
    }

    if (activeTab === 'verify') {
      return <PublicCertificateVerifyPage setActiveTab={handleTabChange} />;
    }

    if (isLoggedOut) {
      return <LandingPage setActiveTab={handleTabChange} />;
    }
    if (isUnverified) {
      return <VerificationPendingPage setActiveTab={handleTabChange} />;
    }

    switch (activeTab) {
      case 'directory':
        if (currentRole === 'admin') {
          return <AdminDashboard setActiveTab={handleTabChange} initialTab="users" />;
        }
        return (
          <AlumniDirectoryPage
            setActiveTab={handleTabChange}
            onSelectMentor={(mentor) => setSelectedMentorForBooking(mentor)}
          />
        );
      case 'opportunities':
      case 'jobs':
        return <OpportunitiesPage setActiveTab={handleTabChange} />;
      case 'events':
        return <EventsPage />;
      case 'mentorship':
      case 'guidance':
        return (
          <MentorshipPage
            selectedMentorForBooking={selectedMentorForBooking}
            initialSubTab={mentorshipSubTab}
            setActiveTab={handleTabChange}
          />
        );
      case 'messaging':
        return <MessagingPage />;
      case 'reports':
      case 'analytics':
        return <ReportsExportPage initialSubTab={reportsSubTab} />;
      case 'verification':
      case 'verification-queue':
        return <AdminDashboard setActiveTab={handleTabChange} initialTab="approvals" />;
      case 'moderation':
        return <AdminDashboard setActiveTab={handleTabChange} initialTab="moderation" />;
      case 'announcements':
        return <AdminDashboard setActiveTab={handleTabChange} initialTab="announcements" />;
      case 'audit':
      case 'audit-log':
        return <AdminDashboard setActiveTab={handleTabChange} initialTab="audit" />;
      case 'graduation':
        return <AdminDashboard setActiveTab={handleTabChange} initialTab="graduation" />;
      case 'users':
      case 'user-roster':
        return <AdminDashboard setActiveTab={handleTabChange} initialTab="users" />;
      case 'settings':
        return <SettingsPage />;
      case 'feedback':
        return <FeedbackPage />;
      case 'admin-console':
        return <AdminDashboard setActiveTab={handleTabChange} initialTab="approvals" />;
      case 'dashboard':
        if (currentRole === 'admin') {
          return <AdminDashboard setActiveTab={handleTabChange} initialTab="overview" />;
        } else if (currentRole === 'student') {
          return <StudentDashboard setActiveTab={handleTabChange} />;
        } else if (currentRole === 'faculty' || currentRole === 'teacher') {
          return <FacultyDashboard setActiveTab={handleTabChange} />;
        } else {
          return <AlumniDashboard setActiveTab={handleTabChange} />;
        }
      default:
        return <NotFoundPage setActiveTab={handleTabChange} isAuthenticated={isAuthenticated} />;
    }
  };

  const isPortalTab = !isLoggedOut && !isUnverified && activeTab !== 'landing' && activeTab !== 'auth' && activeTab !== 'reset-password' && activeTab !== 'admin-invite' && activeTab !== 'privacy' && activeTab !== 'terms' && activeTab !== 'data-governance' && activeTab !== 'styleguide' && activeTab !== 'verify';
  const showAdminMobileInterstitial = isPortalTab && currentRole === 'admin' && isMobileScreen && !adminBypassWarning;

  // Intercept unverified accounts and isolate in minimal GateShell (no sidebar, no search, no bell)
  if (isUnverified && activeTab !== 'privacy' && activeTab !== 'terms' && activeTab !== 'data-governance' && activeTab !== 'auth' && activeTab !== 'verify') {
    return (
      <GateShell>
        <VerificationPendingPage setActiveTab={setActiveTab} />
      </GateShell>
    );
  }

  // Responsive motion variants: horizontal slide on mobile tab changes, subtle vertical lift on desktop
  const pageVariants = isMobileScreen
    ? {
        initial: { opacity: 0, x: 16 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -16 },
        transition: { duration: 0.22, ease: 'easeOut' as const }
      }
    : {
        initial: { opacity: 0, y: 10 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -8 },
        transition: { duration: 0.2, ease: 'easeOut' as const }
      };

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#0A0A0A] font-sans antialiased flex flex-col justify-between w-full max-w-full overflow-x-clip min-w-0">
      {/* Skip-to-content: hidden until focused (WCAG 2.4.1) */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-[#0A0A0A] focus:text-white focus:text-sm focus:font-medium focus:rounded-lg focus:shadow-lg"
      >
        Skip to main content
      </a>

      {/* Global offline banner (B18) */}
      {isOffline && (
        <div
          role="alert"
          aria-live="assertive"
          className="fixed top-0 left-0 right-0 z-[9998] flex items-center justify-center gap-2 bg-[#B45309] text-white text-xs font-medium py-2 px-4 text-center"
        >
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728M15.536 8.464a5 5 0 010 7.072M12 11v1m0 4h.01M9.172 14.828A4.001 4.001 0 0112 7a4 4 0 012.828 7.828" />
          </svg>
          You’re offline. Check your network connection to continue using NexaLink.
        </div>
      )}

      <AnimatePresence>
        {welcomeRevealName && (
          <WelcomeReveal
            name={welcomeRevealName}
            onComplete={clearWelcomeReveal}
          />
        )}
      </AnimatePresence>

      {!welcomeRevealName && !isPortalTab && activeTab !== 'verify' && (
        <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      )}

      {isPortalTab ? (
        <AppShell activeTab={activeTab} setActiveTab={setActiveTab}>
          {showAdminMobileInterstitial ? (
            <AdminMobileInterstitial
              onBypass={() => setAdminBypassWarning(true)}
              setActiveTab={setActiveTab}
            />
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={pageVariants.initial}
                animate={pageVariants.animate}
                exit={pageVariants.exit}
                transition={pageVariants.transition}
              >
                {renderActiveView()}
              </motion.div>
            </AnimatePresence>
          )}
        </AppShell>
      ) : (
        <main id="main-content" className="flex-1 w-full max-w-full min-w-0 overflow-x-clip">
          <AnimatePresence mode="wait">
            {activeTab === 'auth' ? (
              <motion.div
                key="auth"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="w-full max-w-full min-w-0"
              >
                <AuthPage setActiveTab={setActiveTab} />
              </motion.div>
            ) : activeTab === 'reset-password' ? (
              <motion.div
                key="reset-password"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="w-full max-w-full min-w-0"
              >
                <ResetPasswordPage setActiveTab={setActiveTab} />
              </motion.div>
            ) : activeTab === 'admin-invite' ? (
              <motion.div
                key="admin-invite"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="w-full max-w-full min-w-0"
              >
                <AcceptAdminInvitePage setActiveTab={setActiveTab} />
              </motion.div>
            ) : activeTab === 'privacy' ? (
              <motion.div
                key="privacy"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="w-full max-w-full min-w-0"
              >
                <PrivacyPolicyPage setActiveTab={setActiveTab} />
              </motion.div>
            ) : activeTab === 'terms' ? (
              <motion.div
                key="terms"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="w-full max-w-full min-w-0"
              >
                <TermsOfServicePage setActiveTab={setActiveTab} />
              </motion.div>
            ) : activeTab === 'data-governance' ? (
              <motion.div
                key="data-governance"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="w-full max-w-full min-w-0"
              >
                <DataGovernancePage setActiveTab={setActiveTab} />
              </motion.div>
            ) : activeTab === 'verify' ? (
              <motion.div
                key="verify"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="w-full max-w-full min-w-0"
              >
                <PublicCertificateVerifyPage setActiveTab={setActiveTab} />
              </motion.div>
            ) : isLoggedOut || activeTab === 'landing' ? (
              <motion.div
                key="landing"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="w-full max-w-full min-w-0"
              >
                <LandingPage setActiveTab={setActiveTab} />
              </motion.div>
            ) : isUnverified ? (
              <motion.div
                key="unverified"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              >
                <VerificationPendingPage setActiveTab={setActiveTab} />
              </motion.div>
            ) : (
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              >
                {renderActiveView()}
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      )}

      {/* Footer rendered for public and verified portal pages only (hidden for unverified pending and verify views) */}
      {!isUnverified && !isPortalTab && activeTab !== 'verify' && <Footer setActiveTab={setActiveTab} isPublicPage={true} />}

      {/* Global Realtime Notification Toast */}
      <NotificationToast
        notification={latestIncomingNotification}
        onDismiss={dismissIncomingNotificationToast}
        onClick={(n) => {
          if (!n.is_read) markNotificationRead(n.id);
          dismissIncomingNotificationToast();
          if (n.link) {
            if (n.link.startsWith('messaging?contact=')) {
              setActiveTab('messaging');
            } else {
              setActiveTab(n.link);
            }
          }
        }}
      />
    </div>
  );
};

export function App() {
  const dataModeStatus = validateDataMode();

  const [shouldMountIntro] = useState<boolean>(() => {
    if (typeof document === 'undefined') return false;
    try {
      const isIntroForce = window.location.search.includes('intro=1');
      if (!isIntroForce) {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && ((key.startsWith('sb-') && key.endsWith('-auth-token')) || key === 'nexalink_auth_user')) {
            return false;
          }
        }
      }
    } catch {}
    return document.documentElement.dataset.intro === 'play';
  });

  if (!dataModeStatus.ok) {
    return <DataModeErrorBanner reason={dataModeStatus.errorReason || 'Invalid data mode configuration.'} />;
  }

  return (
    <AuthProvider>
      <DataProvider>
        <GlobalErrorToaster />
        {shouldMountIntro && <IntroOverlay />}
        <MainContent />
      </DataProvider>
    </AuthProvider>
  );
}

export default App;


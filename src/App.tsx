import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { Navbar } from './components/common/Navbar';
import { SidebarNav } from './components/common/SidebarNav';
import { Footer } from './components/common/Footer';
import { LandingPage } from './pages/LandingPage';
import { AlumniDirectoryPage } from './pages/directory/AlumniDirectoryPage';
import { JobPortalPage } from './pages/jobs/JobPortalPage';
import { EventsPage } from './pages/events/EventsPage';
import { MentorshipPage } from './pages/mentorship/MentorshipPage';
import { MessagingPage } from './pages/messaging/MessagingPage';
import { ReportsExportPage } from './pages/admin/ReportsExportPage';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { StudentDashboard } from './pages/student/StudentDashboard';
import { AlumniDashboard } from './pages/alumni/AlumniDashboard';
import { FacultyDashboard } from './pages/faculty/FacultyDashboard';
import { SettingsPage } from './pages/SettingsPage';
import { FeedbackPage } from './pages/student/FeedbackPage';
import { AuthPage } from './pages/AuthPage';
import { VerificationPendingPage } from './pages/VerificationPendingPage';
import { BottomNav } from './components/common/BottomNav';
import { AdminMobileInterstitial } from './components/admin/AdminMobileInterstitial';
import { OpportunitiesPage } from './pages/opportunities/OpportunitiesPage';
import { WelcomeReveal } from './components/common/WelcomeReveal';
import type { AlumniProfile } from './types';

const MainContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('landing');
  const [opportunitiesSubTab, setOpportunitiesSubTab] = useState<'jobs' | 'events'>('jobs');
  const [mentorshipSubTab, setMentorshipSubTab] = useState<'find' | 'my-sent' | 'incoming' | 'requests' | undefined>(undefined);
  const [selectedMentorForBooking, setSelectedMentorForBooking] = useState<AlumniProfile | null>(null);
  const [isMobileScreen, setIsMobileScreen] = useState<boolean>(() => typeof window !== 'undefined' && window.innerWidth < 1024);
  const [adminBypassWarning, setAdminBypassWarning] = useState<boolean>(false);
  const { currentRole, currentUser, isAuthenticated, welcomeRevealName, clearWelcomeReveal } = useAuth();

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobileScreen(window.innerWidth < 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto-redirect authenticated users away from AuthPage back to dashboard
  React.useEffect(() => {
    if (isAuthenticated && currentUser && activeTab === 'auth') {
      setActiveTab('dashboard');
    }
  }, [isAuthenticated, currentUser, activeTab]);

  const handleTabChange = (tab: string, subTab?: string) => {
    if (tab === 'jobs') {
      setOpportunitiesSubTab('jobs');
      setActiveTab('opportunities');
      return;
    }
    if (tab === 'events') {
      setOpportunitiesSubTab('events');
      setActiveTab('opportunities');
      return;
    }
    if (tab === 'mentorship') {
      if (subTab) {
        setMentorshipSubTab(subTab as any);
      }
      setActiveTab('mentorship');
      return;
    }
    if (subTab && (subTab === 'jobs' || subTab === 'events')) {
      setOpportunitiesSubTab(subTab as any);
    }
    setActiveTab(tab);
  };

  const isLoggedOut = !isAuthenticated || !currentUser;
  const isUnverified = !isLoggedOut && currentUser && (currentUser.isVerified === false || currentUser.verificationStatus === 'Pending Verification' || currentUser.verificationStatus === 'Needs Clarification');

  const renderActiveView = () => {
    if (isLoggedOut) {
      return <LandingPage setActiveTab={handleTabChange} />;
    }
    if (isUnverified) {
      return <VerificationPendingPage setActiveTab={handleTabChange} />;
    }

    switch (activeTab) {
      case 'directory':
        return (
          <AlumniDirectoryPage
            setActiveTab={handleTabChange}
            onSelectMentor={(mentor) => setSelectedMentorForBooking(mentor)}
          />
        );
      case 'opportunities':
        return <OpportunitiesPage initialSubTab={opportunitiesSubTab} />;
      case 'jobs':
        return <OpportunitiesPage initialSubTab="jobs" />;
      case 'events':
        return <OpportunitiesPage initialSubTab="events" />;
      case 'mentorship':
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
        return <ReportsExportPage />;
      case 'settings':
        return <SettingsPage />;
      case 'feedback':
        return <FeedbackPage />;
      case 'admin-console':
        return <AdminDashboard setActiveTab={handleTabChange} initialView="console" />;
      case 'dashboard':
      default:
        if (currentRole === 'admin') {
          return <AdminDashboard setActiveTab={handleTabChange} initialView="dashboard" />;
        } else if (currentRole === 'student') {
          return <StudentDashboard setActiveTab={handleTabChange} />;
        } else if (currentRole === 'faculty' || currentRole === 'teacher') {
          return <FacultyDashboard setActiveTab={handleTabChange} />;
        } else {
          return <AlumniDashboard setActiveTab={handleTabChange} />;
        }
    }
  };

  const isPortalTab = !isLoggedOut && activeTab !== 'landing' && activeTab !== 'auth';
  const showAdminMobileInterstitial = isPortalTab && currentRole === 'admin' && isMobileScreen && !adminBypassWarning;

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
      <AnimatePresence>
        {welcomeRevealName && (
          <WelcomeReveal
            name={welcomeRevealName}
            onComplete={clearWelcomeReveal}
          />
        )}
      </AnimatePresence>

      {!welcomeRevealName && (
        <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      )}

      <main className="flex-1 w-full max-w-full min-w-0 overflow-x-clip">
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
          ) : showAdminMobileInterstitial ? (
            <motion.div
              key="admin-interstitial"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2 }}
            >
              <AdminMobileInterstitial
                onBypass={() => setAdminBypassWarning(true)}
                setActiveTab={setActiveTab}
              />
            </motion.div>
          ) : isPortalTab ? (
            /* Unified App Portal Layout with Responsive Shell & Bottom Nav Accommodation */
            <div
              key="portal-wrapper"
              className={`w-full max-w-[1720px] mx-auto px-3 sm:px-5 lg:px-6 py-4 pb-20 lg:pb-6 ${
                currentRole === 'admin' && isMobileScreen && adminBypassWarning ? 'overflow-x-auto min-w-[1024px]' : ''
              }`}
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                
                {/* Left Workspace Sidebar Nav (Desktop only) */}
                <div className="hidden lg:block lg:col-span-3 sticky top-20 z-20">
                  <SidebarNav activeTab={activeTab} setActiveTab={setActiveTab} />
                </div>

                {/* Main Right Content Area */}
                <div className="col-span-1 lg:col-span-9 min-w-0">
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
                </div>

              </div>
            </div>
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

      {/* Footer rendered for public and verified portal pages only (hidden for unverified pending view) */}
      {!isUnverified && <Footer setActiveTab={setActiveTab} isPublicPage={!isPortalTab} />}

      {/* Mobile Bottom Navigation — authenticated portal only */}
      {isPortalTab && !isUnverified && (
        <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
      )}
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <MainContent />
      </DataProvider>
    </AuthProvider>
  );
}

export default App;

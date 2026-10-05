import React from 'react';
import { SmoothScroll } from '../components/landing/motion/SmoothScroll';
import { ScrollProgress } from '../components/landing/motion/ScrollProgress';
import { HeroSection } from '../components/landing/HeroSection';
import { MetricsStrip } from '../components/landing/MetricsStrip';
import { ScrollytellingSection } from '../components/landing/ScrollytellingSection';
import { FeaturesStackingCards } from '../components/landing/FeaturesStackingCards';
import { RoleJourneysSection } from '../components/landing/RoleJourneysSection';
import { CampusSpotlightGallery } from '../components/landing/CampusSpotlightGallery';
import { AccreditationSection } from '../components/landing/AccreditationSection';
import { DepartmentsAccordion } from '../components/landing/DepartmentsAccordion';
import { FinalCtaSection } from '../components/landing/FinalCtaSection';
import { usePageMeta } from '../hooks/usePageMeta';
import { useAuth } from '../context/AuthContext';
import { ArrowRight, LogIn } from 'lucide-react';

interface LandingPageProps {
  setActiveTab: (tab: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ setActiveTab }) => {
  const { isAuthenticated } = useAuth();
  usePageMeta({
    title: 'NexaLink | Vidyalankar Institute of Technology, Mumbai',
    description: 'Centralized institutional platform connecting Vidyalankar engineering students, verified alumni, and academic faculty.',
    noIndex: false
  });

  const handleSignIn = () => {
    setActiveTab('auth');
  };

  const handleCreateAccount = () => {
    setActiveTab('auth');
  };

  const handleSelectFeature = (feature: string) => {
    if (feature === 'mentorship') {
      setActiveTab('mentorship');
    } else if (feature === 'directory') {
      setActiveTab('directory');
    } else if (feature === 'opportunities') {
      setActiveTab('opportunities');
    } else {
      setActiveTab('auth');
    }
  };

  return (
    <SmoothScroll>
      <div className="relative w-full max-w-full min-w-0 overflow-x-clip bg-white text-[#0A0A0A] font-sans antialiased selection:bg-[#0A0A0A] selection:text-white pb-16 sm:pb-0">
        {/* Top 2px Scroll Progress Bar */}
        <ScrollProgress />

        {/* 5.1 Hero: Signature Moment */}
        <HeroSection
          onSignIn={handleSignIn}
          onCreateAccount={handleCreateAccount}
          onGoToDashboard={() => setActiveTab('dashboard')}
        />

        {/* 5.2 Social Proof & Live Metrics Strip */}
        <MetricsStrip />

        {/* 5.3 Problem to Solution: Pinned Scrollytelling */}
        <ScrollytellingSection />

        {/* 5.4 Features: Sticky Stacking Cards */}
        <FeaturesStackingCards onSelectFeature={handleSelectFeature} />

        {/* 5.5 Role Journeys: Interactive 4-Segmented Tabs */}
        <RoleJourneysSection onSelectRole={() => handleSignIn()} />

        {/* 5.6 Campus Spotlight: Horizontal Scroll Gallery */}
        <CampusSpotlightGallery />

        {/* 5.7 Trust / Accreditation: Full-Bleed Inverted Section */}
        <AccreditationSection />

        {/* 5.8 Departments: 5-Item Horizontal Accordion */}
        <DepartmentsAccordion />

        {/* 5.9 & 5.10 Final CTA & Quiet Verified Testimonial */}
        <FinalCtaSection
          onSignIn={handleSignIn}
          onCreateAccount={handleCreateAccount}
        />

        {/* B17: Sticky Mobile CTA Bar (<640px) — only shown to guests */}
        {!isAuthenticated && (
          <div className="sm:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E5E7EB] p-3 pb-safe flex items-center gap-2.5 shadow-xs">
            <button
              type="button"
              onClick={handleCreateAccount}
              className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-4 bg-[#0A0A0A] text-white text-xs font-semibold rounded-lg hover:bg-[#262626] transition-colors cursor-pointer min-h-[44px] touch-target-44"
            >
              <span>Create account</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleSignIn}
              className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-4 bg-white border border-[#E5E7EB] text-[#0A0A0A] text-xs font-semibold rounded-lg hover:bg-[#FAFAFA] transition-colors cursor-pointer min-h-[44px] touch-target-44"
            >
              <LogIn className="w-3.5 h-3.5 text-[#6B7280]" />
              <span>Sign in</span>
            </button>
          </div>
        )}
      </div>
    </SmoothScroll>
  );
};

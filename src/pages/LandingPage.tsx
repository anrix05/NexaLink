import React, { useEffect } from 'react';
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

interface LandingPageProps {
  setActiveTab: (tab: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ setActiveTab }) => {
  useEffect(() => {
    document.title = 'NexaLink | Vidyalankar Institute of Technology, Mumbai';
  }, []);

  const handleSignIn = () => {
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
      <div className="relative w-full max-w-full min-w-0 overflow-x-clip bg-white text-[#0A0A0A] font-sans antialiased selection:bg-[#0A0A0A] selection:text-white">
        {/* Top 2px Scroll Progress Bar */}
        <ScrollProgress />

        {/* 5.1 Hero: Signature Moment */}
        <HeroSection onSignIn={handleSignIn} />

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
          onCreateAccount={handleSignIn}
        />
      </div>
    </SmoothScroll>
  );
};

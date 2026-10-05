import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowDown } from 'lucide-react';
import { HeroCopy } from './HeroCopy';
import { GlobalNetworkMap } from './GlobalNetworkMap';
import { useLenis } from './motion/SmoothScroll';
import { useReducedMotionPreference } from '../../lib/motionPreference';
import { useAuth } from '../../context/AuthContext';

interface HeroSectionProps {
  onSignIn: () => void;
  onCreateAccount?: () => void;
  onGoToDashboard?: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onSignIn,
  onCreateAccount,
  onGoToDashboard,
}) => {
  const { scrollTo } = useLenis();
  const reduceMotion = useReducedMotionPreference();
  const { scrollY } = useScroll();
  const { isAuthenticated, currentUser } = useAuth();

  // Subtle parallax: left column drifts up slightly slower than scroll
  const yParallax = useTransform(scrollY, [0, 600], [0, reduceMotion ? 0 : -60]);
  const opacityParallax = useTransform(scrollY, [0, 450], [1, reduceMotion ? 1 : 0.2]);

  return (
    <section
      id="overview"
      className="relative w-full flex flex-col overflow-hidden border-b border-[#E5E7EB] bg-white"
    >

      {/* Main Hero Grid */}
      <div className="app-container flex items-start pt-4 sm:pt-6 lg:pt-10 xl:pt-16 pb-4 z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 items-start w-full">

          {/* Left column: typography + CTAs */}
          <motion.div
            style={{ y: yParallax, opacity: opacityParallax }}
            className="lg:col-span-7 min-w-0"
          >
            <HeroCopy
              isAuthenticated={isAuthenticated && Boolean(currentUser)}
              onCreateAccount={onCreateAccount ?? onSignIn}
              onSignIn={onSignIn}
              onGoToDashboard={onGoToDashboard}
              onHowItWorks={() => scrollTo('#how-it-works')}
              pairing="sans"
            />

            {/* Mobile/Tablet network map — below copy */}
            <div className="lg:hidden pt-6 w-full">
              <GlobalNetworkMap onSignIn={onSignIn} className="aspect-[4/3] min-h-[280px] sm:aspect-[16/10] w-full" />
            </div>
          </motion.div>

          {/* Right column: desktop network map */}
          <div className="hidden lg:flex lg:col-span-5 w-full items-center justify-center relative self-center">
            <GlobalNetworkMap onSignIn={onSignIn} className="aspect-[4/3] max-h-[calc(100vh-180px)] w-full" />
          </div>

        </div>
      </div>

      {/* Scroll cue */}
      <div className="app-container pb-6 pt-2 flex items-center justify-between text-xs text-[#6B7280] font-mono">
        <button
          type="button"
          onClick={() => scrollTo('#metrics')}
          className="inline-flex items-center gap-2 hover:text-[#0A0A0A] transition-colors cursor-pointer min-h-[44px] py-2 px-1"
        >
          <span className="text-[11px] font-medium tracking-[0.06em] uppercase">Scroll</span>
          <ArrowDown className="w-3.5 h-3.5 animate-bounce" aria-hidden />
        </button>
        <span className="text-[11px] tabular-nums tracking-[0.04em]">VIT Wadala, Mumbai</span>
      </div>

    </section>
  );
};

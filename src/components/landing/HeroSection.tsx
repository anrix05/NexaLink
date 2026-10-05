import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowDown } from 'lucide-react';
import { HeroCopy } from './HeroCopy';
import { AlumniNetworkCanvas } from './AlumniNetworkCanvas';
import { useLenis } from './motion/SmoothScroll';
import { useReducedMotionPreference } from '../../lib/motionPreference';
import { usePublicStats } from '../../hooks/usePublicStats';
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
  const { stats } = usePublicStats();
  const { isAuthenticated, currentUser } = useAuth();

  // Subtle parallax: left column drifts up slightly slower than scroll
  const yParallax = useTransform(scrollY, [0, 600], [0, reduceMotion ? 0 : -60]);
  const opacityParallax = useTransform(scrollY, [0, 450], [1, reduceMotion ? 1 : 0.2]);

  // Verified alumni count pill — only shown when ≥ 5 real records exist
  const alumniCount = stats?.verified_alumni ?? 0;
  const showGlobePill = alumniCount >= 5;

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

            {/* Mobile network canvas — below copy, zero CLS */}
            <div className="lg:hidden pt-6 w-full">
              <div className="w-full aspect-[4/5] max-h-[56svh] relative rounded-2xl border border-[#E5E7EB] bg-[#FAFAFA] overflow-hidden">
                <AlumniNetworkCanvas />
                {showGlobePill && (
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-white/90 backdrop-blur-xs border border-[#E5E7EB] text-[10px] font-mono font-medium text-[#0A0A0A] flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0A0A0A]/40" />
                    <span className="tabular-nums">{alumniCount.toLocaleString()} verified alumni</span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Right column: desktop network canvas */}
          <div className="hidden lg:flex lg:col-span-5 h-[520px] xl:h-[600px] w-full items-center justify-center relative">
            <div className="w-full h-full relative rounded-2xl border border-[#E5E7EB] bg-[#FAFAFA] overflow-hidden">
              <AlumniNetworkCanvas />

              {showGlobePill && (
                <div className="absolute top-4 left-4 px-3 py-1.5 rounded-lg bg-white/90 backdrop-blur-sm border border-[#E5E7EB] text-[11px] font-mono font-medium text-[#0A0A0A] flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#0A0A0A]/40" />
                  <span className="tabular-nums">{alumniCount.toLocaleString()} verified alumni</span>
                </div>
              )}
            </div>
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

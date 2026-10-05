import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, ArrowDown } from 'lucide-react';
import { SplitText } from './motion/SplitText';
import { Reveal } from './motion/Reveal';
import { MagneticButton } from './motion/MagneticButton';
import { AlumniNetworkCanvas } from './AlumniNetworkCanvas';
import { useLenis } from './motion/SmoothScroll';
import { useReducedMotionPreference } from '../../lib/motionPreference';
import { usePublicStats } from '../../hooks/usePublicStats';
import { useAuth } from '../../context/AuthContext';
import { Eyebrow } from '../common/Eyebrow';

interface HeroSectionProps {
  onSignIn: () => void;
  onCreateAccount?: () => void;
  onGoToDashboard?: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onSignIn, onCreateAccount, onGoToDashboard }) => {
  const { scrollTo } = useLenis();
  const reduceMotion = useReducedMotionPreference();
  const { scrollY } = useScroll();
  const { stats } = usePublicStats();
  const { isAuthenticated, currentUser } = useAuth();

  // Subtle hero parallax: headline moves up slightly slower than scroll (0.2x)
  const yParallax = useTransform(scrollY, [0, 600], [0, reduceMotion ? 0 : -60]);
  const opacityParallax = useTransform(scrollY, [0, 450], [1, reduceMotion ? 1 : 0.2]);

  // Verified alumni stats for status badge (from get_public_stats aggregates only)
  // Only show the globe pill when we have a real number worth displaying
  const alumniCount = stats?.verified_alumni ?? 0;
  const showGlobePill = alumniCount >= 5;

  return (
    <section
      id="overview"
      className="relative w-full flex flex-col overflow-hidden border-b border-[#E5E7EB] bg-white"
    >

      {/* Main Hero Content Grid */}
      <div className="app-container flex items-start pt-4 sm:pt-6 lg:pt-10 xl:pt-16 pb-4 z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 items-center w-full">
          
          {/* Left Column: Typography & CTAs */}
          <motion.div
            style={{ y: yParallax, opacity: opacityParallax }}
            className="lg:col-span-7 space-y-4 sm:space-y-6 lg:space-y-8"
          >
            {/* Eyebrow Label */}
            <Reveal delay={0.05}>
              <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#FAFAFA] border border-[#E5E7EB]">
                <Eyebrow dot>VIT Wadala</Eyebrow>
              </div>
            </Reveal>

            {/* Signature Headline */}
            <div className="space-y-3">
              <SplitText
                as="h1"
                className="text-[clamp(2rem,8vw,2.5rem)] sm:text-4xl md:text-5xl xl:text-6xl 2xl:text-7xl font-display font-bold text-[#0A0A0A] tracking-[-0.02em] lg:tracking-[-0.03em] leading-[1.12] lg:leading-[0.98] text-balance break-words pb-1"
                delay={0.1}
              >
                Connecting Vidyalankar engineers with global alumni.
              </SplitText>

              <Reveal delay={0.35}>
                <p className="text-base sm:text-lg lg:text-xl text-[#6B7280] font-normal leading-relaxed max-w-2xl pt-2 font-sans">
                  An institutional platform connecting Vidyalankar students with verified alumni for real-world mentorship, career referrals, and academic collaboration.
                </p>
              </Reveal>
            </div>

            {/* Action CTAs */}
            <Reveal delay={0.45}>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 pt-1">
                {isAuthenticated && currentUser ? (
                  <>
                    <MagneticButton className="w-full sm:w-auto">
                      <button
                        onClick={onGoToDashboard || onSignIn}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#0A0A0A] text-white text-sm font-medium rounded-lg hover:bg-[#262626] transition-colors cursor-pointer touch-target-44"
                      >
                        <span>Go to dashboard</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </MagneticButton>

                    <button
                      onClick={() => scrollTo('#how-it-works')}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white border border-[#E5E7EB] text-[#0A0A0A] text-sm font-medium rounded-lg hover:bg-[#FAFAFA] hover:border-[#0A0A0A] transition-colors cursor-pointer touch-target-44"
                    >
                      <span>See how it works ↓</span>
                    </button>
                  </>
                ) : (
                  <>
                    <MagneticButton className="w-full sm:w-auto">
                      <button
                        onClick={onCreateAccount || onSignIn}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#0A0A0A] text-white text-sm font-medium rounded-lg hover:bg-[#262626] transition-colors cursor-pointer touch-target-44"
                      >
                        <span>Create account</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </MagneticButton>

                    <button
                      onClick={onSignIn}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white border border-[#E5E7EB] text-[#0A0A0A] text-sm font-medium rounded-lg hover:bg-[#FAFAFA] hover:border-[#0A0A0A] transition-colors cursor-pointer touch-target-44"
                    >
                      <span>Sign in</span>
                    </button>

                    <button
                      onClick={() => scrollTo('#how-it-works')}
                      className="w-full sm:w-auto text-xs text-[#6B7280] hover:text-[#0A0A0A] transition-colors cursor-pointer py-2 px-3 text-center"
                    >
                      See how it works ↓
                    </button>
                  </>
                )}
              </div>

              {/* Institutional Trust Line */}
              <div className="pt-4 flex items-center gap-2 text-xs text-[#6B7280] font-sans">
                <span>Vidyalankar Institute of Technology · Verified institutional network</span>
              </div>

              {/* Mobile Dedicated Alumni Network Card Block (Own block below copy, zero CLS) */}
              <div className="lg:hidden pt-4 w-full">
                <div className="w-full aspect-[4/5] max-h-[56svh] relative rounded-2xl border border-[#E5E7EB] bg-[#FAFAFA] overflow-hidden">
                  <AlumniNetworkCanvas />
                  {showGlobePill && (
                    <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-white/90 backdrop-blur-xs border border-[#E5E7EB] text-[10px] font-sans font-medium text-[#0A0A0A] flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#0A0A0A]/40" />
                      <span className="tabular-nums">{alumniCount.toLocaleString()} verified alumni</span>
                    </div>
                  )}
                </div>
              </div>
            </Reveal>

          </motion.div>

          {/* Right Column: Desktop Interactive Alumni Network */}
          <div className="hidden lg:flex lg:col-span-5 h-[520px] xl:h-[600px] w-full items-center justify-center relative">
            <div className="w-full h-full relative rounded-2xl border border-[#E5E7EB] bg-[#FAFAFA] overflow-hidden">
              <AlumniNetworkCanvas />

              {showGlobePill && (
                <div className="absolute top-4 left-4 px-3 py-1.5 rounded-lg bg-white/90 backdrop-blur-sm border border-[#E5E7EB] text-[11px] font-sans font-medium text-[#0A0A0A] flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#0A0A0A]/40" />
                  <span className="tabular-nums">{alumniCount.toLocaleString()} verified alumni</span>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Scroll Indicator Cue */}
      <div className="app-container pb-6 pt-2 flex items-center justify-between text-xs text-[#6B7280] font-sans">
        <button
          onClick={() => scrollTo('#metrics')}
          className="inline-flex items-center gap-2 hover:text-[#0A0A0A] transition-colors cursor-pointer min-h-[44px] py-2 px-1 touch-target-44"
        >
          <span className="text-[11px] font-medium">Scroll</span>
          <ArrowDown className="w-3.5 h-3.5 animate-bounce" />
        </button>

        <span className="text-[11px] tabular-nums">VIT Wadala, Mumbai</span>
      </div>
    </section>
  );
};

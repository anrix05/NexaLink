import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getPerfTier, INTRO_NODE_COLOR, INTRO_TIMING, type PerfTier } from '../../lib/intro';
import { getReducedMotionPreference } from '../../lib/motionPreference';

export const IntroOverlay: React.FC = () => {
  const [phase, setPhase] = useState<'idle' | 'assemble' | 'settle' | 'ignite' | 'hold' | 'exit' | 'done'>('idle');
  const [showSkipHint, setShowSkipHint] = useState<boolean>(false);
  const [isSkipping, setIsSkipping] = useState<boolean>(false);
  const [perfTier, setPerfTier] = useState<PerfTier>('high');
  const [isMobile, setIsMobile] = useState<boolean>(false);

  // Flight FLIP coordinates
  const [flightDelta, setFlightDelta] = useState<{ x: number; y: number; scale: number }>({
    x: 0,
    y: 0,
    scale: 1,
  });

  const markRef = useRef<SVGSVGElement>(null);
  const isFinishedRef = useRef<boolean>(false);
  const allowSkipRef = useRef<boolean>(false);

  // Complete and restore all DOM mutations
  const finishIntro = () => {
    if (isFinishedRef.current) return;
    isFinishedRef.current = true;

    if (typeof document !== 'undefined') {
      document.documentElement.dataset.intro = 'done';

      const rootEl = document.getElementById('root');
      if (rootEl) {
        rootEl.removeAttribute('inert');
      }

      document.body.style.overflow = '';
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('nexalink:intro-done'));
    }

    setPhase('done');
  };

  // Immediate skip handler
  const handleSkip = () => {
    if (isSkipping || phase === 'done' || isFinishedRef.current) return;
    setIsSkipping(true);
    setTimeout(() => {
      finishIntro();
    }, INTRO_TIMING.skipFadeDuration);
  };

  useEffect(() => {
    if (isFinishedRef.current) return;

    let isCancelled = false;
    const timeouts: (ReturnType<typeof setTimeout>)[] = [];
    const addTimeout = (fn: () => void, ms: number) => {
      const id = setTimeout(() => {
        if (!isCancelled) fn();
      }, ms);
      timeouts.push(id);
      return id;
    };

    const tier = getPerfTier();
    setPerfTier(tier);
    const mobile = window.innerWidth < 768;
    setIsMobile(mobile);

    // If low tier hardware, data-saver, or reduced-motion requested, finish immediately
    if (tier === 'low' || getReducedMotionPreference()) {
      finishIntro();
      return;
    }

    // Hard cap safety at 1.5s: never block LCP under any circumstances
    const maxSafetyTimeout = setTimeout(() => {
      if (!isFinishedRef.current) finishIntro();
    }, 1500);
    timeouts.push(maxSafetyTimeout);

    // Lock body scroll and set #root inert during intro
    document.body.style.overflow = 'hidden';
    const rootEl = document.getElementById('root');
    if (rootEl) {
      rootEl.setAttribute('inert', '');
    }

    // Grace period for click-to-skip
    addTimeout(() => {
      allowSkipRef.current = true;
      setShowSkipHint(true);
    }, 450);

    // Keydown listener for skip on Esc or Space
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') return;
      if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') {
        handleSkip();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    const timings = mobile ? INTRO_TIMING.mobile : INTRO_TIMING.desktop;

    // Stage 1: Assemble starts immediately on frame 1
    addTimeout(() => {
      setPhase('assemble');
    }, 30);

    // Stage 2: Settle
    addTimeout(() => {
      setPhase('settle');
    }, timings.startDelay + timings.assembleDuration);

    // Stage 3: Ignite
    addTimeout(() => {
      setPhase('ignite');
    }, timings.startDelay + timings.assembleDuration + timings.settleDuration);

    // Stage 4: Hold
    addTimeout(() => {
      setPhase('hold');
    }, timings.startDelay + timings.assembleDuration + timings.settleDuration + timings.igniteDuration);

    // Stage 5: Exit (FLIP flight to navbar)
    addTimeout(() => {
      const targetEl = document.querySelector('[data-intro-target="logo"]') as HTMLElement | null;
      const markEl = markRef.current;

      if (targetEl && markEl) {
        const introRect = markEl.getBoundingClientRect();
        const targetRect = targetEl.getBoundingClientRect();

        const targetCenter = {
          x: targetRect.left + targetRect.width / 2,
          y: targetRect.top + targetRect.height / 2,
        };
        const introCenter = {
          x: introRect.left + introRect.width / 2,
          y: introRect.top + introRect.height / 2,
        };

        const dx = targetCenter.x - introCenter.x;
        const dy = targetCenter.y - introCenter.y;
        const s = targetRect.width / introRect.width;

        setFlightDelta({
          x: dx,
          y: dy,
          scale: s,
        });
      } else {
        setFlightDelta({
          x: 0,
          y: 0,
          scale: 0.8,
        });
      }

      if (typeof document !== 'undefined') {
        document.documentElement.dataset.intro = 'exit';
      }
      setPhase('exit');
    }, timings.startDelay + timings.assembleDuration + timings.settleDuration + timings.igniteDuration + timings.holdDuration);

    // Stage 6: Final complete
    addTimeout(() => {
      finishIntro();
    }, timings.totalDuration);

    return () => {
      isCancelled = true;
      timeouts.forEach(clearTimeout);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  if (phase === 'done') {
    return null;
  }

  // 10 subtle ambient drifting network dots on high tier only
  const backgroundDots = perfTier === 'high' ? [
    { top: '15%', left: '20%', duration: 12, delay: 0 },
    { top: '25%', left: '80%', duration: 15, delay: 1 },
    { top: '35%', left: '45%', duration: 18, delay: 2 },
    { top: '65%', left: '15%', duration: 14, delay: 0.5 },
    { top: '75%', left: '85%', duration: 16, delay: 1.5 },
    { top: '80%', left: '30%', duration: 19, delay: 2.5 },
    { top: '20%', left: '60%', duration: 13, delay: 3 },
    { top: '50%', left: '90%', duration: 17, delay: 1 },
    { top: '40%', left: '10%', duration: 11, delay: 2 },
    { top: '85%', left: '65%', duration: 16, delay: 0 },
  ] : [];

  const isPostAssemble = phase === 'settle' || phase === 'ignite' || phase === 'hold' || phase === 'exit';
  const isIgniting = phase === 'ignite' || phase === 'hold' || phase === 'exit';
  const isExiting = phase === 'exit';

  // 4 Precision Vertical Slices: S1, S2, S3, S4
  // Slices slide smoothly along Y into their stationary clip windows
  const slicesConfig = [
    { id: 's1', clipId: 'clip-s1', fromY: 48, delay: 0.08 },
    { id: 's2', clipId: 'clip-s2', fromY: -28, delay: 0 },
    { id: 's3', clipId: 'clip-s3', fromY: 28, delay: 0 },
    { id: 's4', clipId: 'clip-s4', fromY: -48, delay: 0.08 },
  ];

  const introRoot = typeof document !== 'undefined' ? document.getElementById('intro-root') : null;
  if (!introRoot) return null;

  return createPortal(
    <div
      onClick={() => {
        if (allowSkipRef.current) {
          handleSkip();
        }
      }}
      className={`fixed inset-0 z-[999999] flex flex-col items-center justify-center select-none ${
        isExiting ? 'pointer-events-none' : 'cursor-pointer'
      }`}
      aria-hidden="true"
    >
      {/* 1. Dedicated Solid Pitch Black Background Layer */}
      <div
        className="absolute inset-0 bg-[#000000] pointer-events-none transition-opacity"
        style={{
          opacity: isSkipping || isExiting ? 0 : 1,
          transitionDuration: isSkipping ? '250ms' : isExiting ? '500ms' : '0ms',
          transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Background drifting dots for high tier desktop */}
        {backgroundDots.map((dot, idx) => (
          <motion.div
            key={`dot-${idx}`}
            className="absolute w-1 h-1 rounded-full bg-white opacity-20 pointer-events-none"
            style={{ top: dot.top, left: dot.left }}
            animate={{
              x: [0, 8, -6, 0],
              y: [0, -8, 6, 0],
              opacity: [0.1, 0.25, 0.15, 0.1],
            }}
            transition={{
              duration: dot.duration,
              delay: dot.delay,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      {/* 2. Brand Lockup Container (Wordmark is absolute so stage center strictly equals SVG center) */}
      <div className="relative flex flex-col items-center justify-center pointer-events-none">
        
        {/* The Flying Mark: Stays at 100% opacity during flight so it never looks washed out or dissolved */}
        <motion.div
          animate={
            phase === 'hold'
              ? { scale: [1, 1.025, 1], x: 0, y: 0 }
              : isExiting
              ? {
                  x: flightDelta.x,
                  y: flightDelta.y,
                  scale: flightDelta.scale,
                }
              : { x: 0, y: 0, scale: 1 }
          }
          transition={
            phase === 'hold'
              ? { duration: 0.35, ease: 'easeInOut' }
              : isExiting
              ? { duration: isMobile ? 0.6 : 0.68, ease: [0.22, 1, 0.36, 1] }
              : { duration: 0.2 }
          }
          style={{ transformOrigin: 'center center' }}
          className="relative flex items-center justify-center h-[min(40vw,160px)] sm:h-[clamp(120px,20vmin,220px)] aspect-[525/558]"
        >
          <svg
            ref={markRef}
            viewBox="250 140 525 558"
            className="w-full h-full overflow-visible"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{
              willChange: isExiting ? 'transform' : 'auto',
            }}
          >
            <defs>
              {/* Canonical Mark Group in canonical 1024-grid space (250 140 525 558) */}
              <g id="nexa-mark">
                {/* Half 1: Left Pillar & Descending Diagonal Hook */}
                <path
                  d="M255 693 L335 693 L335 270 L418 270 L565 417 L565 475 L639 549 L639 373 L442 176 L348 176 L255 269 Z"
                  fill="#FFFFFF"
                />
                {/* Half 2: Right Pillar & Ascending Diagonal Hook (180° Rotational Symmetry) */}
                <path
                  d="M768 145 L688 145 L688 568 L605 568 L458 421 L458 363 L384 289 L384 465 L581 662 L675 662 L768 569 Z"
                  fill="#FFFFFF"
                />
              </g>

              {/* 4 Precision Vertical Clip Slices with 1px overlap */}
              <clipPath id="clip-s1">
                <rect x="250" y="140" width="91" height="558" />
              </clipPath>
              <clipPath id="clip-s2">
                <rect x="340" y="140" width="173" height="558" />
              </clipPath>
              <clipPath id="clip-s3">
                <rect x="512" y="140" width="172" height="558" />
              </clipPath>
              <clipPath id="clip-s4">
                <rect x="683" y="140" width="88" height="558" />
              </clipPath>
            </defs>

            {/* Assembled Slices: Slices glide along Y into stationary clips, forming the unified mark */}
            <g id="nexa-slices">
              {slicesConfig.map(slice => (
                <g key={slice.id} clipPath={`url(#${slice.clipId})`}>
                  <motion.g
                    initial={{
                      y: slice.fromY,
                      opacity: 0,
                    }}
                    animate={{
                      y: 0,
                      opacity: 1,
                    }}
                    transition={{
                      duration: isMobile ? 0.75 : 0.85,
                      delay: (isMobile ? 0.03 : 0.06) + slice.delay,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                  >
                    <use href="#nexa-mark" />
                  </motion.g>
                </g>
              ))}
            </g>

            {/* Ignite Phase: Central Nexus Core Node Pops In & Pulses */}
            {isIgniting && (
              <g id="nexa-central-node" style={{ transformOrigin: '506px 438px' }}>
                {/* Expanding pulse ring */}
                <motion.circle
                  cx="506"
                  cy="438"
                  r="44"
                  fill="none"
                  stroke={INTRO_NODE_COLOR}
                  strokeWidth="3"
                  initial={{ scale: 0.8, opacity: 0.9 }}
                  animate={{ scale: 2.2, opacity: 0 }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  style={{ transformOrigin: '506px 438px' }}
                />

                {/* Orange Ring Node with physical spring */}
                <motion.circle
                  cx="506"
                  cy="438"
                  r="44"
                  fill={INTRO_NODE_COLOR}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 450, damping: 24, mass: 0.7 }}
                  style={{ transformOrigin: '506px 438px' }}
                />

                {/* White Inner Core with bloom */}
                <motion.circle
                  cx="506"
                  cy="438"
                  r="19"
                  fill="#FFFFFF"
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.25, 1] }}
                  transition={{ duration: 0.32, times: [0, 0.6, 1], ease: 'easeOut' }}
                  style={{ transformOrigin: '506px 438px' }}
                />
              </g>
            )}
          </svg>
        </motion.div>

        {/* Live-Text Wordmark: Absolutely positioned below the mark so center point is preserved */}
        <AnimatePresence>
          {isPostAssemble && !isExiting && (
            <motion.div
              key="wordmark"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6, transition: { duration: 0.22 } }}
              transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
              className="absolute top-full mt-5 sm:mt-7 text-center pointer-events-none whitespace-nowrap"
            >
              <span className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-white font-['Outfit',sans-serif]">
                NexaLink
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Skip Hint (Appears bottom-right after 450ms) */}
      <AnimatePresence>
        {showSkipHint && !isExiting && !isSkipping && (
          <motion.div
            key="skip-hint"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="absolute bottom-6 right-6 sm:bottom-8 sm:right-8 text-[#9CA3AF] font-mono text-[10px] sm:text-xs uppercase tracking-widest pointer-events-none select-none"
          >
            <span>ESC / TAP TO SKIP</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>,
    introRoot
  );
};

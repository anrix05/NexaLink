import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';

interface WelcomeRevealProps {
  name: string;
  onComplete: () => void;
}

export const WelcomeReveal: React.FC<WelcomeRevealProps> = ({ name, onComplete }) => {
  const { currentRole } = useAuth();
  const [isExiting, setIsExiting] = useState(false);

  // Formatted live time string for bottom-right honest metadata counter
  const [currentTime, setCurrentTime] = useState<string>(() => {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) + ' IST';
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) + ' IST');
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Check prefers-reduced-motion
  const prefersReducedMotion =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const handleDismiss = () => {
    if (isExiting) return;
    setIsExiting(true);
    setTimeout(() => {
      onComplete();
    }, 280); // Smooth 280ms fade out into light dashboard
  };

  useEffect(() => {
    // If reduced motion is requested by OS, bypass sequence immediately
    if (prefersReducedMotion) {
      onComplete();
      return;
    }

    // Auto-complete after sequence completes (~1500ms before triggering exit fade)
    const timer = setTimeout(() => {
      handleDismiss();
    }, 1500);

    // Skippable via any keydown
    const handleKeyDown = () => {
      handleDismiss();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onComplete, prefersReducedMotion]);

  const nameWords = (name || 'Member').split(' ');

  // Staggered motion variants
  const overlayVariants = {
    initial: { opacity: 1 },
    animate: { opacity: 1 },
    exit: { opacity: 0, transition: { duration: 0.28, ease: [0.16, 1, 0.3, 1] as const } }
  };

  const cornerVariants = {
    hidden: { opacity: 0, y: -6 },
    show: { opacity: 1, y: 0, transition: { duration: 0.2, ease: 'easeOut' as const } }
  };

  const nameContainerVariants = {
    hidden: { opacity: 1 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1
      }
    }
  };

  const wordVariants = {
    hidden: { opacity: 0, y: 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.32, ease: [0.16, 1, 0.3, 1] as const }
    }
  };

  const lineVariants = {
    hidden: { scaleX: 0, opacity: 0 },
    show: {
      scaleX: 1,
      opacity: 1,
      transition: { duration: 0.35, delay: 0.25, ease: [0.16, 1, 0.3, 1] as const }
    }
  };

  const roleTag = (currentRole || 'MEMBER').toUpperCase();

  return (
    <motion.div
      variants={overlayVariants}
      initial="initial"
      animate={isExiting ? 'exit' : 'animate'}
      exit="exit"
      onClick={handleDismiss}
      className="fixed inset-0 z-50 bg-[#0A0A0A] text-[#F3F4F6] flex flex-col justify-between p-6 sm:p-10 lg:p-12 cursor-pointer select-none font-sans"
    >
      {/* Top Header Corner Metadata */}
      <div className="flex items-center justify-between">
        <motion.div
          variants={cornerVariants}
          initial="hidden"
          animate="show"
          className="text-[10px] sm:text-xs font-mono font-bold tracking-widest text-[#9CA3AF] uppercase flex items-center gap-2"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>NEXALINK PORTAL</span>
        </motion.div>

        <motion.div
          variants={cornerVariants}
          initial="hidden"
          animate="show"
          className="text-[10px] sm:text-xs font-mono font-bold tracking-widest text-[#9CA3AF] uppercase"
        >
          VIT WADALA, MUMBAI
        </motion.div>
      </div>

      {/* Center Hero Name & Divider Area */}
      <div className="my-auto py-8 text-center flex flex-col items-center justify-center">
        <motion.div
          variants={nameContainerVariants}
          initial="hidden"
          animate="show"
          className="space-y-2 max-w-4xl mx-auto flex flex-col items-center"
        >
          {/* Eyebrow Label */}
          <motion.span
            variants={wordVariants}
            className="block text-[11px] sm:text-xs font-display font-bold uppercase tracking-[0.25em] text-[#9CA3AF] mb-1"
          >
            WELCOME BACK
          </motion.span>

          {/* Large Bold Display Name */}
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
            {nameWords.map((word, idx) => (
              <motion.span
                key={`${word}-${idx}`}
                variants={wordVariants}
                className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-display font-black text-[#F3F4F6] tracking-tight leading-none"
              >
                {word}
              </motion.span>
            ))}
          </div>

          {/* Portfolio-Style Thin Divider Line */}
          <motion.div
            variants={lineVariants}
            initial="hidden"
            animate="show"
            className="w-full max-w-md h-[1px] bg-[#374151] my-4 origin-left"
          />
        </motion.div>
      </div>

      {/* Bottom Footer Corner Metadata */}
      <div className="flex items-end justify-between border-t border-[#1F2937] pt-4 sm:pt-6">
        <motion.div
          variants={cornerVariants}
          initial="hidden"
          animate="show"
          className="text-[10px] sm:text-xs font-mono font-bold tracking-widest text-[#9CA3AF] uppercase"
        >
          ROLE // {roleTag}
        </motion.div>

        <motion.div
          variants={cornerVariants}
          initial="hidden"
          animate="show"
          className="text-xs sm:text-sm font-mono font-bold tracking-widest text-[#F3F4F6]"
        >
          {currentTime}
        </motion.div>
      </div>
    </motion.div>
  );
};

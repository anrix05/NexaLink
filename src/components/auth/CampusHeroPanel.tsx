import React, { useState, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

interface CampusHeroPanelProps {
  className?: string;
}

export const CampusHeroPanel: React.FC<CampusHeroPanelProps> = ({ className = '' }) => {
  const shouldReduceMotion = useReducedMotion();
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Subtle mouse parallax (desktop only, disabled under reduced motion)
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (shouldReduceMotion || !containerRef.current) return;
    const { clientX, clientY } = e;
    const { left, top, width, height } = containerRef.current.getBoundingClientRect();
    const xPct = (clientX - (left + width / 2)) / (width / 2);
    const yPct = (clientY - (top + height / 2)) / (height / 2);
    // Subtle shift: max 6px in either direction
    setMouseOffset({
      x: Math.max(-6, Math.min(6, xPct * 6)),
      y: Math.max(-6, Math.min(6, yPct * 6))
    });
  };

  const handleMouseLeave = () => {
    setMouseOffset({ x: 0, y: 0 });
  };

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 14, scale: 0.98 },
        show: {
          opacity: 1,
          y: 0,
          scale: 1,
          transition: {
            duration: shouldReduceMotion ? 0 : 0.65,
            ease: [0.16, 1, 0.3, 1],
            delay: shouldReduceMotion ? 0 : 0.32
          }
        }
      }}
      className={`w-full pt-1 ${className}`}
    >
      {/* Outer Frame matching Spotlight Carousel & Card aesthetics */}
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="relative w-full h-[220px] sm:h-[260px] md:h-[290px] rounded-2xl p-1.5 sm:p-2 bg-white border border-slate-200/90 shadow-sm overflow-hidden group select-none"
      >
        {/* Inner Image Viewport with overflow-hidden */}
        <div className="relative w-full h-full overflow-hidden rounded-xl bg-slate-100">
          {/* Continuous Ken Burns zoom + gentle mouse parallax */}
          <motion.img
            src="/images/vit-campus-grounds-auth.jpg"
            alt="Vidyalankar Institute of Technology Campus Grounds and Building, Wadala"
            className="w-full h-full object-cover object-center grayscale contrast-[1.12] brightness-[0.98] transform-gpu pointer-events-none"
            animate={
              shouldReduceMotion
                ? { scale: 1, x: 0, y: 0 }
                : {
                    scale: [1.02, 1.07, 1.02],
                    x: mouseOffset.x,
                    y: mouseOffset.y
                  }
            }
            transition={
              shouldReduceMotion
                ? { duration: 0 }
                : {
                    scale: {
                      duration: 22,
                      repeat: Infinity,
                      ease: 'easeInOut'
                    },
                    x: { type: 'spring', stiffness: 220, damping: 24 },
                    y: { type: 'spring', stiffness: 220, damping: 24 }
                  }
            }
            loading="lazy"
          />

          {/* Bottom Gradient Scrim for Permanent Caption Contrast */}
          <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/80 via-black/35 to-transparent pointer-events-none" />

          {/* Architectural Caption Pill */}
          <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 z-10 bg-[#0A0A0A]/90 backdrop-blur-md text-white text-[10px] sm:text-xs font-display font-bold px-3.5 py-2 rounded-xl uppercase tracking-widest flex items-center justify-between border border-white/15 shadow-xl">
            <span className="truncate mr-2">CAMPUS GROUNDS</span>
            <span className="font-mono text-neutral-400 text-[9px] sm:text-[10px] shrink-0">
              WADALA
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

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
        hidden: { opacity: 0, y: 14 },
        show: {
          opacity: 1,
          y: 0,
          transition: {
            duration: shouldReduceMotion ? 0 : 0.5,
            ease: [0.16, 1, 0.3, 1],
            delay: shouldReduceMotion ? 0 : 0.2
          }
        }
      }}
      className={`w-full ${className}`}
    >
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="relative w-full h-[220px] sm:h-[260px] md:h-[280px] rounded-xl overflow-hidden border border-[#E5E7EB] bg-[#FAFAFA] select-none"
      >
        <motion.img
          src="/images/vit-campus-grounds-auth.jpg"
          alt="Vidyalankar Institute of Technology Campus Grounds and Building, Wadala"
          className="w-full h-full object-cover object-center grayscale contrast-[1.08] brightness-[0.98] transform-gpu pointer-events-none"
          animate={
            shouldReduceMotion
              ? { scale: 1, x: 0, y: 0 }
              : {
                  scale: [1.02, 1.06, 1.02],
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
      </div>

      {/* Plain sentence-case caption underneath (no pill, no mono, no uppercase) */}
      <p className="text-xs text-[#6B7280] font-sans mt-2">
        Campus grounds, Wadala
      </p>
    </motion.div>
  );
};

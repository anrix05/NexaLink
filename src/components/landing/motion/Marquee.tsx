import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useReducedMotionPreference } from '../../../lib/motionPreference';

interface MarqueeProps {
  children: React.ReactNode;
  speed?: number; // duration in seconds for one full loop
  direction?: 'left' | 'right';
  className?: string;
}

export const Marquee: React.FC<MarqueeProps> = ({
  children,
  speed = 25,
  direction = 'left',
  className = '',
}) => {
  const reduceMotion = useReducedMotionPreference();
  const [isPaused, setIsPaused] = useState(false);

  if (reduceMotion) {
    return (
      <div className={`overflow-x-auto py-2 flex items-center gap-8 ${className}`}>
        {children}
      </div>
    );
  }

  const initialX = direction === 'left' ? '0%' : '-50%';
  const animateX = direction === 'left' ? '-50%' : '0%';

  return (
    <div
      className={`overflow-hidden select-none flex ${className}`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      role="region"
      aria-label="Accreditation and institutional ticker"
    >
      <motion.div
        className="flex shrink-0 items-center gap-8 pr-8"
        animate={isPaused ? {} : { x: [initialX, animateX] }}
        transition={{
          x: {
            repeat: Infinity,
            repeatType: 'loop',
            duration: speed,
            ease: 'linear',
          },
        }}
      >
        {children}
        {children}
      </motion.div>
    </div>
  );
};

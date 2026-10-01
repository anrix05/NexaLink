import React from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';
import { useReducedMotionPreference } from '../../../lib/motionPreference';

export const ScrollProgress: React.FC = () => {
  const reduceMotion = useReducedMotionPreference();
  const { scrollYProgress } = useScroll();

  const scaleX = useSpring(scrollYProgress, {
    stiffness: 400,
    damping: 30,
    restDelta: 0.001,
  });

  if (reduceMotion) return null;

  return (
    <motion.div
      style={{ scaleX }}
      className="fixed top-0 left-0 right-0 h-[2px] bg-[#0A0A0A] origin-left z-50 pointer-events-none"
      aria-hidden="true"
    />
  );
};

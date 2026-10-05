import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { EASING, DURATION } from './motion';
import { useReducedMotionPreference } from '../../../lib/motionPreference';

interface RevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  yOffset?: number;
  as?: keyof typeof motion;
}

export const Reveal: React.FC<RevealProps> = ({
  children,
  className = '',
  delay = 0,
  duration = DURATION.base,
  yOffset = 24,
  as = 'div',
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotionPreference();
  const isInView = useInView(ref, { once: true, margin: '0px' });

  // Safe fallback: under reduced motion or SSR, keep visible immediately
  if (reduceMotion) {
    const Component = as as any;
    return <Component className={className}>{children}</Component>;
  }

  const MotionComponent = motion[as as keyof typeof motion] as any;

  return (
    <MotionComponent
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: yOffset }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: yOffset }}
      transition={{
        duration,
        delay,
        ease: EASING.expoOut,
      }}
    >
      {children}
    </MotionComponent>
  );
};

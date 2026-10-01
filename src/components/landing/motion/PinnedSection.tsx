import React, { useRef } from 'react';
import { useScroll, MotionValue } from 'framer-motion';
import { useReducedMotionPreference } from '../../../lib/motionPreference';

interface PinnedSectionProps {
  children: (progress: MotionValue<number>, isReduced: boolean) => React.ReactNode;
  heightVip?: string; // runway height, e.g. "300vh"
  className?: string;
  id?: string;
}

export const PinnedSection: React.FC<PinnedSectionProps> = ({
  children,
  heightVip = '300vh',
  className = '',
  id,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotionPreference();

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  if (reduceMotion) {
    return (
      <section id={id} className={`w-full py-16 ${className}`}>
        {children(scrollYProgress, true)}
      </section>
    );
  }

  return (
    <section
      id={id}
      ref={containerRef}
      className={`relative w-full ${className}`}
      style={{ height: heightVip }}
    >
      <div className="sticky top-0 h-screen w-full overflow-hidden flex flex-col justify-center">
        {children(scrollYProgress, false)}
      </div>
    </section>
  );
};

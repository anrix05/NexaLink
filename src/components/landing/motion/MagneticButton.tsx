import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { SPRINGS } from './motion';
import { useReducedMotionPreference } from '../../../lib/motionPreference';

interface MagneticButtonProps {
  children: React.ReactNode;
  className?: string;
  maxDistance?: number;
}

export const MagneticButton: React.FC<MagneticButtonProps> = ({
  children,
  className = '',
  maxDistance = 8,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [canPointerFine, setCanPointerFine] = useState(false);
  const reduceMotion = useReducedMotionPreference();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const match = window.matchMedia('(pointer: fine)').matches;
      setCanPointerFine(match);
    }
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reduceMotion || !canPointerFine || !ref.current) return;
    const { clientX, clientY } = e;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    const centerX = left + width / 2;
    const centerY = top + height / 2;

    const distanceX = (clientX - centerX) * 0.22;
    const distanceY = (clientY - centerY) * 0.22;

    const clampedX = Math.max(-maxDistance, Math.min(maxDistance, distanceX));
    const clampedY = Math.max(-maxDistance, Math.min(maxDistance, distanceY));

    setPosition({ x: clampedX, y: clampedY });
  };

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 });
  };

  if (reduceMotion || !canPointerFine) {
    return <div className={`inline-block ${className}`}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{ x: position.x, y: position.y }}
      transition={SPRINGS.magnetic}
      className={`inline-block ${className}`}
    >
      {children}
    </motion.div>
  );
};

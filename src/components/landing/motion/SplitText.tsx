import React from 'react';
import { motion } from 'framer-motion';
import { EASING, STAGGER } from './motion';
import { useReducedMotionPreference } from '../../../lib/motionPreference';

interface SplitTextProps {
  children: string;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'span' | 'div';
  className?: string;
  delay?: number;
  stagger?: number;
  triggerInView?: boolean;
}

export const SplitText: React.FC<SplitTextProps> = ({
  children,
  as: Component = 'h1',
  className = '',
  delay = 0,
  stagger = STAGGER.words,
  triggerInView = true,
}) => {
  const reduceMotion = useReducedMotionPreference();
  const words = children.split(' ');

  if (reduceMotion) {
    return <Component className={className}>{children}</Component>;
  }

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: stagger,
        delayChildren: delay,
      },
    },
  };

  const wordVariants = {
    hidden: {
      y: '100%',
      opacity: 0,
    },
    visible: {
      y: '0%',
      opacity: 1,
      transition: {
        duration: 0.65,
        ease: EASING.expoOut,
      },
    },
  };

  const MotionComponent = motion[Component as keyof typeof motion] as any;

  return (
    <MotionComponent
      className={className}
      aria-label={children}
      variants={containerVariants}
      initial="hidden"
      {...(triggerInView
        ? { whileInView: 'visible', viewport: { once: true, margin: '-40px' } }
        : { animate: 'visible' })}
    >
      {words.map((word, i) => (
        <span
          key={`${word}-${i}`}
          className="inline-block overflow-hidden align-top"
          aria-hidden="true"
        >
          <motion.span
            className="inline-block"
            variants={wordVariants}
          >
            {word}
            {i < words.length - 1 ? '\u00A0' : ''}
          </motion.span>
        </span>
      ))}
    </MotionComponent>
  );
};

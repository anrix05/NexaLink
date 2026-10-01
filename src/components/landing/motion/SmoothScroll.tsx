import React, { createContext, useContext, useEffect, useRef } from 'react';
import Lenis from 'lenis';
import { useReducedMotionPreference } from '../../../lib/motionPreference';

interface LenisContextValue {
  lenis: Lenis | null;
  scrollTo: (target: string | HTMLElement | number, options?: { offset?: number; immediate?: boolean }) => void;
}

const LenisContext = createContext<LenisContextValue>({
  lenis: null,
  scrollTo: () => {},
});

export const useLenis = () => useContext(LenisContext);

interface SmoothScrollProps {
  children: React.ReactNode;
}

export const SmoothScroll: React.FC<SmoothScrollProps> = ({ children }) => {
  const reduceMotion = useReducedMotionPreference();
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    // If reduced motion is requested, do not initialize smooth scroll
    if (reduceMotion) {
      if (lenisRef.current) {
        lenisRef.current.destroy();
        lenisRef.current = null;
      }
      return;
    }

    // Touch device detection: touch screens with coarse pointers
    const isTouch = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;

    // Initialize Lenis
    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      touchMultiplier: isTouch ? 1.2 : 1.5,
      infinite: false,
      smoothWheel: true,
    });

    lenisRef.current = lenis;

    let rafId: number;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }

    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [reduceMotion]);

  const scrollTo = (target: string | HTMLElement | number, options?: { offset?: number; immediate?: boolean }) => {
    const navOffset = options?.offset ?? -72; // default offset for 64px header + padding

    if (reduceMotion || !lenisRef.current) {
      if (typeof target === 'string') {
        const el = document.querySelector(target);
        if (el) {
          const top = el.getBoundingClientRect().top + window.scrollY + navOffset;
          window.scrollTo({ top, behavior: reduceMotion ? 'auto' : 'smooth' });
        }
      } else if (typeof target === 'number') {
        window.scrollTo({ top: target, behavior: reduceMotion ? 'auto' : 'smooth' });
      } else if (target instanceof HTMLElement) {
        const top = target.getBoundingClientRect().top + window.scrollY + navOffset;
        window.scrollTo({ top, behavior: reduceMotion ? 'auto' : 'smooth' });
      }
      return;
    }

    lenisRef.current.scrollTo(target, {
      offset: navOffset,
      immediate: options?.immediate ?? false,
    });
  };

  return (
    <LenisContext.Provider value={{ lenis: lenisRef.current, scrollTo }}>
      {children}
    </LenisContext.Provider>
  );
};

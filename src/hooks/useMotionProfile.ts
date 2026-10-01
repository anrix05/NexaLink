import { useSyncExternalStore } from 'react';
import { getDevicePerfTier, type PerfTier } from '../lib/perfTier';
import { getReducedMotionPreference } from '../lib/motionPreference';

export type MotionLayout = 'phone' | 'tablet' | 'desktop';
export type MotionInput = 'touch' | 'mouse';

export interface MotionProfile {
  layout: MotionLayout;
  input: MotionInput;
  perf: PerfTier;
  reducedMotion: boolean;
  shortViewport: boolean;
  supportsSticky: boolean;
}

function getSnapshot(): MotionProfile {
  if (typeof window === 'undefined') {
    return {
      layout: 'desktop',
      input: 'mouse',
      perf: 'high',
      reducedMotion: false,
      shortViewport: false,
      supportsSticky: true,
    };
  }

  const width = window.innerWidth;
  const height = window.innerHeight;

  let layout: MotionLayout = 'desktop';
  if (width < 640) {
    layout = 'phone';
  } else if (width < 1024) {
    layout = 'tablet';
  }

  // Capability query: mouse is fine pointer with hover capability
  const isMouse = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const input: MotionInput = isMouse ? 'mouse' : 'touch';

  const shortViewport = height <= 560;

  let supportsSticky = true;
  if (typeof CSS !== 'undefined' && typeof CSS.supports === 'function') {
    supportsSticky = CSS.supports('position', 'sticky') || CSS.supports('position', '-webkit-sticky');
  }

  return {
    layout,
    input,
    perf: getDevicePerfTier(),
    reducedMotion: getReducedMotionPreference(),
    shortViewport,
    supportsSticky,
  };
}

let cachedSnapshot: MotionProfile = getSnapshot();

function subscribe(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const handleResize = () => {
    const next = getSnapshot();
    if (
      next.layout !== cachedSnapshot.layout ||
      next.input !== cachedSnapshot.input ||
      next.reducedMotion !== cachedSnapshot.reducedMotion ||
      next.shortViewport !== cachedSnapshot.shortViewport ||
      next.perf !== cachedSnapshot.perf
    ) {
      cachedSnapshot = next;
      callback();
    }
  };

  window.addEventListener('resize', handleResize, { passive: true });
  window.addEventListener('orientationchange', handleResize, { passive: true });
  window.addEventListener('nexalink:motion-preference-changed', handleResize);

  return () => {
    window.removeEventListener('resize', handleResize);
    window.removeEventListener('orientationchange', handleResize);
    window.removeEventListener('nexalink:motion-preference-changed', handleResize);
  };
}

export function useMotionProfile(): MotionProfile {
  return useSyncExternalStore(
    subscribe,
    // MUST return the same cached reference unless the store actually changed.
    // Creating a new object here on every call causes an infinite re-render loop.
    () => cachedSnapshot,
    () => ({
      layout: 'desktop' as MotionLayout,
      input: 'mouse' as MotionInput,
      perf: 'high' as PerfTier,
      reducedMotion: false,
      shortViewport: false,
      supportsSticky: true,
    })
  );
}

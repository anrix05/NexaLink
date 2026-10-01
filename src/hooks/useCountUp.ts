import { useState, useEffect } from 'react';
import { getReducedMotionPreference } from '../lib/motionPreference';

/**
 * Custom hook to animate numeric value count-up from 0 to target on mount or trigger
 * Immediately returns targetValue if reduced motion is enabled.
 * 
 * @param targetValue The end target number
 * @param durationMs Duration of animation in ms (default 700ms)
 * @param decimals Number of decimal places to format to (default 0)
 * @param trigger Whether the animation should start (default true)
 */
export function useCountUp(
  targetValue: number,
  durationMs: number = 700,
  decimals: number = 0,
  trigger: boolean = true
): number {
  const isReduced = getReducedMotionPreference();
  const [count, setCount] = useState<number>(() => isReduced ? targetValue : 0);

  useEffect(() => {
    if (!trigger) return;

    if (getReducedMotionPreference()) {
      setCount(targetValue);
      return;
    }

    let startTimestamp: number | null = null;
    let animationFrameId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / durationMs, 1);

      // Ease-out cubic: 1 - Math.pow(1 - progress, 3)
      const easeOutProgress = 1 - Math.pow(1 - progress, 3);
      const currentVal = parseFloat((easeOutProgress * targetValue).toFixed(decimals));

      setCount(currentVal);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      } else {
        setCount(targetValue);
      }
    };

    animationFrameId = requestAnimationFrame(step);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [targetValue, durationMs, decimals, trigger]);

  return count;
}

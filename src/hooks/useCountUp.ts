import { useState, useEffect } from 'react';

/**
 * Custom hook to animate numeric value count-up from 0 to target on mount
 * @param targetValue The end target number
 * @param durationMs Duration of animation in ms (default 700ms)
 * @param decimals Number of decimal places to format to (default 0)
 */
export function useCountUp(targetValue: number, durationMs: number = 700, decimals: number = 0): number {
  const [count, setCount] = useState<number>(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    let animationFrameId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / durationMs, 1);

      // Ease-out cubic formula: 1 - Math.pow(1 - progress, 3)
      const easeOutProgress = 1 - Math.pow(1 - progress, 3);
      const currentVal = parseFloat((easeOutProgress * targetValue).toFixed(decimals));

      setCount(currentVal);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      }
    };

    animationFrameId = requestAnimationFrame(step);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [targetValue, durationMs, decimals]);

  return count;
}

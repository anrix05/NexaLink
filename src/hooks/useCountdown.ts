import { useState, useEffect, useCallback } from 'react';

interface UseCountdownOptions {
  initialSeconds: number;
  onFinish?: () => void;
  autoStart?: boolean;
}

export interface UseCountdownReturn {
  secondsRemaining: number;
  minutes: number;
  seconds: number;
  formatted: string; // "mm:ss"
  isFinished: boolean;
  isRunning: boolean;
  start: () => void;
  pause: () => void;
  reset: (newSeconds?: number) => void;
}

export function useCountdown({
  initialSeconds,
  onFinish,
  autoStart = true
}: UseCountdownOptions): UseCountdownReturn {
  const [secondsRemaining, setSecondsRemaining] = useState<number>(Math.max(0, initialSeconds));
  const [isRunning, setIsRunning] = useState<boolean>(autoStart && initialSeconds > 0);

  useEffect(() => {
    setSecondsRemaining(Math.max(0, initialSeconds));
    if (autoStart && initialSeconds > 0) {
      setIsRunning(true);
    }
  }, [initialSeconds, autoStart]);

  useEffect(() => {
    if (!isRunning || secondsRemaining <= 0) return;

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsRunning(false);
          onFinish?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, secondsRemaining, onFinish]);

  const start = useCallback(() => {
    if (secondsRemaining > 0) {
      setIsRunning(true);
    }
  }, [secondsRemaining]);

  const pause = useCallback(() => {
    setIsRunning(false);
  }, []);

  const reset = useCallback((newSeconds?: number) => {
    const next = typeof newSeconds === 'number' ? newSeconds : initialSeconds;
    setSecondsRemaining(Math.max(0, next));
    setIsRunning(next > 0);
  }, [initialSeconds]);

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const formatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return {
    secondsRemaining,
    minutes,
    seconds,
    formatted,
    isFinished: secondsRemaining === 0,
    isRunning,
    start,
    pause,
    reset
  };
}

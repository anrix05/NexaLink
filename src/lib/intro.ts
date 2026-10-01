import { useState, useEffect } from 'react';

/**
 * NexaLink Intro Animation Configuration & State Controller
 * PRD v2.7.0 / Institutional Motion Architecture
 */

export const STORAGE_KEY = 'nexalink:intro:v1';
export const LOCAL_STORAGE_KEY = 'nexalink:intro:local:v1';

export type IntroScope = 'session' | 'local' | 'always';
export const INTRO_SCOPE: IntroScope = 'session';

export const INTRO_ENABLED_ROUTES = ['/'];

/**
 * Brand node accent sampled directly from the canonical 1024x1024 logomark.
 * Exposed here so it can be swapped to Actionable Amber (#B45309) if strict monochrome is mandated.
 */
export const INTRO_NODE_COLOR = '#FD9C03';

/**
 * Timeline duration constants (in milliseconds)
 */
export const INTRO_TIMING = {
  desktop: {
    startDelay: 40,
    assembleDuration: 450,
    settleDuration: 150,
    igniteDuration: 250,
    holdDuration: 100,
    exitDuration: 350,
    totalDuration: 1200,
  },
  mobile: {
    startDelay: 30,
    assembleDuration: 400,
    settleDuration: 120,
    igniteDuration: 200,
    holdDuration: 80,
    exitDuration: 300,
    totalDuration: 1050,
  },
  skipFadeDuration: 180,
} as const;

export type PerfTier = 'low' | 'mid' | 'high';

/**
 * Pure and synchronous lightweight device performance tier classifier.
 * Never measures FPS; relies on standard browser hardware and network hints.
 */
export function getPerfTier(): PerfTier {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return 'mid';
  }

  const nav = navigator as Navigator & {
    deviceMemory?: number;
    connection?: {
      saveData?: boolean;
      effectiveType?: string;
    };
  };

  const saveData = Boolean(nav.connection?.saveData);
  const memory = nav.deviceMemory ?? 8;
  const cores = nav.hardwareConcurrency ?? 8;
  const netType = nav.connection?.effectiveType ?? '4g';

  // Low Tier: Data saver, ancient/constrained hardware, or 2G network
  if (saveData || memory <= 2 || cores <= 2 || netType === '2g' || netType === 'slow-2g') {
    return 'low';
  }

  // Mid Tier: Mobile/tablet viewport, medium memory or moderate core count
  const isSmallViewport = window.innerWidth < 1024;
  if (isSmallViewport || memory <= 4 || cores <= 4) {
    return 'mid';
  }

  return 'high';
}

/**
 * Checks if the current URL contains OAuth / password-recovery / auth-callback parameters
 * that should immediately bypass the intro animation.
 */
export function isAuthCallbackUrl(url: string = typeof window !== 'undefined' ? window.location.href : ''): boolean {
  if (!url) return false;
  const searchAndHash = url.includes('?') || url.includes('#') ? url : '';
  return (
    searchAndHash.includes('access_token') ||
    searchAndHash.includes('type=recovery') ||
    searchAndHash.includes('type=signup') ||
    searchAndHash.includes('type=magiclink') ||
    searchAndHash.includes('code=') ||
    searchAndHash.includes('error_description=')
  );
}

/**
 * Evaluates whether the intro animation should play on the current document load.
 */
export function shouldPlayIntro(): boolean {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return false;
  }

  // 1. Force override query params
  const params = new URLSearchParams(window.location.search);
  if (params.get('intro') === '1') {
    return true;
  }
  if (params.get('intro') === '0') {
    return false;
  }

  // 2. Route evaluation: strictly enabled routes (initial boot at '/')
  const currentPath = window.location.pathname || '/';
  if (!INTRO_ENABLED_ROUTES.includes(currentPath)) {
    return false;
  }

  // 3. Auth callback bypass
  if (isAuthCallbackUrl(window.location.href)) {
    return false;
  }

  // 4. Accessibility & automation overrides
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return false;
  }
  if (navigator.webdriver) {
    return false;
  }

  // 5. Performance tier evaluation
  if (getPerfTier() === 'low') {
    return false;
  }

  // 6. Persistence / Scope check
  try {
    if (INTRO_SCOPE === 'session') {
      const seen = sessionStorage.getItem(STORAGE_KEY);
      if (seen) return false;
    } else if (INTRO_SCOPE === 'local') {
      const item = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (item) {
        const parsed = JSON.parse(item);
        if (parsed.expiry && Date.now() < parsed.expiry) {
          return false;
        }
      }
    }
  } catch {
    // If storage is blocked (e.g. strict private browsing), default to playing once per memory instance
  }

  return true;
}

/**
 * Marks the intro as seen in storage.
 */
export function markIntroSeen(): void {
  if (typeof window === 'undefined') return;

  try {
    sessionStorage.setItem(STORAGE_KEY, 'true');
    if (INTRO_SCOPE === 'local') {
      const sevenDays = 7 * 24 * 60 * 60 * 1000;
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({ seen: true, expiry: Date.now() + sevenDays }));
    }
  } catch {
    // Ignore private browsing storage quota/security errors
  }
}

/**
 * Clears the seen flag and forces a reload at /?intro=1.
 */
export function replayIntro(): void {
  if (typeof window === 'undefined') return;

  try {
    sessionStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  } catch {
    // Ignore
  }

  window.location.href = '/?intro=1';
}

/**
 * Custom React Hook that returns true when the intro animation has completed or was skipped.
 * Used by hero entrance animations, scroll reveal, and count-up counters.
 */
export function useIntroDone(): boolean {
  const [isDone, setIsDone] = useState<boolean>(() => {
    if (typeof document === 'undefined') return true;
    return document.documentElement.dataset.intro !== 'play';
  });

  useEffect(() => {
    if (isDone) return;

    // Check if attribute already changed
    if (document.documentElement.dataset.intro !== 'play') {
      setIsDone(true);
      return;
    }

    const handleIntroDone = () => {
      setIsDone(true);
    };

    window.addEventListener('nexalink:intro-done', handleIntroDone, { once: true });
    return () => window.removeEventListener('nexalink:intro-done', handleIntroDone);
  }, [isDone]);

  return isDone;
}

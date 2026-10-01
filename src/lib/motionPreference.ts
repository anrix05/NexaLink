import { useState, useEffect, useSyncExternalStore } from 'react';

const REDUCE_MOTION_STORAGE_KEY = 'nexalink:reduce-motion';
const EVENT_NAME = 'nexalink:motion-preference-changed';

export function getReducedMotionPreference(): boolean {
  if (typeof window === 'undefined') return false;

  // 1. Check user override in localStorage
  try {
    const override = localStorage.getItem(REDUCE_MOTION_STORAGE_KEY);
    if (override !== null) {
      return override === 'true';
    }
  } catch {
    // Storage access may be restricted
  }

  // 2. Fall back to OS media query
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function setReducedMotionPreference(reduce: boolean): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(REDUCE_MOTION_STORAGE_KEY, String(reduce));
  } catch {
    // Storage access may be restricted
  }

  // Sync dataset on <html> for CSS
  if (reduce) {
    document.documentElement.dataset.reduceMotion = 'true';
    document.documentElement.classList.add('reduce-motion');
    document.documentElement.classList.remove('motion-ok');
  } else {
    delete document.documentElement.dataset.reduceMotion;
    document.documentElement.classList.remove('reduce-motion');
    document.documentElement.classList.add('motion-ok');
  }

  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { reduce } }));
}

export function toggleReducedMotionPreference(): boolean {
  const current = getReducedMotionPreference();
  const next = !current;
  setReducedMotionPreference(next);
  return next;
}

function subscribe(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const handleCustom = () => callback();
  window.addEventListener(EVENT_NAME, handleCustom);

  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const handleMedia = () => {
    // Only apply media query changes if no manual override is set
    try {
      if (localStorage.getItem(REDUCE_MOTION_STORAGE_KEY) === null) {
        callback();
      }
    } catch {
      callback();
    }
  };

  mediaQuery.addEventListener('change', handleMedia);

  return () => {
    window.removeEventListener(EVENT_NAME, handleCustom);
    mediaQuery.removeEventListener('change', handleMedia);
  };
}

export function useReducedMotionPreference(): boolean {
  return useSyncExternalStore(
    subscribe,
    getReducedMotionPreference,
    () => false
  );
}

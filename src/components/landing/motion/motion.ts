/**
 * NexaLink Motion Design Tokens
 * Obsidian Monochrome System · Strict Timing & Physical Spring Hierarchy
 */

export const DURATION = {
  fast: 0.2,
  base: 0.5,
  slow: 0.9,
} as const;

export const EASING = {
  // Canonical "expo out" curve: responsive start, graceful settle
  expoOut: [0.22, 1, 0.36, 1] as [number, number, number, number],
  // Smooth entrance
  easeOut: [0.16, 1, 0.3, 1] as [number, number, number, number],
  // Symmetrical ease
  easeInOut: [0.65, 0, 0.35, 1] as [number, number, number, number],
} as const;

export const SPRINGS = {
  // Snappy responsive UI micro-interactions (buttons, badges, pills)
  ui: {
    type: 'spring',
    stiffness: 400,
    damping: 20,
    mass: 0.8,
  } as const,
  // Softer physical spring for large cards, modals, and container panels
  large: {
    type: 'spring',
    stiffness: 120,
    damping: 20,
    mass: 1,
  } as const,
  // Magnetic button cursor attraction
  magnetic: {
    type: 'spring',
    stiffness: 350,
    damping: 18,
    mass: 0.5,
  } as const,
} as const;

export const STAGGER = {
  words: 0.04,
  lines: 0.08,
  items: 0.06,
  cards: 0.1,
} as const;

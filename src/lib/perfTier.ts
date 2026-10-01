/**
 * NexaLink Performance Tier Classifier
 * Evaluates hardware and connection capabilities synchronously without blocking render.
 */

export type PerfTier = 'low' | 'mid' | 'high';

export function getDevicePerfTier(): PerfTier {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return 'high';
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

  // Low Tier: Data saver, very low memory/cores, or 2G network
  if (saveData || memory <= 2 || cores <= 2 || netType === '2g' || netType === 'slow-2g') {
    return 'low';
  }

  // Mid Tier: Moderate memory or moderate core count, or 3G
  if (memory <= 4 || cores <= 4 || netType === '3g') {
    return 'mid';
  }

  // High Tier: Modern capable devices (desktop and modern phones/tablets)
  return 'high';
}

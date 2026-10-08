// Small seeded PRNG (mulberry32) for deterministic mock data generation
// Ensures identical data generation on every execution with no third-party dependencies.

export class SeededRandom {
  private s: number;

  constructor(seed = 123456789) {
    this.s = seed >>> 0;
  }

  // Returns float in [0, 1)
  next(): number {
    let t = (this.s += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  intBetween(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  floatBetween(min: number, max: number, decimals = 2): number {
    const val = this.next() * (max - min) + min;
    const factor = Math.pow(10, decimals);
    return Math.round(val * factor) / factor;
  }

  boolean(probability = 0.5): boolean {
    return this.next() < probability;
  }

  pick<T>(items: readonly T[] | T[]): T {
    if (items.length === 0) {
      throw new Error('Cannot pick from empty array');
    }
    const idx = Math.floor(this.next() * items.length);
    return items[idx];
  }

  pickMultiple<T>(items: readonly T[] | T[], count: number): T[] {
    const copy = [...items];
    const result: T[] = [];
    const n = Math.min(count, copy.length);
    for (let i = 0; i < n; i++) {
      const idx = Math.floor(this.next() * copy.length);
      result.push(copy.splice(idx, 1)[0]);
    }
    return result;
  }

  shuffle<T>(items: readonly T[] | T[]): T[] {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }
}

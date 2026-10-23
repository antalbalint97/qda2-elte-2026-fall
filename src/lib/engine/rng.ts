// The one seeded random-number source for every lab, dataset generator and simulation.
// mulberry32 and the Box–Muller gaussian live in src/lib/stats.ts (used by the original modules);
// they are re-exported here so nothing else defines its own copy.
import { gaussian, mulberry32 } from "../stats";

export { gaussian, mulberry32 };

export type Rand = () => number;

/** A seeded uniform source on [0, 1). Seeds are coerced to unsigned 32-bit integers. */
export function rng(seed: number): Rand {
  return mulberry32(seed >>> 0);
}

/** Integer in [0, n). */
export function randInt(rand: Rand, n: number): number {
  return Math.min(n - 1, Math.floor(rand() * n));
}

/** Simple random sample of `n` distinct indices from 0..N−1 (partial Fisher–Yates, O(N)). */
export function sampleIndices(N: number, n: number, rand: Rand): number[] {
  const m = Math.max(0, Math.min(n, N));
  const idx = new Int32Array(N);
  for (let i = 0; i < N; i++) idx[i] = i;
  for (let i = 0; i < m; i++) {
    const j = i + Math.floor(rand() * (N - i));
    const t = idx[i];
    idx[i] = idx[j];
    idx[j] = t;
  }
  return Array.from(idx.subarray(0, m));
}

/** n independent standard-normal draws scaled to N(mu, sd²). */
export function normalSample(n: number, mu: number, sd: number, rand: Rand): number[] {
  const z = gaussian(rand);
  return Array.from({ length: n }, () => mu + sd * z());
}

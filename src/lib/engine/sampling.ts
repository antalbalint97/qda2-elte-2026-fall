// Finite-population sampling simulation (Sampling Universe, CI Explorer). Seeded and deterministic.
import { describe as describeFull, histogram as histFull, median } from "./descriptives";
import { clamp, mean, ssAround } from "./numeric";
import { gaussian, rng, sampleIndices, type Rand } from "./rng";

export type PopulationShape = "normal" | "skewed" | "bimodal" | "binary";
export const POPULATION_SHAPES: PopulationShape[] = ["normal", "skewed", "bimodal", "binary"];

/** A finite population on a 0–100 scale (binary → 0/1, π = 0.32). Known data-generating process, seeded. */
export function makePopulation(shape: PopulationShape, N: number, seed: number): number[] {
  const r = rng(seed);
  const z = gaussian(r);
  const out = new Array<number>(N);
  for (let i = 0; i < N; i++) {
    let v: number;
    if (shape === "normal") v = 50 + 12 * z();
    else if (shape === "skewed") v = 20 + 14 * Math.exp(0.55 * z());
    else if (shape === "bimodal") v = (r() < 0.55 ? 34 : 68) + 7 * z();
    else v = r() < 0.32 ? 1 : 0;
    out[i] = shape === "binary" ? v : Math.round(clamp(v, 0, 100) * 10) / 10;
  }
  return out;
}

export interface PopParams {
  N: number;
  mu: number;
  /** Population variance with divisor N. */
  sigma2: number;
  sigma: number;
}
export function popParams(pop: readonly number[]): PopParams {
  const mu = mean(pop) as number;
  const sigma2 = ssAround(pop, mu) / pop.length;
  return { N: pop.length, mu, sigma2, sigma: Math.sqrt(sigma2) };
}

/** Simple random sample without replacement (indices). */
export const srs = (N: number, n: number, rand: Rand): number[] => sampleIndices(N, n, rand);

export type SampleStatistic = "mean" | "proportion" | "median" | "var_n" | "var_n1";
export function statistic(kind: SampleStatistic, xs: readonly number[]): number | null {
  const n = xs.length;
  if (!n) return null;
  const m = mean(xs) as number;
  if (kind === "mean" || kind === "proportion") return m;
  if (kind === "median") return median(xs);
  if (kind === "var_n") return ssAround(xs, m) / n;
  if (kind === "var_n1") return n > 1 ? ssAround(xs, m) / (n - 1) : null;
  return null;
}

/** SE of the sample mean under SRSWOR: √(σ²/n · (N − n)/(N − 1)). */
export function theorySE(p: PopParams, n: number): number {
  const fpc = p.N > 1 ? (p.N - n) / (p.N - 1) : 1;
  return Math.sqrt((p.sigma2 / n) * fpc);
}

export function describe(xs: readonly number[]): { n: number; mean: number | null; sd: number | null } {
  const d = describeFull(xs);
  return { n: d.n, mean: d.mean, sd: d.sd };
}

/** Fixed-range histogram with values outside the range clamped to the end bins. */
export function histogram(xs: readonly number[], lo: number, hi: number, bins: number) {
  const counts = new Array<number>(bins).fill(0);
  const w = (hi - lo) / bins;
  for (const x of xs) {
    let b = Math.floor((x - lo) / w);
    if (b < 0) b = 0;
    if (b >= bins) b = bins - 1;
    counts[b]++;
  }
  return { counts, lo, hi, w };
}
export { histFull };

/** B bootstrap replicates of a statistic (resampling with replacement). */
export function bootstrap(xs: readonly number[], B: number, rand: Rand, kind: SampleStatistic): (number | null)[] {
  const out: (number | null)[] = [];
  const n = xs.length;
  for (let b = 0; b < B; b++) {
    const s = new Array<number>(n);
    for (let i = 0; i < n; i++) s[i] = xs[Math.floor(rand() * n)];
    out.push(statistic(kind, s));
  }
  return out;
}

export interface Draw {
  idx: number[];
  values: number[];
  stat: number | null;
  mean: number | null;
  sd: number | null;
}
/** One SRS from the population with its statistic, mean and SD. */
export function drawSample(pop: readonly number[], n: number, kind: SampleStatistic, rand: Rand): Draw {
  const idx = srs(pop.length, n, rand);
  const values = idx.map((i) => pop[i]);
  const d = describe(values);
  return { idx, values, stat: statistic(kind, values), mean: d.mean, sd: d.sd };
}

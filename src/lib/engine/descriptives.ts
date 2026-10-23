// Descriptive statistics. Undefined quantities are null (never NaN or Infinity).
import { ranks as ranksCore } from "../stats";
import { mean, ssAround, sum } from "./numeric";

export { mean, sum };

export interface Describe {
  n: number;
  mean: number | null;
  devs: number[];
  sq: number[];
  ss: number | null;
  variance: number | null;
  sd: number | null;
  /** Denominator used for the variance: n (population) or n − 1 (sample). */
  df: number | null;
}

/** Mean, deviations, squared deviations, SS, variance and SD. `population` uses n instead of n − 1. */
export function describe(xs: readonly number[], population = false): Describe {
  const n = xs.length;
  const m = mean(xs);
  if (m === null) return { n, mean: null, devs: [], sq: [], ss: null, variance: null, sd: null, df: null };
  const devs = xs.map((x) => x - m);
  const sq = devs.map((d) => d * d);
  const ss = sum(sq);
  const df = population ? n : n - 1;
  const variance = df > 0 ? ss / df : null;
  return { n, mean: m, devs, sq, ss, variance, sd: variance === null ? null : Math.sqrt(variance), df };
}

/** Sample variance (n − 1), null for n < 2. */
export const sampleVariance = (xs: readonly number[]): number | null => describe(xs).variance;
/** Sample SD (n − 1), null for n < 2. */
export const sampleSd = (xs: readonly number[]): number | null => describe(xs).sd;

/** Quantile, R type 7 (the default of R and NumPy). */
export function quantile(xs: readonly number[], p: number): number | null {
  const a = [...xs].sort((x, y) => x - y);
  const n = a.length;
  if (!n || !(p >= 0 && p <= 1)) return null;
  const h = (n - 1) * p;
  const lo = Math.floor(h);
  const hi = Math.ceil(h);
  return a[lo] + (h - lo) * (a[hi] - a[lo]);
}

export const median = (xs: readonly number[]): number | null => quantile(xs, 0.5);

export interface Skewness {
  g1: number;
  /** Adjusted Fisher–Pearson coefficient reported by SPSS and Excel. */
  G1: number;
  method: string;
}
export function skewness(xs: readonly number[]): Skewness | null {
  const n = xs.length;
  if (n < 3) return null;
  const m = mean(xs) as number;
  const m2 = ssAround(xs, m) / n;
  if (m2 === 0) return null;
  const m3 = sum(xs.map((x) => (x - m) ** 3)) / n;
  const g1 = m3 / m2 ** 1.5;
  return { g1, G1: (g1 * Math.sqrt(n * (n - 1))) / (n - 2), method: "g1 = m3/m2^1.5; G1 adjusted (SPSS/Excel)" };
}

/** Excess kurtosis g2 = m4/m2² − 3 (biased, as scipy.stats.kurtosis default). */
export function kurtosis(xs: readonly number[]): number | null {
  const n = xs.length;
  if (n < 4) return null;
  const m = mean(xs) as number;
  const m2 = ssAround(xs, m) / n;
  if (m2 === 0) return null;
  const m4 = sum(xs.map((x) => (x - m) ** 4)) / n;
  return m4 / (m2 * m2) - 3;
}

export interface FiveNumber {
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
  iqr: number;
  fenceLo: number;
  fenceHi: number;
  whiskerLo: number;
  whiskerHi: number;
  outliers: number[];
}
/** Tukey boxplot summary with type-7 quartiles and 1.5·IQR fences. */
export function fiveNumber(xs: readonly number[]): FiveNumber | null {
  if (!xs.length) return null;
  const q1 = quantile(xs, 0.25) as number;
  const q3 = quantile(xs, 0.75) as number;
  const iqr = q3 - q1;
  const lo = q1 - 1.5 * iqr;
  const hi = q3 + 1.5 * iqr;
  const inside = xs.filter((x) => x >= lo && x <= hi);
  return {
    min: Math.min(...xs),
    q1,
    median: median(xs) as number,
    q3,
    max: Math.max(...xs),
    iqr,
    fenceLo: lo,
    fenceHi: hi,
    whiskerLo: Math.min(...inside),
    whiskerHi: Math.max(...inside),
    outliers: xs.filter((x) => x < lo || x > hi),
  };
}

export interface HistogramBin {
  lo: number;
  hi: number;
  count: number;
  density: number;
}
/** Equal-width histogram; without `bins` the Freedman–Diaconis width is used (Sturges when IQR = 0). */
export function histogram(xs: readonly number[], bins?: number, lo?: number, hi?: number): { bins: HistogramBin[]; width: number } {
  const n = xs.length;
  if (!n) return { bins: [], width: 0 };
  let a = lo ?? Math.min(...xs);
  let b = hi ?? Math.max(...xs);
  if (b === a) {
    a -= 0.5;
    b += 0.5;
  }
  let k = bins;
  if (!k) {
    const iqr = (quantile(xs, 0.75) as number) - (quantile(xs, 0.25) as number);
    const w = iqr > 0 ? (2 * iqr) / Math.cbrt(n) : (b - a) / Math.ceil(Math.log2(n) + 1);
    k = Math.max(1, Math.min(60, Math.ceil((b - a) / w)));
  }
  const w = (b - a) / k;
  const counts = new Array<number>(k).fill(0);
  for (const x of xs) {
    let i = Math.floor((x - a) / w);
    if (i === k) i--;
    if (i >= 0 && i < k) counts[i]++;
  }
  return { bins: counts.map((c, i) => ({ lo: a + i * w, hi: a + (i + 1) * w, count: c, density: c / (n * w) })), width: w };
}

/** z-scores with the sample SD; null when the SD is 0 or undefined. */
export function zscores(xs: readonly number[]): number[] | null {
  const d = describe(xs);
  return d.sd ? xs.map((x) => (x - (d.mean as number)) / (d.sd as number)) : null;
}

/** Average ranks (ties share the mean rank), as scipy.stats.rankdata. */
export const ranks = (xs: readonly number[]): number[] => ranksCore([...xs]);

/** Sample covariance (n − 1). */
export function covariance(x: readonly number[], y: readonly number[]): number | null {
  const n = x.length;
  if (n < 2 || y.length !== n) return null;
  const mx = mean(x) as number;
  const my = mean(y) as number;
  let s = 0;
  for (let i = 0; i < n; i++) s += (x[i] - mx) * (y[i] - my);
  return s / (n - 1);
}

/** Keeps only finite numbers (listwise deletion for one variable). */
export const finiteOnly = (xs: readonly unknown[]): number[] => xs.filter((x): x is number => typeof x === "number" && Number.isFinite(x));
